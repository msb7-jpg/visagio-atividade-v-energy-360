import '@testing-library/jest-dom/vitest'

// O jsdom não implementa estas duas APIs, e o `cmdk` (busca de UC e de inspetor) as chama ao montar a lista.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollIntoView ??= () => undefined
