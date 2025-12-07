/**
 * QUANTUM STEALTH V39 - STABLE
 * Injected via Electron
 */
(() => {
    const config = window.__TJ_CONFIG || {};
    const seed = config.seed || 12345;
    
    const rng = () => { 
        var t = seed + 0x6D2B79F5; 
        t = Math.imul(t ^ t >>> 15, t | 1); 
        t ^= t + Math.imul(t ^ t >>> 7, t | 61); 
        return ((t ^ t >>> 14) >>> 0) / 4294967296; 
    };

    try {
        // --- 1. TIMEZONE & INTL PATCH ---
        const targetTimezone = config.timezone || 'Europe/Berlin';
        const targetLocale = config.locale || 'de-DE';

        try {
            // Parchear Date.prototype.getTimezoneOffset
            // Calculamos el offset basándonos en la fecha actual en la zona horaria destino
            const date = new Date();
            const invDate = new Date(date.toLocaleString('en-US', { timeZone: targetTimezone }));
            const diff = date.getTime() - invDate.getTime();
            const targetOffset = Math.round(diff / 60000); // Minutos
            
            // Sobreescribir función nativa
            Date.prototype.getTimezoneOffset = function() { return targetOffset; };
            
            // Parchear Intl
            const DateTimeFormat = Intl.DateTimeFormat;
            const originalResolved = DateTimeFormat.prototype.resolvedOptions;
            DateTimeFormat.prototype.resolvedOptions = function() {
                const options = originalResolved.apply(this, arguments);
                options.timeZone = targetTimezone;
                options.locale = targetLocale;
                return options;
            };
        } catch(e) {}

        // --- 2. NAVIGATOR PATCH ---
        const nav = navigator;
        Object.defineProperties(nav, {
            language: { value: targetLocale, configurable: false },
            languages: { value: config.lang || [targetLocale, 'en-US'], configurable: false },
            hardwareConcurrency: { value: 8, configurable: false },
            deviceMemory: { value: 8, configurable: false },
            webdriver: { get: () => undefined },
            platform: { get: () => 'Win32' }
        });

        // --- 3. WEBRTC LEAK PROTECTION (SDP Munging) ---
        const rtc = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        if (rtc) {
            // Desactivar DataChannel (usado a veces para pings)
            rtc.prototype.createDataChannel = function() { return null; };
            
            // Interceptar createOffer para limpiar IPs
            const originalCreateOffer = rtc.prototype.createOffer;
            rtc.prototype.createOffer = function(options) {
                return originalCreateOffer.call(this, options).then(offer => {
                    if (offer && offer.sdp) {
                        // Borrar líneas con candidatos de IP local
                        offer.sdp = offer.sdp.replace(/(a=candidate:.*)\r\n/g, ''); 
                    }
                    return offer;
                });
            };
        }

        // --- 4. CANVAS FINGERPRINT NOISE ---
        const toDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type) {
            const ctx = this.getContext('2d');
            if (ctx) {
                // Ruido determinista pero invisible
                const shift = Math.floor(rng() * 3) + 1; 
                ctx.fillStyle = `rgba(${shift},${shift},${shift},0.01)`;
                ctx.fillRect(0, 0, 1, 1);
            }
            return toDataURL.apply(this, arguments);
        };

    } catch (e) { console.error("Stealth Err"); }
})();