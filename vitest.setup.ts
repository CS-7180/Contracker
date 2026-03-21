import '@testing-library/jest-dom'
import { config } from 'dotenv'
import path from 'path'

// Load .env.test for test environment
config({ path: path.resolve(process.cwd(), '.env.test') })
