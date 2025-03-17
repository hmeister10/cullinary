"use client"

import type { Dish } from "@/lib/types/dish-types"
import { Button } from "@/components/ui/button"
import DishCard from "./DishCard"
import { memo } from "react"

interface DishStackProps {
  dishes: Dish[];
  onSwipe: (dish: Dish, direction: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  showLikeAnimation: boolean;
  lastLikedDish: Dish | null;
  userPreferences?: any;
  swipedDishIds?: string[];
}

const DishStack = memo(({ 
  dishes, 
  onSwipe, 
  isLoading, 
  onRefresh,
  userPreferences
}: DishStackProps) => {
  console.log("DishStack rendered with dishes:", dishes.length);

  // Loading state
  if (isLoading && dishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (dishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-lg font-medium">No more dishes to swipe!</p>
        <Button 
          onClick={onRefresh}
          className="px-6 py-2"
          variant="outline"
        >
          Refresh
        </Button>
      </div>
    );
  }
  
  // Main content - show current dish with simple like/dislike buttons
  const currentDish = dishes[0];
  
  return (
    <div className="relative h-full flex flex-col">
      {/* Primary dish card */}
      <div className="flex-1 mb-4">
        <DishCard 
          dish={currentDish} 
          matchScore={50} // Simple default score
          matchReasons={[]}
        />
      </div>
      
      {/* Simple swipe controls */}
      <div className="flex justify-center space-x-4 pb-4">
        <Button 
          variant="outline" 
          className="rounded-full h-14 w-14 flex items-center justify-center"
          onClick={() => onSwipe(currentDish, "left")}
        >
          👎
        </Button>
        <Button 
          variant="default" 
          className="rounded-full h-14 w-14 flex items-center justify-center"
          onClick={() => onSwipe(currentDish, "right")}
        >
          👍
        </Button>
      </div>
      
      {/* Dish counter */}
      <div className="text-xs text-muted-foreground text-center pb-2">
        {dishes.length} dishes remaining
      </div>
    </div>
  );
});

// Add display name for debugging
DishStack.displayName = "DishStack";

export default DishStack 