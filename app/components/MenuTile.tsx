"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MenuTileIcon } from "./MenuTileIcon";
import { cn } from "@/lib/utils";

interface MenuTileProps {
  title: string;
  description: string;
  iconType: "create-menu" | "join-menu" | "recipe-collection";
  onClick?: () => void;
  actionButton?: ReactNode;
  className?: string;
}

export function MenuTile({
  title,
  description,
  iconType,
  onClick,
  actionButton,
  className,
}: MenuTileProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md", 
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        
        <div className="py-6 flex justify-center">
          <MenuTileIcon type={iconType} size={120} />
        </div>
      </CardContent>
      
      {actionButton && (
        <CardFooter className="p-6 pt-0">
          {actionButton}
        </CardFooter>
      )}
    </Card>
  );
} 