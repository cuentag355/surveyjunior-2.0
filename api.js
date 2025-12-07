import axios from 'axios';

// URL BASE (Asegúrate que sea correcta)
const API_URL = 'https://surveyjunior.us/v2'; 

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Cookies
  headers: {
    'Content-Type': 'application/json',
    'X-SJ-CLIENT-VERSION': 'Quantum-Electron-App'
  }
});

// --- INTERCEPTOR MÁGICO (NUEVO) ---
// Antes de enviar cualquier petición, inyectamos el Token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sj_token');
  if (token) {
    // Enviamos el token en la cabecera estándar de autorización
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;