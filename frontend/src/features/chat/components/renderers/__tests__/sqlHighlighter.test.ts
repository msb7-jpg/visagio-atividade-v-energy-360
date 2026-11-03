import { describe, expect, it } from 'vitest'
import { escapeHtml, highlightSql } from '@/features/chat/components/renderers/sqlHighlighter'

describe('sqlHighlighter', () => {
  it('realça o SQL só com a gramática e o tema carregados', async () => {
    const html = await highlightSql('SELECT COUNT(*) FROM fato_faturamento', true)

    expect(html).toContain('<pre class="shiki vitesse-dark"')
    expect(html).toContain('SELECT')
  })

  it('escapa o texto da consulta quando o realce falha', () => {
    expect(escapeHtml('SELECT \'<b>\' & "x"')).toBe('SELECT \'&lt;b&gt;\' &amp; &quot;x&quot;')
  })
})
