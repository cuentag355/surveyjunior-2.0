import React from 'react';

const Sidebar = ({ activeView, onViewChange, onLogout, user }) => {
  
  const MenuButton = ({ id, icon, label }) => {
    const isActive = activeView === id;
    
    // ESTILOS PUROS (Sin lógica de drag rara)
    const btnStyle = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '8px',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        border: isActive ? '1px solid #2563EB' : '1px solid #E5E7EB',
        backgroundColor: isActive ? '#2563EB' : '#FFFFFF',
        color: isActive ? '#FFFFFF' : '#374151',
        transition: 'all 0.2s',
        // Aseguramos que NO sea arrastrable explícitamente
        WebkitAppRegion: 'no-drag' 
    };

    return (
      <button onClick={() => onViewChange(id)} style={btnStyle} className="hover:shadow-md">
        <i className={`bi ${icon} text-lg`}></i>
        <span>{label}</span>
      </button>
    );
  };

  return (
    // CORRECCIÓN: Eliminado 'WebkitAppRegion: drag'. Ahora es un div estático interactivo.
    <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '16px', 
        backgroundColor: '#F3F4F6', 
        borderRight: '1px solid #D1D5DB',
        pointerEvents: 'auto' // Forzar interactividad
    }}>
      
      {/* LOGO */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '32px', cursor: 'pointer', WebkitAppRegion: 'no-drag' }} 
        onClick={() => onViewChange('dashboard')}
      >
        <div style={{ width:'40px', height:'40px', background:'#2563EB', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
           <i className="bi bi-cpu-fill text-xl"></i>
        </div>
        <div>
           <h1 style={{ fontWeight:'900', fontSize:'20px', color:'#111827', margin:0, lineHeight:1 }}>QUANTUM<span style={{color:'#2563EB'}}>APP</span></h1>
           <p style={{ fontSize:'10px', fontWeight:'bold', color:'#6B7280', textTransform:'uppercase', letterSpacing:'1px', margin:0 }}>Enterprise V31</p>
        </div>
      </div>

      {/* MENÚ SCROLLABLE */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar-hide">
        <div style={{ padding:'0 8px', fontSize:'10px', fontWeight:'900', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>Principal</div>
        <MenuButton id="dashboard" icon="bi-grid-1x2-fill" label="Dashboard" />
        <MenuButton id="profiles" icon="bi-fingerprint" label="Mis Huellas" />
        <MenuButton id="proxies" icon="bi-router-fill" label="Proxies" />
        
        <div style={{ padding:'0 8px', fontSize:'10px', fontWeight:'900', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', marginTop:'24px' }}>Herramientas</div>
        <MenuButton id="farm" icon="bi-robot" label="Cookie Farmer" />
        <MenuButton id="check" icon="bi-shield-check" label="IP Scanner" />
        <MenuButton id="renovation" icon="bi-credit-card-2-front-fill" label="Renovar Plan" />

        {user?.membership === 'ADMINISTRADOR' && (
           <>
             <div style={{ padding:'0 8px', fontSize:'10px', fontWeight:'900', color:'#EF4444', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', marginTop:'24px' }}>Admin</div>
             <MenuButton id="admin" icon="bi-shield-lock-fill" label="Panel Admin" />
           </>
        )}
      </div>

      {/* USUARIO */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #D1D5DB' }}>
          <button 
            onClick={onLogout} 
            style={{
                width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '12px', fontWeight: 'bold', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', cursor: 'pointer',
                WebkitAppRegion: 'no-drag'
            }}
          >
              <i className="bi bi-box-arrow-right"></i> CERRAR SESIÓN
          </button>
      </div>
    </div>
  );
};

export default Sidebar;