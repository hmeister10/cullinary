"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, Users, MoreHorizontal, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type Menu } from "@/lib/mock-data"
import { format, parseISO } from "date-fns"

interface MenuHeaderProps {
  menu: Menu | null;
}

export function MenuHeader({ menu }: MenuHeaderProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const { toast } = useToast()

  if (!menu) return null

  // Calculate match progress
  const matches = menu.matches;
  const totalMatches = (
    (matches?.breakfast?.length || 0) +
    (matches?.lunch?.length || 0) +
    (matches?.dinner?.length || 0) +
    (matches?.snack?.length || 0)
  );
  const totalSlots = 7 * 4; // 7 days, 4 meals (assuming B/L/D/S)
  const matchPercentage = totalSlots > 0 ? Math.round((totalMatches / totalSlots) * 100) : 0;

  // Construct a display name/title for the menu
  const menuDisplayName = menu.start_date 
    ? `Menu ${format(parseISO(menu.start_date), "MMM d")}` 
    : "Menu"

  // Handle share menu
  const handleShare = () => {
    const url = `${window.location.origin}/swipe?menu=${menu.menu_id}`
    
    if (navigator.share) {
      navigator.share({
        title: `Join my menu: ${menuDisplayName}`,
        text: `Join my menu to help plan our meal!`,
        url: url,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShowShareTooltip(true)
        toast({
          title: "Link copied!",
          description: "Share this link with others to join your menu.",
        })
        setTimeout(() => setShowShareTooltip(false), 2000)
      }).catch(console.error)
    }
  }

  return (
    <div className="w-full max-w-md mb-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold truncate">{menuDisplayName}</h1>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip open={showShareTooltip}>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleShare}
                  aria-label="Share menu"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Link copied!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  aria-label="View participants"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{menu.participants?.length || 0} participant(s)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                aria-label="Menu options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/menu/${menu.menu_id}`}>
                  View Menu
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress value={matchPercentage} className="h-2" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {totalMatches} / {totalSlots} matches
        </span>
      </div>
    </div>
  )
} 