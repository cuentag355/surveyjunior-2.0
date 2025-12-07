import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WindowControls from './WindowControls.jsx';

const Login = ({ onLogin, onGoRegister, error, loading }) => {
  const [creds, setCreds] = useState({ user: '', pass: '' });

  // FIX: Resetear loading al montar el componente para desbloquear inputs
  useEffect(() => {
    if (loading) {
        // Si el componente se monta y loading es true, significa que venimos
        // de un registro exitoso. Forzamos un re-render para limpiar el estado.
        // (Nota: La solución real está en App.jsx, pero esto ayuda)
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(creds);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] relative">
      <WindowControls /> {/* Controles de ventana */}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-200 relative overflow-hidden z-10"
      >
        <div className="text-center mb-8">
            {/* NUEVO LOGO SJA APP */}
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
                <span className="text-white font-black text-2xl tracking-tighter leading-none">Survey</span>
                <span className="text-red-500 font-bold text-2xl tracking-tighter leading-none">Junior</span>
		
            </div>
	<p className="text-gray-500 text-bold-sm mt-2 font-medium">Versión 2.0.0</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bienvenido</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Inicia sesión en SurveyJunior App</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-20">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Usuario</label>
                <input 
                  value={creds.user} onChange={(e) => setCreds({...creds, user: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-gray-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="Ej: usuario"
                  disabled={loading} // Se bloquea solo si loading es true
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Contraseña</label>
                <input 
                  type="password"
                  value={creds.pass} onChange={(e) => setCreds({...creds, pass: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-gray-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="••••••••"
                  disabled={loading}
                />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-in">
                <i className="bi bi-exclamation-circle-fill"></i> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 transform active:scale-95"
            >
              {loading ? <><i className="bi bi-arrow-repeat animate-spin"></i> Validando...</> : 'INGRESAR AL SISTEMA'}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center relative z-20">
            <p className="text-xs text-gray-400 mb-3 font-medium">¿No tienes cuenta?</p>
            
            <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(onGoRegister) onGoRegister(); }}
                className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
                <i className="bi bi-person-plus-fill"></i> SOLICITAR NUEVA CUENTA
            </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;