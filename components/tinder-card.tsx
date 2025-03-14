"use client"

import { useState, useRef, useCallback } from "react"
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from "framer-motion"

interface TinderCardProps {
  children: React.ReactNode
  onSwipe: (direction: string) => void
  preventSwipe?: string[]
  className?: string
}

export default function TinderCard({ children, onSwipe, preventSwipe = [], className = "" }: TinderCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  
  // Motion values for tracking position and rotation
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  
  // Track if we're currently dragging
  const [isDragging, setIsDragging] = useState(false)
  // Track if we're animating out
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  // Handle drag end
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimatingOut) return; // Prevent multiple swipes
    
    setIsDragging(false)
    
    const threshold = 100
    const direction = getSwipeDirection(info.offset.x, info.offset.y, threshold)
    
    if (direction && !preventSwipe.includes(direction)) {
      // Animate the card off-screen
      setIsAnimatingOut(true)
      
      const multiplier = direction === "left" || direction === "up" ? -1 : 1
      const targetX = direction === "left" || direction === "right" ? multiplier * 1500 : 0
      const targetY = direction === "up" || direction === "down" ? multiplier * 1500 : 0
      
      // Use a smoother animation curve
      controls.start({
        x: targetX,
        y: targetY,
        opacity: 0,
        transition: { 
          duration: 0.5,
          ease: [0.32, 0.72, 0, 1] // Custom easing for smoother animation
        }
      }).then(() => {
        // After animation completes, reset position and call onSwipe
        x.set(0)
        y.set(0)
        controls.set({ opacity: 1 })
        onSwipe(direction)
        setIsAnimatingOut(false)
      })
    } else {
      // Not enough movement, reset the card with a spring animation
      controls.start({
        x: 0,
        y: 0,
        transition: { 
          type: "spring", 
          stiffness: 300, // Lower stiffness for smoother return
          damping: 20,    // Lower damping for more natural bounce
          mass: 0.5       // Lower mass for quicker response
        }
      })
    }
  }, [controls, isAnimatingOut, onSwipe, preventSwipe, x, y])
  
  // Get swipe direction based on offset values
  const getSwipeDirection = (offsetX: number, offsetY: number, threshold: number): string | null => {
    if (Math.abs(offsetX) < threshold && Math.abs(offsetY) < threshold) {
      return null // Not enough movement
    }
    
    // Determine the primary direction of the swipe
    if (Math.abs(offsetX) > Math.abs(offsetY)) {
      return offsetX > 0 ? "right" : "left"
    } else {
      return offsetY > 0 ? "down" : "up"
    }
  }
  
  // Check if direction is prevented during drag
  const checkConstraints = useCallback((info: PanInfo) => {
    if (isAnimatingOut) return false; // Prevent dragging during animation
    
    const isAllowed = !(
      (preventSwipe.includes("left") && info.offset.x < 0) ||
      (preventSwipe.includes("right") && info.offset.x > 0) ||
      (preventSwipe.includes("up") && info.offset.y < 0) ||
      (preventSwipe.includes("down") && info.offset.y > 0)
    )
    return isAllowed
  }, [isAnimatingOut, preventSwipe])

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!checkConstraints(info)) {
      // If direction is prevented, gradually return to center
      const returnSpeed = 0.2; // Adjust for desired return speed
      x.set(x.get() * (1 - returnSpeed));
      y.set(y.get() * (1 - returnSpeed));
    }
  }, [checkConstraints, x, y])

  return (
    <motion.div
      ref={cardRef}
      className={`${className} touch-none select-none`}
      style={{
        x,
        y,
        rotate,
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: isDragging ? 1000 : 1,
      }}
      animate={controls}
      drag={!isAnimatingOut} // Disable drag during animation
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7} // Slightly reduce elasticity for more control
      onDragStart={() => !isAnimatingOut && setIsDragging(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        cursor: "grabbing",
        scale: 1.02, // Slightly scale up when dragging for better feedback
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      {children}
    </motion.div>
  )
}

