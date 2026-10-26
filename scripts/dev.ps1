<#
.SYNOPSIS
    Equivalente do Makefile para Windows (PowerShell 5.1+), sem depender do make.

.DESCRIPTION
    Uso: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 <comando> [-Database <arquivo.db>]

    Comandos:
      help      Lista os comandos
      setup     Instala as dependências do backend (uv) e do frontend (bun)
      data      Extrai base_dados_1.zip e base_dados_2.zip para data\landing
      seed      Gera backend\v_energy_dev.db com os dados de teste da Visão 360
      backend   Sobe a API FastAPI em http://localhost:8000 (docs em /docs)
      frontend  Sobe o portal React em http://localhost:5173
      dev       Sobe backend (em outra janela) e frontend juntos
      lint      Ruff, Pylint, import-linter, ESLint e Fallow
      test      pytest e Vitest
      check     lint + test + TypeScript + build (o mesmo que o CI roda)

    -Database: arquivo SQLite usado pelo backend (padrão: backend\v_energy.db).
#>
param(
    [ValidateSet('help', 'setup', 'data', 'seed', 'backend', 'frontend', 'dev', 'lint', 'test', 'check')]
    [string]$Command = 'help',
    [string]$Database = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'

function Write-Step([string]$Message) {
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Success([string]$StepName) {
    if ($LASTEXITCODE -ne 0) {
        throw "Falhou: $StepName (código $LASTEXITCODE)"
    }
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Uv([string[]]$UvArgs) {
    if (Test-Command 'uv') {
        & uv @UvArgs
    } elseif (Test-Command 'python') {
        & python -m uv @UvArgs
    } else {
        throw 'uv não encontrado. Instale com: pip install --user uv (ou https://docs.astral.sh/uv/)'
    }
}

function Assert-Bun {
    if (-not (Test-Command 'bun')) {
        throw 'bun não encontrado. Instale com: npm install -g bun (ou https://bun.sh)'
    }
}

function Invoke-InDirectory([string]$Directory, [scriptblock]$Action) {
    Push-Location $Directory
    try {
        & $Action
    } finally {
        Pop-Location
    }
}

function Invoke-Setup {
    Write-Step 'Backend: uv sync --all-extras'
    Invoke-InDirectory $Backend { Invoke-Uv @('sync', '--all-extras'); Assert-Success 'uv sync' }
    Write-Step 'Frontend: bun install'
    Assert-Bun
    Invoke-InDirectory $Frontend { bun install; Assert-Success 'bun install' }
}

function Invoke-Data {
    $landing = Join-Path $Root 'data\landing'
    New-Item -ItemType Directory -Force $landing | Out-Null
    foreach ($zipName in 'base_dados_1.zip', 'base_dados_2.zip') {
        $zipPath = Join-Path $Root $zipName
        if (-not (Test-Path $zipPath)) {
            throw "Arquivo $zipName não encontrado na raiz do projeto."
        }
        Write-Step "Extraindo $zipName para data\landing"
        Expand-Archive -Path $zipPath -DestinationPath $landing -Force
    }
    Get-ChildItem $landing | Select-Object Name, Length | Format-Table -AutoSize
}

function Invoke-Seed {
    Write-Step 'Gerando backend\v_energy_dev.db'
    Invoke-InDirectory $Backend { Invoke-Uv @('run', 'python', '-m', 'tests.customer360_seed'); Assert-Success 'seed' }
}

function Set-DatabaseUrl {
    if ($Database) {
        $databasePath = (Resolve-Path $Database).Path -replace '\\', '/'
        $env:DATABASE_URL = "sqlite+aiosqlite:///$databasePath"
        Write-Step "Usando o banco $databasePath"
    }
}

function Invoke-Backend {
    Set-DatabaseUrl
    Write-Step 'API em http://localhost:8000 (docs em /docs)'
    Invoke-InDirectory $Backend { Invoke-Uv @('run', 'uvicorn', 'app.main:app', '--reload', '--port', '8000') }
}

function Invoke-Frontend {
    Assert-Bun
    Write-Step 'Portal em http://localhost:5173'
    Invoke-InDirectory $Frontend { bun run dev }
}

function Invoke-Dev {
    $backendArgs = @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath, 'backend')
    if ($Database) {
        $backendArgs += @('-Database', (Resolve-Path $Database).Path)
    }
    Write-Step 'Abrindo o backend em outra janela'
    Start-Process powershell -ArgumentList $backendArgs | Out-Null
    Invoke-Frontend
}

function Invoke-Lint {
    Invoke-InDirectory $Backend {
        Write-Step 'Ruff'; Invoke-Uv @('run', 'ruff', 'check', '.'); Assert-Success 'Ruff'
        Write-Step 'Pylint'; Invoke-Uv @('run', 'pylint', 'app'); Assert-Success 'Pylint'
        Write-Step 'import-linter'; Invoke-Uv @('run', 'lint-imports'); Assert-Success 'import-linter'
    }
    Assert-Bun
    Invoke-InDirectory $Frontend {
        Write-Step 'ESLint'; bun run lint; Assert-Success 'ESLint'
        Write-Step 'Fallow'; bun run lint:fallow; Assert-Success 'Fallow'
    }
}

function Invoke-Test {
    Invoke-InDirectory $Backend { Write-Step 'pytest'; Invoke-Uv @('run', 'pytest', '-q'); Assert-Success 'pytest' }
    Assert-Bun
    Invoke-InDirectory $Frontend { Write-Step 'Vitest'; bun run test; Assert-Success 'Vitest' }
}

function Invoke-Check {
    Invoke-Lint
    Invoke-Test
    Invoke-InDirectory $Frontend {
        Write-Step 'TypeScript'; bunx tsc -b; Assert-Success 'TypeScript'
        Write-Step 'Build'; bun run build; Assert-Success 'Build'
    }
    Write-Host 'Tudo verde: lint, testes, TypeScript e build.' -ForegroundColor Green
}

switch ($Command) {
    'help' { Get-Help $PSCommandPath -Detailed | Out-Host }
    'setup' { Invoke-Setup }
    'data' { Invoke-Data }
    'seed' { Invoke-Seed }
    'backend' { Invoke-Backend }
    'frontend' { Invoke-Frontend }
    'dev' { Invoke-Dev }
    'lint' { Invoke-Lint }
    'test' { Invoke-Test }
    'check' { Invoke-Check }
}
