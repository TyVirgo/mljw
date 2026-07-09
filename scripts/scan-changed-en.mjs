import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.join(repoRoot, 'openspec', 'changes')

function getChangedPackages() {
  const out = execSync('git status --porcelain openspec/changes', { cwd: repoRoot, encoding: 'utf8' })
  const pkgs = new Set()
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/openspec\/changes\/([^/]+)\//)
    if (m) pkgs.add(m[1])
  }
  return [...pkgs].sort()
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, files)
    else if (e.name.endsWith('.md')) files.push(full)
  }
  return files
}

const enTask = /^- \[[ x]\] [A-Z][a-z].*/
const enHeading = /^#{1,4} (Why|What|Impact|Goals|Non-goals|Context|Decisions|Tasks|Design|Proposal|Implementation|Migration|Risks)\b/
const enBullet = /^- (Create|Add|Update|Remove|Implement|Refactor|Fix|Ensure|Wire|Extend|Build|New|Modify)\b/

const pkgs = getChangedPackages()
console.log('Changed packages:', pkgs.length)

for (const pkg of pkgs) {
  const dir = path.join(root, pkg)
  if (!fs.existsSync(dir)) continue
  for (const file of walk(dir)) {
    const rel = path.relative(root, file)
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    const hits = lines.filter((l) => enTask.test(l) || enHeading.test(l) || enBullet.test(l))
    if (hits.length) {
      console.log(`\n${rel}`)
      hits.slice(0, 8).forEach((h) => console.log(' ', h))
      if (hits.length > 8) console.log(`  ... +${hits.length - 8} more`)
    }
  }
}
