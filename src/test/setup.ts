import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/dom'

// Cleanup após cada teste
afterEach(() => {
  cleanup()
})

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('sessionStorage', sessionStorageMock)

// Mock do window.location
vi.stubGlobal('location', {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
})

// Mock do navigator
vi.stubGlobal('navigator', {
  userAgent: 'node.js',
  language: 'pt-BR',
})
