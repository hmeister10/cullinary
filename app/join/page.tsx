"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter } from "next/navigation"
import { isFirebasePermissionError } from "@/lib/firebase"
import { UserNameForm } from "@/components/user-name-form"

export default function JoinMenuPage() {
  const [menuId, setMenuId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { joinMenu, hasSetName } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  const handleJoinMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Format the menu ID to uppercase and remove any whitespace
    const formattedMenuId = menuId.trim().toUpperCase()
    
    if (!formattedMenuId) {
      setError("Please enter a menu ID")
      return
    }
    
    // Validate menu ID format (6 characters, alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(formattedMenuId)) {
      setError("Invalid menu ID format. Menu IDs are 6 characters long and contain only letters and numbers.")
      return
    }
    
    setError(null)
    setIsJoining(true)
    
    try {
      console.log(`Join Page: Attempting to join menu with ID: ${formattedMenuId}`);
      const success = await joinMenu(formattedMenuId)
      
      if (success) {
        toast({
          title: "Menu Joined!",
          description: "You can now start swiping on dishes.",
        })
        router.push(`/swipe?menu=${formattedMenuId}`)
      } else {
        console.log(`Join Page: Failed to join menu with ID: ${formattedMenuId}`);
        setError("Menu not found. Please check the ID and try again. Make sure the ID is exactly as shared with you.")
      }
    } catch (error) {
      console.error("Error joining menu:", error)
      
      if (isFirebasePermissionError(error)) {
        setError("Permission denied. Please check the Firestore Security Rules Guide for more information.")
      } else {
        setError(`Failed to join menu. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsJoining(false)
    }
  }

  // Show name form if user hasn't set a name yet
  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join a Menu</CardTitle>
          <CardDescription>Enter the menu ID shared with you</CardDescription>
        </CardHeader>
        <form onSubmit={handleJoinMenu}>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label
                  htmlFor="menuId"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Menu ID
                </label>
                <Input
                  id="menuId"
                  placeholder="Enter menu ID (e.g., WYAJRF)"
                  value={menuId}
                  onChange={(e) => setMenuId(e.target.value.toUpperCase())}
                  className="uppercase font-mono tracking-wider text-center"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Menu IDs are 6 characters long and contain only letters and numbers.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {error && error.includes("Firestore Security Rules") && (
                <p className="text-sm">
                  <a href="/security-rules-guide" className="text-primary underline">
                    View Firestore Security Rules Guide
                  </a>
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isJoining}>
              {isJoining ? "Joining..." : "Join Menu"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 