"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/providers/user-provider"
import { useMenu } from "@/providers/menu-provider"
import { useRouter, useParams } from "next/navigation"
import { Calendar, Download, Share2 } from "lucide-react"
import Image from "next/image"
import { format, addDays, parseISO } from "date-fns"
import { type MenuMatches } from "@/lib/types/menu-types"
import { type Dish } from "@/lib/types/dish-types"

// Define state structure for fetched dishes
interface FetchedMatches {
  breakfast: Dish[];
  lunch: Dish[];
  dinner: Dish[];
  snack: Dish[];
}

export default function MenuPage() {
  const { user, loading, hasSetName } = useUser()
  const { activeMenu, loadMenu } = useMenu()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasAttemptedLoad = useRef(false)
  // State to hold the fully fetched dish objects for matches
  const [matchedDishes, setMatchedDishes] = useState<FetchedMatches | null>(null)
  const [isFetchingMatches, setIsFetchingMatches] = useState(false)

  useEffect(() => {
    // Wait for user to be initialized before attempting to load menu
    if (loading) return;
    
    // If user hasn't set name, redirect to home
    if (!hasSetName) {
      router.push("/");
      return;
    }

    const loadMenuData = async () => {
      // Prevent multiple load attempts
      if (hasAttemptedLoad.current) return
      hasAttemptedLoad.current = true
      
      setIsLoading(true)
      setLoadError(null)
      
      try {
        // Get the menu ID from the URL
        const menuId = params.id as string
        
        if (!menuId) {
          setLoadError("No menu ID provided.")
          toast({
            variant: "destructive",
            title: "Error",
            description: "No menu ID provided.",
          })
          return
        }
        
        console.log("Attempting to load menu with ID:", menuId)
        
        // Check if we already have this menu loaded
        if (activeMenu && activeMenu.menu_id === menuId) {
          console.log("Menu already loaded:", menuId);
          setIsLoading(false);
          return;
        }
        
        // Ensure user is available before loading menu
        if (!user) {
          setLoadError("User not authenticated. Please refresh and try again.");
          toast({
            variant: "destructive",
            title: "Error",
            description: "User not authenticated. Please refresh and try again.",
          });
          return;
        }
        
        // Load the menu
        const success = await loadMenu(menuId)
        
        if (!success) {
          setLoadError("Failed to load menu. It may have been deleted or you don't have access.")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load menu. It may have been deleted or you don't have access.",
          })
          return
        }
        
        console.log("Successfully loaded menu:", menuId)
      } catch (error) {
        console.error("Error loading menu:", error)
        setLoadError("An unexpected error occurred while loading the menu.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while loading the menu.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMenuData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasSetName, params.id, loadMenu, user?.uid, activeMenu])

  // Effect to fetch full dish details for matched IDs
  useEffect(() => {
    if (!activeMenu || !activeMenu.matches) return; // Need activeMenu with match IDs

    const fetchMatchDetails = async () => {
      setIsFetchingMatches(true);
      console.log("MenuPage: Fetching details for matched dish IDs:", activeMenu.matches);
      try {
        const categories = Object.keys(activeMenu.matches) as Array<keyof MenuMatches>;
        const fetchedData: Partial<FetchedMatches> = {};

        for (const category of categories) {
          const ids = activeMenu.matches[category];
          if (ids && ids.length > 0) {
            // Fetch dishes for this category's IDs
            const dishPromises = ids.map(id => 
                fetch(`/api/dishes?id=${encodeURIComponent(id)}`).then(res => res.json() as Promise<Dish | null>)
            );
            const dishes = await Promise.all(dishPromises);
            // Filter out any null results (dish not found by API)
            fetchedData[category] = dishes.filter((dish): dish is Dish => dish !== null); 
          } else {
            fetchedData[category] = []; // Empty array if no IDs
          }
        }
        
        console.log("MenuPage: Fetched dish details:", fetchedData);
        setMatchedDishes(fetchedData as FetchedMatches); // Set the state with full objects

      } catch (error) {
        console.error("MenuPage: Error fetching matched dish details:", error);
        toast({ title: "Error", description: "Could not load details for matched dishes.", variant: "destructive" });
        setMatchedDishes(null); // Indicate error or incomplete data
      } finally {
        setIsFetchingMatches(false);
      }
    };

    fetchMatchDetails();

  }, [activeMenu, toast]); // Run when activeMenu (with IDs) changes

  useEffect(() => {
    // Skip if no menu is loaded yet
    if (!activeMenu) return
    
    const loadDishDetails = async () => {
      const dishService = DishService.getInstance()
      const allDishIds = [
        ...activeMenu.matches.breakfast,
        ...activeMenu.matches.lunch, 
        ...activeMenu.matches.dinner,
        ...activeMenu.matches.snack
      ].filter(Boolean)
      
      const dishMap: Record<string, Dish> = {}
      
      // Load each dish by ID
      await Promise.all(allDishIds.map(async (dishId) => {
        const dish = await dishService.getDishById(dishId)
        if (dish) {
          dishMap[dishId] = dish
        }
      }))
      
      setMenuDishes(dishMap)
    }
    
    loadDishDetails()
  }, [activeMenu])

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

  // Show loading state
  if (isLoading || isFetchingMatches) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading menu...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (loadError || !activeMenu || !matchedDishes) {
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

  const startDate = parseISO(activeMenu.start_date)
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  return (
    <div className="container flex flex-col items-center min-h-screen py-6 px-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Your Weekly Menu</h1>
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

        {/* Weekly view with horizontal scrolling */}
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-4" style={{ minWidth: "1000px" }}>
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="flex flex-col space-y-4">
                <div className="text-center">
                  <div className="text-sm font-medium">{format(day, "EEE")}</div>
                  <div className="text-xl font-bold">{format(day, "d")}</div>
                </div>
                
                {/* Breakfast */}
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Breakfast</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {matchedDishes.breakfast[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={
                              matchedDishes.breakfast[dayIndex].image_url || "/assets/food-placeholder.svg"
                            }
                            alt={matchedDishes.breakfast[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{matchedDishes.breakfast[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {matchedDishes.breakfast[dayIndex].preference}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No breakfast selected yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Lunch */}
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Lunch</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {matchedDishes.lunch[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={matchedDishes.lunch[dayIndex].image_url || "/assets/food-placeholder.svg"}
                            alt={matchedDishes.lunch[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{matchedDishes.lunch[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">{matchedDishes.lunch[dayIndex].preference}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No lunch selected yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Dinner */}
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dinner</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {matchedDishes.dinner[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={matchedDishes.dinner[dayIndex].image_url || "/assets/food-placeholder.svg"}
                            alt={matchedDishes.dinner[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{matchedDishes.dinner[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {matchedDishes.dinner[dayIndex].preference}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No dinner selected yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Snack */}
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Snack</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {matchedDishes.snack[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={matchedDishes.snack[dayIndex].image_url || "/assets/food-placeholder.svg"}
                            alt={matchedDishes.snack[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{matchedDishes.snack[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">{matchedDishes.snack[dayIndex].preference}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No snack selected yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
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

