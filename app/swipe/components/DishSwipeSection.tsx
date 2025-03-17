"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import type { Dish } from "@/lib/types/dish-types"
import DishStack from "../DishStack"
import SwipeControls from "../SwipeControls"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"

interface DishSwipeSectionProps {
  mealTime: string;
  menu: any; // Using any for now, should be properly typed
}

export const DishSwipeSection = ({ 
  mealTime,
  menu
}: DishSwipeSectionProps) => {
  const { swipeOnDish, user } = useApp()
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [swipedDishIds, setSwipedDishIds] = useState<Set<string>>(new Set())
  const [randomSeed, setRandomSeed] = useState<number>(Math.random())
  const apiCallInProgressRef = useRef<boolean>(false)
  const previouslyLoadedDishIdsRef = useRef<Set<string>>(new Set())
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize swiped dish IDs from menu
  useEffect(() => {
    if (!menu) return;
    
    const allSwipedDishIds = new Set<string>();
    
    Object.values(menu.matches).forEach((dishes: any) => {
      dishes.forEach((dish: Dish) => {
        allSwipedDishIds.add(dish.dish_id);
      });
    });
    
    console.log(`Initialized ${allSwipedDishIds.size} swiped dish IDs from menu`);
    
    const currentSize = swipedDishIds.size;
    let hasChanged = currentSize !== allSwipedDishIds.size;
    
    if (!hasChanged && currentSize > 0) {
      for (const id of allSwipedDishIds) {
        if (!swipedDishIds.has(id)) {
          hasChanged = true;
          break;
        }
      }
    }
    
    if (hasChanged) {
      console.log("Updating swiped dish IDs from menu");
      setSwipedDishIds(allSwipedDishIds);
    }
  }, [menu, swipedDishIds]);

  // Load dishes based on meal time
  const loadDishes = useCallback(async () => {
    console.log(`Loading dishes for meal time: ${mealTime}`);
    
    if (apiCallInProgressRef.current) {
      console.log("API call already in progress, skipping");
      return;
    }
    
    apiCallInProgressRef.current = true;
    
    try {
      if (!menu) {
        console.error("No active menu, cannot load dishes");
        return;
      }
      
      setIsLoading(true);
      
      // Create a new seed for each API call to ensure variety
      const newSeed = Math.random();
      setRandomSeed(newSeed);
      console.log(`Using new seed for API call: ${newSeed}`);
      
      const queryParams = new URLSearchParams();
      
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '30');
      
      if (user?.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      // Add the seed parameter
      queryParams.append('seed', newSeed.toString());
      
      // Add already swiped dish IDs to exclude them from results
      // Convert Set to Array and join with commas
      if (swipedDishIds.size > 0) {
        const swipedIds = Array.from(swipedDishIds).join(',');
        queryParams.append('exclude', swipedIds);
        console.log(`Excluding ${swipedDishIds.size} already swiped dishes`);
      }
      
      // Also exclude previously loaded dishes
      if (previouslyLoadedDishIdsRef.current.size > 0) {
        const previouslyLoadedIds = Array.from(previouslyLoadedDishIdsRef.current).join(',');
        if (!queryParams.has('exclude')) {
          queryParams.append('exclude', previouslyLoadedIds);
        } else {
          // Append to existing exclude parameter
          const currentExclude = queryParams.get('exclude') || '';
          queryParams.set('exclude', `${currentExclude},${previouslyLoadedIds}`);
        }
        console.log(`Also excluding ${previouslyLoadedDishIdsRef.current.size} previously loaded dishes`);
      }
      
      const apiUrl = `/api/dishes?${queryParams.toString()}`;
      console.log("Fetching dishes from:", apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dishes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.dishes?.length || 0} dishes from API`);
      
      if (!data.dishes || !Array.isArray(data.dishes) || data.dishes.length === 0) {
        console.log("No dishes returned from API or empty array received");
        setCurrentDishes([]);
        return;
      }
      
      // Track these new dishes as "loaded" to avoid showing them again
      data.dishes.forEach((dish: Dish) => {
        if (dish.dish_id && typeof dish.dish_id === 'string') {
          previouslyLoadedDishIdsRef.current.add(dish.dish_id);
        }
      });
      
      setCurrentDishes(data.dishes);
    } catch (error) {
      console.error("Error loading dishes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dishes. Please try again.",
      });
      setCurrentDishes([]);
    } finally {
      setIsLoading(false);
      apiCallInProgressRef.current = false;
    }
  }, [mealTime, menu, swipedDishIds, toast, user]);

  // Request more dishes with increased limit
  const requestMoreDishes = useCallback(async () => {
    console.log("Requesting more dishes with increased limit...");
    
    if (apiCallInProgressRef.current) {
      console.log("API call already in progress, skipping");
      return;
    }
    
    apiCallInProgressRef.current = true;
    
    try {
      // Generate a new seed specifically for this request
      const newSeed = Math.random();
      setRandomSeed(newSeed);
      console.log(`Using new seed for more dishes: ${newSeed}`);
      
      setIsLoading(true);
      
      // Build query with increased limit
      const queryParams = new URLSearchParams();
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '50'); // Increased limit
      queryParams.append('seed', newSeed.toString());
      
      // Add dietary preferences
      if (user?.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      // Add already swiped dish IDs to exclude them
      if (swipedDishIds.size > 0) {
        const swipedIds = Array.from(swipedDishIds).join(',');
        queryParams.append('exclude', swipedIds);
        console.log(`Excluding ${swipedDishIds.size} already swiped dishes`);
      }
      
      const apiUrl = `/api/dishes?${queryParams.toString()}`;
      console.log("Fetching more dishes from:", apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more dishes: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.dishes || !Array.isArray(data.dishes)) {
        console.error("API response doesn't contain dishes array");
        return;
      }
      
      const dishesArray = data.dishes;
      console.log(`Received ${dishesArray.length} dishes from API with increased limit`);
      
      if (dishesArray.length === 0) {
        toast({
          variant: "destructive",
          title: "No More Dishes",
          description: "We couldn't find any more dishes matching your preferences.",
        });
        return;
      }
      
      // Track these new dishes as "loaded"
      dishesArray.forEach((dish: Dish) => {
        if (dish.dish_id && typeof dish.dish_id === 'string') {
          previouslyLoadedDishIdsRef.current.add(dish.dish_id);
        }
      });
      
      // Replace current dishes completely
      setCurrentDishes(dishesArray);
      
      toast({
        title: "New Dishes Loaded",
        description: `Found ${dishesArray.length} more dishes for you to swipe on.`,
      });
    } catch (error) {
      console.error("Error requesting more dishes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load more dishes. Please try again.",
      });
    } finally {
      setIsLoading(false);
      apiCallInProgressRef.current = false;
    }
  }, [mealTime, swipedDishIds, toast, user]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    console.log("Refreshing dishes...");
    
    // Clear previously loaded dishes to get a fresh set
    previouslyLoadedDishIdsRef.current = new Set();
    
    // Load dishes with normal filters
    loadDishes();
  }, [loadDishes]);

  // Handle dish swipe
  const handleSwipe = useCallback(async (dish: Dish, direction: string) => {
    const isLiked = direction === "right"
    console.log(`Swiping ${isLiked ? 'right (like)' : 'left (dislike)'} on dish: ${dish.name} (${dish.dish_id})`);

    try {
      // Handle like animation
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

      // Check if dish is already in swiped dishes
      if (swipedDishIds.has(dish.dish_id)) {
        console.warn(`WARNING: Dish ${dish.dish_id} (${dish.name}) was already swiped but appeared again in the stack.`);
      }

      // Process the swipe with the backend
      const isMatch = await swipeOnDish(dish, isLiked)

      // Add dish to swiped dishes regardless of like/dislike
      setSwipedDishIds(prev => {
        const newSet = new Set(prev);
        newSet.add(dish.dish_id);
        console.log(`Added dish ${dish.dish_id} to swiped dishes. Total swiped: ${newSet.size}`);
        return newSet;
      });

      // Show match notification
      if (isMatch) {
        toast({
          title: "It's a Match!",
          description: `${dish.name} has been added to your menu.`,
        })
      }

      // Remove the swiped dish from the current set
      setCurrentDishes(prev => {
        // First remove the swiped dish
        const newDishes = prev.filter((d) => d.dish_id !== dish.dish_id);
        console.log(`Removed swiped dish from current dishes. Remaining: ${newDishes.length}`);
        
        // If dishes are running low, load more
        if (newDishes.length <= 3) {
          console.log("Dishes running low, loading more...");
          // Use setTimeout to avoid state update conflicts
          setTimeout(() => {
            loadDishes();
          }, 300); // Small delay to ensure smooth transition
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
  }, [swipeOnDish, toast, loadDishes, swipedDishIds]);

  // Load dishes when meal time changes
  useEffect(() => {
    if (menu) {
      console.log("Meal time changed, loading new dishes");
      previouslyLoadedDishIdsRef.current = new Set();
      setCurrentDishes([]);
      loadDishes();
    }
  }, [mealTime, menu, loadDishes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current);
        likeAnimationTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <TabsContent value={mealTime} className="h-[460px] relative">
        {isLoading && currentDishes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading dishes...</p>
            </div>
          </div>
        ) : currentDishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p>No dishes available for {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}.</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              We couldn't find dishes matching your preferences for this category.
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={handleRefresh}>
                Try Again
              </Button>
              <Button 
                onClick={requestMoreDishes} 
                variant="outline"
              >
                Find More Dishes
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Debug info - remove in production */}
            <div className="absolute top-0 right-0 text-xs text-muted-foreground bg-background/80 p-1 rounded z-10">
              {currentDishes.length} dishes loaded
            </div>
            
            <DishStack 
              dishes={currentDishes}
              onSwipe={handleSwipe}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              showLikeAnimation={showLikeAnimation}
              lastLikedDish={lastLikedDish}
              userPreferences={user?.dietaryPreferences}
              swipedDishIds={Array.from(swipedDishIds)}
            />
          </>
        )}
      </TabsContent>

      <SwipeControls 
        onSwipeLeft={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "left")}
        onSwipeRight={() => currentDishes.length > 0 && handleSwipe(currentDishes[0], "right")}
        disabled={currentDishes.length === 0 || isLoading}
      />
    </div>
  );
}; 