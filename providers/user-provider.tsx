"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { type User, type DietaryPreferences } from "@/lib/types/user-types";
// Remove local-storage and firestore-service imports for user functions
// import { getUserId, saveUserId, ... } from "@/lib/local-storage";
// import { firestoreService } from "@/lib/firestore-service";
// Import the new UserService
import { userService } from "@/lib/services/user-service";

// Context Type definition (Remove functions handled internally by service? Maybe keep for direct provider actions)
interface UserContextType {
  user: User | null;
  loading: boolean;
  hasSetName: boolean;
  setUserName: (name: string) => void; // Keep: This updates local storage AND calls service
  updateUserProfile: (profile: Partial<User>) => Promise<boolean>; // Keep: Calls service
  updateUser: (user: User) => void; // Keep: Updates local user state + LS favorites
  // Remove getUserNameById, getUserNamesByIds - these will be called internally if needed
}

// Create Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create Provider
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSetName, setHasSetName] = useState(false);
  const { toast } = useToast();

  // User Initialization Effect
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    const initializeUser = async () => {
      console.log("UserProvider: Initializing user...");
      try {
        // Use UserService to get ID and Name from storage
        let userId = userService.getUserId();
        let userName = userService.getUserNameFromStorage();
        let userPreferences = userService.getUserPreferences();
        let userFavorites = userService.getUserFavorites();

        if (!userId) {
          userId = `user_${Math.random().toString(36).substring(2, 9)}`;
          userService.saveUserId(userId);
          console.log("UserProvider: Generated new userId:", userId);
        }

        // Ensure user exists in Firestore (this also creates/updates name there)
        await userService.ensureUserExists(userId, userName);
        
        if (isMounted) {
            const initialUser: User = { 
              uid: userId, 
              name: userName || undefined,
              dietaryPreferences: userPreferences || undefined, // Load prefs from LS
              favorites: userFavorites || [] // Load favorites from LS
            };
            setUser(initialUser);
            setHasSetName(!!userName);
            console.log("UserProvider: Set user state with userId:", userId, "hasSetName:", !!userName);
        }

      } catch (error) {
        console.error("UserProvider: Error initializing user:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to initialize user." });
      } finally {
         if (isMounted) {
             setLoading(false);
             console.log("UserProvider: Finished user initialization.");
         }
      }
    };

    initializeUser();
    
    return () => { isMounted = false; }; // Cleanup function

  }, [toast]); // Run once on mount

  // --- Provider Actions --- 

  // Set user name (updates LS and Firestore via service)
  const setUserName = useCallback((name: string) => {
    if (!user) return;
    const trimmedName = name.trim();
    console.log(`UserProvider: Setting user name to: ${trimmedName}`);
    
    // Update local storage via service
    userService.saveUserNameToStorage(trimmedName);
    // Update Firestore via service
    userService.updateUserName(user.uid, trimmedName).catch(error => {
      console.error("UserProvider: Error updating user name in Firestore:", error);
      // Non-critical, LS is updated
    });
    
    // Update local state
    setUser(currentUser => currentUser ? { ...currentUser, name: trimmedName } : null);
    setHasSetName(true);
    
  }, [user]);

  // Update user profile (handles LS and calls service for FS)
  const updateUserProfile = useCallback(async (profile: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    console.log("UserProvider: Updating user profile:", profile);
    try {
      const updatedUser: User = { ...user, ...profile };
      
      // Save relevant parts to Local Storage via service
      if (profile.name) {
        userService.saveUserNameToStorage(profile.name);
        setHasSetName(true);
      }
      if (profile.dietaryPreferences) {
        userService.saveUserPreferences(profile.dietaryPreferences);
      }
      if (profile.favorites) { 
          userService.saveUserFavorites(profile.favorites);
      }
      
      // Update local state immediately
      setUser(updatedUser);
      
      // Update Firestore via service (currently just logs a warning)
      // If/when implemented, userService.updateUserProfile should handle FS update
      await userService.updateUserProfile(user.uid, profile);
      
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
      return true;
    } catch (error) {
      console.error("UserProvider: Error updating profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
      return false;
    }
  }, [user, toast]);

  // Update local user state (e.g., for favorites from SwipeProvider)
  const updateUser = useCallback((updatedUserData: User) => {
     console.log("UserProvider: Updating local user state:", updatedUserData);
     // Also save favorites to LS if they changed
     if (user && updatedUserData.favorites && JSON.stringify(user.favorites) !== JSON.stringify(updatedUserData.favorites)) {
         userService.saveUserFavorites(updatedUserData.favorites);
     }
     setUser(updatedUserData);
  }, [user]);
  
  // --- Context Value --- 
  const contextValue: UserContextType = {
    user,
    loading,
    hasSetName,
    setUserName,
    updateUserProfile,
    updateUser,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

// Custom hook remains the same
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
} 