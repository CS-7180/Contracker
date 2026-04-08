/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      // Start the production build — requires `npm run build` to have run first
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30_000,
      // Test the login page — publicly accessible without auth
      url: ['http://localhost:3000/login'],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        // Sprint 3 gate: tighten to 'error' once perf work is done (M3.4).
        // CI runners are ~2-3x slower than real browsers, so we use warn here
        // and validate the 2.5s target against the Vercel preview URL manually.
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 6000 }],
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
