import { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types"
import { ApiDishDataSource } from "./api-dish-data-source"

/**
 * Interface for any data source that provides dish data
 */
interface DishDataSource {
  getAllDishes(): Promise<Dish[]>
  getDishById(id: string): Promise<Dish | undefined>
  getDishByCategory(category: MealCategory): Promise<Dish[]>
  getDishByPreference(preference: DietPreference): Promise<Dish[]>
  getDishByCuisine(cuisine: CuisineType): Promise<Dish[]>
  searchDishes(query: string): Promise<Dish[]>
  getDishesByCategory(category: MealCategory): Promise<Dish[]>
  getDishesByDietaryPreference(preference: DietPreference): Promise<Dish[]>
  getDishesByCuisine(cuisine: CuisineType): Promise<Dish[]>
  getDishesBySpiceLevel(level: number): Promise<Dish[]>
  getDishesByIngredient(ingredient: string): Promise<Dish[]>
  getDishesByCuisineType(cuisine: CuisineType): Promise<Dish[]>
}

/**
 * DishService provides methods to interact with dish data
 * This service abstracts the data source, allowing for easy replacement
 * with a database, API, or other data sources in the future
 */
export class DishService {
  private static instance: DishService
  private dataSource: DishDataSource

  private constructor() {
    // Create an adapter for the API data source that implements all required methods
    const apiDataSource = new ApiDishDataSource();
    
    // Create a complete implementation of DishDataSource using the apiDataSource
    this.dataSource = {
      // Pass through the methods that already exist in ApiDishDataSource
      getAllDishes: () => apiDataSource.getAllDishes(),
      getDishById: (id: string) => apiDataSource.getDishById(id),
      getDishByCategory: (category: MealCategory) => apiDataSource.getDishByCategory(category),
      getDishByPreference: (preference: DietPreference) => apiDataSource.getDishByPreference(preference),
      getDishByCuisine: (cuisine: CuisineType) => apiDataSource.getDishByCuisine(cuisine),
      searchDishes: (query: string) => apiDataSource.searchDishes(query),
      
      // Add the methods that don't exist in ApiDishDataSource
      getDishesByCategory: (category: MealCategory) => apiDataSource.getDishByCategory(category),
      getDishesByDietaryPreference: (preference: DietPreference) => apiDataSource.getDishByPreference(preference),
      getDishesByCuisine: (cuisine: CuisineType) => apiDataSource.getDishByCuisine(cuisine),
      getDishesBySpiceLevel: async (level: number) => {
        const dishes = await apiDataSource.getAllDishes();
        if (level === 0) return dishes;
        return dishes.filter(dish => dish.spice_level === String(level));
      },
      getDishesByIngredient: async (ingredient: string) => {
        const dishes = await apiDataSource.getAllDishes();
        return dishes.filter(dish => dish.ingredients.includes(ingredient));
      },
      getDishesByCuisineType: (cuisine: CuisineType) => apiDataSource.getDishByCuisine(cuisine)
    };
  }

  /**
   * Get the singleton instance of DishService
   */
  public static getInstance(): DishService {
    if (!DishService.instance) {
      DishService.instance = new DishService()
    }
    return DishService.instance
  }

  /**
   * Set a different data source implementation
   */
  public setDataSource(dataSource: DishDataSource): void {
    this.dataSource = dataSource
  }

  /**
   * Get all dishes
   */
  public async getAllDishes(): Promise<Dish[]> {
    return this.dataSource.getAllDishes()
  }

  /**
   * Get a dish by its ID
   */
  public async getDishById(id: string): Promise<Dish | undefined> {
    return this.dataSource.getDishById(id)
  }

  /**
   * Get dishes by category
   */
  public async getDishByCategory(category: MealCategory): Promise<Dish[]> {
    return this.dataSource.getDishByCategory(category)
  }

  /**
   * Get dishes by preference (Veg/Non-Veg)
   */
  public async getDishByPreference(preference: DietPreference): Promise<Dish[]> {
    return this.dataSource.getDishByPreference(preference)
  }

  /**
   * Get dishes by cuisine type
   */
  public async getDishByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    return this.dataSource.getDishByCuisine(cuisine)
  }

  /**
   * Search dishes by query string
   * Searches in name, ingredients, cuisines, and description
   */
  public async searchDishes(query: string): Promise<Dish[]> {
    return this.dataSource.searchDishes(query)
  }

  /**
   * Get dishes by category
   */
  public async getDishesByCategory(category: MealCategory | "All"): Promise<Dish[]> {
    if (category === "All") {
      return this.dataSource.getAllDishes()
    }
    return this.dataSource.getDishesByCategory(category)
  }

  /**
   * Get dishes by preference (vegetarian or non-vegetarian)
   */
  public async getDishesByPreference(preference: DietPreference | "All"): Promise<Dish[]> {
    if (preference === "All") {
      return this.dataSource.getAllDishes()
    }
    return this.dataSource.getDishesByDietaryPreference(preference)
  }

  /**
   * Get dishes by cuisine
   */
  public async getDishesByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    return this.dataSource.getDishesByCuisine(cuisine)
  }

  /**
   * Get healthy dishes
   */
  public async getHealthyDishes(): Promise<Dish[]> {
    const dishes = await this.dataSource.getAllDishes()
    return dishes.filter(dish => dish.is_healthy)
  }

  /**
   * Get dishes by spice level
   */
  public async getDishesBySpiceLevel(level: "Mild" | "Medium" | "Spicy" | "All" | number): Promise<Dish[]> {
    if (level === "All") return this.dataSource.getAllDishes();
    
    if (typeof level === "number") {
      return this.dataSource.getDishesBySpiceLevel(level);
    }
    
    const dishes = await this.dataSource.getAllDishes();
    return dishes.filter(dish => dish.spice_level === level);
  }

  /**
   * Get quick dishes (preparation time <= 15 minutes)
   */
  public async getQuickDishes(): Promise<Dish[]> {
    const dishes = await this.dataSource.getAllDishes()
    return dishes.filter(dish => dish.preparation_time !== undefined && dish.preparation_time <= 15)
  }

  async getDishesByIngredient(ingredient: string): Promise<Dish[]> {
    return this.dataSource.getDishesByIngredient(ingredient)
  }

  async getDishesByCuisineType(cuisine: CuisineType): Promise<Dish[]> {
    return this.dataSource.getDishesByCuisineType(cuisine)
  }
}

/**
 * Example of how to implement a different data source:
 * 
 * export class ApiDishDataSource implements DishDataSource {
 *   private apiUrl: string
 *   
 *   constructor(apiUrl: string) {
 *     this.apiUrl = apiUrl
 *   }
 *   
 *   async getAllDishes(): Promise<Dish[]> {
 *     const response = await fetch(`${this.apiUrl}/dishes`)
 *     const data = await response.json()
 *     return data
 *   }
 * }
 * 
 * export class CsvDishDataSource implements DishDataSource {
 *   private filePath: string
 *   
 *   constructor(filePath: string) {
 *     this.filePath = filePath
 *   }
 *   
 *   async getAllDishes(): Promise<Dish[]> {
 *     // Implementation to read and parse CSV file
 *     // ...
 *     return parsedDishes
 *   }
 * }
 */ 