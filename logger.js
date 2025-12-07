import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class SessionLogger {
    constructor(profileId, profileName) {
        this.profileId = profileId;
        this.profileName = profileName;
        this.logs = [];
        this.startTime = Date.now();
        
        // Carpeta: %APPDATA%/surveyjunior-quantum/session_logs/PERFIL_ID/
        this.baseDir = path.join(app.getPath('userData'), 'session_logs', profileId);
        
        // Asegurar que la carpeta existe
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    // Registrar un evento
    log(type, details) {
        // Limitamos el tamaño de los datos para no explotar la memoria
        // (Ej: no guardamos el cuerpo de las imágenes, solo la URL)
        this.logs.push({
            time: new Date().toISOString(),
            timestamp: Date.now(),
            type: type.toUpperCase(), // REQUEST, RESPONSE, CONSOLE, SYSTEM
            details: details
        });
    }

    // Guardar a disco (Se llama al cerrar la sesión)
    save() {
        if (this.logs.length === 0) return;

        const dateStr = new Date(this.startTime).toISOString().replace(/[:.]/g, '-');
        const fileName = `session_${dateStr}.json`;
        const filePath = path.join(this.baseDir, fileName);

        const sessionData = {
            meta: {
                profileId: this.profileId,
                profileName: this.profileName,
                startTime: this.startTime,
                endTime: Date.now(),
                durationSeconds: (Date.now() - this.startTime) / 1000
            },
            events: this.logs
        };

        try {
            fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
            console.log(`💾 [LOGGER] Sesión guardada: ${filePath}`);
            return filePath;
        } catch (e) {
            console.error("❌ Error guardando log:", e);
        }
    }
}