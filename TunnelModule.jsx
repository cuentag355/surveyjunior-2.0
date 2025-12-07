import React, { useState, useRef, useEffect } from 'react';

// PROPS: config trae { type: 'meinungsplatz'|'opensurvey', url: '...', projektnummer: '...', subid: '...' }
const TunnelModule = ({ config, onBack, onComplete, partition, userAgent }) => {
  const initialUrl = config?.url || 'about:blank';
  const [phase, setPhase] = useState('loading'); // loading -> manual -> timer -> done
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');

  // --- MEMORIA DUAL (EL CEREBRO) ---
  const [mpCapturedId, setMpCapturedId] = useState(null); // Para Meinungsplatz (15 dígitos)
  const [osData, setOsData] = useState(null);             // Para OpenSurvey { account, project, uuid }

  const webviewRef = useRef(null);

  // --- 1. PARSER INTELIGENTE OPENSURVEY ---
  const parseOpenSurveyParams = (urlStr) => {
      try {
          const urlObj = new URL(urlStr);
          const params = new URLSearchParams(urlObj.search);
          const account = params.get('account');
          const project = params.get('project');
          const uuid = params.get('uuid') || params.get('uid');
          if (account && project) return { account, project, uuid };
      } catch (e) {
          // Fallback Regex (si la URL es del tipo /survey/123/456)
          const accMatch = urlStr.match(/account=(\d+)/);
          const projMatch = urlStr.match(/project=(\d+)/);
          const uuidMatch = urlStr.match(/uuid=([a-f0-9-]+)/);
          if (accMatch && projMatch) return { account: accMatch[1], project: projMatch[1], uuid: uuidMatch ? uuidMatch[1] : null };
      }
      return null;
  };

  // --- 2. CONSTRUCTOR DE JUMPER (SISTEMA DUAL) ---
  const constructJumperURL = () => {
    try {
        // A. CASO MEINUNGSPLATZ
        if (config?.type === 'meinungsplatz') {
            const p = config.projektnummer;
            const s = config.subid;
            
            // Buscar ID (m) en memoria o en URL actual
            let m = mpCapturedId; 
            if (!m && webviewRef.current) {
                const url = webviewRef.current.getURL();
                const match = url.match(/(?<!\d)(\d{15})(?!\d)/);
                if (match && !match[1].startsWith('17')) m = match[1];
            }

            if (p && s && m) {
                const url = `https://survey.maximiles.com/complete?p=${p}_${s}&m=${m}`;
                console.log("🚀 Jumper MP Generado:", url);
                return url;
            } else {
                console.warn(`⚠️ Faltan datos MP. P:${p} S:${s} M:${m}`);
            }
        }

        // B. CASO OPENSURVEY
        else {
            // 1. Usar datos memorizados (prioridad)
            if (osData) {
                 const { account, project, uuid } = osData;
                 const finalUuid = uuid || '00000000-0000-0000-0000-000000000000';
                 const url = `https://www.opensurvey.com/survey/${account}/${project}?statusBack=1&respBack=${finalUuid}`;
                 console.log("🚀 Jumper OS (Memoria):", url);
                 return url;
            }

            // 2. Usar URL actual (si no se memorizó nada)
            const curr = webviewRef.current ? webviewRef.current.getURL() : currentUrl;
            
            // Intentar Query Params
            const parsed = parseOpenSurveyParams(curr);
            if(parsed) {
                 const finalUuid = parsed.uuid || '00000000-0000-0000-0000-000000000000';
                 return `https://www.opensurvey.com/survey/${parsed.account}/${parsed.project}?statusBack=1&respBack=${finalUuid}`;
            }

            // Intentar Regex Path
            const osRegex = /(\d{5,20})[\/|=](\d{5,20})[\/|=]?([0-9a-fA-F-]{30,})?/;
            const osMatch = curr.match(osRegex);
            if (osMatch) {
                const uuid = osMatch[3] || '00000000-0000-0000-0000-000000000000';
                return `https://www.opensurvey.com/survey/${osMatch[1]}/${osMatch[2]}?statusBack=1&respBack=${uuid}`;
            }
        }

    } catch (e) { console.error("Jumper Error:", e); }
    
    // C. FALLBACK DE FUERZA BRUTA (Último recurso)
    const separator = currentUrl.includes('?') ? '&' : '?';
    return `${currentUrl}${separator}status=1&statusBack=1&success=true`;
  };

  // --- 3. ESCÁNER DE TRÁFICO (SNIFFER) ---
  const scanUrl = (url) => {
      // MEINUNGSPLATZ
      if (config?.type === 'meinungsplatz') {
          const match = url.match(/(?<!\d)(\d{15})(?!\d)/);
          if (match && !match[1].startsWith('17')) {
              console.log("💎 ID MP Capturado en URL:", match[1]);
              setMpCapturedId(match[1]);
          }
      }
      // OPENSURVEY
      else {
          if (!osData) { 
              const data = parseOpenSurveyParams(url);
              if (data) {
                  console.log("✅ Datos OS Capturados:", data);
                  setOsData(data);
              }
          }
      }
  };

  const checkSuccess = (url) => {
    const lower = url.toLowerCase();
    if (lower.match(/(success|complete|thank|finished|reward|terminate|status=1|statusback=1)/)) {
      handleVisualComplete();
    }
  };

  // --- EVENTOS ---
  useEffect(() => {
    // Escaneo inicial inmediato
    scanUrl(initialUrl);

    // Escuchar al Main Process (Lo que ve el backend oculto)
    const removeListener = window.electronAPI?.onNetworkSniff((data) => {
        if (config?.type === 'meinungsplatz' && data.type === 'MP_ID') {
            console.log("💎 ID MP (IPC):", data.id);
            setMpCapturedId(data.id);
        }
        if (data.type === 'OS_LINK') {
            scanUrl(data.url); // Intentar extraer params del link detectado
        }
    });

    return () => { if(removeListener && typeof removeListener === 'function') removeListener(); };
  }, [config]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const startLoad = () => { if (phase === 'loading') setPhase('loading'); };
    const stopLoad = () => { if (phase === 'loading') setPhase('manual'); };

    const handleNavigate = (e) => {
      setCurrentUrl(e.url);
      scanUrl(e.url); // <--- Escanear siempre
      checkSuccess(e.url);
    };

    const handleNewWindow = (e) => {
        if (e.url) {
            wv.loadURL(e.url);
            scanUrl(e.url);
            checkSuccess(e.url); 
        }
    };

    const handleReady = () => { if(phase === 'loading') setPhase('manual'); };

    wv.addEventListener('did-start-loading', startLoad);
    wv.addEventListener('did-stop-loading', stopLoad);
    wv.addEventListener('did-navigate', handleNavigate);
    wv.addEventListener('new-window', handleNewWindow); 
    wv.addEventListener('dom-ready', handleReady);
    wv.addEventListener('did-fail-load', handleReady);

    return () => {
      wv.removeEventListener('did-start-loading', startLoad);
      wv.removeEventListener('did-stop-loading', stopLoad);
      wv.removeEventListener('did-navigate', handleNavigate);
      wv.removeEventListener('new-window', handleNewWindow);
      wv.removeEventListener('dom-ready', handleReady);
      wv.removeEventListener('did-fail-load', handleReady);
    };
  }, [phase]);

  // TIMER
  useEffect(() => {
    if (phase === 'timer' && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (phase === 'timer' && timeLeft === 0) {
      executeJumperAndComplete(); 
    }
  }, [phase, timeLeft]);

  const openTimeModal = () => setShowTimeInput(true);
  const startTimer = () => {
      const mins = parseInt(customMinutes) || 10;
      const seconds = (mins * 60) + Math.floor(Math.random() * 45); 
      setTimeLeft(seconds);
      setShowTimeInput(false);
      setPhase('timer');
  };

  // --- EJECUCIÓN DEL JUMPER ---
  const executeJumperAndComplete = () => {
      const jumperUrl = constructJumperURL();
      
      if (jumperUrl && webviewRef.current) {
          const referer = webviewRef.current.getURL();
          console.log("⚡ EJECUTANDO JUMPER FINAL:", jumperUrl);
          
          webviewRef.current.stop();
          setTimeout(() => {
             webviewRef.current.loadURL(jumperUrl, { httpReferrer: referer });
          }, 100);
      }
      handleVisualComplete();
  };

  const handleVisualComplete = () => { if (phase !== 'done') setPhase('done'); };
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="flex flex-col h-full w-full bg-[#0B1120] relative border-l border-white/10 animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className={`h-14 flex items-center justify-between px-4 z-50 shadow-lg backdrop-blur-md border-b transition-colors duration-500 ${phase === 'done' ? 'bg-green-900/30 border-green-500/50' : 'bg-purple-900/30 border-purple-500/30'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider shrink-0 ${phase === 'done' ? 'text-green-400' : 'text-purple-400'}`}>
             <i className={`bi ${phase === 'done' ? 'bi-check-circle-fill' : 'bi-lightning-charge-fill'}`}></i> 
             {phase === 'done' ? 'JUMPER EJECUTADO' : 'QUANTUM TUNNEL'}
          </div>
          <span className="text-[10px] font-mono text-gray-500 truncate opacity-50 max-w-[300px]" title={currentUrl}>{currentUrl}</span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
           <span className={`text-[10px] font-bold px-2 py-1 rounded ${phase === 'done' ? 'bg-green-500 text-black shadow-lg shadow-green-500/50' : phase === 'timer' ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
             {phase === 'manual' ? 'ESPERA MANUAL' : phase === 'timer' ? 'HUMANIZANDO...' : phase === 'loading' ? 'CARGANDO...' : '¡EXITOSO!'}
           </span>
           <div className="h-6 w-px bg-white/10 mx-1"></div>
           <button onClick={onBack} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors" title="Cerrar"><i className="bi bi-x-lg text-sm"></i></button>
        </div>
      </div>

      {/* WEBVIEW */}
      <div className="flex-1 relative bg-white">
        <webview
          ref={webviewRef}
          src={initialUrl}
          className="w-full h-full"
          useragent={userAgent} 
          partition={partition} 
          allowpopups="true"
          webpreferences="nativeWindowOpen=yes, contextIsolation=yes, javascript=yes, enableRemoteModule=no"
        ></webview>

        {/* BOTÓN ACTIVAR (Derecha - Z-Index alto) */}
        {phase === 'manual' && !showTimeInput && (
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[9999] flex flex-col gap-4">
              <button onClick={openTimeModal} className="bg-purple-600/90 hover:bg-purple-500 backdrop-blur-md text-white w-14 h-36 rounded-2xl font-bold shadow-2xl hover:scale-110 transition-all flex flex-col items-center justify-center gap-3 border-2 border-white/20 animate-in slide-in-from-right-10 group cursor-pointer">
                <i className="bi bi-stopwatch-fill text-2xl group-hover:scale-125 transition-transform"></i>
                <span className="text-[10px] font-mono tracking-widest font-black" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>ACTIVAR</span>
              </button>
            </div>
        )}

        {/* BARRA ÉXITO (Visible arriba) */}
        {phase === 'done' && (
            <div className="absolute top-20 left-6 right-6 bg-[#0B1120]/95 border border-green-500/50 p-4 rounded-2xl z-[120] backdrop-blur-xl flex items-center justify-between animate-in slide-in-from-top duration-500 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce"><i className="bi bi-trophy-fill text-2xl text-black"></i></div>
                    <div>
                        <h3 className="text-lg font-bold text-white">
                             {config?.type === 'meinungsplatz' ? 'Jumper MP Ejecutado' : 'Jumper OS Ejecutado'}
                        </h3>
                        <p className="text-green-400 text-[10px] font-mono">
                            {config?.type === 'meinungsplatz' 
                                ? `ID Capturado: ${mpCapturedId || '...'}`
                                : `Datos OS: ${osData ? 'Memorizados' : 'Buscando...'}`
                            }
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setPhase('manual')} className="px-4 py-2 text-gray-300 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Ver Página</button>
                    <button onClick={() => { if(onComplete) onComplete(); onBack(); }} className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-black text-xs rounded-lg hover:scale-105 transition-transform flex items-center gap-2"><i className="bi bi-box-arrow-left"></i> SALIR</button>
                </div>
            </div>
        )}

        {/* TIMER */}
        {phase === 'timer' && (
           <div className="absolute inset-0 z-[90] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
              <div className="text-center animate-in zoom-in duration-500">
                <div className="relative inline-block mb-4"><i className="bi bi-hourglass-split text-6xl text-purple-500 animate-spin-slow opacity-80"></i></div>
                <h2 className="text-2xl font-bold tracking-widest mb-2 text-purple-100">SIMULANDO...</h2>
                <div className="text-[8rem] font-mono font-bold text-white mb-8 tabular-nums leading-none">{formatTime(timeLeft)}</div>
                <button onClick={executeJumperAndComplete} className="mt-12 px-4 py-2 rounded-lg border border-red-500/20 text-xs text-red-400/60 hover:text-red-400 transition-all">FORZAR JUMPER AHORA</button>
              </div>
           </div>
        )}
      </div>

      {/* MODAL INPUT */}
      {showTimeInput && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-[#0f172a] p-6 rounded-2xl border border-purple-500/30 shadow-2xl w-72 text-center relative">
                  <h3 className="text-white font-bold mb-4 text-lg">Tiempo de Espera</h3>
                  <div className="flex items-center justify-center gap-3 mb-6">
                      <input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} className="w-24 bg-black/50 border border-white/20 rounded-xl p-4 text-center text-4xl font-mono text-white focus:border-purple-500 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && startTimer()} />
                      <span className="text-gray-500 font-bold text-sm mt-4">MIN</span>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowTimeInput(false)} className="flex-1 py-3 text-xs font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl">Cancelar</button>
                      <button onClick={startTimer} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg">GO</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TunnelModule;