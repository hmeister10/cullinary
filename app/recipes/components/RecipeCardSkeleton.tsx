"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface RecipeCardSkeletonProps {
  index: number
}

export function RecipeCardSkeleton({ index }: RecipeCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05, // Stagger effect
        ease: [0.25, 0.1, 0.25, 1.0] 
      }}
      layout
    >
      <Card className="overflow-hidden h-full">
        {/* Image placeholder */}
        <div className="aspect-video relative">
          <Skeleton className="absolute inset-0" />
        </div>
        
        <CardHeader className="p-4 pb-2">
          {/* Title placeholder */}
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          {/* Tags placeholder */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          
          {/* Description placeholder */}
          <div className="mt-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between mt-auto">
          {/* Button placeholders */}
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </CardFooter>
      </Card>
    </motion.div>
  )
} 