import React from 'react';

const WindowControls = ({ dark = false }) => {
  const btnClass = `w-10 h-10 flex items-center justify-center transition-colors rounded-full no-drag ${dark ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-200'}`;
  const closeClass = `w-10 h-10 flex items-center justify-center transition-colors rounded-full no-drag hover:bg-red-500 hover:text-white ${dark ? 'text-white' : 'text-gray-500'}`;

  return (
    <div className="absolute top-2 right-2 z-50 flex items-center gap-1 drag-region">
        <button onClick={()=>window.electronAPI.windowControl('minimize')} className={btnClass}>
            <i className="bi bi-dash-lg"></i>
        </button>
        <button onClick={()=>window.electronAPI.windowControl('maximize')} className={btnClass}>
             <i className="bi bi-square"></i>
        </button>
        <button onClick={()=>window.electronAPI.windowControl('close')} className={closeClass}>
             <i className="bi bi-x-lg"></i>
        </button>
    </div>
  );
};

export default WindowControls;