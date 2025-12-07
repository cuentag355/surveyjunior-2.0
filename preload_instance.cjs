const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('instanceAPI', {
  // Solo permitir enviar mensajes específicos si la web lo necesita
  // (Por ahora vacío para máxima seguridad, las webs de encuestas no deben saber que hay API)
});

// Listener para cosas internas
ipcRenderer.on('trigger-tunnel', (_event, url) => {
    console.log("Tunnel triggered for:", url);
});