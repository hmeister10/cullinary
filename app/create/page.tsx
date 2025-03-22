"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { addDays } from "date-fns"
import { useApp } from "@/providers/app-provider"
import { useRouter } from "next/navigation"
import { UserNameForm } from "@/components/user-name-form"
import { DateSelectionForm, MenuShareOptions } from "./components"

export default function CreateMenuPage() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [menuId, setMenuId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { createMenu, hasSetName } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const createRequestInProgress = useRef(false)

  const handleCreateMenu = async () => {
    // Prevent multiple simultaneous requests
    if (createRequestInProgress.current) return;
    
    try {
      createRequestInProgress.current = true;
      setIsCreating(true)
      const endDate = addDays(startDate, 6) // 7 day menu
      const id = await createMenu(startDate, endDate)
      
      // Only update state if we got a valid ID back
      if (id) {
        setMenuId(id)
        toast({
          title: "Menu Created!",
          description: "Share the menu ID with your partner to start.",
        })
      }
    } catch (error) {
      console.error("Error creating menu:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create menu. Please try again.",
      })
    } finally {
      setIsCreating(false)
      createRequestInProgress.current = false;
    }
  }

  const handleStartSwiping = () => {
    if (menuId) {
      router.push(`/swipe/${menuId}`)
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
    // Main container for the page layout
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        {/* Card header with title and description */}
        <CardHeader>
          <CardTitle>Create Weekly Menu</CardTitle>
          <CardDescription>Select a start date for your 7-day menu</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Conditional rendering based on whether a menu ID exists */}
          {!menuId ? (
            <DateSelectionForm 
              startDate={startDate} 
              setStartDate={setStartDate} 
            />
          ) : (
            <MenuShareOptions 
              menuId={menuId} 
              onStartSwiping={handleStartSwiping}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!menuId ? (
            <>
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button onClick={handleCreateMenu} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Menu"}
              </Button>
            </>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

