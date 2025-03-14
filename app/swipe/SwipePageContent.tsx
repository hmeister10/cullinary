"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Dish } from "@/lib/mock-data"
import DishStack from "./DishStack"
import SwipeControls from "./SwipeControls"
import { UserNameForm } from "@/components/user-name-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MenuParticipants } from "@/components/menu-participants"
import { motion } from "framer-motion"

const SwipePageContent = () => {
  const { activeMenu, fetchDishesToSwipe, swipeOnDish, joinMenu, hasSetName } = useApp()
  const [currentCategory, setCurrentCategory] = useState<string>("breakfast")
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [shouldLoadDishes, setShouldLoadDishes] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const menuId = searchParams.get('menu')
  const hasInitializedRef = useRef(false)

  const joinMenuFromUrl = useCallback(async (id: string) => {
    if (isJoining) return; // Prevent multiple join attempts
    
    setIsJoining(true)
    try {
      const success = await joinMenu(id)
      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not join menu. It may not exist or has been deleted.",
        })
        router.push("/")
      } else {
        const url = new URL(window.location.href)
        url.searchParams.set('menu', id)
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
  }, [joinMenu, toast, router, isJoining])

  const loadDishes = useCallback(async () => {
    if (isLoading) return; // Prevent concurrent loading
    
    setIsLoading(true)
    try {
      console.log("Loading dishes for category:", currentCategory);
      const dishes = await fetchDishesToSwipe(currentCategory)
      console.log("Dishes loaded:", dishes.length);
      
      setCurrentDishes(prev => {
        // Only update if we have new dishes or no dishes
        if (dishes.length > 0 || prev.length === 0) {
          return dishes;
        }
        return prev;
      })
    } catch (error) {
      console.error("Error loading dishes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dishes. Please try again.",
      })
    } finally {
      setIsLoading(false)
      setShouldLoadDishes(false)
    }
  }, [fetchDishesToSwipe, currentCategory, toast, isLoading])

  // Fix the initial loading state issue
  useEffect(() => {
    // Set initial loading state to false if it's already been initialized
    if (hasInitializedRef.current && isLoading) {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Handle menu initialization
  useEffect(() => {
    if (!hasSetName || hasInitializedRef.current) return;
    
    if (menuId && !activeMenu && !isJoining) {
      joinMenuFromUrl(menuId);
    } else if (!activeMenu) {
      router.push("/");
      return;
    }
    
    // Set shouldLoadDishes to true to trigger initial load
    setShouldLoadDishes(true);
    hasInitializedRef.current = true;
  }, [hasSetName, menuId, activeMenu, isJoining, joinMenuFromUrl, router]);

  // Handle dish loading - ensure this runs when shouldLoadDishes changes
  useEffect(() => {
    if (!hasSetName || !activeMenu) return;
    
    if (shouldLoadDishes) {
      loadDishes();
    }
  }, [hasSetName, activeMenu, shouldLoadDishes, loadDishes]);

  // Handle category changes - ensure dishes are loaded when category changes
  useEffect(() => {
    if (hasSetName && activeMenu && hasInitializedRef.current) {
      console.log("Category changed to:", currentCategory);
      setShouldLoadDishes(true);
    }
  }, [currentCategory, hasSetName, activeMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current);
        likeAnimationTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSwipe = useCallback(async (dish: Dish, direction: string) => {
    const isLiked = direction === "right"

    try {
      if (isLiked) {
        if (likeAnimationTimeoutRef.current) {
          clearTimeout(likeAnimationTimeoutRef.current)
          likeAnimationTimeoutRef.current = null
        }
        
        setLastLikedDish(dish)
        setShowLikeAnimation(true)
        
        likeAnimationTimeoutRef.current = setTimeout(() => {
          setShowLikeAnimation(false)
          likeAnimationTimeoutRef.current = null
        }, 1500)
      }

      const isMatch = await swipeOnDish(dish, isLiked)

      if (isMatch) {
        toast({
          title: "It's a Match!",
          description: `${dish.name} has been added to your menu.`,
        })
      }

      setCurrentDishes(prev => {
        const newDishes = prev.filter((d) => d.dish_id !== dish.dish_id);
        
        // If dishes are running low, trigger a load
        if (newDishes.length <= 2) {
          setShouldLoadDishes(true);
        }
        
        return newDishes;
      });
    } catch (error) {
      console.error("Error processing swipe:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your choice. Please try again.",
      })
    }
  }, [swipeOnDish, toast]);

  const calculateProgress = useCallback(() => {
    if (!activeMenu) return 0

    const totalNeeded = 7 * 4 // 7 days, 4 meal types
    const current =
      activeMenu.matches.breakfast.length +
      activeMenu.matches.lunch.length +
      activeMenu.matches.dinner.length +
      activeMenu.matches.snack.length

    return (current / totalNeeded) * 100
  }, [activeMenu]);

  const goToMenu = useCallback(() => {
    router.push("/menu")
  }, [router]);

  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      <motion.div 
        className="flex flex-col space-y-4 mb-6 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
        
        {/* Menu Participants */}
        {activeMenu && (
          <div className="mt-4">
            <MenuParticipants menuId={activeMenu.menu_id} />
          </div>
        )}
      </motion.div>

      <div className="w-full max-w-md mx-auto">
        <Tabs defaultValue="breakfast" value={currentCategory} onValueChange={setCurrentCategory} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
            <TabsTrigger value="snack">Snack</TabsTrigger>
          </TabsList>

          {["breakfast", "lunch", "dinner", "snack"].map((category) => (
            <TabsContent key={category} value={category} className="h-[460px] relative">
              {isLoading && currentDishes.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading dishes...</p>
                  </div>
                </div>
              ) : currentDishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <p>No dishes available.</p>
                  <Button onClick={() => setShouldLoadDishes(true)}>Refresh</Button>
                </div>
              ) : (
                <DishStack 
                  dishes={currentDishes}
                  onSwipe={handleSwipe}
                  isLoading={isLoading}
                  onRefresh={() => setShouldLoadDishes(true)}
                  showLikeAnimation={showLikeAnimation && currentCategory === category}
                  lastLikedDish={lastLikedDish}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>

        <SwipeControls 
          onSwipeLeft={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "left")}
          onSwipeRight={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "right")}
          disabled={currentDishes.length === 0 || isLoading}
        />

        {activeMenu && calculateProgress() === 100 && (
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-green-500 font-medium mb-2">All dishes matched!</p>
            <Button onClick={goToMenu}>View Complete Menu</Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SwipePageContent 