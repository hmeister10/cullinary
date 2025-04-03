"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Dish } from "@/lib/types/dish-types"
import { memo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame } from "lucide-react"
import { motion } from "framer-motion"

interface DishCardProps {
  dish: Dish;
}

// Staggered animation variants for card elements
const cardVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Use memo to prevent unnecessary re-renders
const DishCard = memo(({ dish }: DishCardProps) => {
  // Debug logging
  useEffect(() => {
    console.log("DishCard rendering with dish:", dish.name);
    console.log("Image URL:", dish.image_url);
  }, [dish]);
  
  // Ensure we have a valid image URL
  const imageUrl = dish.image_url && dish.image_url.trim() !== "" 
    ? dish.image_url 
    : "/assets/food-placeholder.svg";
  
  return (
    <Card className="w-full h-full overflow-hidden rounded-xl shadow-lg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full flex flex-col"
      >
        {/* Image section with fixed height */}
        <div className="relative w-full h-[200px] md:h-[250px]">
          {/* Use regular img tag with object-cover for more reliable rendering */}
          <img
            src={imageUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
          
          <motion.div 
            className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium"
            variants={itemVariants}
            transition={{ duration: 0.3 }}
          >
            {dish.preference}
          </motion.div>
          
          {dish.is_healthy && (
            <motion.div 
              className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
              variants={itemVariants}
              transition={{ duration: 0.3 }}
            >
              Healthy
            </motion.div>
          )}
          
          <motion.div 
            className="absolute bottom-3 left-3 right-3"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white drop-shadow-md">{dish.name}</h3>
          </motion.div>
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <motion.div 
              className="flex flex-wrap gap-1 mb-3"
              variants={itemVariants}
            >
              {dish.cuisines && dish.cuisines.slice(0, 2).map((cuisine, index) => (
                <Badge key={index} variant="outline" className="text-xs font-medium">
                  {cuisine}
                </Badge>
              ))}
              {dish.spice_level && (
                <Badge variant={dish.spice_level === "Spicy" ? "destructive" : "outline"} className="text-xs font-medium">
                  {dish.spice_level === "Spicy" ? (
                    <><Flame className="h-3 w-3 mr-1" /> {dish.spice_level}</>
                  ) : (
                    dish.spice_level
                  )}
                </Badge>
              )}
              {dish.preparation_time && (
                <Badge variant="outline" className="text-xs font-medium">
                  <Clock className="h-3 w-3 mr-1" /> {dish.preparation_time} min
                </Badge>
              )}
            </motion.div>
            
            {dish.description && (
              <motion.p 
                className="text-sm text-muted-foreground line-clamp-3 mb-3"
                variants={itemVariants}
              >
                {dish.description}
              </motion.p>
            )}
          </div>
        </CardContent>
      </motion.div>
    </Card>
  );
});

// Add display name for debugging
DishCard.displayName = "DishCard";

export default DishCard 