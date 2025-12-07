import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import { createRequire } from 'module';
import axios from 'axios'; 
import fs from 'fs';
import FormData from 'form-data'; 

const require = createRequire(import.meta.url);
const ProxyChain = require('proxy-chain');
const { HttpsProxyAgent } = require('https-proxy-agent');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store({ name: 'quantum_db', encryptionKey: 'sj_quantum_v5_key' });
const API_URL = 'https://surveyjunior.us';

// FLAGS ESTABLES (Sin host-rules que rompen el túnel)
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-http2');
app.commandLine.appendSwitch('disable-quic');
app.commandLine.appendSwitch('wm-window-animations-disabled'); 
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp'); 
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns'); 

let activeSessions = new Map(); 
let mainWindow;
let stealthSource = '';

try {
    const stealthPath = path.join(__dirname, 'stealth.js');
    if (fs.existsSync(stealthPath)) stealthSource = fs.readFileSync(stealthPath, 'utf8');
} catch (e) {}

const AD_BLOCK_LIST = ['pubmatic.com', 'ybp.yahoo.com', 'adnxs.com', 'doubleclick.net', 'googlesyndication.com', 'hotjar.com', 'matomo.js', 'sentry.io'];

function getSmartLocale(countryCode) {
    if (!countryCode) return { locale: 'en-US', lang: ['en-US', 'en'], tz: 'America/New_York' };
    const code = countryCode.toUpperCase();
    const map = {
        'DE': { l: 'de-DE', langs: ['de-DE', 'de', 'en-US'], tz: 'Europe/Berlin' },
        'AT': { l: 'de-AT', langs: ['de-AT', 'de', 'en-US'], tz: 'Europe/Vienna' },
        'CH': { l: 'de-CH', langs: ['de-CH', 'de', 'fr-CH', 'en-US'], tz: 'Europe/Zurich' },
        'ES': { l: 'es-ES', langs: ['es-ES', 'es', 'en-US'], tz: 'Europe/Madrid' },
        'GB': { l: 'en-GB', langs: ['en-GB', 'en', 'en-US'], tz: 'Europe/London' },
        'US': { l: 'en-US', langs: ['en-US', 'en'], tz: 'America/New_York' },
        'MX': { l: 'es-MX', langs: ['es-MX', 'es', 'en-US'], tz: 'America/Mexico_City' },
        'VE': { l: 'es-VE', langs: ['es-VE', 'es', 'en-US'], tz: 'America/Caracas' },
        'BR': { l: 'pt-BR', langs: ['pt-BR', 'pt', 'en-US'], tz: 'America/Sao_Paulo' }
    };
    return map[code] || { l: 'en-US', langs: ['en-US', 'en'], tz: 'America/New_York' }; 
}

async function checkProxyInternal(c) {
    let url = c.user 
        ? `${c.type}://${encodeURIComponent(c.user)}:${encodeURIComponent(c.pass)}@${c.host}:${c.port}`
        : `${c.type}://${c.host}:${c.port}`;

    let localProxy = null;
    try {
        localProxy = await ProxyChain.anonymizeProxy(url);
        const agent = new HttpsProxyAgent(localProxy);
        const res = await axios.get('http://ip-api.com/json', { httpAgent: agent, httpsAgent: agent, timeout: 10000 });
        setTimeout(() => ProxyChain.closeAnonymizedProxy(localProxy, true).catch(()=>{}), 5000); // Cerrar después
        if (res.data && res.data.query) {
            return { success: true, ip: res.data.query, countryCode: res.data.countryCode, timezone: res.data.timezone };
        }
        return { success: false, error: 'No data' };
    } catch (e) {
        if(localProxy) ProxyChain.closeAnonymizedProxy(localProxy, true).catch(()=>{});
        return { success: false, error: e.message };
    }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 900, minWidth: 1024, minHeight: 768,
    title: "SurveyJunior Quantum V39 (Universal Stable)",
    backgroundColor: '#F8FAFC',
    frame: false, show: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webviewTag: true, sandbox: false,
      webSecurity: true, allowRunningInsecureContent: true
    }
  });
  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distPath = path.join(__dirname, '../dist/index.html');
  if (isDev || !fs.existsSync(distPath)) mainWindow.loadURL('http://localhost:5173');
  else mainWindow.loadFile(distPath);
  
  ipcMain.on('open-external', (e, url) => shell.openExternal(url));
}

