import React, { useState, useEffect } from 'react';

const ProxyManager = ({ onBack }) => {
  const [proxies, setProxies] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if(window.electronAPI) window.electronAPI.invoke('get-proxies').then(res => setProxies(res || []));
  }, []);

  const addProxies = async () => {
      const lines = input.split('\n').filter(l => l.includes(':'));
      const newP = lines.map(l => {
          const p = l.trim().split(':');
          return { id: Date.now() + Math.random(), host: p[0], port: p[1], user: p[2], pass: p[3], type: 'socks5', status: 'unknown' };
      });
      const updated = [...proxies, ...newP];
      setProxies(updated);
      setInput('');
      await window.electronAPI.invoke('save-proxy-list', updated);
  };

  const testProxy = async (p) => {
      const res = await window.electronAPI.invoke('test-proxy-connection', p);
      const updated = proxies.map(x => x.id === p.id ? { ...x, status: res.status === 'success' ? 'online' : 'offline', ping: '100ms' } : x);
      setProxies(updated);
  };

  return (
    <div className="h-full p-8 bg-[#030712] text-white flex flex-col">
        <div className="flex justify-between mb-4"><h1 className="text-2xl font-bold">Proxies</h1><button onClick={onBack}>X</button></div>
        <textarea className="w-full bg-[#0f172a] p-4 rounded mb-2 text-xs font-mono" rows="3" placeholder="ip:port:user:pass" value={input} onChange={(e)=>setInput(e.target.value)}></textarea>
        <button onClick={addProxies} className="bg-[#30E8BF] text-black font-bold py-2 rounded mb-6">AÑADIR</button>
        
        <div className="flex-1 overflow-y-auto space-y-2">
            {proxies.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-[#0f172a] rounded border border-white/5">
                    <div className="text-xs font-mono">{p.host}:{p.port}</div>
                    <div className="flex gap-2">
                        <span className={`text-[10px] px-2 rounded ${p.status==='online'?'bg-green-500':'bg-gray-700'}`}>{p.status}</span>
                        <button onClick={()=>testProxy(p)} className="text-blue-400"><i className="bi bi-play-fill"></i></button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
export default ProxyManager;