/**
 * M1.0 SCAFFOLDING TESTS
 *
 * Verifies that all scaffolding for Issue #1 is correctly in place:
 * Next.js 14, App Router, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.
 *
 * TDD RED  🔴 — these tests FAIL until the scaffold is implemented.
 * TDD GREEN 🟢 — these tests already pass (packages installed, config committed).
 * TDD TODO  🔲 — render tests registered as todo; activated in the GREEN commit
 *                 once the component files exist (Vite cannot compile imports of
 *                 files that do not yet exist at transform time).
 *
 * Run with: npm test -- m1.0-scaffolding
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { render, screen } from '@testing-library/react'
import React from 'react'

const ROOT = process.cwd()

// ─────────────────────────────────────────────────────────
// NEXT.JS 14 INSTALLATION                                🟢
// ─────────────────────────────────────────────────────────
describe('Next.js 14 Installation', () => {
  it('🟢 next is listed as a dependency in package.json', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.dependencies?.next,
      'next is not listed in dependencies — run: npm install next'
    ).toBeDefined()
  })

  it('🟢 next version is 14.x', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    const version: string = pkg.dependencies?.next ?? ''
    expect(
      version,
      `Expected next@14.x but found: "${version}"`
    ).toMatch(/14\./)
  })
})

// ─────────────────────────────────────────────────────────
// APP ROUTER CONFIGURATION                               🟢
// ─────────────────────────────────────────────────────────
describe('App Router Configuration', () => {
  it('🟢 app/ directory exists', () => {
    expect(
      existsSync(join(ROOT, 'app')),
      'app/ directory is missing — Next.js App Router requires an app/ directory'
    ).toBe(true)
  })

  it('🟢 app/layout.tsx exists', () => {
    expect(
      existsSync(join(ROOT, 'app', 'layout.tsx')),
      'app/layout.tsx is missing — required root layout for Next.js App Router'
    ).toBe(true)
  })

  it('🟢 package.json dev script runs next dev', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.dev,
      'dev script missing or does not call next dev'
    ).toMatch(/next dev/)
  })

  it('🟢 package.json build script runs next build', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
    expect(
      pkg.scripts?.build,
      'build script missing or does not call next build'
    ).toMatch(/next build/)
  })
})

// ─────────────────────────────────────────────────────────
// TYPESCRIPT CONFIGURATION                               🟢
// ─────────────────────────────────────────────────────────
describe('TypeScript Configuration', () => {
  it('🟢 tsconfig.json exists', () => {
    expect(
      existsSync(join(ROOT, 'tsconfig.json')),
      'tsconfig.json is missing'
    ).toBe(true)
  })

  it('🟢 tsconfig.json configures @/* path alias', () => {
    const raw = readFileSync(join(ROOT, 'tsconfig.json'), 'utf-8')
    // Check for the @/* path alias directly in the raw file to avoid JSON comment-stripping
    // issues with // inside string values (e.g. "./*")
    expect(
      raw,
      '@/* path alias is missing from tsconfig.json — add: "@/*": ["./*"]'
    ).toContain('"@/*"')
  })
})

// ─────────────────────────────────────────────────────────
// TAILWIND CSS DESIGN TOKENS                             🟢
// ─────────────────────────────────────────────────────────
describe('Tailwind CSS Design Tokens', () => {
  it('🟢 tailwind.config.ts defines risk-green token', () => {
    const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf-8')
    expect(
      config,
      'risk-green color token is missing from tailwind.config.ts'
    ).toContain('risk-green')
  })

  it('🟢 tailwind.config.ts defines risk-amber token', () => {
    const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf-8')
    expect(
      config,
      'risk-amber color token is missing from tailwind.config.ts'
    ).toContain('risk-amber')
  })

  it('🟢 tailwind.config.ts defines risk-red token', () => {
    const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf-8')
    expect(
      config,
      'risk-red color token is missing from tailwind.config.ts'
    ).toContain('risk-red')
  })

  it('🟢 globals.css defines --primary CSS variable', () => {
    const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf-8')
    expect(
      css,
      '--primary CSS variable is missing from globals.css'
    ).toContain('--primary')
  })

  it('🟢 globals.css defines --sidebar-background CSS variable', () => {
    const css = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf-8')
    expect(
      css,
      '--sidebar-background CSS variable is missing from globals.css'
    ).toContain('--sidebar-background')
  })

  it('🟢 a component using Tailwind utility classes renders without error', () => {
    const Sample = () => (
      <div className="bg-background text-foreground p-4 rounded-lg">
        Tailwind test
      </div>
    )
    render(<Sample />)
    const el = screen.getByText('Tailwind test')
    expect(el).toBeDefined()
    expect(el.className).toContain('bg-background')
    expect(el.className).toContain('text-foreground')
  })
})

// ─────────────────────────────────────────────────────────
// SHADCN/UI COMPONENTS                                   🔴 / 🔲
// ─────────────────────────────────────────────────────────
describe('shadcn/ui Components', () => {
  const BUTTON_PATH = join(ROOT, 'components', 'ui', 'button.tsx')

  // 🔴 Fails until components/ui/button.tsx is created
  it('🔴 components/ui/button.tsx file exists', () => {
    expect(
      existsSync(BUTTON_PATH),
      'components/ui/button.tsx is missing — create the shadcn/ui Button component'
    ).toBe(true)
  })

  // 🔲 Render tests activated in the GREEN commit alongside the implementation.
  //    Vite cannot compile dynamic imports of files that do not yet exist at
  //    transform time, so these are registered as todo until the file is created.
  it.todo('🔲 Button component renders without error — activate once button.tsx is created')
  it.todo('🔲 Button component renders with a non-empty className — activate once button.tsx is created')
})

// ─────────────────────────────────────────────────────────
// APP LAYOUT AND NAVIGATION SCAFFOLD                     🔴 / 🔲
// ─────────────────────────────────────────────────────────
describe('App Layout and Navigation Scaffold', () => {
  const APP_LAYOUT = join(ROOT, 'app', '(app)', 'layout.tsx')

  // 🔴 Fails until app/(app)/layout.tsx is created
  it('🔴 app/(app)/layout.tsx file exists', () => {
    expect(
      existsSync(APP_LAYOUT),
      'app/(app)/layout.tsx is missing — create the app shell layout with sidebar navigation'
    ).toBe(true)
  })

  it('🔴 app/(app)/layout.tsx source contains a Dashboard nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Dashboard nav link missing from app/(app)/layout.tsx').toContain('Dashboard')
  })

  it('🔴 app/(app)/layout.tsx source contains a Contracts nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Contracts nav link missing from app/(app)/layout.tsx').toContain('Contracts')
  })

  it('🔴 app/(app)/layout.tsx source contains a Suppliers nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Suppliers nav link missing from app/(app)/layout.tsx').toContain('Suppliers')
  })

  it('🔴 app/(app)/layout.tsx source contains a Compliance nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Compliance nav link missing from app/(app)/layout.tsx').toContain('Compliance')
  })

  it('🔴 app/(app)/layout.tsx source contains a Spend nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Spend nav link missing from app/(app)/layout.tsx').toContain('Spend')
  })

  it('🔴 app/(app)/layout.tsx source contains a Notifications nav link', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(source, 'Notifications nav link missing from app/(app)/layout.tsx').toContain('Notifications')
  })

  it('🔴 app/(app)/layout.tsx uses Framer Motion motion.div for page animation', () => {
    expect(existsSync(APP_LAYOUT), 'app/(app)/layout.tsx does not exist').toBe(true)
    const source = readFileSync(APP_LAYOUT, 'utf-8')
    expect(
      source,
      'motion.div not found in app/(app)/layout.tsx — add a Framer Motion animation to the page content area'
    ).toContain('motion.div')
  })

  // 🔲 Render tests activated in the GREEN commit alongside the implementation.
  it.todo('🔲 rendered navigation contains a link to /dashboard — activate once layout.tsx is created')
  it.todo('🔲 rendered navigation contains a link to /contracts — activate once layout.tsx is created')
  it.todo('🔲 rendered navigation contains a link to /suppliers — activate once layout.tsx is created')
  it.todo('🔲 rendered navigation contains a link to /compliance — activate once layout.tsx is created')
  it.todo('🔲 rendered navigation contains a link to /spend — activate once layout.tsx is created')
  it.todo('🔲 rendered navigation contains a link to /notifications — activate once layout.tsx is created')
})

// ─────────────────────────────────────────────────────────
// FRAMER MOTION ANIMATION                                🟢
// ─────────────────────────────────────────────────────────
describe('Framer Motion Animation', () => {
  it('🟢 motion.div is importable and defined', async () => {
    const { motion } = await import('framer-motion')
    expect(
      motion.div,
      'motion.div is not available — check framer-motion installation'
    ).toBeDefined()
  })

  it('🟢 motion.div renders children with initial and animate props', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { motion } = require('framer-motion')
    render(
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Animated content
      </motion.div>
    )
    expect(screen.getByText('Animated content')).toBeDefined()
  })
})
