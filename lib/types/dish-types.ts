/**
 * Type definitions for dish-related data
 */

export type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack"
export type DietPreference = "Veg" | "Non-Veg"
export type CuisineType = 
  | "North Indian" 
  | "South Indian" 
  | "Bengali" 
  | "Gujarati" 
  | "Punjabi" 
  | "Maharashtrian" 
  | "Rajasthani" 
  | "Goan" 
  | "Kerala" 
  | "Hyderabadi" 
  | "Indo-Chinese" 
  | "Mughlai" 
  | "Street Food" 
  | "Continental" 
  | "Italian" 
  | "Thai" 
  | "Mediterranean" 
  | "Other"

export type SpiceLevel = "Mild" | "Medium" | "Spicy"

/**
 * Dish interface representing a food item
 */
export interface Dish {
  dish_id: string
  name: string
  category: MealCategory
  is_healthy: boolean
  preference: DietPreference
  image_url: string
  cuisines: CuisineType[]
  ingredients: string[]
  dietary_tags: string[]
  protein_source?: string
  spice_level?: SpiceLevel
  preparation_time?: number // in minutes
  calories?: number
  description?: string
} 