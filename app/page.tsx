"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { getStoredMenus, removeMenuFromStorage } from "@/lib/local-storage"
import { format } from "date-fns"
import { Calendar, Clock, Trash2, Utensils } from "lucide-react"
import { useApp } from "@/providers/app-provider"
import { Header } from "@/components/header"
import { QuickSetup } from "./profile/components/QuickSetup"
import { MenuTile } from "@/app/components/MenuTile"
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

export default function HomePage() {
  const { loading, hasSetName, deleteMenu, updateUserProfile, user } = useApp()
  const [recentMenus, setRecentMenus] = useState<StoredMenu[]>([])
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [featuredDishes, setFeaturedDishes] = useState<Dish[]>([])
  const [isLoadingDishes, setIsLoadingDishes] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const hasLoadedMenus = useRef(false)
  const hasLoadedDishes = useRef(false)

  // Load menus from localStorage on client side
  useEffect(() => {
    // Only load menus if we haven't already and the conditions are right
    if (!hasLoadedMenus.current && !loading && hasSetName) {
      const menus = getStoredMenus()
      setRecentMenus(menus.slice(0, 3)) // Show only the 3 most recent menus
      hasLoadedMenus.current = true
    }
  }, [loading, hasSetName])

  // Load featured dishes from API
  useEffect(() => {
    const fetchFeaturedDishes = async () => {
      if (hasLoadedDishes.current || loading || !hasSetName) return
      
      try {
        setIsLoadingDishes(true)
        hasLoadedDishes.current = true
        
        // Get user's dietary preferences
        const dietPreference = user?.dietaryPreferences?.isVegetarian ? 'Veg' : undefined
        
        // Fetch dishes from API
        const response = await fetch(`/api/dishes?limit=6${dietPreference ? `&preference=${dietPreference}` : ''}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dishes: ${response.statusText}`)
        }
        
        const data = await response.json()
        setFeaturedDishes(data.dishes || [])
      } catch (error) {
        console.error('Error fetching featured dishes:', error)
      } finally {
        setIsLoadingDishes(false)
      }
    }
    
    fetchFeaturedDishes()
  }, [loading, hasSetName, user])

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
      
      <Header title="Cullinary" />
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
            />
            
            <MenuTile
              title="Join Menu"
              description="Join an existing menu with a code"
              iconType="join-menu"
              onClick={() => router.push('/join')}
            />
            
            <MenuTile
              title="Browse Recipes"
              description="Explore our collection of recipes"
              iconType="browse-recipes"
              onClick={() => router.push('/recipes')}
            />
          </div>
          
          {/* Recent Menus Section */}
          <div className="w-full max-w-4xl mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-6">Recent Menus</h2>
            
            {recentMenus.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentMenus.map((menu) => (
                  <Link href={`/menu/${menu.menu_id}`} key={menu.menu_id} className="block group">
                    <Card className="h-full transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {menu.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(menu.start_date), "MMM d")} - {format(new Date(menu.end_date), "MMM d, yyyy")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Created {format(new Date(menu.created_at), "MMM d, yyyy")}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" className="group-hover:bg-primary/10 transition-colors">
                          View Menu
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteMenu(menu.menu_id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Image 
                      src="/assets/empty-menu.svg" 
                      alt="No menus" 
                      width={64} 
                      height={64} 
                      className="opacity-70"
                    />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No recent menus</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Create your first menu to get started with meal planning
                  </p>
                  <Button onClick={() => router.push('/create')}>
                    Create Your First Menu
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Featured Dishes Section */}
          {hasSetName && (
            <div className="w-full max-w-4xl mx-auto mt-12">
              <h2 className="text-2xl font-bold mb-6">Featured Dishes</h2>
              
              {isLoadingDishes ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : featuredDishes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featuredDishes.map((dish) => (
                    <Card key={dish.dish_id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-48 w-full">
                        <Image
                          src={dish.image_url || "/assets/food-placeholder.svg"}
                          alt={dish.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge variant={dish.preference === 'Veg' ? 'secondary' : 'default'}>
                            {dish.preference}
                          </Badge>
                          {dish.is_healthy && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Healthy
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{dish.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {dish.cuisines.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dish.description}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => router.push(`/recipes/${dish.dish_id}`)}
                        >
                          <Utensils className="h-4 w-4 mr-2" />
                          View Recipe
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Utensils className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No featured dishes</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      We couldn't load any featured dishes at the moment
                    </p>
                    <Button onClick={() => router.push('/recipes')}>
                      Browse All Recipes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

