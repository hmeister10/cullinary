"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { MenuRepository } from "@/lib/repositories/menu.repository"
import { saveMenuToStorage } from "@/lib/local-storage"
import { useUser } from "./user-provider"
import type { Menu } from "@/lib/types/menu-types"
import type { MenuContextType } from "./types"
import { isFirebasePermissionError } from "@/lib/firebase"
import type { FirestoreMenu } from "@/lib/types/firestore-types"
import { onSnapshot, Unsubscribe } from "firebase/firestore"

// Convert FirestoreMenu to the client-side Menu format
const convertToMenu = (firestoreMenu: FirestoreMenu): Menu => {
  // Map fields from FirestoreMenu to Menu
  // Add empty arrays for fields expected by Menu type but not stored on the main Firestore doc
  return {
    menu_id: firestoreMenu.menu_id,
    start_date: firestoreMenu.start_date,
    end_date: firestoreMenu.end_date,
    participants: firestoreMenu.participants,
    status: firestoreMenu.status,
    matches: firestoreMenu.matches,
    // Add placeholders required by Menu type
    dishes: [], 
    swiped_dishes: [],
  }
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const menuRepository = new MenuRepository()
  const unsubscribeRef = useRef<Unsubscribe | null>(null) // Ref to hold the listener unsubscribe function

  // Function to set up the real-time listener
  const setupMenuListener = (menuId: string) => {
    // Clean up any existing listener first
    if (unsubscribeRef.current) {
      console.log("MenuProvider: Unsubscribing from previous listener.");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    console.log(`MenuProvider: Setting up listener for menu ${menuId}`);
    setLoading(true);
    try {
      // Use the now public getDocRef method
      const docRef = menuRepository.getDocRef(menuId);
      
      unsubscribeRef.current = onSnapshot(docRef, 
        (doc) => {
          if (doc.exists()) {
            const menuData = doc.data() as FirestoreMenu;
            console.log("MenuProvider: Received raw menu data snapshot:", menuData); // Log raw data object
            console.log("%cMenuProvider: Raw menuData.matches from Firestore snapshot:", 'color: purple; font-weight: bold;', JSON.stringify(menuData.matches, null, 2)); 
            setActiveMenu(convertToMenu(menuData));
          } else {
            console.log("MenuProvider: Menu document deleted or does not exist.");
            // If the active menu is deleted, clear state and listener
            if (activeMenu?.menu_id === menuId) {
                setActiveMenu(null);
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
                toast({
                  variant: "destructive",
                  title: "Menu Not Found",
                  description: "The active menu was deleted or could not be found.",
                });
            }
          }
          setLoading(false); // Update loading state after processing snapshot
        },
        (error) => {
          console.error("MenuProvider: Error listening to menu changes:", error);
          toast({
            variant: "destructive",
            title: "Real-time Error",
            description: "Failed to get real-time updates for the menu.",
          });
          setLoading(false);
          // Potentially clear active menu or handle error state
        }
      );
    } catch (error) {
      console.error("MenuProvider: Error setting up listener:", error);
      setLoading(false);
    }
  };

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        console.log("MenuProvider: Cleaning up listener on unmount.");
        unsubscribeRef.current();
      }
    };
  }, []);

  // Create a new menu
  const createMenu = async (startDate: Date, endDate: Date): Promise<string> => {
    if (!user) throw new Error("User not authenticated")
    
    setLoading(true)
    try {
      console.log(`MenuProvider: Creating new menu`);
      
      // Create menu in Firestore
      const menuId = await menuRepository.createMenu(startDate, endDate, user.uid);
      console.log(`MenuProvider: Menu created with ID: ${menuId}`);

      // Setup listener for the newly created menu
      setupMenuListener(menuId);

      // Save to localStorage (keep this)
      saveMenuToStorage({
        menu_id: menuId,
        name: `Menu ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: Date.now() // Consider using server timestamp if consistency needed
      });
      
      return menuId;
    } catch (error) {
      console.error("Error creating menu:", error);
      
      if (isFirebasePermissionError(error)) {
        throw error;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create menu. Please try again.",
      });
      
      throw error;
    } finally {
      // Loading state is now handled by the listener
      // setLoading(false) // Remove this
    }
  };

  // Join a menu
  const joinMenu = async (menuId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true)
    try {
      const success = await menuRepository.joinMenu(menuId, user.uid);
      
      if (success) {
        // Setup listener after successfully joining
        setupMenuListener(menuId);
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Join Failed",
          description: "Could not join the menu. It might not exist.",
        });
        setLoading(false); // Explicitly set loading false if join failed
        return false;
      }
    } catch (error) {
      console.error("Error joining menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join menu. Please try again.",
      });
      setLoading(false); // Ensure loading is false on error
      return false;
    }
    // Loading state is handled by the listener on success
  };

  // Load menu (now primarily used to initiate the listener)
  const loadMenu = async (menuId: string): Promise<boolean> => {
    console.log(`MenuProvider: loadMenu called for ${menuId}`);
    if (activeMenu?.menu_id === menuId && unsubscribeRef.current) {
      console.log("MenuProvider: Listener already active for this menu.");
      return true; // Already listening to this menu
    }
    setupMenuListener(menuId);
    // The listener will handle setting the active menu and loading state
    // Return true to indicate the process started.
    return true;
  };

  // Delete a menu (soft delete)
  const deleteMenu = async (menuId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true)
    try {
      const success = await menuRepository.deleteMenu(menuId); // This updates status to 'completed'
      
      if (success) {
        // If deleting the active menu, clean up listener and state
        if (activeMenu?.menu_id === menuId) {
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
          setActiveMenu(null);
        }
        toast({ // Give feedback on successful deletion
            title: "Menu Deleted",
            description: `Menu ${menuId} marked as completed.`,
        });
        return true;
      }
      
      setLoading(false); // Only set false if delete failed
      return false;
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete menu. Please try again.",
      });
      setLoading(false); // Ensure loading is false on error
      return false;
    }
  };

  // Get menu participants (can remain async, doesn't need to be real-time usually)
  const getMenuParticipants = async (menuId: string): Promise<string[]> => {
    try {
      // Use the repository method which fetches once
      return await menuRepository.getMenuParticipants(menuId);
    } catch (error) {
      console.error("Error getting menu participants:", error);
      return [];
    }
  };

  const value = {
    activeMenu,
    loading,
    createMenu,
    joinMenu,
    loadMenu,
    deleteMenu,
    getMenuParticipants
  }

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
} 