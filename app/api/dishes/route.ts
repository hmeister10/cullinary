import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Dish, MealCategory, DietPreference, CuisineType, SpiceLevel } from "@/lib/types/dish-types";

// Define the structure of the CSV records
interface CsvDishRecord {
  dish_id: string;
  recipe_index: string;
  name: string;
  category: string;
  is_healthy: string;
  preference: string;
  image_url: string;
  cuisines: string;
  dietary_tags: string;
  spice_level: string;
  description: string;
  cuisine: string;
  course: string;
  diet: string;
  preparation_time: string;
  cooking_time: string;
  total_time: string;
  ingredients_raw: string;
  ingredients_cleaned: string;
  ingredients_array: string;
  ingredient_count: string;
  instructions: string;
  original_recipe_id: string;
  original_url: string;
}

// Cache for dishes to avoid parsing the CSV file on every request
let dishesCache: Dish[] | null = null;

export async function GET(request: Request) {
  try {
    // Parse URL and query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as MealCategory | null;
    const preference = searchParams.get('preference') as DietPreference | null;
    const cuisine = searchParams.get('cuisine') as CuisineType | null;
    const query = searchParams.get('query');
    const id = searchParams.get('id');
    const clearCache = searchParams.get('clear_cache') === 'true';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Clear cache if requested
    if (clearCache) {
      dishesCache = null;
      console.log('Dishes cache cleared');
    }
    
    // Get or initialize dishes
    if (!dishesCache) {
      dishesCache = await loadDishesFromCsv();
    }
    
    let result = dishesCache;
    
    // Apply filters
    if (id) {
      // Get a specific dish by ID
      const dish = result.find(dish => dish.dish_id === id);
      return NextResponse.json(dish || null);
    }
    
    if (category) {
      result = result.filter(dish => dish.category === category);
    }
    
    if (preference) {
      result = result.filter(dish => dish.preference === preference);
    }
    
    if (cuisine) {
      result = result.filter(dish => dish.cuisines.includes(cuisine));
    }
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(dish => {
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
    
    // Calculate pagination
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalItems);
    
    // Get paginated results
    const paginatedResult = result.slice(startIndex, endIndex);
    
    // Return with pagination metadata
    return NextResponse.json({
      dishes: paginatedResult,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error in dishes API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dishes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Read and parse a CSV file
 */
function readCsvFile<T>(filePath: string): T[] {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true, // Use the first line as column names
      skip_empty_lines: true,
    });
    
    return records as T[];
  } catch (error) {
    console.error('Error reading or parsing CSV file:', error);
    throw error;
  }
}

/**
 * Load dishes from CSV file
 */
async function loadDishesFromCsv(): Promise<Dish[]> {
  try {
    // Path to the CSV file
    const csvFilePath = path.join(process.cwd(), 'lib/data/Master_Indian_Food_Dataset.csv');
    
    // For debugging
    console.log('CSV file path:', csvFilePath);
    console.log('File exists:', fs.existsSync(csvFilePath));
    
    // Read the CSV file
    const records = readCsvFile<CsvDishRecord>(csvFilePath);
    
    // For debugging
    console.log('Number of records loaded:', records.length);
    
    // Transform CSV records to Dish objects
    return transformCsvRecordsToDishes(records);
  } catch (error) {
    console.error('Error loading dishes from CSV:', error);
    throw error;
  }
}

/**
 * Transform CSV records to Dish objects
 */
function transformCsvRecordsToDishes(records: CsvDishRecord[]): Dish[] {
  const placeholderImage = "/assets/food-placeholder.svg";
  
  return records.map((record) => {
    // Parse boolean values
    const isHealthy = record.is_healthy === '1' || record.is_healthy === 'true' || record.is_healthy === 'TRUE';
    
    // Parse arrays from JSON strings
    let cuisines: CuisineType[] = ['Other'];
    try {
      if (record.cuisines) {
        const parsedCuisines = JSON.parse(record.cuisines);
        if (Array.isArray(parsedCuisines) && parsedCuisines.length > 0) {
          cuisines = parsedCuisines as CuisineType[];
        }
      }
    } catch (e) {
      console.warn(`Error parsing cuisines for dish ${record.dish_id}:`, e);
    }
    
    let ingredients: string[] = [];
    try {
      if (record.ingredients_array && record.ingredients_array !== '[]') {
        // Try to parse the JSON array
        const parsedIngredients = JSON.parse(record.ingredients_array);
        if (Array.isArray(parsedIngredients)) {
          ingredients = parsedIngredients;
        }
      }
    } catch (e) {
      console.warn(`Error parsing ingredients_array for dish ${record.dish_id}:`, e);
    }
    
    // If ingredients array is still empty, try to extract from ingredients_cleaned
    if (ingredients.length === 0 && record.ingredients_cleaned) {
      ingredients = extractIngredients(record.ingredients_cleaned);
    }
    
    // If still empty, try to extract from ingredients_raw
    if (ingredients.length === 0 && record.ingredients_raw) {
      ingredients = record.ingredients_raw.split(',').map(i => i.trim()).filter(i => i);
    }
    
    let dietaryTags: string[] = [];
    try {
      if (record.dietary_tags) {
        const parsedTags = JSON.parse(record.dietary_tags);
        if (Array.isArray(parsedTags)) {
          dietaryTags = parsedTags;
        }
      }
    } catch (e) {
      console.warn(`Error parsing dietary tags for dish ${record.dish_id}:`, e);
    }
    
    // Parse preparation time
    const preparationTime = parseInt(record.preparation_time) || undefined;
    
    // Map category to MealCategory type
    const category: MealCategory = (record.category as MealCategory) || mapCourseToCategoryType(record.course);
    
    // Map preference to DietPreference type
    const preference: DietPreference = (record.preference as DietPreference) || mapDietToPreferenceType(record.diet);
    
    // Map spice level to SpiceLevel type
    const spiceLevel: SpiceLevel = (record.spice_level as SpiceLevel) || 'Medium';
    
    // Create the Dish object
    return {
      dish_id: record.dish_id,
      name: record.name,
      category,
      is_healthy: isHealthy,
      preference,
      image_url: record.image_url || placeholderImage,
      cuisines,
      ingredients,
      dietary_tags: dietaryTags,
      spice_level: spiceLevel,
      preparation_time: preparationTime,
      description: record.description || `${record.name} - ${record.cuisine || 'Indian'} cuisine.`,
    };
  });
}

/**
 * Map Course field to MealCategory type
 */
function mapCourseToCategoryType(course: string): MealCategory {
  const lowerCourse = course?.toLowerCase() || '';
  
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
function mapDietToPreferenceType(diet: string): DietPreference {
  const lowerDiet = diet?.toLowerCase() || '';
  
  if (lowerDiet.includes('vegetarian') || lowerDiet.includes('vegan')) {
    return 'Veg';
  } else {
    return 'Non-Veg';
  }
}

/**
 * Extract cuisines from Cuisine field
 */
function extractCuisines(cuisine: string): CuisineType[] {
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
 * Extract ingredients from ingredients_cleaned field
 */
function extractIngredients(cleanedIngredients: string): string[] {
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
function isHealthyDish(record: CsvDishRecord): boolean {
  const lowerDiet = record.diet?.toLowerCase() || '';
  const lowerIngredients = record.ingredients_cleaned?.toLowerCase() || '';
  
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
function determineSpiceLevel(record: CsvDishRecord): SpiceLevel {
  const lowerIngredients = record.ingredients_cleaned?.toLowerCase() || '';
  
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
function extractDietaryTags(record: CsvDishRecord): string[] {
  const tags: string[] = [];
  const lowerDiet = record.diet?.toLowerCase() || '';
  const lowerIngredients = record.ingredients_cleaned?.toLowerCase() || '';
  const prepTime = parseInt(record.preparation_time) || 0;
  
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
  if (record.cuisine?.toLowerCase().includes('traditional')) tags.push('traditional');
  if (record.cuisine?.toLowerCase().includes('street')) tags.push('street-food');
  
  return tags;
} 