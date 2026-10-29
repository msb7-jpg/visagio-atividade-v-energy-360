import { describe, expect, it } from 'vitest'
import { formatIrregularityType, formatPlaceName } from '@/features/loss_management/utils/textFormat'

describe('formatPlaceName', () => {
  it.each([
    ['JABOATAO DOS GUARARAPES', 'Jaboatão dos Guararapes'],
    ['CABO DE SANTO AGOSTINHO', 'Cabo de Santo Agostinho'],
    ['SAO LOURENCO DA MATA', 'São Lourenço da Mata'],
    ['ILHA DE ITAMARACA', 'Ilha de Itamaracá'],
    ['ARACOIABA', 'Araçoiaba'],
    ['ABREU E LIMA', 'Abreu e Lima'],
    ['PODER PUBLICO', 'Poder Público'],
    ['RESIDENCIAL', 'Residencial']
  ])('formata %s como %s', (rawName, expected) => {
    expect(formatPlaceName(rawName)).toBe(expected)
  })

  it('não altera um texto que já está formatado', () => {
    expect(formatPlaceName('São Lourenço da Mata')).toBe('São Lourenço da Mata')
  })

  it('mantém palavras desconhecidas só com a inicial maiúscula', () => {
    expect(formatPlaceName('CAMARAGIBE')).toBe('Camaragibe')
  })
})

describe('formatIrregularityType', () => {
  it.each([
    ['LIGACAO CLANDESTINA', 'Ligação clandestina'],
    ['BY-PASS', 'By-pass'],
    ['DESVIO DIRETO', 'Desvio direto'],
    ['MEDIDOR ADULTERADO', 'Medidor adulterado'],
    ['LACRE VIOLADO', 'Lacre violado']
  ])('formata %s como %s', (rawType, expected) => {
    expect(formatIrregularityType(rawType)).toBe(expected)
  })
})
