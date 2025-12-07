import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WindowControls from './WindowControls.jsx';

const Register = ({ onRegister, onBack, error, loading, successMsg }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) { alert("Las contraseñas no coinciden"); return; }
    onRegister(form);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC] relative">
      <WindowControls />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-200 relative overflow-hidden z-10"
      >
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-500 text-xs mt-1">Únete a SurveyJunior App</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Usuario</label>
                <input 
                  value={form.username} onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:border-indigo-500 outline-none"
                  required disabled={loading}
                />
            </div>
             {/* NUEVO CAMPO EMAIL */}
            <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                <input 
                  type="email"
                  value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:border-indigo-500 outline-none"
                  required disabled={loading} placeholder="ejemplo@email.com"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Contraseña</label>
                    <input 
                      type="password"
                      value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:border-indigo-500 outline-none"
                      required minLength="6" disabled={loading}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Confirmar</label>
                    <input 
                      type="password"
                      value={form.password_confirm} onChange={(e) => setForm({...form, password_confirm: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:border-indigo-500 outline-none"
                      required disabled={loading}
                    />
                </div>
            </div>
            
            {error && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center border border-red-100 animate-in">{error}</div>}

            <button 
              type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg mt-4 flex justify-center items-center gap-2"
            >
              {loading ? <><i className="bi bi-arrow-repeat animate-spin"></i> REGISTRANDO...</> : 'CREAR CUENTA'}
            </button>
        </form>

        <button onClick={onBack} disabled={loading} className="w-full mt-4 text-xs text-gray-500 hover:text-indigo-600 font-bold flex items-center justify-center gap-2 py-2 disabled:opacity-50">
            <i className="bi bi-arrow-left"></i> VOLVER AL LOGIN
        </button>
      </motion.div>

      {/* MODAL DE ÉXITO BONITO */}
      <AnimatePresence>
          {successMsg && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{scale:0.8, y: 20}} animate={{scale:1, y:0}} exit={{scale:0.8, y:20}} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <i className="bi bi-check-lg text-4xl text-green-600"></i>
                      </div>
                      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Registro Exitoso!</h2>
                      <p className="text-gray-500 mb-6">{successMsg}</p>
                      <button onClick={onBack} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
                          IR AL LOGIN E INICIAR
                      </button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default Register;