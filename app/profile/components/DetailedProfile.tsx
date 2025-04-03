import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Define the dietary preferences interface
interface DietaryPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
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

interface DetailedProfileProps {
  initialPreferences: Partial<DietaryPreferences>;
  onSave: (preferences: DietaryPreferences & { name: string }) => void;
  isSaving: boolean;
  initialName?: string;
  onRedoQuickSetup: () => void;
}

export function DetailedProfile({ initialPreferences, onSave, isSaving, initialName = "", onRedoQuickSetup }: DetailedProfileProps) {
  const [name, setName] = useState(initialName)
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    isVegetarian: initialPreferences.isVegetarian || false,
    isVegan: initialPreferences.isVegan || false,
    dietType: initialPreferences.dietType || "",
    region: initialPreferences.region || "",
    healthTags: initialPreferences.healthTags || [],
    cuisinePreferences: initialPreferences.cuisinePreferences || [],
    proteinPreferences: initialPreferences.proteinPreferences || [],
    specificPreferences: initialPreferences.specificPreferences || [],
    avoidances: initialPreferences.avoidances || [],
    occasionBasedDiet: initialPreferences.occasionBasedDiet || {
      enabled: false,
      days: [],
      festivals: [],
      other: []
    }
  })
  
  // Cuisine options - Indian regional cuisines first
  const cuisineOptions = [
    "North Indian", "South Indian", "Bengali", "Gujarati", "Punjabi", 
    "Maharashtrian", "Rajasthani", "Goan", "Kerala", "Hyderabadi",
    "Indo-Chinese", "Mughlai", "Street Food", "Continental", "Italian"
  ]
  
  // Protein options - Indian context
  const proteinOptions = [
    "Chicken", "Mutton", "Fish", "Eggs", "Paneer", 
    "Tofu", "Lentils (Dal)", "Beans", "Soya Chunks", "Sprouts"
  ]

  // Specific preference suggestions based on cuisine
  const cuisineSuggestions: {[key: string]: string[]} = {
    "North Indian": ["Butter Chicken", "Dal Makhani", "Naan", "Paneer Tikka", "Chole Bhature", "Rajma Chawal"],
    "South Indian": ["Dosa", "Idli Sambar", "Rasam", "Coconut Chutney", "Appam", "Filter Coffee"],
    "Bengali": ["Fish Curry", "Mishti Doi", "Rasgulla", "Shorshe Ilish", "Aloo Posto", "Cholar Dal"],
    "Gujarati": ["Dhokla", "Thepla", "Khandvi", "Undhiyu", "Fafda", "Jalebi"],
    "Punjabi": ["Sarson Da Saag", "Makki Di Roti", "Amritsari Kulcha", "Lassi", "Butter Chicken", "Chole"],
    "Maharashtrian": ["Vada Pav", "Puran Poli", "Misal Pav", "Pav Bhaji", "Sabudana Khichdi", "Modak"],
    "Rajasthani": ["Dal Baati Churma", "Gatte ki Sabzi", "Laal Maas", "Ker Sangri", "Ghevar", "Pyaaz Kachori"],
    "Goan": ["Fish Curry", "Vindaloo", "Xacuti", "Bebinca", "Sorpotel", "Feni"],
    "Kerala": ["Appam", "Stew", "Fish Molee", "Puttu", "Kadala Curry", "Malabar Parotta"],
    "Hyderabadi": ["Biryani", "Haleem", "Double Ka Meetha", "Mirchi Ka Salan", "Qubani Ka Meetha", "Keema"],
    "Indo-Chinese": ["Gobi Manchurian", "Hakka Noodles", "Chilli Chicken", "Fried Rice", "Manchow Soup", "Spring Rolls"],
    "Mughlai": ["Biryani", "Kebabs", "Korma", "Nihari", "Sheermal", "Phirni"],
    "Street Food": ["Pani Puri", "Bhel Puri", "Pav Bhaji", "Chaat", "Kathi Rolls", "Samosa"],
    "Continental": ["Pasta", "Pizza", "Burgers", "Sandwiches", "Salads", "Baked dishes"],
    "Italian": ["Pizza", "Pasta", "Risotto", "Lasagna", "Garlic Bread", "Tiramisu"]
  }

  // Specific preference suggestions based on protein
  const proteinSuggestions: {[key: string]: string[]} = {
    "Chicken": ["Boneless", "With Bone", "Curry Cut", "Breast Pieces", "Leg Pieces", "Minced", "Tandoori Style"],
    "Mutton": ["Curry Cut", "Keema (Minced)", "Chops", "Raan", "Liver", "Biryani Cut", "Slow Cooked"],
    "Fish": ["Curry", "Fried", "Steamed", "Baked", "Specific fish types (Rohu/Pomfret/Hilsa)", "With head", "Without head"],
    "Eggs": ["Boiled", "Omelette", "Bhurji (Scrambled)", "Curry", "Half Fry", "Egg Whites Only"],
    "Paneer": ["Tikka", "Bhurji", "Curry", "Grilled", "Malai Paneer", "Kadhai Paneer", "Palak Paneer"],
    "Tofu": ["Firm", "Silken", "Bhurji Style", "Curry", "Stir Fried", "Marinated"],
    "Lentils (Dal)": ["Yellow Dal", "Dal Tadka", "Dal Makhani", "Sambar", "Rasam", "Panchmel Dal", "Moong Dal"],
    "Beans": ["Rajma", "Chana", "Lobia", "Sprouted", "Curry", "Sabzi"],
    "Soya Chunks": ["Curry", "Dry Sabzi", "Biryani", "Pulao", "Kofta", "Matar Soya"],
    "Sprouts": ["Salad", "Curry", "Chaat", "Stir Fried", "Steamed", "With Lemon"]
  }

  // Common avoidances in Indian context
  const commonAvoidances = [
    "Onion", "Garlic", "Too Spicy", "Too Oily", "Ginger", 
    "Green Chillies", "Red Chilli Powder", "Garam Masala", 
    "Mustard Seeds", "Asafoetida (Hing)", "Curd/Yogurt", 
    "Coconut", "Tomatoes", "Brinjal (Baingan)", "Okra (Bhindi)", 
    "Bitter Gourd (Karela)", "Bottle Gourd (Lauki)", "Pumpkin (Kaddu)",
    "Leafy Greens", "Raw Vegetables", "Mushrooms"
  ]

  // Religious and cultural dietary practices
  const dietaryPractices = {
    vegetarianDays: [
      "Monday", "Tuesday", "Thursday", "Saturday", "Ekadashi", "Purnima (Full Moon)", "Amavasya (New Moon)"
    ],
    fastingDays: [
      "Ekadashi", "Navratri", "Karwa Chauth", "Maha Shivaratri", "Janmashtami", "Ramadan", "Lent", "Paryushan"
    ],
    hinduPractices: [
      "Sattvic diet", "No onion & garlic", "Vrat (fasting) food only", "Ekadashi fasting", "Navratri fasting"
    ],
    muslimPractices: [
      "Halal only", "Ramadan fasting", "Eid celebration", "Muharram observance"
    ],
    jainPractices: [
      "No root vegetables", "No fermented food", "No eating after sunset", "Paryushan fasting", "Ayambil"
    ],
    sikhPractices: [
      "Langar food", "Gurpurab observance"
    ],
    christianPractices: [
      "Lent fasting", "Good Friday observance", "No meat on Fridays"
    ],
    healthPractices: [
      "Intermittent fasting", "One meal a day", "Liquid diet days", "Detox days"
    ]
  }

  // Toggle cuisine preference
  const toggleCuisine = (cuisine: string) => {
    setPreferences(prev => {
      const current = [...prev.cuisinePreferences]
      if (current.includes(cuisine)) {
        return { ...prev, cuisinePreferences: current.filter(c => c !== cuisine) }
      } else {
        return { ...prev, cuisinePreferences: [...current, cuisine] }
      }
    })
  }

  // Toggle protein preference
  const toggleProtein = (protein: string) => {
    setPreferences(prev => {
      const current = [...prev.proteinPreferences]
      if (current.includes(protein)) {
        return { ...prev, proteinPreferences: current.filter(p => p !== protein) }
      } else {
        return { ...prev, proteinPreferences: [...current, protein] }
      }
    })
  }

  // Add specific preference
  const addSpecificPreference = (preference: string) => {
    if (preference.trim() === "") return
    
    setPreferences(prev => ({
      ...prev,
      specificPreferences: [...prev.specificPreferences, preference.trim()]
    }))
  }

  // Remove specific preference
  const removeSpecificPreference = (preference: string) => {
    setPreferences(prev => ({
      ...prev,
      specificPreferences: prev.specificPreferences.filter(p => p !== preference)
    }))
  }

  // Add avoidance
  const addAvoidance = (item: string) => {
    if (item.trim() === "") return
    
    setPreferences(prev => ({
      ...prev,
      avoidances: [...prev.avoidances, item.trim()]
    }))
  }

  // Remove avoidance
  const removeAvoidance = (item: string) => {
    setPreferences(prev => ({
      ...prev,
      avoidances: prev.avoidances.filter(a => a !== item)
    }))
  }

  // Toggle occasion-based diet status
  const toggleOccasionBasedDiet = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      occasionBasedDiet: {
        ...prev.occasionBasedDiet,
        enabled
      }
    }))
  }

  // Toggle day selection for occasion-based diet
  const toggleDay = (day: string) => {
    setPreferences(prev => {
      const current = [...prev.occasionBasedDiet.days]
      if (current.includes(day)) {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            days: current.filter(d => d !== day)
          }
        }
      } else {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            days: [...current, day]
          }
        }
      }
    })
  }

  // Toggle festival selection
  const toggleFestival = (festival: string) => {
    setPreferences(prev => {
      const current = [...prev.occasionBasedDiet.festivals]
      if (current.includes(festival)) {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            festivals: current.filter(f => f !== festival)
          }
        }
      } else {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            festivals: [...current, festival]
          }
        }
      }
    })
  }

  // Toggle other dietary reason
  const toggleOtherDietaryReason = (reason: string) => {
    setPreferences(prev => {
      const current = [...prev.occasionBasedDiet.other]
      if (current.includes(reason)) {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            other: current.filter(r => r !== reason)
          }
        }
      } else {
        return { 
          ...prev, 
          occasionBasedDiet: {
            ...prev.occasionBasedDiet,
            other: [...current, reason]
          }
        }
      }
    })
  }

  // Add custom dietary reason
  const addCustomDietaryReason = (reason: string) => {
    if (reason.trim() === "") return
    
    setPreferences(prev => ({
      ...prev,
      occasionBasedDiet: {
        ...prev.occasionBasedDiet,
        other: [...prev.occasionBasedDiet.other, reason.trim()]
      }
    }))
  }

  // Remove custom dietary reason
  const removeCustomDietaryReason = (reason: string) => {
    setPreferences(prev => ({
      ...prev,
      occasionBasedDiet: {
        ...prev.occasionBasedDiet,
        other: prev.occasionBasedDiet.other.filter(r => r !== reason)
      }
    }))
  }

  // Get suggestions based on selected cuisines and proteins
  const getSuggestions = () => {
    const suggestions: string[] = []
    
    // Add cuisine-based suggestions
    preferences.cuisinePreferences.forEach(cuisine => {
      if (cuisineSuggestions[cuisine]) {
        suggestions.push(...cuisineSuggestions[cuisine])
      }
    })
    
    // Add protein-based suggestions
    preferences.proteinPreferences.forEach(protein => {
      if (proteinSuggestions[protein]) {
        suggestions.push(...proteinSuggestions[protein])
      }
    })
    
    // Remove duplicates and already selected preferences
    return [...new Set(suggestions)].filter(
      suggestion => !preferences.specificPreferences.includes(suggestion)
    )
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave({
      ...preferences,
      name
    })
  }

  // Get suggestions based on selected options
  const suggestions = getSuggestions()

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your personal information and core dietary preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="vegetarian" 
                checked={preferences.isVegetarian}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, isVegetarian: checked as boolean }))
                }
              />
              <Label htmlFor="vegetarian">Vegetarian</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="occasion-based-diet" 
                checked={preferences.occasionBasedDiet.enabled}
                onCheckedChange={(checked) => 
                  toggleOccasionBasedDiet(checked as boolean)
                }
              />
              <Label htmlFor="occasion-based-diet">My diet changes based on specific days or occasions</Label>
            </div>
          </CardContent>
        </Card>
        
        {/* Regional Cuisines Section */}
        <Collapsible className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regional Cuisines</CardTitle>
                  <CardDescription>
                    Select your favorite cuisines
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 group">
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.cuisinePreferences.length > 0 ? (
                  preferences.cuisinePreferences.map(cuisine => (
                    <Badge key={cuisine}>{cuisine}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No cuisines selected</span>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cuisineOptions.map(cuisine => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cuisine-${cuisine}`} 
                        checked={preferences.cuisinePreferences.includes(cuisine)}
                        onCheckedChange={() => toggleCuisine(cuisine)}
                      />
                      <Label htmlFor={`cuisine-${cuisine}`}>{cuisine}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* Protein Preferences Section */}
        <Collapsible className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Protein Preferences</CardTitle>
                  <CardDescription>
                    Select your preferred proteins
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 group">
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.proteinPreferences.length > 0 ? (
                  preferences.proteinPreferences.map(protein => (
                    <Badge key={protein}>{protein}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No proteins selected</span>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {proteinOptions.map(protein => (
                    <div key={protein} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`protein-${protein}`} 
                        checked={preferences.proteinPreferences.includes(protein)}
                        onCheckedChange={() => toggleProtein(protein)}
                      />
                      <Label htmlFor={`protein-${protein}`}>{protein}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* Occasion-Based Dietary Choices Section */}
        {preferences.occasionBasedDiet.enabled && (
        <Collapsible className="w-full" defaultOpen>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Occasion-Based Dietary Choices</CardTitle>
                  <CardDescription>
                    Days or occasions when your diet changes
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="w-9 p-0 group">
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Common Days Section */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Common Days</h4>
                  <p className="text-xs text-muted-foreground mb-3">Days when you follow special dietary practices</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["Monday", "Tuesday", "Thursday", "Saturday", "Ekadashi", "Purnima", "Amavasya", "Navratri", "Karwa Chauth", "Janmashtami"].map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`common-day-${day}`} 
                          checked={
                            preferences.occasionBasedDiet.days.includes(day) || 
                            preferences.occasionBasedDiet.festivals.includes(day)
                          }
                          onCheckedChange={() => {
                            if (["Monday", "Tuesday", "Thursday", "Saturday", "Ekadashi", "Purnima", "Amavasya"].includes(day)) {
                              toggleDay(day);
                            } else {
                              toggleFestival(day);
                            }
                          }}
                        />
                        <Label htmlFor={`common-day-${day}`}>{day}</Label>
                      </div>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-primary"
                    onClick={() => document.getElementById('dietary-practices-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Show more options
                  </Button>
                </div>
                
                {/* Dietary Practices Section */}
                <div id="dietary-practices-section">
                  <h4 className="text-sm font-medium mb-2">Dietary Practices</h4>
                  <p className="text-xs text-muted-foreground mb-3">Common dietary practices you follow</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Sattvic diet", 
                      "No onion & garlic", 
                      "Fasting food only",
                      "Halal only",
                      "No root vegetables",
                      "No fermented food",
                      "No eating after sunset",
                      "No meat on specific days",
                      "Intermittent fasting",
                      "One meal a day"
                    ].map(practice => (
                      <div key={practice} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`practice-${practice}`} 
                          checked={preferences.occasionBasedDiet.other.includes(practice)}
                          onCheckedChange={() => toggleOtherDietaryReason(practice)}
                        />
                        <Label htmlFor={`practice-${practice}`}>{practice}</Label>
                      </div>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-primary"
                    onClick={() => document.getElementById('all-practices-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Show more options
                  </Button>
                </div>
                
                {/* All Practices Section (Hidden initially) */}
                <div id="all-practices-section">
                  <h4 className="text-sm font-medium mb-2">All Dietary Practices</h4>
                  <p className="text-xs text-muted-foreground mb-3">Complete list of dietary practices</p>
                  
                  {/* Traditional Practices */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Traditional Practices</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ...dietaryPractices.hinduPractices,
                        ...dietaryPractices.jainPractices
                      ].map(practice => (
                        <div key={practice} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`trad-${practice}`} 
                            checked={preferences.occasionBasedDiet.other.includes(practice)}
                            onCheckedChange={() => toggleOtherDietaryReason(practice)}
                          />
                          <Label htmlFor={`trad-${practice}`}>{practice}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* International Practices */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">International Practices</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ...dietaryPractices.muslimPractices,
                        ...dietaryPractices.sikhPractices,
                        ...dietaryPractices.christianPractices
                      ].map(practice => (
                        <div key={practice} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`intl-${practice}`} 
                            checked={preferences.occasionBasedDiet.other.includes(practice)}
                            onCheckedChange={() => toggleOtherDietaryReason(practice)}
                          />
                          <Label htmlFor={`intl-${practice}`}>{practice}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Health-Based Practices */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Health-Based Practices</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {dietaryPractices.healthPractices.map(practice => (
                        <div key={practice} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`health-${practice}`} 
                            checked={preferences.occasionBasedDiet.other.includes(practice)}
                            onCheckedChange={() => toggleOtherDietaryReason(practice)}
                          />
                          <Label htmlFor={`health-${practice}`}>{practice}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Fasting Days */}
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Fasting Days</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {dietaryPractices.fastingDays.filter(day => !["Ekadashi", "Navratri", "Karwa Chauth", "Janmashtami"].includes(day)).map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`fast-day-${day}`} 
                            checked={preferences.occasionBasedDiet.festivals.includes(day)}
                            onCheckedChange={() => toggleFestival(day)}
                          />
                          <Label htmlFor={`fast-day-${day}`}>{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Custom dietary reasons */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Custom Dietary Practices</h4>
                  <p className="text-xs text-muted-foreground mb-3">Add your own dietary practices</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferences.occasionBasedDiet.other
                      .filter(reason => ![
                        ...dietaryPractices.hinduPractices,
                        ...dietaryPractices.muslimPractices,
                        ...dietaryPractices.jainPractices,
                        ...dietaryPractices.sikhPractices,
                        ...dietaryPractices.christianPractices,
                        ...dietaryPractices.healthPractices,
                        "Sattvic diet", 
                        "No onion & garlic", 
                        "Fasting food only",
                        "Halal only",
                        "No root vegetables",
                        "No fermented food",
                        "No eating after sunset",
                        "No meat on specific days",
                        "Intermittent fasting",
                        "One meal a day"
                      ].includes(reason))
                      .map(reason => (
                        <div key={reason} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center">
                          <span>{reason}</span>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => removeCustomDietaryReason(reason)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input 
                      id="custom-reason" 
                      placeholder="e.g., Family tradition, Personal vow"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomDietaryReason((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('custom-reason') as HTMLInputElement
                        addCustomDietaryReason(input.value)
                        input.value = ''
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        )}
        
        {/* Specific Preferences Section */}
        <Collapsible className="w-full" defaultOpen>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Specific Preferences</CardTitle>
                  <CardDescription>
                    Add your specific likes
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 group">
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.specificPreferences.length > 0 ? (
                  preferences.specificPreferences.slice(0, 3).map(pref => (
                    <Badge key={pref}>{pref}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No specific preferences added</span>
                )}
                {preferences.specificPreferences.length > 3 && (
                  <Badge variant="outline">+{preferences.specificPreferences.length - 3} more</Badge>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {preferences.specificPreferences.map(pref => (
                    <div key={pref} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center">
                      <span>{pref}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        onClick={() => removeSpecificPreference(pref)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Suggestions based on selected cuisines and proteins */}
                {suggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Suggestions based on your selections:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map(suggestion => (
                        <Badge 
                          key={suggestion}
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary transition-colors"
                          onClick={() => addSpecificPreference(suggestion)}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" /> {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Input 
                    id="preference" 
                    placeholder="e.g., Homemade rotis, Properly cooked dal"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSpecificPreference((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('preference') as HTMLInputElement
                      addSpecificPreference(input.value)
                      input.value = ''
                    }}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* Avoidances Section */}
        <Collapsible className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Avoidances</CardTitle>
                  <CardDescription>
                    Add ingredients you avoid
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0 group">
                    <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {preferences.avoidances.length > 0 ? (
                  preferences.avoidances.slice(0, 3).map(item => (
                    <Badge key={item} variant="destructive">{item}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No avoidances added</span>
                )}
                {preferences.avoidances.length > 3 && (
                  <Badge variant="outline">+{preferences.avoidances.length - 3} more</Badge>
                )}
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {preferences.avoidances.map(item => (
                    <div key={item} className="bg-destructive/10 text-destructive px-3 py-1 rounded-full flex items-center">
                      <span>{item}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        onClick={() => removeAvoidance(item)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Common avoidances suggestions */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Common ingredients people avoid:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {commonAvoidances
                      .filter(item => !preferences.avoidances.includes(item))
                      .slice(0, 12)
                      .map(item => (
                        <Badge 
                          key={item}
                          variant="outline" 
                          className="cursor-pointer hover:bg-destructive/10 transition-colors"
                          onClick={() => addAvoidance(item)}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" /> {item}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Input 
                    id="avoidance" 
                    placeholder="e.g., Karela, Too much garam masala"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAvoidance((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('avoidance') as HTMLInputElement
                      addAvoidance(input.value)
                      input.value = ''
                    }}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        <div className="sticky bottom-4 flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={onRedoQuickSetup}
            className="shadow-lg"
            size="lg"
          >
            Redo Quick Setup
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className="shadow-lg"
            size="lg"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
} 