// lib/types/user-types.ts

export interface DietaryPreferences {
  isVegetarian: boolean;
  dietType?: string;
  region?: string;
  healthTags?: string[];
  cuisinePreferences: string[];
  proteinPreferences: string[];
  specificPreferences: string[];
  avoidances: string[];
  occasionBasedDiet?: {
    enabled: boolean;
    days: string[];
    festivals: string[];
    other: string[];
  };
}

export interface User {
  uid: string;
  name?: string;
  dietaryPreferences?: DietaryPreferences;
  favorites?: string[]; // Add favorites array to store dish IDs
} 