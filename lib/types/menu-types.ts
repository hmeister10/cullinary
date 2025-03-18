import { Dish } from "./dish-types";

export interface MenuMatches {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snack: string[];
  [key: string]: string[];
}

export interface Menu {
  menu_id: string;
  start_date: string;
  end_date: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed';
  matches: MenuMatches;
  dishes: MenuDish[];
  swiped_dishes: string[];
}

export interface MenuDish extends Dish {
    swiped: boolean;
}