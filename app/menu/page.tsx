"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function MenuRedirectPage() {
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    hasRedirected.current = true
    
    // Redirect to the home page
    router.push("/")
  }, []) // Empty dependency array to run only once

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <p>Redirecting...</p>
    </div>
  )
} 