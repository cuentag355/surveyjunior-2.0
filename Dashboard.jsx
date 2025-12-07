import React, { useState, useEffect } from 'react';
import UniversalBar from './UniversalBar.jsx'; 
import { motion } from 'framer-motion';

const Dashboard = ({ user, onNavigate }) => {
  const [ipInfo, setIpInfo] = useState({ ip: '...', country: '...', flag: '' });

  // Datos
  const stats = user.stats || { monthly: 0, limit: 100 };
  const daysLeft = user.days_left || 0;
  
  // Porcentaje
  const usagePercent = Math.min(100, Math.round((stats.monthly / stats.limit) * 100));

  useEffect(() => {
    // Aquí puedes usar tu handler seguro 'get-public-ip'
    if (window.electronAPI) {
        window.electronAPI.invoke('get-public-ip').then(res => {
            if(res.success) {
                // Simulación Geo (o usa una API real aquí)
                setIpInfo({ ip: res.ip, country: 'Detectado', flag: '' });
            }
        });
    }
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto' }} className="p-8 bg-[#F8FAFC] relative custom-scrollbar">
      
      {/* HEADER: SALUDO + WIDGET */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Centro de Comando
          </h1>
          <p className="text-gray-500 font-medium">Bienvenido, <span className="text-brand-primary font-bold">{user.username}</span>. Tu sistema está listo.</p>
        </div>
        
        {/* Widget IP (Blanco con sombra) */}
        <div className="bg-white px-6 py-3 rounded-2xl shadow-card flex items-center gap-4 border border-gray-100">
            <div className="text-right">
                <div className="text-gray-900 font-mono font-bold text-sm">{ipInfo.ip}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ipInfo.country}</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
        </div>
      </div>

      {/* SEARCH BAR (Universal) */}
      <div className="mb-12">
        <UniversalBar onDetection={(res) => onNavigate(res.type, res.data)} />
      </div>

      {/* CARDS DE ESTADO (DISEÑO BLANCO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Membresía */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-600"><i className="bi bi-star-fill text-8xl"></i></div>
              <div className="relative z-10">
                  <div className="text-indigo-500 text-xs font-black uppercase tracking-widest mb-2">TU MEMBRESÍA</div>
                  <div className="text-3xl font-black text-gray-900 mb-2">{user.membership}</div>
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                      <i className="bi bi-clock-history"></i> {daysLeft} Días Restantes
                  </div>
              </div>
          </motion.div>

          {/* Card 2: Jumpers */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-cyan-600"><i className="bi bi-lightning-charge-fill text-8xl"></i></div>
              <div className="relative z-10 w-full">
                  <div className="flex justify-between items-center mb-2">
                      <div className="text-cyan-600 text-xs font-black uppercase tracking-widest">USO DE JUMPERS</div>
                      <div className="text-xs font-bold text-gray-900">{usagePercent}%</div>
                  </div>
                  <div className="text-3xl font-mono font-bold text-gray-900 mb-4">
                      {stats.monthly} <span className="text-lg text-gray-400 font-normal">/ {stats.limit}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${usagePercent}%` }}></div>
                  </div>
              </div>
          </motion.div>

          {/* Card 3: Histórico */}
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-brand p-6 rounded-3xl shadow-float text-white relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
               <div className="relative z-10">
                  <div className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">TOTAL HISTÓRICO</div>
                  <div className="text-4xl font-mono font-bold mb-2">{user.stats?.total || 0}</div>
                  <p className="text-xs text-white/80 font-medium">Encuestas completadas con éxito.</p>
               </div>
          </motion.div>
      </div>

      {/* ACCIONES RÁPIDAS (BOTONES REALES) */}
      <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8">
          <h3 className="text-gray-900 font-bold text-lg mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center"><i className="bi bi-lightning-fill"></i></span>
              Acciones Rápidas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionButton 
                  icon="bi-plus-lg" color="blue" label="Nuevo Perfil" sub="Crear Huella"
                  onClick={() => onNavigate('profiles')} 
              />
              <ActionButton 
                  icon="bi-router" color="orange" label="Gestor Proxies" sub="Añadir IPs"
                  onClick={() => onNavigate('proxies')} 
              />
              <ActionButton 
                  icon="bi-robot" color="purple" label="Cookie Farmer" sub="Calentar"
                  onClick={() => onNavigate('farm')} 
              />
              <ActionButton 
                  icon="bi-gear-fill" color="gray" label="Ajustes" sub="Configuración"
                  onClick={() => onNavigate('settings')} 
              />
          </div>
      </div>

    </div>
  );
};

// Componente de Botón Reutilizable (VISIBLE)
const ActionButton = ({ icon, color, label, sub, onClick }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100',
        orange: 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border-orange-100',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border-purple-100',
        gray: 'bg-gray-50 text-gray-600 hover:bg-gray-800 hover:text-white border-gray-200',
    };

    return (
        <button 
            onClick={onClick}
            className={`p-4 rounded-2xl border transition-all duration-200 text-left group hover:shadow-lg hover:-translate-y-1 ${colors[color]}`}
        >
            <div className="text-2xl mb-3"><i className={`bi ${icon}`}></i></div>
            <div className="font-bold text-sm">{label}</div>
            <div className="text-[10px] opacity-70 font-medium">{sub}</div>
        </button>
    );
};

export default Dashboard;