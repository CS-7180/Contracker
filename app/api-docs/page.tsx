'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI with SSR disabled — swagger-ui-react has browser-only code.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load spec: ${res.status}`)
        return res.json()
      })
      .then(setSpec)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    // Explicitly light background — this page is outside the (app) group and not
    // themed to the dark sidebar. swagger-ui-react ships its own light-mode CSS.
    <div className="min-h-screen" style={{ background: '#fff', color: '#000' }}>
      <div style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb', padding: '16px 24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
          Contracker — API Documentation
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
          Interactive OpenAPI 3.0 reference for all REST endpoints.
          Authenticate via the Supabase session cookie obtained after logging in.
        </p>
      </div>

      {error && (
        <div style={{ margin: 24, padding: 16, borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {!spec && !error && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', fontSize: '0.875rem', color: '#9ca3af' }}>
          Loading spec…
        </div>
      )}

      {spec && (
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          tryItOutEnabled={false}
        />
      )}
    </div>
  )
}
