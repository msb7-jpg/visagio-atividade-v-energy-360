/** Blocos da ficha na ordem em que aparecem; o destino é o `id` da seção (`<id do título>-secao`). */
const CUSTOMER360_SECTIONS = [
  { id: 'bloco-cliente-consumo', step: '1', label: 'Consumo' },
  { id: 'bloco-financeiro', step: '2', label: 'Contas' },
  { id: 'bloco-tecnico', step: '3', label: 'Falta de luz e chamados' },
  { id: 'bloco-inspecoes', step: '4', label: 'Inspeções de perdas' }
] as const

/**
 * Atalhos para os blocos da ficha, fixos abaixo do cabeçalho do portal enquanto a página rola.
 *
 * @returns Navegação com um link numerado por bloco.
 */
export function SectionNav() {
  return (
    <nav
      aria-label="Blocos da ficha"
      className="bg-background border-border sticky top-14 z-30 -mx-1 flex flex-wrap gap-1 border-b px-1 py-2"
    >
      {CUSTOMER360_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}-secao`}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <span className="border-border flex size-5 items-center justify-center rounded-sm border text-xs">{section.step}</span>
          {section.label}
        </a>
      ))}
    </nav>
  )
}
