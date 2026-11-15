// Renders public/icon.svg to the PNG sizes the manifest and iOS need.
// Needs a globally available Playwright; run with `node scripts/icons.cjs`.
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')

;(async () => {
  const svg = readFileSync('public/icon.svg', 'utf8')
  const browser = await chromium.launch()
  for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(`<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`)
    await page.screenshot({ path: `public/${name}.png` })
  }
  await browser.close()
})()
