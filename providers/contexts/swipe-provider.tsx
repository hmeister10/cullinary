"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { SwipeRepository } from "@/lib/repositories/swipe.repository"
import { MenuRepository } from "@/lib/repositories/menu.repository"
import { useUser } from "./user-provider"
import { useMenu } from "./menu-provider"
import type { Dish } from "@/lib/types/dish-types"
import type { SwipeContextType, UserSwipes } from "./types"

const SwipeContext = createContext<SwipeContextType | undefined>(undefined)

export function SwipeProvider({ children }: { children: ReactNode }) {
  const [userSwipes, setUserSwipes] = useState<UserSwipes>({})
  const { user } = useUser()
  const { activeMenu } = useMenu()
  const { toast } = useToast()
  
  const swipeRepository = new SwipeRepository()
  const menuRepository = new MenuRepository()

  // Swipe on a dish
  const swipeOnDish = async (dish: Dish, isLiked: boolean): Promise<boolean> => {
    if (!user || !activeMenu) return false;

    try {
      // Record the swipe (this should happen regardless of match)
      await swipeRepository.recordSwipe(user.uid, dish.dish_id, activeMenu.menu_id, isLiked);
      
      // Update local state immediately for responsiveness
      setUserSwipes(prev => ({
        ...prev,
        [dish.dish_id]: isLiked
      }));

      // Only check for match if it was a LIKE swipe
      if (isLiked) {
        // Pass participants list to avoid redundant fetch
        const participants = activeMenu.participants || [];
        const isMatch = await swipeRepository.checkForMatch(activeMenu.menu_id, dish.dish_id, participants);
        
        if (isMatch) {
          // Atomically add the match to the correct category
          let categoryFromDish = dish.category || 'snack'; // Use a sensible default
          
          // Normalize category key for Firestore path to lowercase
          const categoryKeyForUpdate = categoryFromDish.toLowerCase(); // Simple lowercase string
          
          console.log(`SwipeProvider: Dish category is '${categoryFromDish}', using '${categoryKeyForUpdate}' for Firestore update.`);

          // Pass the simple lowercase string to addMatch
          const success = await menuRepository.addMatch(activeMenu.menu_id, dish.dish_id, categoryKeyForUpdate);
          
          if (success) {
            toast({ // Optional: Notify user of match
              title: "It's a Match!",
              description: `${dish.name} added to the menu.`,
            });
            return true; // Indicate a match occurred
          } else {
            console.error(`Failed to add match ${dish.dish_id} to menu ${activeMenu.menu_id}`);
            // Optional: Show an error toast if adding the match fails
            // toast({...});
            return false; // Indicate match check succeeded, but DB update failed
          }
        }
      }
      // If it wasn't a like, or if it wasn't a match
      return false;
    } catch (error) {
      console.error("Error swiping on dish:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record swipe. Please try again.",
      });
      return false;
    }
  };

  // Fetch dishes to swipe
  const fetchDishesToSwipe = useCallback(async (category: string): Promise<Dish[]> => {
    if (!user || !activeMenu) return [];

    try {
      // Get swiped dish IDs for this category
      const swipedDishIds = Object.entries(userSwipes)
        .filter(([_, isLiked]) => isLiked)
        .map(([dishId]) => dishId);

      // Fetch dishes from API
      const response = await fetch(`/api/dishes?category=${category}&exclude=${swipedDishIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dishes');
      }
      
      const data = await response.json();
      return data.dishes || [];
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dishes. Please try again.",
      });
      return [];
    }
  }, [user, activeMenu, userSwipes, toast]);

  // Remove dish from shortlist using atomic operation
  const removeDishFromShortlist = async (dish: Dish, category: string): Promise<boolean> => {
    if (!user || !activeMenu || !dish.dish_id || !category) return false;

    try {
      const success = await menuRepository.removeMatch(activeMenu.menu_id, dish.dish_id, category);
      
      if (!success) {
        console.error(`Failed to remove match ${dish.dish_id} from menu ${activeMenu.menu_id}`);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove dish from shortlist. Please try again.",
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error removing dish from shortlist:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove dish from shortlist. Please try again.",
      });
      return false;
    }
  };

  const value = {
    userSwipes,
    swipeOnDish,
    fetchDishesToSwipe,
    removeDishFromShortlist
  }

  return (
    <SwipeContext.Provider value={value}>
      {children}
    </SwipeContext.Provider>
  )
}

export function useSwipe() {
  const context = useContext(SwipeContext)
  if (context === undefined) {
    throw new Error('useSwipe must be used within a SwipeProvider')
  }
  return context
} 