"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { mockDB, type Dish, type Menu } from "@/lib/mock-data"
import { firestoreService } from "@/lib/firestore-service"
import { getUserId, saveUserId, saveMenuToStorage } from "@/lib/local-storage"

interface UserSwipes {
  [dishId: string]: boolean // true for right swipe, false for left swipe
}

interface AppContextType {
  user: { uid: string } | null
  loading: boolean
  activeMenu: Menu | null
  userSwipes: UserSwipes
  createMenu: (startDate: Date, endDate: Date) => Promise<string>
  joinMenu: (menuId: string) => Promise<boolean>
  swipeOnDish: (dish: Dish, isLiked: boolean) => Promise<boolean>
  fetchDishesToSwipe: (category: string) => Promise<Dish[]>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null)
  const [userSwipes, setUserSwipes] = useState<UserSwipes>({})
  const { toast } = useToast()

  // Create a mock user on component mount or retrieve from localStorage
  useEffect(() => {
    const createOrGetUser = async () => {
      try {
        // Check if user exists in localStorage
        let userId = getUserId();
        
        if (!userId) {
          // Generate a random user ID
          userId = `user_${Math.random().toString(36).substring(2, 9)}`
          saveUserId(userId);
        }
        
        setUser({ uid: userId })

        // Create user in mock DB
        await mockDB.createUser(userId)
      } catch (error) {
        console.error("Error creating mock user:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize user. Please refresh the page.",
        })
      } finally {
        setLoading(false)
      }
    }

    createOrGetUser()
  }, [toast])

  // Create a new menu
  const createMenu = async (startDate: Date, endDate: Date): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Create menu in mock DB
      const newMenu = await mockDB.createMenu(startDate.toISOString(), endDate.toISOString(), user.uid)
      
      // Also create in Firestore if available
      try {
        await firestoreService.createMenu(startDate.toISOString(), endDate.toISOString(), user.uid)
      } catch (error) {
        console.error("Error creating menu in Firestore:", error)
        // Continue with mock DB only
      }

      // Save to localStorage
      saveMenuToStorage({
        menu_id: newMenu.menu_id,
        name: `Menu ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: Date.now()
      });

      setActiveMenu(newMenu)
      return newMenu.menu_id
    } catch (error) {
      console.error("Error creating menu:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create menu. Please try again.",
      })
      throw error
    }
  }

  // Join an existing menu
  const joinMenu = async (menuId: string): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Try to join in Firestore first
      let firestoreSuccess = false;
      try {
        firestoreSuccess = await firestoreService.joinMenu(menuId, user.uid);
      } catch (error) {
        console.error("Error joining menu in Firestore:", error)
        // Continue with mock DB
      }

      // Join in mock DB
      const menu = await mockDB.joinMenu(menuId, user.uid)

      if (!menu) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Menu not found. Please check the menu ID.",
        })
        return false
      }

      // Save to localStorage
      saveMenuToStorage({
        menu_id: menu.menu_id,
        name: `Menu ${new Date(menu.start_date).toLocaleDateString()} - ${new Date(menu.end_date).toLocaleDateString()}`,
        start_date: menu.start_date,
        end_date: menu.end_date,
        created_at: Date.now()
      });

      setActiveMenu(menu)
      return true
    } catch (error) {
      console.error("Error joining menu:", error)
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
        // Continue with mock DB only
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
          // Continue with mock DB only
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
    if (!user) return []

    try {
      return await mockDB.getDishes(category, user.uid)
    } catch (error) {
      console.error("Error fetching dishes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dishes. Please try again.",
      })
      return []
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        activeMenu,
        userSwipes,
        createMenu,
        joinMenu,
        swipeOnDish,
        fetchDishesToSwipe,
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

