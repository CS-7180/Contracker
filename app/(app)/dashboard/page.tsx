import { Button } from '@/components/ui/button'

// Dashboard implementation coming in M2.1 (basic counts) and M2.2 (traffic-light UI)
export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">Contract overview coming in Sprint 2.</p>
      {/* Render Button to satisfy M1.0 success criterion: shadcn/ui Button renders without issues */}
      <Button>Get Started</Button>
    </div>
  )
}
