#!/usr/bin/env node
// scripts/index-specs.mjs
// Scans the repo for all documentation files across the taxonomy and
// generates /specs/INDEX.md grouped by document type.
// Run via Husky pre-commit hook and CI — never edit INDEX.md manually.

import { glob } from 'glob'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUTPUT = path.join(ROOT, 'specs', 'INDEX.md')

// ---------------------------------------------------------------------------
// Document type detection
// ---------------------------------------------------------------------------

const DOC_TYPES = {
  spec: {
    label: 'Specs',
    description: 'Living behavior contracts — always current',
    emoji: '📋',
    match: (f) => f.endsWith('.spec.md') && !f.includes('INDEX'),
  },
  plan: {
    label: 'Plans',
    description: 'Transient implementation documents',
    emoji: '🗓️',
    match: (f) => f.includes('__plan__'),
  },
  domain: {
    label: 'Domain Models',
    description: 'Platonic definitions — independent of the application',
    emoji: '📖',
    match: (f) => f.endsWith('.domain.md'),
  },
  research: {
    label: 'Research',
    description: 'Prior art explorations and internal spikes',
    emoji: '🔬',
    match: (f) => f.includes('__research__'),
  },
  adr: {
    label: 'Architecture Decision Records',
    description: 'Permanent record of significant decisions',
    emoji: '🏛️',
    match: (f) => f.includes('__adr__'),
  },
  runbook: {
    label: 'Runbooks',
    description: 'Operational procedures',
    emoji: '⚙️',
    match: (f) => f.endsWith('.runbook.md'),
  },
}

function detectType(relativePath) {
  const filename = path.basename(relativePath)
  for (const [type, config] of Object.entries(DOC_TYPES)) {
    if (config.match(filename)) return type
  }
  return 'spec' // fallback
}

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

function extractMetadata(content, filePath) {
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/')
  const filename = path.basename(relativePath)
  const type = detectType(relativePath)

  const title = content.match(/^#\s+(.+)/m)?.[1]?.trim() ?? 'Untitled'
  const status = content.match(/_.*Status:\s*(\w+)/)?.[1] ?? null
  const version = content.match(/_Version:\s*([\d.]+)/)?.[1] ?? null

  // Spec-specific metadata
  const criteria = (content.match(/^\d+\.\s+\*\*/gm) ?? []).length
  const scenarios = (content.match(/^\s+Scenario:/gm) ?? []).length
  const openQuestions = (content.match(/^- \?/gm) ?? []).length

  // ADR-specific: pull the decision statement
  const decision = content.match(/^##\s+Decision\n+(.+)/m)?.[1]?.trim() ?? null

  // Plan/Research: extract date from filename (YYYYMMDD prefix)
  const dateMatch = filename.match(/^(\d{8})__/)
  const date = dateMatch
    ? `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`
    : null

  // Parent spec reference
  const parent = content.match(/_Parent:\s*\[.+?\]\((.+?)\)/)?.[1] ?? null

  return {
    title, type, status, version,
    criteria, scenarios, openQuestions,
    decision, date, parent, relativePath,
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function statusBadge(status) {
  const badges = {
    Draft: '🟡 Draft',
    Review: '🔵 Review',
    Locked: '🟢 Locked',
    Superseded: '⚫ Superseded',
  }
  return status ? (badges[status] ?? `⚪ ${status}`) : null
}

function renderSpec(doc) {
  const badge = statusBadge(doc.status)
  const meta = [
    badge,
    doc.version ? `v${doc.version}` : null,
    doc.criteria > 0 ? `${doc.criteria} criteria` : null,
    doc.scenarios > 0 ? `${doc.scenarios} scenarios` : null,
    doc.openQuestions > 0 ? `⚠️ ${doc.openQuestions} open questions` : null,
  ].filter(Boolean).join(' · ')

  return [
    `**[${doc.title}](/${doc.relativePath})**`,
    meta ? `_${meta}_` : null,
  ].filter(Boolean).join('  \n')
}

function renderPlan(doc) {
  const meta = [
    doc.date,
    doc.parent ? `implements \`${doc.parent}\`` : null,
  ].filter(Boolean).join(' · ')

  return [
    `**[${doc.title}](/${doc.relativePath})**`,
    meta ? `_${meta}_` : null,
  ].filter(Boolean).join('  \n')
}

function renderAdr(doc) {
  return [
    `**[${doc.title}](/${doc.relativePath})**`,
    doc.date ? `_${doc.date}_` : null,
    doc.decision ? `> ${doc.decision}` : null,
  ].filter(Boolean).join('  \n')
}

function renderDoc(doc) {
  if (doc.type === 'plan') return renderPlan(doc)
  if (doc.type === 'adr') return renderAdr(doc)
  return renderSpec(doc)
}

function renderSection(type, docs) {
  const config = DOC_TYPES[type]
  if (!docs.length) return null

  const header = `## ${config.emoji} ${config.label}`
  const subheader = `_${config.description}_`
  const items = docs.map((d) => `- ${renderDoc(d)}`).join('\n')

  return [header, subheader, items].join('\n\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const patterns = [
    '**/*.spec.md',
    '**/*.domain.md',
    '**/*.runbook.md',
    '**/*__plan__*.md',
    '**/*__adr__*.md',
    '**/*__research__*.md',
  ]

  const files = (
    await Promise.all(
      patterns.map((p) =>
        glob(p, { cwd: ROOT, ignore: ['node_modules/**', 'specs/INDEX.md'], absolute: true })
      )
    )
  )
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    .sort()

  if (!files.length) {
    console.log('No documentation files found.')
    return
  }

  const docs = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, 'utf-8')
      return extractMetadata(content, filePath)
    })
  )

  // Group by type, preserving taxonomy order
  const grouped = {}
  for (const type of Object.keys(DOC_TYPES)) {
    grouped[type] = docs.filter((d) => d.type === type)
  }

  // Summary stats
  const now = new Date().toISOString().split('T')[0]
  const totalDocs = docs.length
  const totalOpenQuestions = docs.reduce((n, d) => n + (d.openQuestions ?? 0), 0)
  const totalCriteria = docs.reduce((n, d) => n + (d.criteria ?? 0), 0)
  const totalScenarios = docs.reduce((n, d) => n + (d.scenarios ?? 0), 0)

  const summaryTable = [
    `## Summary`,
    `| | Count |`,
    `|---|---|`,
    `| Total documents | ${totalDocs} |`,
    `| Acceptance criteria | ${totalCriteria} |`,
    `| BDD scenarios | ${totalScenarios} |`,
    `| Open questions | ${totalOpenQuestions} |`,
  ].join('\n')

  const sections = [
    `# Spec Index`,
    `_Generated: ${now}_`,
    `> ⚠️ Auto-generated by \`scripts/index-specs.mjs\`. Do not edit manually.`,
    summaryTable,
    ...Object.entries(grouped)
      .map(([type, typeDocs]) => renderSection(type, typeDocs))
      .filter(Boolean),
  ]

  await writeFile(OUTPUT, sections.join('\n\n'), 'utf-8')
  console.log(`✅ Spec index written → specs/INDEX.md (${totalDocs} documents)`)
}

main().catch((err) => {
  console.error('❌ Failed to generate spec index:', err.message)
  process.exit(1)
})
