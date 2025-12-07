// electron/cookieFarmer.js
import { BrowserWindow } from 'electron';

// LISTAS DE OBJETIVOS (Sitios seguros para generar cookies de publicidad)
const SITE_MAP = {
    'DE': ['https://www.bild.de', 'https://www.spiegel.de', 'https://www.amazon.de', 'https://www.ebay.de', 'https://www.chip.de'],
    'AT': ['https://www.krone.at', 'https://www.orf.at', 'https://www.willhaben.at', 'https://www.amazon.de'],
    'CH': ['https://www.20min.ch', 'https://www.blick.ch', 'https://www.ricardo.ch'],
    'US': ['https://www.cnn.com', 'https://www.amazon.com', 'https://www.nytimes.com', 'https://www.bestbuy.com'],
    'ES': ['https://www.marca.com', 'https://www.elmundo.es', 'https://www.amazon.es'],
    'GLOBAL': ['https://www.google.com', 'https://www.wikipedia.org', 'https://www.youtube.com']
};

export async function startFarming(profile, geoConfig, senderWindow) {
    const country = geoConfig.countryCode || 'DE';
    const targets = SITE_MAP[country] || SITE_MAP['GLOBAL'];
    
    // Seleccionar 4 sitios aleatorios
    const selectedSites = targets.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    senderWindow.webContents.send('farm-log', { status: 'start', total: selectedSites.length, country });

    // Ventana oculta (show: false)
    let farmerWin = new BrowserWindow({
        width: 1024, height: 768, show: false,
        webPreferences: {
            partition: `persist:profile_${profile.id}`, // Vital: Usa la sesión del perfil
            images: true
        }
    });

    const ses = farmerWin.webContents.session;
    // Configurar identidad
    ses.setUserAgent(geoConfig.userAgent || profile.userAgent);

    for (let i = 0; i < selectedSites.length; i++) {
        const url = selectedSites[i];
        try {
            senderWindow.webContents.send('farm-log', { status: 'visiting', url: url });
            
            await farmerWin.loadURL(url, { timeout: 20000 });
            
            // Simular lectura (Scroll)
            await farmerWin.webContents.executeJavaScript(`
                new Promise((resolve) => {
                    let distance = 100;
                    let timer = setInterval(() => {
                        window.scrollBy(0, 100);
                        if(window.scrollY >= document.body.scrollHeight/3) { clearInterval(timer); resolve(); }
                    }, 200);
                });
            `);
            
            // Pausa humana (2-4 segundos)
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

        } catch (e) {
            // Ignorar errores de carga y seguir
        }
    }

    senderWindow.webContents.send('farm-log', { status: 'done' });
    farmerWin.close();
}