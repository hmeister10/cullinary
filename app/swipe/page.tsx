"use client"

import { Suspense } from "react"
import dynamic from 'next/dynamic'

// Use dynamic import with SSR disabled to prevent hydration issues
const SwipePageContent = dynamic(() => import('./SwipePageContent'), { ssr: false })

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg">Loading...</p>
  </div>
)

// Main page component
export default function SwipePage() {
  return (
    <Suspense fallback={<Loading />}>
      <SwipePageContent />
    </Suspense>
  )
}

