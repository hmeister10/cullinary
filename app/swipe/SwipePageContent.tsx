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
import { motion, AnimatePresence } from "framer-motion"

interface SwipePageContentProps {
  menuIdFromUrl?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3
    }
  }
};

const contentVariants = {
  initial: {
    opacity: 0,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.2
    }
  }
};

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
      <motion.div 
        className="flex items-center justify-center min-h-screen"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <UserNameForm onComplete={() => {}} />
      </motion.div>
    )
  }

  if (isLoadingMenu) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <motion.div 
            className="rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              ease: "linear",
              repeat: Infinity
            }}
          />
          <p>Loading menu...</p>
        </div>
      </motion.div>
    );
  }

  if (!activeMenu) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <p>No menu found. Please return to the home page.</p>
          <motion.button 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Return Home
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="container flex flex-col items-center min-h-screen py-6 px-4"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Menu Header - Shows menu completion, participants, quick links */}
      <MenuHeader menu={activeMenu} />

      <motion.div 
        className="w-full max-w-md mx-auto" 
        variants={contentVariants}
      >
        <Tabs value={currentMealTime} onValueChange={handleMealTimeChange} className="w-full">
          {/* Meal Time Tabs - Breakfast, Lunch, Dinner, Snack */}
          <MealTimeTabs 
            currentMealTime={currentMealTime} 
            onMealTimeChange={handleMealTimeChange} 
          />
          
          {/* Dish Swipe Section - Shows dish cards and handles swiping */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMealTime}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DishSwipeSection 
                mealTime={currentMealTime}
                menu={activeMenu}
              />
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

export default SwipePageContent 