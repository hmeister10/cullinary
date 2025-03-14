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
import { Share2, Users, Menu, Eye, Trash2 } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const SwipePageContent = () => {
  const { activeMenu, fetchDishesToSwipe, swipeOnDish, joinMenu, hasSetName, removeDishFromShortlist } = useApp()
  const [currentCategory, setCurrentCategory] = useState<string>("breakfast")
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [shouldLoadDishes, setShouldLoadDishes] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isRemovingDish, setIsRemovingDish] = useState(false)
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
          description: "You&apos;ve successfully joined the menu.",
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
    console.log("loadDishes called, isLoading:", isLoading);
    
    // Force loading state to true
    setIsLoading(true);
    
    try {
      console.log("Loading dishes for category:", currentCategory);
      console.log("Active menu:", activeMenu ? activeMenu.menu_id : 'none');
      
      // Ensure we have a user before trying to fetch dishes
      if (!activeMenu) {
        console.error("No active menu, cannot load dishes");
        setCurrentDishes([]);
        return;
      }
      
      const dishes = await fetchDishesToSwipe(currentCategory);
      console.log("Dishes loaded:", dishes.length);
      
      if (dishes.length > 0) {
        console.log("Updating dishes state with new dishes");
        setCurrentDishes(dishes);
      } else {
        console.log("No dishes returned, keeping current dishes");
      }
    } catch (error) {
      console.error("Error loading dishes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dishes. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setShouldLoadDishes(false);
    }
  }, [fetchDishesToSwipe, currentCategory, toast, activeMenu, isLoading]);

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

  // Force load dishes after component mounts and menu is ready
  useEffect(() => {
    if (activeMenu && hasSetName) {
      // Force isLoading to false to ensure loadDishes can run
      setIsLoading(false);
      // Small timeout to ensure state is updated
      setTimeout(() => {
        loadDishes();
      }, 100);
    }
  }, [activeMenu, hasSetName, loadDishes]);

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
          title: "It&apos;s a Match!",
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

  // Define copyToClipboard before it's used
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link Copied!",
        description: "Menu link copied to clipboard.",
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link. Please try again.",
      });
    });
  }, [toast]);

  const shareMenu = useCallback(() => {
    if (!activeMenu) return;
    
    const url = new URL(window.location.href);
    url.pathname = "/menu";
    url.searchParams.set('menu', activeMenu.menu_id);
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out my Cullinary menu!',
        text: 'I created a weekly meal plan. Take a look!',
        url: url.toString(),
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard(url.toString());
      });
    } else {
      copyToClipboard(url.toString());
    }
  }, [activeMenu, copyToClipboard]);

  // Get matched dishes for a specific category
  const getMatchedDishes = useCallback((category: string) => {
    if (!activeMenu) return [];
    return activeMenu.matches[category as keyof typeof activeMenu.matches] || [];
  }, [activeMenu]);

  // Count total matched dishes
  const getTotalMatchedDishes = useCallback(() => {
    if (!activeMenu) return 0;
    return Object.values(activeMenu.matches).reduce((acc, dishes) => acc + dishes.length, 0);
  }, [activeMenu]);

  // Handle removing a dish from the shortlist
  const handleRemoveDish = useCallback(async (dish: Dish, category: string) => {
    if (!activeMenu || isRemovingDish) return;
    
    setIsRemovingDish(true);
    try {
      const success = await removeDishFromShortlist(dish, category);
      
      if (success) {
        toast({
          title: "Dish Removed",
          description: `${dish.name} has been removed from your shortlist.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove dish. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error removing dish:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove dish. Please try again.",
      });
    } finally {
      setIsRemovingDish(false);
    }
  }, [activeMenu, toast, isRemovingDish, removeDishFromShortlist]);

  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      {/* Header with improved layout */}
      <div className="w-full max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Swipe on Dishes</h1>
          <div className="flex items-center space-x-2">
            {activeMenu && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="View Shortlisted Menu">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Your Shortlisted Menu</DialogTitle>
                      <DialogDescription>
                        Here are all the dishes you&apos;ve matched so far.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {["breakfast", "lunch", "dinner", "snack"].map((category) => {
                        const dishes = getMatchedDishes(category);
                        if (dishes.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h3 className="font-medium capitalize">{category}</h3>
                            <div className="space-y-2">
                              {dishes.map((dish: Dish) => (
                                <div key={dish.dish_id} className="flex items-center p-2 rounded-lg border group hover:border-primary hover:bg-primary/5 transition-colors">
                                  <div className="relative h-12 w-12 rounded overflow-hidden mr-3">
                                    <Image
                                      src={dish.image_url || "/placeholder.svg?height=48&width=48"}
                                      alt={dish.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{dish.name}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {dish.preference}
                                      </Badge>
                                      {dish.is_healthy && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                          Healthy
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveDish(dish, category)}
                                    disabled={isRemovingDish}
                                    title="Remove from shortlist"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {getTotalMatchedDishes() === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No dishes matched yet.</p>
                          <p className="text-sm mt-2">Swipe right on dishes you like to add them to your menu.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" onClick={goToMenu}>
                        View Full Menu
                      </Button>
                      <Button onClick={shareMenu}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Menu
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" title="Menu Options">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowParticipants(!showParticipants)}>
                      <Users className="h-4 w-4 mr-2" />
                      {showParticipants ? "Hide Participants" : "Show Participants"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareMenu}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Menu
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={goToMenu}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Menu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        
        {/* Progress bar with improved styling */}
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Menu Progress</span>
            <span className="text-sm text-muted-foreground">
              {!activeMenu
                ? "0/28"
                : `${getTotalMatchedDishes()}/28`}
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
        
        {/* Collapsible participants section */}
        {activeMenu && showParticipants && (
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MenuParticipants menuId={activeMenu.menu_id} />
          </motion.div>
        )}
      </div>

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