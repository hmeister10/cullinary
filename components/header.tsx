"use client"

import Link from 'next/link'
import { ArrowLeft, User, Menu as MenuIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useApp } from "@/providers/app-provider"
import { useState } from 'react'
import { cn } from "@/lib/utils"

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title = "Menu Maker" }: HeaderProps) {
  const { user } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const firstLetter = user?.name ? user.name[0].toUpperCase() : 'U'
  
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
          {showBackButton && (
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
        </div>
        
        <div className="flex items-center gap-2">          
          {/* User profile button */}
          <Link href="/profile" passHref>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label="User profile"
            >
              {user?.name ? (
                <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {firstLetter}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </Link>

           {/* Mobile menu button - only visible on small screens */}
           <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu - only visible when open on small screens */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-300 border-b",
        mobileMenuOpen ? "max-h-64" : "max-h-0 border-b-0"
      )}>
        <nav className="container px-4 py-3">
          <ul className="space-y-2">
            <li>
              <Link href="/" className="block py-2 px-3 rounded-md hover:bg-accent">
                Home
              </Link>
            </li>
            <li>
              <Link href="/explore" className="block py-2 px-3 rounded-md hover:bg-accent">
                Explore Dishes
              </Link>
            </li>
            <li>
              <Link href="/recipes" className="block py-2 px-3 rounded-md hover:bg-accent">
                Recipe Collection
              </Link>
            </li>
            <li>
              <Link href="/create" className="block py-2 px-3 rounded-md hover:bg-accent">
                Create Menu
              </Link>
            </li>
            <li>
              <Link href="/join" className="block py-2 px-3 rounded-md hover:bg-accent">
                Join Menu
              </Link>
            </li>
            <li>
              <Link href="/profile" className="block py-2 px-3 rounded-md hover:bg-accent">
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
} 