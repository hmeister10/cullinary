"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter, useParams } from "next/navigation"
import { Calendar, Download, Share2 } from "lucide-react"
import Image from "next/image"
import { format, addDays, parseISO } from "date-fns"
import type { Dish } from "@/lib/types/dish-types"
import { DishService } from "@/lib/services/dish-service"

export default function MenuPage() {
  const { activeMenu, loadMenu, user, loading: userLoading, hasSetName } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasAttemptedLoad = useRef(false)
  const [menuDishes, setMenuDishes] = useState<Record<string, Dish>>({})

  useEffect(() => {
    console.log("%c[MenuPage] Context activeMenu updated:", 'color: blue; font-weight: bold;', activeMenu);
    if (activeMenu) {
      console.log("%c[MenuPage] Matches from context:", 'color: green;', JSON.stringify(activeMenu.matches));
    }
  }, [activeMenu]);

  useEffect(() => {
    if (userLoading) {
      console.log("[MenuPage] Waiting for user initialization...");
      return;
    }
    
    if (!hasSetName) {
      console.log("[MenuPage] User has not set name, redirecting...");
      router.push("/");
      return;
    }

    const menuId = params.id as string;
    if (!menuId) {
      console.error("[MenuPage] No menu ID in URL params.");
      setLoadError("No menu ID provided.");
      setPageLoading(false);
      return;
    }

    console.log(`%c[MenuPage] Effect triggered. Current activeMenu ID: ${activeMenu?.menu_id}, URL menuId: ${menuId}`, 'color: orange;');

    if (activeMenu?.menu_id === menuId || hasAttemptedLoad.current) {
      console.log(`%c[MenuPage] Menu ${menuId} already loaded in context or load attempted.`, 'color: orange;');
      setPageLoading(false);
      return;
    }
    
    const loadMenuData = async () => {
      console.log(`%c[MenuPage] Attempting to load menu ${menuId} via loadMenu...`, 'color: purple;');
      hasAttemptedLoad.current = true;
      setPageLoading(true);
      setLoadError(null);
      
      try {
        if (!user) throw new Error("User not available for loading menu.");
        
        const success = await loadMenu(menuId);
        
        if (!success) {
          throw new Error("Failed to initiate menu loading or listener setup.");
        }
        console.log(`%c[MenuPage] loadMenu(${menuId}) called successfully. Waiting for listener...`, 'color: purple;');
      } catch (error: any) {
        console.error("[MenuPage] Error in loadMenuData:", error);
        setLoadError(error.message || "Failed to load menu. It may not exist or you lack access.");
        setPageLoading(false);
      }
    };
    
    loadMenuData();
  }, [userLoading, hasSetName, user, params.id, activeMenu, loadMenu, router]);

  useEffect(() => {
    if (!activeMenu?.matches) {
      console.log("[MenuPage] No activeMenu or matches found, clearing dish details.");
      setMenuDishes({});
      return;
    }
    
    const loadDishDetails = async () => {
      console.log("%c[MenuPage] Loading dish details based on activeMenu.matches...", 'color: brown;');
      const dishService = DishService.getInstance();
      const allDishIds = [...new Set(Object.values(activeMenu.matches).flat())].filter(Boolean);
      
      if (allDishIds.length === 0) {
        console.log("[MenuPage] No matched dish IDs found.");
        setMenuDishes({});
        return;
      }

      console.log(`[MenuPage] Matched Dish IDs to fetch: [${allDishIds.join(', ')}]`);
      const dishMap: Record<string, Dish> = {};
      let fetchError = false;
      
      try {
        await Promise.all(allDishIds.map(async (dishId) => {
          console.log(`[MenuPage] Fetching details for dish ID: ${dishId}`);
          const dish = await dishService.getDishById(dishId);
          if (dish) {
            console.log(`%c[MenuPage] SUCCESS Fetching details for dish ID: ${dishId}`, 'color: green;');
            dishMap[dishId] = dish;
          } else {
            console.warn(`%c[MenuPage] FAILED Fetching details for dish ID: ${dishId}`, 'color: orange;');
            console.warn(`[MenuPage] Could not fetch details for dish ID: ${dishId}`);
          }
        }));
      } catch (error) {
        console.error("[MenuPage] Error fetching dish details:", error);
        fetchError = true;
      }
      
      console.log(`%c[MenuPage] Dish details fetched. Found ${Object.keys(dishMap).length} details.`, 'color: brown;');
      setMenuDishes(dishMap);
    };
    
    loadDishDetails();
  }, [activeMenu?.matches]);

  const shareMenu = () => {
    toast({
      title: "Share Feature",
      description: "Sharing functionality would be implemented here.",
    })
  }

  const downloadPDF = () => {
    toast({
      title: "Download Feature",
      description: "PDF download functionality would be implemented here.",
    })
  }

  const goHome = () => {
    router.push("/")
  }

  if (pageLoading && !activeMenu && !loadError) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{loadError || "Failed to load menu. It may have been deleted or you don't have access."}</p>
          </div>
          <Button onClick={goHome}>Return to Home</Button>
        </div>
      </div>
    )
  }

  if (!pageLoading && !activeMenu) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg mb-4">Could not find the requested menu.</p>
          <Button onClick={goHome}>Return to Home</Button>
        </div>
      </div>
    )
  }

  if (!activeMenu) return null;

  const startDate = parseISO(activeMenu.start_date)
  // const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i)) // Keep commented out for now
  const mealCategories: (keyof typeof activeMenu.matches)[] = ['breakfast', 'lunch', 'dinner', 'snack']

  // --- Start Enhanced Logging ---
  console.log("%c[MenuPage] === Pre-Render Check ===", 'color: red; font-weight: bold;');
  console.log("[MenuPage] activeMenu ID:", activeMenu?.menu_id);
  console.log("[MenuPage] activeMenu.matches:", JSON.stringify(activeMenu?.matches, null, 2));
  // console.log("[MenuPage] menuDishes state:", JSON.stringify(menuDishes, null, 2));
  
  // Check consistency: Are there dish IDs in matches that are not in menuDishes?
  const allMatchIds = new Set(Object.values(activeMenu?.matches || {}).flat().filter(Boolean));
  const loadedDishIds = new Set(Object.keys(menuDishes));
  const missingDishDetails = [...allMatchIds].filter(id => !loadedDishIds.has(id));
  if (missingDishDetails.length > 0) {
      console.warn(`%c[MenuPage] WARN: Missing dish details for IDs: [${missingDishDetails.join(', ')}]`, 'color: orange;');
  } else if (allMatchIds.size > 0) {
      console.log("%c[MenuPage] OK: All matched dish IDs have corresponding details in menuDishes state.", 'color: green;');
  } else {
      console.log("%c[MenuPage] INFO: No matched dish IDs found in activeMenu.matches.", 'color: blue;');
  }
  // --- End Enhanced Logging ---
  
  // The rendering logic using mealCategories remains the same for now
  // We will restore the 7-day view after confirming data rendering

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Your Weekly Menu: {activeMenu.menu_id}</h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={shareMenu}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {format(startDate, "MMMM d")} - {format(addDays(startDate, 6), "MMMM d, yyyy")}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          {mealCategories.map(category => {
            const matchedDishIds = activeMenu.matches[category] || [];
            const categoryString = category as string;
            
            return (
              <div key={categoryString}>
                <h2 className="text-xl font-semibold mb-3 capitalize border-b pb-1">
                  {categoryString}
                </h2>
                {matchedDishIds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {matchedDishIds.map(dishId => {
                      const dish = dishId ? menuDishes[dishId] : null;
                      return (
                        <Card key={`${categoryString}-${dishId}`} className="flex flex-col overflow-hidden">
                          {dish ? (
                            <>
                              <div className="relative h-32 w-full">
                                <Image
                                  src={dish.image_url || "/assets/food-placeholder.svg"}
                                  alt={dish.name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                  className="object-cover"
                                />
                              </div>
                              <CardHeader className="p-2 flex-grow">
                                <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                                  {dish.name}
                                </CardTitle>
                              </CardHeader>
                            </>
                          ) : dishId ? (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                              Loading details for {dishId}...
                            </div>
                          ) : null} 
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic px-2">
                    No matches for {categoryString} yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-4 border-t">
          <h2 className="text-xl font-semibold mb-4">More Options (Future)</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>- Display all liked/disliked dishes by participants.</p>
            <p>- Allow manual addition/override of dishes.</p>
            <p>- Implement drag-and-drop reordering.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/swipe/${params.id}`)}>
            Back to Swiping
          </Button>
          <Button onClick={() => router.push("/")}>Create New Menu</Button>
        </div>
      </div>
    </div>
  )
}

