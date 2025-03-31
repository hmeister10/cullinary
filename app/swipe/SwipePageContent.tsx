"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { useRouter, useSearchParams } from "next/navigation"
import type { Dish } from "@/lib/types/dish-types"
import { UserNameForm } from "@/components/user-name-form"
import { Tabs } from "@/components/ui/tabs"
import { MenuHeader } from "./components/MenuHeader"
import { MealTimeTabs } from "@/app/swipe/components/MealTimeTabs"
import { DishSwipeSection } from "@/app/swipe/components/DishSwipeSection"
import { type Menu } from "@/lib/types/menu-types"

interface SwipePageContentProps {
  menuIdFromUrl?: string;
}

const SwipePageContent = ({ menuIdFromUrl }: SwipePageContentProps) => {
  const { user, hasSetName } = useUser()
  const { activeMenu, joinMenu, loadMenu, subscribeToMenuUpdates } = useMenu()
  const [currentDisplayMenu, setCurrentDisplayMenu] = useState<Menu | null>(activeMenu)
  const [currentMealTime, setCurrentMealTime] = useState<string>("breakfast")
  const [isJoining, setIsJoining] = useState(false)
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const menuId = menuIdFromUrl || searchParams.get('menu')
  const hasInitializedRef = useRef(false)

  // Join menu from URL
  const joinMenuFromUrl = useCallback(async (id: string) => {
    if (isJoining) return; // Prevent multiple join attempts
    
    setIsJoining(true)
    try {
      const success = await joinMenu(id)
      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not join menu. It may not exist or has been deleted.",
        })
        router.push("/")
      } else {
        const url = new URL(window.location.href)
        url.searchParams.set('menu', id)
        window.history.replaceState({}, '', url.toString())
        
        toast({
          title: "Joined Menu",
          description: "You've successfully joined the menu.",
        })
      }
    } catch (error) {
      console.error("Error joining menu:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join menu. Please try again.",
      })
      router.push("/")
    } finally {
      setIsJoining(false)
    }
  }, [joinMenu, toast, router, isJoining])

  // Initialize menu from URL
  useEffect(() => {
    if (!hasSetName) return;
    
    if (menuId && !activeMenu && !isJoining && !hasInitializedRef.current) {
      console.log("Attempting to load or join menu from URL:", menuId);
      setIsLoadingMenu(true);
      
      loadMenu(menuId)
        .then(success => {
          if (success) {
            console.log("Successfully loaded menu from URL:", menuId);
            hasInitializedRef.current = true;
          } else {
            console.log("Failed to load menu, attempting to join:", menuId);
            return joinMenuFromUrl(menuId);
          }
        })
        .catch(error => {
          console.error("Error handling menu from URL:", error);
          router.push("/");
        })
        .finally(() => {
          setIsLoadingMenu(false);
        });
      
      return;
    }
    
    if (!activeMenu && hasInitializedRef.current && !isLoadingMenu) {
      router.push("/");
    }
  }, [hasSetName, menuId, activeMenu, isJoining, joinMenuFromUrl, router, loadMenu, isLoadingMenu]);

  // Effect to subscribe to real-time updates for the active menu
  useEffect(() => {
    // Make sure we have a menu ID to subscribe to
    const idToSubscribe = currentDisplayMenu?.menu_id || activeMenu?.menu_id;
    if (!idToSubscribe || !subscribeToMenuUpdates || !user) {
        // If there's no active menu ID or user, we can't subscribe.
        // Clear local state if it wasn't already null.
        if (currentDisplayMenu) setCurrentDisplayMenu(null);
        return; 
    }

    console.log(`SwipePageContent: Setting up listener for active menu: ${idToSubscribe}`);

    // Subscribe to updates
    const unsubscribe = subscribeToMenuUpdates(
        idToSubscribe,
        (updatedMenuData: Menu | null) => {
            console.log("SwipePageContent: Received menu update from listener:", updatedMenuData);
            setCurrentDisplayMenu(updatedMenuData); // Update local state with fresh data
            // Optional: Add toast or other feedback on update?
        }
    );

    // Cleanup subscription on unmount or when menu ID changes
    return () => {
        console.log(`SwipePageContent: Cleaning up listener for menu: ${idToSubscribe}`);
        if (unsubscribe) {
            unsubscribe();
        }
    };

    // Dependencies: subscribe function, user, and the ID we are subscribed to.
  }, [subscribeToMenuUpdates, user?.uid, currentDisplayMenu?.menu_id, activeMenu?.menu_id]); 

  // Update local state if context activeMenu changes (e.g., after initial load)
  useEffect(() => {
    setCurrentDisplayMenu(activeMenu);
  }, [activeMenu]);

  // Handle meal time change
  const handleMealTimeChange = useCallback((mealTime: string) => {
    setCurrentMealTime(mealTime);
  }, []);

  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

  if (isLoadingMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      {/* Pass local state to MenuHeader */}
      <MenuHeader menu={currentDisplayMenu} />
      
      <div className="w-full max-w-md mx-auto">
        <Tabs value={currentMealTime} onValueChange={handleMealTimeChange} className="w-full">
          {/* Meal Time Tabs - Breakfast, Lunch, Dinner, Snack */}
          <MealTimeTabs 
            currentMealTime={currentMealTime} 
            onMealTimeChange={handleMealTimeChange} 
          />
          
          {/* Pass local state to DishSwipeSection */}
          <DishSwipeSection 
            mealTime={currentMealTime}
            menu={currentDisplayMenu}
          />
        </Tabs>
      </div>
    </div>
  )
}

export default SwipePageContent 