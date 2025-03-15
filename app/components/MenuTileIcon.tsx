"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type MenuTileIconType = "create-menu" | "join-menu" | "recipe-collection";

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