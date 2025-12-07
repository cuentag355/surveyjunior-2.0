/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PALETA LIGHT VIVID (Restaurada)
        bg: {
          main: '#F8FAFC',    // Fondo principal (Slate 50)
          panel: '#FFFFFF',   // Tarjetas (Blanco Puro)
          sidebar: '#FFFFFF', // Sidebar Blanco
        },
        text: {
          main: '#0F172A',    // Negro Azulado (Slate 900)
          muted: '#64748B',   // Gris (Slate 500)
        },
        brand: {
          primary: '#4F46E5', // Indigo Vibrante
          secondary: '#06B6D4', // Cyan
          accent: '#8B5CF6',  // Violeta
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'float': '0 20px 40px -5px rgba(79, 70, 229, 0.15)',
        'btn': '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
      }
    },
  },
  plugins: [],
}