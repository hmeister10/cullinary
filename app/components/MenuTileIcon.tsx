"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type MenuTileIconType = "create-menu" | "join-menu" | "recipe-collection" | "browse-recipes";

interface MenuTileIconProps {
  type: MenuTileIconType;
  className?: string;
  size?: number;
}

export function MenuTileIcon({ type, className, size = 120 }: MenuTileIconProps) {
  const iconPaths = {
    "create-menu": "/assets/icons/create-menu-icon.svg",
    "join-menu": "/assets/icons/join-menu-icon.svg",
    "recipe-collection": "/assets/icons/recipe-collection-icon.svg",
    "browse-recipes": "/assets/icons/recipe-collection-icon.svg", // Reusing the same icon for now
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src={iconPaths[type]}
        alt={`${type.replace("-", " ")} icon`}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
} 