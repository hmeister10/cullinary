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

interface MenuHeaderProps {
  menu: any; // Replace with proper menu type when available
}

export function MenuHeader({ menu }: MenuHeaderProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const { toast } = useToast()

  if (!menu) return null

  // Calculate completion percentage
  const totalDishes = menu.dishes?.length || 0
  const swipedDishes = menu.dishes?.filter((dish: any) => dish.swiped)?.length || 0
  const completionPercentage = totalDishes > 0 ? Math.round((swipedDishes / totalDishes) * 100) : 0

  // Handle share menu
  const handleShare = () => {
    const url = `${window.location.origin}/swipe?menu=${menu.id}`
    
    if (navigator.share) {
      navigator.share({
        title: `Join my menu: ${menu.name}`,
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
        <h1 className="text-xl font-bold truncate">{menu.name || "Menu"}</h1>
        
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
                <p>{menu.participants?.length || 1} participant(s)</p>
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
                <Link href={`/results?menu=${menu.id}`}>
                  View Results
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress value={completionPercentage} className="h-2" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completionPercentage}% complete
        </span>
      </div>
    </div>
  )
} 