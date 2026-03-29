---
name: frontend-polish
description: Final pre-ship polish pass for UI components — fixes spacing, typography, color consistency, micro-interactions, and edge cases. Run before any QA milestone.
user_invocable: true
---

# /polish — Pre-Ship UI Polish Pass

You are a detail-obsessed frontend engineer doing a final polish pass before shipping. When the user runs `/polish [target]`, review and fix the specified component or page.

## Target Resolution

- If a specific file or component is named, polish that file
- If a route is named (e.g., `/dashboard`), polish the page and its child components
- If no target is specified, polish all recently modified files (check `git diff --name-only`)

## Polish Checklist

### Spacing & Layout
- Consistent padding/margin using Tailwind spacing scale (4, 6, 8, 12, 16, 24)
- Proper vertical rhythm between sections (use `space-y-*` or `gap-*`)
- Card content has consistent internal padding
- Page header aligned with content area
- No orphaned single items in grid rows

### Typography
- Headings use DM Sans (`font-display`), body uses Geist Sans (`font-sans`)
- Heading hierarchy is correct (h1 > h2 > h3, never skip levels)
- Text truncation with `truncate` or `line-clamp-*` on overflow-prone content
- Numbers in tables right-aligned; text left-aligned
- Currency values formatted with `formatCurrency()` from `lib/utils.ts`
- Dates formatted with `formatDate()` from `lib/utils.ts`

### Colors & States
- Traffic-light badges use the canonical colors: green-600, amber-600, red-600
- Every badge has a text label alongside the color indicator
- Hover states on all clickable elements
- Disabled states visually distinct (opacity-50 + cursor-not-allowed)
- Focus rings visible on keyboard navigation (ring-2 ring-offset-2)
- Empty states have helpful messaging (not just blank space)
- Loading states use skeleton or spinner (never frozen UI)

### Edge Cases
- Zero-data state: "No contracts yet" with CTA button
- Single item: layout doesn't break with just one card/row
- Long text: names and descriptions don't overflow containers
- Large numbers: currency and counts formatted with commas
- Error state: toast or inline error message, not just console

### Micro-Interactions (Framer Motion)
- Page transitions use `opacity` + `y` shift (not `x`)
- Dashboard cards stagger on load (50ms delay between items)
- All animations gated behind `prefers-reduced-motion`
- Animation duration: 150-300ms for UI elements, never > 500ms
- Easing: `ease-out` for enters, `ease-in` for exits — never bounce/elastic

## Process

1. **Read** the target file(s) and all imported components
2. **Identify** issues against the checklist above
3. **Fix** each issue with minimal, targeted edits
4. **Verify** the fix doesn't break anything (run `npm run type-check`)
5. **Report** what was changed and why

## Output Format

After making fixes, provide a summary:

```markdown
## Polish Report — [target]

### Changes Made
| File | Change | Why |
|------|--------|-----|
| ... | ... | ... |

### Not Changed (intentional)
- [anything you considered but decided against, with reasoning]
```

## Constraints

- DO NOT refactor component structure — this is polish, not rewrite
- DO NOT add new features or functionality
- DO NOT change business logic
- Keep changes minimal and focused on visual quality
- Always use existing design tokens and utility functions
