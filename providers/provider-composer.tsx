"use client"

import { ReactNode } from 'react'
import { UserProvider, MenuProvider, SwipeProvider } from './contexts'

type ProviderComponentType = React.FC<{ children: ReactNode }>

// Array of provider components that will be composed together
const providers: ProviderComponentType[] = [
  UserProvider,
  MenuProvider,
  SwipeProvider,
  // Add more providers here as needed
]

interface ProviderComposerProps {
  children: ReactNode
  additionalProviders?: ProviderComponentType[]
}

/**
 * Composes multiple providers into a single nested structure.
 * Uses the reduceRight function to nest from outermost to innermost.
 */
export function ProviderComposer({ 
  children, 
  additionalProviders = [] 
}: ProviderComposerProps) {
  // Combine default providers with any additional providers
  const allProviders = [...providers, ...additionalProviders]
  
  // Use reduce to nest providers from the array
  return allProviders.reduceRight((acc, Provider) => {
    return <Provider>{acc}</Provider>
  }, children)
}

/**
 * Helper function to create a provider composition with specific providers
 * @param specificProviders The list of providers to use
 * @returns A provider composer function
 */
export function createProviderComposition(specificProviders: ProviderComponentType[]) {
  return ({ children }: { children: ReactNode }) => {
    return specificProviders.reduceRight((acc, Provider) => {
      return <Provider>{acc}</Provider>
    }, children)
  }
} 