"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Define the props type based on next-themes documentation
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 