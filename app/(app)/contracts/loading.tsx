export default function ContractsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-white/[0.06] animate-shimmer" />
          <div className="h-4 w-28 rounded bg-white/[0.04] animate-shimmer" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-white/[0.06] animate-shimmer" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-9 flex-1 rounded-lg bg-white/[0.04] animate-shimmer" />
        <div className="h-9 w-32 rounded-lg bg-white/[0.04] animate-shimmer" />
        <div className="h-9 w-32 rounded-lg bg-white/[0.04] animate-shimmer" />
      </div>

      {/* Table skeleton */}
      <div
        className="overflow-hidden rounded-2xl border border-white/[0.08] backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)' }}
              className="border-b border-white/[0.08]"
            >
              {['Name', 'Supplier', 'Type', 'Value', 'Renewal', 'Status'].map((col) => (
                <th key={col} className="px-5 py-3.5 text-left">
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
                {/* Name */}
                <td className="px-5 py-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 rounded bg-white/[0.06] animate-shimmer" />
                    <div className="h-3 w-24 rounded bg-white/[0.04] animate-shimmer" />
                  </div>
                </td>
                {/* Supplier */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-white/[0.06] animate-shimmer flex-shrink-0" />
                    <div className="h-4 w-28 rounded bg-white/[0.06] animate-shimmer" />
                  </div>
                </td>
                {/* Type */}
                <td className="px-5 py-4">
                  <div className="h-5 w-20 rounded-full bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Value */}
                <td className="px-5 py-4">
                  <div className="h-4 w-20 rounded bg-white/[0.06] animate-shimmer" />
                </td>
                {/* Renewal */}
                <td className="px-5 py-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded bg-white/[0.06] animate-shimmer" />
                    <div className="h-3 w-16 rounded bg-white/[0.04] animate-shimmer" />
                  </div>
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                  <div className="h-5 w-20 rounded-full bg-white/[0.06] animate-shimmer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
