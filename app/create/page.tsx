"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"
import { CalendarIcon, Copy, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/providers/app-provider"
import { useRouter } from "next/navigation"

export default function CreateMenuPage() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [menuId, setMenuId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { createMenu } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  const handleCreateMenu = async () => {
    try {
      setIsCreating(true)
      const endDate = addDays(startDate, 6) // 7 day menu
      const id = await createMenu(startDate, endDate)
      setMenuId(id)
      toast({
        title: "Menu Created!",
        description: "Share the menu ID with your partner to start.",
      })
    } catch (error) {
      console.error("Error creating menu:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create menu. Please try again.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyMenuId = () => {
    if (menuId) {
      navigator.clipboard.writeText(menuId)
      toast({
        title: "Copied!",
        description: "Menu ID copied to clipboard.",
      })
    }
  }

  const shareViaWhatsApp = () => {
    if (menuId) {
      setIsSharing(true)
      const shareText = `Join me in creating our weekly menu! Use this Menu ID to join: ${menuId}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, "_blank")
      setIsSharing(false)
    }
  }

  const goToSwipeInterface = () => {
    if (menuId) {
      router.push(`/swipe?menu=${menuId}`)
    } else {
      router.push("/swipe")
    }
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Weekly Menu</CardTitle>
          <CardDescription>Select a start date for your 7-day menu</CardDescription>
        </CardHeader>
        <CardContent>
          {!menuId ? (
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label
                  htmlFor="date"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="text-sm text-muted-foreground">
                Your menu will be for 7 days, from <span className="font-medium">{format(startDate, "PPP")}</span> to{" "}
                <span className="font-medium">{format(addDays(startDate, 6), "PPP")}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold">Your Menu ID</h3>
                <p className="text-sm text-muted-foreground mb-2">Share this with your partner</p>
                <div className="flex items-center">
                  <div className="text-3xl font-mono tracking-wider bg-secondary p-3 rounded-lg">{menuId}</div>
                  <Button variant="ghost" size="icon" onClick={copyMenuId} className="ml-2">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col space-y-2 w-full max-w-xs">
                <Button onClick={shareViaWhatsApp} disabled={isSharing} className="flex items-center justify-center">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share via WhatsApp
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">Waiting for your partner to join...</p>
              </div>
            </div>
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
          ) : (
            <Button onClick={goToSwipeInterface} className="w-full">
              Start Swiping
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

