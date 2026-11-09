/**
 * Dicionário canônico das perguntas e dores literais dos stakeholders da V-Energy.
 * Extraído diretamente do briefing oficial do projeto (atividade.pdf).
 * Chaves mapeadas conforme os caminhos de roteamento do NAV_ITEMS (/dashboard, /revenue, /losses, etc).
 */

export interface CaseQuestionItem {
  stakeholder: string
  role: string
  quote: string
}

export const CASE_QUESTIONS_BY_PATH: Record<string, CaseQuestionItem> = {
  // Tela: Painel Executivo (Diretoria / Visão Geral)
  '/': {
    stakeholder: 'Patrícia Lins',
    role: 'Diretora de Tecnologia (atividade.pdf, pág. 2)',
    quote:
      '"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. [...]"'
  },
  '/dashboard': {
    stakeholder: 'Patrícia Lins',
    role: 'Diretora de Tecnologia (atividade.pdf, pág. 2)',
    quote:
      '"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. [...]"'
  },

  // Tela: Inteligência Comercial
  '/revenue': {
    stakeholder: 'Henrique Duarte',
    role: 'Diretoria Comercial (atividade.pdf, pág. 2 e 6)',
    quote:
      '"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião. [...] Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."'
  },
  '/comercial': {
    stakeholder: 'Henrique Duarte',
    role: 'Diretoria Comercial (atividade.pdf, pág. 2 e 6)',
    quote:
      '"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião. [...] Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."'
  },

  // Tela: Gestão de Perdas & Fila de Fiscalização
  '/losses': {
    stakeholder: 'Rafael Coutinho',
    role: 'Gerência de Perdas (atividade.pdf, pág. 6)',
    quote:
      '"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."'
  },
  '/perdas': {
    stakeholder: 'Rafael Coutinho',
    role: 'Gerência de Perdas (atividade.pdf, pág. 6)',
    quote:
      '"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."'
  },

  // Tela: Qualidade da Rede (DEC e FEC)
  '/quality': {
    stakeholder: 'Beatriz Farias',
    role: 'Gerência de Operação (atividade.pdf, pág. 6)',
    quote:
      '"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."'
  },
  '/qualidade': {
    stakeholder: 'Beatriz Farias',
    role: 'Gerência de Operação (atividade.pdf, pág. 6)',
    quote:
      '"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."'
  },

  // Tela: Visão 360 da Unidade Consumidora
  '/customers': {
    stakeholder: 'Camila Barreto',
    role: 'Gerência de Atendimento (atividade.pdf, pág. 6)',
    quote:
      '"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."'
  },
  '/atendimento': {
    stakeholder: 'Camila Barreto',
    role: 'Gerência de Atendimento (atividade.pdf, pág. 6)',
    quote:
      '"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."'
  }
}

/** Pergunta para o assistente de IA Text-to-SQL (chat). */
export const CHAT_CASE_QUESTION: CaseQuestionItem = {
  stakeholder: 'Patrícia Lins & Henrique Duarte',
  role: 'Diretoria de Tecnologia e Comercial (atividade.pdf, pág. 2 e 7)',
  quote:
    '"[...] Quero que qualquer pessoa da empresa faça uma pergunta em português e receba a resposta na hora, sem abrir chamado para o meu time. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter."'
}
