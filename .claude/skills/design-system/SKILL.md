---
name: design-system
description: Generate or validate design system tokens and component patterns for the Contracker shadcn/ui + Tailwind stack. Ensures visual consistency across all pages.
user_invocable: true
---

# /design-system — Contracker Design System Reference

You are a design system expert for the Contracker project. When the user runs `/design-system [action]`, perform the requested action.

## Actions

### `/design-system check`
Validate that all components follow the design system. Scan for:
- Hard-coded color values (should use Tailwind tokens)
- Inconsistent spacing patterns
- Missing dark mode support
- Typography mismatches

### `/design-system tokens`
Output the current design token reference for the project.

### `/design-system component [name]`
Generate a new component following all design system rules.

## Contracker Design Tokens

### Colors — Traffic Light System
```
Status Green:  text-green-600  (#16a34a) — bg-green-50 for badges
Status Amber:  text-amber-600  (#d97706) — bg-amber-50 for badges
Status Red:    text-red-600    (#dc2626) — bg-red-50 for badges
```

### Colors — UI Chrome
```
Sidebar BG:       bg-sidebar (dark, defined in CSS variables)
Sidebar Text:     text-sidebar-foreground
Content BG:       bg-background (white/neutral)
Content Text:     text-foreground
Muted Text:       text-muted-foreground
Border:           border-border
Card BG:          bg-card
Card Border:      border (default Tailwind border color)
```

### Typography
```
Display/Headings: font-display (DM Sans) — var(--font-dm-sans)
Body/UI:          font-sans (Geist Sans) — var(--font-geist-sans)

Scale:
  Page Title:     text-2xl font-display font-bold
  Section Title:  text-lg font-display font-semibold
  Card Title:     text-base font-display font-medium
  Body:           text-sm font-sans
  Caption/Meta:   text-xs font-sans text-muted-foreground
  Table Header:   text-xs font-sans font-medium uppercase tracking-wider
```

### Spacing
```
Page padding:     p-6 (24px)
Card padding:     p-4 (16px) or p-6 (24px)
Section gap:      space-y-6 (24px)
Card grid gap:    gap-4 (16px) or gap-6 (24px)
Form field gap:   space-y-4 (16px)
Inline element:   gap-2 (8px)
```

### Component Patterns

#### Status Badge
```tsx
<Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
  <span className="mr-1.5 h-2 w-2 rounded-full bg-green-600" />
  Active
</Badge>
```
ALWAYS include text label with the color dot. Never color-only.

#### Data Table
Use `components/ui/table.tsx` primitives. Pattern:
- Header row: uppercase, tracking-wider, text-xs, muted foreground
- Numeric columns: right-aligned (`text-right`)
- Status column: Badge with traffic-light color
- Actions column: right-aligned, icon buttons or dropdown menu

#### Card with Metric
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardDescription>Total Contracts</CardDescription>
    <CardTitle className="text-2xl font-display">42</CardTitle>
  </CardHeader>
</Card>
```

#### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-display font-medium">No contracts yet</h3>
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Create your first contract to get started.
  </p>
  <Button>Create Contract</Button>
</div>
```

### Animation Tokens (Framer Motion)
```
Page enter:    { opacity: 0, y: 8 } → { opacity: 1, y: 0 }, 250ms ease-out
Card stagger:  staggerChildren: 0.05 (50ms between items)
Badge pulse:   No pulse — static indicators only
Reduced motion: Always wrap in `prefers-reduced-motion` media query gate
Max duration:  300ms for UI elements, 500ms absolute max
```

## Constraints

- NEVER introduce new design tokens without updating this reference
- NEVER use inline styles — always Tailwind classes
- NEVER use color-only indicators — always pair with text
- All components must work with the shadcn/ui primitives in `components/ui/`
- Server Components by default; `'use client'` only when hooks/browser APIs are needed
