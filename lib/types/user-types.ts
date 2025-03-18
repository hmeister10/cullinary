export interface DietaryPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  allergies?: string[];
  restrictions?: string[];
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
  favorites?: string[];
} 