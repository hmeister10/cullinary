"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { mockDB, type Menu } from "@/lib/mock-data"
import type { Dish } from "@/lib/types/dish-types"
import { firestoreService } from "@/lib/firestore-service"
import { getUserId, saveUserId, saveMenuToStorage, getUserName, saveUserName, hasUserName, getUserPreferences, saveUserPreferences } from "@/lib/local-storage"
import { isFirebasePermissionError } from "@/lib/firebase"

interface UserSwipes {
  [dishId: string]: boolean // true for right swipe, false for left swipe
}

interface DietaryPreferences {
  isVegetarian: boolean;
  dietType?: string;
  region?: string;
  healthTags?: string[];
  cuisinePreferences: string[];
  proteinPreferences: string[];
  specificPreferences: string[];
  avoidances: string[];
  occasionBasedDiet?: {
    enabled: boolean;
    days: string[];
    festivals: string[];
    other: string[];
  };
}

interface User {
  uid: string;
  name?: string;
  dietaryPreferences?: DietaryPreferences;
  favorites?: string[]; // Add favorites array to store dish IDs
}

interface AppContextType {
  user: User | null
  loading: boolean
  activeMenu: Menu | null
  userSwipes: UserSwipes
  hasSetName: boolean
  createMenu: (startDate: Date, endDate: Date) => Promise<string>
  joinMenu: (menuId: string) => Promise<boolean>
  swipeOnDish: (dish: Dish, isLiked: boolean) => Promise<boolean>
  fetchDishesToSwipe: (category: string) => Promise<Dish[]>
  setUserName: (name: string) => void
  updateUserProfile: (profile: Partial<User>) => Promise<boolean>
  getMenuParticipants: (menuId: string) => Promise<string[]>
  deleteMenu: (menuId: string) => Promise<boolean>
  removeDishFromShortlist: (dish: Dish, category: string) => Promise<boolean>
  updateUser: (user: User) => void // Add updateUser method
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null)
  const [userSwipes, setUserSwipes] = useState<UserSwipes>({})
  const [hasSetName, setHasSetName] = useState(false)
  const { toast } = useToast()

  // Create a mock user on component mount or retrieve from localStorage
  useEffect(() => {
    const createOrGetUser = async () => {
      try {
        console.log("AppProvider: Creating or getting user");
        // Check if user exists in localStorage
        let userId = getUserId();
        let userName = getUserName();
        let userPreferences = getUserPreferences();
        let userFavorites = localStorage.getItem('userFavorites');
        
        console.log("AppProvider: Retrieved from localStorage - userId:", userId ? "exists" : "not found", "userName:", userName ? "exists" : "not found");
        
        if (!userId) {
          // Generate a random user ID
          userId = `user_${Math.random().toString(36).substring(2, 9)}`
          saveUserId(userId);
          console.log("AppProvider: Generated new userId:", userId);
        }
        
        setUser({ 
          uid: userId, 
          name: userName || undefined,
          dietaryPreferences: userPreferences || undefined,
          favorites: userFavorites ? JSON.parse(userFavorites) : []
        })
        setHasSetName(!!userName)
        console.log("AppProvider: Set user state with userId:", userId, "hasSetName:", !!userName);

        // Create user in mock DB
        console.log("AppProvider: Creating user in mockDB with userId:", userId);
        const userData = await mockDB.createUser(userId);
        console.log("AppProvider: User created in mockDB:", userData ? "success" : "failed");
      } catch (error) {
        console.error("Error creating mock user:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize user. Please refresh the page.",
        })
      } finally {
        setLoading(false)
        console.log("AppProvider: Finished user initialization, loading set to false");
      }
    }

    createOrGetUser()
  }, [toast])

  // Set user name
  const setUserName = (name: string) => {
    if (!user) return;
    
    saveUserName(name);
    setUser({ ...user, name });
    setHasSetName(true);
    
    // Also update in Firestore if available
    try {
      firestoreService.updateUserName(user.uid, name).catch(error => {
        console.error("Error updating user name in Firestore:", error);
      });
    } catch (error) {
      console.error("Error updating user name:", error);
    }
  };

  // Update user profile
  const updateUserProfile = async (profile: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...profile };
      
      // Save to localStorage
      if (profile.name) {
        saveUserName(profile.name);
        setHasSetName(true);
      }
      
      if (profile.dietaryPreferences) {
        saveUserPreferences(profile.dietaryPreferences);
      }
      
      // Update state
      setUser(updatedUser);
      
      // Update in Firestore if available
      try {
        if (profile.name) {
          await firestoreService.updateUserName(user.uid, profile.name);
        }
        
        // Add Firestore update for dietary preferences if needed
        // This would require extending the firestoreService
        
        return true;
      } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        // Still return true since we updated locally
        return true;
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  // Get menu participants
  const getMenuParticipants = async (menuId: string): Promise<string[]> => {
    try {
      // Try to get from Firestore first
      try {
        const participants = await firestoreService.getMenuParticipants(menuId);
        return participants;
      } catch (error) {
        console.error("Error getting menu participants from Firestore:", error);
      }
      
      // Fallback to mock DB
      if (activeMenu) {
        return activeMenu.participants;
      }
      
      return [];
    } catch (error) {
      console.error("Error getting menu participants:", error);
      return [];
    }
  };

  // Create a new menu
  const createMenu = async (startDate: Date, endDate: Date): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log(`App Provider: Creating new menu`);
      
      // Create menu in Firestore
      let menuId;
      try {
        menuId = await firestoreService.createMenu(startDate.toISOString(), endDate.toISOString(), user.uid, user.name);
        console.log(`App Provider: Menu created in Firestore with ID: ${menuId}`);
      } catch (error) {
        console.error("Error creating menu in Firestore:", error);
        // If it's a permissions error, throw it so the UI can handle it
        if (isFirebasePermissionError(error)) {
          throw error;
        }
        // Otherwise, we can't continue without Firestore
        throw new Error("Failed to create menu in Firestore");
      }

      // Get the menu data
      const firestoreMenu = await firestoreService.getMenu(menuId);
      
      if (!firestoreMenu) {
        console.log(`App Provider: Could not retrieve menu ${menuId} after creation`);
        toast({
          variant: "default",
          title: "Warning",
          description: "Created menu but could not retrieve menu data. Please refresh.",
        });
      } else {
        // Set as active menu
        setActiveMenu(firestoreMenu);
      }

      // Save to localStorage
      saveMenuToStorage({
        menu_id: menuId,
        name: `Menu ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: Date.now()
      });
      
      return menuId;
    } catch (error) {
      console.error("Error creating menu:", error);
      
      // If it's a Firebase permissions error, rethrow it
      if (isFirebasePermissionError(error)) {
        throw error;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create menu. Please try again.",
      });
      throw error;
    }
  }

  // Join an existing menu
  const joinMenu = async (menuId: string): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log(`App Provider: Attempting to join menu with ID: ${menuId}`);
      
      // Normalize menu ID to uppercase
      const normalizedMenuId = menuId.toUpperCase();
      console.log(`App Provider: Normalized menu ID: ${normalizedMenuId}`);
      
      // Check if the menu exists in Firestore
      const menuExists = await firestoreService.menuExists(normalizedMenuId);
      
      if (!menuExists) {
        console.log(`App Provider: Menu ${normalizedMenuId} not found in Firestore`);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Menu not found. Please check the menu ID.",
        });
        return false;
      }
      
      console.log(`App Provider: Menu ${normalizedMenuId} exists in Firestore, attempting to join`);
      
      // Menu exists in Firestore, try to join it
      const firestoreSuccess = await firestoreService.joinMenu(normalizedMenuId, user.uid, user.name);
      
      if (!firestoreSuccess) {
        console.log(`App Provider: Failed to join menu ${normalizedMenuId} in Firestore`);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to join menu. Please try again.",
        });
        return false;
      }
      
      console.log(`App Provider: Successfully joined Firestore menu: ${normalizedMenuId}`);
      
      // Get the menu data
      const firestoreMenu = await firestoreService.getMenu(normalizedMenuId);
      
      if (!firestoreMenu) {
        console.log(`App Provider: Could not retrieve menu ${normalizedMenuId} after joining`);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Joined menu but could not retrieve menu data. Please refresh.",
        });
        return true; // Still return true since the join was successful
      }
      
      // Save to localStorage
      saveMenuToStorage({
        menu_id: normalizedMenuId,
        name: `Menu ${new Date(firestoreMenu.start_date).toLocaleDateString()} - ${new Date(firestoreMenu.end_date).toLocaleDateString()}`,
        start_date: firestoreMenu.start_date,
        end_date: firestoreMenu.end_date,
        created_at: Date.now()
      });
      
      // Set as active menu
      setActiveMenu(firestoreMenu);
      return true;
    } catch (error) {
      console.error("Error joining menu:", error)
      
      // If it's a Firebase permissions error, rethrow it
      if (isFirebasePermissionError(error)) {
        throw error;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join menu. Please try again.",
      })
      return false
    }
  }

  // Swipe on a dish (left or right)
  const swipeOnDish = async (dish: Dish, isLiked: boolean): Promise<boolean> => {
    if (!user || !activeMenu) throw new Error("User not authenticated or no active menu")

    try {
      // Record the swipe in mock DB
      await mockDB.recordSwipe(user.uid, dish.dish_id, isLiked)

      // Also record in Firestore if available
      try {
        await firestoreService.recordSwipe(user.uid, dish.dish_id, activeMenu.menu_id, isLiked);
      } catch (error) {
        console.error("Error recording swipe in Firestore:", error)
        // If it's a permissions error, log it but don't throw
        // We can continue with mock DB
        if (!isFirebasePermissionError(error)) {
          console.warn("Non-permission Firestore error:", error);
        }
      }

      // Update local state
      setUserSwipes((prev) => ({ ...prev, [dish.dish_id]: isLiked }))

      // Check for match if liked
      if (isLiked) {
        // Check in mock DB
        const isMatch = await mockDB.checkForMatch(activeMenu.menu_id, dish.dish_id)

        // Also check in Firestore if available
        try {
          await firestoreService.checkForMatch(activeMenu.menu_id, dish.dish_id);
        } catch (error) {
          console.error("Error checking for match in Firestore:", error)
          // If it's a permissions error, log it but don't throw
          if (!isFirebasePermissionError(error)) {
            console.warn("Non-permission Firestore error:", error);
          }
        }

        if (isMatch) {
          // Refresh menu data
          const updatedMenu = await mockDB.getMenu(activeMenu.menu_id)
          if (updatedMenu) {
            setActiveMenu(updatedMenu)
          }
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Error swiping on dish:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record your preference. Please try again.",
      })
      return false
    }
  }

  // Fetch dishes to swipe based on category
  const fetchDishesToSwipe = async (category: string): Promise<Dish[]> => {
    if (!user) {
      console.error("Cannot fetch dishes: No user is logged in");
      return [];
    }

    try {
      // Make sure the user exists in the mock database
      const existingUser = await mockDB.getUser(user.uid);
      if (!existingUser) {
        console.log("User not found in mockDB, creating user");
        await mockDB.createUser(user.uid);
      }
      
      // Get dishes for this category, passing user preferences if available
      const dishes = await mockDB.getDishes(
        category, 
        user.uid, 
        user.dietaryPreferences
      );
      
      return dishes;
    } catch (error) {
      console.error("Error fetching dishes:", error);
      return [];
    }
  }

  // Delete a menu from user's list
  const deleteMenu = async (menuId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Try to remove from Firestore first
      try {
        await firestoreService.removeMenuFromUser(user.uid, menuId);
      } catch (error) {
        console.error("Error removing menu from user in Firestore:", error);
        // If it's a permissions error, log it but don't throw
        if (!isFirebasePermissionError(error)) {
          console.warn("Non-permission Firestore error:", error);
        }
      }
      
      // If this is the active menu, clear it
      if (activeMenu && activeMenu.menu_id === menuId) {
        setActiveMenu(null);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete menu. Please try again.",
      });
      return false;
    }
  };

  // Remove a dish from the shortlist
  const removeDishFromShortlist = async (dish: Dish, category: string): Promise<boolean> => {
    if (!user || !activeMenu) throw new Error("User not authenticated or no active menu")

    try {
      // Update the active menu by removing the dish from the matches
      const updatedMenu = { ...activeMenu };
      
      // Find the dish in the matches array for the specified category
      const categoryMatches = updatedMenu.matches[category as keyof typeof updatedMenu.matches] as Dish[];
      const updatedMatches = categoryMatches.filter(d => d.dish_id !== dish.dish_id);
      
      // Update the matches for the category
      updatedMenu.matches[category as keyof typeof updatedMenu.matches] = updatedMatches;
      
      // Update the menu in mock DB
      await mockDB.updateMenu(updatedMenu);
      
      // Also update in Firestore if available
      try {
        await firestoreService.updateMenu(updatedMenu);
      } catch (error) {
        console.error("Error updating menu in Firestore:", error);
        // If it's a permissions error, log it but don't throw
        if (!isFirebasePermissionError(error)) {
          console.warn("Non-permission Firestore error:", error);
        }
      }
      
      // Update local state
      setActiveMenu(updatedMenu);
      saveMenuToStorage(updatedMenu);
      
      return true;
    } catch (error) {
      console.error("Error removing dish from shortlist:", error);
      return false;
    }
  };

  // Add updateUser function to the provider
  const updateUser = (updatedUser: User) => {
    if (!user) return;
    setUser(updatedUser);
    
    // Save favorites to localStorage if they've changed
    if (updatedUser.favorites && (!user.favorites || 
        JSON.stringify(updatedUser.favorites) !== JSON.stringify(user.favorites))) {
      localStorage.setItem('userFavorites', JSON.stringify(updatedUser.favorites));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        activeMenu,
        userSwipes,
        hasSetName,
        createMenu,
        joinMenu,
        swipeOnDish,
        fetchDishesToSwipe,
        setUserName,
        updateUserProfile,
        getMenuParticipants,
        deleteMenu,
        removeDishFromShortlist,
        updateUser
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

