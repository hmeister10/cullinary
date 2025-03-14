"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { getStoredMenus, removeMenuFromStorage } from "@/lib/local-storage"
import { format } from "date-fns"
import { Calendar, Clock, Trash2 } from "lucide-react"
import { UserNameForm } from "@/components/user-name-form"
import { useApp } from "@/providers/app-provider"
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

export default function Home() {
  const { loading, hasSetName, deleteMenu } = useApp()
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

  // Show name form if user hasn&apos;t set a name yet
  if (!hasSetName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <UserNameForm onComplete={() => {}} />
      </div>
    )
  }

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
      
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-8">
          <h1 className="text-2xl font-bold">Menu Maker</h1>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center justify-center gap-6 py-8 md:py-12 px-4 sm:px-8">
          <div className="flex max-w-[980px] w-full flex-col items-center gap-4 text-center mx-auto">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              Create Your Perfect <span className="text-primary">Weekly Menu</span> Together
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Swipe on meals with your partner and discover matches to build your perfect weekly menu.
            </p>
          </div>
          
          {recentMenus.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mt-8">
              <h2 className="text-2xl font-bold mb-4">Your Recent Menus</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentMenus.map((menu) => (
                  <Card key={menu.menu_id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{menu.name}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteMenu(menu.menu_id, e)}
                          title="Delete menu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          {format(new Date(menu.start_date), "MMM d")} - {format(new Date(menu.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Created {format(new Date(menu.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link href={`/swipe?menu=${menu.menu_id}`} className="w-full">
                        <Button variant="outline" className="w-full">Continue</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid w-full max-w-3xl mx-auto items-center justify-center gap-6 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Create Menu</CardTitle>
                <CardDescription>Start a new menu and invite your partner</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <Image
                  src="/placeholder.svg?height=120&width=120"
                  alt="Create Menu"
                  width={120}
                  height={120}
                  className="mb-4"
                />
              </CardContent>
              <CardFooter>
                <Link href="/create" className="w-full">
                  <Button className="w-full">Create Menu</Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Join Menu</CardTitle>
                <CardDescription>Join your partner&apos;s existing menu</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <Image
                  src="/placeholder.svg?height=120&width=120"
                  alt="Join Menu"
                  width={120}
                  height={120}
                  className="mb-4"
                />
              </CardContent>
              <CardFooter>
                <Link href="/join" className="w-full">
                  <Button className="w-full" variant="outline">
                    Join Menu
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center mt-8">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-2">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-1">Create or Join</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Start a menu and share the ID or join with a menu ID
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-2">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-1">Swipe on Dishes</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Both users swipe on dishes they like or dislike
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-2">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-1">Get Matched Menu</h3>
                <p className="text-sm text-muted-foreground text-center">View and share your perfect weekly menu</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <p className="text-sm text-muted-foreground">© 2024 Menu Maker. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/test-firebase" className="text-sm text-muted-foreground hover:text-foreground">
              Test Firebase
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

