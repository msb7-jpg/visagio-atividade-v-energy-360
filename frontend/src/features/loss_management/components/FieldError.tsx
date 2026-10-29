interface FieldErrorProps {
  id: string
  message: string | null | undefined
}

/**
 * Mensagem de erro de um campo, ligada a ele por `aria-describedby` e anunciada por `role="alert"`.
 *
 * @param props - Id do elemento de erro e a mensagem (nada é exibido sem mensagem).
 * @returns Texto de erro em destructive, ou nada.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  return message ? <p id={id} className="text-destructive text-xs" role="alert">{message}</p> : null
}
