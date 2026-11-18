import { useEffect } from 'react'
import { usePersistentState } from './usePersistentState'

export const THEME_KEY = 'hub:theme'

/**
 * Tema de la app: 'light' (Light Glass, por defecto) o 'dark' (Dark Glass).
 * Se guarda en LocalStorage y se aplica como clase en <html>.
 * index.html aplica la misma clase antes del primer render para evitar parpadeos.
 */
export function useTheme() {
  const [stored, setTheme] = usePersistentState(THEME_KEY, 'light')
  const theme = stored === 'dark' ? 'dark' : 'light' // valores antiguos ('auto') → claro

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return [theme, toggleTheme]
}
