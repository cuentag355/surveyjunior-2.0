import React, { useState, useEffect, useRef } from 'react';
import TunnelModule from './TunnelModule.jsx';
import UrlDetector from '../utils/UrlDetector.js';

const API_MP_URL = 'https://surveyjunior.us/api_mp_handler.php';

const BrowserModule = ({ profileData, onBack }) => {
  const START_PAGE = import.meta.env.DEV 
    ? 'http://localhost:5173/start.html' 
    : `file://${window.api?.appPath || ''}/start.html`;

  const [tabs, setTabs] = useState(
      (profileData.savedSession && profileData.savedSession.length > 0) 
      ? profileData.savedSession 
      : [{ id: Date.now(), url: START_PAGE, title: 'Quantum Start', loading: false }]
  );

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || null);
  const [urlInput, setUrlInput] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  
  const [activeTool, setActiveTool] = useState(null); 
  const [tunnelConfig, setTunnelConfig] = useState(null);
  
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMode, setSetupMode] = useState('os');
  const [inputUrl, setInputUrl] = useState('');
  const [inputProjekt, setInputProjekt] = useState('');
  const [mpStatus, setMpStatus] = useState('');
  const [foundSubidData, setFoundSubidData] = useState(null);
  const [showAddSubid, setShowAddSubid] = useState(false);
  const [newSubid, setNewSubid] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [showTunnelInput, setShowTunnelInput] = useState(false); 
  const [manualLink, setManualLink] = useState('');

  const [translation, setTranslation] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const webviewsRef = useRef({});
  const activeTab = tabs.find(t => t.id === activeTabId) || { url: '', title: '', loading: false };
  const isBookmarked = bookmarks.some(b => b.url === activeTab.url);

  useEffect(() => {
      const saveSession = async () => {
          if (window.electronAPI && tabs.length > 0) {
              const updatedProfile = { ...profileData, savedSession: tabs.map(t => ({ id: t.id, url: t.url, title: t.title })) };
              window.electronAPI.invoke('save-profile', updatedProfile);
          }
      };
      const timeout = setTimeout(saveSession, 1000);
      return () => clearTimeout(timeout);
  }, [tabs]);

  useEffect(() => {
    const init = async () => {
        let home = START_PAGE;
        if (window.electronAPI && !import.meta.env.DEV) {
            try {
                const path = await window.electronAPI.invoke('get-app-path');
                home = `file://${path}/dist/start.html`;
            } catch(e) {}
        }
        setTabs(prev => prev.map(t => t.url.includes('start.html') ? { ...t, url: home } : t));
        if (!activeTabId && tabs.length > 0) setActiveTabId(tabs[0].id);
    };
    init();
    if (profileData?.id) {
        const saved = localStorage.getItem(`bookmarks_${profileData.id}`);
        if (saved) setBookmarks(JSON.parse(saved));
    }
  }, []);

  const toggleBookmark = () => {
    if (!profileData?.id) return;
    const urlToSave = activeTab.url;
    if (!urlToSave || urlToSave.includes('start.html')) return;
    let newBookmarks;
    if (isBookmarked) newBookmarks = bookmarks.filter(b => b.url !== urlToSave);
    else newBookmarks = [...bookmarks, { url: urlToSave, title: activeTab.title, icon: `https://www.google.com/s2/favicons?domain=${urlToSave}` }];
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${profileData.id}`, JSON.stringify(newBookmarks));
  };

  const addTab = (url) => {
    const targetUrl = url || (tabs[0]?.url.includes('start.html') ? tabs[0].url : START_PAGE);
    const newId = Date.now();
    setTabs(prev => [...prev, { id: newId, url: targetUrl, title: 'Nueva', loading: true }]);
    setActiveTabId(newId);
    setUrlInput('');
  };

  const closeTab = (e, id) => {
    e.stopPropagation();
    if(webviewsRef.current[id]) delete webviewsRef.current[id];
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) onBack(); 
    else { setTabs(newTabs); if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id); }
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const detection = UrlDetector.detect(urlInput);
    if (detection) {
        setSetupMode(detection.type === 'meinungsplatz' ? 'mp' : 'os');
        setInputUrl(detection.data.raw || urlInput);
        if(detection.data.projektnummer) setInputProjekt(detection.data.projektnummer);
        setShowSetupModal(true);
        setUrlInput('');
        return;
    }
    let target = urlInput;
    if (!target.includes('.') && !target.includes('://')) target = `https://www.google.com/search?q=${encodeURIComponent(urlInput)}`;
    else if (!target.startsWith('http')) target = 'https://' + target;
    const wv = webviewsRef.current[activeTabId];
    if (wv) { wv.loadURL(target); setUrlInput(target); }
  };

  const handleVerifyMP = async () => {
      if (!inputProjekt.trim()) { setMpStatus('Falta Projektnummer'); return; }
      setIsApiLoading(true); setMpStatus('Consultando...'); setFoundSubidData(null); setShowAddSubid(false);
      try {
          const formData = new FormData(); formData.append('action', 'get_subid'); formData.append('projektnummer', inputProjekt);
          const req = await fetch(API_MP_URL, { method: 'POST', body: formData });
          const res = await req.json();
          if (res.success && res.found) { setFoundSubidData({ subid: res.subid, pais: res.pais_registrado }); setMpStatus(''); }
          else if (res.success && !res.found) { setMpStatus('No encontrado. Añadir:'); setShowAddSubid(true); }
          else { setMpStatus('Error: ' + res.message); }
      } catch (e) { setMpStatus('Error de Red.'); } finally { setIsApiLoading(false); }
  };

  const handleAddSubid = async () => {
      if (!newSubid.trim()) return; setIsApiLoading(true);
      try {
          const pais = profileData.geo?.country || 'Alemania';
          const formData = new FormData(); formData.append('action', 'add_subid'); formData.append('projektnummer', inputProjekt); formData.append('subid', newSubid); formData.append('pais', pais);
          const req = await fetch(API_MP_URL, { method: 'POST', body: formData });
          const res = await req.json();
          if (res.success) { launchTunnel({ type: 'meinungsplatz', url: inputUrl, projektnummer: inputProjekt, subid: newSubid }); } else { setMpStatus(res.message); }
      } catch (e) { setMpStatus('Error guardando.'); } finally { setIsApiLoading(false); }
  };

  const confirmCountry = () => launchTunnel({ type: 'meinungsplatz', url: inputUrl, projektnummer: inputProjekt, subid: foundSubidData.subid });
  const rejectCountry = () => { setFoundSubidData(null); setMpStatus('Ingresa el correcto:'); setShowAddSubid(true); };

  const launchTunnel = (config) => {
      setTunnelConfig(config);
      setActiveTool('tunnel');
      setShowSetupModal(false); setShowTunnelInput(false);
      setInputUrl(''); setInputProjekt(''); setMpStatus(''); setShowAddSubid(false); setNewSubid(''); setFoundSubidData(null); setManualLink('');
  };

  const handleWebviewMount = (el, tabId) => {
    if (!el) return;
    webviewsRef.current[tabId] = el;
    if (el.dataset.listenersAdded) return; el.dataset.listenersAdded = "true";

    el.addEventListener('did-start-loading', () => setTabs(p => p.map(t => t.id===tabId ? {...t, loading:true} : t)));
    el.addEventListener('did-stop-loading', () => {
        try {
            const url = el.getURL(); const title = el.getTitle(); const isStart = url.includes('start.html');
            setTabs(p => p.map(t => t.id===tabId ? {...t, loading:false, title: isStart?'Quantum Start':(title||'Navegando...'), url, canGoBack:el.canGoBack(), canGoForward:el.canGoForward()} : t));
            if(tabId === activeTabId) setUrlInput(isStart ? '' : url);
        } catch(e){}
    });
    el.addEventListener('did-navigate', (e) => {
        const isStart = e.url.includes('start.html');
        if(tabId === activeTabId) setUrlInput(isStart ? '' : e.url);
        setTabs(p => p.map(t => t.id===tabId ? {...t, url:e.url} : t));
    });
    el.addEventListener('new-window', (e) => addTab(e.url));
    el.addEventListener('dom-ready', () => {
        el.executeJavaScript(`document.addEventListener('selectionchange', () => { const text = window.getSelection().toString().trim(); if(text && text.length > 2) console.log('SJ_TRANSLATE:' + text); });`).catch(() => {});
    });
    el.addEventListener('console-message', async (e) => {
        if (e.message.startsWith('SJ_TRANSLATE:')) {
            const text = e.message.replace('SJ_TRANSLATE:', '');
            if (tabId === activeTabId) {
                setOriginalText(text); setIsTranslating(true);
                try {
                    const res = await window.electronAPI.invoke('translate-text', { text, targetLang: 'es' });
                    if (res.success) setTranslation(res.result); else setTranslation("Error traduciendo.");
                } catch(err) { setTranslation("..."); } finally { setIsTranslating(false); }
            }
        }
    });
  };

  if (tabs.length === 0) return <div className="h-screen bg-[#030712]"></div>;

  return (
    <>
    <div className="flex h-screen w-screen bg-[#030712] text-white overflow-hidden relative z-0">
        <div className="w-16 bg-[#0B1120] border-r border-white/10 flex flex-col items-center py-4 gap-4 z-40 shadow-2xl relative">
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white flex items-center justify-center transition-all mb-2 shadow-lg shadow-blue-900/20 group" title="Volver al Dashboard"><i className="bi bi-grid-fill text-lg group-hover:scale-110 transition-transform"></i></button>
            <div className="w-8 h-px bg-white/10"></div>
            <button onClick={() => addTab()} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all" title="Nueva Pestaña"><i className="bi bi-plus-lg text-xl"></i></button>
            <button onClick={() => { setSetupMode('os'); setShowSetupModal(true); }} className="w-10 h-10 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 flex items-center justify-center transition-all cursor-pointer group relative z-50" title="Abrir Túnel"><i className="bi bi-lightning-charge-fill text-lg"></i></button>
            <button onClick={() => addTab('https://surveyjunior.us/check/')} className="w-10 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 flex items-center justify-center transition-all" title="Scanner"><i className="bi bi-shield-check text-lg"></i></button>
            <div className="flex-1"></div>
            <button onClick={onBack} className="w-10 h-10 rounded-xl hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all" title="Cerrar Perfil"><i className="bi bi-power text-lg"></i></button>
        </div>

        <div className="flex-1 flex flex-col relative bg-white">
            <div className="h-20 bg-[#1e293b] flex flex-col shadow-md z-30">
                <div className="h-8 bg-[#0B1120] flex items-end px-2 gap-1 pt-1 overflow-x-auto custom-scrollbar-hide">
                    {tabs.map(tab => (
                        <div key={tab.id} onClick={() => { setActiveTabId(tab.id); setUrlInput(tab.url.includes('start.html')?'':tab.url); }} className={`group flex items-center gap-2 px-3 py-1 rounded-t-lg text-xs max-w-[180px] cursor-pointer border-t border-r border-l select-none ${activeTabId === tab.id ? 'bg-[#1e293b] border-[#1e293b] text-white font-bold' : 'bg-transparent border-transparent text-gray-500 hover:bg-[#1e293b]/30'}`}>
                            {tab.loading ? <i className="bi bi-arrow-repeat animate-spin text-[#30E8BF]"></i> : <img src={`https://www.google.com/s2/favicons?domain=${tab.url}`} className="w-3 h-3 opacity-70" />}
                            <span className="truncate flex-1">{tab.title}</span>
                            <button onClick={(e) => closeTab(e, tab.id)} className="hover:text-red-400 opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                    ))}
                    <button onClick={() => addTab()} className="w-6 h-6 mb-1 rounded hover:bg-white/10 text-gray-400 flex items-center justify-center transition-colors" title="Nueva Pestaña"><i className="bi bi-plus-lg"></i></button>
                </div>

                <div className="flex-1 flex items-center px-4 gap-3">
                    <div className="flex gap-1 text-gray-300">
                        <button onClick={() => webviewsRef.current[activeTabId]?.goBack()} disabled={!activeTab.canGoBack} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"><i className="bi bi-arrow-left"></i></button>
                        <button onClick={() => webviewsRef.current[activeTabId]?.goForward()} disabled={!activeTab.canGoForward} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"><i className="bi bi-arrow-right"></i></button>
                        <button onClick={() => webviewsRef.current[activeTabId]?.reload()} className="p-1.5 hover:bg-white/10 rounded"><i className="bi bi-arrow-clockwise"></i></button>
                    </div>
                    <form onSubmit={handleNavigate} className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{activeTab.url?.includes('start.html') ? <i className="bi bi-search"></i> : <i className="bi bi-lock-fill text-[#30E8BF]"></i>}</div>
                        <input className="w-full bg-[#0B1120] border border-white/10 rounded-full py-1.5 pl-9 pr-10 text-xs text-white outline-none focus:border-[#30E8BF] transition-all font-mono" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onFocus={(e) => e.target.select()} placeholder="Buscar o escribir URL" />
                        {!activeTab.url?.includes('start.html') && (
                            <button type="button" onClick={toggleBookmark} className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-colors ${isBookmarked ? 'text-yellow-400' : 'text-gray-600 hover:text-white'}`}><i className={`bi bi-star${isBookmarked ? '-fill' : ''}`}></i></button>
                        )}
                    </form>
                </div>
            </div>

            <div className="h-9 bg-[#1e293b] border-b border-white/5 flex items-center px-4 gap-2 overflow-x-auto min-h-[36px]">
                {bookmarks.length === 0 && <span className="text-[10px] text-gray-600 italic select-none"><i className="bi bi-star mr-1"></i> Tus marcadores aparecerán aquí...</span>}
                {bookmarks.map((b, i) => (
                    <div key={i} onClick={() => {webviewsRef.current[activeTabId]?.loadURL(b.url)}} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1.5 rounded-md cursor-pointer max-w-[150px] transition-colors border border-transparent hover:border-white/10">
                        <img src={b.icon} className="w-3 h-3" onError={(e)=>e.target.src=''} />
                        <span className="truncate font-medium">{b.title}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 relative">
                {tabs.map(tab => (
                    <div key={tab.id} className="w-full h-full" style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
                        <webview ref={(el) => handleWebviewMount(el, tab.id)} src={tab.url} className="w-full h-full" partition={profileData?.partition} allowpopups="true" useragent={profileData?.userAgent}></webview>
                    </div>
                ))}
            </div>
            
            {activeTool === 'tunnel' && <div className="absolute inset-0 z-40 bg-[#0B1120]"><TunnelModule config={tunnelConfig} partition={profileData?.partition} userAgent={profileData?.userAgent} onBack={() => { setActiveTool(null); setTunnelConfig(null); }} /></div>}

            {translation && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl bg-black/90 backdrop-blur-md border border-sj-green/30 p-4 rounded-xl shadow-2xl z-[200] animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-start mb-2"><div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider"><i className="bi bi-translate text-sj-green mr-2"></i> TRADUCTOR QUANTUM</div><button onClick={() => setTranslation('')} className="text-gray-500 hover:text-white"><i className="bi bi-x-lg"></i></button></div>
                    <div className="grid grid-cols-2 gap-4"><div className="border-r border-white/10 pr-4"><p className="text-xs text-gray-500 mb-1">Original:</p><p className="text-sm text-gray-300 italic line-clamp-3">"{originalText}"</p></div><div><p className="text-xs text-sj-green mb-1">Español:</p><p className="text-sm text-white font-medium">{isTranslating ? <span className="animate-pulse">Desencriptando idioma...</span> : translation}</p></div></div>
                </div>
            )}
        </div>
    </div>

    {showSetupModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md relative">
                <button onClick={() => setShowSetupModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><i className="bi bi-x-lg"></i></button>
                <h2 className="text-xl font-bold text-white mb-4">Configurar Túnel</h2>
                <div className="flex bg-black/40 rounded-lg p-1 mb-4">
                    <button onClick={() => setSetupMode('os')} className={`flex-1 py-2 rounded text-xs font-bold ${setupMode==='os' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>OPENSURVEY</button>
                    <button onClick={() => setSetupMode('mp')} className={`flex-1 py-2 rounded text-xs font-bold ${setupMode==='mp' ? 'bg-pink-600 text-white' : 'text-gray-500'}`}>MEINUNGSPLATZ</button>
                </div>
                <div className="space-y-3">
                    <div><label className="text-[10px] text-gray-500 font-bold uppercase">Enlace Encuesta</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white outline-none font-mono" placeholder="https://..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} /></div>
                    {setupMode === 'mp' && (
                        <>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase">Projektnummer</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white outline-none focus:border-pink-500 font-mono" placeholder="Ej: 123456" value={inputProjekt} onChange={(e) => setInputProjekt(e.target.value)} /></div>
                            {foundSubidData && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg animate-in zoom-in">
                                    <p className="text-yellow-400 text-xs mb-3 font-bold flex items-center gap-2"><i className="bi bi-exclamation-triangle"></i> VERIFICACIÓN</p>
                                    <p className="text-gray-300 text-xs mb-3">El SubID registrado pertenece a: <span className="text-white font-bold underline">{foundSubidData.pais}</span>. ¿Deseas usarlo?</p>
                                    <div className="flex gap-2"><button onClick={confirmCountry} className="flex-1 bg-green-600 text-white py-2 rounded text-xs font-bold">SÍ, USAR</button><button onClick={rejectCountry} className="flex-1 bg-gray-700 text-white py-2 rounded text-xs font-bold">NO (NUEVO)</button></div>
                                </div>
                            )}
                            {mpStatus && !foundSubidData && (
                                <div className={`p-3 rounded-lg text-xs ${mpStatus.includes('Error') || mpStatus.includes('No') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {mpStatus}
                                    {showAddSubid && (
                                        <div className="flex gap-2 mt-2"><input className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white" placeholder="Nuevo SubID" value={newSubid} onChange={(e) => setNewSubid(e.target.value)} /><button onClick={handleAddSubid} className="bg-green-600 text-white px-3 rounded font-bold">GUARDAR</button></div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="mt-6">
                    {!foundSubidData && (
                        <button onClick={setupMode === 'mp' ? handleVerifyMP : () => launchTunnel({ type: 'opensurvey', url: inputUrl })} disabled={isApiLoading} className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg text-white flex items-center justify-center gap-2 ${setupMode==='mp' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-purple-600 hover:bg-purple-500'}`}>
                            {isApiLoading ? 'CONSULTANDO...' : (setupMode==='mp' ? 'VERIFICAR EN BASE DE DATOS' : 'INICIAR TÚNEL')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )}
    
    {showTunnelInput && !showSetupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg">
                <h3 className="text-lg font-bold text-white mb-4">Iniciar Túnel Seguro</h3>
                <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 outline-none font-mono" placeholder="Pega el enlace..." value={manualLink} onChange={(e) => setManualLink(e.target.value)} autoFocus onKeyDown={(e) => { if(e.key === 'Enter') launchTunnel({url: manualLink}); }} />
                <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowTunnelInput(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={() => launchTunnel({url: manualLink})} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs">LANZAR</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default BrowserModule;