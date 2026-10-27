import { describe, expect, it } from 'vitest'
import { isSearchable, normalizeIdUc, normalizeSearchText } from '@/features/customer360/utils/searchTerms'

describe('normalizeIdUc', () => {
  it.each(['UC100004', 'uc100004', ' uc 100004 ', 'UC-100004', '100004', '100.004'])('aceita %s', (typedText) => {
    expect(normalizeIdUc(typedText)).toBe('UC100004')
  })
})

describe('isSearchable', () => {
  it.each([['10', false], [' u c ', false], ['100', true], ['UC1', true]])('%s -> %s', (typedText, expected) => {
    expect(isSearchable(typedText)).toBe(expected)
  })
})

describe('normalizeSearchText', () => {
  it('mantém um espaço entre as palavras do nome', () => {
    expect(normalizeSearchText('  maria   da silva ')).toBe('maria da silva')
  })
})
