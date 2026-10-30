/**
 * Devolve a classe de movimento, ou nada quando o usuário pediu menos movimento (`prefers-reduced-motion`).
 * As classes `login-anim-*`, `login-motion` e `login-spin` ficam em `src/index.css`.
 *
 * @param reduced - Resultado de `useReducedMotion()`.
 * @param className - Classe(s) de movimento a aplicar.
 * @returns A classe, ou string vazia com movimento reduzido.
 */
export function motionClass(reduced: boolean, className: string): string {
  return reduced ? '' : className
}
