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
  const { activeMenu, loadMenu, user, loading, hasSetName } = useApp()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasAttemptedLoad = useRef(false)
  const [menuDishes, setMenuDishes] = useState<Record<string, Dish>>({})

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
  }, [loading, hasSetName]) // Add loading and hasSetName as dependencies

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
  if (isLoading) {
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
  if (loadError || !activeMenu) {
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
                    {activeMenu.matches.breakfast[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={
                              (menuDishes[activeMenu.matches.breakfast[dayIndex]] 
                                ? menuDishes[activeMenu.matches.breakfast[dayIndex]].image_url 
                                : "/placeholder.svg?height=64&width=64")
                            }
                            alt={menuDishes[activeMenu.matches.breakfast[dayIndex]]?.name || "Breakfast item"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            {menuDishes[activeMenu.matches.breakfast[dayIndex]]?.name || "Loading..."}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {menuDishes[activeMenu.matches.breakfast[dayIndex]]?.preference || ""}
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
                    {activeMenu.matches.lunch[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={
                              (menuDishes[activeMenu.matches.lunch[dayIndex]] 
                                ? menuDishes[activeMenu.matches.lunch[dayIndex]].image_url 
                                : "/placeholder.svg?height=64&width=64")
                            }
                            alt={menuDishes[activeMenu.matches.lunch[dayIndex]]?.name || "Lunch item"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            {menuDishes[activeMenu.matches.lunch[dayIndex]]?.name || "Loading..."}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {menuDishes[activeMenu.matches.lunch[dayIndex]]?.preference || ""}
                          </p>
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
                    {activeMenu.matches.dinner[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={
                              (menuDishes[activeMenu.matches.dinner[dayIndex]] 
                                ? menuDishes[activeMenu.matches.dinner[dayIndex]].image_url 
                                : "/placeholder.svg?height=64&width=64")
                            }
                            alt={menuDishes[activeMenu.matches.dinner[dayIndex]]?.name || "Dinner item"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            {menuDishes[activeMenu.matches.dinner[dayIndex]]?.name || "Loading..."}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {menuDishes[activeMenu.matches.dinner[dayIndex]]?.preference || ""}
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
                    {activeMenu.matches.snack[dayIndex] ? (
                      <div className="flex flex-col space-y-2">
                        <div className="relative h-16 w-full rounded-md overflow-hidden">
                          <Image
                            src={
                              (menuDishes[activeMenu.matches.snack[dayIndex]] 
                                ? menuDishes[activeMenu.matches.snack[dayIndex]].image_url 
                                : "/placeholder.svg?height=64&width=64")
                            }
                            alt={menuDishes[activeMenu.matches.snack[dayIndex]]?.name || "Snack item"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">
                            {menuDishes[activeMenu.matches.snack[dayIndex]]?.name || "Loading..."}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {menuDishes[activeMenu.matches.snack[dayIndex]]?.preference || ""}
                          </p>
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

