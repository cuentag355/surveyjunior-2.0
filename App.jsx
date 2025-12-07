import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// IMPORTACIONES
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Sidebar from './components/Sidebar.jsx'; 
import Dashboard from './components/Dashboard.jsx';
import ProfileManager from './components/ProfileManager.jsx';
import BrowserModule from './components/BrowserModule.jsx';
import TunnelModule from './components/TunnelModule.jsx';
import InstanceContainer from './components/InstanceContainer.jsx';
import ProxyManager from './components/ProxyManager.jsx'; 
import Settings from './components/Settings.jsx'; 
import CookieFarmer from './components/cookieFarmer.jsx'; 
import AdminPanel from './components/AdminPanel.jsx';
import Renovation from './components/Renovation.jsx';
import WindowControls from './components/WindowControls.jsx';

const INACTIVITY_LIMIT_MS = 20 * 60 * 1000;

const MainApp = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(null);

  // AUTO LOGIN
  useEffect(() => {
    const savedUser = localStorage.getItem('sj_user');
    if (savedUser) {
        try {
            const u = JSON.parse(savedUser);
            if (u && u.username) {
                setUser(u);
                setView('dashboard');
            }
        } catch (e) { localStorage.removeItem('sj_user'); }
    }
  }, []);

  // LISTENER PERFIL
  useEffect(() => {
      if (window.electronAPI) {
          const removeLaunchListener = window.electronAPI.on('profile-ready-to-launch', (data) => {
              setCurrentProfile(data);
              setView('browser');
          });
          const removeErrorListener = window.electronAPI.on('launch-error', (msg) => {
              alert(`Error: ${msg}`);
          });
          return () => { 
              if(removeLaunchListener) removeLaunchListener();
              if(removeErrorListener) removeErrorListener();
          };
      }
  }, []);

  // HANDLERS
  const changeView = (v) => { setError(''); setLoading(false); setRegisterSuccess(null); setView(v); };
  
  const handleLogin = async (creds) => {
    setLoading(true); setError('');
    try {
        const result = await window.electronAPI.invoke('api-login', { username: creds.user, password: creds.pass });
        if (result.success) {
            localStorage.setItem('sj_user', JSON.stringify(result.user));
            localStorage.setItem('sj_token', result.token || '');
            setUser(result.user);
            setView('dashboard');
        } else setError(result.error || 'Error login');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleRegister = async (data) => {
      setLoading(true); setError('');
      try {
          const res = await window.electronAPI.invoke('api-register', data);
          if (res.success) { setRegisterSuccess(res.message); setLoading(false); } 
          else { setError(res.message); setLoading(false); }
      } catch (e) { setError(e.message); setLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); setUser(null); setView('login'); };
  const handleUserUpdate = (u) => { const n = { ...user, ...u }; setUser(n); localStorage.setItem('sj_user', JSON.stringify(n)); };
  const handleLaunchProfile = (p) => { if (window.electronAPI) window.electronAPI.send('launch-profile', p); };
  
  const handleNavigate = (target) => { 
      if (target === 'browser_start') { 
          setCurrentProfile({ id: 'scanner', name: 'IP Scanner', partition: 'persist:scanner' }); 
          setView('browser'); 
      } else { 
          changeView(target); 
      } 
  };

  // RENDER CONTENIDO (Style Forced)
  const renderContent = () => {
      const style = { width: '100%', height: '100%' };
      switch (view) {
          case 'dashboard': return <div style={style}><Dashboard user={user} onNavigate={handleNavigate} /></div>;
          case 'profiles': return <div style={style}><ProfileManager onLaunch={handleLaunchProfile} onBack={() => changeView('dashboard')} /></div>;
          case 'proxies': return <div style={style}><ProxyManager onBack={() => changeView('dashboard')} /></div>;
          case 'settings': return <div style={style}><Settings user={user} onBack={() => changeView('dashboard')} onUserUpdate={handleUserUpdate} onLogout={handleLogout} /></div>;
          case 'farm': return <div style={style}><CookieFarmer onBack={() => changeView('dashboard')} /></div>;
          case 'renovation': return <div style={style}><Renovation onBack={() => changeView('dashboard')} /></div>;
          case 'admin': return <div style={style}><AdminPanel onBack={() => changeView('dashboard')} /></div>;
          case 'check': return <div style={style}><BrowserModule profileData={{ id: 'scanner', name: 'IP Scanner', partition: 'persist:scanner' }} onBack={() => changeView('dashboard')} /></div>;
          default: return <div style={style}><Dashboard user={user} onNavigate={handleNavigate} /></div>;
      }
  };

  const fullStyle = { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', width:'100vw', backgroundColor:'#F8FAFC', position:'relative' };
  
  if (view === 'register') return <div style={fullStyle}><div style={{position:'absolute', top:8, right:8, zIndex:50}}><WindowControls/></div><Register onRegister={handleRegister} onBack={()=>changeView('login')} error={error} loading={loading} successMsg={registerSuccess}/></div>;
  if (!user || view === 'login') return <div style={fullStyle}><div style={{position:'absolute', top:8, right:8, zIndex:50}}><WindowControls/></div><Login onLogin={handleLogin} onGoRegister={()=>changeView('register')} error={error} loading={loading}/></div>;
  if (view === 'browser') return <BrowserModule profileData={currentProfile} onBack={()=>changeView('dashboard')}/>;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
        {/* SIDEBAR - Z-Index Alto */}
        <div style={{ width: '260px', flexShrink: 0, height: '100%', zIndex: 100, position: 'relative' }}>
            <Sidebar activeView={view} onViewChange={changeView} onLogout={handleLogout} user={user} />
        </div>
        
        {/* CONTENIDO */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, zIndex: 10 }}>
            {/* Barra superior ARRASTRABLE (Solo esta franja) */}
            <div style={{ height: '40px', width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '5px', WebkitAppRegion: 'drag' }}>
                <div style={{ WebkitAppRegion: 'no-drag' }}><WindowControls /></div>
            </div>
            {/* Contenido NO ARRASTRABLE */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', width: '100%', WebkitAppRegion: 'no-drag' }}>
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

const App = () => ( <HashRouter><Routes><Route path="/" element={<MainApp />} /><Route path="/instance/:id" element={<InstanceContainer />} /></Routes></HashRouter> );
export default App;