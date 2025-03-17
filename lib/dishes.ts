import { DishService } from "@/lib/services/dish-service";
import type { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types";

// Re-export types for backward compatibility
export type { Dish, MealCategory, DietPreference, CuisineType };

// Create a singleton instance of the DishService
const dishService = DishService.getInstance();

/**
 * Get all dishes
 * This maintains backward compatibility with existing code
 */
export async function getAllDishes(): Promise<Dish[]> {
  return dishService.getAllDishes();
}

/**
 * Get a dish by ID
 */
export async function getDishById(id: string): Promise<Dish | undefined> {
  return dishService.getDishById(id);
}

/**
 * Get dishes by category
 */
export async function getDishByCategory(category: MealCategory): Promise<Dish[]> {
  return dishService.getDishByCategory(category);
}

/**
 * Get dishes by preference (Veg/Non-Veg)
 */
export async function getDishByPreference(preference: DietPreference): Promise<Dish[]> {
  return dishService.getDishByPreference(preference);
}

/**
 * Get dishes by cuisine type
 */
export async function getDishByCuisine(cuisine: CuisineType): Promise<Dish[]> {
  return dishService.getDishByCuisine(cuisine);
}

/**
 * Search dishes by query string
 */
export async function searchDishes(query: string): Promise<Dish[]> {
  return dishService.searchDishes(query);
}

// For backward compatibility, we'll initialize dishes with an empty array
// and then update it when the data is loaded
export let dishes: Dish[] = [];

// Immediately load the dishes
getAllDishes().then(loadedDishes => {
  dishes = loadedDishes;
}); 