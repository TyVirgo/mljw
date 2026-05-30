import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'index.source.html')
const target = path.join(root, 'index.html')

fs.copyFileSync(source, target)
console.log('Restored index.html from index.source.html')
