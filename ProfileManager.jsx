import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileManager = ({ onLaunch, onBack }) => {
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); 
  const [editingId, setEditingId] = useState(null);
  
  // Estado para feedback visual del botón LANZAR
  const [launchingId, setLaunchingId] = useState(null);

  // Estados para el Farmer (Bot)
  const [showFarmer, setShowFarmer] = useState(false);
  const [farmLogs, setFarmLogs] = useState([]);
  const [farmingProfile, setFarmingProfile] = useState(null);
  const logsEndRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '', proxyString: '', proxyType: 'http',
    userAgent: '', geo: { country: '', countryCode: '', flag: '', isp: '', ip: '', timezone: '' }
  });

  const [testingProxy, setTestingProxy] = useState(false);
  const [testResult, setTestResult] = useState(null); 

  // --- CARGA DE DATOS Y LISTENERS ---
  useEffect(() => {
    loadProfiles();

    // Listener del Farmer
    if (window.electronAPI) {
        const removeListener = window.electronAPI.on('farm-log', (data) => {
            if (data.status === 'start') {
                setFarmLogs(prev => [...prev, `>> INICIANDO [${data.country}]`, `>> SITES: ${data.total}`]);
            } else if (data.status === 'visiting') {
                setFarmLogs(prev => [...prev, `> Visitando: ${data.url}`]);
            } else if (data.status === 'done') {
                setFarmLogs(prev => [...prev, `>> ✅ FINALIZADO.`]);
                setTimeout(() => setShowFarmer(false), 3000);
            } else if (data.status === 'error') {
                setFarmLogs(prev => [...prev, `>> ❌ ERROR: ${data.message}`]);
            }
        });
        return () => { if(removeListener) removeListener(); };
    }
  }, []);

  // Si recibimos un error de lanzamiento global, limpiamos el spinner
  useEffect(() => {
      if (window.electronAPI) {
          const removeErrorListener = window.electronAPI.on('launch-error', () => {
              setLaunchingId(null);
          });
          return () => { if(removeErrorListener) removeErrorListener(); };
      }
  }, []);

  const loadProfiles = async () => {
      if (window.electronAPI) {
          try {
              const data = await window.electronAPI.invoke('get-profiles');
              setProfiles(Array.isArray(data) ? data : []);
          } catch (e) { 
              console.error("Error DB", e);
          }
      }
  };

  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [farmLogs]);

  // --- LÓGICA PROXY ---
  const parseProxy = (str) => {
    const parts = str.trim().split(':');
    if (parts.length === 4) return { host: parts[0], port: parts[1], user: parts[2], pass: parts[3] };
    if (parts.length === 2) return { host: parts[0], port: parts[1], user: '', pass: '' };
    return null;
  };

  const handleTestProxy = async () => {
    const config = parseProxy(formData.proxyString);
    if (!config) { setTestResult({ success: false, msg: 'Formato incorrecto (host:port:user:pass)' }); return; }
    
    setTestingProxy(true); 
    setTestResult(null);
    
    try {
        const result = await window.electronAPI.invoke('test-proxy-connection', { type: formData.proxyType, ...config });
        
        if (result && result.status === 'success') {
            const geoData = {
                country: result.country, 
                countryCode: result.countryCode,
                flag: `https://flagcdn.com/w40/${result.countryCode.toLowerCase()}.png`,
                isp: result.isp, 
                ip: result.query, 
                timezone: result.timezone
            };
            setFormData(prev => ({ ...prev, geo: geoData }));
            setTestResult({ success: true, msg: 'Conectado', data: geoData });
        } else { 
            setTestResult({ success: false, msg: result?.message || 'Error de conexión' }); 
        }
    } catch (e) { 
        setTestResult({ success: false, msg: e.message }); 
    } finally { 
        setTestingProxy(false); 
    }
  };

  // --- CRUD PERFILES ---
  const handleSave = async () => {
    const config = parseProxy(formData.proxyString);
    
    // Hardware Fingerprint Aleatorio
    const screens = [{w:1920,h:1080}, {w:1366,h:768}, {w:1536,h:864}];
    const hardware = {
        screen: screens[Math.floor(Math.random() * screens.length)],
        memory: 8,
        concurrency: 8
    };

    const profileToSave = { 
        id: editingId || uuidv4(), 
        ...formData, 
        proxy: config ? { ...config, protocol: formData.proxyType } : null, 
        hardware: hardware, 
        created: Date.now() 
    };

    if (window.electronAPI) {
        await window.electronAPI.invoke('save-profile', profileToSave);
        await loadProfiles();
    }
    closeModal();
  };

  const handleDelete = async (id) => {
      if (window.electronAPI) {
          await window.electronAPI.invoke('delete-profile', id);
          await loadProfiles();
      }
      setShowDeleteConfirm(null);
  };

  // --- ACCIONES ---
  const handleLaunchClick = (p) => {
      // Activar spinner visual
      setLaunchingId(p.id);
      
      // Llamar al padre (App.jsx -> Main.js)
      onLaunch(p);
      
      // Timeout de seguridad: Si en 20s no ha abierto, quitar spinner
      // (El evento de éxito 'profile-ready-to-launch' en App.jsx cambiará la vista antes de esto si todo va bien)
      setTimeout(() => setLaunchingId(null), 20000);
  };

  const startFarming = (profile) => {
      setFarmingProfile(profile);
      setFarmLogs([`>> CONECTANDO PROXY PARA: ${profile.name}...`]);
      setShowFarmer(true);
      if (window.electronAPI) window.electronAPI.send('start-cookie-farming', profile.id);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); setTestResult(null); };
  
  const openModal = (p = null) => {
      setEditingId(p ? p.id : null);
      setFormData(p ? { ...p, proxyString: p.proxyString || '' } : {
        name: `Perfil ${profiles.length + 1}`, proxyString: '', proxyType: 'http', userAgent: '', geo: {}
      });
      setShowModal(true);
  };

  return (
    // DISEÑO LIGHT VIVID (Blanco/Gris)
    <div style={{ height: '100%', width: '100%', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }} className="p-8 text-gray-900 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Huellas</h1>
            <p className="text-sm text-gray-500 font-medium">Gestiona tus identidades digitales</p>
        </div>
        <button 
            onClick={() => openModal()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all flex items-center gap-2 text-sm transform active:scale-95"
        >
            <i className="bi bi-plus-lg text-lg"></i> CREAR PERFIL
        </button>
      </div>

      {/* GRID DE PERFILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 custom-scrollbar p-1">
        {profiles.map(p => (
            <motion.div 
                layout 
                key={p.id} 
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md relative group transition-all"
            >
                {/* CABECERA DE TARJETA */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {/* Bandera */}
                        {p.geo?.flag ? (
                            <img src={p.geo.flag} className="w-10 h-7 object-cover rounded shadow-sm border border-gray-100" />
                        ) : (
                            <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center text-gray-400 border border-gray-200">
                                <i className="bi bi-globe"></i>
                            </div>
                        )}
                        
                        {/* Info Principal */}
                        <div>
                            <h3 className="text-base font-bold text-gray-900 truncate max-w-[140px]">{p.name}</h3>
                            <div className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wide">
                                {p.geo?.country || 'LOCAL'}
                            </div>
                        </div>
                    </div>

                    {/* Botones de Edición */}
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(p)} className="w-8 h-8 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg flex items-center justify-center transition-colors border border-gray-100">
                            <i className="bi bi-pencil-fill text-xs"></i>
                        </button>
                        <button onClick={() => setShowDeleteConfirm(p.id)} className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors border border-gray-100">
                            <i className="bi bi-trash-fill text-xs"></i>
                        </button>
                    </div>
                </div>

                {/* INFO TÉCNICA */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>IP</span>
                        <span className="font-mono text-gray-700 font-bold">{p.geo?.ip || '---'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Timezone</span>
                        <span className="font-mono text-gray-700 truncate max-w-[120px]">{p.geo?.timezone || 'Auto'}</span>
                    </div>
                </div>
                
                {/* BOTONES DE ACCIÓN */}
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => startFarming(p)} 
                        className="py-2.5 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2"
                    >
                        <i className="bi bi-cookie"></i> FARM
                    </button>
                    
                    {/* BOTÓN LANZAR MEJORADO */}
                    <button 
                        onClick={() => handleLaunchClick(p)} 
                        disabled={launchingId === p.id}
                        className={`py-2.5 rounded-xl font-bold text-[10px] shadow-md transition-all flex items-center justify-center gap-2 text-white
                        ${launchingId === p.id 
                            ? 'bg-blue-400 cursor-wait' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20'}`}
                    >
                        {launchingId === p.id ? (
                            <>
                                <i className="bi bi-hourglass-split animate-spin text-sm"></i> 
                                INICIANDO...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-rocket-takeoff-fill"></i> 
                                LANZAR
                            </>
                        )}
                    </button>
                </div>
                
                {/* CONFIRMACIÓN DE BORRADO */}
                {showDeleteConfirm === p.id && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in border border-gray-200">
                        <p className="text-sm font-bold text-gray-800 mb-3">¿Eliminar Perfil?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-colors">
                                Cancelar
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 rounded-lg text-white font-bold transition-colors shadow-lg shadow-red-500/30">
                                Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        ))}
      </div>

      {/* MODAL EDICIÓN (Estilo Light) */}
      <AnimatePresence>
      {showModal && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
                {/* Cabecera Modal */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Configuración del Perfil</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="bi bi-x-lg text-lg"></i>
                    </button>
                </div>

                {/* Contenido Modal */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-sm">
                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre del Perfil</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="Ej: Perfil Alemania 1"
                        />
                    </div>

                    {/* Sección Proxy */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                                <i className="bi bi-router"></i> Conexión Proxy
                            </label>
                            <select 
                                className="bg-white text-xs border border-gray-200 rounded-lg px-3 py-1 outline-none text-gray-700 focus:border-blue-500 font-bold cursor-pointer" 
                                value={formData.proxyType} 
                                onChange={e => setFormData({...formData, proxyType: e.target.value})}
                            >
                                <option value="http">HTTP / HTTPS</option>
                                <option value="socks5">SOCKS5</option>
                            </select>
                        </div>
                        
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-white border border-gray-200 rounded-xl p-3 font-mono outline-none text-gray-700 placeholder-gray-400 focus:border-blue-500 transition-all text-xs shadow-sm" 
                                placeholder="ip:puerto:usuario:pass" 
                                value={formData.proxyString} 
                                onChange={e => setFormData({...formData, proxyString: e.target.value})} 
                            />
                            <button 
                                onClick={handleTestProxy} 
                                disabled={testingProxy || !formData.proxyString} 
                                className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 shadow-md transition-all min-w-[80px] flex justify-center items-center"
                            >
                                {testingProxy ? <i className="bi bi-arrow-repeat animate-spin text-lg"></i> : 'PROBAR'}
                            </button>
                        </div>

                        {/* Resultado Test */}
                        <AnimatePresence>
                        {testResult && (
                            <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} className={`mt-3 text-xs p-3 rounded-lg border flex items-center gap-2 font-medium ${testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                {testResult.success ? (
                                    <>
                                        <i className="bi bi-check-circle-fill text-green-500"></i> 
                                        <span>Conectado: <strong>{testResult.data.country}</strong> ({testResult.data.timezone})</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-x-circle-fill text-red-500"></i> 
                                        <span>{testResult.msg}</span>
                                    </>
                                )}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                    <button onClick={closeModal} className="flex-1 py-3 text-gray-500 font-bold hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-xl transition-all">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5 active:scale-95">
                        {editingId ? 'GUARDAR CAMBIOS' : 'CREAR PERFIL'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODAL FARMER (Terminal Oscura - Intencional) */}
      <AnimatePresence>
        {showFarmer && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
                <div className="bg-[#050b14] w-full max-w-2xl rounded-xl border border-purple-500/50 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="bg-[#0f172a] p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-purple-400 font-bold ml-2">QUANTUM COOKIE HARVESTER</span>
                        </div>
                        <div className="text-[10px] text-gray-500 animate-pulse">LIVE</div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 bg-black/50 text-gray-300">
                        {farmLogs.map((log, i) => (
                            <div key={i} className={`${log.includes('ERROR') ? 'text-red-400 font-bold' : log.includes('✅') ? 'text-green-400 font-bold' : log.includes('>>') ? 'text-purple-300' : 'text-gray-400'}`}>{log}</div>
                        ))}
                        <div ref={logsEndRef} />
                        <div className="text-purple-500 animate-pulse">_</div>
                    </div>
                    <div className="p-4 bg-[#0f172a] border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">Target: {farmingProfile?.name}</span>
                        <button onClick={() => setShowFarmer(false)} className="px-4 py-1.5 rounded border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors">OCULTAR</button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileManager;