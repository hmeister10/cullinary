"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/providers/app-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenuParticipantsProps {
  menuId: string
}

export function MenuParticipants({ menuId }: MenuParticipantsProps) {
  const { getMenuParticipants } = useApp()
  const [participants, setParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setIsLoading(true)
        const participantsList = await getMenuParticipants(menuId)
        setParticipants(participantsList)
      } catch (error) {
        console.error("Error fetching participants:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (menuId) {
      fetchParticipants()
    }
  }, [menuId, getMenuParticipants])

  const shareMenu = () => {
    setIsSharing(true)
    const shareText = `Join me in creating our weekly menu! Use this Menu ID to join: ${menuId}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, "_blank")
    setIsSharing(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Menu Participants</CardTitle>
            <CardDescription>People joined to this menu</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={shareMenu} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">Loading participants...</p>
          </div>
        ) : participants.length > 0 ? (
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center p-2 bg-secondary/50 rounded-md">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{participant}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">No participants found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 