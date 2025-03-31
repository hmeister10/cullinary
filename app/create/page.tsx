"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"
import { CalendarIcon, Copy, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { useRouter } from "next/navigation"
import { UserNameForm } from "@/components/user-name-form"
import { type Menu } from "@/lib/types/menu-types"

// Define the correct component for this file
export default function CreateMenuPage() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [menuId, setMenuId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [partnerJoined, setPartnerJoined] = useState(false) // Used for button state
  const [otherParticipantNames, setOtherParticipantNames] = useState<string[]>([])
  const [fetchedParticipantIds, setFetchedParticipantIds] = useState<string[]>([])
  const { user, hasSetName } = useUser()
  const { createMenu, subscribeToMenuUpdates, getUserNamesByIds } = useMenu()
  const { toast } = useToast()
  const router = useRouter()
  const createRequestInProgress = useRef(false)

  // Helper to format names
  const formatParticipantNames = (names: string[]): string => {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };

  // Effect to listen for participants joining
  useEffect(() => {
    if (!menuId || !subscribeToMenuUpdates || !user || !getUserNamesByIds) {
      setPartnerJoined(false)
      setOtherParticipantNames([])
      setFetchedParticipantIds([])
      return
    }

    console.log(`CreatePage: Setting up listener for menu: ${menuId}`)

    let isFetchingNames = false;

    const unsubscribe = subscribeToMenuUpdates(
      menuId,
      async (menuData: Menu | null) => {
        console.log("CreatePage: Received menu update:", menuData)
        if (menuData && user) {
          const participants = menuData.participants || [];
          const currentOtherParticipantIds = participants.filter(pId => pId !== user.uid).sort();
          
          const isReady = currentOtherParticipantIds.length > 0;
          setPartnerJoined(isReady);

          console.log(`CreatePage: Readiness check: otherParticipants=${JSON.stringify(currentOtherParticipantIds)}, currentUser=${user.uid}, isReady=${isReady}`);

          const hasIdListChanged = JSON.stringify(currentOtherParticipantIds) !== JSON.stringify(fetchedParticipantIds);
          console.log(`CreatePage: Has ID list changed? ${hasIdListChanged} (Current: ${JSON.stringify(currentOtherParticipantIds)}, Fetched: ${JSON.stringify(fetchedParticipantIds)})`);

          if (isReady && hasIdListChanged && !isFetchingNames) {
            isFetchingNames = true;
            console.log(`CreatePage: Participant list changed. Fetching names for: ${currentOtherParticipantIds.join(', ')}`);
            
            try {
              const namesMap = await getUserNamesByIds(currentOtherParticipantIds);
              const fetchedNames = currentOtherParticipantIds.map(id => namesMap.get(id) || `User...${id.substring(id.length - 4)}`).filter(name => !!name);
              console.log(`CreatePage: Fetched names: ${fetchedNames.join(', ')}`);
              
              setOtherParticipantNames(fetchedNames);
              setFetchedParticipantIds(currentOtherParticipantIds);

              // Only toast when the *first* other participant joins
              if (fetchedParticipantIds.length === 0 && fetchedNames.length > 0) { 
                 toast({
                   title: `${formatParticipantNames(fetchedNames)} Joined!`, 
                   description: "The menu is ready to start.",
                 })
              }
            } catch (error) {
                 console.error("CreatePage: Error fetching participant names:", error);
                 setOtherParticipantNames(currentOtherParticipantIds.map(id => `User...${id.substring(id.length - 4)}`));
                 setFetchedParticipantIds(currentOtherParticipantIds);
            } finally {
                isFetchingNames = false; 
            }
          } else if (!isReady) {
            // Not ready, clear names and fetched IDs
            if (otherParticipantNames.length > 0 || fetchedParticipantIds.length > 0) {
                 console.log("CreatePage: No longer ready, clearing participant names.");
                 setOtherParticipantNames([]);
                 setFetchedParticipantIds([]);
            }
          }
        } else {
          // Menu deleted or user logged out
          console.warn(`CreatePage: Menu ${menuId} not found or deleted, or user missing.`);
          setPartnerJoined(false)
          setOtherParticipantNames([])
          setFetchedParticipantIds([])
        }
      }
    )

    return () => {
      console.log(`CreatePage: Cleaning up listener for menu: ${menuId}`)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  // Dependencies for the listener effect
  }, [menuId, subscribeToMenuUpdates, user?.uid, toast, getUserNamesByIds]); 

  // Function to handle creating a new menu
  const handleCreateMenu = async () => {
    if (createRequestInProgress.current) return;
    
    try {
      createRequestInProgress.current = true;
      setIsCreating(true)
      const endDate = addDays(startDate, 6)
      // Call the createMenu function from the context
      const id = await createMenu(startDate, endDate)
      
      if (id) {
        setMenuId(id) // Set the menu ID in state
        toast({
          title: "Menu Created!",
          description: "Share the menu ID with your partner to start.",
        })
      } else {
        // Handle case where createMenu might fail without throwing (optional)
        toast({ 
            variant: "destructive", 
            title: "Error", 
            description: "Failed to get menu ID after creation."
         });
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

  // Function to copy the menu ID
  const copyMenuId = () => {
    if (menuId) {
      navigator.clipboard.writeText(menuId)
      toast({
        title: "Copied!",
        description: "Menu ID copied to clipboard.",
      })
    }
  }

  // Function to share via WhatsApp
  const shareViaWhatsApp = () => {
    if (menuId) {
      setIsSharing(true)
      const shareText = `Join our Cullinary weekly menu! Use this Menu ID: ${menuId}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, "_blank")
      // Reset sharing state after a short delay to allow window to open
      setTimeout(() => setIsSharing(false), 500); 
    }
  }

  // Function to navigate to the swipe interface
  const goToSwipeInterface = () => {
    if (menuId && partnerJoined) {
      // Navigate only if menu exists and at least one partner joined
      router.push(`/swipe?menu=${menuId}`)
    } else if (menuId && !partnerJoined) {
      // Inform user they need to wait
      toast({
        variant: "default",
        title: "Waiting",
        description: "Waiting for at least one other participant to join.",
      })
    }
  }

  // Render username form if name not set
  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

  // Main component render
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Weekly Menu</CardTitle>
          <CardDescription>Select a start date for your 7-day menu</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show date picker UI if menuId is not set yet */}
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
            // Show menu ID and participant info if menuId is set
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold">Your Menu ID</h3>
                <p className="text-sm text-muted-foreground mb-2">Share this with your friends/family!</p>
                <div className="flex items-center">
                  <div className="text-3xl font-mono tracking-wider bg-secondary p-3 rounded-lg">{menuId}</div>
                  <Button variant="ghost" size="icon" onClick={copyMenuId} className="ml-2" aria-label="Copy Menu ID">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col space-y-3 w-full max-w-xs">
                <Button onClick={shareViaWhatsApp} disabled={isSharing} className="flex items-center justify-center">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share via WhatsApp
                </Button>
                
                {/* Participants List */}
                <div className="text-xs text-center text-muted-foreground pt-2">
                   <p className="font-medium mb-1">Participants:</p>
                   {/* Display current user's name */}
                   <p>{user?.name || `You (User...${user?.uid.substring(user.uid.length - 4)})`}</p> 
                   {/* List other joined participants */}
                   {otherParticipantNames.map((name, index) => (
                      <p key={index}>{name}</p> 
                   ))}
                   {/* Show waiting message if no one else has joined */}
                   {!partnerJoined && otherParticipantNames.length === 0 && (
                      <p className="italic mt-1">Waiting for others to join...</p>
                   )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* Show Cancel/Create buttons before menu is created */}
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
             // Show Start button after menu is created 
            <Button 
                onClick={goToSwipeInterface} 
                className="w-full" 
                // Disable button until at least one other person joins
                disabled={!partnerJoined} 
            >
              {partnerJoined ? "Start Making Your Menu!" : "Waiting for Participants"} 
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

