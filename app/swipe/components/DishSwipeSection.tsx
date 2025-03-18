"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import type { Dish } from "@/lib/types/dish-types"
import DishStack from "../DishStack"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { Menu } from "@/lib/types/menu-types"


interface DishSwipeSectionProps {
  mealTime: string;
  menu: Menu; // Using any for now, should be properly typed
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
  const apiCallInProgressRef = useRef<boolean>(false)
  const previouslyLoadedDishIdsRef = useRef<Set<string>>(new Set())
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize swiped dish IDs from menu
  useEffect(() => {
    if (!menu) return;
    
    const allSwipedDishIds = new Set<string>();
    
    Object.values(menu.matches).forEach((dishIds: string[]) => {
      dishIds.forEach((dishId: string) => {
        if (dishId) {
          allSwipedDishIds.add(dishId);
        }
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
      
      const queryParams = new URLSearchParams();
      
      // 1. Load dishes for the selected time of day
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '30');
      
      // 2. Apply user preferences
      if (user?.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      // 3. Only filter out already swiped dishes through the API
      // We'll handle excluding already loaded dishes client-side
      if (swipedDishIds.size > 0) {
        const swipedIds = Array.from(swipedDishIds).join(',');
        queryParams.append('exclude', swipedIds);
        console.log(`Excluding ${swipedDishIds.size} already swiped dishes`);
      }
      
      const apiUrl = `/api/dishes?${queryParams.toString()}`;
      console.log("Fetching dishes from:", apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dishes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.dishes?.length || 0} dishes from API`);
      
      // Log the IDs and names of dishes received
      console.log("DISHES RECEIVED FROM API:", data.dishes?.map((d: Dish) => 
        `${d.dish_id}: ${d.name}`
      ));
      
      if (!data.dishes || !Array.isArray(data.dishes) || data.dishes.length === 0) {
        console.log("No dishes returned from API or empty array received");
        setCurrentDishes([]);
        return;
      }
      
      // Filter out already loaded dishes client-side
      const newDishes = data.dishes.filter((dish: Dish) => 
        dish.dish_id && !previouslyLoadedDishIdsRef.current.has(dish.dish_id)
      );
      
      console.log(`Filtered down to ${newDishes.length} new dishes that weren't already loaded`);
      
      // Log the IDs and names of new dishes after filtering
      console.log("NEW DISHES AFTER FILTERING:", newDishes.map((d: Dish) => 
        `${d.dish_id}: ${d.name}`
      ));
      
      // If we didn't get any new dishes, try different parameters to get variety
      if (newDishes.length === 0) {
        console.log("All returned dishes were already loaded, clearing tracking to show more variety");
        // Reset the tracking of previously loaded dishes
        previouslyLoadedDishIdsRef.current = new Set();
        
        // Keep track of already swiped dishes to avoid reshowing them
        swipedDishIds.forEach(id => {
          previouslyLoadedDishIdsRef.current.add(id);
        });
        
        console.log("Dish tracking reset, using original dishes with improved variety");
        
        // Use the dishes we got even if we've seen them before, but filter out swiped ones
        const nonSwipedDishes = data.dishes.filter((dish: Dish) => 
          dish.dish_id && !swipedDishIds.has(dish.dish_id)
        );
        
        console.log(`Found ${nonSwipedDishes.length} dishes that haven't been swiped on yet`);
        
        // Track these dishes as "loaded"
        nonSwipedDishes.forEach((dish: Dish) => {
          if (dish.dish_id && typeof dish.dish_id === 'string') {
            previouslyLoadedDishIdsRef.current.add(dish.dish_id);
          }
        });
        
        setCurrentDishes(nonSwipedDishes);
        console.log(`Loaded ${nonSwipedDishes.length} dishes with reset tracking`);
        return;
      }
      
      // Track these new dishes as "loaded"
      newDishes.forEach((dish: Dish) => {
        if (dish.dish_id && typeof dish.dish_id === 'string') {
          previouslyLoadedDishIdsRef.current.add(dish.dish_id);
        }
      });
      
      setCurrentDishes(newDishes);
      console.log(`Loaded ${newDishes.length} dishes for ${mealTime}`);
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
      setIsLoading(true);
      
      // Build query with increased limit
      const queryParams = new URLSearchParams();
      
      // 1. Load dishes for the selected time of day with increased limit
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '50'); // Increased limit
      
      // 2. Apply user preferences
      if (user?.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      // 3. Filter out already seen dishes
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
    
    // Keep track of already swiped dishes to avoid reshowing them
    swipedDishIds.forEach(id => {
      previouslyLoadedDishIdsRef.current.add(id);
    });
    
    // Set loading state
    setIsLoading(true);
    setCurrentDishes([]);
    
    // Load dishes with normal filters
    loadDishes();
  }, [loadDishes, swipedDishIds]);

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
            // Call loadDishes directly without triggering the meal time effect
            loadDishesWithoutReset();
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
  }, [swipeOnDish, toast, swipedDishIds]);

  // Function to load more dishes without resetting current dishes
  const loadDishesWithoutReset = useCallback(async () => {
    console.log(`Loading more dishes for current meal time: ${mealTime}`);
    console.log(`Currently loaded dishes: ${currentDishes.length}`);
    console.log(`Previously loaded dish IDs count: ${previouslyLoadedDishIdsRef.current.size}`);
    
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
      
      // Don't set isLoading to true here to avoid showing loading state
      // Don't clear current dishes
      
      const queryParams = new URLSearchParams();
      
      // 1. Load dishes for the selected time of day
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '30'); // Increased limit to get more dishes
      
      // 2. Apply user preferences
      if (user?.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      // 3. Only filter out already swiped dishes through the API
      // We'll handle excluding already loaded dishes client-side
      if (swipedDishIds.size > 0) {
        const swipedIds = Array.from(swipedDishIds).join(',');
        queryParams.append('exclude', swipedIds);
        console.log(`Excluding ${swipedDishIds.size} already swiped dishes`);
      }
      
      // Use proper pagination to get different dishes each time
      // Calculate a page number based on how many dishes we've already loaded
      const loadedDishCount = previouslyLoadedDishIdsRef.current.size;
      // Start from page 1, then page 2, etc. as we load more dishes
      // We use Math.floor(loadedDishCount / 30) + 1 to get the next page number
      // For example: 0-29 dishes → page 1, 30-59 dishes → page 2, etc.
      const pageNumber = Math.floor(loadedDishCount / 30) + 1;
      queryParams.append('page', pageNumber.toString());
      console.log(`Using pagination strategy - requesting page ${pageNumber}`);
      
      const apiUrl = `/api/dishes?${queryParams.toString()}`;
      console.log("Fetching additional dishes from:", apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch additional dishes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.dishes?.length || 0} additional dishes from API`);
      console.log(`API returned pagination info:`, data.pagination);
      
      // Log the IDs and names of dishes received
      console.log("ADDITIONAL DISHES RECEIVED FROM API:", data.dishes?.map((d: Dish) => 
        `${d.dish_id}: ${d.name}`
      ));
      
      if (!data.dishes || !Array.isArray(data.dishes) || data.dishes.length === 0) {
        console.log("No additional dishes returned from API");
        
        // If we're at the last page according to pagination, reset and start over
        if (data.pagination && pageNumber >= data.pagination.totalPages) {
          console.log(`Reached the last page (${pageNumber} of ${data.pagination.totalPages}), resetting dish tracking`);
          previouslyLoadedDishIdsRef.current = new Set();
          
          // Keep track of already swiped dishes
          swipedDishIds.forEach(id => {
            previouslyLoadedDishIdsRef.current.add(id);
          });
          
          toast({
            title: "Starting Over",
            description: "You've seen all available dishes for this category. Showing them again.",
          });
          
          // Load the first page again
          queryParams.set('page', '1'); 
          const resetApiUrl = `/api/dishes?${queryParams.toString()}`;
          const resetResponse = await fetch(resetApiUrl);
          
          if (!resetResponse.ok) {
            throw new Error(`Failed to fetch reset dishes: ${resetResponse.statusText}`);
          }
          
          const resetData = await resetResponse.json();
          
          if (resetData.dishes && resetData.dishes.length > 0) {
            // Filter out swiped dishes
            const nonSwipedDishes = resetData.dishes.filter((dish: Dish) => 
              dish.dish_id && !swipedDishIds.has(dish.dish_id)
            );
            
            if (nonSwipedDishes.length > 0) {
              setCurrentDishes(prev => [...prev, ...nonSwipedDishes]);
              console.log(`Added ${nonSwipedDishes.length} dishes after resetting pagination`);
              
              // Track these dishes as "loaded"
              nonSwipedDishes.forEach((dish: Dish) => {
                if (dish.dish_id && typeof dish.dish_id === 'string') {
                  previouslyLoadedDishIdsRef.current.add(dish.dish_id);
                }
              });
            }
          }
        }
        
        return;
      }
      
      // Filter out already loaded dishes client-side
      const newDishes = data.dishes.filter((dish: Dish) => 
        dish.dish_id && !previouslyLoadedDishIdsRef.current.has(dish.dish_id)
      );
      
      console.log(`Filtered down to ${newDishes.length} new dishes that weren't already loaded`);
      
      // Log the IDs and names of new dishes after filtering
      console.log("NEW ADDITIONAL DISHES AFTER FILTERING:", newDishes.map((d: Dish) => 
        `${d.dish_id}: ${d.name}`
      ));
      
      if (newDishes.length === 0) {
        console.log("All returned dishes were already loaded, checking pagination info");
        
        // Check if we've gone through all pages
        if (data.pagination && pageNumber >= data.pagination.totalPages) {
          console.log(`Reached the last page (${pageNumber} of ${data.pagination.totalPages}), resetting dish tracking`);
          previouslyLoadedDishIdsRef.current = new Set();
          
          // Keep track of already swiped dishes
          swipedDishIds.forEach(id => {
            previouslyLoadedDishIdsRef.current.add(id);
          });
          
          console.log("Dish tracking reset except for swiped dishes");
          
          // Try loading the first page again after reset
          queryParams.set('page', '1');
          const resetApiUrl = `/api/dishes?${queryParams.toString()}`;
          const resetResponse = await fetch(resetApiUrl);
          
          if (!resetResponse.ok) {
            throw new Error(`Failed to fetch reset dishes: ${resetResponse.statusText}`);
          }
          
          const resetData = await resetResponse.json();
          
          // Filter out swiped dishes
          const nonSwipedDishes = resetData.dishes.filter((dish: Dish) => 
            dish.dish_id && !swipedDishIds.has(dish.dish_id)
          );
          
          console.log(`Found ${nonSwipedDishes.length} dishes after reset that haven't been swiped on yet`);
          
          if (nonSwipedDishes.length > 0) {
            // Track these dishes as "loaded"
            nonSwipedDishes.forEach((dish: Dish) => {
              if (dish.dish_id && typeof dish.dish_id === 'string') {
                previouslyLoadedDishIdsRef.current.add(dish.dish_id);
              }
            });
            
            // Add these to the current dishes
            setCurrentDishes(prev => [...prev, ...nonSwipedDishes]);
            console.log(`Added ${nonSwipedDishes.length} dishes after pagination reset`);
            
            toast({
              title: "More Dishes Found",
              description: `Added ${nonSwipedDishes.length} more dishes for you to swipe on.`,
            });
          } else {
            // If still no dishes, show an informative message
            toast({
              title: "No New Dishes",
              description: "You've seen all available dishes for this category. Try a different meal time or refresh.",
            });
          }
          return;
        } else {
          // Try the next page
          console.log(`No new dishes on page ${pageNumber}, trying the next page`);
          const nextPage = pageNumber + 1;
          queryParams.set('page', nextPage.toString());
          
          const nextPageApiUrl = `/api/dishes?${queryParams.toString()}`;
          const nextPageResponse = await fetch(nextPageApiUrl);
          
          if (!nextPageResponse.ok) {
            throw new Error(`Failed to fetch next page dishes: ${nextPageResponse.statusText}`);
          }
          
          const nextPageData = await nextPageResponse.json();
          
          if (nextPageData.dishes && nextPageData.dishes.length > 0) {
            // Filter out already loaded dishes
            const nextPageNewDishes = nextPageData.dishes.filter((dish: Dish) => 
              dish.dish_id && !previouslyLoadedDishIdsRef.current.has(dish.dish_id)
            );
            
            if (nextPageNewDishes.length > 0) {
              // Track these dishes as "loaded"
              nextPageNewDishes.forEach((dish: Dish) => {
                if (dish.dish_id && typeof dish.dish_id === 'string') {
                  previouslyLoadedDishIdsRef.current.add(dish.dish_id);
                }
              });
              
              // Add these to the current dishes
              setCurrentDishes(prev => [...prev, ...nextPageNewDishes]);
              console.log(`Added ${nextPageNewDishes.length} dishes from the next page`);
              return;
            }
          }
        }
      }
      
      // Track these new dishes as "loaded"
      newDishes.forEach((dish: Dish) => {
        if (dish.dish_id && typeof dish.dish_id === 'string') {
          previouslyLoadedDishIdsRef.current.add(dish.dish_id);
        }
      });
      
      // Add new dishes to the end of current dishes
      setCurrentDishes(prev => [...prev, ...newDishes]);
      console.log(`Added ${newDishes.length} more dishes for ${mealTime}`);
    } catch (error) {
      console.error("Error loading additional dishes:", error);
    } finally {
      apiCallInProgressRef.current = false;
    }
  }, [mealTime, menu, swipedDishIds, toast, user, currentDishes.length]);

  // Load dishes when meal time changes - complete reset
  useEffect(() => {
    const loadNewDishes = async () => {
      if (menu) {
        console.log("Meal time or menu changed, loading new dishes");
        previouslyLoadedDishIdsRef.current = new Set();
        setCurrentDishes([]);
        setIsLoading(true);
        await loadDishes();
      }
    };
    
    loadNewDishes();
  }, [mealTime, menu]); // Don't include loadDishes in dependencies

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
              We couldn&apos;t find dishes matching your preferences for this category.
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
            <DishStack 
              dishes={currentDishes}
              onSwipe={handleSwipe}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              showLikeAnimation={showLikeAnimation}
              lastLikedDish={lastLikedDish}
              userPreferences={user?.dietaryPreferences ? {
                ...user.dietaryPreferences,
                diet: 'any',  // Add missing required properties
                cuisine: 'any',
                spice: 'medium'
              } : undefined}
              swipedDishIds={Array.from(swipedDishIds)}
            />
          </>
        )}
      </TabsContent>
    </div>
  );
}; 