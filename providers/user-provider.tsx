"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { firestoreService } from "@/lib/firestore-service";
import { getUserId, saveUserId, getUserName, saveUserName, hasUserName, getUserPreferences, saveUserPreferences, getUserFavorites, saveUserFavorites } from "@/lib/local-storage";
import { type User, type DietaryPreferences } from "@/lib/types/user-types";

// Define the context type for User related state and functions
interface UserContextType {
  user: User | null;
  loading: boolean;       // Indicates if initial user loading is complete
  hasSetName: boolean;    // Indicates if the user has set their name
  setUserName: (name: string) => void;
  updateUserProfile: (profile: Partial<User>) => Promise<boolean>;
  updateUser: (user: User) => void; 
  getUserNameById: (userId: string) => Promise<string | null>;
  getUserNamesByIds: (userIds: string[]) => Promise<Map<string, string | null>>;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create the provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [hasSetName, setHasSetName] = useState(false);
  const { toast } = useToast();

  // Effect to initialize user from localStorage or generate new ID
  useEffect(() => {
    const createOrGetUser = async () => {
      setLoading(true); // Ensure loading is true at the start
      try {
        console.log("UserProvider: Creating or getting user");
        let userId = getUserId();
        let userName = getUserName();
        let userPreferences = getUserPreferences();
        let userFavorites = localStorage.getItem('userFavorites');
        
        if (!userId) {
          userId = `user_${Math.random().toString(36).substring(2, 9)}`;
          saveUserId(userId);
          console.log("UserProvider: Generated new userId:", userId);
        }
        
        const loadedUser: User = { 
          uid: userId, 
          name: userName || undefined,
          dietaryPreferences: userPreferences || undefined,
          favorites: userFavorites ? JSON.parse(userFavorites) : []
        };
        
        setUser(loadedUser);
        setHasSetName(!!userName);
        console.log("UserProvider: Set user state with userId:", userId, "hasSetName:", !!userName);

        // Optional: Ensure user exists in Firestore 
        // await firestoreService.ensureUserExists(userId, userName); 
      } catch (error) {
        console.error("UserProvider: Error initializing user:", error);
        toast({
          variant: "destructive",
          title: "User Initialization Error",
          description: "Failed to initialize user. Please refresh.",
        });
      } finally {
        setLoading(false);
        console.log("UserProvider: Finished user initialization.");
      }
    };

    createOrGetUser();
  }, [toast]); // Only depends on toast

  // Function to set user name
  const setUserName = useCallback((name: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, name };
    saveUserName(name);
    setUser(updatedUser);
    setHasSetName(true);
    
    // Update Firestore asynchronously
    firestoreService.updateUserName(user.uid, name).catch(error => {
      console.error("UserProvider: Error updating user name in Firestore:", error);
      // Maybe show a toast?
    });
  }, [user]); // Depends on user state

  // Function to update user profile (preferences, etc.)
  const updateUserProfile = useCallback(async (profile: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...profile };
      
      // Save relevant parts to localStorage
      if (profile.name) {
        saveUserName(profile.name);
        setHasSetName(true);
      }
      if (profile.dietaryPreferences) {
        saveUserPreferences(profile.dietaryPreferences);
      }
      // Note: Favorites saving logic is within updateUser for now
      
      // Update state
      setUser(updatedUser);
      
      // Update Firestore for name (extend firestoreService for preferences if needed)
      if (profile.name) {
        await firestoreService.updateUserName(user.uid, profile.name);
      }
      
      return true;
    } catch (error) {
      console.error("UserProvider: Error updating user profile:", error);
      // Even if Firestore fails, local update succeeded
      return true; 
    }
  }, [user]); // Depends on user state

  // Function to update local user state (e.g., for favorites)
  const updateUser = useCallback((updatedUserData: User) => {
     // Basic update, consider merging if needed: setUser(prev => ({...prev, ...updatedUserData}))
    setUser(updatedUserData); 
    
    // Save favorites to localStorage if they've changed
    if (updatedUserData.favorites && (!user?.favorites || 
        JSON.stringify(updatedUserData.favorites) !== JSON.stringify(user.favorites))) {
      localStorage.setItem('userFavorites', JSON.stringify(updatedUserData.favorites));
      console.log("UserProvider: Updated favorites in localStorage.");
    }
  }, [user]); // Depends on user state for comparison

  // Define the context value
  const contextValue: UserContextType = {
    user,
    loading,
    hasSetName,
    setUserName,
    updateUserProfile,
    updateUser,
    getUserNameById: async (userId: string) => {
      // Implementation of getUserNameById
      return null; // Placeholder return, actual implementation needed
    },
    getUserNamesByIds: async (userIds: string[]) => {
      // Implementation of getUserNamesByIds
      return new Map<string, string | null>(); // Placeholder return, actual implementation needed
    },
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

// Create the custom hook for using the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
} 