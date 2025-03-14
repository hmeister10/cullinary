"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/providers/app-provider"
import { useRouter } from "next/navigation"
import { Calendar, Download, Share2 } from "lucide-react"
import Image from "next/image"
import { format, addDays, parseISO } from "date-fns"

export default function MenuPage() {
  const { activeMenu } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!activeMenu) {
      router.push("/")
      return
    }
  }, [activeMenu, router])

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

  if (!activeMenu) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <p>Loading menu...</p>
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
                              activeMenu.matches.breakfast[dayIndex].image_url || "/placeholder.svg?height=64&width=64"
                            }
                            alt={activeMenu.matches.breakfast[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{activeMenu.matches.breakfast[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {activeMenu.matches.breakfast[dayIndex].preference}
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
                            src={activeMenu.matches.lunch[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                            alt={activeMenu.matches.lunch[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{activeMenu.matches.lunch[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">{activeMenu.matches.lunch[dayIndex].preference}</p>
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
                            src={activeMenu.matches.dinner[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                            alt={activeMenu.matches.dinner[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{activeMenu.matches.dinner[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {activeMenu.matches.dinner[dayIndex].preference}
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
                            src={activeMenu.matches.snack[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                            alt={activeMenu.matches.snack[dayIndex].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{activeMenu.matches.snack[dayIndex].name}</h3>
                          <p className="text-xs text-muted-foreground">{activeMenu.matches.snack[dayIndex].preference}</p>
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
          <Button variant="outline" onClick={() => router.push("/swipe")}>
            Back to Swiping
          </Button>
          <Button onClick={() => router.push("/")}>Create New Menu</Button>
        </div>
      </div>
    </div>
  )
}

