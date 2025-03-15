"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { Dish } from "@/lib/types/dish-types"
import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame } from "lucide-react"

interface DishCardProps {
  dish: Dish;
  matchScore?: number;
  matchReasons?: string[];
}

// Use memo to prevent unnecessary re-renders
const DishCard = memo(({ dish, matchScore, matchReasons }: DishCardProps) => {
  return (
    <Card className="w-full h-full overflow-hidden">
      <div className="relative h-3/4">
        <Image
          src={dish.image_url || "/assets/food-placeholder.svg"}
          alt={dish.name}
          fill
          className="object-cover"
          unoptimized={true}
        />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
          {dish.preference}
        </div>
        {dish.is_healthy && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            Healthy
          </div>
        )}
        {matchScore !== undefined && (
          <div className="absolute bottom-2 right-2 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
            {matchScore}% match
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold">{dish.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {dish.cuisines && dish.cuisines.slice(0, 2).map((cuisine, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {cuisine}
            </Badge>
          ))}
          {dish.spice_level && (
            <Badge variant={dish.spice_level === "Spicy" ? "destructive" : "outline"} className="text-xs">
              {dish.spice_level === "Spicy" ? (
                <><Flame className="h-3 w-3 mr-1" /> {dish.spice_level}</>
              ) : (
                dish.spice_level
              )}
            </Badge>
          )}
          {dish.preparation_time && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" /> {dish.preparation_time} min
            </Badge>
          )}
        </div>
        {dish.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{dish.description}</p>
        )}
        {matchReasons && matchReasons.length > 0 && (
          <p className="text-xs text-primary font-medium mt-1">
            {matchReasons.slice(0, 2).join(", ")}
            {matchReasons.length > 2 && "..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

// Add display name for debugging
DishCard.displayName = "DishCard";

export default DishCard 