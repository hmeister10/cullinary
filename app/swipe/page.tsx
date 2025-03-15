"use client"

import { Suspense } from "react"
import dynamic from 'next/dynamic'
import { Header } from "@/components/header"

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
    <div className="flex min-h-screen flex-col">
      <Header showBackButton title="Dish Swiper" />
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <SwipePageContent />
        </Suspense>
      </main>
    </div>
  )
}

