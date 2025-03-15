"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { useApp } from "@/providers/app-provider"
import { useToast } from "@/hooks/use-toast"
import { QuickSetup } from "./components/QuickSetup"
import { DetailedProfile } from "./components/DetailedProfile"

// Define the dietary preferences interface
interface DietaryPreferences {
  isVegetarian: boolean;
  dietType: string;
  region: string;
  healthTags: string[];
  cuisinePreferences: string[];
  proteinPreferences: string[];
  specificPreferences: string[];
  avoidances: string[];
  occasionBasedDiet: {
    enabled: boolean;
    days: string[];
    festivals: string[];
    other: string[];
  };
}

export default function ProfilePage() {
  const { user, updateUserProfile, loading } = useApp()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showQuickSetup, setShowQuickSetup] = useState(true)
  const [name, setName] = useState("")
  const [preferences, setPreferences] = useState<Partial<DietaryPreferences>>({
    isVegetarian: false,
    dietType: "",
    region: "",
    healthTags: [],
    cuisinePreferences: [],
    proteinPreferences: [],
    specificPreferences: [],
    avoidances: [],
    occasionBasedDiet: {
      enabled: false,
      days: [],
      festivals: [],
      other: []
    }
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      if (user.dietaryPreferences) {
        setPreferences(user.dietaryPreferences)
        // If user already has preferences, skip quick setup
        if (
          user.dietaryPreferences.cuisinePreferences?.length > 0 ||
          user.dietaryPreferences.proteinPreferences?.length > 0 ||
          user.dietaryPreferences.specificPreferences?.length > 0
        ) {
          setShowQuickSetup(false)
        }
      }
    }
  }, [user])

  // Handle quick setup completion
  const handleQuickSetupComplete = (quickPreferences: {
    name: string;
    dietType: string;
    region: string;
    healthTags: string[];
    avoidances: string[];
    occasionBasedDiet?: {
      enabled?: boolean;
      days?: string[];
      festivals?: string[];
      other?: string[];
    };
  }) => {
    // Map quick setup preferences to our format
    const mappedPreferences: Partial<DietaryPreferences> = {
      ...preferences,
      dietType: quickPreferences.dietType,
      region: quickPreferences.region,
      healthTags: quickPreferences.healthTags,
      avoidances: quickPreferences.avoidances,
      // Set vegetarian based on diet type
      isVegetarian: ["pure-veg", "egg-veg", "vegan", "jain", "sattvic"].includes(quickPreferences.dietType),
      // Map region to cuisine preferences
      cuisinePreferences: mapRegionToCuisines(quickPreferences.region),
      // Set occasion-based diet if applicable
      occasionBasedDiet: {
        enabled: quickPreferences.occasionBasedDiet?.enabled || false,
        days: quickPreferences.occasionBasedDiet?.days || [],
        festivals: quickPreferences.occasionBasedDiet?.festivals || [],
        other: quickPreferences.occasionBasedDiet?.other || []
      }
    }
    
    // Update name from quick setup
    setName(quickPreferences.name || name)
    
    setPreferences(mappedPreferences)
    setShowQuickSetup(false)
    
    // Save the quick setup preferences
    handleSaveProfile({
      ...mappedPreferences as DietaryPreferences,
      name: quickPreferences.name || name
    })
  }

  // Handle redoing quick setup
  const handleRedoQuickSetup = () => {
    setShowQuickSetup(true)
  }

  // Map region selection to cuisine preferences
  const mapRegionToCuisines = (region: string): string[] => {
    switch (region) {
      case "north-indian":
        return ["North Indian", "Punjabi", "Mughlai"]
      case "south-indian":
        return ["South Indian", "Kerala", "Hyderabadi"]
      case "east-indian":
        return ["Bengali"]
      case "west-indian":
        return ["Gujarati", "Maharashtrian", "Rajasthani", "Goan"]
      case "pan-indian":
        return ["North Indian", "South Indian", "Bengali", "Gujarati", "Street Food"]
      case "global-fusion":
        return ["Indo-Chinese", "Continental", "Italian"]
      default:
        return []
    }
  }

  // Handle form submission
  const handleSaveProfile = async (profileData: DietaryPreferences & { name: string }) => {
    setIsSaving(true)
    
    try {
      await updateUserProfile({
        name: profileData.name,
        dietaryPreferences: {
          isVegetarian: profileData.isVegetarian,
          dietType: profileData.dietType,
          region: profileData.region,
          healthTags: profileData.healthTags,
          cuisinePreferences: profileData.cuisinePreferences,
          proteinPreferences: profileData.proteinPreferences,
          specificPreferences: profileData.specificPreferences,
          avoidances: profileData.avoidances,
          occasionBasedDiet: profileData.occasionBasedDiet
        }
      })
      
      // Update local state
      setName(profileData.name)
      
      toast({
        title: "Profile updated",
        description: "Your preferences have been successfully saved.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Skip quick setup
  const handleSkipQuickSetup = () => {
    setShowQuickSetup(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showBackButton title="Profile" />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showBackButton title="Profile" />
      <main className="flex-1 container py-8 px-4 sm:px-8">
        {showQuickSetup ? (
          <QuickSetup 
            onComplete={handleQuickSetupComplete}
            onSkip={handleSkipQuickSetup}
            initialName={name}
          />
        ) : (
          <DetailedProfile 
            initialPreferences={preferences}
            initialName={name}
            onSave={handleSaveProfile}
            isSaving={isSaving}
            onRedoQuickSetup={handleRedoQuickSetup}
          />
        )}
      </main>
    </div>
  )
} 