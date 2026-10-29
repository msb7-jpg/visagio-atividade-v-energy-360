import { spawn } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

const targetDir = process.argv[2] || 'before'
const outDir = resolve(process.cwd(), 'docs/screenshots', targetDir)
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

const loginRes = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'diretor@venergy.com', senha: 'venergy123' })
})
const { access_token } = await loginRes.json()
console.log('Login efetuado com sucesso!')

const BROWSER_CANDIDATES: Record<string, string[]> = {
  win32: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ],
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  linux: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
}
const browserPath = process.env.CHROME_PATH
  ?? (BROWSER_CANDIDATES[process.platform] ?? []).find((candidate) => existsSync(candidate))
if (!browserPath) {
  throw new Error('Navegador não encontrado: defina CHROME_PATH com o caminho do Chrome ou do Chromium')
}

const chrome = spawn(browserPath, [
  '--headless',
  `--user-data-dir=${join(tmpdir(), 'venergy-capture')}`,
  '--disable-gpu',
  '--no-sandbox',
  '--remote-debugging-port=9333',
  '--window-size=1440,900'
], { stdio: 'ignore' })

let versionData: any = null
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    const res = await fetch('http://127.0.0.1:9333/json/version')
    if (res.ok) {
      versionData = await res.json()
      break
    }
  } catch {
    await new Promise((r) => setTimeout(r, 200))
  }
}

if (!versionData?.webSocketDebuggerUrl) {
  chrome.kill()
  throw new Error('Não foi possível conectar ao Chromium na porta 9333')
}

const browserWsUrl = versionData.webSocketDebuggerUrl
const ws = new WebSocket(browserWsUrl)
let id = 1
const pending = new Map<number, (res: any) => void>()

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data.toString())
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)!(msg.result ?? msg)
    pending.delete(msg.id)
  }
}

await new Promise((resolve) => {
  ws.onopen = resolve
})

function send(method: string, params: any = {}): Promise<any> {
  const reqId = id++
  return new Promise((resolve) => {
    pending.set(reqId, resolve)
    ws.send(JSON.stringify({ id: reqId, method, params }))
  })
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

function sendSession(method: string, params: any = {}): Promise<any> {
  const reqId = id++
  return new Promise((resolve) => {
    pending.set(reqId, resolve)
    ws.send(JSON.stringify({ id: reqId, sessionId, method, params }))
  })
}

await sendSession('Page.enable')
await sendSession('DOM.enable')
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
})

async function capture(urlPath: string, filename: string, options: { auth?: boolean; openChat?: boolean; waitMs?: number } = {}) {
  console.log(`Capturando ${filename} (${urlPath})...`)
  
  if (options.auth) {
    await sendSession('Page.navigate', { url: `${frontendUrl}/login` })
    await new Promise((r) => setTimeout(r, 800))
    await sendSession('Runtime.evaluate', {
      expression: `localStorage.setItem('venergy_access_token', ${JSON.stringify(access_token)});`
    })
  } else {
    await sendSession('Page.navigate', { url: `${frontendUrl}/login` })
    await new Promise((r) => setTimeout(r, 800))
    await sendSession('Runtime.evaluate', {
      expression: `localStorage.removeItem('venergy_access_token');`
    })
  }

  await sendSession('Page.navigate', { url: `${frontendUrl}${urlPath}` })
  await new Promise((r) => setTimeout(r, options.waitMs ?? 2500))

  if (options.openChat) {
    await sendSession('Runtime.evaluate', {
      expression: `
        document.querySelector('[aria-label="Abrir Assistente V-Energy IA"]')?.click();
      `
    })
    await new Promise((r) => setTimeout(r, 1200))
  }

  const res = await sendSession('Page.captureScreenshot', { format: 'png' })
  const base64Data = res.data ?? res
  const buffer = Buffer.from(base64Data, 'base64')
  writeFileSync(`${outDir}/${filename}`, buffer)
  console.log(`✓ Salvo: ${outDir}/${filename}`)
}

const routes = [
  { path: '/login', file: '01-login.png', auth: false, waitMs: 1200 },
  { path: '/dashboard', file: '02-dashboard-executivo.png', auth: true, waitMs: 3500 },
  { path: '/revenue', file: '03-inteligencia-comercial.png', auth: true, waitMs: 3500 },
  { path: '/losses', file: '04-gestao-perdas.png', auth: true, waitMs: 3500 },
  { path: '/quality', file: '05-qualidade-rede.png', auth: true, waitMs: 3500 },
  { path: '/customers', file: '06-visao-360-uc.png', auth: true, waitMs: 3500 },
  { path: '/dashboard', file: '07-chat-assistente-ia.png', auth: true, openChat: true, waitMs: 2500 }
]

for (const r of routes) {
  await capture(r.path, r.file, { auth: r.auth, openChat: r.openChat, waitMs: r.waitMs })
}

ws.close()
chrome.kill()
console.log(`\nTodas as capturas foram concluídas com sucesso em ${outDir}`)
process.exit(0)
