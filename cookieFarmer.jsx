import React, { useState, useEffect, useRef } from 'react';

const CookieFarmer = ({ onBack }) => {
  const [profiles, setProfiles] = useState([]);
  const [farmLogs, setFarmLogs] = useState([]);
  const [farmingProfile, setFarmingProfile] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Cargar perfiles al montar
    if (window.electronAPI) {
        window.electronAPI.invoke('get-profiles').then(res => setProfiles(res || []));
        
        // Escuchar logs del backend
        const removeListener = window.electronAPI.on('farm-log', (data) => {
            const time = new Date().toLocaleTimeString();
            let msg = '';
            let color = 'text-gray-400';

            if (data.status === 'start') { 
                msg = `>> INICIANDO FARMING [${data.country}] - ${data.total} SITIOS`; 
                color = 'text-purple-400 font-bold'; 
            }
            else if (data.status === 'visiting') { 
                msg = `> Visitando: ${data.url}`; 
                color = 'text-blue-300'; 
            }
            else if (data.status === 'done') { 
                msg = `>> ✅ FINALIZADO. Cookies guardadas.`; 
                color = 'text-green-400 font-bold'; 
                setFarmingProfile(null); // Liberar estado visual
            }
            else if (data.status === 'error') { 
                msg = `>> ❌ ERROR: ${data.message}`; 
                color = 'text-red-400'; 
                setFarmingProfile(null);
            }

            setFarmLogs(prev => [...prev, { time, msg, color }]);
        });
        return () => { if(removeListener) removeListener(); };
    }
  }, []);

  // Auto-scroll al final de los logs
  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [farmLogs]);

  const startFarming = (profile) => {
      setFarmingProfile(profile);
      setFarmLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `>> CONECTANDO PROXY PARA: ${profile.name}...`, color: 'text-yellow-400' }]);
      if(window.electronAPI) window.electronAPI.send('start-cookie-farming', profile.id);
  };

  return (
    <div className="h-full flex bg-[#030712] text-white">
        {/* LISTA DE PERFILES IZQUIERDA */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-[#0B1120]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-bold text-sm tracking-widest text-gray-400">OBJETIVOS DISPONIBLES</h2>
                <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
                    <i className="bi bi-arrow-left text-lg"></i>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {profiles.length === 0 && <div className="text-xs text-gray-600 text-center mt-10">No hay perfiles creados.</div>}
                {profiles.map(p => (
                    <div key={p.id} className={`p-3 rounded-xl border transition-all flex justify-between items-center group ${farmingProfile?.id === p.id ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-white/5 hover:border-purple-500/30'}`}>
                        <div>
                            <div className="font-bold text-sm text-white flex items-center gap-2">
                                {p.name}
                                {farmingProfile?.id === p.id && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1">
                                {p.geo?.countryCode || 'DE'} • {p.proxyString ? 'Proxy Configurado' : 'Directo'}
                            </div>
                        </div>
                        <button 
                            onClick={() => startFarming(p)} 
                            disabled={farmingProfile !== null}
                            className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-purple-900/50 transition-all group-hover:scale-105"
                            title="Iniciar Engorde"
                        >
                            {farmingProfile?.id === p.id ? <i className="bi bi-hourglass-split animate-spin"></i> : <i className="bi bi-play-fill"></i>}
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* TERMINAL DERECHA */}
        <div className="flex-1 flex flex-col bg-[#050b14] relative overflow-hidden">
            {/* Header Terminal */}
            <div className="p-4 border-b border-white/10 bg-[#0a0f1c] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-xs font-mono text-purple-400 font-bold ml-2 tracking-wider">QUANTUM COOKIE HARVESTER v2.0</span>
                </div>
                <div className="text-[10px] text-gray-600 font-mono">
                    STATUS: {farmingProfile ? <span className="text-green-400 animate-pulse">ACTIVE</span> : 'IDLE'}
                </div>
            </div>
            
            {/* Logs Area */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-1.5 custom-scrollbar">
                {farmLogs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4">
                        <i className="bi bi-robot text-6xl opacity-20"></i>
                        <p>Selecciona un perfil a la izquierda para comenzar el proceso de engorde.</p>
                    </div>
                )}
                {farmLogs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${log.color} animate-in fade-in duration-300`}>
                        <span className="opacity-30 select-none min-w-[60px] text-right">{log.time}</span>
                        <span>{log.msg}</span>
                    </div>
                ))}
                <div ref={logsEndRef} />
                {farmingProfile && <div className="text-purple-500 animate-pulse ml-[72px]">_</div>}
            </div>
        </div>
    </div>
  );
};

export default CookieFarmer;