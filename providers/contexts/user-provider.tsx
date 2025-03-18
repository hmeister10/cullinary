"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { UserRepository } from "@/lib/repositories/user.repository"
import { getUserId, saveUserId, getUserName, saveUserName, getUserPreferences, saveUserPreferences } from "@/lib/local-storage"
import type { User } from "@/lib/types/user-types"
import type { UserContextType } from "./types"

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSetName, setHasSetName] = useState(false)
  const { toast } = useToast()
  
  const userRepository = new UserRepository()

  // Initialize user on component mount
  useEffect(() => {
    const createOrGetUser = async () => {
      try {
        console.log("UserProvider: Creating or getting user");
        // Check if user exists in localStorage
        let userId = getUserId();
        let userName = getUserName();
        let userPreferences = getUserPreferences() || {
          isVegetarian: false,
          isVegan: false,
          cuisinePreferences: [],
          proteinPreferences: [],
          specificPreferences: [],
          avoidances: []
        };
        let userFavorites = localStorage.getItem('userFavorites');
        
        console.log("UserProvider: Retrieved from localStorage - userId:", userId ? "exists" : "not found", "userName:", userName ? "exists" : "not found");
        
        if (!userId) {
          // Generate a random user ID
          userId = `user_${Math.random().toString(36).substring(2, 9)}`
          saveUserId(userId);
          console.log("UserProvider: Generated new userId:", userId);
        }
        
        const userData = {
          uid: userId, 
          name: userName || undefined,
          dietaryPreferences: userPreferences || undefined,
          favorites: userFavorites ? JSON.parse(userFavorites) : []
        }
        
        setUser(userData)
        setHasSetName(!!userName)
        console.log("UserProvider: Set user state with userId:", userId, "hasSetName:", !!userName);

        // Create user in Firestore
        await userRepository.createUser(
          userId, 
          userName || undefined, 
          userPreferences,
          userFavorites ? JSON.parse(userFavorites) : undefined
        );
        console.log("UserProvider: User created in Firestore:", userData ? "success" : "failed");
      } catch (error) {
        console.error("Error creating user:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize user. Please refresh the page.",
        })
      } finally {
        setLoading(false)
        console.log("UserProvider: Finished user initialization, loading set to false");
      }
    }

    createOrGetUser()
  }, [toast])

  // Set user name
  const setUserName = async (name: string) => {
    if (!user) return;
    
    saveUserName(name);
    setUser({ ...user, name });
    setHasSetName(true);
    
    try {
      await userRepository.updateUserName(user.uid, name);
    } catch (error) {
      console.error("Error updating user name:", error);
    }
  };

  // Update user profile
  const updateUserProfile = async (profile: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...profile };
      
      // Save to localStorage
      if (profile.name) {
        saveUserName(profile.name);
        setHasSetName(true);
      }
      
      if (profile.dietaryPreferences) {
        saveUserPreferences(profile.dietaryPreferences);
      }
      
      // Update state
      setUser(updatedUser);
      
      // Update in Firestore
      try {
        if (profile.name) {
          await userRepository.updateUserName(user.uid, profile.name);
        }
        
        if (profile.dietaryPreferences) {
          await userRepository.updateUserPreferences(user.uid, profile.dietaryPreferences);
        }
        
        return true;
      } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        return true; // Still return true since we updated locally
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  // Update user
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    hasSetName,
    setUserName,
    updateUserProfile,
    updateUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 