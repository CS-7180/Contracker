import '@testing-library/jest-dom'
import { config } from 'dotenv'
import path from 'path'

// Load .env.test for test environment
// override: true ensures .env.test values win over any empty strings
// already in process.env (e.g. from GitHub Actions environment)
config({ path: path.resolve(process.cwd(), '.env.test'), override: true })
