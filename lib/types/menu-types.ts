// Remove Dish import as it's no longer used directly in matches
// import { type Dish } from "./dish-types"; 

// Add export keyword
export type MenuStatus = "pending" | "in_progress" | "completed";

// MenuMatches now holds arrays of dish IDs (strings)
export interface MenuMatches {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snack: string[];
}

// Menu interface now uses the updated MenuMatches type
export interface Menu {
  menu_id: string;        
  name?: string;           
  start_date: string;     
  end_date: string;       
  participants: string[]; 
  matches: MenuMatches; // This now expects string[] per category
  status?: 'active' | 'archived' | 'pending';
  createdAt?: any;
  createdBy: string;
}
