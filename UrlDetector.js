/**
 * SURVEYJUNIOR QUANTUM - CEREBRO DE DETECCIÓN (v2.0)
 * Portado de la lógica PHP para ejecución nativa instantánea.
 */

class UrlDetector {
  
  static detect(text) {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.trim();

    // 1. MEINUNGSPLATZ (Prioridad Alta)
    // Lógica portada de: api_generate.php
    // Busca 15 dígitos aislados (UserID)
    const mpRegex = /(?<!\d)(\d{15})(?!\d)/;
    const mpMatch = cleanText.match(mpRegex);
    
    if (mpMatch) {
      // Intentar buscar Projektnummer (5-6 dígitos)
      // Regex mejorada para detectar "P: 123456" o "Projekt: 123456"
      const projektRegex = /(?:P:|p:|Projekt:|project\s*id\s*[:=]\s*)?(\d{5,6})(?!\d)/i;
      const pMatch = cleanText.match(projektRegex);

      return {
        type: 'meinungsplatz',
        name: 'Meinungsplatz',
        icon: 'bi-shield-lock',
        color: '#30E8BF', // SJ Green
        data: {
          userId: mpMatch[1],
          projektnummer: pMatch ? pMatch[1] : null, // Si es null, la UI pedirá ingresarlo
          raw: cleanText
        }
      };
    }

    // 2. SAMPLICIO (Hostnames y RIDs)
    // Lógica portada de: api_generate_samplicio.php
    if (cleanText.includes('samplicio.us') || cleanText.includes('notch.insights.supply') || /[?&](RID|SSID)=/i.test(cleanText)) {
      // Extraer Hostname
      let hostname = null;
      try {
        const urlObj = new URL(cleanText.startsWith('http') ? cleanText : `https://${cleanText}`);
        hostname = urlObj.hostname.replace(/^www\./, '');
      } catch (e) {
        // Si no es URL válida, intentamos extraer hostname del texto
        const hostMatch = cleanText.match(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
        if (hostMatch) hostname = hostMatch[1];
      }

      // Extraer RID o SSID
      const ridMatch = cleanText.match(/[?&](RID|SSID)=([^&]+)/i);
      
      if (hostname || ridMatch) {
        return {
          type: 'samplicio',
          name: 'Samplicio.us',
          icon: 'bi-intersect', // Icono representativo
          color: '#8B5CF6', // Purple
          data: {
            hostname: hostname,
            rid: ridMatch ? ridMatch[2] : null,
            raw: cleanText
          }
        };
      }
    }

    // 3. OPENSURVEY / REPPULIKA
    // Lógica portada de: opensurvey.php
    if (cleanText.includes('opensurvey.com') || cleanText.includes('talkonlinepanel') || cleanText.includes('reppublika')) {
      const accountMatch = cleanText.match(/[?&]account=([^&]+)/i);
      const projectMatch = cleanText.match(/[?&]project=([^&]+)/i);
      const uuidMatch = cleanText.match(/[?&]uuid=([^&]+)/i);

      return {
        type: 'opensurvey',
        name: 'Opensurvey',
        icon: 'bi-lightning-charge',
        color: '#EF4444', // Red
        data: {
          isCompleteLink: cleanText.includes('statusBack=1'),
          account: accountMatch ? accountMatch[1] : null,
          project: projectMatch ? projectMatch[1] : null,
          uuid: uuidMatch ? uuidMatch[1] : null,
          raw: cleanText
        }
      };
    }

    // 4. M3 GLOBAL
    // Lógica portada de: api_generate_m3global.php
    if (cleanText.includes('m3global') || (cleanText.includes('survey_key') && cleanText.includes('user_id'))) {
      const keyMatch = cleanText.match(/[?&]survey_key=([^&]+)/i);
      const userMatch = cleanText.match(/[?&]user_id=([^&]+)/i);
      
      return {
        type: 'm3global',
        name: 'M3 Global',
        icon: 'bi-heart-pulse',
        color: '#3B82F6', // Blue
        data: {
          surveyKey: keyMatch ? keyMatch[1] : null,
          userId: userMatch ? userMatch[1] : null
        }
      };
    }

    // 5. HORIZOOM
    // Lógica portada de: api_generate_horizoom.php
    if (cleanText.includes('horizoom') || cleanText.includes('i_survey') || /[?&]a=/.test(cleanText)) {
      const iSurveyMatch = cleanText.match(/[?&](i_survey|a)=([^&]+)/i);
      return {
        type: 'horizoom',
        name: 'Horizoom',
        icon: 'bi-broadcast-pin',
        color: '#D946EF', // Fuchsia
        data: {
          iSurvey: iSurveyMatch ? iSurveyMatch[2] : null
        }
      };
    }

    // 6. MARKETMIND
    // Lógica portada de: api_generate_marketmind.php
    if (cleanText.includes('marketmind') || (cleanText.includes('study=') && cleanText.includes('id='))) {
      const studyMatch = cleanText.match(/[?&]study=([^&]+)/i);
      const idMatch = cleanText.match(/[?&]id=([^&]+)/i);
      return {
        type: 'marketmind',
        name: 'MarketMind',
        icon: 'bi-bar-chart',
        color: '#10B981', // Emerald
        data: {
          study: studyMatch ? studyMatch[1] : null,
          id: idMatch ? idMatch[1] : null
        }
      };
    }

    // 7. OPINION EXCHANGE
    // Lógica portada de: api_generate_opinionex.php
    if (cleanText.includes('opex.panelmembers') || cleanText.includes('UserID=')) {
      const userMatch = cleanText.match(/[?&]UserID=([^&]+)/i);
      return {
        type: 'opinionexchange',
        name: 'OpinionExchange',
        icon: 'bi-person-badge',
        color: '#F97316', // Orange
        data: {
          userId: userMatch ? userMatch[1] : null
        }
      };
    }

    return null; // No reconocido
  }
}

export default UrlDetector;