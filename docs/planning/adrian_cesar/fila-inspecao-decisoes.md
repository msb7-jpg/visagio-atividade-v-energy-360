# Fila de Inspeção — decisões (28/10/2026)

P1 Score: manter kWh esperado × chance de acerto (código). Atualizar protótipo, subtítulo e detalhe.

P2 Motivos: manter os 3 do código. Sem novos motivos nesta entrega.

P3 Colunas novas em ordem_inspecao: só data_inspecao, inspetor (código INSP-001..040, da lista) e motivo_cancelamento (lista). Sem executar_ate, distribuição e observações.

P4 Tarifa: receita ÷ energia faturada dos últimos 12 meses, calculada de fato_faturamento e exposta em tarifa_rs_kwh. Não usar média simples de tarifa_aplicada.

P5 Exportar: tirar o botão da aba Fila; manter "Exportar planilha de campo" (ordens ativas) na aba Ordens. Atualizar o protótipo.

P6 Importação: prévia com dry_run só se houver tempo no dia 6; senão, manter envio direto.

P7 Status na API: manter gerada/pendente e traduzir no front.

P8 Score mínimo: continua removido.

P9 Capacidade: contar ordens ativas; texto "ordens abertas".

P10 Escrita: só gerente_perdas faz POST/PATCH/upload; diretor só lê e não vê botões de ação.

P11 Upload: rejeitar linha sem ordem correspondente e mostrar o motivo.

P12 Shell (busca, ChatDrawer, Sobre os dados): fora desta fatia.

P13 Retorno esperado: soma de kwh_mes_recuperavel × probabilidade_acerto de cada UC selecionada, não a taxa histórica global. A taxa de 62,7% continua no card "Taxa de acerto".

Fila curta: este mês há 19 UCs prioritárias para 200 inspeções. [decidir: mostrar isso na tela ou rever os critérios de entrada]

Fora desta entrega: exportar fila de UCs, paginação no servidor, E2E Playwright, média de vizinhos no detalhe.