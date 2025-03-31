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

  const controls = useAnimation();
  const [isAnimating, setIsAnimating] = useState(false);

  // Empty state (uses onRefresh from props)
  if (!isLoading && dishes.length === 0) {
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
  
  // Only proceed if not loading and dishes exist
  if (isLoading || dishes.length === 0) {
    // Parent shows loading, so return null here or a minimal placeholder
    return null; 
  }
  
  // Get the current dish (safe because we checked length > 0)
  const currentDish = dishes[0];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimating) return;
    const xOffset = info.offset.x;
    const xVelocity = info.velocity.x;
    
    if (Math.abs(xOffset) > swipeThreshold || Math.abs(xVelocity) > swipeConfidenceThreshold) {
      const dir = xOffset > 0 ? "right" : "left";
      setIsAnimating(true);
      controls.start({
        x: dir === "right" ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.5 }
      }).then(() => {
        onSwipe(currentDish, dir);
        setIsAnimating(false);
      });
    } else {
      controls.start({ x: 0, opacity: 1, transition: { duration: 0.5 } });
    }
  };
  
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
    // Use flex-col and h-full to occupy parent space
    <div className="relative w-full h-full flex flex-col items-center"> 
      {/* Card stack area - Use flex-grow to take available vertical space */} 
      <div className="flex-1 w-full flex items-center justify-center mb-4 relative"> 
        <AnimatePresence>
          {/* Limit rendering to top few cards for performance */} 
          {dishes.slice(0, 3).map((dish, index) => (
            <motion.div
              key={dish.dish_id ?? `dish-${index}`} // Fallback key
              className="absolute w-[90%] max-w-sm h-[420px]" // Give cards a size
              style={{
                zIndex: dishes.length - index,
                // Simplified stacking visuals
                y: index === 0 ? 0 : `${index * 6}px`, 
                opacity: index === 0 ? 1 : 1 - (index * 0.2), // Fade back cards
                scale: 1 - (index * 0.03), // Slightly shrink back cards
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                cursor: index === 0 ? "grab" : "auto", // Grab cursor only on top
              }}
              // Only top card is draggable and animated via controls
              {...(index === 0 ? {
                drag: "x",
                dragConstraints: { left: 0, right: 0 }, // Lock vertical drag
                dragElastic: 0.6,
                onDragEnd: handleDragEnd,
                whileDrag: { scale: 1.03, cursor: "grabbing" },
                animate: controls,
                initial: { scale: 0.98, y: 0, opacity: 1 }, // Start slightly smaller
                exit: { opacity: 0, transition: { duration: 0.3 } }, // Fade out on exit
                transition: { type: "spring", stiffness: 400, damping: 40 } // Spring animation for return
              } : {})}
            >
              <DishCard dish={dish} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Swipe controls below the card stack */} 
      <div className="flex justify-center space-x-6 py-4"> 
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button 
            variant="outline" 
            className="rounded-full h-14 w-14 flex items-center justify-center bg-red-50 border-red-200 hover:bg-red-100"
            onClick={() => handleSwipeClick("left")} disabled={isAnimating}
          >
            <ThumbsDown className="text-red-500" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button 
            variant="outline" 
            className="rounded-full h-14 w-14 flex items-center justify-center bg-green-50 border-green-200 hover:bg-green-100"
            onClick={() => handleSwipeClick("right")} disabled={isAnimating}
          >
            <ThumbsUp className="text-green-500" />
          </Button>
        </motion.div>
      </div>
      
      {/* Dish counter (optional, keep if desired) */} 
      {/* <motion.div 
        className="text-xs text-muted-foreground text-center pb-2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        {dishes.length} dishes remaining
      </motion.div> */}
    </div>
  );
});

// Add display name for debugging
DishStack.displayName = "DishStack";

export default DishStack 