import { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types"
import { dishes } from "@/lib/data/mock-dishes"
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
}

/**
 * Mock implementation of DishDataSource using hardcoded data
 */
class MockDishDataSource implements DishDataSource {
  async getAllDishes(): Promise<Dish[]> {
    return dishes
  }

  async getDishById(id: string): Promise<Dish | undefined> {
    return dishes.find(dish => dish.dish_id === id)
  }

  async getDishByCategory(category: MealCategory): Promise<Dish[]> {
    return dishes.filter(dish => dish.category === category)
  }

  async getDishByPreference(preference: DietPreference): Promise<Dish[]> {
    return dishes.filter(dish => dish.preference === preference)
  }

  async getDishByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    return dishes.filter(dish => dish.cuisines.includes(cuisine))
  }

  async searchDishes(query: string): Promise<Dish[]> {
    const lowercaseQuery = query.toLowerCase()
    
    return dishes.filter(dish => {
      // Search in name
      if (dish.name.toLowerCase().includes(lowercaseQuery)) {
        return true
      }
      
      // Search in ingredients
      if (dish.ingredients.some(ing => ing.toLowerCase().includes(lowercaseQuery))) {
        return true
      }
      
      // Search in cuisines
      if (dish.cuisines.some(cuisine => cuisine.toLowerCase().includes(lowercaseQuery))) {
        return true
      }
      
      // Search in description
      if (dish.description?.toLowerCase().includes(lowercaseQuery)) {
        return true
      }
      
      return false
    })
  }
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
    // Initialize with API data source
    // This works in both client and server components
    this.dataSource = new ApiDishDataSource()
    
    // Uncomment to use mock data instead
    // this.dataSource = new MockDishDataSource()
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
    return this.dataSource.getDishByCategory(category)
  }

  /**
   * Get dishes by preference (vegetarian or non-vegetarian)
   */
  public async getDishesByPreference(preference: DietPreference | "All"): Promise<Dish[]> {
    if (preference === "All") {
      return this.dataSource.getAllDishes()
    }
    return this.dataSource.getDishByPreference(preference)
  }

  /**
   * Get dishes by cuisine
   */
  public async getDishesByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    return this.dataSource.getDishByCuisine(cuisine)
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
  public async getDishesBySpiceLevel(level: "Mild" | "Medium" | "Spicy" | "All"): Promise<Dish[]> {
    const dishes = await this.dataSource.getAllDishes()
    if (level === "All") return dishes
    return dishes.filter(dish => dish.spice_level === level)
  }

  /**
   * Get quick dishes (preparation time <= 15 minutes)
   */
  public async getQuickDishes(): Promise<Dish[]> {
    const dishes = await this.dataSource.getAllDishes()
    return dishes.filter(dish => dish.preparation_time !== undefined && dish.preparation_time <= 15)
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