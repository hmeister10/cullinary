"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [currentDay, setCurrentDay] = useState(0) // 0-6 for the 7 days

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
      <div className="w-full max-w-3xl mx-auto">
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

        <Tabs defaultValue="0" value={String(currentDay)} onValueChange={(v) => setCurrentDay(Number.parseInt(v))}>
          <TabsList className="grid grid-cols-7 mb-4">
            {days.map((day, index) => (
              <TabsTrigger key={index} value={String(index)}>
                <div className="flex flex-col items-center">
                  <span className="text-xs">{format(day, "EEE")}</span>
                  <span className="text-sm font-bold">{format(day, "d")}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day, dayIndex) => (
            <TabsContent key={dayIndex} value={String(dayIndex)} className="space-y-4">
              <h2 className="text-xl font-bold">{format(day, "EEEE, MMMM d")}</h2>

              {/* Breakfast */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Breakfast</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMenu.matches.breakfast[dayIndex] ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
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
                        <h3 className="font-medium">{activeMenu.matches.breakfast[dayIndex].name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeMenu.matches.breakfast[dayIndex].preference}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No breakfast selected yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Lunch */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lunch</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMenu.matches.lunch[dayIndex] ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={activeMenu.matches.lunch[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                          alt={activeMenu.matches.lunch[dayIndex].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{activeMenu.matches.lunch[dayIndex].name}</h3>
                        <p className="text-sm text-muted-foreground">{activeMenu.matches.lunch[dayIndex].preference}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No lunch selected yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Dinner */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dinner</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMenu.matches.dinner[dayIndex] ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={activeMenu.matches.dinner[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                          alt={activeMenu.matches.dinner[dayIndex].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{activeMenu.matches.dinner[dayIndex].name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeMenu.matches.dinner[dayIndex].preference}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No dinner selected yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Snack */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Evening Snack</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeMenu.matches.snack[dayIndex] ? (
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={activeMenu.matches.snack[dayIndex].image_url || "/placeholder.svg?height=64&width=64"}
                          alt={activeMenu.matches.snack[dayIndex].name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{activeMenu.matches.snack[dayIndex].name}</h3>
                        <p className="text-sm text-muted-foreground">{activeMenu.matches.snack[dayIndex].preference}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No evening snack selected yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

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

