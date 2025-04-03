"use client"

import { Card } from "@/components/ui/card"
import type { Dish } from "@/lib/types/dish-types"
import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame } from "lucide-react"
import { motion } from "framer-motion"

// Staggered animation variants for card elements
const cardVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- Sub-Components --- 

// Image Component
interface DishCardImageProps {
  imageUrl: string;
  alt: string;
}
const DishCardImage = ({ imageUrl, alt }: DishCardImageProps) => (
  <div className="absolute inset-0">
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => (e.currentTarget.src = "/assets/food-placeholder.svg")}
    />
  </div>
);

// Gradient Overlay Component
const DishCardOverlay = () => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
);

// Top Content (Badges)
interface DishCardTopContentProps {
  isHealthy?: boolean;
  preference: string;
}
const DishCardTopContent = memo(({ isHealthy, preference }: DishCardTopContentProps) => (
  <motion.div 
    className="flex justify-between items-start"
    initial="hidden"
    animate="visible"
    variants={cardVariants}
  >
    {isHealthy && (
      <motion.div variants={itemVariants}>
        <Badge variant="outline" className="bg-green-500/80 border-green-300 text-white text-xs font-medium backdrop-blur-sm">
          Healthy
        </Badge>
      </motion.div>
    )}
    {isHealthy && <div className="flex-grow"></div>}
    <motion.div variants={itemVariants}>
      <Badge variant="outline" className="bg-primary/80 border-primary-foreground/30 text-primary-foreground text-xs font-medium backdrop-blur-sm">
          {preference}
      </Badge>
    </motion.div>
  </motion.div>
));
DishCardTopContent.displayName = 'DishCardTopContent';

// Bottom Content (Name, Badges)
interface DishCardBottomContentProps {
  name: string;
  cuisines: string[];
  spiceLevel?: string;
  prepTime?: number;
}
const DishCardBottomContent = memo(({ name, cuisines, spiceLevel, prepTime }: DishCardBottomContentProps) => (
  <motion.div 
    className="space-y-2"
    initial="hidden"
    animate="visible"
    variants={cardVariants}
  >
    <motion.h3 
      className="text-2xl md:text-3xl font-bold drop-shadow-lg"
      variants={itemVariants}
    >
      {name}
    </motion.h3>
    
    <motion.div 
      className="flex flex-wrap gap-1"
      variants={itemVariants}
    >
      {cuisines && cuisines.slice(0, 2).map((cuisine, index) => (
        <Badge key={index} variant="secondary" className="text-xs backdrop-blur-sm bg-white/20 border-white/30">
          {cuisine}
        </Badge>
      ))}
      {spiceLevel && (
        <Badge variant={spiceLevel === "Spicy" ? "destructive" : "secondary"} className="text-xs backdrop-blur-sm bg-white/20 border-white/30">
          {spiceLevel === "Spicy" ? (
            <><Flame className="h-3 w-3 mr-1" /> {spiceLevel}</>
          ) : (
            spiceLevel
          )}
        </Badge>
      )}
      {prepTime && (
        <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/20 border-white/30">
          <Clock className="h-3 w-3 mr-1" /> {prepTime} min
        </Badge>
      )}
    </motion.div>
  </motion.div>
));
DishCardBottomContent.displayName = 'DishCardBottomContent';

// --- Main DishCard Component --- 

interface DishCardProps {
  dish: Dish;
}

const DishCard = memo(({ dish }: DishCardProps) => {
  const imageUrl = dish.image_url && dish.image_url.trim() !== "" 
    ? dish.image_url 
    : "/assets/food-placeholder.svg";
  
  return (
    <Card className="w-full h-full overflow-hidden rounded-xl shadow-lg relative bg-zinc-800">
      <div className="relative w-full h-full">
        <DishCardImage imageUrl={imageUrl} alt={dish.name} />
        <DishCardOverlay />
        
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
          <DishCardTopContent 
            isHealthy={dish.is_healthy} 
            preference={dish.preference} 
          />
          <DishCardBottomContent 
            name={dish.name} 
            cuisines={dish.cuisines} 
            spiceLevel={dish.spice_level} 
            prepTime={dish.preparation_time}
          />
        </div>
      </div>
    </Card>
  );
});

DishCard.displayName = "DishCard";

export default DishCard 