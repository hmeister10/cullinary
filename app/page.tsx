"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { getStoredMenus, removeMenuFromStorage } from "@/lib/local-storage"
import { format } from "date-fns"
import { Calendar, Clock, Trash2 } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { Header } from "@/components/header"
import { QuickSetup } from "./profile/components/QuickSetup"
import { MenuTile } from "@/app/components/MenuTile"
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

interface StoredMenu {
  menu_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: number;
}

// Define a simpler interface for QuickSetup preferences
interface QuickSetupPreferences {
  name: string;
  dietType: string;
  region: string;
  healthTags: string[];
  avoidances: string[];
}

export default function Home() {
  const { loading, hasSetName, deleteMenu, updateUserProfile } = useApp()
  const [recentMenus, setRecentMenus] = useState<StoredMenu[]>([])
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Load menus from localStorage on client side
  useEffect(() => {
    if (!loading && hasSetName) {
      const menus = getStoredMenus()
      setRecentMenus(menus.slice(0, 3)) // Show only the 3 most recent menus
    }
  }, [loading, hasSetName])

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
        // Remove from Firestore via app provider
        await deleteMenu(menuToDelete);
        
        // Remove from localStorage
        removeMenuFromStorage(menuToDelete);
        
        // Update state to reflect the change
        setRecentMenus(prevMenus => prevMenus.filter(menu => menu.menu_id !== menuToDelete));
        
        toast({
          title: "Menu deleted",
          description: "The menu has been removed from your list.",
        });
      } catch (error) {
        console.error("Error deleting menu:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete menu. Please try again.",
        });
      } finally {
        // Reset the menu to delete
        setMenuToDelete(null);
        setIsDeleting(false);
      }
    }
  };
  
  // Cancel deletion
  const cancelDeleteMenu = () => {
    setMenuToDelete(null);
  };

  // Show loading screen
  if (loading) {
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
      
      <Header title="Menu Maker" />
      <main className="flex-1">
        <section className="container grid items-center justify-center gap-8 py-8 md:py-12 px-4 sm:px-8">
          <div className="flex max-w-[980px] w-full flex-col items-center gap-6 text-center mx-auto">
            <div className="relative">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-70"></div>
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-70"></div>
              <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl relative z-10">
                Create Your Perfect <span className="text-primary">Weekly Menu</span> Together
              </h1>
            </div>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Swipe on meals with your partner and discover matches to build your perfect weekly menu.
            </p>
          </div>
          
          {/* Menu Tiles */}
          <div className="w-full max-w-4xl mx-auto mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MenuTile
              title="Create Menu"
              description="Start a new menu and invite your partner"
              iconType="create-menu"
              onClick={() => router.push('/create')}
              actionButton={
                <Button className="w-full" onClick={() => router.push('/create')}>
                  Create New Menu
                </Button>
              }
            />
            
            <MenuTile
              title="Join Menu"
              description="Join an existing menu with a code"
              iconType="join-menu"
              onClick={() => router.push('/join')}
              actionButton={
                <Button className="w-full" variant="outline" onClick={() => router.push('/join')}>
                  Enter Menu Code
                </Button>
              }
            />
            
            <MenuTile
              title="Recipe Collection"
              description="Discover our curated recipe collection"
              iconType="recipe-collection"
              onClick={() => router.push('/recipes')}
              actionButton={
                <Button className="w-full" variant="secondary" onClick={() => router.push('/recipes')}>
                  Browse Recipes
                </Button>
              }
            />
          </div>
          
          {recentMenus.length > 0 && (
            <div className="w-full max-w-4xl mx-auto mt-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-2 inline-block"></span>
                Your Recent Menus
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentMenus.map((menu) => (
                  <Card key={menu.menu_id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 bg-muted/50">
                      <CardTitle className="text-lg">{menu.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(menu.start_date), "MMM d")} - {format(new Date(menu.end_date), "MMM d, yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          Created {format(new Date(menu.created_at), "MMM d, yyyy")}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteMenu(menu.menu_id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/menu/${menu.menu_id}`} className="w-full">
                        <Button variant="outline" className="w-full">View Menu</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

