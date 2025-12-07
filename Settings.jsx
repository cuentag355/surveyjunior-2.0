import React, { useState, useRef } from 'react';

const Settings = ({ user, onBack, onUserUpdate, onLogout }) => {
  const [msg, setMsg] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  
  const avatarRef = useRef(null);
  const token = localStorage.getItem('sj_token');

  const uploadFile = async (type, file) => {
      if(!file) return;
      setMsg('Subiendo...');
      const res = await window.electronAPI.invoke('account-update', {
          action: type === 'avatar' ? 'upload_avatar' : 'upload_proof',
          token, filePath: file.path
      });
      if (res.success) {
          setMsg('¡Subida exitosa!');
          if(type==='avatar' && onUserUpdate) onUserUpdate({ avatar: res.url });
      } else setMsg('Error: ' + res.message);
  };

  const updateData = async (action, data) => {
      setMsg('Procesando...');
      const res = await window.electronAPI.invoke('account-update', { action, token, data });
      if (res.success) {
          setMsg('Actualizado.');
          if(data.email && onUserUpdate) onUserUpdate({ email: data.email });
      } else setMsg('Error: ' + res.message);
  };

  // CAMBIO CLAVE: bg-[#0B1120] en lugar de bg-quantum-dark
  return (
    <div className="h-full p-8 bg-[#0B1120] text-white overflow-y-auto">
        <div className="flex justify-between mb-6">
            <h1 className="text-2xl font-bold">Ajustes de Cuenta</h1>
            <button onClick={onBack} className="text-gray-400 hover:text-white"><i className="bi bi-x-lg"></i></button>
        </div>
        
        {msg && <div className="p-3 bg-blue-900/30 text-blue-400 rounded mb-4 border border-blue-500/30">{msg}</div>}

        <div className="max-w-2xl space-y-6">
            {/* AVATAR */}
            <div className="bg-[#0f172a] p-6 rounded-xl flex items-center gap-4 border border-white/5">
                <div onClick={()=>avatarRef.current.click()} className="relative cursor-pointer group">
                    <img src={user.avatar || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-full object-cover bg-gray-800" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><i className="bi bi-camera"></i></div>
                </div>
                <div>
                    <h3 className="font-bold text-lg">{user.username}</h3>
                    <p className="text-xs text-gray-500">Membresía: <span className="text-green-400">{user.membership}</span></p>
                    <input type="file" ref={avatarRef} hidden onChange={(e)=>uploadFile('avatar', e.target.files[0])} accept="image/*" />
                </div>
            </div>

            {/* EMAIL */}
            <div className={`p-6 rounded-xl border ${!user.email ? 'bg-red-900/10 border-red-500/50' : 'bg-[#0f172a] border-white/5'}`}>
                <h3 className={`font-bold mb-2 ${!user.email ? 'text-red-400' : 'text-white'}`}>Correo Electrónico {!user.email && '(REQUERIDO)'}</h3>
                <div className="flex gap-2">
                    <input className="flex-1 bg-black/30 border border-white/10 rounded p-2 text-white outline-none focus:border-blue-500" 
                        placeholder={user.email || "Ingresa tu email"} onChange={(e)=>setNewEmail(e.target.value)} />
                    <button onClick={()=>updateData('update_email', {email: newEmail})} className="bg-blue-600 hover:bg-blue-500 px-4 rounded font-bold text-sm transition-colors">GUARDAR</button>
                </div>
            </div>

            {/* PASSWORD */}
            <div className="bg-[#0f172a] p-6 rounded-xl border border-white/5">
                <h3 className="font-bold mb-2">Cambiar Contraseña</h3>
                <div className="flex gap-2">
                    <input type="password" className="flex-1 bg-black/30 border border-white/10 rounded p-2 text-white outline-none focus:border-blue-500" 
                        placeholder="Nueva contraseña (mín 6 caracteres)" onChange={(e)=>setNewPass(e.target.value)} />
                    <button onClick={()=>updateData('change_password', {password: newPass})} className="bg-gray-700 hover:bg-gray-600 px-4 rounded font-bold text-sm transition-colors">CAMBIAR</button>
                </div>
            </div>
            
            <button onClick={onLogout} className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold text-sm flex items-center justify-center gap-2 mt-8">
                <i className="bi bi-box-arrow-right"></i> CERRAR SESIÓN EN ESTE DISPOSITIVO
            </button>
        </div>
    </div>
  );
};
export default Settings;