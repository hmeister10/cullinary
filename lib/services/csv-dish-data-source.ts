import { Dish, MealCategory, DietPreference, CuisineType, SpiceLevel } from "@/lib/types/dish-types";
import { readCsvFile } from "@/lib/utils/csv-parser.server";

// Define the structure of the CSV records
interface CsvDishRecord {
  RecipeId: string;
  TranslatedRecipeName: string;
  Cuisine: string;
  Course: string;
  Diet: string;
  PrepTimeInMins: string;
  CookTimeInMins: string;
  TotalTimeInMins: string;
  Servings: string;
  Ingredients: string;
  Instructions: string;
  URL: string;
  CleanedIngredients: string;
  ImageURL?: string;
  RecipeDescription?: string;
}

/**
 * Implementation of DishDataSource using a CSV file
 */
export class CsvDishDataSource {
  private dishes: Dish[] = [];
  private initialized = false;
  private readonly csvFilePath: string;
  private readonly placeholderImage = "/assets/food-placeholder.svg";

  constructor(csvFilePath: string) {
    this.csvFilePath = csvFilePath;
  }

  /**
   * Initialize the data source by loading and parsing the CSV file
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Read the CSV file
      const records = readCsvFile<CsvDishRecord>(this.csvFilePath);
      
      // Transform CSV records to Dish objects
      this.dishes = this.transformCsvRecordsToDishes(records);
      
      this.initialized = true;
      console.log(`Loaded ${this.dishes.length} dishes from CSV file`);
    } catch (error) {
      console.error('Error initializing CSV dish data source:', error);
      throw error;
    }
  }

  /**
   * Transform CSV records to Dish objects
   */
  private transformCsvRecordsToDishes(records: CsvDishRecord[]): Dish[] {
    return records.map((record, index) => {
      // Generate a unique ID
      const dish_id = `csv_${index}_${record.RecipeId || record.TranslatedRecipeName.replace(/\s+/g, '_').toLowerCase()}`;
      
      // Determine meal category based on Course
      const category = this.mapCourseToCategoryType(record.Course);
      
      // Determine diet preference
      const preference = this.mapDietToPreferenceType(record.Diet);
      
      // Extract cuisines
      const cuisines = this.extractCuisines(record.Cuisine);
      
      // Extract ingredients
      const ingredients = this.extractIngredients(record.CleanedIngredients);
      
      // Determine if the dish is healthy (simplified logic)
      const is_healthy = this.isHealthyDish(record);
      
      // Extract preparation time
      const preparation_time = parseInt(record.PrepTimeInMins) || undefined;
      
      // Determine spice level (simplified logic)
      const spice_level = this.determineSpiceLevel(record);
      
      // Extract dietary tags
      const dietary_tags = this.extractDietaryTags(record);
      
      // Create the Dish object
      return {
        dish_id,
        name: record.TranslatedRecipeName,
        category,
        is_healthy,
        preference,
        image_url: record.ImageURL || this.placeholderImage,
        cuisines,
        ingredients,
        dietary_tags,
        spice_level,
        preparation_time,
        description: record.RecipeDescription || `${record.TranslatedRecipeName} - ${record.Cuisine} cuisine.`,
      };
    });
  }

  /**
   * Map Course field to MealCategory type
   */
  private mapCourseToCategoryType(course: string): MealCategory {
    const lowerCourse = course.toLowerCase();
    
    if (lowerCourse.includes('breakfast') || lowerCourse.includes('brunch')) {
      return 'Breakfast';
    } else if (lowerCourse.includes('lunch') || lowerCourse.includes('main course') || lowerCourse.includes('main dish')) {
      return 'Lunch';
    } else if (lowerCourse.includes('dinner') || lowerCourse.includes('main course') || lowerCourse.includes('main dish')) {
      return 'Dinner';
    } else if (lowerCourse.includes('snack') || lowerCourse.includes('appetizer') || lowerCourse.includes('side dish')) {
      return 'Snack';
    }
    
    // Default to Dinner if unknown
    return 'Dinner';
  }

  /**
   * Map Diet field to DietPreference type
   */
  private mapDietToPreferenceType(diet: string): DietPreference {
    const lowerDiet = diet.toLowerCase();
    
    if (lowerDiet.includes('vegetarian') || lowerDiet.includes('vegan')) {
      return 'Veg';
    } else {
      return 'Non-Veg';
    }
  }

  /**
   * Extract cuisines from Cuisine field
   */
  private extractCuisines(cuisine: string): CuisineType[] {
    if (!cuisine) return ['Other'];
    
    const cuisineMap: Record<string, CuisineType> = {
      'north indian': 'North Indian',
      'south indian': 'South Indian',
      'bengali': 'Bengali',
      'gujarati': 'Gujarati',
      'punjabi': 'Punjabi',
      'maharashtrian': 'Maharashtrian',
      'rajasthani': 'Rajasthani',
      'goan': 'Goan',
      'kerala': 'Kerala',
      'hyderabadi': 'Hyderabadi',
      'indo chinese': 'Indo-Chinese',
      'mughlai': 'Mughlai',
      'street food': 'Street Food',
      'continental': 'Continental',
      'italian': 'Italian',
      'thai': 'Thai',
      'mediterranean': 'Mediterranean'
    };
    
    const lowerCuisine = cuisine.toLowerCase();
    const result: CuisineType[] = [];
    
    // Check for each cuisine type
    for (const [key, value] of Object.entries(cuisineMap)) {
      if (lowerCuisine.includes(key)) {
        result.push(value);
      }
    }
    
    // If no specific cuisine was found, use 'Other'
    if (result.length === 0) {
      result.push('Other');
    }
    
    return result;
  }

