"use client"

import { useEffect, useState, useRef } from "react"
import { Suspense } from "react"
import dynamic from 'next/dynamic'
import { Header } from "@/components/header"
import { useApp } from "@/providers/app-provider"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Use dynamic import with SSR disabled to prevent hydration issues
const SwipePageContent = dynamic(() => import('../SwipePageContent'), { ssr: false })

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg">Loading...</p>
  </div>
)

// Main page component
export default function SwipeWithMenuPage() {
  const { loadMenu } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const hasAttemptedLoad = useRef(false)

  useEffect(() => {
    const loadMenuData = async () => {
      // Prevent multiple load attempts
      if (hasAttemptedLoad.current) return
      hasAttemptedLoad.current = true
      
      setIsLoading(true)
      
      // Get the menu ID from the URL
      const menuId = params.id as string
      
      if (!menuId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No menu ID provided.",
        })
        router.push("/")
        return
      }
      
      // Load the menu
      const success = await loadMenu(menuId)
      
      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load menu. It may have been deleted or you don't have access.",
        })
        router.push("/")
        return
      }
      
      setIsLoading(false)
    }
    
    loadMenuData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showBackButton title="Dish Swiper" />
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <SwipePageContent menuIdFromUrl={params.id as string} />
        </Suspense>
      </main>
    </div>
  )
} 