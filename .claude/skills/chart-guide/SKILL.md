---
name: chart-guide
description: Guide for building Recharts visualizations in the Contracker spend tracking page — bar charts, responsive containers, and data formatting conventions.
user_invocable: true
---

# /chart-guide — Recharts Visualization Guide

You are a data visualization specialist for the Contracker spend tracking page. When the user runs `/chart-guide [chart-type]`, provide guidance or generate a chart component.

## Available Chart Types for Contracker

### 1. Spend by Supplier — Horizontal Bar Chart (Primary)
Used on the `/spend` page for top 10 suppliers by spend.

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

type SpendData = {
  name: string
  total: number
}

export function SupplierSpendChart({ data }: { data: SpendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Spend']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### 2. Spend by Category — Vertical Bar Chart
```tsx
<BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} />
  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spend']} />
  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
</BarChart>
```

### 3. Contract Status Distribution — For Dashboard
```tsx
const STATUS_CHART_COLORS = {
  active: '#16a34a',   // green-600
  expiring: '#d97706', // amber-600
  expired: '#dc2626',  // red-600
}
```

## Styling Rules

### Colors
- Use CSS variables from the design system: `hsl(var(--primary))`, `hsl(var(--border))`
- For status-specific charts, use the traffic-light colors directly
- Grid lines: use `hsl(var(--border))` with `strokeDasharray="3 3"`
- Axis text: `hsl(var(--muted-foreground))` at `fontSize: 12`

### Layout
- ALWAYS wrap in `<ResponsiveContainer width="100%" height={N}>`
- Minimum height: 300px for bar charts
- Left margin: 120px for horizontal bars (to fit supplier names)
- Place chart inside a `<Card>` with `<CardHeader>` for title

### Tooltip
- Match card styling: `bg-card`, `border-border`, `rounded-lg`
- Format numbers with `formatCurrency()` from `lib/utils.ts`
- Keep tooltip content minimal — value + label only

### Responsive
- Charts are responsive by default via `ResponsiveContainer`
- On mobile (< 640px), switch horizontal bars to vertical or reduce to top 5
- Hide axis labels if they overlap — use `interval="preserveStartEnd"`

## Data Preparation

Spend data comes from `GET /api/spend` which returns:
```typescript
{
  data: {
    bySupplier: Array<{ name: string; total: number }>
    byCategory: Array<{ category: string; total: number }>
    grandTotal: number
  }
}
```

Sort data descending by `total` before passing to chart. Limit to top 10 for readability.

## Anti-Patterns

- No 3D effects or shadows on bars
- No pie charts — bar charts are always more readable for comparison
- No animation on data update (Recharts default animation is fine on initial load)
- No more than 10 items in a single bar chart — paginate or "show more"
- No dual-axis charts — too confusing for business users
- No custom legend components — use Recharts built-in or a simple key below
