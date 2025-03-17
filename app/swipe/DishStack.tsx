"use client"

import type { Dish } from "@/lib/types/dish-types"
import { Button } from "@/components/ui/button"
import DishCard from "./DishCard"
import TinderCard from "@/components/tinder-card"
import HeartAnimation from "./HeartAnimation"
import { memo, useEffect, useRef, useState, useMemo } from "react"

// Import the calculateMatchScore function from SwipePageContent
// This is a simplified version since we can't directly import from SwipePageContent
const calculateMatchScore = (dish: Dish, userPreferences: any): { score: number; matchReasons: string[] } => {
  let score = 0;
  const matchReasons: string[] = [];
  
  // Base score is 50% - every dish starts here
  score = 50;
  
  // Reduce log verbosity - only log the dish ID, not the full name
  console.log(`Calculating match score for dish ID: ${dish.dish_id}`);
  
  // Check if userPreferences exists
  if (!userPreferences) {
    console.log(`No user preferences available, using base score of ${score}%`);
    return { score, matchReasons };
  }
  
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
  
  // Log match score with shorter format
  console.log(`Match score for ${dish.dish_id}: ${score}%, reasons: ${matchReasons.length > 0 ? matchReasons.join(', ') : 'none'}`);
  
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
  swipedDishIds?: string[]; // Add swiped dish IDs prop
}