app.on('web-contents-created', (event, contents) => {
    contents.session.setPermissionCheckHandler(() => false);
    if (contents.getType() === 'webview') {
        contents.on('did-attach-webview', async () => {
            let geoData = null;
            const currentPath = contents.session.getStoragePath() || '';
            for (const [key, val] of activeSessions.entries()) {
                if (currentPath.includes(key.replace('persist:', ''))) {
                    geoData = val; break;
                }
            }
            if (geoData) {
                try {
                    const seed = geoData.seed || 12345;
                    const injection = stealthSource.replace('window.__TJ_CONFIG', `JSON.parse('${JSON.stringify({ ...geoData, seed })}')`);
                    await contents.executeJavaScript(injection);
                    try {
                        if (!contents.debugger.isAttached()) contents.debugger.attach('1.3');
                        await contents.debugger.sendCommand('Emulation.setTimezoneOverride', { timezoneId: geoData.timezone });
                        await contents.debugger.sendCommand('Emulation.setUserAgentOverride', { userAgent: geoData.userAgent, acceptLanguage: geoData.lang.join(','), platform: 'Win32' });
                    } catch (err) {}
                } catch (e) {}
            }
        });
        contents.setWindowOpenHandler(({ url }) => ({ action: 'allow', overrideBrowserWindowOptions: { parent: mainWindow, frame: true, autoHideMenuBar: true } }));
    }
});

// --- LANZAMIENTO (UNIVERSAL TUNNEL) ---
ipcMain.on('launch-profile', async (event, profile) => {
    try {
        const partition = `persist:profile_${profile.id}`;
        const ses = session.fromPartition(partition);
        await ses.clearCache(); 

        let finalConfig = { timezone: 'Europe/Berlin', locale: 'en-US', lang: ['en-US', 'en'], country: 'Germany' };

        if (profile.proxyString && profile.proxyString.includes(':')) {
            const p = profile.proxyString.split(':');
            const config = {
                type: profile.proxyType || 'http',
                host: p[0], port: p[1],
                user: p.length === 4 ? p[2] : '',
                pass: p.length === 4 ? p[3] : ''
            };

            // Detección
            try {
                const liveData = await checkProxyInternal(config);
                if (liveData.success) {
                    const smartLocale = getSmartLocale(liveData.countryCode);
                    finalConfig = { timezone: liveData.timezone, locale: smartLocale.l, lang: smartLocale.langs, country: liveData.countryCode };
                }
            } catch(e) {}

            // UNIVERSAL TUNNEL (Arregla ERR_TUNNEL y SOCKS5)
            // Creamos un servidor local para TODO, así Electron no se confunde
            let upstream = config.user 
                ? `${config.type}://${encodeURIComponent(config.user)}:${encodeURIComponent(config.pass)}@${config.host}:${config.port}`
                : `${config.type}://${config.host}:${config.port}`;

            const localProxy = await ProxyChain.anonymizeProxy(upstream);
            // "<-loopback>" permite conectar al proxy local 127.0.0.1
            await ses.setProxy({ proxyRules: localProxy, proxyBypassRules: "<-loopback>" });

        } else {
            await ses.setProxy({ mode: 'direct' });
        }

        const userAgent = profile.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        ses.setUserAgent(userAgent);
        setupNetworkInterceptors(ses, finalConfig); // Inyectar headers

        const seed = profile.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
        activeSessions.set(partition, { ...finalConfig, userAgent, seed, hardware: profile.hardware || { memory: 8, concurrency: 4 } });

        event.reply('profile-ready-to-launch', { ...profile, partition, ...finalConfig });

    } catch (error) {
        event.reply('launch-error', error.message);
    }
});

