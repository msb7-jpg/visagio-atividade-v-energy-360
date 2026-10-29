import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { describeSubmitError, parseValidationErrors } from '@/features/loss_management/utils/apiFieldErrors'

function buildApiError(status: number, detail: unknown): AxiosError {
  const response = { status, statusText: '', headers: {}, config: {}, data: { detail } } as AxiosResponse
  return new AxiosError('falhou', String(status), undefined, undefined, response)
}

describe('parseValidationErrors', () => {
  it('liga cada mensagem do 422 ao campo do corpo e tira o prefixo em inglês das regras do backend', () => {
    const error = buildApiError(422, [
      { loc: ['body', 'data_inspecao'], msg: 'Value error, A data da inspeção não pode ser futura.', type: 'value_error' },
      { loc: ['body', 'inspetor'], msg: "Value error, Inspetor 'X' inválido: use um código de INSP-001 a INSP-040.", type: 'value_error' }
    ])

    expect(parseValidationErrors(error)).toEqual({
      fields: {
        data_inspecao: 'A data da inspeção não pode ser futura.',
        inspetor: "Inspetor 'X' inválido: use um código de INSP-001 a INSP-040."
      },
      general: null
    })
  })

  it('traduz as mensagens padrão do Pydantic e usa um texto genérico para tipos desconhecidos', () => {
    const error = buildApiError(422, [
      { loc: ['body', 'motivo_cancelamento'], msg: 'Input should be ...', type: 'enum' },
      { loc: ['body', 'kwh_recuperado'], msg: 'whatever', type: 'tipo_desconhecido' }
    ])

    expect(parseValidationErrors(error).fields).toEqual({
      motivo_cancelamento: 'Escolha uma das opções da lista.',
      kwh_recuperado: 'Valor inválido.'
    })
  })

  it('manda para a mensagem geral o erro que o servidor não ligou a um campo', () => {
    const error = buildApiError(422, [
      { loc: ['body'], msg: 'Value error, Informe o motivo do cancelamento.', type: 'value_error' }
    ])

    expect(parseValidationErrors(error)).toEqual({ fields: {}, general: 'Informe o motivo do cancelamento.' })
  })

  it('devolve vazio quando o erro não é um 422 de validação', () => {
    expect(parseValidationErrors(buildApiError(409, 'Conflito'))).toEqual({ fields: {}, general: null })
    expect(parseValidationErrors(new Error('rede'))).toEqual({ fields: {}, general: null })
  })
})

describe('describeSubmitError', () => {
  it('não acusa erro quando a mutação não falhou', () => {
    expect(describeSubmitError(null)).toEqual({ fields: {}, message: null })
  })

  it('deixa o rodapé vazio quando o 422 já está ao lado dos campos', () => {
    const error = buildApiError(422, [{ loc: ['body', 'inspetor'], msg: 'Field required', type: 'missing' }])

    expect(describeSubmitError(error)).toEqual({ fields: { inspetor: 'Campo obrigatório.' }, message: null })
  })

  it('usa a mensagem da API no rodapé para os demais erros', () => {
    expect(describeSubmitError(buildApiError(409, 'Transição de status inválida.'))).toEqual({
      fields: {},
      message: 'Transição de status inválida.'
    })
  })

  it('usa o texto genérico em pt-BR quando não há resposta do servidor', () => {
    expect(describeSubmitError(new Error('rede')).message).toBe('Não foi possível concluir a operação. Tente novamente.')
  })
})
