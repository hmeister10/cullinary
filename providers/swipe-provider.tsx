"use client";

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "./user-provider";
import { useMenu } from "./menu-provider";
import { swipeService } from "@/lib/services/swipe-service";
import type { Dish, DietPreference } from "@/lib/types/dish-types";
import { type Menu, type MenuMatches } from "@/lib/types/menu-types";
import { type UserSwipes, type SwipeStatus } from "@/lib/types/swipe-types";

// Define the context type for Swipe related state and functions
interface SwipeContextType {
  userSwipes: UserSwipes;
  isLoadingSwipes: boolean;
  fetchDishesToSwipe: (category: string, isRefresh?: boolean) => Promise<Dish[]>;
  swipeOnDish: (dish: Dish, isLiked: boolean) => Promise<boolean>;
  removeDishFromShortlist: (dish: Dish, category: string) => Promise<boolean>;
}

// Create the context
const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

// Create the provider component
export function SwipeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { activeMenu, updateActiveMenu } = useMenu();
  const { toast } = useToast();
  const [userSwipes, setUserSwipes] = useState<UserSwipes>({});
  const [isLoadingSwipes, setIsLoadingSwipes] = useState(false);

  // Fetch user swipes when active menu or user changes
  useEffect(() => {
    const loadSwipes = async () => {
      if (!user || !activeMenu) {
        setUserSwipes({});
        setIsLoadingSwipes(false);
        return;
      }
      setIsLoadingSwipes(true);
      console.log("SwipeProvider: useEffect fetching user swipes...");
      try {
        const swipes = await swipeService.getUserSwipesForMenu(user.uid, activeMenu.menu_id);
        setUserSwipes(swipes);
        console.log(`SwipeProvider: Successfully loaded ${Object.keys(swipes).length} swipes.`);
      } catch (error) {
        console.error("SwipeProvider: Error fetching swipes in useEffect:", error);
        setUserSwipes({});
        toast({ variant: "destructive", title: "Error", description: "Could not load your swipe history." });
      } finally {
        setIsLoadingSwipes(false);
      }
    };
    loadSwipes();
  }, [user, activeMenu, toast]);

  // Fetch dishes for swiping
  const fetchDishesToSwipe = useCallback(async (category: string, isRefresh = false): Promise<Dish[]> => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return [];
    }
    if (!activeMenu) {
      toast({ variant: "destructive", title: "Error", description: "No active menu selected." });
      return [];
    }
    if (isLoadingSwipes) {
      console.log("SwipeProvider: Still loading swipes, waiting to fetch dishes...");
      return [];
    }

    const currentSwipes = userSwipes;

    try {
      const apiUrl = `/api/dishes?category=${encodeURIComponent(category)}&limit=100`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`SwipeProvider: API Error ${response.status}: ${errorBody}`);
        throw new Error(`Failed to fetch dishes: ${response.statusText}`);
      }

      const data = await response.json();
      const allDishesForCategory: Dish[] = data.dishes || [];

      if (!Array.isArray(allDishesForCategory)) {
        console.error("SwipeProvider: Invalid response format from dishes API", data);
        throw new Error("Invalid response format from dishes API.");
      }
      console.log(`SwipeProvider: Received ${allDishesForCategory.length} dishes for '${category}' from API.`);

      let filteredDishes = allDishesForCategory.filter(dish => !currentSwipes.hasOwnProperty(dish.dish_id));
      if (filteredDishes.length < allDishesForCategory.length) {
          console.log(`SwipeProvider: ${allDishesForCategory.length - filteredDishes.length} dishes removed based on past swipes.`);
      }

      const prefs = user?.dietaryPreferences;
      if (prefs) {
        const originalCount = filteredDishes.length;
        
        if (prefs.isVegetarian) {
          filteredDishes = filteredDishes.filter(dish => dish.preference === "Veg");
        }

        if (prefs.dietType === "Vegan") { 
          filteredDishes = filteredDishes.filter(dish => dish.preference === "Vegan");
        }
        
        if (prefs.healthTags && prefs.healthTags.length > 0) {
          prefs.healthTags.forEach(tag => {
            filteredDishes = filteredDishes.filter(dish => 
              dish.dietary_tags?.includes(tag)
            );
          });
        }

        if (filteredDishes.length < originalCount) {
          console.log(`SwipeProvider: ${originalCount - filteredDishes.length} additional dishes removed based on user preferences.`);
        }
      }

      console.log(`SwipeProvider: Returning ${filteredDishes.length} dishes after filtering.`);
      return filteredDishes;
    } catch (error) {
      console.error("SwipeProvider: Error fetching dishes:", error);
      toast({ variant: "destructive", title: "Error Fetching Dishes", description: error instanceof Error ? error.message : "Could not load dishes." });
      return [];
    }
  }, [user, activeMenu, toast, userSwipes, isLoadingSwipes]);

  // Swipe on dish
  const swipeOnDish = useCallback(async (dish: Dish, isLiked: boolean): Promise<boolean> => {
    if (!user || !activeMenu) {
      toast({ variant: "destructive", title: "Error", description: "Cannot swipe without user and active menu." });
      return false;
    }
    const swipeStatus: SwipeStatus = isLiked ? 'like' : 'dislike';
    const { uid } = user;
    const { menu_id } = activeMenu;
    const { dish_id, category } = dish;

    try {
      await swipeService.recordSwipe(uid, dish_id, menu_id, swipeStatus);
      console.log(`SwipeProvider: Swipe ${swipeStatus} recorded for ${dish_id}.`);

      setUserSwipes(prev => ({ ...prev, [dish_id]: swipeStatus }));

      if (isLiked) {
        const matchResult = await swipeService.checkForMatch(menu_id, dish_id, category);
        if (matchResult) {
          console.log(`SwipeProvider: Match found for dish ${dish_id}!`);
          toast({ title: "It's a Match!", description: `${dish.name} is a match!` });
        }
      }
      return true;
    } catch (error) {
      console.error("SwipeProvider: Error recording swipe:", error);
      toast({ variant: "destructive", title: "Swipe Error", description: "Could not record your swipe." });
      return false;
    }
  }, [user, activeMenu, toast, updateActiveMenu]);

  // Remove dish from shortlist
  const removeDishFromShortlist = useCallback(async (dish: Dish, category: string): Promise<boolean> => {
    if (!user || !activeMenu) {
        toast({ variant: "destructive", title: "Error", description: "Cannot modify shortlist without user and active menu." });
      return false;
    }

    console.log(`SwipeProvider: Removing dish ${dish.dish_id} from category ${category} shortlist.`);

    try {
      const updatedMenu = JSON.parse(JSON.stringify(activeMenu));
      
      const categoryKey = category.toLowerCase() as keyof MenuMatches;
      
      if (!updatedMenu.matches || !Array.isArray(updatedMenu.matches[categoryKey])) { 
          console.warn(`SwipeProvider: Category ${categoryKey} not found or not an array in matches.`);
          return false;
      }

      const categoryMatchIDs: string[] = updatedMenu.matches[categoryKey];
      const initialLength = categoryMatchIDs.length;
      
      updatedMenu.matches[categoryKey] = categoryMatchIDs.filter((id: string) => id !== dish.dish_id);

      if (updatedMenu.matches[categoryKey].length < initialLength) {
        console.log(`SwipeProvider: Dish ${dish.dish_id} removed from local ${categoryKey} matches.`);
        updateActiveMenu(updatedMenu);
        toast({ title: "Dish Removed", description: `${dish.name} removed from shortlist.` });
        return true;
      } else {
        console.warn(`SwipeProvider: Dish ${dish.dish_id} not found in ${categoryKey} shortlist.`);
        return false;
      }
      
    } catch (error) {
      console.error("SwipeProvider: Error removing dish from shortlist:", error);
      toast({ variant: "destructive", title: "Error Removing Dish", description: "Could not remove dish from shortlist." });
      return false;
    }
  }, [user, activeMenu, toast, updateActiveMenu]);

  // Define the context value
  const contextValue: SwipeContextType = {
    userSwipes,
    isLoadingSwipes,
    fetchDishesToSwipe,
    swipeOnDish,
    removeDishFromShortlist,
  };

  return <SwipeContext.Provider value={contextValue}>{children}</SwipeContext.Provider>;
}

// Create the custom hook for using the context
export function useSwipe() {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error("useSwipe must be used within a SwipeProvider");
  }
  return context;
} 