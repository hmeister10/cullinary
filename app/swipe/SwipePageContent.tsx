"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { UserNameForm } from "@/components/user-name-form"
import { Tabs } from "@/components/ui/tabs"
import { MenuHeader } from "./components/MenuHeader"
import { MealTimeTabs } from "@/app/swipe/components/MealTimeTabs"
import { DishSwipeSection } from "@/app/swipe/components/DishSwipeSection"

interface SwipePageContentProps {
  menuIdFromUrl?: string;
}

const SwipePageContent = ({ menuIdFromUrl }: SwipePageContentProps) => {
  const { activeMenu, joinMenu, hasSetName, loadMenu } = useApp()
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

  if (!activeMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>No menu found. Please return to the home page.</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => router.push("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      {/* Menu Header - Shows menu completion, participants, quick links */}
      <MenuHeader menu={activeMenu} />

      <div className="w-full max-w-md mx-auto">
        <Tabs value={currentMealTime} onValueChange={handleMealTimeChange} className="w-full">
          {/* Meal Time Tabs - Breakfast, Lunch, Dinner, Snack */}
          <MealTimeTabs 
            currentMealTime={currentMealTime} 
            onMealTimeChange={handleMealTimeChange} 
          />
          
          {/* Dish Swipe Section - Shows dish cards and handles swiping */}
          <DishSwipeSection 
            mealTime={currentMealTime}
            menu={activeMenu}
          />
        </Tabs>
      </div>
    </div>
  )
}

export default SwipePageContent 