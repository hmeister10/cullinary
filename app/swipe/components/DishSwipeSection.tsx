"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/providers/user-provider"
import { useSwipe } from "@/providers/swipe-provider"
import type { Dish } from "@/lib/types/dish-types"
import DishStack from "../DishStack"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Utensils } from "lucide-react"

interface DishSwipeSectionProps {
  mealTime: string;
  menu: any; // Keep as any for now, focus on logic
}

export const DishSwipeSection = ({ 
  mealTime,
  menu // menu prop is still passed but not used to reload stack
}: DishSwipeSectionProps) => {
  const { user } = useUser()
  const { fetchDishesToSwipe, swipeOnDish } = useSwipe()
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const apiCallInProgressRef = useRef<boolean>(false)
  const previouslyLoadedDishIdsRef = useRef<Set<string>>(new Set())
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRequestRef = useRef(false)
  const { toast } = useToast()
  const router = useRouter()

  const loadDishes = useCallback(async (isRefresh = false) => {
    if (!isActiveRequestRef.current) {
        console.log(`DishSwipeSection: Aborting stale loadDishes call for ${mealTime} (start)`);
        return;
    }

    if (apiCallInProgressRef.current && !isRefresh) {
      console.log(`DishSwipeSection: API call already in progress for active request, skipping duplicate for ${mealTime}.`);
      return;
    }
    console.log(`DishSwipeSection: Loading dishes for ${mealTime}. Refresh: ${isRefresh}. Active: ${isActiveRequestRef.current}`);
    apiCallInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      const dishes = await fetchDishesToSwipe(mealTime);
      
      if (!isActiveRequestRef.current) {
          console.log(`DishSwipeSection: Aborting stale loadDishes call for ${mealTime} (before filter)`);
          return; 
      }

      if (isRefresh) {
          console.log(`DishSwipeSection: Active refresh request for ${mealTime}. Clearing previously loaded IDs.`);
          previouslyLoadedDishIdsRef.current = new Set();
      }
      
      console.log(`DishSwipeSection: Filtering ${dishes.length} fetched dishes against ${previouslyLoadedDishIdsRef.current.size} previously loaded IDs.`);
      const newFilteredDishes = dishes.filter(dish => !previouslyLoadedDishIdsRef.current.has(dish.dish_id));

      newFilteredDishes.forEach(dish => previouslyLoadedDishIdsRef.current.add(dish.dish_id));

      console.log(`DishSwipeSection: Displaying ${newFilteredDishes.length} new dishes for ${mealTime}.`);
      
      if (isActiveRequestRef.current) {
          console.log(`DishSwipeSection: Request still active. Setting currentDishes to array of length ${newFilteredDishes.length}`);
          setCurrentDishes(newFilteredDishes);
      } else {
          console.log(`DishSwipeSection: Request became stale during fetch/filter for ${mealTime}. Discarding results.`);
      }

    } catch (error) {
      if (isActiveRequestRef.current) {
        console.error("DishSwipeSection: Error loading dishes:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load dishes." });
        setCurrentDishes([]);
      }
    } finally {
       if (isActiveRequestRef.current) {
            setIsLoading(false);
            apiCallInProgressRef.current = false;
       }
    }
  }, [mealTime, fetchDishesToSwipe, toast]);

  const handleRefresh = useCallback(() => {
    isActiveRequestRef.current = true; 
    loadDishes(true);
  }, [loadDishes]);

  useEffect(() => {
    isActiveRequestRef.current = true;
    let currentMealTime = mealTime;

    if (menu) {
      console.log(`DishSwipeSection: useEffect triggered for ${currentMealTime}. Starting load...`);
      loadDishes(true); 
    }

    return () => {
      console.log(`DishSwipeSection: useEffect cleanup for ${currentMealTime}. Marking request as inactive.`);
      isActiveRequestRef.current = false;
    };
  }, [mealTime, menu, loadDishes]);

  const handleSwipe = useCallback(async (dish: Dish, direction: string) => {
    const isLiked = direction === "right";
    
    console.log(`DishSwipeSection: Swiped ${direction} on ${dish.name} (${dish.dish_id})`);

    setCurrentDishes(prev => prev.filter((d) => d.dish_id !== dish.dish_id));
    
    try {
      if (isLiked) {
        if (likeAnimationTimeoutRef.current) clearTimeout(likeAnimationTimeoutRef.current);
        setLastLikedDish(dish);
        setShowLikeAnimation(true);
        likeAnimationTimeoutRef.current = setTimeout(() => setShowLikeAnimation(false), 1500);
      }

      previouslyLoadedDishIdsRef.current.add(dish.dish_id);

      const success = await swipeOnDish(dish, isLiked);

    } catch (error) {
      console.error("DishSwipeSection: Error processing swipe:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your choice. Please try again.",
      })
    }
  }, [swipeOnDish, toast, loadDishes]);

  useEffect(() => {
    return () => {
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <TabsContent value={mealTime} className="h-[550px] relative flex flex-col">
        {(isLoading || !menu) && currentDishes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading dishes...</p>
            </div>
          </div>
        ) : !isLoading && currentDishes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Utensils className="h-12 w-12 text-primary opacity-70" /> 
            </div>
            <h3 className="text-xl font-semibold">All Swiped for {mealTime}!</h3>
            <p className="text-muted-foreground max-w-xs">
              You've seen all available dishes for now. Check back later or view your menu.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
              <Button onClick={() => menu?.menu_id && router.push(`/menu/${menu.menu_id}`)} disabled={!menu?.menu_id}>
                View Menu 
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center h-full">
            <DishStack 
              key={mealTime}
              dishes={currentDishes}
              onSwipe={handleSwipe}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              showLikeAnimation={showLikeAnimation}
              lastLikedDish={lastLikedDish}
              userPreferences={user?.dietaryPreferences}
            />
          </div>
        )}
      </TabsContent>
    </div>
  );
}; 