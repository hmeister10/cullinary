"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Clock, Trash2, Utensils, ListChecks, PlusCircle, FilePlus2, Link as LinkIcon, FolderSearch, Users } from "lucide-react"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { Header } from "@/components/header"
import { QuickSetup } from "./profile/components/QuickSetup"
import { Badge } from "@/components/ui/badge"
import type { Dish } from "@/lib/types/dish-types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Define a simpler interface for QuickSetup preferences
interface QuickSetupPreferences {
  name: string;
  dietType: string;
  region: string;
  healthTags: string[];
  avoidances: string[];
}

export default function HomePage() {
  const { loading: userLoading, hasSetName, updateUserProfile, user } = useUser()
  const { deleteMenu, userMenuList, isLoadingUserMenus } = useMenu()
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Handle quick setup completion
  const handleQuickSetupComplete = async (quickPreferences: QuickSetupPreferences) => {
    console.log("Quick setup completed with preferences:", quickPreferences)
    
    // Map quick setup preferences to our format
    const mappedPreferences = {
      isVegetarian: ["pure-veg", "egg-veg", "vegan", "jain", "sattvic"].includes(quickPreferences.dietType),
      dietType: quickPreferences.dietType,
      region: quickPreferences.region,
      healthTags: quickPreferences.healthTags,
      avoidances: quickPreferences.avoidances,
      cuisinePreferences: mapRegionToCuisines(quickPreferences.region),
      proteinPreferences: [],
      specificPreferences: [],
      occasionBasedDiet: {
        enabled: false,
        days: [],
        festivals: [],
        other: []
      }
    }
    
    try {
      // Update user profile with preferences
      await updateUserProfile({
        name: quickPreferences.name,
        dietaryPreferences: mappedPreferences
      })
      
      toast({
        title: "Profile updated",
        description: "Your preferences have been saved successfully.",
      })
      
      // Force a page reload to refresh the app state
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
      })
    }
  }

  // Map region selection to cuisine preferences
  const mapRegionToCuisines = (region: string): string[] => {
    switch (region) {
      case "north-indian":
        return ["North Indian", "Punjabi", "Mughlai"]
      case "south-indian":
        return ["South Indian", "Kerala", "Hyderabadi"]
      case "east-indian":
        return ["Bengali"]
      case "west-indian":
        return ["Gujarati", "Maharashtrian", "Rajasthani", "Goan"]
      case "pan-indian":
        return ["North Indian", "South Indian", "Bengali", "Gujarati", "Street Food"]
      case "global-fusion":
        return ["Indo-Chinese", "Continental", "Italian"]
      default:
        return []
    }
  }

  // Handle menu deletion
  const handleDeleteMenu = (menuId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Set the menu to delete and open the confirmation dialog
    setMenuToDelete(menuId);
  };
  
  // Confirm deletion
  const confirmDeleteMenu = async () => {
    if (menuToDelete) {
      setIsDeleting(true);
      
      try {
        // Call provider's deleteMenu (which should handle Firestore)
        await deleteMenu(menuToDelete);
        
        toast({
          title: "Menu deleted",
          description: "The menu has been removed.",
        });
      } catch (error) {
        console.error("Error deleting menu:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete menu. Please try again.",
        });
      } finally {
        setMenuToDelete(null);
        setIsDeleting(false);
      }
    }
  };
  
  // Cancel deletion
  const cancelDeleteMenu = () => {
    setMenuToDelete(null);
  };

  // Overall loading state combines user loading and initial menu loading
  const isLoading = userLoading || isLoadingUserMenus;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Setting up your experience</p>
        </div>
      </div>
    )
  }

  // If user hasn't set a name yet, show QuickSetup directly
  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-muted/30" style={{ minHeight: '-webkit-fill-available' }}>
        <div className="w-full max-w-md px-4">
          <QuickSetup 
            onComplete={handleQuickSetupComplete}
            onSkip={() => window.location.reload()}
            initialName=""
            initialStep={1}
          />
        </div>
      </div>
    )
  }

  // Show main dashboard
  return (
    <div className="flex min-h-screen flex-col">
      {/* Alert Dialog for confirmation */}
      <AlertDialog open={!!menuToDelete} onOpenChange={(open) => !open && !isDeleting && setMenuToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this menu? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteMenu} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMenu} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Header title="Cullinary" />
      <main className="flex-1 flex items-center justify-center py-12 md:py-24">
        <div className="container grid max-w-4xl grid-cols-1 gap-8 px-4 md:grid-cols-3 md:px-8">
          
          <Link href="/create" className="block group">
            <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors">
                  Create Menu
                </CardTitle>
                <CardDescription className="pt-2">
                  Start a new menu and invite your partner
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center pt-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <FilePlus2 className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/join" className="block group">
            <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors">
                  Join Menu
                </CardTitle>
                <CardDescription className="pt-2">
                  Join an existing menu with a code
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center pt-4">
                <div className="bg-primary/10 rounded-full p-4">
                   <LinkIcon className="h-10 w-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/recipes" className="block group">
             <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors">
                  Browse Recipes
                </CardTitle>
                <CardDescription className="pt-2">
                  Explore our collection of recipes
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center pt-4">
                <div className="bg-primary/10 rounded-full p-4">
                   <FolderSearch className="h-10 w-10 text-primary" />
                 </div>
              </CardContent>
            </Card>
          </Link>
          
        </div>
      </main>
    </div>
  )
}