// Use memo to prevent unnecessary re-renders
const DishStack = memo(({ 
  dishes, 
  onSwipe, 
  isLoading, 
  onRefresh, 
  showLikeAnimation, 
  lastLikedDish,
  userPreferences,
  swipedDishIds = [] // Default to empty array if not provided
}: DishStackProps) => {
  // Keep track of previously rendered dishes to detect cycling
  const previousDishesRef = useRef<string[]>([]);
  const recycleCountRef = useRef<number>(0);
  
  // Use a stable reference to dishes to avoid unnecessary re-renders
  const [stableDishes, setStableDishes] = useState<Dish[]>([]);
  
  // Update stable dishes when dishes prop changes significantly
  useEffect(() => {
    // Only update if dishes have changed significantly (more than just order)
    if (dishes.length === 0) {
      setStableDishes([]);
      return;
    }
    
    // Check if the new dishes are significantly different from current stable dishes
    const currentDishIds = new Set(stableDishes.map(d => d.dish_id));
    const newDishIds = new Set(dishes.map(d => d.dish_id));
    
    // Count how many new dishes are not in the current set
    let newDishCount = 0;
    for (const id of newDishIds) {
      if (!currentDishIds.has(id)) {
        newDishCount++;
      }
    }
    
    // If we have new dishes or fewer dishes, update the stable reference
    if (newDishCount > 0 || dishes.length < stableDishes.length) {
      console.log(`Updating stable dishes reference with ${newDishCount} new dishes`);
      
      // Use a smooth transition by keeping some existing dishes if possible
      if (stableDishes.length > 0 && dishes.length > 0) {
        // Find dishes that exist in both sets to maintain continuity
        const commonDishes = stableDishes.filter(d => 
          dishes.some(newDish => newDish.dish_id === d.dish_id)
        );
        
        // Find new dishes that aren't in the stable set
        const newDishes = dishes.filter(d => 
          !stableDishes.some(oldDish => oldDish.dish_id === d.dish_id)
        );
        
        // Combine them, prioritizing common dishes at the beginning for continuity
        // but ensuring all new dishes are included
        const combinedDishes = [...commonDishes, ...newDishes];
        
        // Deduplicate by dish_id
        const seenIds = new Set();
        const uniqueDishes = combinedDishes.filter(dish => {
          if (seenIds.has(dish.dish_id)) return false;
          seenIds.add(dish.dish_id);
          return true;
        });
        
        setStableDishes(uniqueDishes);
      } else {
        // If no existing dishes, just use the new set
        setStableDishes(dishes);
      }
    } else {
      console.log("No significant change in dishes, keeping current stable reference");
    }
  }, [dishes, stableDishes]);
  
  // Log when dishes change
  useEffect(() => {
    console.log("DishStack received dishes:", dishes.length);
    
    // Log dish IDs for debugging (shortened to first 3 and last 3 if more than 10)
    const dishIds = dishes.map(d => d.dish_id);
    if (dishIds.length > 10) {
      console.log(`Current dish IDs (showing first 3 and last 3 of ${dishIds.length}):`, 
        [...dishIds.slice(0, 3), '...', ...dishIds.slice(-3)]);
    } else {
      console.log("Current dish IDs:", dishIds);
    }
    
    // Check if we're cycling through the same dishes
    const previousDishIds = previousDishesRef.current;
    
    // More sophisticated recycling detection
    // Check if at least 80% of the dishes are the same
    if (dishIds.length > 0 && previousDishIds.length > 0) {
      const commonDishes = dishIds.filter(id => previousDishIds.includes(id));
      const recyclePercentage = (commonDishes.length / dishIds.length) * 100;
      
      if (recyclePercentage >= 80) {
        recycleCountRef.current += 1;
        console.warn(`WARNING: Recycling dishes (${recyclePercentage.toFixed(1)}% overlap). Occurrence #${recycleCountRef.current}`);
        
        // Log the specific recycled dishes
        console.warn("Recycled dish IDs:", commonDishes);
        
        // If this happens multiple times, it's a serious issue
        if (recycleCountRef.current >= 3) {
          console.error("CRITICAL: Dishes are being recycled repeatedly. This indicates a problem with dish filtering or state management.");
          
          // Force a refresh after multiple recycling occurrences
          if (recycleCountRef.current === 3) {
            console.log("Forcing refresh due to repeated recycling");
            setTimeout(() => {
              onRefresh();
            }, 500);
          }
        }
      } else {
        // Reset the counter if we get a substantially different set
        recycleCountRef.current = 0;
      }
    }
    
    // Check if any dishes have already been swiped
    if (swipedDishIds && swipedDishIds.length > 0) {
      const alreadySwipedDishes = dishes.filter(d => swipedDishIds.includes(d.dish_id));
      if (alreadySwipedDishes.length > 0) {
        console.warn(`WARNING: ${alreadySwipedDishes.length} dishes have already been swiped but are still in the stack.`);
        console.warn("Already swiped dish IDs:", alreadySwipedDishes.map(d => d.dish_id));
      }
    }
    
    // Update previous dishes ref
    previousDishesRef.current = dishIds;
  }, [dishes, swipedDishIds, onRefresh]);

  // Filter out already swiped dishes if swipedDishIds is provided
  const filteredDishes = useMemo(() => {
    if (!swipedDishIds || swipedDishIds.length === 0) {
      return stableDishes;
    }
    
    // Create a Set for faster lookups
    const swipedIdsSet = new Set(swipedDishIds);
    
    // Filter out already swiped dishes
    const filtered = stableDishes.filter(dish => 
      dish.dish_id && !swipedIdsSet.has(dish.dish_id)
    );
    
    // Log if filtering changed the dish count
    if (stableDishes.length !== filtered.length) {
      console.log(`Filtered out ${stableDishes.length - filtered.length} already swiped dishes. Remaining: ${filtered.length}`);
      
      // Log the filtered out dish IDs
      const filteredOutDishIds = stableDishes
        .filter(dish => !filtered.includes(dish))
        .map(dish => dish.dish_id);
      
      console.log("Filtered out dish IDs:", filteredOutDishIds);
    }
    
    return filtered;
  }, [stableDishes, swipedDishIds]);

  if (isLoading && filteredDishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }
  
  if (filteredDishes.length === 0) {
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
    ? calculateMatchScore(filteredDishes[0], userPreferences)
    : { score: 50, matchReasons: [] };
  
  return (
    <div className="relative h-full">
      {/* Like animation overlay */}
      {showLikeAnimation && <HeartAnimation dish={lastLikedDish} />}
      
      {/* Only render the top card to improve performance */}
      <div className="absolute w-full h-full">
        <TinderCard
          onSwipe={(direction) => {
            console.log(`Swiping ${direction} on dish: ${filteredDishes[0].name} (${filteredDishes[0].dish_id})`);
            onSwipe(filteredDishes[0], direction);
          }}
          preventSwipe={["up", "down"]}
          className="w-full h-full"
        >
          <DishCard 
            dish={filteredDishes[0]} 
            matchScore={topDishMatch.score}
            matchReasons={topDishMatch.matchReasons}
          />
        </TinderCard>
      </div>
      
      {/* Render the next few cards as a stack for visual effect */}
      {filteredDishes.slice(1, 3).map((dish, index) => {
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