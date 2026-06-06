// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
// with Vitest's expect, and their type augmentation across the suite.
import '@testing-library/jest-dom/vitest'

// With globals disabled, Testing Library can't auto-register its cleanup,
// so unmount each render after every test to keep the jsdom DOM isolated.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
