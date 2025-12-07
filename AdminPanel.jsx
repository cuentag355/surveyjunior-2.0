import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Datos
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [links, setLinks] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modales
  const [editingUser, setEditingUser] = useState(null);
  const [editingLink, setEditingLink] = useState(null);
  
  // Nuevo Link
  const [newLink, setNewLink] = useState({ slug: '', target: '' });

  // Token de sesión (CRÍTICO PARA AUTH)
  const token = localStorage.getItem('sj_token');

  // --- CARGA INICIAL ---
  useEffect(() => { loadStats(); }, []);

  const showMsg = (type, text) => {
      setMsg({ type, text });
      setTimeout(() => setMsg(null), 3000);
  };

  // --- EJECUTOR MAESTRO (CONECTA CON MAIN.JS) ---
  const execute = async (action, data = {}, reloadFn = null) => {
      setLoading(true);
      try {
          // Enviamos 'token' en cada petición para pasar la seguridad de PHP
          const res = await window.electronAPI.invoke('admin-action', { action, token, ...data });
          
          if (res.success) {
              if (res.data && reloadFn) reloadFn(res.data); // Si la API devuelve los datos actualizados directo
              else if (reloadFn) reloadFn(); // Si hay que recargar manualmente
              if (res.message) showMsg('success', res.message);
              return true;
          } else {
              showMsg('error', res.message);
              return false;
          }
      } catch (e) { showMsg('error', e.message); }
      finally { setLoading(false); }
  };

  // --- CARGADORES ---
  const loadStats = async () => {
      try {
          const res = await window.electronAPI.invoke('admin-get-stats', token);
          if(res && res.success) setStats(res);
          else if(res.message) showMsg('error', res.message);
      } catch(e) { console.error(e); }
  };

  const loadUsers = () => execute('get_users', {}, setUsers);
  const loadPayments = () => execute('get_payments', {}, setPayments);
  const loadLinks = () => execute('get_links', {}, setLinks);
  const loadRatings = () => execute('get_ratings', { search }, setRatings);
  const loadLogs = () => execute('get_logs', {}, setLogs);

  // --- ACCIONES ESPECÍFICAS ---
  const saveUser = () => {
      execute('edit_user', {
          user_id: editingUser.id,
          active: editingUser.active ? 'true' : 'false',
          membership_type: editingUser.membership_type,
          jumper_limit: editingUser.jumper_limit,
          banned: editingUser.banned ? 'true' : 'false',
          allow_multisession: editingUser.allow_multisession ? 'true' : 'false',
          can_access_academia: editingUser.can_access_academia ? 'true' : 'false',
          membership_expires: editingUser.membership_expires || ''
      }, loadUsers);
      setEditingUser(null);
  };

  const saveLink = () => {
      execute('edit_link', {
          id: editingLink.id,
          slug: editingLink.slug,
          target_url: editingLink.target_url
      }, loadLinks);
      setEditingLink(null);
  };

  const formatDateVE = (dateString) => {
      if(!dateString) return '-';
      return new Date(dateString).toLocaleString('es-VE', { 
          timeZone: 'America/Caracas',
          day: '2-digit', month: '2-digit', year: '2-digit', 
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
  };

  // --- COMPONENTES VISUALES ---
  const TabBtn = ({ id, icon, label, onClick }) => (
      <button onClick={() => { setActiveTab(id); setSearch(''); if(onClick) onClick(); }} 
          className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all font-bold text-xs uppercase tracking-wide
          ${activeTab === id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
          <i className={`bi ${icon} text-lg`}></i> {label}
      </button>
  );

  return (
    <div className="h-full flex bg-[#030712] text-white overflow-hidden font-sans">
        
        {/* SIDEBAR */}
        <div className="w-56 bg-[#0a0f1c] border-r border-white/5 flex flex-col p-4 z-20">
            <div className="flex items-center gap-2 mb-8 text-red-500 font-bold tracking-widest px-2">
                <i className="bi bi-shield-lock-fill text-xl"></i> ADMIN CORE
            </div>

            <nav className="space-y-1 flex-1">
                <TabBtn id="dashboard" icon="bi-speedometer2" label="Dashboard" onClick={loadStats} />
                <TabBtn id="users" icon="bi-people-fill" label="Usuarios" onClick={loadUsers} />
                <TabBtn id="payments" icon="bi-credit-card-fill" label="Pagos" onClick={loadPayments} />
                <TabBtn id="links" icon="bi-link-45deg" label="Acortador" onClick={loadLinks} />
                <TabBtn id="ratings" icon="bi-star-fill" label="Ratings" onClick={loadRatings} />
                <TabBtn id="logs" icon="bi-terminal-fill" label="Logs Sistema" onClick={loadLogs} />
            </nav>

            <button onClick={onBack} className="w-full py-3 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-colors font-bold mt-4">
                <i className="bi bi-arrow-left mr-2"></i> VOLVER
            </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
            
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0f1c]/50 backdrop-blur-md">
                <h2 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab}</h2>
                <div className="flex items-center gap-4">
                    {loading && <div className="text-xs text-blue-400 animate-pulse font-mono">PROCESANDO...</div>}
                    <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-[#030712] shadow-lg flex items-center justify-center font-bold text-xs">A</div>
                </div>
            </div>

            {/* Notificaciones */}
            <AnimatePresence>
                {msg && (
                    <motion.div initial={{y:-50, opacity:0}} animate={{y:20, opacity:1}} exit={{y:-50, opacity:0}} className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-xs font-bold shadow-2xl z-50 flex items-center gap-3 border backdrop-blur-md ${msg.type==='success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                        <i className={`bi ${msg.type==='success'?'bi-check-circle-fill':'bi-exclamation-triangle-fill'}`}></i> {msg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                {/* 1. DASHBOARD */}
                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                                <div className="text-gray-500 text-[10px] font-bold uppercase mb-1">Total Usuarios</div>
                                <div className="text-4xl font-bold text-white">{stats.stats.totalUsers}</div>
                            </div>
                            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                                <div className="text-gray-500 text-[10px] font-bold uppercase mb-1">Usuarios Online</div>
                                <div className="text-4xl font-bold text-green-400">{stats.stats.onlineUsers}</div>
                            </div>
                            <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                                <div className="text-gray-500 text-[10px] font-bold uppercase mb-1">Jumpers (Mes)</div>
                                <div className="text-4xl font-bold text-blue-400">{stats.stats.monthlyJumpers}</div>
                            </div>
                        </div>

                        <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8">
                            <h3 className="text-lg font-bold text-white mb-6">CONTROLES DE EMERGENCIA</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <button onClick={() => execute('toggle_maintenance', { value: !stats.stats.maintenance_mode ? 'true' : 'false' }, loadStats)} className={`py-6 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-3 transition-all ${stats.stats.maintenance_mode ? 'bg-red-500 border-red-500 text-white' : 'border-gray-700 text-gray-400 hover:border-white'}`}>
                                    <i className="bi bi-cone-striped text-3xl"></i> {stats.stats.maintenance_mode ? 'MANTENIMIENTO: ON' : 'ACTIVAR MANTENIMIENTO'}
                                </button>
                                <button onClick={() => execute('toggle_academy', { value: !stats.stats.academy_is_disabled ? 'true' : 'false' }, loadStats)} className={`py-6 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-3 transition-all ${stats.stats.academy_is_disabled ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-700 text-gray-400 hover:border-white'}`}>
                                    <i className="bi bi-mortarboard-fill text-3xl"></i> {stats.stats.academy_is_disabled ? 'ACADEMIA: OFF' : 'SUSPENDER ACADEMIA'}
                                </button>
                                <button onClick={() => { if(confirm("¿Cerrar sesión a TODOS los usuarios (menos tú)?")) execute('force_logout_all', {}, loadStats); }} className="py-6 rounded-xl border-2 border-red-900/50 bg-red-900/20 text-red-400 font-bold text-sm flex flex-col items-center gap-3 hover:bg-red-900/40 transition-all">
                                    <i className="bi bi-power text-3xl"></i> FORZAR LOGOUT
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USUARIOS */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Base de Usuarios</h2>
                            <button onClick={loadUsers} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold"><i className="bi bi-arrow-clockwise"></i> Recargar</button>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-gray-400 uppercase font-bold">
                                    <tr><th className="p-4">Usuario</th><th className="p-4">Plan</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4"><div className="font-bold text-white">{u.username}</div><div className="text-gray-500">{u.email || 'Sin email'}</div></td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold border ${u.membership_type==='ADMINISTRADOR'?'bg-red-500/10 text-red-400 border-red-500/20':'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{u.membership_type}</span></td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {u.online == 1 ? <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></span> : <span className="w-2 h-2 rounded-full bg-gray-600"></span>}
                                                    <span className={u.active==1?'text-white':'text-red-400'}>{u.active==1?'Activo':'Suspendido'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => setEditingUser(u)} className="text-blue-400 hover:text-white mr-3"><i className="bi bi-pencil-square text-lg"></i></button>
                                                <button onClick={() => { if(confirm('¿Borrar?')) execute('delete_user', {user_id: u.id}, loadUsers); }} className="text-red-500 hover:text-red-400"><i className="bi bi-trash text-lg"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. PAGOS */}
                {activeTab === 'payments' && (
                    <div className="animate-in fade-in space-y-4">
                        <div className="flex justify-between">
                            <h2 className="text-xl font-bold">Solicitudes de Pago</h2>
                            <button onClick={loadPayments} className="text-blue-400"><i className="bi bi-arrow-clockwise"></i></button>
                        </div>
                        {payments.map(p => (
                            <div key={p.id} className="bg-[#0f172a] p-5 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-white text-sm">{p.username}</div>
                                    <div className="text-xs text-gray-500">Ref: {p.reference_number || 'N/A'} • {formatDateVE(p.created_at)}</div>
                                    <button onClick={() => window.electronAPI.send('open-external', p.file_url)} className="text-xs text-blue-400 hover:underline mt-1 flex items-center gap-1"><i className="bi bi-eye"></i> Ver Comprobante</button>
                                </div>
                                <div className="flex gap-2">
                                    {p.status === 'PENDIENTE' ? (
                                        <>
                                            <button onClick={() => execute('approve_payment', {proof_id:p.id}, loadPayments)} className="px-3 py-1 bg-green-600 rounded text-xs font-bold hover:bg-green-500">APROBAR</button>
                                            <button onClick={() => execute('reject_payment', {proof_id:p.id}, loadPayments)} className="px-3 py-1 bg-red-600 rounded text-xs font-bold hover:bg-red-500">RECHAZAR</button>
                                        </>
                                    ) : ( <span className="px-3 py-1 rounded text-xs font-bold bg-white/10">{p.status}</span> )}
                                </div>
                            </div>
                        ))}
                        {payments.length === 0 && <p className="text-gray-500">No hay pagos recientes.</p>}
                    </div>
                )}

                {/* 4. LINKS */}
                {activeTab === 'links' && (
                    <div className="animate-in fade-in">
                        <h2 className="text-xl font-bold mb-6">Acortador</h2>
                        <div className="bg-white/5 p-4 rounded-xl mb-6 flex gap-2">
                            <input className="bg-black/30 border border-white/10 rounded p-2 text-sm text-white w-32" placeholder="Slug" value={newLink.slug} onChange={e=>setNewLink({...newLink, slug:e.target.value})} />
                            <input className="bg-black/30 border border-white/10 rounded p-2 text-sm text-white flex-1" placeholder="URL Destino" value={newLink.target} onChange={e=>setNewLink({...newLink, target:e.target.value})} />
                            <button onClick={() => execute('add_link', { slug: newLink.slug, target_url: newLink.target }, () => { setNewLink({slug:'',target:''}); loadLinks(); })} className="bg-blue-600 px-4 rounded font-bold text-xs">CREAR</button>
                        </div>
                        <div className="space-y-2">
                            {links.map(l => (
                                <div key={l.id} className="p-3 bg-white/5 rounded flex justify-between items-center text-xs">
                                    <div><span className="text-sj-green font-bold">/go/{l.slug}</span><div className="text-gray-500 truncate max-w-md">{l.target_url}</div></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingLink(l)} className="text-blue-400"><i className="bi bi-pencil"></i></button>
                                        <button onClick={() => execute('delete_link', { id: l.id }, loadLinks)} className="text-red-400"><i className="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. RATINGS */}
                {activeTab === 'ratings' && (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between mb-4">
                             <h2 className="text-xl font-bold">Ratings</h2>
                             <input type="text" placeholder="Buscar..." className="bg-white/5 border border-white/10 rounded px-3 py-1 text-xs text-white" onKeyDown={(e)=>{if(e.key==='Enter') execute('get_ratings', {search:e.target.value}, setRatings)}} />
                        </div>
                        <div className="space-y-2">
                            {ratings.map(r => (
                                <div key={r.id} className="p-3 bg-white/5 rounded border border-white/5 text-xs flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white mb-1"><span className="text-blue-400">{r.subid}</span> <span className="text-gray-500">por {r.username}</span></div>
                                        <div className="text-gray-300 italic">"{r.comment}"</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${r.rating>0?'text-green-400':'text-red-400'}`}>{r.rating>0?'POSITIVO':'NEGATIVO'}</span>
                                        <button onClick={()=>{if(confirm('¿Borrar?')) execute('delete_rating', {id:r.id}, ()=>execute('get_ratings', {}, setRatings))}} className="text-red-500"><i className="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. LOGS */}
                {activeTab === 'logs' && (
                    <div className="animate-in fade-in h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Logs del Sistema</h2>
                            <div className="flex gap-2">
                                <button onClick={loadLogs} className="text-blue-400 text-xs font-bold">ACTUALIZAR</button>
                                <button onClick={() => {if(confirm('¿BORRAR TODO?')) execute('clear_all_logs', {}, setLogs)}} className="text-red-400 text-xs font-bold">LIMPIAR</button>
                            </div>
                        </div>
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-1 custom-scrollbar">
                            {logs.map(l => (
                                <div key={l.id} className="border-b border-white/5 pb-1">
                                    <span className="text-purple-400">[{formatDateVE(l.timestamp)}]</span>
                                    <span className="text-yellow-500 font-bold mx-2">{l.username || 'SYS'}</span>
                                    <span className="text-blue-300">{l.action}</span>
                                    {l.details && <span className="text-gray-500 ml-2">➜ {l.details}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL EDITAR USUARIO */}
        {editingUser && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-md border border-white/10">
                    <h3 className="font-bold mb-4 text-white">Editar {editingUser.username}</h3>
                    <div className="space-y-3">
                        <label className="block text-xs text-gray-400">Plan</label>
                        <select className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm" value={editingUser.membership_type} onChange={e=>setEditingUser({...editingUser, membership_type:e.target.value})}>
                            <option value="PRUEBA GRATIS">PRUEBA GRATIS</option><option value="PRO">PRO</option><option value="ADMINISTRADOR">ADMINISTRADOR</option>
                        </select>
                        
                        <label className="block text-xs text-gray-400">Vencimiento (YYYY-MM-DD HH:MM:SS)</label>
                        <input type="text" className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm" value={editingUser.membership_expires||''} onChange={e=>setEditingUser({...editingUser, membership_expires:e.target.value})} placeholder="Dejar vacío para infinito" />
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <label className="flex items-center gap-2 bg-black/20 p-2 rounded"><input type="checkbox" checked={editingUser.active==1} onChange={e=>setEditingUser({...editingUser, active:e.target.checked?1:0})} /> <span className="text-xs">Activo</span></label>
                            <label className="flex items-center gap-2 bg-black/20 p-2 rounded"><input type="checkbox" checked={editingUser.can_access_academia==1} onChange={e=>setEditingUser({...editingUser, can_access_academia:e.target.checked?1:0})} /> <span className="text-xs">Academia</span></label>
                            <label className="flex items-center gap-2 bg-black/20 p-2 rounded border border-yellow-500/20 col-span-2"><input type="checkbox" checked={editingUser.allow_multisession==1} onChange={e=>setEditingUser({...editingUser, allow_multisession:e.target.checked?1:0})} /> <span className="text-xs text-yellow-400">Multisesión</span></label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={()=>setEditingUser(null)} className="px-4 py-2 text-gray-400 text-xs font-bold">Cancelar</button>
                        <button onClick={saveUser} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">Guardar</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDITAR LINK */}
        {editingLink && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-md border border-white/10">
                    <h3 className="font-bold mb-4 text-white">Editar Enlace</h3>
                    <div className="space-y-3">
                        <label className="text-xs text-gray-400">Slug</label>
                        <input className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm text-white" value={editingLink.slug} onChange={e=>setEditingLink({...editingLink, slug:e.target.value})} />
                        <label className="text-xs text-gray-400">URL Destino</label>
                        <input className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm text-white" value={editingLink.target_url} onChange={e=>setEditingLink({...editingLink, target_url:e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={()=>setEditingLink(null)} className="px-4 py-2 text-gray-400 text-xs font-bold">Cancelar</button>
                        <button onClick={saveLink} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">Guardar</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default AdminPanel;