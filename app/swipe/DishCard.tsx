"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Dish } from "@/lib/mock-data"
import { memo } from "react"

interface DishCardProps {
  dish: Dish;
}

// Use memo to prevent unnecessary re-renders
const DishCard = memo(({ dish }: DishCardProps) => {
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
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-bold">{dish.name}</h3>
        <p className="text-sm text-muted-foreground">{dish.category}</p>
      </CardContent>
    </Card>
  );
});

// Add display name for debugging
DishCard.displayName = "DishCard";

export default DishCard 