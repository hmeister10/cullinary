"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import type { Dish } from "@/lib/types/dish-types"
import DishStack from "../DishStack"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { Menu } from "@/lib/types/menu-types"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { SwipeRepository } from "@/lib/repositories/swipe.repository"

interface DishSwipeSectionProps {
  mealTime: string;
  menu: Menu;
}

export const DishSwipeSection = ({ 
  mealTime,
  menu
}: DishSwipeSectionProps) => {
  const { swipeOnDish, user } = useApp()
  const [currentDishes, setCurrentDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const [lastLikedDish, setLastLikedDish] = useState<Dish | null>(null)
  const [matchedDishIds, setMatchedDishIds] = useState<Set<string>>(new Set())
  const [userSwipedDishIds, setUserSwipedDishIds] = useState<Set<string>>(new Set())
  const [isUserSwipesLoaded, setIsUserSwipesLoaded] = useState(false)
  const apiCallInProgressRef = useRef<boolean>(false)
  const matchAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const likeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const swipeRepository = useRef(new SwipeRepository())
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      if (matchAnimationTimeoutRef.current) {
        clearTimeout(matchAnimationTimeoutRef.current);
      }
      if (likeAnimationTimeoutRef.current) {
        clearTimeout(likeAnimationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menu?.matches) return;
    
    const allMatchedIds = new Set<string>();
    Object.values(menu.matches).forEach(ids => ids.forEach(id => { if (id) allMatchedIds.add(id); }));
    
    setMatchedDishIds(prevMatched => {
      if (allMatchedIds.size !== prevMatched.size || 
          ![...allMatchedIds].every(id => prevMatched.has(id))) {
        console.log(`%c[DishSwipeSection] Matched IDs updated from context: ${allMatchedIds.size}`, 'color: cyan;');
        return allMatchedIds;
      }
      return prevMatched;
    });

  }, [menu?.matches]);

  useEffect(() => {
    if (!user?.uid || !menu?.menu_id) {
        setUserSwipedDishIds(new Set());
        return;
    }
    let isMounted = true;
    const fetchUserSwipes = async () => {
        const swipedIds = await swipeRepository.current.getUserSwipedDishIds(user.uid, menu.menu_id);
        if (isMounted) {
            setUserSwipedDishIds(swipedIds);
            setIsUserSwipesLoaded(true);
        }
    };
    fetchUserSwipes();
    return () => { isMounted = false; };
  }, [user?.uid, menu?.menu_id]);

  const loadDishes = useCallback(async (isRefresh = false) => {
    console.log(`%c[DishSwipeSection] Load Dishes Triggered for ${mealTime}${isRefresh ? ' (Refresh)' : ''}`, 'color: blue; font-weight: bold;');
    
    if (!isUserSwipesLoaded || apiCallInProgressRef.current || !menu || !user) {
      console.warn(`%c[DishSwipeSection] Skipping load: UserSwipesLoaded (${isUserSwipesLoaded}), InProgress (${apiCallInProgressRef.current}), NoMenu (${!menu}), NoUser (${!user})`, 'color: orange;');
      if (!isUserSwipesLoaded) setIsLoading(true);
      return;
    }
    
    apiCallInProgressRef.current = true;
    setIsLoading(true);
    
    console.log(`%c[DishSwipeSection] User Swiped Dishes Count (for FE filtering): ${userSwipedDishIds.size}`, 'color: purple;');

    try {
      const queryParams = new URLSearchParams();
      const capitalizedMealTime = mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
      queryParams.append('category', capitalizedMealTime);
      queryParams.append('limit', '30');
      
      if (user.dietaryPreferences?.isVegetarian) {
        queryParams.append('preference', 'Veg');
      }
      
      const apiUrl = `/api/dishes?${queryParams.toString()}`;
      console.log(`%c[DishSwipeSection] Fetching API: ${apiUrl}`, 'color: green;');
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Failed to fetch dishes: ${response.statusText} (${response.status})`);
      
      const data = await response.json();
      const receivedDishes: Dish[] = data.dishes || [];
      console.log(`%c[DishSwipeSection] API Response: Received ${receivedDishes.length} dishes. IDs: [${receivedDishes.map(d => d.dish_id).join(', ')}]`, 'color: green;');

      if (!Array.isArray(receivedDishes)) {
        console.error("[DishSwipeSection] API Error: Invalid dishes array received.", data);
        setCurrentDishes([]);
        return;
      }
      
      const newDishesToDisplay = receivedDishes.filter((dish: Dish) => 
        dish.dish_id && !userSwipedDishIds.has(dish.dish_id)
      );
      console.log(`%c[DishSwipeSection] Filtered (User Swipes): ${newDishesToDisplay.length} dishes remaining after filtering ${receivedDishes.length}.`, 'color: brown;');
      
      setCurrentDishes(newDishesToDisplay); 
      console.log(`%c[DishSwipeSection] State Updated: Displaying ${newDishesToDisplay.length} dishes for ${mealTime}.`, 'color: blue; font-weight: bold;');

    } catch (error) {
      console.error("[DishSwipeSection] Error loading dishes:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load dishes." });
      setCurrentDishes([]);
    } finally {
      setIsLoading(false);
      apiCallInProgressRef.current = false;
    }
  }, [mealTime, menu, user, userSwipedDishIds, isUserSwipesLoaded, toast]);

  useEffect(() => {
    setCurrentDishes([]);
    loadDishes();
  }, [loadDishes]);

  const requestMoreDishes = useCallback(() => {
    console.log("Requesting more dishes...");
    loadDishes();
  }, [loadDishes]);

  const handleSwipe = async (dish: Dish, direction: string) => {
    if (!dish?.dish_id || !user?.uid) return;
    const isLiked = direction === "right";

    console.log(`Swiped ${direction} (${isLiked ? 'like' : 'dislike'}) on ${dish.name} (${dish.dish_id})`);

    setCurrentDishes((prev) => prev.filter((d) => d.dish_id !== dish.dish_id));
    
    setUserSwipedDishIds(prev => new Set(prev).add(dish.dish_id));
    
    try {
      const wasMatch = await swipeOnDish(dish, isLiked);

      if (wasMatch) {
        console.log(`MATCH CONFIRMED for ${dish.name} (${dish.dish_id})`);
        setShowMatchAnimation(true);
        if (matchAnimationTimeoutRef.current) {
          clearTimeout(matchAnimationTimeoutRef.current);
        }
        matchAnimationTimeoutRef.current = setTimeout(() => {
          setShowMatchAnimation(false);
        }, 2000);
        
      } else if (isLiked) {
        console.log(`Liked ${dish.name} (${dish.dish_id}) - No match yet.`);
        setLastLikedDish(dish);
        setShowLikeAnimation(true);
        if (likeAnimationTimeoutRef.current) clearTimeout(likeAnimationTimeoutRef.current);
        likeAnimationTimeoutRef.current = setTimeout(() => setShowLikeAnimation(false), 1500);
      }

      setTimeout(() => {
         setCurrentDishes(prevDishes => {
            if (prevDishes.length <= 5) {
              console.log("Dish stack low after swipe, requesting more...");
              requestMoreDishes();
            }
            return prevDishes;
         });
      }, 100); 

    } catch (error) {
      console.error("Error handling swipe action:", error);
      setUserSwipedDishIds(prev => { const next = new Set(prev); next.delete(dish.dish_id); return next; });
      toast({ variant: "destructive", title: "Swipe Error", description: `Could not record swipe for ${dish.name}.` });
    }
  };

  const handleRefresh = useCallback(() => {
    console.log("[DishSwipeSection] Handle Refresh Called");
    setCurrentDishes([]); 
    loadDishes(true);
  }, [loadDishes]);

  return (
    <TabsContent value={mealTime} className="mt-4 flex flex-col flex-grow relative min-h-[550px]">
      <AnimatePresence>
        {showMatchAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50 rounded-lg pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CheckCircle2 className="h-24 w-24 text-green-400 mb-4" />
            </motion.div>
            <motion.p 
              className="text-3xl font-bold text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              It's a Match!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col flex-grow items-center justify-center w-full">
        {isLoading && currentDishes.length === 0 ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading dishes...</p>
          </div>
        ) : !isLoading && currentDishes.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-lg font-semibold mb-2">No more dishes!</p>
            <p className="text-sm text-muted-foreground mb-4">
              You've seen all available dishes for {mealTime} based on your preferences and matches.
            </p>
            <Button onClick={handleRefresh} variant="outline">Check Again</Button>
          </div>
        ) : (
          <DishStack 
            dishes={currentDishes} 
            onSwipe={handleSwipe} 
            isLoading={isLoading}
            onRefresh={handleRefresh}
            showLikeAnimation={showLikeAnimation}
            lastLikedDish={lastLikedDish}
          />
        )}
      </div>
    </TabsContent>
  );
}; 