  /**
   * Extract ingredients from CleanedIngredients field
   */
  private extractIngredients(cleanedIngredients: string): string[] {
    if (!cleanedIngredients) return [];
    
    // Split by comma and clean up
    return cleanedIngredients
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);
  }

  /**
   * Determine if a dish is healthy (simplified logic)
   */
  private isHealthyDish(record: CsvDishRecord): boolean {
    const lowerDiet = record.Diet.toLowerCase();
    const lowerIngredients = record.CleanedIngredients.toLowerCase();
    
    // Consider vegetarian dishes as generally healthier
    const isVegetarian = lowerDiet.includes('vegetarian') || lowerDiet.includes('vegan');
    
    // Check for healthy ingredients
    const hasHealthyIngredients = 
      lowerIngredients.includes('vegetable') || 
      lowerIngredients.includes('fruit') || 
      lowerIngredients.includes('salad') || 
      lowerIngredients.includes('protein');
    
    // Check for unhealthy ingredients
    const hasUnhealthyIngredients = 
      lowerIngredients.includes('sugar') || 
      lowerIngredients.includes('cream') || 
      lowerIngredients.includes('butter') || 
      lowerIngredients.includes('deep fry');
    
    // Simple heuristic: vegetarian + healthy ingredients - unhealthy ingredients
    return (isVegetarian && hasHealthyIngredients) || (hasHealthyIngredients && !hasUnhealthyIngredients);
  }

  /**
   * Determine spice level (simplified logic)
   */
  private determineSpiceLevel(record: CsvDishRecord): SpiceLevel {
    const lowerIngredients = record.CleanedIngredients.toLowerCase();
    
    // Check for spicy ingredients
    const hasVerySpicyIngredients = 
      lowerIngredients.includes('chilli') || 
      lowerIngredients.includes('chili') || 
      lowerIngredients.includes('hot pepper') || 
      lowerIngredients.includes('spicy');
    
    const hasMediumSpicyIngredients = 
      lowerIngredients.includes('pepper') || 
      lowerIngredients.includes('ginger') || 
      lowerIngredients.includes('masala');
    
    if (hasVerySpicyIngredients) {
      return 'Spicy';
    } else if (hasMediumSpicyIngredients) {
      return 'Medium';
    } else {
      return 'Mild';
    }
  }

  /**
   * Extract dietary tags
   */
  private extractDietaryTags(record: CsvDishRecord): string[] {
    const tags: string[] = [];
    const lowerDiet = record.Diet.toLowerCase();
    const lowerIngredients = record.CleanedIngredients.toLowerCase();
    const prepTime = parseInt(record.PrepTimeInMins) || 0;
    
    // Diet-based tags
    if (lowerDiet.includes('vegetarian')) tags.push('vegetarian');
    if (lowerDiet.includes('vegan')) tags.push('vegan');
    if (lowerDiet.includes('gluten-free')) tags.push('gluten-free');
    
    // Ingredient-based tags
    if (lowerIngredients.includes('protein')) tags.push('protein-rich');
    if (lowerIngredients.includes('lentil') || lowerIngredients.includes('dal')) tags.push('protein-rich');
    if (lowerIngredients.includes('paneer') || lowerIngredients.includes('cheese')) tags.push('protein-rich');
    
    // Time-based tags
    if (prepTime <= 15) tags.push('quick');
    if (prepTime <= 30) tags.push('easy');
    
    // Cuisine-based tags
    if (record.Cuisine.toLowerCase().includes('traditional')) tags.push('traditional');
    if (record.Cuisine.toLowerCase().includes('street')) tags.push('street-food');
    
    return tags;
  }

  /**
   * Get all dishes
   */
  async getAllDishes(): Promise<Dish[]> {
    await this.initialize();
    return this.dishes;
  }

  /**
   * Get a dish by ID
   */
  async getDishById(id: string): Promise<Dish | undefined> {
    await this.initialize();
    return this.dishes.find(dish => dish.dish_id === id);
  }

  /**
   * Get dishes by category
   */
  async getDishByCategory(category: MealCategory): Promise<Dish[]> {
    await this.initialize();
    return this.dishes.filter(dish => dish.category === category);
  }

  /**
   * Get dishes by preference
   */
  async getDishByPreference(preference: DietPreference): Promise<Dish[]> {
    await this.initialize();
    return this.dishes.filter(dish => dish.preference === preference);
  }

  /**
   * Get dishes by cuisine
   */
  async getDishByCuisine(cuisine: CuisineType): Promise<Dish[]> {
    await this.initialize();
    return this.dishes.filter(dish => dish.cuisines.includes(cuisine));
  }

  /**
   * Search dishes by query
   */
  async searchDishes(query: string): Promise<Dish[]> {
    await this.initialize();
    
    if (!query) return this.dishes;
    
    const lowercaseQuery = query.toLowerCase();
    
    return this.dishes.filter(dish => {
      // Search in name
      if (dish.name.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in ingredients
      if (dish.ingredients.some(ing => ing.toLowerCase().includes(lowercaseQuery))) {
        return true;
      }
      
      // Search in cuisines
      if (dish.cuisines.some(cuisine => cuisine.toLowerCase().includes(lowercaseQuery))) {
        return true;
      }
      
      // Search in description
      if (dish.description?.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      return false;
    });
  }
} 