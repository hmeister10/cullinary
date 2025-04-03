"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { useRouter } from "next/navigation"
import { isFirebasePermissionError } from "@/lib/firebase"
import { UserNameForm } from "@/components/user-name-form"
import { Copy, Share2 } from "lucide-react"
import { type Menu } from "@/lib/types/menu-types"

export default function JoinMenuPage() {
  const [menuIdInput, setMenuIdInput] = useState("")
  const [joinedMenuId, setJoinedMenuId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerJoined, setPartnerJoined] = useState(false)
  const [otherParticipantNames, setOtherParticipantNames] = useState<string[]>([])
  const [fetchedParticipantIds, setFetchedParticipantIds] = useState<string[]>([])
  const { user, hasSetName } = useUser()
  const { joinMenu, subscribeToMenuUpdates, getUserNamesByIds } = useMenu()
  const { toast } = useToast()
  const router = useRouter()

  const formatParticipantNames = (names: string[]): string => {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };

  useEffect(() => {
    if (!joinedMenuId || !subscribeToMenuUpdates || !user || !getUserNamesByIds) {
      setPartnerJoined(false)
      setOtherParticipantNames([])
      setFetchedParticipantIds([])
      return
    }

    console.log(`JoinPage: Setting up listener for menu: ${joinedMenuId}`)

    let isFetchingNames = false;

    const unsubscribe = subscribeToMenuUpdates(
      joinedMenuId,
      async (menuData: Menu | null) => {
        console.log("JoinPage: Received menu update:", menuData)
        if (menuData && user) {
          const participants = menuData.participants || [];
          const currentOtherParticipantIds = participants.filter(pId => pId !== user.uid).sort();
          
          const isReady = currentOtherParticipantIds.length > 0;
          setPartnerJoined(isReady);

          console.log(`JoinPage: Readiness check: otherParticipants=${JSON.stringify(currentOtherParticipantIds)}, currentUser=${user.uid}, isReady=${isReady}`);

          const hasIdListChanged = JSON.stringify(currentOtherParticipantIds) !== JSON.stringify(fetchedParticipantIds);
          console.log(`JoinPage: Has ID list changed? ${hasIdListChanged} (Current: ${JSON.stringify(currentOtherParticipantIds)}, Fetched: ${JSON.stringify(fetchedParticipantIds)})`);

          if (isReady && hasIdListChanged && !isFetchingNames) {
            isFetchingNames = true;
            console.log(`JoinPage: Participant list changed. Fetching names for: ${currentOtherParticipantIds.join(', ')}`);
            
            try {
              const namesMap = await getUserNamesByIds(currentOtherParticipantIds);
              const fetchedNames = currentOtherParticipantIds.map(id => namesMap.get(id) || `User...${id.substring(id.length - 4)}`).filter(name => !!name);
              console.log(`JoinPage: Fetched names: ${fetchedNames.join(', ')}`);
              
              setOtherParticipantNames(fetchedNames);
              setFetchedParticipantIds(currentOtherParticipantIds);

              if (fetchedParticipantIds.length === 0 && fetchedNames.length > 0) { 
                 toast({
                   title: `${formatParticipantNames(fetchedNames)} Joined!`, 
                   description: "The menu is ready to start.",
                 })
              }
            } catch (error) {
                 console.error("JoinPage: Error fetching participant names:", error);
                 setOtherParticipantNames(currentOtherParticipantIds.map(id => `User...${id.substring(id.length - 4)}`));
                 setFetchedParticipantIds(currentOtherParticipantIds);
            } finally {
                isFetchingNames = false; 
            }
          } else if (!isReady) {
            if (otherParticipantNames.length > 0 || fetchedParticipantIds.length > 0) {
                 console.log("JoinPage: No longer ready, clearing participant names.");
                 setOtherParticipantNames([]);
                 setFetchedParticipantIds([]);
            }
          }
        } else {
          console.warn(`JoinPage: Menu ${joinedMenuId} not found or deleted, or user missing.`);
          setPartnerJoined(false)
          setOtherParticipantNames([])
          setFetchedParticipantIds([])
        }
      }
    )

    return () => {
      console.log(`JoinPage: Cleaning up listener for menu: ${joinedMenuId}`)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [joinedMenuId, subscribeToMenuUpdates, user?.uid, toast, getUserNamesByIds]);

  const handleJoinMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formattedMenuId = menuIdInput.trim().toUpperCase()
    
    if (!formattedMenuId) {
      setError("Please enter a menu ID")
      return
    }
    
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
        setJoinedMenuId(formattedMenuId)
        setMenuIdInput("")
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

  const copyMenuId = () => {
    if (joinedMenuId) {
      navigator.clipboard.writeText(joinedMenuId)
      toast({
        title: "Copied!",
        description: "Menu ID copied to clipboard.",
      })
    }
  }

  const shareViaWhatsApp = () => {
    if (joinedMenuId) {
      const shareText = `Join our Cullinary weekly menu! Use this Menu ID: ${joinedMenuId}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, "_blank")
    }
  }

  const goToSwipeInterface = () => {
    if (joinedMenuId && partnerJoined) {
      router.push(`/swipe?menu=${joinedMenuId}`)
    } else if (joinedMenuId && !partnerJoined) {
      toast({
        variant: "default",
        title: "Waiting",
        description: "Waiting for at least one other participant to join.",
      })
    }
  }

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
          <CardTitle>{joinedMenuId ? "Joined Menu" : "Join a Menu"}</CardTitle>
          <CardDescription>
            {joinedMenuId 
              ? "Share the ID or wait for others to join."
              : "Enter the menu ID shared with you"}
          </CardDescription>
        </CardHeader>

        {!joinedMenuId ? (
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
                    value={menuIdInput}
                    onChange={(e) => setMenuIdInput(e.target.value.toUpperCase())}
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
        ) : (
          <>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold">Menu ID</h3>
                  <p className="text-sm text-muted-foreground mb-2">Share this with your friends/family!</p>
                  <div className="flex items-center">
                    <div className="text-3xl font-mono tracking-wider bg-secondary p-3 rounded-lg">{joinedMenuId}</div>
                    <Button variant="ghost" size="icon" onClick={copyMenuId} className="ml-2" aria-label="Copy Menu ID">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col space-y-3 w-full max-w-xs">
                  <Button onClick={shareViaWhatsApp} className="flex items-center justify-center">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    <p className="font-medium mb-1">Participants:</p>
                    <p>{user?.name || `You (User...${user?.uid.substring(user.uid.length - 4)})`}</p> 
                    {otherParticipantNames.map((name, index) => (
                        <p key={index}>{name}</p> 
                    ))}
                    {!partnerJoined && otherParticipantNames.length === 0 && (
                        <p className="italic mt-1">Waiting for others to join...</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                onClick={goToSwipeInterface} 
                className="w-full max-w-xs"
                disabled={!partnerJoined} 
              >
                {partnerJoined ? "Start Making Your Menu!" : "Waiting for Participants"} 
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
} 