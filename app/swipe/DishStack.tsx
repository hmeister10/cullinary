"use client"

import type { Dish } from "@/lib/types/dish-types"
import { Button } from "@/components/ui/button"
import DishCard from "./DishCard"
import TinderCard from "@/components/tinder-card"
import HeartAnimation from "./HeartAnimation"
import { memo, useEffect } from "react"

// Import the calculateMatchScore function from SwipePageContent
// This is a simplified version since we can't directly import from SwipePageContent
const calculateMatchScore = (dish: Dish, userPreferences: any): { score: number; matchReasons: string[] } => {
  let score = 0;
  const matchReasons: string[] = [];
  
  // Base score is 50% - every dish starts here
  score = 50;
  
  // Check vegetarian preference
  if (userPreferences?.isVegetarian && dish.preference === "Veg") {
    score += 10;
    matchReasons.push("Vegetarian");
  }
  
  // Check health preference
  if (userPreferences?.healthTags?.includes("fitness") && dish.is_healthy) {
    score += 10;
    matchReasons.push("Healthy option");
  }
  
  // Check if dish matches cuisine preferences
  if (userPreferences?.cuisinePreferences?.length > 0 && dish.cuisines) {
    for (const cuisine of userPreferences.cuisinePreferences) {
      if (dish.cuisines.some((c: string) => c.toLowerCase().includes(cuisine.toLowerCase()))) {
        score += 15;
        matchReasons.push(`${cuisine} cuisine`);
        break; // Only count once
      }
    }
  }
  
  // Check if dish contains preferred proteins
  if (userPreferences?.proteinPreferences?.length > 0 && dish.protein_source) {
    for (const protein of userPreferences.proteinPreferences) {
      if (dish.protein_source.toLowerCase().includes(protein.toLowerCase())) {
        score += 15;
        matchReasons.push(`Contains ${protein}`);
        break; // Only count once
      }
    }
  }
  
  // Check if dish contains any specific preferences in ingredients
  if (userPreferences?.specificPreferences?.length > 0 && dish.ingredients) {
    for (const pref of userPreferences.specificPreferences) {
      if (dish.ingredients.some((ingredient: string) => ingredient.toLowerCase().includes(pref.toLowerCase()))) {
        score += 10;
        matchReasons.push(`Contains ${pref}`);
        break; // Only count once
      }
    }
  }
  
  // Check if dish contains any avoided ingredients (negative score)
  if (userPreferences?.avoidances?.length > 0 && dish.ingredients) {
    for (const avoidance of userPreferences.avoidances) {
      if (dish.ingredients.some((ingredient: string) => ingredient.toLowerCase().includes(avoidance.toLowerCase()))) {
        score -= 30; // Big penalty for containing avoided ingredients
        matchReasons.push(`Contains avoided ingredient: ${avoidance}`);
        break; // Only count once
      }
    }
  }
  
  // Check for dietary tags match
  if (userPreferences?.healthTags?.length > 0 && dish.dietary_tags) {
    for (const tag of userPreferences.healthTags) {
      if (dish.dietary_tags.some((dt: string) => dt.toLowerCase().includes(tag.toLowerCase()))) {
        score += 10;
        matchReasons.push(`Matches health goal: ${tag}`);
        break; // Only count once
      }
    }
  }
  
  // Bonus for dishes that match multiple criteria
  if (matchReasons.length > 2) {
    score += 5;
  }
  
  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return { score, matchReasons };
};

interface DishStackProps {
  dishes: Dish[];
  onSwipe: (dish: Dish, direction: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  showLikeAnimation: boolean;
  lastLikedDish: Dish | null;
  userPreferences?: any; // Add user preferences prop
}

// Use memo to prevent unnecessary re-renders
const DishStack = memo(({ 
  dishes, 
  onSwipe, 
  isLoading, 
  onRefresh, 
  showLikeAnimation, 
  lastLikedDish,
  userPreferences 
}: DishStackProps) => {
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
  
  // Calculate match scores for the top dish
  const topDishMatch = userPreferences 
    ? calculateMatchScore(dishes[0], userPreferences)
    : { score: 50, matchReasons: [] };
  
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
          <DishCard 
            dish={dishes[0]} 
            matchScore={topDishMatch.score}
            matchReasons={topDishMatch.matchReasons}
          />
        </TinderCard>
      </div>
      
      {/* Render the next few cards as a stack for visual effect */}
      {dishes.slice(1, 3).map((dish, index) => {
        // Calculate match scores for the background dishes
        const { score, matchReasons } = userPreferences 
          ? calculateMatchScore(dish, userPreferences)
          : { score: 50, matchReasons: [] };
        
        return (
          <div 
            key={dish.dish_id} 
            className="absolute w-full h-full pointer-events-none"
            style={{
              zIndex: -index - 1,
              transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.05})`,
              opacity: 1 - (index + 1) * 0.2
            }}
          >
            <DishCard 
              dish={dish} 
              matchScore={score}
              matchReasons={matchReasons}
            />
          </div>
        );
      })}
    </div>
  );
});

// Add display name for debugging
DishStack.displayName = "DishStack";

export default DishStack 