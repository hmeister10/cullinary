"use client";

import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { firestoreService } from "@/lib/firestore-service";
import { type Menu, type MenuMatches } from "@/lib/types/menu-types";
import type { Dish } from "@/lib/types/dish-types";
import { useUser } from "./user-provider"; // Import user hook
import { useMenu } from "./menu-provider"; // Import menu hook

// Define the structure for UserSwipes locally or import from a shared type file
interface UserSwipes {
  [dishId: string]: boolean // true for right swipe, false for left swipe
}

// Define the context type for Swipe related state and functions
interface SwipeContextType {
  userSwipes: UserSwipes;
  fetchDishesToSwipe: (category: string) => Promise<Dish[]>;
  swipeOnDish: (dish: Dish, isLiked: boolean) => Promise<boolean>;
  removeDishFromShortlist: (dish: Dish, category: string) => Promise<boolean>;
}

// Create the context
const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

// Create the provider component
export function SwipeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser(); // Consume user context
  const { activeMenu, updateActiveMenu } = useMenu(); // Consume menu context (assuming setActiveMenu exists or we pass it down)
  const [userSwipes, setUserSwipes] = useState<UserSwipes>({});
  const { toast } = useToast();

  // Fetch dishes to swipe for a specific category
  const fetchDishesToSwipe = useCallback(async (category: string): Promise<Dish[]> => {
    if (!user) throw new Error("User not authenticated");
    if (!activeMenu) throw new Error("No active menu selected");

    // Always fetch the latest swipes from Firestore first
    let currentSwipes: UserSwipes = {};
    try {
      console.log(`SwipeProvider: Fetching latest user swipes from Firestore for menu ${activeMenu.menu_id}`);
      currentSwipes = await firestoreService.getUserSwipesForMenu(user.uid, activeMenu.menu_id);
      setUserSwipes(currentSwipes); // Update local state as well
    } catch (error) {
      console.error("SwipeProvider: Error fetching user swipes:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load swipe history." });
      // Decide if we should proceed without swipes or return empty
      // Proceeding might show already swiped cards, returning empty might be safer
      return []; 
    }

    try {
      console.log(`SwipeProvider: Fetching dishes for category: ${category} from API`);

      // Fetch dishes from the API endpoint
      const apiUrl = `/api/dishes?category=${encodeURIComponent(category)}&limit=100`; // Base URL
      // TODO: Add preference and exclude logic back carefully
      console.log("SwipeProvider: Constructed API URL:", apiUrl); // Log the final URL
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const allDishesForCategory: Dish[] = data.dishes || [];
      if (!Array.isArray(allDishesForCategory)) throw new Error("Invalid response format from dishes API.");

      // Filter swiped using the freshly fetched swipes
      let filteredDishes = allDishesForCategory.filter(dish => !currentSwipes.hasOwnProperty(dish.dish_id));
      console.log(`SwipeProvider: Dishes before swipe filter: ${allDishesForCategory.length}, after: ${filteredDishes.length}`);

      // Apply dietary preferences
      const prefs = user.dietaryPreferences;
      if (prefs) {
        if (prefs.isVegetarian) {
          const countBefore = filteredDishes.length;
          filteredDishes = filteredDishes.filter(dish => dish.preference === "Veg");
          console.log(`SwipeProvider: Filtered by vegetarian. Before: ${countBefore}, After: ${filteredDishes.length}`);
        }
        // ... other preference filters ...
      }
      return filteredDishes;
    } catch (error) {
      console.error("SwipeProvider: Error fetching dishes:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch dishes." });
      return [];
    }
  }, [user, activeMenu, toast, setUserSwipes]); // Updated dependencies

  // Swipe on dish (depends on user, activeMenu)
  const swipeOnDish = useCallback(async (dish: Dish, isLiked: boolean): Promise<boolean> => {
    if (!user || !activeMenu) {
      console.error("SwipeProvider: User or activeMenu missing for swipe.");
      return false;
    } 
    try {
      await firestoreService.recordSwipe(user.uid, dish.dish_id, activeMenu.menu_id, isLiked);
      setUserSwipes(prev => ({ ...prev, [dish.dish_id]: isLiked })); // Update local swipes

      if (isLiked) {
        const matchFound = await firestoreService.checkForMatch(activeMenu.menu_id, dish.dish_id, dish.category);
        if (matchFound) {
          toast({ title: "It's a Match!", description: `${dish.name} added to menu.` });
          // Note: activeMenu update happens via listener in MenuProvider/SwipePageContent
        }
      }
      return true;
    } catch (error) {
      console.error("SwipeProvider: Error swiping on dish:", error);
      toast({ variant: "destructive", title: "Swipe Error", description: "Failed to record swipe." });
      return false;
    }
  }, [user, activeMenu, toast]); // Depends on user, activeMenu, toast

  // Remove dish from shortlist (depends on user, activeMenu)
  const removeDishFromShortlist = useCallback(async (dish: Dish, category: string): Promise<boolean> => {
    if (!user || !activeMenu) {
        console.error("SwipeProvider: User or activeMenu missing for remove.");
        return false; 
    }
    try {
      const updatedMenu = { ...activeMenu };
      const categoryKey = category.toLowerCase() as keyof MenuMatches;
      if (!(categoryKey in updatedMenu.matches)) return false;
      
      const categoryMatchIDs = updatedMenu.matches[categoryKey];
      const updatedMatchIDs = categoryMatchIDs.filter((id: string) => id !== dish.dish_id);
      updatedMenu.matches[categoryKey] = updatedMatchIDs;
      
      // Update Firestore first
      await firestoreService.updateMenu(updatedMenu); 
      
      // Now update the activeMenu state in MenuProvider
      updateActiveMenu(updatedMenu); 
      
      toast({ title: "Dish Removed", description: `${dish.name} removed from ${category}.` });
      return true;
    } catch (error) {
      console.error("SwipeProvider: Error removing dish:", error);
      toast({ title: "Error", description: "Could not remove dish.", variant: "destructive" });
      return false;
    }
  }, [user, activeMenu, toast, updateActiveMenu]); // Depends on user, activeMenu, toast, updateActiveMenu

  // Define the context value
  const contextValue: SwipeContextType = {
    userSwipes,
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