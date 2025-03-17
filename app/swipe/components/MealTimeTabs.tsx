"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MealTimeTabsProps {
  currentMealTime: string;
  onMealTimeChange: (mealTime: string) => void;
}

export const MealTimeTabs = ({ 
  currentMealTime, 
  onMealTimeChange 
}: MealTimeTabsProps) => {
  const mealTimes = ["breakfast", "lunch", "dinner", "snack"];
  
  return (
    <Tabs 
      defaultValue="breakfast" 
      value={currentMealTime} 
      onValueChange={onMealTimeChange} 
      className="w-full mb-6"
    >
      <TabsList className="grid grid-cols-4 mb-4">
        {mealTimes.map((mealTime) => (
          <TabsTrigger 
            key={mealTime} 
            value={mealTime}
            className="capitalize"
          >
            {mealTime}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}; 