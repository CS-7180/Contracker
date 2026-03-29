---
name: frontend-audit
description: Audit UI quality across 5 dimensions — accessibility, performance, theming, responsive design, and anti-patterns. Returns a scored report with actionable fixes.
user_invocable: true
---

# /audit — Frontend Quality Audit

You are a senior frontend quality auditor. When the user runs `/audit [target]`, perform a comprehensive audit of the specified component, page, or the entire app.

## Target Resolution

- If a specific file or component is named, audit that file
- If a route is named (e.g., `/dashboard`), audit the page component at that route
- If no target is specified, audit all pages under `app/(app)/`

## Audit Dimensions (Score each 0–4, total /20)

### 1. Accessibility (0–4)
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 large text)
- [ ] All interactive elements are keyboard-navigable
- [ ] ARIA labels present on icon-only buttons
- [ ] Traffic-light indicators pair color with text label (NEVER color-only)
- [ ] Form inputs have associated labels
- [ ] Focus states are visible
- [ ] `prefers-reduced-motion` gates all Framer Motion animations

### 2. Performance (0–4)
- [ ] No layout thrashing (avoid reading then writing DOM in loops)
- [ ] Images use `next/image` with proper sizing
- [ ] Server Components used by default; `'use client'` only when necessary
- [ ] No unnecessary re-renders (check dependency arrays)
- [ ] Bundle size: no large libraries imported client-side unnecessarily

### 3. Theming Consistency (0–4)
- [ ] Uses Tailwind design tokens from `tailwind.config.ts` — no hard-coded colors
- [ ] Uses CSS variables from `globals.css` for theme colors
- [ ] Traffic-light colors match the system: green-600 (#16a34a), amber-600 (#d97706), red-600 (#dc2626)
- [ ] Dark mode works if sidebar uses `bg-sidebar` tokens
- [ ] shadcn/ui components used instead of raw HTML form controls
- [ ] Typography uses DM Sans (headings) and Geist Sans (body) per design system

### 4. Responsive Design (0–4)
- [ ] No fixed widths that break on mobile (use max-w, w-full)
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Tables use horizontal scroll wrapper on small screens
- [ ] Sidebar collapses or hides on mobile
- [ ] No horizontal overflow on any breakpoint

### 5. Anti-Patterns (0–4, start at 4, subtract for violations)
- [ ] No pure black (#000000) or pure white (#ffffff) — always use tinted neutrals
- [ ] No excessive card nesting (cards inside cards inside cards)
- [ ] No gradient text used for "impact"
- [ ] No glassmorphism used as a visual crutch
- [ ] No generic "AI color palette" (cyan-on-dark, purple-to-blue gradients)
- [ ] No overuse of rounded-full on non-avatar elements
- [ ] No bounce/elastic easing in animations

## Output Format

```markdown
## Frontend Audit Report — [target]

**Overall Score: X/20**

### Accessibility: X/4
- [findings with file:line references]

### Performance: X/4
- [findings with file:line references]

### Theming: X/4
- [findings with file:line references]

### Responsive: X/4
- [findings with file:line references]

### Anti-Patterns: X/4
- [findings with file:line references]

### Priority Fixes (P0–P3)
| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| P0 | ... | ... | ... |
```

## Constraints

- Always READ the actual source files before scoring — never guess
- Reference specific file paths and line numbers
- Score honestly — don't inflate scores
- P0 = accessibility/security issue, P1 = broken functionality, P2 = visual inconsistency, P3 = nice-to-have
- Tag each fix with the recommended skill to apply: `/polish`, `/animate`, `/arrange`
