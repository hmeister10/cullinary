"use client"

import { useEffect, useState, useRef } from "react"
import { Suspense } from "react"
import dynamic from 'next/dynamic'
import { Header } from "@/components/header"
import { useApp } from "@/providers/app-provider"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

// Use dynamic import with SSR disabled to prevent hydration issues
const SwipePageContent = dynamic(() => import('../SwipePageContent'), { ssr: false })

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-lg">Loading...</p>
    </div>
  </div>
)

// Main page component
export default function SwipeWithMenuPage() {
  const { loadMenu, user, loading } = useApp()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasAttemptedLoad = useRef(false)

  useEffect(() => {
    // Wait for user to be initialized before attempting to load menu
    if (loading) return;

    const loadMenuData = async () => {
      // Prevent multiple load attempts
      if (hasAttemptedLoad.current) return
      hasAttemptedLoad.current = true
      
      setIsLoading(true)
      setLoadError(null)
      
      try {
        // Get the menu ID from the URL
        const menuId = params.id as string
        
        // Load the menu
        const success = await loadMenu(menuId)
        
        if (!success) {
          setLoadError("Failed to load menu. It may have been deleted or you don't have access.")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load menu. It may have been deleted or you don't have access.",
          })
          return
        }
        
        console.log("Successfully loaded menu:", menuId)
      } catch (error) {
        console.error("Error loading menu:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMenuData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]) // Add loading and hasSetName as dependencies

  const goHome = () => {
    router.push("/")
  }

  if (isLoading) {
    return <Loading />
  }

  if (loadError) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{loadError}</p>
          </div>
          <Button onClick={goHome}>Return to Home</Button>
        </div>
      </div>
    )
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