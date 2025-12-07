import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const Renovation = ({ onBack }) => {
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const token = localStorage.getItem('sj_token');

  const uploadProof = async (file) => {
      setMsg({ type: 'info', text: 'Subiendo comprobante...' });
      const res = await window.electronAPI.invoke('account-update', {
          action: 'upload_proof', token, filePath: file.path
      });
      if (res.success) setMsg({ type: 'success', text: 'Enviado. Espera aprobación.' });
      else setMsg({ type: 'error', text: res.message });
  };

  return (
    <div className="h-full p-8 bg-quantum-dark text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-[#0f172a] p-8 rounded-2xl border border-sj-green/30 text-center relative overflow-hidden shadow-2xl">
            <button onClick={onBack} className="absolute top-4 right-4 text-gray-500 hover:text-white"><i className="bi bi-x-lg"></i></button>
            
            <div className="w-20 h-20 bg-sj-green/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-sj-green shadow-[0_0_20px_rgba(48,232,191,0.2)]">
                <i className="bi bi-credit-card-2-front"></i>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Renovar Suscripción</h2>
            <p className="text-gray-400 text-sm mb-6">Realiza el pago móvil y sube la captura para reactivar tu cuenta PRO.</p>
            
            <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-6 text-left text-sm font-mono space-y-2">
                <div className="flex justify-between"><span>Banco:</span> <span className="text-white font-bold">0169 (MiBanco)</span></div>
                <div className="flex justify-between"><span>Teléfono:</span> <span className="text-white font-bold">0412-6266257</span></div>
                <div className="flex justify-between"><span>Cédula:</span> <span className="text-white font-bold">22.121.892</span></div>
            </div>

            {msg && <div className={`mb-4 p-2 text-xs rounded font-bold ${msg.type==='success'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{msg.text}</div>}

            <button onClick={()=>fileRef.current.click()} className="w-full py-3 bg-sj-green text-black font-black rounded-xl hover:scale-105 transition-transform shadow-lg">
                SUBIR COMPROBANTE
            </button>
            <input type="file" ref={fileRef} hidden onChange={(e)=>uploadProof(e.target.files[0])} accept="image/*" />
        </div>
    </div>
  );
};
export default Renovation;