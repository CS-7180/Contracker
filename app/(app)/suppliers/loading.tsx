export default function SuppliersLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-white/[0.06] animate-shimmer" />
          <div className="h-4 w-24 rounded bg-white/[0.04] animate-shimmer" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-white/[0.06] animate-shimmer" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-9 w-72 rounded-lg bg-white/[0.04] animate-shimmer" />

      {/* Table skeleton */}
      <div
        className="overflow-hidden rounded-2xl border border-white/[0.08] backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 50%, rgba(255,255,255,0.02) 100%)' }}
              className="border-b border-white/[0.08]"
            >
              {['Supplier', 'Category', 'Contact', 'Status', 'Contract Risk', ''].map((col, i) => (
                <th key={i} className="px-5 py-3.5 text-left">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                    {col}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="opacity-100">
                {/* Supplier with avatar */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.06] animate-shimmer flex-shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-36 rounded bg-white/[0.06] animate-shimmer" />
                      <div className="h-3 w-20 rounded bg-white/[0.04] animate-shimmer" />
                    </div>
                  </div>
                </td>
                {/* Category */}
                <td className="px-5 py-4">
                  <div className="h-5 w-20 rounded-full bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Contact */}
                <td className="px-5 py-4">
                  <div className="h-4 w-32 rounded bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                  <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Contract Risk */}
                <td className="px-5 py-4">
                  <div className="h-5 w-12 rounded-full bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Arrow */}
                <td className="px-5 py-4">
                  <div className="h-4 w-4 rounded bg-white/[0.04] animate-shimmer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
