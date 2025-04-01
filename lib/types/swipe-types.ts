export type SwipeStatus = 'like' | 'dislike';

export interface UserSwipes {
  [dishId: string]: SwipeStatus; // Map dish ID to 'like' or 'dislike'
} 