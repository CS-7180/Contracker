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
        // Hard gates — fail the PR if breached
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // Soft warnings — logged but do not fail the PR
        'first-contentful-paint': ['warn', { minScore: 0 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
