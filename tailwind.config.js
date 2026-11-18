/** @type {import('tailwindcss').Config} */
// Paleta: grises pizarra (slate) + colores de estado de sistema Apple.
// Los valores viven como variables CSS en src/index.css, con versión clara y oscura,
// así todo el UI cambia de tema sin duplicar clases.

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const scale = (name) => Object.fromEntries(SHADES.map((k) => [k, `rgb(var(--${name}-${k}) / <alpha-value>)`]))

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Light Glass por defecto; la clase .dark en <html> activa Dark Glass (ver src/lib/useTheme.js).
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        slate: scale('slate'), // grises de sistema (label / fill / background)
        blue: scale('blue'), // systemBlue
        emerald: scale('emerald'), // systemGreen
        amber: scale('amber'), // systemOrange / systemYellow
        red: scale('red'), // estados críticos (tono rose)
        rose: scale('red'), // alias: rose y red comparten la misma escala adaptable
        surface: 'rgb(var(--surface) / <alpha-value>)', // tarjetas, hojas, barras
        white: 'rgb(var(--glass) / <alpha-value>)', // cristal: blanco en claro, pizarra profunda en oscuro
        snow: '#ffffff', // blanco real (texto sobre botones y badges de color)
        edge: 'rgb(var(--edge) / <alpha-value>)', // bordes del cristal
        ink: 'rgb(var(--ink) / <alpha-value>)', // separadores y rellenos translúcidos
      },
      boxShadow: {
        apple: '0 1px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.05)',
        'apple-lg': '0 2px 6px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
