'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dish, MealCategory, DietPreference, CuisineType } from '@/lib/types/dish-types';
import { ApiDishDataSource } from '@/lib/services/api-dish-data-source';

interface UseApiInfiniteScrollOptions {
  initialPage?: number;
  itemsPerPage?: number;
  category?: MealCategory | 'All';
  preference?: DietPreference | 'All';
  cuisine?: CuisineType;
  query?: string;
}

interface FilterOptions {
  page: number;
  limit: number;
  category?: MealCategory;
  preference?: DietPreference;
  cuisine?: CuisineType;
  query?: string;
}


export function useApiInfiniteScroll({
  initialPage = 1,
  itemsPerPage = 20,
  category,
  preference,
  cuisine,
  query
}: UseApiInfiniteScrollOptions = {}) {
  const [items, setItems] = useState<Dish[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const apiDataSource = useRef(new ApiDishDataSource()).current;
  const isInitialLoadRef = useRef(true);
  const loadingRef = useRef(false); // Use a ref to track loading state to avoid dependency issues
  
  // Reset when filters change
  useEffect(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    isInitialLoadRef.current = true;
  }, [category, preference, cuisine, query, initialPage]);

  // Load initial data
  useEffect(() => {
    // Only load if we're in the initial state to prevent unnecessary API calls
    if (isInitialLoadRef.current) {
      loadItems(initialPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, preference, cuisine, query]);

  // Load items for a specific page
  const loadItems = useCallback(async (pageToLoad: number) => {
    // Use loadingRef to check and set loading state to avoid dependency issues
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching dishes with params: page=${pageToLoad}&limit=${itemsPerPage}`);
      
      // Prepare filter options
      const options: FilterOptions = {
        page: pageToLoad,
        limit: itemsPerPage
      };
      
      if (category && category !== 'All') options.category = category;
      if (preference && preference !== 'All') options.preference = preference;
      if (cuisine) options.cuisine = cuisine;
      if (query) options.query = query;
      
      // Fetch data
      const response = await apiDataSource.getDishes(options);
      
      // Update state - ensure we don't have duplicate dishes by using dish_id as key
      if (pageToLoad === 1) {
        setItems(response.dishes);
      } else {
        setItems(prevItems => {
          // Create a map of existing dish IDs to avoid duplicates
          const existingDishIds = new Set(prevItems.map(dish => dish.dish_id));
          
          // Only add dishes that don't already exist in the list
          const newDishes = response.dishes.filter(dish => !existingDishIds.has(dish.dish_id));
          
          return [...prevItems, ...newDishes];
        });
      }
      
      setTotalItems(response.pagination.total);
      setHasMore(response.pagination.hasMore);
      isInitialLoadRef.current = false;
      
      console.log(`Fetched ${response.dishes.length} dishes (page ${pageToLoad}/${response.pagination.total})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dishes');
      console.error('Error loading dishes:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [apiDataSource, category, preference, cuisine, query, itemsPerPage]); // Remove loading from dependency array

  // Load more items when scrolling
  const loadMoreItems = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      console.log('Loading more items, current page:', page);
      const nextPage = page + 1;
      setPage(nextPage);
      loadItems(nextPage);
    }
  }, [hasMore, page, loadItems]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          console.log('Intersection observer triggered, loading more items');
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Add rootMargin to load earlier
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loadMoreItems]); // Add loadMoreItems to dependency array

  // Handle manual load more button click
  const handleLoadMore = useCallback(() => {
    console.log('Manual load more clicked');
    if (!loadingRef.current && hasMore) {
      loadMoreItems();
    }
  }, [hasMore, loadMoreItems]);

  // Refresh data
  const refresh = useCallback(() => {
    // Only refresh if not already loading
    if (!loadingRef.current) {
      console.log('[Fast Refresh] rebuilding');
      setItems([]);
      setPage(initialPage);
      setHasMore(true);
      isInitialLoadRef.current = true;
      loadItems(initialPage);
    }
  }, [initialPage, loadItems]);

  return {
    items,
    loading,
    error,
    hasMore,
    loaderRef,
    handleLoadMore,
    refresh,
    totalItems,
    isInitialLoad: isInitialLoadRef.current
  };
} 