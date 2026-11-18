import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build funciona en GitHub Pages (https://usuario.github.io/repositorio/)
  // y en cualquier otro hosting estático sin cambiar nada.
  base: './',
})
