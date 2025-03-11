"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X, Heart } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import type { Dish } from "@/lib/mock-data"

// Import TinderCard component for swiping
import TinderCard from "@/components/tinder-card"

export default function SwipePage() {
  const { activeMenu, fetchDishesToSwipe, swipeOnDish, userSwipes, joinMenu } = useApp()
  const [currentCategory, setCurrentCategory] = useState<string>("breakfast")
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const menuId = searchParams.get('menu')
    
    // If there's a menu ID in the URL and no active menu, try to join it
    if (menuId && !activeMenu && !isJoining) {
      joinMenuFromUrl(menuId)
    } else if (!activeMenu) {
      router.push("/")
      return
    }

    loadDishes()
    
    // Cleanup animation timeout on unmount
    return () => {
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current)
      }
    }
  }, [activeMenu, currentCategory, searchParams])

  const joinMenuFromUrl = async (menuId: string) => {
    setIsJoining(true)
    try {
      const success = await joinMenu(menuId)
      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not join menu. It may not exist or has been deleted.",
        })
        router.push("/")
      } else {
        // Update URL to include menu ID without reloading the page
        const url = new URL(window.location.href)
        url.searchParams.set('menu', menuId)
        window.history.replaceState({}, '', url.toString())
        
        toast({
          title: "Joined Menu",
          description: "You've successfully joined the menu.",
        })
      }
    } catch (error) {
      console.error("Error joining menu:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join menu. Please try again.",
      })
      router.push("/")
    } finally {
      setIsJoining(false)
    }
  }

  const loadDishes = async () => {
    setIsLoading(true)
    try {
      const dishes = await fetchDishesToSwipe(currentCategory)
      setCurrentDishes(dishes)
    } catch (error) {
      console.error("Error loading dishes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dishes. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwipe = async (dish: Dish, direction: string) => {
    const isLiked = direction === "right"

    try {
      // Show like animation if swiped right
      if (isLiked) {
        setLastLikedDish(dish)
        setShowLikeAnimation(true)
        
        // Hide animation after 1.5 seconds
        if (likeAnimationTimeoutRef.current) {
          clearTimeout(likeAnimationTimeoutRef.current)
        }
        
        likeAnimationTimeoutRef.current = setTimeout(() => {
          setShowLikeAnimation(false)
        }, 1500)
      }

      const isMatch = await swipeOnDish(dish, isLiked)

      if (isMatch) {
        toast({
          title: "It's a Match!",
          description: `${dish.name} has been added to your menu.`,
        })
      }

      // Remove dish from current stack
      setCurrentDishes(currentDishes.filter((d) => d.dish_id !== dish.dish_id))

      // Load more dishes if the stack is getting low
      if (currentDishes.length <= 2) {
        loadDishes()
      }
    } catch (error) {
      console.error("Error processing swipe:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your choice. Please try again.",
      })
    }
  }

  const calculateProgress = () => {
    if (!activeMenu) return 0

    const totalNeeded = 7 * 4 // 7 days, 4 meal types
    const current =
      activeMenu.matches.breakfast.length +
      activeMenu.matches.lunch.length +
      activeMenu.matches.dinner.length +
      activeMenu.matches.snack.length

    return (current / totalNeeded) * 100
  }

  const goToMenu = () => {
    router.push("/menu")
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col space-y-4 mb-6">
          <h1 className="text-2xl font-bold text-center">Swipe on Dishes</h1>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Menu Progress</span>
              <span className="text-sm text-muted-foreground">
                {!activeMenu
                  ? "0/28"
                  : `${activeMenu.matches.breakfast.length + activeMenu.matches.lunch.length + activeMenu.matches.dinner.length + activeMenu.matches.snack.length}/28`}
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>

        <Tabs defaultValue="breakfast" value={currentCategory} onValueChange={setCurrentCategory} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
            <TabsTrigger value="snack">Snack</TabsTrigger>
          </TabsList>

          {["breakfast", "lunch", "dinner", "snack"].map((category) => (
            <TabsContent key={category} value={category} className="h-[460px] relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading dishes...</p>
                </div>
              ) : currentDishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <p>No more dishes to swipe!</p>
                  <Button onClick={loadDishes}>Refresh</Button>
                </div>
              ) : (
                <div className="relative h-full">
                  {/* Like animation overlay */}
                  {showLikeAnimation && lastLikedDish && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className="flex flex-col items-center animate-bounce">
                        <Heart className="h-20 w-20 text-red-500 fill-red-500" />
                        <p className="text-white font-bold text-xl mt-2">{lastLikedDish.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {currentDishes.map((dish, index) => (
                    <TinderCard
                      key={dish.dish_id}
                      onSwipe={(dir) => handleSwipe(dish, dir)}
                      preventSwipe={["up", "down"]}
                      className="absolute w-full h-full"
                    >
                      <Card className="w-full h-full overflow-hidden">
                        <div className="relative h-3/4">
                          <Image
                            src={dish.image_url || "/placeholder.svg?height=300&width=300"}
                            alt={dish.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                            {dish.preference}
                          </div>
                          {dish.is_healthy && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                              Healthy
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-xl font-bold">{dish.name}</h3>
                          <p className="text-sm text-muted-foreground">{dish.category}</p>
                        </CardContent>
                      </Card>
                    </TinderCard>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-center space-x-6 mt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "left")}
            disabled={currentDishes.length === 0 || isLoading}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "right")}
            disabled={currentDishes.length === 0 || isLoading}
          >
            <Check className="h-6 w-6" />
          </Button>
        </div>

        {activeMenu && calculateProgress() === 100 && (
          <div className="mt-6 text-center">
            <p className="text-green-500 font-medium mb-2">All dishes matched!</p>
            <Button onClick={goToMenu}>View Complete Menu</Button>
          </div>
        )}
      </div>
    </div>
  )
}

