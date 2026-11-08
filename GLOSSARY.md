# V-Energy Grid 360 — Gestão de Perdas

Fila de Inspeção: lista de unidades consumidoras suspeitas de perda não técnica, ordenada pelo retorno esperado de inspecioná-las.

## Language

**Fila de Inspeção**:
Lista ordenada das UCs que merecem uma inspeção. O usuário decide quantas inspecionar conforme a capacidade da equipe.
_Avoid_: Fila priorizada, fila de suspeitas

**Sinal** (motivo de suspeita):
Indício de consumo anormal que coloca uma UC na fila, como queda de consumo ou leitura zerada.
_Avoid_: Motivo, alerta

**Chance de acerto**:
Probabilidade de uma inspeção encontrar irregularidade, medida no histórico de inspeções de campo.
_Avoid_: Taxa de acerto da UC, probabilidade de fraude

**kWh esperado**:
Energia que a inspeção deve recuperar, ponderada pela chance de acerto. É o critério de ordenação da fila.
_Avoid_: Retorno, ganho esperado

**Prioridade**:
Escala de 0 a 100 do kWh esperado de uma UC em relação ao topo da fila. Substitui a palavra "score" na conversa e na tela.
_Avoid_: Score, score de risco (para o número exibido)

**Ordem de inspeção**:
Pedido de visita de campo a uma UC, que passa de gerada a em campo e termina concluída ou cancelada.
_Avoid_: OS, tarefa

**Resultado de campo**:
O que a visita constatou numa ordem de inspeção: se encontrou irregularidade, a energia recuperada e quem inspecionou. Registrá-lo conclui a ordem.
_Avoid_: Achado (para o ato de registrar)

**Achado**:
Irregularidade que a visita constatou numa UC. Uma ordem é concluída com achado ou sem achado.

**Competência**:
Mês de referência de uma medição ou da análise da fila.
_Avoid_: Período, mês-base

**Sazonalidade**:
Variação normal do consumo ao longo do ano, que não indica irregularidade.

**Pares**:
Grupo de UCs da mesma classe de consumo, usado como referência para separar a variação sazonal de uma queda anormal.
_Avoid_: Carteira, coorte, grupo de comparação

**Queda relativa aos pares**:
Quanto o consumo recente de uma UC caiu além do que os pares caíram no mesmo período. Substitui a queda bruta como critério de entrada na fila.
_Avoid_: Queda normalizada, queda bruta (para o critério de entrada)
