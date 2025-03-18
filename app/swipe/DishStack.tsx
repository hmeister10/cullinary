"use client"

import type { Dish } from "@/lib/types/dish-types"
import { Button } from "@/components/ui/button"
import DishCard from "./DishCard"
import { memo, useState } from "react"
import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react"

interface UserPreferences {
  diet: string;
  cuisine: string;
  spice: string;
  // Add other user preferences as needed
}

interface DishStackProps {
  dishes: Dish[];
  onSwipe: (dish: Dish, direction: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  showLikeAnimation: boolean;
  lastLikedDish: Dish | null;
  userPreferences?: UserPreferences;
  swipedDishIds?: string[];
}

const swipeConfidenceThreshold = 10000;
const swipeThreshold = 100; // Swipe distance required before triggering action

const DishStack = memo(({ 
  dishes, 
  onSwipe, 
  isLoading, 
  onRefresh,
}: DishStackProps) => {
  console.log("DishStack rendered with dishes:", dishes.length);
  const controls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(false);

  // Loading state
  if (isLoading && dishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
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
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (dishes.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-lg font-medium">No more dishes to swipe!</p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onRefresh}
            className="px-6 py-2"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Main content - show current dish with swipe gestures
  const currentDish = dishes[0];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If we're already in the middle of an animation, ignore this
    if (isAnimating) return;
    
    const xOffset = info.offset.x;
    const xVelocity = info.velocity.x;
    
    if (Math.abs(xOffset) > swipeThreshold || Math.abs(xVelocity) > swipeConfidenceThreshold) {
      // Direction threshold crossed - swipe it!
      const dir = xOffset > 0 ? "right" : "left";

      setIsAnimating(true);
      
      // Animate the card off screen in the right direction
      controls.start({
        x: dir === "right" ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.5 }
      }).then(() => {
        // After animation completes, trigger the swipe handler
        onSwipe(currentDish, dir);
        setIsAnimating(false);
      });
    } else {
      // If not past threshold, animate back to center
      controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.5 }
      });
    }
  };
  
  // Handle manual swipe button clicks
  const handleSwipeClick = (dir: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    controls.start({
      x: dir === "right" ? 1000 : -1000,
      opacity: 0,
      transition: { duration: 0.5 }
    }).then(() => {
      onSwipe(currentDish, dir);
      setIsAnimating(false);
    });
  };
  
  return (
    <div className="relative h-full flex flex-col">
      {/* Card stack with animations */}
      <div className="flex-1 mb-4 relative">
        <AnimatePresence>
          {dishes.slice(0, 3).map((dish, index) => (
            <motion.div
              key={dish.dish_id}
              className="absolute w-full"
              style={{
                zIndex: dishes.length - index,
                top: index === 0 ? 0 : `${index * 8}px`,
                opacity: index === 0 ? 1 : 0.4 - (index * 0.1),
                scale: 1 - (index * 0.05),
                boxShadow: index === 0 ? "0 8px 16px rgba(0, 0, 0, 0.15)" : "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
              // Only first card is draggable
              {...(index === 0 ? {
                drag: "x",
                dragConstraints: { left: 0, right: 0 },
                dragElastic: 0.7,
                onDragEnd: handleDragEnd,
                whileDrag: { scale: 1.02, cursor: "grabbing" },
                animate: controls,
                initial: { scale: 0.95, opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.3 }
              } : {})}
            >
              <DishCard 
                dish={dish} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Simple swipe controls */}
      <div className="flex justify-center space-x-6 pb-4">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button 
            variant="outline" 
            className="rounded-full h-14 w-14 flex items-center justify-center bg-red-50 border-red-200 hover:bg-red-100"
            onClick={() => handleSwipeClick("left")}
            disabled={isAnimating}
          >
            <ThumbsDown className="text-red-500" />
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button 
            variant="outline" 
            className="rounded-full h-14 w-14 flex items-center justify-center bg-green-50 border-green-200 hover:bg-green-100"
            onClick={() => handleSwipeClick("right")}
            disabled={isAnimating}
          >
            <ThumbsUp className="text-green-500" />
          </Button>
        </motion.div>
      </div>
      
      {/* Dish counter */}
      <motion.div 
        className="text-xs text-muted-foreground text-center pb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {dishes.length} dishes remaining
      </motion.div>
    </div>
  );
});

// Add display name for debugging
DishStack.displayName = "DishStack";

export default DishStack 