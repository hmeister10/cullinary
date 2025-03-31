"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { firestoreService } from "@/lib/firestore-service";
import { isFirebasePermissionError } from "@/lib/firebase";
import { type Menu, type MenuMatches } from "@/lib/types/menu-types";
import type { Unsubscribe } from "firebase/firestore";
import { useUser } from "@/providers/user-provider"; // Import the useUser hook

// Define the context type for Menu related state and functions
interface MenuContextType {
  activeMenu: Menu | null;
  userMenuList: Menu[]; // Add state for user's menus
  isLoadingUserMenus: boolean; // Add loading state
  updateActiveMenu: (updatedMenu: Menu) => void;
  loadMenu: (menuId: string) => Promise<boolean>;
  createMenu: (startDate: Date, endDate: Date) => Promise<string | null>;
  joinMenu: (menuId: string) => Promise<boolean>;
  deleteMenu: (menuId: string) => Promise<boolean>;
  subscribeToMenuUpdates: (menuId: string, callback: (menu: Menu | null) => void) => Unsubscribe;
  getMenuParticipants: (menuId: string) => Promise<string[]>;
  getUserNameById: (userId: string) => Promise<string | null>;
  getUserNamesByIds: (userIds: string[]) => Promise<Map<string, string | null>>;
  fetchUserMenus: () => Promise<void>; // Add function to fetch menus
}

