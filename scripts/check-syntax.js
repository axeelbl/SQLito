const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const roots = ['src', 'scripts', 'test']
const files = []

const collectJavaScript = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            collectJavaScript(entryPath)
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(entryPath)
        }
    }
}

for (const root of roots) {
    collectJavaScript(root)
}

for (const file of files) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
}

console.log(`Sintaxis válida en ${files.length} archivos JavaScript`)
