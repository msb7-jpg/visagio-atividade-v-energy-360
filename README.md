# ⚡ V-Energy Grid 360

Plataforma inteligente de análise de dados e indicadores regulatórios do setor elétrico brasileiro (DEC, FEC, consumo, tarifas e mercado). A solução integra um **Portal Web moderno em React 19** com um **Agente Analítico de Inteligência Artificial Text-to-SQL (FastAPI + LangGraph)** capaz de responder dúvidas de negócio e gerar gráficos automaticamente em tempo real.

---

## 🚀 Como Rodar o Projeto (Guia Rápido)

O projeto é gerenciado via [`Makefile`](Makefile) (Linux/macOS) ou via [`scripts/dev.ps1`](scripts/dev.ps1) (Windows, sem precisar do `make`).

### Pré-requisitos
- [uv](https://docs.astral.sh/uv/) (gerenciador rápido para Python 3.12+); no Windows, `pip install --user uv` também funciona
- [bun](https://bun.sh/) (runtime e gerenciador de pacotes para JavaScript/TypeScript); no Windows, `npm install -g bun` também funciona
- `make` (apenas Linux/macOS)
- Os arquivos `base_dados_1.zip` e `base_dados_2.zip` na raiz do projeto (fora do git)

### Passo a Passo (Linux/macOS)

```bash
# 1. Configurar dependências e ambientes virtuais (backend + frontend)
make setup-all

# 2. Descompactar as bases de dados históricas para data/landing/
make data-unzip

# 3. Iniciar o Backend FastAPI (:8000) com Swagger em http://localhost:8000/docs
make run-backend

# 4. Iniciar o Frontend React 19 (:5173) em http://localhost:5173
make run-frontend
```

### Passo a Passo (Windows / PowerShell)

```powershell
# 1. Instalar dependências do backend e do frontend
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 setup

# 2. Descompactar as bases para data\landing
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 data

# 3. Subir backend (:8000, em outra janela) e frontend (:5173) juntos
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 dev

# Para usar outro banco SQLite (ex: o de testes gerado com o comando "seed"):
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 seed
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 dev -Database backend\v_energy_dev.db
```

Demais comandos: `backend`, `frontend`, `lint`, `test` e `check` (lint, testes, TypeScript e build). `scripts\dev.ps1 help` lista todos.

### Inteligência Artificial (`backend/.env`)

O agente Text-to-SQL (LangGraph) fica em [`backend/app/agent/`](backend/app/agent/), dentro da API, e não numa pasta `ai-agent/` separada: ele usa a mesma autenticação, o mesmo banco somente leitura e o mesmo deploy do backend. O chat aparece no canto da tela em todas as páginas, e o insight automático fica no Painel do Diretor.

Copie [`backend/.env.example`](backend/.env.example) para `backend/.env` e escolha um provedor:

| Provedor | O que preencher |
|---|---|
| Google Gemini | `GEMINI_API_KEY="..."` e `AI_MODEL_NAME` (o case recomenda o Gemini 3.1 Flash-Lite; o `.env.example` vem com `gemini-2.5-flash-lite`) |
| OpenRouter | `AI_PROVIDER="openrouter"`, `OPENROUTER_API_KEY="..."` e o modelo |
| Modelo local (llama.cpp, `make run-llm`) | `AI_PROVIDER="local"` e `AI_BASE_URL="http://localhost:1234/v1"` |

**Sem nenhum provedor configurado, a IA fica indisponível e avisa:** o chat responde "Assistente de IA indisponível" com o passo a passo acima, e o insight do Painel não aparece. Nada é inventado. Para uma demonstração sem internet, `AI_PROVIDER="mock"` liga respostas fixas, sempre marcadas como "Modo demonstração".

---

## 🧱 Pipeline de Dados (Databricks)

O banco `backend/v_energy.db` usado pelo portal e pela IA é gerado por um pipeline **Bronze → Silver → Gold** no Databricks, orquestrado por um Workflow e exportado em CSV e SQLite.

| Peça | Onde está |
|---|---|
| Notebooks (`.ipynb`) | [`data-engineering/notebooks/`](data-engineering/notebooks/) |
| Workflow (Job) | [`data-engineering/job.yaml`](data-engineering/job.yaml), implantado pelo bundle [`data-engineering/databricks.yml`](data-engineering/databricks.yml) |
| Fonte externa (limites ANEEL de DEC/FEC) | [`data-engineering/reference/aneel_limites_continuidade.csv`](data-engineering/reference/aneel_limites_continuidade.csv) |
| Dicionário de dados da Gold | [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) |
| Decisões e suposições (ADRs) | [`docs/DECISOES.md`](docs/DECISOES.md) |

Tudo fica no catálogo `visagio_atividade_v_energy_360`, com um schema por camada (`bronze`, `silver`, `gold`). O Workflow roda as tarefas de cada fatia em paralelo quando possível, executa os **testes de qualidade** das duas fatias e só então exporta: se algum teste falhar, o job para e o portal continua com os últimos dados bons.

### Como executar

Pré-requisitos: [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install.html) autenticado (`databricks auth login --host https://<seu-workspace>`) e as bases descompactadas (`make data-unzip`).

```bash
# 1. Criar catálogo, schema e Volume de landing (no Free Edition, rode no SQL Editor do Databricks):
#    CREATE CATALOG IF NOT EXISTS visagio_atividade_v_energy_360;
#    CREATE SCHEMA IF NOT EXISTS visagio_atividade_v_energy_360.bronze;
#    CREATE VOLUME IF NOT EXISTS visagio_atividade_v_energy_360.bronze.landing;

# 2. Enviar os arquivos brutos e a fonte externa da ANEEL para o Volume de landing
databricks fs cp -r data/landing/ dbfs:/Volumes/visagio_atividade_v_energy_360/bronze/landing/ --overwrite
databricks fs cp data-engineering/reference/aneel_limites_continuidade.csv \
  dbfs:/Volumes/visagio_atividade_v_energy_360/bronze/landing/ --overwrite

# 3. Importar os notebooks para uma pasta do workspace
databricks workspace import-dir data-engineering/notebooks /Workspace/V_Energy_Analytics --overwrite

# 4. Implantar e rodar o Workflow (prod mantém a agenda; sem -t prod, o job de teste fica pausado)
cd data-engineering
databricks bundle deploy -t prod --var="notebooks_dir=/Workspace/V_Energy_Analytics"
databricks bundle run -t prod Job_Energy --var="notebooks_dir=/Workspace/V_Energy_Analytics"

# 5. Baixar o banco gerado para o backend
cd ..
databricks fs cp dbfs:/Volumes/visagio_atividade_v_energy_360/gold/exports/v_energy.db backend/v_energy.db --overwrite
```

As tabelas Gold também ficam em CSV (um arquivo por tabela) em `/Volumes/visagio_atividade_v_energy_360/gold/exports/`.

Ao trocar o `backend/v_energy.db`, apague também o `v_energy.db-wal` e o `v_energy.db-shm` da mesma pasta e reinicie a API. O banco fica em modo WAL: um `-wal` do banco antigo faz o SQLite acusar "database disk image is malformed", e o Painel guarda os indicadores em cache.

### Estratégia de agendamento

O Workflow roda **todo dia 1º, às 04h (horário de Recife)**. Faturamento, leituras e indicadores DEC/FEC são fechados por **competência mensal**, então reprocessar uma vez por mês, logo após o fechamento, entrega o mês completo sem gastar computação com dados que não mudaram. A madrugada evita concorrência com o uso do portal, e uma execução por vez (`max_concurrent_runs: 1`) impede que duas cargas gravem o `v_energy.db` ao mesmo tempo.

### Execução bem-sucedida do Workflow

Execução de ponta a ponta do Workflow no Databricks, com todas as tarefas concluídas com sucesso:

![Execução bem-sucedida do Workflow no Databricks](docs/img/workflow_databricks.png)

---

## 📋 Suposições e Demonstração por Fatia

Cada fatia descreve aqui o que assumiu e como demonstrar o que entregou. As decisões completas, com números e alternativas descartadas, ficam em `docs/`.

### 📊 Fatia 03: Painel do Diretor e Visão 360 da UC

**Painel do Diretor** (`/dashboard`, perfil `diretor`). Responde ao diretor: **o negócio melhorou ou piorou entre dois períodos?** São onze indicadores em cinco áreas, cada um com o valor dos dois períodos, a variação e o selo "Melhorou", "Piorou" ou "Estável". Ao lado ficam o retrato da Fila de Perdas e o insight da IA.

**Visão 360 da UC** (`/customers`, perfis `atendente`, `gerente_atendimento`, `gerente_perdas`, `gerente_operacao` e `diretor`). Responde ao atendente: **por que a conta deste cliente veio alta, e a rua dele ficou sem luz?** O atendente busca pelo número da UC, do medidor ou pelo nome do titular e vê cadastro, consumo de 12 meses contra o ano anterior, faturas, interrupções, chamados e inspeções de perdas, com o diagnóstico da conta alta em frases prontas.

Os usuários de teste estão em [`backend/app/core/config.py`](backend/app/core/config.py) (senha `venergy123`).

**Como demonstrar**

- **Painel:** entre como `diretor@venergy.com`. Os períodos padrão comparam jul/2022–jun/2023 com jul/2025–jun/2026: faturamento **+8,0%**, energia faturada **−5,1%** e tarifa média **+13,8%**. Troque os períodos no seletor; as janelas ficam no endereço da página. Passe o mouse no nome de cada indicador para ver como ele é calculado.
- **Retrato de perdas no Painel:** sem configurar nada, mostra **7 UCs prioritárias de 165 na fila** (2026-06). Com `LOSS_REFERENCE_COMPETENCIA="2025-09"` (ver Fatia 05), mostra **587 prioritárias de 39.243** e retorno esperado de **R$ 1,53 mi/ano**.
- **Visão 360:** entre como `atendimento@venergy.com` e busque `UC100094` (ou só `100094`, ou parte do nome do titular). Essa UC tem faturas em aberto, interrupções, chamados e uma inspeção de perdas, então todas as abas têm dados.

**Suposições**

| Suposição | Valor | Onde está o detalhe |
|---|---|---|
| Períodos padrão do Painel | base jul/2022–jun/2023 e atual jul/2025–jun/2026, os mesmos da Receita e do diagnóstico | ADR-010 |
| "Estável" no Painel | variação abaixo de 1%; indicadores em % são avaliados pela diferença em pontos percentuais | ADR-011 |
| DEC e FEC do Painel | horas e interrupções divididas pelas UCs atendidas da Gold, a mesma base da Qualidade da Rede; aviso quando o período inclui o temporal de jul/2025 | ADR-012 |
| Inadimplência | valor das faturas `VENCIDA` ÷ valor faturado; faturas `ABERTA` ainda estão no prazo e não contam | ADR-013 |
| Perdas no Painel | retrato atual, sem comparação (as inspeções só cobrem ago–dez/2025); conta só as UCs prioritárias | ADR-014 e ADR-028 |
| Consumo "subiu" ou "caiu" na Visão 360 | mais de 10% contra o mesmo mês do ano anterior | ADR-017 |
| Diagnóstico da conta alta | cinco causas: consumo, leitura estimada, dias faturados, bandeira e preço médio do kWh; o reajuste não é isolado porque não existe na Gold | ADR-018 |
| Janela da Visão 360 | 12 meses até a última leitura da própria UC; os totais só somam meses que existem nos dois anos | ADR-019 |
| Falta de luz | interrupções da própria UC depois da ligação; a região é "acima do normal" quando o alimentador passa de 1,5 vez a própria média, sem limite ANEEL | ADR-020 |

**Limites conhecidos**
- O Painel calcula outro par de períodos em cerca de 2,5 s na primeira vez; os períodos padrão abrem na hora, porque são calculados na subida da API (ADR-016). Ao trocar o `v_energy.db`, reinicie a API para limpar o cache.

Detalhes: [`docs/DECISOES.md`](docs/DECISOES.md) (ADR-010 a ADR-023 e ADR-028) e os planos em [`docs/planning/bernardo/`](docs/planning/bernardo/painel_diretor.md).

### 🔎 Fatia 05: Gestão de Perdas e Fila de Inspeção

Responde ao gerente de perdas: **quais UCs mandar a campo primeiro**. No portal (`/losses`, perfil `gerente_perdas`; os usuários de teste estão em [`backend/app/core/config.py`](backend/app/core/config.py)) o gerente vê a fila priorizada, abre cada UC para entender por que ela está lá (motivo, conta do score, consumo de 12 meses e inspeções anteriores), gera ordens de inspeção, exporta a planilha para a equipe de campo e importa os resultados de volta.

**Como a fila é montada**
1. Entra a UC **sem geração distribuída** (painel solar) cujo consumo médio dos 3 últimos meses caiu **20% ou mais** frente aos 12 anteriores, ou que tem leitura zerada, e que não teve inspeção concluída nos últimos 15 meses.
2. Cada UC recebe uma **chance de acerto histórica**, e a fila ordena pelo **kWh esperado** (kWh a recuperar × chance). O score de 0 a 100 é relativo à primeira UC da fila inteira e não muda com os filtros.
3. A tela separa **Prioritárias** (chance de 30% ou mais), **Baixa chance** e **Todas**, e avisa quando as prioritárias passam da capacidade de 200 inspeções por mês.

**Como demonstrar**

- **Sem configurar nada**, a fila usa a competência mais recente dos dados (2026-06): **165 UCs, 7 prioritárias e 158 de baixa chance**. É curta de propósito: as 559 maiores quedas do mês são de UCs com painel solar, que a fila exclui, e 491 das 656 candidatas restantes já foram inspecionadas pelo campo em 2025.
- **Para ver a fila na onda de quedas de 2025**, em `backend/.env` (copie de [`backend/.env.example`](backend/.env.example)) descomente `LOSS_REFERENCE_COMPETENCIA="2025-09"` e reinicie o backend. A tela mostra o aviso "Competência de referência fixada". Nessa competência a fila tem **39.243 UCs**, quase todas de baixa chance, porque a carteira inteira perdeu consumo em 2025 e a maioria das UCs passa do piso de queda; o que vale é o topo, e as páginas levam alguns segundos. Das 200 primeiras, **196 foram inspecionadas depois, com 93,9% de acerto**, contra 62,7% de todas as inspeções do período (medição e causa no [D9](docs/DECISOES_PERDAS.md)). Para voltar ao tempo real, comente a linha e reinicie.
- **Roteiro:** "Selecionar top 10 prioritárias" → "Gerar ordens" → aba "Ordens de inspeção" → "Exportar planilha de campo" → "Importar resultados de campo" (a planilha `inspecoes.xlsx` do case ou a exportada pelo portal). As ordens ficam na tabela `ordem_inspecao` do `backend/v_energy.db`, que não vai para o Git.

**Suposições**

| Suposição | Valor | Onde está o detalhe |
|---|---|---|
| Entrada na fila | queda de 20% ou mais (3 meses contra 12), UC sem GD | D2 e D3 |
| Chance de acerto | 93% na queda de 50% ou mais; 91,5% na queda moderada quando a queda além da carteira é de 20% ou mais, e 7,6% abaixo disso | D2 e D12 |
| Leitura zerada | 62,7% (a taxa geral): **suposição**, o sinal nunca ocorre nos dados | D2 e D12 |
| Ligação recente | menos de 11 meses de base recebe só 7,6%: prudência, não medição | D14 |
| Energia a recuperar | déficit mensal × 3 meses; em campo o recuperado foi 1,87× o estimado (mediana), então subestima o valor absoluto | D7 |
| Valor em R$ | tarifa média ponderada dos 12 últimos meses de faturamento: R$ 0,7876/kWh | D8 |
| Capacidade | 200 inspeções por mês, a fala do gerente | D6 |
| Dados | consumo negativo é descartado; datas com hífen na planilha do campo são mês-dia-ano | D5 e D10 |

**O que a fila não garante**
- As taxas de acerto vêm de UCs que o campo **já escolhera** inspecionar. Ninguém de fora da fila foi visitado, então não se sabe o que ela deixa de ver. Há um protocolo de piloto proposto (D13), não executado.
- **Reincidência:** nenhuma UC foi inspecionada duas vezes, então o prazo para uma UC voltar à fila depois de uma irregularidade segue em aberto, à espera da equipe.

Detalhes e medições: [`docs/DECISOES_PERDAS.md`](docs/DECISOES_PERDAS.md) (D1 a D15) e o plano da fatia em [`docs/planning/adrian_cesar/`](docs/planning/adrian_cesar/gestao_perdas_campo.md).

---

## 🧪 Testes e Qualidade

O repositório possui uma suíte completa de testes automatizados e análise estática:

```bash
# Executa todos os linters do monorepo (Ruff + Pylint + import-linter + ESLint + Fallow)
make lint-all

# Executa todos os testes unitários e de integração (pytest no backend, vitest no frontend)
make test-all
```

Se preferir validar apenas um dos módulos:
- **Backend:** `make lint-backend` e `cd backend && uv run pytest`
- **Frontend:** `make lint-frontend` e `cd frontend && bun run test`
- **Windows:** `scripts\dev.ps1 lint`, `scripts\dev.ps1 test` ou `scripts\dev.ps1 check` (tudo, igual ao CI)

### Integração Contínua (GitHub Actions)

Todo pull request e todo push na `main` rodam o workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), em dois jobs paralelos:
- **Backend:** Ruff, Pylint, import-linter e pytest, com as dependências instaladas pelo `uv.lock` congelado.
- **Frontend:** ESLint, Fallow, TypeScript, Vitest e build de produção, com o `bun.lock` congelado.

Um PR com qualquer etapa vermelha não deve ser mergeado.

---

## 🏗️ Arquitetura e Lógica da Codebase

### 1. Backend (Python 3.12, FastAPI, LangGraph, uv)
O backend é estruturado em **Fatias Verticais (*Vertical Slices*)** e adota os princípios de **Clean Architecture**:

### 2. Frontend (React 19, TypeScript, Vite, Bun)
- **Design System Shadcn & Radix UI:** Componentes modulares padronizados em `src/components/ui/`.
- **Governança de Estado Assíncrono com TanStack Query v5:** Consultas otimizadas com cancelamento automático de requisições obsoletas (`signal`).
- **Streaming em Tempo Real:** Renderização progressiva dos passos de raciocínio do agente, código SQL e respostas executivas estruturadas.

---

## 🛡️ Principais Regras e Guardrails de Engenharia

Para manter a codebase limpa, sustentável e livre de "God Files", regras estritas são validadas em tempo de build:

| Ferramenta | O que Valida | Regra Não-Negociável |
|---|---|---|
| **Pylint** | Tamanho de arquivos e métodos | Máximo de **300 linhas por módulo** (`max-module-lines = 300`) e **45 statements por função**. |
| **Pylint** | Nomes de variáveis expressivos | **Proibidas variáveis monossílabas** (`k`, `v`, `n`, `m`, `i`, `val`, `temp`, `data`). Exija nomes que revelam o domínio (ex: `metric_key`, `outage_event`). |
| **Import-Linter** | Fronteiras de arquitetura limpa | **Serviços, Agentes e Banco de Dados** não podem importar `fastapi` ou acoplar camadas indevidas. |
| **Ruff** | Sintaxe e estilo PEP 8 | Linhas até 120 caracteres, remoção de imports não utilizados e regras modernas do Python 3.12. |
| **Fallow** | Saúde e complexidade do frontend | Componentes com **$\le 150$ linhas**, complexidade ciclomática e cognitiva **$\le 15$**, duplicação **$\le 5.0\%$**. |
| **Design System** | Consistência visual | **Proibido usar tags HTML nativas** (`<button>`, `<input>`) fora de `components/ui/` e proibido sobrescrever estilos base. |

> Consulte o arquivo [`AGENTS.md`](AGENTS.md) para as diretrizes detalhadas de desenvolvimento.

> Design system: https://designmd.app/library/saas-enterprise-analytics