"use client"

import { ReactNode } from 'react'
import { ProviderComposer } from './provider-composer'
import { useUser, useMenu, useSwipe } from './contexts'

// Create a compatibility layer for the old useApp hook to prevent breaking existing code
export function useApp() {
  const userContext = useUser()
  const menuContext = useMenu()
  const swipeContext = useSwipe()

  // Combine all contexts into a single object that matches the old useApp return type
  return {
    ...userContext,
    ...menuContext,
    ...swipeContext
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  return <ProviderComposer>{children}</ProviderComposer>
}

