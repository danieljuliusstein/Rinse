#!/usr/bin/env node
/**
 * Debug: verify expo-router resolution paths for monorepo hoisting.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const mobile = path.join(root, 'apps/mobile')
const logPath = path.join(root, 'apps/api/.cursor/debug-bb11e6.log')
const requireFrom = createRequire(import.meta.url)

function log(hypothesisId, message, data) {
  const line = JSON.stringify({
    sessionId: 'bb11e6',
    hypothesisId,
    location: 'scripts/debug-expo-resolve.mjs',
    message,
    data,
    timestamp: Date.now(),
    runId: process.env.DEBUG_RUN_ID ?? 'pre-fix',
  })
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  fs.appendFileSync(logPath, line + '\n')
}

const hypotheses = {
  H1: 'expo-router nested in apps/mobile only; @expo/cli hoisted to root cannot resolve _ctx-shared',
  H2: 'typedRoutes experiment triggers require before metro can resolve',
  H3: 'manual metro.config.js watchFolders breaks Expo SDK 57 auto monorepo config',
  H4: 'incomplete install after workspace restructure',
  H5: 'version mismatch between expo-router and @expo/router-server',
}

log('META', 'hypotheses', hypotheses)

const rootExpoRouter = path.join(root, 'node_modules/expo-router/package.json')
const mobileExpoRouter = path.join(mobile, 'node_modules/expo-router/package.json')
const rootCli = path.join(root, 'node_modules/@expo/cli/package.json')
const mobileCli = path.join(mobile, 'node_modules/@expo/cli/package.json')

log('H1', 'module locations', {
  rootExpoRouter: fs.existsSync(rootExpoRouter),
  mobileExpoRouter: fs.existsSync(mobileExpoRouter),
  rootCli: fs.existsSync(rootCli),
  mobileCli: fs.existsSync(mobileCli),
})

let resolveFromMobile = null
let resolveFromRoot = null
let resolveErrorMobile = null
let resolveErrorRoot = null

try {
  const reqMobile = createRequire(path.join(mobile, 'package.json'))
  resolveFromMobile = reqMobile.resolve('expo-router/_ctx-shared')
} catch (e) {
  resolveErrorMobile = e instanceof Error ? e.message : String(e)
}

try {
  resolveFromRoot = requireFrom.resolve('expo-router/_ctx-shared')
} catch (e) {
  resolveErrorRoot = e instanceof Error ? e.message : String(e)
}

log('H1', 'require.resolve expo-router/_ctx-shared', {
  fromMobile: resolveFromMobile,
  fromMobileError: resolveErrorMobile,
  fromRoot: resolveFromRoot,
  fromRootError: resolveErrorRoot,
})

if (fs.existsSync(mobileExpoRouter)) {
  const mobileReq = createRequire(path.join(mobile, 'package.json'))
  const routerPkg = JSON.parse(fs.readFileSync(mobileExpoRouter, 'utf8'))
  let routerServerVersion = null
  try {
    routerServerVersion = mobileReq('@expo/router-server/package.json').version
  } catch {
    try {
      routerServerVersion = requireFrom('@expo/router-server/package.json').version
    } catch (e) {
      routerServerVersion = e instanceof Error ? e.message : String(e)
    }
  }
  log('H5', 'package versions', {
    expoRouter: routerPkg.version,
    routerServer: routerServerVersion,
  })
}

console.log('Debug resolution written to', logPath)
