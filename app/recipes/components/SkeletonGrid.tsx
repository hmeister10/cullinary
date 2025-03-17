"use client"

import { RecipeCardSkeleton } from "./RecipeCardSkeleton"

interface SkeletonGridProps {
  count?: number
}

export function SkeletonGrid({ count = 12 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <RecipeCardSkeleton key={index} index={index} />
      ))}
    </div>
  )
} 