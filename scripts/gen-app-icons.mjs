// Generate the maskable PWA app icons referenced by app/manifest.ts
// (/icons/icon-192.png + /icons/icon-512.png) from the locked Oravan lone-O
// mark: a paper mark centered on an ink tile with safe-zone padding.
// Reads the masters in assets/brand/ and recolors them, so there's no path
// duplication here. Re-run with: node scripts/gen-app-icons.mjs
import sharp from 'sharp'
import { readFile, mkdir } from 'node:fs/promises'

const INK = '#1F2E2A'
const PAPER = '#F7F4EE'

const markMaster = await readFile('assets/brand/oravan-mark.svg', 'utf8')
const paperMark = markMaster.replace(/currentColor/g, PAPER)

await mkdir('public/icons', { recursive: true })

for (const size of [192, 512]) {
  // Mark at 60% of the canvas keeps it inside the maskable safe zone (center 80%).
  const inner = Math.round(size * 0.6)
  const mark = await sharp(Buffer.from(paperMark)).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`wrote public/icons/icon-${size}.png`)
}

// Throwaway previews (NOT committed) for visual sanity-checking the wordmark + favicon.
const wordmarkMaster = await readFile('assets/brand/oravan-wordmark.svg', 'utf8')
const inkWordmark = wordmarkMaster.replace(/currentColor/g, INK)
await sharp({ create: { width: 720, height: 256, channels: 4, background: PAPER } })
  .composite([{ input: await sharp(Buffer.from(inkWordmark)).resize(640, null).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile('/tmp/preview-wordmark.png')
const inkMark = markMaster.replace(/currentColor/g, INK)
await sharp(Buffer.from(inkMark)).resize(256, 256).png().toFile('/tmp/preview-favicon.png')
console.log('wrote /tmp previews')
