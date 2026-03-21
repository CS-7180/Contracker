# UI/UX Conventions Reference

## Traffic-Light Color System

```typescript
const STATUS_COLORS = {
  green: '#16a34a',    // Tailwind green-600
  amber: '#d97706',    // Tailwind amber-600
  red: '#dc2626',      // Tailwind red-600
}
```

**Always include text labels alongside color** for accessibility (never color-only).

## Framer Motion Animations

Use Framer Motion for:
- Dashboard stagger reveals on load
- Traffic-light color transitions
- Page transitions between routes
- Notification slide-ins

**Performance:** Gate all animations via `prefers-reduced-motion` media query.

## Component Scaffolding

Use **21st.dev Magic (MCP)** via Claude Code to scaffold complex UI components:
- Data tables with search/filter/pagination
- Form dialogs with validation
- Notification panels
- Dashboard cards

## Component Rules

- Server Components by default; add `'use client'` only when hooks or browser APIs are needed
- Use `shadcn/ui` primitives from `components/ui/` — never raw HTML for form controls
- Traffic-light indicators must always pair a text label with the color badge
- Animate with Framer Motion; gate behind `prefers-reduced-motion`
