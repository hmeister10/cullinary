"use client"

import type { Dish } from "@/lib/types/dish-types"
import { RecipeCard } from "./RecipeCard"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { RefObject, useMemo, useEffect } from "react"

interface RecipeGridProps {
  dishes: Dish[]
  isLoading: boolean
  hasMore: boolean
  loaderRef: RefObject<HTMLDivElement>
  onLoadMore: () => void
  onToggleFavorite: (dishId: string) => void
  isFavorite: (dishId: string) => boolean
}

export function RecipeGrid({
  dishes,
  isLoading,
  hasMore,
  loaderRef,
  onLoadMore,
  onToggleFavorite,
  isFavorite
}: RecipeGridProps) {
  // Log props for debugging
  useEffect(() => {
    console.log('RecipeGrid props:', { 
      dishCount: dishes.length, 
      isLoading, 
      hasMore, 
      loaderRefExists: !!loaderRef.current 
    });
  }, [dishes.length, isLoading, hasMore, loaderRef]);

  // Create a map of dish IDs to ensure uniqueness
  const dishMap = useMemo(() => {
    const map = new Map<string, Dish>();
    dishes.forEach(dish => {
      // If we already have this dish ID, append a unique suffix
      if (map.has(dish.dish_id)) {
        // Create a unique key by adding an index
        const uniqueId = `${dish.dish_id}_${Math.random().toString(36).substring(2, 9)}`;
        map.set(uniqueId, {...dish, dish_id: uniqueId});
      } else {
        map.set(dish.dish_id, dish);
      }
    });
    return map;
  }, [dishes]);

  // Convert map back to array
  const uniqueDishes = useMemo(() => Array.from(dishMap.values()), [dishMap]);

  // Handle load more button click
  const handleLoadMore = () => {
    console.log('Load more button clicked');
    onLoadMore();
  };

  // If no dishes found
  if (uniqueDishes.length === 0 && !isLoading) {
    return (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-6xl mb-4"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          🍽️
        </motion.div>
        <h3 className="text-xl font-medium mb-2">No recipes found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters to find what you&apos;re looking for
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {uniqueDishes.map((dish, index) => (
            <RecipeCard 
              key={dish.dish_id} 
              dish={dish} 
              isFavorite={isFavorite(dish.dish_id)}
              onToggleFavorite={() => onToggleFavorite(dish.dish_id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Loader for infinite scrolling */}
      <div ref={loaderRef} className="flex justify-center py-8" id="recipe-loader">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        )}
        
        {!isLoading && hasMore && (
          <Button 
            onClick={handleLoadMore} 
            variant="outline"
            className="rounded-full px-6"
          >
            Load more recipes
          </Button>
        )}
        
        {!hasMore && uniqueDishes.length > 0 && (
          <motion.p 
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            You&apos;ve reached the end of the collection
          </motion.p>
        )}
      </div>
    </div>
  )
} 