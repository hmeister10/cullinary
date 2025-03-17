import { Dish, MealCategory, DietPreference, CuisineType } from "@/lib/types/dish-types";

// Pagination response interface
interface PaginatedResponse<T> {
  dishes: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Implementation of DishDataSource using the API
 * This is safe to use in both client and server components
 */
export class ApiDishDataSource {
  private baseUrl: string;
  private dishesCache: Map<string, Dish[]> = new Map();
  private singleDishCache: Map<string, Dish> = new Map();
  private paginationCache: Map<string, any> = new Map();

  constructor(baseUrl?: string) {
    // Default to relative URL if not provided
    this.baseUrl = baseUrl || '/api/dishes';
  }

  /**
   * Get all dishes - this is now just a convenience method that calls getDishes
   * It does NOT load all dishes at once, but returns the first page
   */
  async getAllDishes(): Promise<Dish[]> {
    const response = await this.getDishes();
    return response.dishes;
  }

  /**
   * Get dishes with pagination
   */
  async getDishes(options: {
    page?: number;
    limit?: number;
    category?: MealCategory;
    preference?: DietPreference;
    cuisine?: CuisineType;
    query?: string;
  } = {}): Promise<PaginatedResponse<Dish>> {
    const { page = 1, limit = 20, category, preference, cuisine, query } = options;
    
    // Create a cache key based on the request parameters
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (category) params.set('category', category);
    if (preference) params.set('preference', preference);
    if (cuisine) params.set('cuisine', cuisine);
    if (query) params.set('query', query);
    
    const cacheKey = `paginated:${params.toString()}`;
    
    // Check if we have this request cached
    const cachedDishes = this.dishesCache.get(cacheKey);
    const cachedPagination = this.paginationCache.get(cacheKey);
    
    if (cachedDishes && cachedPagination) {
      return {
        dishes: cachedDishes,
        pagination: cachedPagination
      };
    }
    
    try {
      console.log(`Fetching dishes with params: ${params.toString()}`);
      const url = new URL(this.baseUrl, typeof window !== 'undefined' ? window.location.origin : undefined);
      
      // Add all parameters to the URL
      for (const [key, value] of params.entries()) {
        url.searchParams.set(key, value);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try to get more error details
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch (e) {
          try {
            errorDetails = await response.text();
          } catch (e2) {
            errorDetails = 'Could not extract error details';
          }
        }
        
        throw new Error(`Failed to fetch dishes: ${response.statusText}. Details: ${errorDetails}`);
      }
      
      const data = await response.json() as PaginatedResponse<Dish>;
      console.log(`Fetched ${data.dishes.length} dishes (page ${page}/${data.pagination.totalPages})`);
      
      // Cache the result
      this.dishesCache.set(cacheKey, data.dishes);
      this.paginationCache.set(cacheKey, data.pagination);
      
      return data;
    } catch (error) {
      console.error('Error fetching dishes with pagination:', error);
      return {
        dishes: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasMore: false
        }
      };
    }
  }

  /**
   * Get a dish by ID
   */
  async getDishById(id: string): Promise<Dish | undefined> {
    // Check cache first
    if (this.singleDishCache.has(id)) {
      return this.singleDishCache.get(id);
    }
    
    try {
      const url = new URL(this.baseUrl, typeof window !== 'undefined' ? window.location.origin : undefined);
      url.searchParams.set('id', id);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dish: ${response.statusText}`);
      }
      
      const dish = await response.json();
      
      if (!dish) {
        return undefined;
      }
      
      // Cache the result
      this.singleDishCache.set(id, dish);
      
      return dish;
    } catch (error) {
      console.error(`Error fetching dish with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get dishes by category
   */
  async getDishByCategory(category: MealCategory): Promise<Dish[]> {
    const response = await this.getDishes({ category });
    return response.dishes;
  }

  /**
   * Get dishes by preference
   */
  async getDishByPreference(preference: DietPreference): Promise<Dish[]> {
    const response = await this.getDishes({ preference });
    return response.dishes;
  }

  /**
   * Get dishes by cuisine
   */
  async getDishByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    const response = await this.getDishes({ cuisine });
    return response.dishes;
  }

  /**
   * Search dishes by query
   */
  async searchDishes(query: string): Promise<Dish[]> {
    if (!query) {
      return this.getAllDishes();
    }
    
    const response = await this.getDishes({ query });
    return response.dishes;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.dishesCache.clear();
    this.singleDishCache.clear();
    this.paginationCache.clear();
  }
} 