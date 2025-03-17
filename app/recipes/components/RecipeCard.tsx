"use client"

import type { Dish } from "@/lib/types/dish-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Heart, Clock, Flame } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface RecipeCardProps {
  dish: Dish
  isFavorite: boolean
  onToggleFavorite: () => void
  index: number
}

export function RecipeCard({ 
  dish, 
  isFavorite: initialIsFavorite, 
  onToggleFavorite,
  index
}: RecipeCardProps) {
  // Use local state to prevent flickering during re-renders
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  // Update local state when prop changes
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  // Handle favorite toggle with optimistic UI update
  const handleToggleFavorite = () => {
    // Update local state immediately for a responsive feel
    setIsFavorite(!isFavorite);
    
    // Call the parent handler
    onToggleFavorite();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05, // Stagger effect
        ease: [0.25, 0.1, 0.25, 1.0] 
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      layout // Add layout animation to smoothly handle position changes
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-video relative">
          <Image 
            src={dish.image_url || "/assets/food-placeholder.svg"} 
            alt={dish.name}
            fill
            className="object-cover"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center ${
              isFavorite ? "text-red-500" : "text-muted-foreground"
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleToggleFavorite()
            }}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </motion.button>
          {dish.is_healthy && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Healthy
            </span>
          )}
        </div>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg">{dish.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-muted px-2 py-1 rounded-full">{dish.category}</span>
            <span className="text-xs bg-muted px-2 py-1 rounded-full">{dish.preference}</span>
            {dish.preparation_time && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dish.preparation_time} min
              </span>
            )}
            {dish.spice_level && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                dish.spice_level === "Spicy" 
                  ? "bg-red-100 text-red-700" 
                  : dish.spice_level === "Medium" 
                    ? "bg-orange-100 text-orange-700" 
                    : "bg-green-100 text-green-700"
              }`}>
                <Flame className="h-3 w-3" />
                {dish.spice_level}
              </span>
            )}
          </div>
          {dish.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
              {dish.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between mt-auto">
          <Button variant="outline" size="sm">View Recipe</Button>
          <Button variant="ghost" size="sm">Add to Menu</Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 