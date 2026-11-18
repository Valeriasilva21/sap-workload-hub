import { useEffect } from 'react'
import { usePersistentState } from './usePersistentState'

/**
 * Tema de la app: 'auto' sigue la apariencia del sistema (macOS / iOS),
 * 'light' y 'dark' la fuerzan con una clase en <html>.
 * index.html aplica la misma clase antes del primer render para evitar parpadeos.
 */
export function useTheme() {
  const [theme, setTheme] = usePersistentState('hub:theme', 'auto')
  useEffect(() => {
    const el = document.documentElement
    el.classList.remove('light', 'dark')
    if (theme !== 'auto') el.classList.add(theme)
  }, [theme])
  return [theme, setTheme]
}
