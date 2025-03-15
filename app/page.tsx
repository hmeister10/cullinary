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
          
          {recentMenus.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mt-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-2 inline-block"></span>
                Your Recent Menus
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentMenus.map((menu) => (
                  <Card key={menu.menu_id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{menu.name}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={(e) => handleDeleteMenu(menu.menu_id, e)}
                          title="Delete menu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(menu.start_date), "MMM d")} - {format(new Date(menu.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4 text-primary" />
                        <span>Created {format(new Date(menu.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/swipe?menu=${menu.menu_id}`} className="w-full">
                        <Button variant="default" className="w-full">Continue</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create Menu Card */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="p-6">
                <CardTitle>Create Menu</CardTitle>
                <CardDescription>Start a new menu and invite your partner</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center p-6 bg-muted/30">
                  <Image 
                    src="/assets/create-menu.svg" 
                    alt="Create Menu" 
                    width={120} 
                    height={120} 
                    className="h-32 w-32 object-contain"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-4">
                <Link href="/create" className="w-full">
                  <Button className="w-full">Create New Menu</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Join Menu Card */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="p-6">
                <CardTitle>Join Menu</CardTitle>
                <CardDescription>Join an existing menu with a code</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center p-6 bg-muted/30">
                  <Image 
                    src="/assets/join-menu.svg" 
                    alt="Join Menu" 
                    width={120} 
                    height={120} 
                    className="h-32 w-32 object-contain"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-4">
                <Link href="/join" className="w-full">
                  <Button className="w-full" variant="outline">Enter Menu Code</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Recipe Collection Card */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="p-6">
                <CardTitle>Recipe Collection</CardTitle>
                <CardDescription>Discover our curated recipe collection</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center p-6 bg-muted/30">
                  <Image 
                    src="/assets/food-placeholder.svg" 
                    alt="Recipe Collection" 
                    width={120} 
                    height={120} 
                    className="h-32 w-32 object-contain"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-4">
                <Link href="/recipes" className="w-full">
                  <Button className="w-full" variant="outline">View Recipes</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 text-center mt-8">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-2 inline-block"></span>
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-4">
              <div className="flex flex-col items-center p-6 rounded-xl bg-card border shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4 relative">
                  <span className="text-xl font-bold">1</span>
                  <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-ping opacity-20"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Create or Join</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Start a menu and share the ID or join with a menu ID
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-card border shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Swipe on Dishes</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Both users swipe on dishes they like or dislike
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-card border shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Matched Menu</h3>
                <p className="text-sm text-muted-foreground text-center">
                  View and share your perfect weekly menu
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <p className="text-sm text-muted-foreground flex items-center">
            <span className="mr-2">Made to reduce kalesh... enjoy!</span>
          </p>
          {/* <div className="flex items-center space-x-4">
            <Link href="/test-firebase" className="text-sm text-muted-foreground hover:text-foreground">
              Test Firebase
            </Link>
          </div> */}
        </div>
      </footer>
    </div>
  )
}

