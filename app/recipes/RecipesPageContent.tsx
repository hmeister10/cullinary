"use client"

import { useState, useCallback } from "react"
import type { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { FilterSection } from "./components/FilterSection"
import { RecipeGrid } from "./components/RecipeGrid"
import { ScrollToTopButton } from "./components/ScrollToTopButton"
import { Button } from "@/components/ui/button"
import { useApiInfiniteScroll } from "./hooks/useApiInfiniteScroll"
import { useFavorites } from "@/lib/hooks/use-favorites"
import { SkeletonGrid } from "./components/SkeletonGrid"

type FilterCategory = "All" | MealCategory | "Vegetarian" | "Non-Veg" | "Indian" | "Spicy" | "Quick"

export default function RecipesPageContent() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All")
  const [isResetting, setIsResetting] = useState(false)
  const { toggleFavorite, isFavorite } = useFavorites()

  // Convert filter category to API parameters
  const getApiParams = useCallback(() => {
    let category: MealCategory | "All" = "All";
    let preference: DietPreference | "All" = "All";
    let cuisine: CuisineType | undefined = undefined;
    let query = searchQuery;

    // Map filter categories to API parameters
    if (["Breakfast", "Lunch", "Dinner", "Snack"].includes(activeFilter)) {
      category = activeFilter as MealCategory;
    } else if (activeFilter === "Vegetarian") {
      preference = "Veg";
    } else if (activeFilter === "Non-Veg") {
      preference = "Non-Veg";
    } else if (activeFilter === "Indian") {
      cuisine = "North Indian"; // This is a simplification, we'll handle multiple Indian cuisines in the API
    } else if (activeFilter === "Spicy" || activeFilter === "Quick") {
      // These are special filters that will be handled by the API
      query = activeFilter.toLowerCase();
    }

    return { category, preference, cuisine, query };
  }, [activeFilter, searchQuery]);

  // Get API parameters based on current filters
  const { category, preference, cuisine, query } = getApiParams();

  // Use our API-based infinite scroll hook
  const {
    items: dishes,
    loading: isLoading,
    error,
    hasMore,
    loaderRef,
    handleLoadMore,
    refresh,
    totalItems,
    isInitialLoad
  } = useApiInfiniteScroll({
    category,
    preference,
    cuisine,
    query,
    itemsPerPage: 12
  });

  // Handle search action
  const handleSearch = useCallback(() => {
    if (!isLoading) {
      refresh();
    }
  }, [refresh, isLoading]);

  // Reset all filters with animation
  const resetFilters = useCallback(() => {
    setIsResetting(true);
    
    setTimeout(() => {
      setSearchQuery("");
      setActiveFilter("All");
      setIsResetting(false);
      refresh();
    }, 300);
  }, [refresh]);

  // Show error toast if there's an error
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load recipes. Please try again.",
      variant: "destructive"
    });
  }

  return (
    <>
      <div className="space-y-8">
        {/* Filter section */}
        <FilterSection 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onSearch={handleSearch}
        />

        {/* Loading state for initial load */}
        {isLoading && isInitialLoad ? (
          <>
            {/* Results count skeleton */}
            <motion.div 
              className="text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-5 w-32 bg-muted/60 rounded-full mx-auto animate-pulse" />
            </motion.div>
            
            {/* Skeleton grid for loading state */}
            <SkeletonGrid count={12} />
          </>
        ) : (
          <>
            {/* Results count with animation */}
            <motion.div 
              className="text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={`count-${totalItems}`}
              transition={{ duration: 0.3 }}
            >
              {totalItems} {totalItems === 1 ? 'recipe' : 'recipes'} found
              
              {/* Reset filters button */}
              {(searchQuery || activeFilter !== "All") && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-full text-xs px-4"
                    onClick={resetFilters}
                    disabled={isResetting}
                  >
                    Reset filters
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Recipe grid with infinite scrolling */}
            <RecipeGrid 
              dishes={dishes}
              isLoading={isLoading}
              hasMore={hasMore}
              loaderRef={loaderRef}
              onLoadMore={handleLoadMore}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          </>
        )}
      </div>
      
      {/* Scroll to top button */}
      <ScrollToTopButton />
    </>
  )
} 