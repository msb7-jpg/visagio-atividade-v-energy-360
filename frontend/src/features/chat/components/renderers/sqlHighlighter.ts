import type { HighlighterCore } from 'shiki/core'

const DARK_THEME = 'vitesse-dark'
const LIGHT_THEME = 'vitesse-light'

let highlighterPromise: Promise<HighlighterCore> | null = null

/**
 * Carrega só a gramática de SQL e os dois temas usados, em vez do pacote completo do Shiki (centenas de linguagens).
 * O realce usa o motor JavaScript, sem o WebAssembly do Oniguruma.
 *
 * @returns Realçador compartilhado, criado na primeira chamada.
 */
function loadHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/dist/langs/sql.mjs'),
    import('shiki/dist/themes/vitesse-dark.mjs'),
    import('shiki/dist/themes/vitesse-light.mjs')
  ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }, sql, dark, light]) =>
    createHighlighterCore({
      langs: [sql.default],
      themes: [dark.default, light.default],
      engine: createJavaScriptRegexEngine()
    })
  )
  return highlighterPromise
}

/**
 * Texto com os caracteres especiais de HTML escapados, para exibir a consulta sem interpretá-la.
 *
 * @param text - Texto bruto.
 * @returns Texto seguro para ir dentro de um elemento HTML.
 */
export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

/**
 * Converte a consulta SQL em HTML realçado no tema do portal.
 *
 * @param query - Consulta SQL.
 * @param isDark - Se o portal está no tema escuro.
 * @returns HTML do bloco de código realçado.
 */
export async function highlightSql(query: string, isDark: boolean): Promise<string> {
  const highlighter = await loadHighlighter()
  return highlighter.codeToHtml(query, { lang: 'sql', theme: isDark ? DARK_THEME : LIGHT_THEME })
}
