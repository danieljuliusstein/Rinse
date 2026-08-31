const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '..', '..')
const coreRoot = path.resolve(monorepoRoot, 'packages', 'core')

/** Load apps/mobile/.env into process.env (does not override existing vars). */
function loadEnvFile() {
  const envPath = path.resolve(projectRoot, '.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile()

const API_PROXY_TARGET = (
  process.env.EXPO_PUBLIC_APP_API_URL ??
  process.env.APP_API_PROXY_TARGET ??
  'http://localhost:3000'
).replace(/\/$/, '')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

// Required for file:../../packages/core — Metro does not follow symlinks outside project root by default.
config.watchFolders = [coreRoot, monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// expo-sqlite web (alpha) — wasm asset + SharedArrayBuffer headers per Expo docs.
config.resolver.assetExts.push('wasm')
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')

    const url = req.url ?? ''

    // Same-origin debug ingest (browser often blocks 127.0.0.1 cross-port from localhost).
    if (url.startsWith('/__agent-debug') && req.method === 'POST') {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8')
          const logPath = path.resolve(
            '/Users/danny/Projects/Desktop-CRM/.cursor/debug-89a058.log',
          )
          fs.mkdirSync(path.dirname(logPath), { recursive: true })
          fs.appendFileSync(logPath, body.trim() + '\n')
        } catch {
          // ignore
        }
        res.statusCode = 204
        res.end()
      })
      return
    }

    if (url.startsWith('/api-proxy')) {
      const targetPath = url.replace(/^\/api-proxy/, '') || '/'
      const target = new URL(`${API_PROXY_TARGET}${targetPath}`)
      const transport = target.protocol === 'http:' ? http : https

      const headers = { ...req.headers }
      delete headers.host
      headers.host = target.host

      const proxyReq = transport.request(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || (target.protocol === 'http:' ? 80 : 443),
          path: `${target.pathname}${target.search}`,
          method: req.method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
          proxyRes.pipe(res)
        }
      )

      proxyReq.on('error', (err) => {
        res.statusCode = 502
        res.end(`API proxy error: ${err.message}`)
      })

      req.pipe(proxyReq)
      return
    }

    middleware(req, res, next)
  }
}

if (process.env.NODE_ENV !== 'test') {
  console.log(`[metro] API proxy → ${API_PROXY_TARGET}`)
}

module.exports = config
