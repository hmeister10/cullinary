"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface TinderCardProps {
  children: React.ReactNode
  onSwipe: (direction: string) => void
  preventSwipe?: string[]
  className?: string
}

export default function TinderCard({ children, onSwipe, preventSwipe = [], className = "" }: TinderCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true)

    if ("touches" in e) {
      setStartX(e.touches[0].clientX)
      setStartY(e.touches[0].clientY)
    } else {
      setStartX(e.clientX)
      setStartY(e.clientY)
    }
  }

  const handleTouchMove = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const newOffsetX = clientX - startX
    const newOffsetY = clientY - startY

    // Check if direction is prevented
    if (
      (preventSwipe.includes("left") && newOffsetX < 0) ||
      (preventSwipe.includes("right") && newOffsetX > 0) ||
      (preventSwipe.includes("up") && newOffsetY < 0) ||
      (preventSwipe.includes("down") && newOffsetY > 0)
    ) {
      return
    }

    setOffsetX(newOffsetX)
    setOffsetY(newOffsetY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const threshold = 100

    if (offsetX > threshold) {
      onSwipe("right")
    } else if (offsetX < -threshold) {
      onSwipe("left")
    } else if (offsetY < -threshold) {
      onSwipe("up")
    } else if (offsetY > threshold) {
      onSwipe("down")
    } else {
      // Reset position if not swiped enough
      setOffsetX(0)
      setOffsetY(0)
    }

    setIsDragging(false)
  }

  useEffect(() => {
    const touchMoveHandler = (e: TouchEvent | MouseEvent) => handleTouchMove(e)
    const touchEndHandler = () => handleTouchEnd()

    if (isDragging) {
      window.addEventListener("touchmove", touchMoveHandler, { passive: false })
      window.addEventListener("mousemove", touchMoveHandler)
      window.addEventListener("touchend", touchEndHandler)
      window.addEventListener("mouseup", touchEndHandler)
    }

    return () => {
      window.removeEventListener("touchmove", touchMoveHandler)
      window.removeEventListener("mousemove", touchMoveHandler)
      window.removeEventListener("touchend", touchEndHandler)
      window.removeEventListener("mouseup", touchEndHandler)
    }
  }, [isDragging, offsetX, offsetY])

  const style: React.CSSProperties = {
    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${offsetX * 0.1}deg)`,
    transition: isDragging ? "none" : "transform 0.5s ease",
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 1000 : 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    touchAction: "none", // Prevent browser handling of touch events
  }

  return (
    <div
      ref={cardRef}
      className={`${className} touch-none select-none`}
      style={style}
      onTouchStart={handleTouchStart}
      onMouseDown={handleTouchStart}
    >
      {children}
    </div>
  )
}

