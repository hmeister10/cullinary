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
import { Share2, Users, MoreHorizontal, Home, ListChecks } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Menu, MenuDish } from "@/lib/types/menu-types"

interface MenuHeaderProps {
  menu?: Menu; // Make menu optional with proper TypeScript syntax
}

export function MenuHeader({ menu }: MenuHeaderProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const { toast } = useToast()

  if (!menu) return null

  // --- Simplified Progress Calculation --- 
  // Calculate total number of matched dishes across all categories
  const totalMatches = Object.values(menu.matches || {}).reduce((sum, categoryMatches) => sum + categoryMatches.length, 0);
  // Estimate total possible dishes (e.g., based on a typical fetch size per category)
  // This is very rough and could be improved later.
  const estimatedTotalDishes = 30 * 4; // Assuming ~30 dishes per 4 categories
  const completionPercentage = estimatedTotalDishes > 0 
    ? Math.round((totalMatches / estimatedTotalDishes) * 50) // Multiply by 50 as match means 2 people swiped
    : 0;
  // --- End Simplified Calculation --- 

  // Handle share menu
  const handleShare = () => {
    const url = `${window.location.origin}/swipe?menu=${menu.menu_id}` // URL to join the swipe session
    
    if (navigator.share) {
      navigator.share({
        title: `Join my menu: ${menu.menu_id}`,
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
        <h1 className="text-xl font-bold truncate">{menu.menu_id || "Menu"}</h1>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip open={showShareTooltip}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share menu">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Link copied!</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="View participants">
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{menu.participants?.length || 1} participant(s)</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menu options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/"><Home className="h-4 w-4 mr-2" />Home</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/menu/${menu.menu_id}`}><ListChecks className="h-4 w-4 mr-2" />View Menu</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Simplified progress display showing match count */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {/* Optional: Keep progress bar with rough estimate */} 
        {/* <Progress value={completionPercentage} className="h-2 flex-grow" /> */}
        <span>{totalMatches} Matched Dishes</span>
      </div>
    </div>
  )
} 