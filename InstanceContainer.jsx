import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TunnelModule from './TunnelModule.jsx';

const InstanceContainer = () => {
  const { id } = useParams();
  const [tunnelUrl, setTunnelUrl] = useState(null);
  const [loadError, setLoadError] = useState(null); // Estado para errores de carga
  const webviewRef = useRef(null);
  
  // Página de inicio limpia tipo Chrome
  const [urlBar, setUrlBar] = useState('https://google.com'); 

  useEffect(() => {
    // 1. Escuchar evento de túnel (IPC)
    if (window.instanceAPI) {
        window.instanceAPI.onTriggerTunnel((url) => {
            console.log("⚡ INICIANDO SECUENCIA TÚNEL:", url);
            setTunnelUrl(url);
        });
    }

    // 2. Manejo de Errores del Webview (Proxy fallido, Sin internet)
    const wv = webviewRef.current;
    if (wv) {
        const onFailLoad = (e) => {
            // Ignoramos errores de cancelación (-3) que ocurren al redirigir
            if (e.errorCode !== -3) {
                console.error("Webview Error:", e);
                setLoadError({
                    code: e.errorCode,
                    desc: e.errorDescription,
                    url: e.validatedURL
                });
            }
        };
        
        const onDidStartLoading = () => setLoadError(null); // Limpiar error al reintentar

        wv.addEventListener('did-fail-load', onFailLoad);
        wv.addEventListener('did-start-loading', onDidStartLoading);

        return () => {
            wv.removeEventListener('did-fail-load', onFailLoad);
            wv.removeEventListener('did-start-loading', onDidStartLoading);
        };
    }
  }, []);

  const handleNavigate = (e) => {
      e.preventDefault();
      if(webviewRef.current) {
          let target = urlBar;
          if(!target.startsWith('http')) target = 'https://' + target;
          webviewRef.current.loadURL(target);
      }
  };

  const handleReload = () => {
      if(webviewRef.current) webviewRef.current.reload();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#030712] overflow-hidden">
        
      {/* BARRA DE NAVEGACIÓN */}
      <div className="h-10 bg-[#0f172a] border-b border-white/10 flex items-center px-2 gap-2">
          <button onClick={() => webviewRef.current?.goBack()} className="text-gray-400 hover:text-white p-1"><i className="bi bi-arrow-left"></i></button>
          <button onClick={() => webviewRef.current?.goForward()} className="text-gray-400 hover:text-white p-1"><i className="bi bi-arrow-right"></i></button>
          <button onClick={handleReload} className="text-gray-400 hover:text-white p-1"><i className="bi bi-arrow-clockwise"></i></button>
          
          <form onSubmit={handleNavigate} className="flex-1">
              <input 
                value={urlBar} 
                onChange={(e) => setUrlBar(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-1 text-xs text-white font-mono focus:border-sj-green outline-none"
              />
          </form>
          
          <div className="px-2 text-[9px] text-green-500 font-bold border border-green-500/20 rounded bg-green-500/10 flex items-center gap-1">
              <i className="bi bi-shield-lock-fill"></i> SECURE
          </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 relative">
        
        {/* PANTALLA DE ERROR (Si el proxy falla) */}
        {loadError && (
            <div className="absolute inset-0 z-10 bg-[#0B1120] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <i className="bi bi-router-fill text-4xl text-red-500"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Error de Conexión</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                    No se pudo conectar a través del Proxy. <br/>
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded mt-2 inline-block">
                        {loadError.desc} ({loadError.code})
                    </span>
                </p>
                <button 
                    onClick={handleReload}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                >
                    Reintentar Conexión
                </button>
                <div className="mt-8 text-xs text-gray-600">
                    Sugerencia: Edita el perfil y verifica si es HTTP o SOCKS5.
                </div>
            </div>
        )}

        {/* NAVEGADOR REAL */}
        <webview 
            ref={webviewRef}
            src="https://google.com" 
            className="w-full h-full"
            partition={`persist:profile_${id}`} 
            allowpopups="true"
        ></webview>
      </div>

      {/* TÚNEL OVERLAY */}
      {tunnelUrl && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="w-full h-full max-w-6xl bg-[#0B1120] border border-sj-green/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                <button 
                    onClick={() => setTunnelUrl(null)}
                    className="absolute top-4 right-4 z-50 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                    <i className="bi bi-x-lg"></i>
                </button>
                
                <TunnelModule 
                    initialUrl={tunnelUrl} 
                    onBack={() => setTunnelUrl(null)} 
                    onComplete={() => setTunnelUrl(null)} 
                />
            </div>
        </div>
      )}

    </div>
  );
};

export default InstanceContainer;