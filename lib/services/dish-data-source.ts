import { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types";

/**
 * Interface for any data source that provides dish data
 */
export interface DishDataSource {
  getAllDishes(): Promise<Dish[]>;
  getDishById(id: string): Promise<Dish | undefined>;
  getDishByCategory(category: MealCategory): Promise<Dish[]>;
  getDishByPreference(preference: DietPreference): Promise<Dish[]>;
  getDishByCuisine(cuisine: CuisineType): Promise<Dish[]>;
  searchDishes(query: string): Promise<Dish[]>;
} 