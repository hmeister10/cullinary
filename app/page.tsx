"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Clock, Trash2, Utensils, ListChecks, PlusCircle, FilePlus2, Link as LinkIcon, FolderSearch, Users, Heart, Info } from "lucide-react"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { Header } from "@/components/header"
import { QuickSetup } from "./profile/components/QuickSetup"
import { Badge } from "@/components/ui/badge"
import type { Dish } from "@/lib/types/dish-types"
import type { Menu } from "@/lib/types/menu-types"
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

  console.log("userMenuList", userMenuList)

  // Handle quick setup completion
  const handleQuickSetupComplete = async (quickPreferences: QuickSetupPreferences) => {
    console.log("Quick setup completed with preferences:", quickPreferences)
    
    const mappedPreferences = {
      isVegetarian: ["pure-veg", "egg-veg", "vegan", "jain", "sattvic"].includes(quickPreferences.dietType),
      isVegan: quickPreferences.dietType === "vegan",
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
      await updateUserProfile({
        name: quickPreferences.name,
        dietaryPreferences: mappedPreferences
      })
      
      toast({
        title: "Profile updated",
        description: "Your preferences have been saved successfully.",
      })
      
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
    setMenuToDelete(menuId);
  };
  
  // Confirm deletion
  const confirmDeleteMenu = async () => {
    if (menuToDelete) {
      setIsDeleting(true);
      try {
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
          <p className="text-muted-foreground">Getting things ready...</p>
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
  
  // --- Placeholder Data for Most Loved Dishes ---
  const mostLovedDishes = [
    { id: "1", name: "Paneer Butter Masala", imageUrl: "/placeholder-dish-1.jpg", description: "Creamy and rich tomato gravy with soft paneer cubes." },
    { id: "2", name: "Masala Dosa", imageUrl: "/placeholder-dish-2.jpg", description: "Crispy rice crepe filled with spiced potato filling." },
    { id: "3", name: "Vegetable Biryani", imageUrl: "/placeholder-dish-3.jpg", description: "Aromatic basmati rice cooked with mixed vegetables and spices." },
  ];
  // --- End Placeholder Data ---

  // Show main dashboard
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/10">
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
      
      <Header title="Cullinary Dashboard" />
      
      {/* Main Content Area */}
      <main className="flex-1 py-8 md:py-12 space-y-12 md:space-y-16">
        
        {/* Section 1: Key Actions */}
        <section className="container max-w-5xl px-4 md:px-6">
           <h2 className="text-2xl font-semibold mb-6 text-center md:text-left">Get Started</h2>
           <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Link href="/create" className="block group">
                <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-6 transform hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">
                      Create Menu
                    </CardTitle>
                    <CardDescription className="pt-1 text-sm">
                      Start a new weekly menu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center pt-2">
                    <div className="bg-primary/10 rounded-full p-3">
                      <FilePlus2 className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/join" className="block group">
                <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-6 transform hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">
                      Join Menu
                    </CardTitle>
                    <CardDescription className="pt-1 text-sm">
                      Join using an invite code
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center pt-2">
                    <div className="bg-primary/10 rounded-full p-3">
                       <LinkIcon className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/recipes" className="block group">
                 <Card className="h-full transition-all hover:shadow-lg border border-border/50 hover:border-primary/50 text-center py-6 transform hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors">
                      Browse Recipes
                    </CardTitle>
                    <CardDescription className="pt-1 text-sm">
                      Explore dish ideas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center pt-2">
                    <div className="bg-primary/10 rounded-full p-3">
                       <FolderSearch className="h-8 w-8 text-primary" />
                     </div>
                  </CardContent>
                </Card>
              </Link>
           </div>
        </section>

        {/* Section 2: Recent Menus */}
        <section className="container max-w-5xl px-4 md:px-6">
          <h2 className="text-2xl font-semibold mb-6">Recent Menus</h2>
          {isLoadingUserMenus ? (
            <p className="text-muted-foreground">Loading your menus...</p>
          ) : userMenuList && userMenuList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userMenuList.map((menu, index) => {
                const menuId = menu.menu_id;
                const uniqueKey = menuId ?? `menu-index-${index}`; 
                console.log(`Rendering menu card. Key: ${uniqueKey}, menuId: ${menuId} (Type: ${typeof menuId}), Name: ${menu.name}`);

                return (
                  <Card key={uniqueKey} className="overflow-hidden transition-shadow hover:shadow-md">
                    {menuId ? (
                      <Link href={`/menu/${menuId}`} className="block hover:bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex justify-between items-center">
                            <span>{menu.name || `Menu ${menuId?.substring(0, 6) || ''}`}</span>
                          </CardTitle>
                          <CardDescription className="text-xs pt-1">
                            Created: {menu.createdAt && typeof menu.createdAt === 'object' && 'seconds' in menu.createdAt ? 
                                      format(new Date(menu.createdAt.seconds * 1000), "PP") : 
                                      "Unknown date"}
                          </CardDescription>
                        </CardHeader>
                      </Link>
                    ) : (
                      <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex justify-between items-center text-muted-foreground">
                            <span>{menu.name || 'Menu (ID missing)'}</span>
                          </CardTitle>
                          <CardDescription className="text-xs pt-1">
                             Created: {menu.createdAt && typeof menu.createdAt === 'object' && 'seconds' in menu.createdAt ? 
                                       format(new Date(menu.createdAt.seconds * 1000), "PP") : 
                                       "Unknown date"}
                          </CardDescription>
                        </CardHeader>
                    )}
                    <CardFooter className="bg-muted/20 py-2 px-4 flex justify-end border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => menuId ? handleDeleteMenu(menuId, e) : { /* Do nothing */ }}
                        disabled={!menuId || (isDeleting && menuToDelete === menuId)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> 
                        {isDeleting && menuToDelete === menuId ? "Deleting..." : "Delete"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-8 border-dashed">
              <CardContent>
                 <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                 <p className="text-muted-foreground">You haven&apos;t created or joined any menus yet.</p>
                 <p className="text-sm text-muted-foreground mt-1">Use the options above to get started!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Section 3: Most Loved Dishes (Placeholder) */}
        <section className="container max-w-5xl px-4 md:px-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
             <Heart className="h-6 w-6 text-pink-500" /> Most Loved Dishes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {mostLovedDishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden transition-shadow hover:shadow-md group">
                   <div className="aspect-video bg-muted flex items-center justify-center">
                      <Utensils className="h-12 w-12 text-muted-foreground" /> 
                   </div>
                   <CardHeader className="p-4">
                     <CardTitle className="text-lg group-hover:text-primary transition-colors">{dish.name}</CardTitle>
                     <CardDescription className="text-sm pt-1">{dish.description}</CardDescription>
                   </CardHeader>
                </Card>
             ))}
          </div>
           <p className="text-sm text-muted-foreground mt-4 text-center">Note: This section shows sample dishes for now.</p> 
        </section>

        {/* Section 4: Instructions / How it Works */}
        <section className="container max-w-5xl px-4 md:px-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Info className="h-6 w-6 text-blue-500" /> How It Works
          </h2>
          <Card className="bg-muted/40 border">
             <CardContent className="p-6 space-y-4 text-muted-foreground">
                <div className="flex items-start gap-4">
                   <div className="bg-primary/10 rounded-full p-2 mt-1"> <FilePlus2 className="h-5 w-5 text-primary" /> </div>
                   <p><strong className="font-medium text-foreground">Create a Menu:</strong> Start a new weekly meal plan. Give it a name and set your preferences.</p>
                </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/10 rounded-full p-2 mt-1"> <Users className="h-5 w-5 text-primary" /> </div>
                   <p><strong className="font-medium text-foreground">Invite Collaborators:</strong> Share the unique menu code with your partner or family members so they can join.</p>
                </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/10 rounded-full p-2 mt-1"> <ListChecks className="h-5 w-5 text-primary" /> </div>
                   <p><strong className="font-medium text-foreground">Plan Together:</strong> Add dishes to the menu for each day. See updates in real-time.</p>
                </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-primary/10 rounded-full p-2 mt-1"> <FolderSearch className="h-5 w-5 text-primary" /> </div>
                   <p><strong className="font-medium text-foreground">Discover Recipes:</strong> Browse our recipe collection for inspiration and easily add them to your menu.</p>
                </div>
             </CardContent>
          </Card>
        </section>

      </main>
      
       {/* Simple Footer */}
       <footer className="py-4 border-t bg-background">
         <div className="container max-w-5xl px-4 md:px-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Cullinary. Plan meals together.
         </div>
       </footer>

    </div>
  )
}

