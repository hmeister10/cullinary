import { Dish, CuisineType } from "@/lib/types/dish-types"

// Single placeholder image for all dishes
const placeholderImage = "/assets/food-placeholder.svg"

export const dishes: Dish[] = [
  // Breakfast dishes
  {
    dish_id: "b1",
    name: "Veg Sandwich",
    category: "Breakfast",
    is_healthy: true,
    preference: "Veg",
    image_url: placeholderImage,
    cuisines: ["Street Food", "Continental"],
    ingredients: ["bread", "tomato", "cucumber", "lettuce", "cheese", "butter"],
    dietary_tags: ["quick", "kid-friendly"],
    spice_level: "Mild",
    preparation_time: 10,
    calories: 250,
    description: "Fresh vegetables between slices of bread with a touch of cheese and butter."
  },
  {
    dish_id: "b2",
    name: "Boiled Egg Sandwich",
    category: "Breakfast",
    is_healthy: true,
    preference: "Non-Veg",
    image_url: placeholderImage,
    cuisines: ["Continental"],
    ingredients: ["bread", "egg", "mayonnaise", "lettuce", "salt", "pepper"],
    dietary_tags: ["protein-rich", "quick"],
    protein_source: "Egg",
    spice_level: "Mild",
    preparation_time: 15,
    calories: 300,
    description: "Creamy boiled eggs with mayo between bread slices."
  },
  {
    dish_id: "b3",
    name: "Boiled Chicken Sandwich",
    category: "Breakfast",
    is_healthy: true,
    preference: "Non-Veg",
    image_url: placeholderImage,
    cuisines: ["Continental"],
    ingredients: ["bread", "chicken", "mayonnaise", "lettuce", "tomato"],
    dietary_tags: ["protein-rich", "high-protein"],
    protein_source: "Chicken",
    spice_level: "Mild",
    preparation_time: 20,
    calories: 350,
    description: "Tender boiled chicken with fresh vegetables in a sandwich."
  },
  
  // Lunch dishes
  {
    dish_id: "l1",
    name: "Chicken Biryani",
    category: "Lunch",
    is_healthy: false,
    preference: "Non-Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian", "Hyderabadi"],
    ingredients: ["rice", "chicken", "onion", "spices", "yogurt"],
    dietary_tags: ["traditional", "spicy", "festive"],
    protein_source: "Chicken",
    spice_level: "Spicy",
    preparation_time: 45,
    calories: 450,
    description: "Aromatic rice dish with tender chicken pieces and fragrant spices."
  },
  {
    dish_id: "l2",
    name: "Vegetable Pulao",
    category: "Lunch",
    is_healthy: true,
    preference: "Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian"],
    ingredients: ["rice", "mixed vegetables", "spices", "ghee"],
    dietary_tags: ["light", "everyday"],
    spice_level: "Medium",
    preparation_time: 30,
    calories: 320,
    description: "Fragrant rice cooked with mixed vegetables and mild spices."
  },
  
  // Dinner dishes
  {
    dish_id: "d1",
    name: "Butter Chicken",
    category: "Dinner",
    is_healthy: false,
    preference: "Non-Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian", "Punjabi"],
    ingredients: ["chicken", "butter", "cream", "tomato", "spices"],
    dietary_tags: ["rich", "creamy", "popular"],
    protein_source: "Chicken",
    spice_level: "Medium",
    preparation_time: 40,
    calories: 550,
    description: "Tender chicken pieces in a rich, creamy tomato-based sauce."
  },
  {
    dish_id: "d2",
    name: "Palak Paneer",
    category: "Dinner",
    is_healthy: true,
    preference: "Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian", "Punjabi"],
    ingredients: ["spinach", "paneer", "onion", "spices", "cream"],
    dietary_tags: ["nutritious", "iron-rich"],
    protein_source: "Paneer",
    spice_level: "Medium",
    preparation_time: 35,
    calories: 380,
    description: "Cottage cheese cubes in a creamy spinach gravy."
  },
  
  // Snack dishes
  {
    dish_id: "s1",
    name: "Samosa",
    category: "Snack",
    is_healthy: false,
    preference: "Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian", "Street Food"],
    ingredients: ["flour", "potato", "peas", "spices", "oil"],
    dietary_tags: ["crispy", "popular"],
    spice_level: "Medium",
    preparation_time: 45,
    calories: 250,
    description: "Crispy pastry filled with spiced potatoes and peas."
  },
  {
    dish_id: "s2",
    name: "Fruit Chaat",
    category: "Snack",
    is_healthy: true,
    preference: "Veg",
    image_url: placeholderImage,
    cuisines: ["North Indian", "Street Food"],
    ingredients: ["mixed fruits", "chaat masala", "lemon juice", "mint"],
    dietary_tags: ["refreshing", "vitamin-rich", "light"],
    spice_level: "Mild",
    preparation_time: 15,
    calories: 120,
    description: "Fresh mixed fruits tossed with tangy spices and lemon juice."
  }
] 