// Turns the single-file Vite build into an Artifact page (the publisher adds its own <html>/<head>/<body> skeleton).
import { readFileSync, writeFileSync } from 'node:fs'
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
const keepHead = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
// title must be within the first 8KB → keep <title>/<meta>/<link> first, then the big inline style/script
const small = (keepHead.match(/<(title|meta|link)[^>]*>(?:[^<]*<\/title>)?/g) || []).join('\n')
const big = keepHead.replace(/<(title|meta|link)[^>]*>(?:[^<]*<\/title>)?/g, '')
writeFileSync(new URL('../dist/artifact.html', import.meta.url), `${small}\n${big}\n${body}\n`)
console.log('dist/artifact.html', (small.length + big.length + body.length) / 1024 | 0, 'KB')
