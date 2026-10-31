export type Theme = 'dark' | 'light'

/** Chave do `localStorage` com a escolha de tema (a mesma lida pelo script de `index.html`). */
export const THEME_KEY = 'grid360.tema'

const DEFAULT_THEME: Theme = 'dark'
const TRANSITION_CLASS = 'theme-transition'
const TRANSITION_MS = 200

const themeListeners = new Set<() => void>()

/**
 * Tema salvo no navegador.
 *
 * @returns `'light'` só se foi escolhido; qualquer outro valor (ou armazenamento indisponível) cai no padrão escuro.
 */
export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Aplica o tema na página. A transição de cores (200 ms) é pulada com `prefers-reduced-motion: reduce`.
 *
 * @param theme - Tema a aplicar.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (!prefersReducedMotion()) {
    root.classList.add(TRANSITION_CLASS)
    window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS)
  }
  root.classList.toggle('dark', theme === 'dark')
}

/**
 * Salva a escolha, aplica o tema e avisa quem está ouvindo.
 *
 * @param theme - Tema escolhido.
 */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Falha ao salvar o tema no localStorage:', error)
  }
  applyTheme(theme)
  themeListeners.forEach((listener) => listener())
}

/**
 * Registra um ouvinte de mudança de tema (inclusive de outra aba).
 *
 * @param onChange - Função chamada quando o tema muda.
 * @returns Função que cancela o registro.
 */
export function subscribeTheme(onChange: () => void): () => void {
  themeListeners.add(onChange)
  const handleStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key === THEME_KEY) {
      applyTheme(getStoredTheme())
      onChange()
    }
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    themeListeners.delete(onChange)
    window.removeEventListener('storage', handleStorage)
  }
}
