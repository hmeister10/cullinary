"use client"

import type { Dish } from "@/lib/types/dish-types"
import { RecipeCard } from "./RecipeCard"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { RefObject } from "react"

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
  // If no dishes found
  if (dishes.length === 0 && !isLoading) {
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
          Try adjusting your search or filters to find what you're looking for
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {dishes.map((dish, index) => (
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
      <div ref={loaderRef} className="flex justify-center py-8">
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
            onClick={onLoadMore} 
            variant="outline"
            className="rounded-full px-6"
          >
            Load more recipes
          </Button>
        )}
        
        {!hasMore && dishes.length > 0 && (
          <motion.p 
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            You've reached the end of the collection
          </motion.p>
        )}
      </div>
    </div>
  )
} 