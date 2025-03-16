"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/providers/app-provider"

export default function SwipeRedirectPage() {
  const { activeMenu } = useApp()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    hasRedirected.current = true
    
    // If there's an active menu, redirect to the swipe page with that menu ID
    if (activeMenu) {
      router.push(`/swipe/${activeMenu.menu_id}`)
    } else {
      // Otherwise, redirect to the home page
      router.push("/")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecting...</p>
    </div>
  )
}

