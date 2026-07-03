#!/usr/bin/env node
// Prepare harness-engineering content for a Quartz build.
//
// Usage: node scripts/prepare-content.mjs <source-checkout> <content-dir>
//
// Transforms applied on the way in (the source repo stays pure markdown):
//   1. Copy everything except VCS/tooling files into <content-dir>.
//   2. Rename every README.md to index.md (Quartz's folder-index convention)
//      and rewrite links that point at README.md accordingly.
//   3. Lift a leading `# H1` into frontmatter `title:` so Quartz doesn't
//      render a duplicate title above the note body.
//   4. Stamp `created`/`modified` frontmatter from the source repo's git
//      history — the copies aren't tracked by the site repo, so Quartz's
//      git-based dates would otherwise fall back to build time.

import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const [src, dest] = process.argv.slice(2)
if (!src || !dest) {
  console.error("usage: prepare-content.mjs <source-checkout> <content-dir>")
  process.exit(1)
}

const SKIP = new Set([".git", ".github", "node_modules", ".markdownlint.json", ".markdownlintignore", ".gitignore"])

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })

function gitDates(relPath) {
  try {
    const out = execFileSync("git", ["log", "--follow", "--format=%aI", "--", relPath], {
      cwd: src,
      encoding: "utf8",
    }).trim()
    if (!out) return null
    const lines = out.split("\n")
    return { modified: lines[0], created: lines[lines.length - 1] }
  } catch {
    return null
  }
}

const copied = []
function walk(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const fromPath = path.join(from, entry.name)
    let toPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(toPath, { recursive: true })
      walk(fromPath, toPath)
    } else {
      if (entry.name === "README.md") toPath = path.join(to, "index.md")
      fs.copyFileSync(fromPath, toPath)
      copied.push({ dest: toPath, srcRel: path.relative(src, fromPath) })
    }
  }
}
walk(src, dest)

for (const { dest: file, srcRel } of copied) {
  if (!file.endsWith(".md")) continue
  let text = fs.readFileSync(file, "utf8")

  // README.md -> index.md in relative links (not URLs)
  text = text.replace(/\((?!https?:\/\/)([^)]*?)README\.md(#[^)]*)?\)/g, (_m, prefix, anchor) => `(${prefix}index.md${anchor ?? ""})`)

  // Lift a leading H1 into frontmatter title, stamp git dates
  const hasFrontmatter = text.startsWith("---\n")
  if (!hasFrontmatter) {
    const fields = []
    const m = text.match(/^\s*# (.+?)\n+/)
    if (m) {
      fields.push(`title: "${m[1].trim().replace(/"/g, '\\"')}"`)
      text = text.slice(m[0].length)
    }
    const dates = gitDates(srcRel)
    if (dates) {
      // Essays are written at a date and never changed — pin the displayed
      // (modified) date to the written date so later touch-ups don't move it.
      if (srcRel.startsWith("essays/")) dates.modified = dates.created
      fields.push(`created: ${dates.created}`, `modified: ${dates.modified}`)
    }
    if (fields.length) {
      text = `---\n${fields.join("\n")}\n---\n\n` + text
    }
  }

  fs.writeFileSync(file, text)
}

console.log(`prepared ${copied.length} files into ${dest}`)
