import { Dish } from "@/lib/types/dish-types";

// Key for storing favorites in localStorage
const FAVORITES_STORAGE_KEY = 'cullinary_favorites';

/**
 * FavoritesManager - A utility class to manage dish favorites
 * This class provides methods to add, remove, and check favorites
 * It persists favorites in localStorage and provides event listeners
 * for changes to favorites
 */
export class FavoritesManager {
  private static instance: FavoritesManager;
  private favorites: Set<string> = new Set();
  private listeners: Set<(favorites: Set<string>) => void> = new Set();

  private constructor() {
    // Load favorites from localStorage on initialization
    this.loadFavorites();

    // If we're in a browser environment, set up event listeners
    if (typeof window !== 'undefined') {
      // Listen for storage events (in case favorites are updated in another tab)
      window.addEventListener('storage', (event) => {
        if (event.key === FAVORITES_STORAGE_KEY) {
          this.loadFavorites();
          this.notifyListeners();
        }
      });
    }
  }

  /**
   * Get the singleton instance of FavoritesManager
   */
  public static getInstance(): FavoritesManager {
    if (!FavoritesManager.instance) {
      FavoritesManager.instance = new FavoritesManager();
    }
    return FavoritesManager.instance;
  }

  /**
   * Load favorites from localStorage
   */
  private loadFavorites(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites) as string[];
        this.favorites = new Set(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }

  /**
   * Save favorites to localStorage
   */
  private saveFavorites(): void {
    if (typeof window === 'undefined') return;

    try {
      const favoriteIds = Array.from(this.favorites);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }

  /**
   * Add a dish to favorites
   */
  public addFavorite(dishId: string): void {
    this.favorites.add(dishId);
    this.saveFavorites();
    this.notifyListeners();
  }

  /**
   * Remove a dish from favorites
   */
  public removeFavorite(dishId: string): void {
    this.favorites.delete(dishId);
    this.saveFavorites();
    this.notifyListeners();
  }

  /**
   * Toggle a dish's favorite status
   */
  public toggleFavorite(dishId: string): void {
    if (this.isFavorite(dishId)) {
      this.removeFavorite(dishId);
    } else {
      this.addFavorite(dishId);
    }
  }

  /**
   * Check if a dish is a favorite
   */
  public isFavorite(dishId: string): boolean {
    return this.favorites.has(dishId);
  }

  /**
   * Get all favorite dish IDs
   */
  public getFavorites(): string[] {
    return Array.from(this.favorites);
  }

  /**
   * Get all favorite dishes from a list of dishes
   */
  public getFavoriteDishes(dishes: Dish[]): Dish[] {
    return dishes.filter(dish => this.isFavorite(dish.dish_id));
  }

  /**
   * Add a listener for changes to favorites
   */
  public addListener(listener: (favorites: Set<string>) => void): () => void {
    this.listeners.add(listener);
    
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes to favorites
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.favorites);
    });
  }

  /**
   * Clear all favorites
   */
  public clearFavorites(): void {
    this.favorites.clear();
    this.saveFavorites();
    this.notifyListeners();
  }
} 