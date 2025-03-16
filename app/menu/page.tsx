"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"

export default function MenuRedirectPage() {
  const { activeMenu, loadMenu } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRedirected = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const handleRedirect = async () => {
      // Prevent multiple redirects
      if (hasRedirected.current) return
      hasRedirected.current = true
      
      try {
        // Check if there's a menu ID in the URL
        const menuId = searchParams.get('menu')
        
        // If there's an active menu, redirect to the menu page with that menu ID
        if (activeMenu) {
          console.log("Active menu found, redirecting to menu page:", activeMenu.menu_id)
          router.push(`/menu/${activeMenu.menu_id}`)
          return
        }
        
        // If there's a menu ID in the URL, try to load it
        if (menuId) {
          console.log("Menu ID found in URL, attempting to load:", menuId)
          const success = await loadMenu(menuId)
          
          if (success) {
            console.log("Successfully loaded menu from URL, redirecting to menu page:", menuId)
            router.push(`/menu/${menuId}`)
            return
          } else {
            console.log("Failed to load menu from URL:", menuId)
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load menu. It may have been deleted or you don't have access.",
            })
          }
        }
        
        // If we get here, there's no active menu and no valid menu ID in the URL
        console.log("No active menu or valid menu ID, redirecting to home")
        router.push("/")
      } catch (error) {
        console.error("Error in redirect logic:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }
    
    handleRedirect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="text-center">
        {isLoading && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}
        <p className="text-lg">Redirecting...</p>
      </div>
    </div>
  )
} 