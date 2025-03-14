"use client"

import { Dish } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import DishCard from "./DishCard"
import TinderCard from "@/components/tinder-card"
import HeartAnimation from "./HeartAnimation"
import { memo, useEffect } from "react"

interface DishStackProps {
  dishes: Dish[];
  onSwipe: (dish: Dish, direction: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  showLikeAnimation: boolean;
  lastLikedDish: Dish | null;
}

// Use memo to prevent unnecessary re-renders
const DishStack = memo(({ dishes, onSwipe, isLoading, onRefresh, showLikeAnimation, lastLikedDish }: DishStackProps) => {
  // Log when dishes change
  useEffect(() => {
    console.log("DishStack received dishes:", dishes.length);
  }, [dishes]);

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
  
  return (
    <div className="relative h-full">
      {/* Like animation overlay */}
      {showLikeAnimation && <HeartAnimation dish={lastLikedDish} />}
      
      {/* Only render the top card to improve performance */}
      <div className="absolute w-full h-full">
        <TinderCard
          onSwipe={(direction) => onSwipe(dishes[0], direction)}
          preventSwipe={["up", "down"]}
          className="w-full h-full"
        >
          <DishCard dish={dishes[0]} />
        </TinderCard>
      </div>
      
      {/* Render the next few cards as a stack for visual effect */}
      {dishes.slice(1, 3).map((dish, index) => (
        <div 
          key={dish.dish_id} 
          className="absolute w-full h-full pointer-events-none"
          style={{
            zIndex: -index - 1,
            transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.05})`,
            opacity: 1 - (index + 1) * 0.2
          }}
        >
          <DishCard dish={dish} />
        </div>
      ))}
    </div>
  );
});

// Add display name for debugging
DishStack.displayName = "DishStack";

export default DishStack 