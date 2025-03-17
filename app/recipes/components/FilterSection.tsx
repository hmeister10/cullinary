"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { FilterButton } from "./FilterButton"
import { motion } from "framer-motion"
import type { MealCategory } from "@/lib/types/dish-types"
import { useEffect, useRef, useState } from "react"

type FilterCategory = "All" | MealCategory | "Vegetarian" | "Non-Veg" | "Indian" | "Spicy" | "Quick"

interface FilterSectionProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeFilter: FilterCategory
  setActiveFilter: (filter: FilterCategory) => void
  onSearch?: () => void
}

export function FilterSection({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  onSearch
}: FilterSectionProps) {
  // Use a ref to track if this is the initial render
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Update local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  // Trigger search when filter changes, but not on initial render
  useEffect(() => {
    // Skip the effect on the initial render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only trigger search if onSearch is provided
    if (onSearch) {
      // Use a timeout to prevent immediate execution
      const timer = setTimeout(() => {
        onSearch();
      }, 100); // Add a small delay
      
      return () => clearTimeout(timer);
    }
  }, [activeFilter, onSearch]);

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for the search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      if (onSearch && value !== searchQuery) {
        onSearch();
      }
    }, 500); // 500ms debounce
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Update the search query immediately
    if (localSearchQuery !== searchQuery) {
      setSearchQuery(localSearchQuery);
    }
    
    if (onSearch) {
      onSearch();
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterCategory) => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Search bar with animation */}
      <motion.form 
        className="max-w-3xl mx-auto relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSearchSubmit}
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          type="search" 
          placeholder="Search recipes, ingredients, cuisines..." 
          className="w-full pl-12 py-6 text-lg rounded-full border-2 focus-visible:ring-offset-0"
          value={localSearchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {localSearchQuery && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full p-0"
            onClick={() => {
              setLocalSearchQuery("");
              setSearchQuery("");
              if (onSearch) onSearch();
            }}
            type="button"
          >
            ✕
          </Button>
        )}
      </motion.form>

      {/* Filter buttons with staggered animation */}
      <motion.div 
        className="flex flex-wrap justify-center gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <FilterButton 
            icon="✨" 
            label="All Recipes" 
            isActive={activeFilter === "All"}
            onClick={() => handleFilterChange("All")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🍳" 
            label="Breakfast" 
            isActive={activeFilter === "Breakfast"}
            onClick={() => handleFilterChange("Breakfast")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🥗" 
            label="Lunch" 
            isActive={activeFilter === "Lunch"}
            onClick={() => handleFilterChange("Lunch")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🍲" 
            label="Dinner" 
            isActive={activeFilter === "Dinner"}
            onClick={() => handleFilterChange("Dinner")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🥪" 
            label="Snacks" 
            isActive={activeFilter === "Snack"}
            onClick={() => handleFilterChange("Snack")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🥦" 
            label="Vegetarian" 
            isActive={activeFilter === "Vegetarian"}
            onClick={() => handleFilterChange("Vegetarian")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🍗" 
            label="Non-Veg" 
            isActive={activeFilter === "Non-Veg"}
            onClick={() => handleFilterChange("Non-Veg")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🇮🇳" 
            label="Indian" 
            isActive={activeFilter === "Indian"}
            onClick={() => handleFilterChange("Indian")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="🌶️" 
            label="Spicy" 
            isActive={activeFilter === "Spicy"}
            onClick={() => handleFilterChange("Spicy")}
          />
        </motion.div>
        <motion.div variants={item}>
          <FilterButton 
            icon="⏱️" 
            label="Quick Meals" 
            isActive={activeFilter === "Quick"}
            onClick={() => handleFilterChange("Quick")}
          />
        </motion.div>
      </motion.div>
    </div>
  )
} 