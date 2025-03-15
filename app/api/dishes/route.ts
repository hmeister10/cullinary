import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Dish, MealCategory, DietPreference, CuisineType, SpiceLevel } from "@/lib/types/dish-types";

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
  'image-url'?: string;
  RecipeDescription?: string;
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
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
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
    const csvFilePath = path.join(process.cwd(), 'lib/data/Cleaned_Indian_Food_Dataset.csv');
    
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
  
  // Process all records, not just the first 100
  return records.map((record, index) => {
    // Generate a unique ID
    const dish_id = `csv_${index}_${record.RecipeId || record.TranslatedRecipeName.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Determine meal category based on Course
    const category = mapCourseToCategoryType(record.Course);
    
    // Determine diet preference
    const preference = mapDietToPreferenceType(record.Diet);
    
    // Extract cuisines
    const cuisines = extractCuisines(record.Cuisine);
    
    // Extract ingredients
    const ingredients = extractIngredients(record.CleanedIngredients);
    
    // Determine if the dish is healthy (simplified logic)
    const is_healthy = isHealthyDish(record);
    
    // Extract preparation time
    const preparation_time = parseInt(record.PrepTimeInMins) || undefined;
    
    // Determine spice level (simplified logic)
    const spice_level = determineSpiceLevel(record);
    
    // Extract dietary tags
    const dietary_tags = extractDietaryTags(record);
    
    const image_url = record['image-url'] || placeholderImage;

    // Create the Dish object
    return {
      dish_id,
      name: record.TranslatedRecipeName,
      category,
      is_healthy,
      preference,
      image_url,
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
 * Extract ingredients from CleanedIngredients field
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
  const lowerDiet = record.Diet?.toLowerCase() || '';
  const lowerIngredients = record.CleanedIngredients?.toLowerCase() || '';
  
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
  const lowerIngredients = record.CleanedIngredients?.toLowerCase() || '';
  
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
  const lowerDiet = record.Diet?.toLowerCase() || '';
  const lowerIngredients = record.CleanedIngredients?.toLowerCase() || '';
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
  if (record.Cuisine?.toLowerCase().includes('traditional')) tags.push('traditional');
  if (record.Cuisine?.toLowerCase().includes('street')) tags.push('street-food');
  
  return tags;
} 