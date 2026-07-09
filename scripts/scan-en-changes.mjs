import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'openspec', 'changes')

const newPkgs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => {
    const proposal = path.join(root, name, 'proposal.md')
    if (!fs.existsSync(proposal)) return false
    const text = fs.readFileSync(proposal, 'utf8')
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const hasEnHeader = /^## (Why|What Changes?|Impact|Goals|Non-goals)\s*$/m.test(text)
    const lowChinese = chinese < 80
    return hasEnHeader || lowChinese
  })

const enHeader =
  /^(## |### |#### |# )(Why|What Changes?|Impact|Goals|Non-goals|Context|Decisions|Capabilities|New Capabilities|Modified Capabilities|Migration|Risks|ADDED|MODIFIED|REMOVED|Requirements|Tasks|Design|Proposal|Implementation)/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (e.name.endsWith('.md')) out.push(full)
  }
  return out
}

console.log('Packages likely needing translation:', newPkgs)
for (const pkg of newPkgs) {
  for (const file of walk(path.join(root, pkg))) {
    const text = fs.readFileSync(file, 'utf8')
    let enHeaders = 0
    let enLines = []
    for (const line of text.split(/\r?\n/)) {
      if (enHeader.test(line)) {
        enHeaders++
        enLines.push(line)
      }
    }
    if (enHeaders) {
      console.log(`\n${pkg}/${path.relative(path.join(root, pkg), file)}`)
      enLines.slice(0, 5).forEach((l) => console.log(' ', l))
    }
  }
}