// Create the context
const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Create the provider component
export function MenuProvider({ children }: { children: ReactNode }) {
  const { user } = useUser(); // Get user context
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const [userMenuList, setUserMenuList] = useState<Menu[]>([]);
  const [isLoadingUserMenus, setIsLoadingUserMenus] = useState(true);
  const { toast } = useToast();

  // Function to fetch user's menus
  const fetchUserMenus = useCallback(async () => {
    if (!user) return; // Need user to fetch menus
    console.log("MenuProvider: Fetching user menus...");
    setIsLoadingUserMenus(true);
    try {
      const menus = await firestoreService.getUserMenus(user.uid);
      setUserMenuList(menus);
    } catch (error) {
      console.error("MenuProvider: Error fetching user menus:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your menus." });
      setUserMenuList([]); // Set to empty on error
    } finally {
      setIsLoadingUserMenus(false);
    }
  }, [user, toast]);

  // Effect to fetch menus when user is available
  useEffect(() => {
    if (user) {
      fetchUserMenus();
    } else {
      // Clear menus if user logs out or is not available
      setUserMenuList([]);
      setIsLoadingUserMenus(false);
    }
  }, [user, fetchUserMenus]);

  // Function to update active menu state
  const updateActiveMenu = useCallback((updatedMenu: Menu) => {
     console.log("MenuProvider: Updating active menu state locally.");
     setActiveMenu(updatedMenu);
     // Optionally save to localStorage again?
     // saveMenuToStorage({ /* ... basic data ... */ });
  }, []); // No dependencies needed for setter

  // Load a menu by ID
  const loadMenu = useCallback(async (menuId: string): Promise<boolean> => {
    if (!user) {
       console.warn("MenuProvider: Cannot load menu, user not available.");
       return false;
    } 
    try {
      console.log(`MenuProvider: Loading menu with ID: ${menuId}`);
      const firestoreMenu = await firestoreService.getMenu(menuId);
      if (firestoreMenu) {
        setActiveMenu(firestoreMenu);
        console.log(`MenuProvider: Menu ${menuId} set as active.`);
        return true;
      }
      console.warn(`MenuProvider: Could not find menu with ID: ${menuId} in Firestore`);
      setActiveMenu(null); // Clear active menu if not found
      return false;
    } catch (error) {
      console.error("MenuProvider: Error loading menu:", error);
      setActiveMenu(null);
      return false;
    }
  }, [user]); // Depends on user

  // Create a new menu
  const createMenu = useCallback(async (startDate: Date, endDate: Date): Promise<string | null> => {
    if (!user) throw new Error("User not authenticated");

    try {
      console.log(`MenuProvider: Creating new menu for user: ${user.uid}`);
      const menuId = await firestoreService.createMenu(startDate.toISOString(), endDate.toISOString(), user.uid, user.name);
      console.log(`MenuProvider: Menu created in Firestore with ID: ${menuId}`);

      const firestoreMenu = await firestoreService.getMenu(menuId);
      if (!firestoreMenu) {
        console.warn(`MenuProvider: Could not retrieve menu ${menuId} after creation`);
        toast({ variant: "default", title: "Warning", description: "Created menu but failed to load data. Refresh might be needed." });
      } else {
        setActiveMenu(firestoreMenu);
        // Remove call to saveMenuToStorage
        // saveMenuToStorage(firestoreMenu); 
      }
      return menuId;
    } catch (error) {
      // ... error handling ...
      throw error;
    }
  }, [user, toast]);

  // Join an existing menu
  const joinMenu = useCallback(async (menuId: string): Promise<boolean> => {
    if (!user) throw new Error("User not authenticated");
    const normalizedMenuId = menuId.toUpperCase();

    try {
      console.log(`MenuProvider: User ${user.uid} attempting to join menu ${normalizedMenuId}`);
      const menuExists = await firestoreService.menuExists(normalizedMenuId);
      if (!menuExists) {
        console.log(`MenuProvider: Menu ${normalizedMenuId} not found`);
        toast({ variant: "destructive", title: "Error", description: "Menu not found." });
        return false;
      }

      const firestoreSuccess = await firestoreService.joinMenu(normalizedMenuId, user.uid, user.name);
      if (!firestoreSuccess) {
        console.log(`MenuProvider: Failed to join Firestore menu ${normalizedMenuId}`);
        toast({ variant: "destructive", title: "Error", description: "Failed to join menu." });
        return false;
      }

      console.log(`MenuProvider: Successfully joined Firestore menu: ${normalizedMenuId}`);
      const firestoreMenu = await firestoreService.getMenu(normalizedMenuId);
      if (!firestoreMenu) {
        console.warn(`MenuProvider: Could not retrieve menu ${normalizedMenuId} after joining`);
        toast({ variant: "default", title: "Warning", description: "Joined menu but failed to load data. Refresh might be needed." });
        return true; // Still successful join
      }

      // Remove call to saveMenuToStorage
      // saveMenuToStorage(firestoreMenu);
      setActiveMenu(firestoreMenu);
      return true;
    } catch (error) {
      // ... error handling ...
      return false;
    }
  }, [user, toast]);

  // Delete a menu
  const deleteMenu = useCallback(async (menuId: string): Promise<boolean> => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to delete menus." });
      return false;
    }

    try {
      console.log(`MenuProvider: Attempting delete for menu ${menuId} by user ${user.uid}`);
      const menuToDelete = await firestoreService.getMenu(menuId);

      if (!menuToDelete) {
        toast({ variant: "destructive", title: "Error", description: "Menu not found." });
        return false;
      }

      // Check if the current user is the creator
      if (menuToDelete.createdBy === user.uid) {
        console.log(`MenuProvider: User ${user.uid} is the creator. Deleting document ${menuId}...`);
        await firestoreService.deleteMenuDocument(menuId);
        
        // Update local state: remove from activeMenu if it matches
        if (activeMenu?.menu_id === menuId) {
          setActiveMenu(null);
        }
        // Update userMenuList state
        setUserMenuList(prev => prev.filter(menu => menu.menu_id !== menuId));
        
        toast({ title: "Menu Deleted", description: "The menu has been permanently deleted." });
        return true;
      } else {
        // User is not the creator - show error
        console.warn(`MenuProvider: User ${user.uid} attempted to delete menu ${menuId} created by ${menuToDelete.createdBy}. Denied.`);
        toast({ variant: "destructive", title: "Permission Denied", description: "Only the creator of the menu can delete it." });
        return false;
      }
    } catch (error) {
      console.error(`MenuProvider: Error deleting menu ${menuId}:`, error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete menu. Please try again." });
      return false;
    }
  }, [user, activeMenu, toast]); // Removed fetchUserMenus from deps, rely on state update

  // Subscribe to menu updates
  const subscribeToMenuUpdates = useCallback((menuId: string, callback: (menu: Menu | null) => void): Unsubscribe => {
    // This doesn't directly depend on user state, just passes through to firestoreService
    return firestoreService.subscribeToMenuUpdates(menuId, callback);
  }, []); // No dependencies needed

  // Get menu participants
  const getMenuParticipants = useCallback(async (menuId: string): Promise<string[]> => {
    // Doesn't depend on local state
    return firestoreService.getMenuParticipants(menuId);
  }, []); // No dependencies needed

  // Get user name by ID
  const getUserNameById = useCallback(async (userId: string): Promise<string | null> => {
     // Doesn't depend on local state
    return firestoreService.getUserNameById(userId);
  }, []); // No dependencies needed

  // Get user names by IDs
  const getUserNamesByIds = useCallback(async (userIds: string[]): Promise<Map<string, string | null>> => {
     // Doesn't depend on local state
    return firestoreService.getUserNamesByIds(userIds);
  }, []); // No dependencies needed

  // Define the context value
  const contextValue: MenuContextType = {
    activeMenu,
    userMenuList,
    isLoadingUserMenus,
    updateActiveMenu,
    loadMenu,
    createMenu,
    joinMenu,
    deleteMenu,
    subscribeToMenuUpdates,
    getMenuParticipants,
    getUserNameById,
    getUserNamesByIds,
    fetchUserMenus,
  };

  return <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>;
}

// Create the custom hook for using the context
export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
} 