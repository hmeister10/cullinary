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
      // Record the swipe
      await swipeRepository.recordSwipe(user.uid, dish.dish_id, activeMenu.menu_id, isLiked);
      
      // Update local state
      setUserSwipes(prev => ({
        ...prev,
        [dish.dish_id]: isLiked
      }));

      // Check for match
      const isMatch = await swipeRepository.checkForMatch(activeMenu.menu_id, dish.dish_id);
      
      if (isMatch) {
        // Update menu matches
        const updatedMenu = await menuRepository.updateMenu(activeMenu.menu_id, {
          matches: {
            ...activeMenu.matches,
            [dish.category]: [...(activeMenu.matches[dish.category] || []), dish.dish_id]
          }
        });
      }

      return isMatch;
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

  // Remove dish from shortlist
  const removeDishFromShortlist = async (dish: Dish, category: string): Promise<boolean> => {
    if (!user || !activeMenu) return false;

    try {
      const updatedMenu = await menuRepository.updateMenu(activeMenu.menu_id, {
        matches: {
          ...activeMenu.matches,
          [category]: activeMenu.matches[category].filter(id => id !== dish.dish_id)
        }
      });
      
      return !!updatedMenu;
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