import React, { useState } from 'react';
import UrlDetector from '../utils/UrlDetector';
import { motion, AnimatePresence } from 'framer-motion';

const UniversalBar = ({ onDetection }) => {
  const [inputVal, setInputVal] = useState('');
  const [detected, setDetected] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  // Escuchar si hay algo en el portapapeles al enfocar
  const checkClipboard = async () => {
    if (!inputVal) {
      try {
        const text = await navigator.clipboard.readText();
        const result = UrlDetector.detect(text);
        // Aquí podríamos sugerir el texto, por ahora solo detectamos silenciosamente
      } catch (e) {}
    }
  };

  const handleInput = (e) => {
    const text = e.target.value;
    setInputVal(text);

    // EJECUTAR EL CEREBRO DE SILICON VALLEY
    const result = UrlDetector.detect(text);
    setDetected(result);
  };

  const handleExecute = (e) => {
    if (e) e.preventDefault();
    if (detected) {
      onDetection(detected);
      setInputVal('');
      setDetected(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && detected) {
      handleExecute();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 relative z-50">
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <span className="text-xs font-bold tracking-[0.3em] text-sj-green uppercase opacity-70">
          Quantum Engine v2.0
        </span>
      </motion.div>

      <div className="relative group">
        <div 
          className={`absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500
            ${detected 
              ? 'from-green-400 via-blue-500 to-purple-600 animate-pulse' 
              : 'from-gray-700 to-gray-600'
            }`}
        ></div>

        <div className="relative flex items-center bg-[#0B1120] rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden">
          
          <div className="pl-5 pr-3 flex items-center justify-center w-12 h-14">
            <AnimatePresence mode="wait">
              {detected ? (
                <motion.i 
                  key="detected"
                  initial={{ scale: 0, rotate: -90 }} 
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  className={`bi ${detected.icon} text-2xl`} 
                  style={{ color: detected.color }}
                />
              ) : (
                <motion.i 
                  key="search"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="bi bi-search text-gray-500 text-xl" 
                />
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            className="w-full bg-transparent text-white text-lg py-4 outline-none placeholder-gray-600 font-mono"
            placeholder="Pega el enlace o texto de la encuesta..."
            value={inputVal}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsFocused(true); checkClipboard(); }}
            onBlur={() => setIsFocused(false)}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />

          <div className="pr-2">
            <AnimatePresence>
              {detected && (
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 rounded-xl font-bold text-[#0B1120] shadow-lg flex items-center gap-2 transition-colors"
                  style={{ 
                    background: detected.color,
                    boxShadow: `0 0 20px ${detected.color}40`
                  }}
                  onClick={handleExecute}
                >
                  <span>GENERAR</span>
                  <i className="bi bi-lightning-charge-fill"></i>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {detected && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mt-3 px-2 overflow-hidden"
          >
            <div className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">Protocolo:</span>
                <span className="font-bold tracking-wide" style={{ color: detected.color }}>
                  {detected.name.toUpperCase()}
                </span>
                
                <div className="h-4 w-px bg-white/10 mx-2"></div>
                
                {detected.type === 'meinungsplatz' && (
                  <span className="text-gray-300 font-mono text-xs">
                    ID: {detected.data.userId.substring(0,4)}... • P: {detected.data.projektnummer || 'Detectando...'}
                  </span>
                )}
                
                {detected.type === 'opensurvey' && (
                  <span className="text-gray-300 font-mono text-xs">
                    Project: {detected.data.project} • {detected.data.isCompleteLink ? 'LINK FINAL' : 'INVITACIÓN'}
                  </span>
                )}

                {detected.type === 'samplicio' && (
                  <span className="text-gray-300 font-mono text-xs">
                    Host: {detected.data.hostname} • RID: {detected.data.rid}
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 font-mono">
                [ENTER] para ejecutar
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UniversalBar;