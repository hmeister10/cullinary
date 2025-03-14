"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Heart } from "lucide-react"
import { Dish } from "@/lib/mock-data"
import { memo } from "react"

interface HeartAnimationProps {
  dish: Dish | null;
}

// Use memo to prevent unnecessary re-renders
const HeartAnimation = memo(({ dish }: HeartAnimationProps) => {
  if (!dish) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="flex flex-col items-center"
          initial={{ scale: 0.5 }}
          animate={{ 
            scale: [0.5, 1.2, 1],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 1.2,
            times: [0, 0.5, 1],
            repeat: 0
          }}
        >
          <Heart className="h-20 w-20 text-red-500 fill-red-500" />
          <motion.p 
            className="text-white font-bold text-xl mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {dish.name}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

// Add display name for debugging
HeartAnimation.displayName = "HeartAnimation";

export default HeartAnimation; 