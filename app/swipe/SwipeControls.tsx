"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { memo } from "react"

interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled: boolean;
}

// Use memo to prevent unnecessary re-renders
const SwipeControls = memo(({ onSwipeLeft, onSwipeRight, disabled }: SwipeControlsProps) => {
  return (
    <div className="flex justify-center space-x-6 mt-6">
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onSwipeLeft}
          disabled={disabled}
        >
          <X className="h-6 w-6" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onSwipeRight}
          disabled={disabled}
        >
          <Check className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
});

// Add display name for debugging
SwipeControls.displayName = "SwipeControls";

export default SwipeControls 