// INTERCEPTOR RED
function setupNetworkInterceptors(session, localeData) {
    const filter = { urls: ['<all_urls>'] };
    session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        details.requestHeaders['Accept-Language'] = localeData.lang.join(','); 
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
    session.webRequest.onBeforeRequest(filter, (details, callback) => {
        if (AD_BLOCK_LIST.some(d => details.url.includes(d))) return callback({ cancel: true });
        // Sniffer logic (omitida por brevedad, igual que antes)
        callback({});
    });
}

// HANDLERS (Iguales)
ipcMain.handle('api-login', async (e,c) => { try { const r = await axios.post(`${API_URL}/api_login.php`, c); return r.data?.success ? {success:true, user:r.data.user, token:r.data.token} : {success:false, error:r.data?.message}; } catch(err) { return {success:false}; } });
ipcMain.handle('api-register', async (e, d) => { try { const r = await axios.post(`${API_URL}/register.php`, d); return r.data; } catch (err) { return {success:false, message:err.message}; } });
ipcMain.handle('get-profiles', () => store.get('profiles', []));
ipcMain.handle('save-profile', (e, p) => { const ps = store.get('profiles', []) || []; const i = ps.findIndex(x => x.id === p.id); if(i!==-1) ps[i]=p; else ps.push(p); store.set('profiles', ps); return {success:true}; });
ipcMain.handle('delete-profile', (e, id) => { store.set('profiles', store.get('profiles', []).filter(x => x.id !== id)); return {success:true}; });
ipcMain.handle('get-proxies', () => store.get('proxies', []));
ipcMain.handle('save-proxy-list', (e, l) => { store.set('proxies', l); return {success:true}; });
ipcMain.handle('get-public-ip', async () => { try { const r = await axios.get('https://api.ipify.org?format=json', {timeout:5000}); return {success:true, ip:r.data.ip}; } catch(e){ return {success:false, error:'N/A'}; } });
ipcMain.handle('admin-get-stats', async (e, t) => { try{const r=await axios.get(`${API_URL}/api_admin_stats.php?token=${t}`);return r.data;}catch(e){return{success:false,message:e.message};} });
ipcMain.handle('admin-action', async (e, d) => { try{const f=new FormData();Object.keys(d).forEach(k=>f.append(k,d[k]));const r=await axios.post(`${API_URL}/api_admin_core.php`,f,{headers:f.getHeaders()});return r.data;}catch(e){return{success:false,message:e.message};} });
ipcMain.handle('account-update', async (e, { action, token, data, filePath }) => { try { const f = new FormData(); f.append('action', action); f.append('token', token); if(data) Object.keys(data).forEach(k => f.append(k, data[k])); if(filePath) f.append(action === 'upload_avatar' ? 'avatar' : 'proof', fs.createReadStream(filePath)); const r = await axios.post(`${API_URL}/api_account.php`, f, { headers: f.getHeaders() }); return r.data; } catch(err) { return { success: false, message: err.message }; } });
ipcMain.handle('test-proxy-connection', async (e, c) => { const res = await checkProxyInternal(c); return res.success ? { status:'success', ...res } : { status:'fail', message: res.error }; });
ipcMain.on('start-cookie-farming', async (e, id) => { const ps=store.get('profiles',[]); const p=ps.find(x=>x.id===id); if(p) startFarming(p, {countryCode:p.geo?.countryCode||'DE',userAgent:p.userAgent}, BrowserWindow.fromWebContents(e.sender)); });
ipcMain.on('window-control', (e,a) => { if(mainWindow) a==='close'?mainWindow.close():a==='minimize'?mainWindow.minimize():mainWindow.maximize(); });
app.whenReady().then(createWindow);