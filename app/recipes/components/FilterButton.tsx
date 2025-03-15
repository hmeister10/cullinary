"use client"

import { Button } from "@/components/ui/button"

interface FilterButtonProps {
  icon: string
  label: string
  isActive: boolean
  onClick: () => void
}

export function FilterButton({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: FilterButtonProps) {
  return (
    <Button 
      variant={isActive ? "default" : "outline"} 
      className={`rounded-full px-4 py-2 h-auto text-base flex items-center gap-2 ${
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      }`}
      onClick={onClick}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Button>
  )
} 