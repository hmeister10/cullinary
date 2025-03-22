"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Lock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMenu } from "@/providers/contexts"
import { MenuRepository } from "@/lib/repositories/menu.repository"

interface MenuShareOptionsProps {
  menuId: string
  onStartSwiping: () => void
}

export function MenuShareOptions({ menuId, onStartSwiping }: MenuShareOptionsProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [participantCount, setParticipantCount] = useState(1) // Start with just you
  const [mode, setMode] = useState<"waiting" | "solo" | "ready" | "locked">("waiting")
  const { toast } = useToast()
  const { getMenuParticipants, loadMenu, activeMenu } = useMenu()
  const menuRepository = new MenuRepository()

  useEffect(() => {
    // Check for participants when component mounts and periodically
    const checkParticipants = async () => {
      try {
        // Get the participants list from the menu context
        const participants = await getMenuParticipants(menuId)
        setParticipantCount(participants.length)
        
        // If more than one participant has joined, we're ready to start
        if (participants.length > 1) {
          setMode("ready")
        }
        
        // Check if menu is already locked
        if (activeMenu && activeMenu.status === 'active') {
          setMode("locked")
        }
      } catch (error) {
        console.error("Error checking participants:", error)
      }
    }
    
    // Check immediately
    checkParticipants()
    
    // Then check every 5 seconds
    const intervalId = setInterval(checkParticipants, 5000)
    
    // Clean up on unmount
    return () => clearInterval(intervalId)
  }, [menuId, getMenuParticipants, activeMenu])

  const copyMenuId = () => {
    navigator.clipboard.writeText(menuId)
    toast({
      title: "Copied!",
      description: "Menu ID copied to clipboard.",
    })
  }

  const shareViaWhatsApp = () => {
    setIsSharing(true)
    const shareText = `Join me in creating our weekly menu! Use this Menu ID to join: ${menuId}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, "_blank")
    setIsSharing(false)
  }

  const lockMenu = async () => {
    try {
      // Update the menu status directly with the repository
      const updated = await menuRepository.updateMenu(menuId, { status: 'active' })
      return !!updated
    } catch (error) {
      console.error("Error locking menu:", error)
      return false
    }
  }

  const handleSoloMode = async () => {
    setIsLocking(true)
    try {
      // Lock the menu to prevent others from joining
      const success = await lockMenu()
      if (success) {
        setMode("solo")
        // Reload the menu to get the updated status
        await loadMenu(menuId)
        // Start swiping immediately in solo mode
        onStartSwiping()
      } else {
        throw new Error("Failed to lock menu")
      }
    } catch (error) {
      console.error("Error setting solo mode:", error)
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Could not start solo mode. Please try again."
      })
    } finally {
      setIsLocking(false)
    }
  }

  const handleStartWithPartner = async () => {
    setIsLocking(true)
    try {
      // Lock the menu to prevent others from joining
      const success = await lockMenu()
      if (success) {
        setMode("locked")
        // Reload the menu to get the updated status
        await loadMenu(menuId)
        // Start swiping with partner
        onStartSwiping()
      } else {
        throw new Error("Failed to lock menu")
      }
    } catch (error) {
      console.error("Error locking menu:", error)
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Could not lock menu. Please try again."
      })
    } finally {
      setIsLocking(false)
    }
  }

  return (
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
        {mode !== "locked" && (
          <Button 
            onClick={shareViaWhatsApp} 
            disabled={isSharing} 
            className="flex items-center justify-center"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
        )}
        
        {mode === "waiting" && (
          <>
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-2">
              <Users className="h-3 w-3" />
              <p>Waiting for a partner to join... ({participantCount}/2)</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSoloMode} 
              disabled={isLocking}
              className="mt-4"
            >
              {isLocking ? "Starting Solo Mode..." : "Continue in Solo Mode"}
            </Button>
          </>
        )}
        
        {mode === "ready" && (
          <Button 
            onClick={handleStartWithPartner} 
            disabled={isLocking}
            className="mt-4 flex items-center justify-center"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLocking ? "Locking Menu..." : "Start Swiping Together"}
          </Button>
        )}
        
        {mode === "locked" && (
          <div className="flex flex-col items-center space-y-2 mt-2">
            <div className="flex items-center text-amber-500 text-sm">
              <Lock className="h-4 w-4 mr-2" />
              <p>Menu is locked and ready</p>
            </div>
            <Button 
              onClick={onStartSwiping} 
              className="mt-2"
            >
              Start Swiping
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 