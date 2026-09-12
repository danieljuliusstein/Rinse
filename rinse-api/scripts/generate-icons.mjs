import { existsSync, copyFileSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconsDir = join(publicDir, 'icons')
const source = join(publicDir, 'logo.png')

if (!existsSync(source)) {
  console.error('Missing public/logo.png — add the app logo source image first.')
  process.exit(1)
}

function resizeWithSips(size, dest) {
  copyFileSync(source, dest)
  execSync(`sips -z ${size} ${size} "${dest}"`, { stdio: 'inherit' })
}

for (const size of [192, 512]) {
  const path = join(iconsDir, `icon-${size}.png`)
  resizeWithSips(size, path)
  console.log('Wrote', path)
}
