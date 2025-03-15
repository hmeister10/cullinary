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
  
  // Reset when filters change
  useEffect(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [category, preference, cuisine, query, initialPage]);

  // Load initial data
  useEffect(() => {
    loadItems(initialPage);
  }, [category, preference, cuisine, query]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
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
  }, [hasMore, loading]);

  // Load items for a specific page
  const loadItems = useCallback(async (pageToLoad: number) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare filter options
      const options: any = {
        page: pageToLoad,
        limit: itemsPerPage
      };
      
      if (category && category !== 'All') options.category = category;
      if (preference && preference !== 'All') options.preference = preference;
      if (cuisine) options.cuisine = cuisine;
      if (query) options.query = query;
      
      // Fetch data
      const response = await apiDataSource.getDishes(options);
      
      // Update state
      if (pageToLoad === 1) {
        setItems(response.dishes);
      } else {
        setItems(prev => [...prev, ...response.dishes]);
      }
      
      setTotalItems(response.pagination.total);
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dishes');
      console.error('Error loading dishes:', err);
    } finally {
      setLoading(false);
    }
  }, [apiDataSource, category, preference, cuisine, query, itemsPerPage, loading]);

  // Load more items when scrolling
  const loadMoreItems = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadItems(nextPage);
    }
  }, [loading, hasMore, page, loadItems]);

  // Handle manual load more button click
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadMoreItems();
    }
  }, [loading, hasMore, loadMoreItems]);

  // Refresh data
  const refresh = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    loadItems(initialPage);
  }, [initialPage, loadItems]);

  return {
    items,
    loading,
    error,
    hasMore,
    loaderRef,
    handleLoadMore,
    refresh,
    totalItems
  };
} 