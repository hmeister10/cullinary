"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { MenuRepository } from "@/lib/repositories/menu.repository"
import { saveMenuToStorage } from "@/lib/local-storage"
import { useUser } from "./user-provider"
import type { Menu } from "@/lib/types/menu-types"
import type { MenuContextType } from "./types"
import { isFirebasePermissionError } from "@/lib/firebase"
import type { FirestoreMenu } from "@/lib/types/firestore-types"

// Convert FirestoreMenu to Menu format
const convertToMenu = (firestoreMenu: FirestoreMenu): Menu => {
  return {
    ...firestoreMenu,
    dishes: [], // Initialize with empty array
    swiped_dishes: [] // Initialize with empty array
  }
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  
  const menuRepository = new MenuRepository()

  // Create a new menu
  const createMenu = async (startDate: Date, endDate: Date): Promise<string> => {
    if (!user) throw new Error("User not authenticated")
    
    setLoading(true)
    try {
      console.log(`MenuProvider: Creating new menu`);
      
      // Create menu in Firestore
      const menuId = await menuRepository.createMenu(startDate, endDate, user.uid);
      console.log(`MenuProvider: Menu created with ID: ${menuId}`);

      // Get the menu data
      const menu = await menuRepository.getMenu(menuId);
      
      if (!menu) {
        console.log(`MenuProvider: Could not retrieve menu ${menuId} after creation`);
        toast({
          variant: "default",
          title: "Warning",
          description: "Created menu but could not retrieve menu data. Please refresh.",
        });
      } else {
        // Set as active menu
        setActiveMenu(convertToMenu(menu));
      }

      // Save to localStorage
      saveMenuToStorage({
        menu_id: menuId,
        name: `Menu ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: Date.now()
      });
      
      return menuId;
    } catch (error) {
      console.error("Error creating menu:", error);
      
      // If it's a Firebase permissions error, rethrow it
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
      setLoading(false)
    }
  };

  // Join a menu
  const joinMenu = async (menuId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true)
    try {
      const success = await menuRepository.joinMenu(menuId, user.uid);
      
      if (success) {
        // Load the menu data
        const menu = await menuRepository.getMenu(menuId);
        if (menu) {
          setActiveMenu(convertToMenu(menu));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error joining menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join menu. Please try again.",
      });
      return false;
    } finally {
      setLoading(false)
    }
  };

  // Load menu
  const loadMenu = async (menuId: string): Promise<boolean> => {
    setLoading(true)
    try {
      const menu = await menuRepository.getMenu(menuId);
      if (menu) {
        setActiveMenu(convertToMenu(menu));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load menu. Please try again.",
      });
      return false;
    } finally {
      setLoading(false)
    }
  };

  // Delete a menu
  const deleteMenu = async (menuId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true)
    try {
      const success = await menuRepository.deleteMenu(menuId);
      
      if (success) {
        // Clear active menu if it was the deleted one
        if (activeMenu?.menu_id === menuId) {
          setActiveMenu(null);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete menu. Please try again.",
      });
      return false;
    } finally {
      setLoading(false)
    }
  };

  // Get menu participants
  const getMenuParticipants = async (menuId: string): Promise<string[]> => {
    try {
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