'use client';

import { useState, useEffect } from 'react';
import { Dish } from "@/lib/types/dish-types";
import { FavoritesManager } from '@/lib/utils/favorites-manager';

/**
 * React hook to use favorites
 * This hook provides methods to add, remove, and check favorites
 * It also subscribes to changes in favorites and updates the component state
 */
export function useFavorites() {
  const favoritesManager = FavoritesManager.getInstance();
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoritesManager.getFavorites()));

  useEffect(() => {
    // Subscribe to changes in favorites
    const unsubscribe = favoritesManager.addListener((newFavorites) => {
      setFavorites(new Set(newFavorites));
    });

    // Unsubscribe when the component unmounts
    return unsubscribe;
  }, []);

  return {
    favorites,
    isFavorite: (dishId: string) => favorites.has(dishId),
    toggleFavorite: (dishId: string) => favoritesManager.toggleFavorite(dishId),
    addFavorite: (dishId: string) => favoritesManager.addFavorite(dishId),
    removeFavorite: (dishId: string) => favoritesManager.removeFavorite(dishId),
    getFavorites: () => Array.from(favorites),
    getFavoriteDishes: (dishes: Dish[]) => dishes.filter(dish => favorites.has(dish.dish_id)),
    clearFavorites: () => favoritesManager.clearFavorites(),
    favoritesCount: favorites.size
  };
} 