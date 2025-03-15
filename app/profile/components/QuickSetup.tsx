import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

// Define the total number of steps in the setup process
const TOTAL_STEPS = 5; // Reduced from 6 to 5 since we're combining steps 1 and 2

// Define the diet types with descriptions and icons
const dietTypes = [
  { id: "pure-veg", name: "Pure Vegetarian", description: "No meat, fish, eggs", icon: "🥗" },
  { id: "egg-veg", name: "Vegetarian with Egg", description: "No meat or fish", icon: "🥚" },
  { id: "non-veg", name: "Non-Vegetarian", description: "Includes meat and fish", icon: "🍗" },
  { id: "vegan", name: "Vegan", description: "No animal products", icon: "🌱" },
  { id: "jain", name: "Jain", description: "No root vegetables, onion, garlic", icon: "🪷" },
  { id: "sattvic", name: "Sattvic/Saatvik", description: "Pure, light, energy-giving foods", icon: "✨" },
  { id: "flexible", name: "Flexible/No Restrictions", description: "Open to all food types", icon: "🍽️" },
]

// Define the region options with descriptions and icons
const regionOptions = [
  { id: "north-indian", name: "North Indian", description: "Rich, creamy curries, breads", icon: "🫓" },
  { id: "south-indian", name: "South Indian", description: "Rice-based, coconut, spicy", icon: "🥥" },
  { id: "east-indian", name: "East Indian", description: "Fish, mustard, sweet", icon: "🐟" },
  { id: "west-indian", name: "West Indian", description: "Sweet, tangy, spicy", icon: "🍯" },
  { id: "pan-indian", name: "Pan-Indian", description: "Mix of all regions", icon: "🇮🇳" },
  { id: "global-fusion", name: "Global Fusion", description: "Indian with global influences", icon: "🌍" },
]

// Define the health tags
const healthTags = [
  { id: "fitness", name: "Fitness-focused", icon: "💪" },
  { id: "weight", name: "Weight management", icon: "⚖️" },
  { id: "traditional", name: "Traditional", icon: "👵" },
  { id: "low-oil", name: "Low-oil/Low-spice", icon: "🫙" },
  { id: "quick", name: "Quick & Easy", icon: "⏱️" },
  { id: "authentic", name: "Authentic Flavors", icon: "🌶️" },
]

// Define common avoidances
const commonAvoidances = [
  { id: "onion-garlic", name: "Onion & Garlic" },
  { id: "spicy", name: "Too Spicy" },
  { id: "dairy", name: "Dairy" },
  { id: "gluten", name: "Gluten" },
]

interface QuickSetupProps {
  onComplete: (preferences: any) => void;
  onSkip: () => void;
  initialName?: string;
  initialStep?: number;
}

// Add a progress indicator component
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  // Adjust for the welcome screen which is step 1 but not counted in the progress
  const adjustedStep = currentStep;
  const progress = Math.round((adjustedStep / TOTAL_STEPS) * 100);
  
  return (
    <div className="mb-4 w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Step {adjustedStep} of {TOTAL_STEPS}</span>
        <span>{progress}% Complete</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function QuickSetup({ onComplete, onSkip, initialName = "", initialStep = 1 }: QuickSetupProps) {
  const [step, setStep] = useState(initialStep)
  const [name, setName] = useState(initialName)
  const [preferences, setPreferences] = useState({
    name: initialName,
    dietType: "",
    region: "",
    healthTags: [] as string[],
    avoidances: [] as string[],
  })

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1)
    } else {
      onComplete(preferences)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setPreferences({ ...preferences, name: value })
  }

  const handleDietTypeChange = (value: string) => {
    setPreferences({ ...preferences, dietType: value })
  }

  const handleRegionChange = (value: string) => {
    setPreferences({ ...preferences, region: value })
  }

  const toggleHealthTag = (id: string) => {
    setPreferences(prev => {
      const current = [...prev.healthTags]
      if (current.includes(id)) {
        return { ...prev, healthTags: current.filter(tag => tag !== id) }
      } else {
        return { ...prev, healthTags: [...current, id] }
      }
    })
  }

  const toggleAvoidance = (id: string) => {
    setPreferences(prev => {
      const current = [...prev.avoidances]
      if (current.includes(id)) {
        return { ...prev, avoidances: current.filter(item => item !== id) }
      } else {
        return { ...prev, avoidances: [...current, id] }
      }
    })
  }

  return (
    <div className="w-full">
      {step === 1 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <span className="relative z-10 animate-bounce-subtle">🍽️</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Welcome to Cullinary
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Don't ever worry about "What do you want to eat?" again!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-0 pb-4">
            <div className="w-full">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">What should we call you?</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => handleNameChange(e.target.value)} 
                  placeholder="Enter your name"
                  className="text-base p-4 border-primary/20 focus:border-primary/50 transition-all text-[16px]"
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Skip Setup
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!name.trim()}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader>
            <ProgressIndicator currentStep={2} />
            <CardTitle>What's your diet type?</CardTitle>
            <CardDescription>
              Select the option that best describes your eating habits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={preferences.dietType} 
              onValueChange={handleDietTypeChange}
              className="grid gap-3"
            >
              {dietTypes.map((diet) => (
                <div 
                  key={diet.id} 
                  className={`
                    flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200
                    ${preferences.dietType === diet.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 hover:border-primary/20'}
                  `}
                  onClick={() => handleDietTypeChange(diet.id)}
                >
                  <RadioGroupItem value={diet.id} id={diet.id} className="sr-only" />
                  <div className="text-2xl">{diet.icon}</div>
                  <div className="flex-1">
                    <Label htmlFor={diet.id} className="text-base font-medium cursor-pointer">
                      {diet.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {diet.description}
                    </p>
                  </div>
                  {preferences.dietType === diet.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!preferences.dietType}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader>
            <ProgressIndicator currentStep={3} />
            <CardTitle>Which regional cuisine do you prefer?</CardTitle>
            <CardDescription>
              This helps us suggest dishes that match your taste preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={preferences.region} 
              onValueChange={handleRegionChange}
              className="grid gap-3"
            >
              {regionOptions.map((region) => (
                <div 
                  key={region.id} 
                  className={`
                    flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200
                    ${preferences.region === region.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 hover:border-primary/20'}
                  `}
                  onClick={() => handleRegionChange(region.id)}
                >
                  <RadioGroupItem value={region.id} id={region.id} className="sr-only" />
                  <div className="text-2xl">{region.icon}</div>
                  <div className="flex-1">
                    <Label htmlFor={region.id} className="text-base font-medium cursor-pointer">
                      {region.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {region.description}
                    </p>
                  </div>
                  {preferences.region === region.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!preferences.region}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader>
            <ProgressIndicator currentStep={4} />
            <CardTitle>What are your health priorities?</CardTitle>
            <CardDescription>
              Select all that apply to your lifestyle and goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {healthTags.map((tag) => (
                <div 
                  key={tag.id} 
                  className={`
                    flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200
                    ${preferences.healthTags.includes(tag.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 hover:border-primary/20'}
                  `}
                  onClick={() => toggleHealthTag(tag.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleHealthTag(tag.id)}
                >
                  <div className="text-2xl">{tag.icon}</div>
                  <div className="flex-1">
                    <p className="text-base font-medium">{tag.name}</p>
                  </div>
                  {preferences.healthTags.includes(tag.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader>
            <ProgressIndicator currentStep={5} />
            <CardTitle>Any common ingredients you avoid?</CardTitle>
            <CardDescription>
              Select all that you typically avoid in your meals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {commonAvoidances.map((item) => (
                  <Badge 
                    key={item.id}
                    variant={preferences.avoidances.includes(item.id) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1.5 px-3 transition-all duration-200 hover:shadow-sm select-none"
                    onClick={() => toggleAvoidance(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleAvoidance(item.id)}
                  >
                    {item.name}
                    {preferences.avoidances.includes(item.id) && (
                      <span className="ml-1.5">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 6 && (
        <Card className="border-2 border-primary/20 shadow-lg relative z-10 animate-fadeIn">
          <CardHeader>
            <ProgressIndicator currentStep={5} />
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mr-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <span className="relative z-10">✨</span>
              </div>
              <div>
                <CardTitle>Almost done, {preferences.name}!</CardTitle>
                <CardDescription>
                  Here's a summary of your preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Diet Type</h3>
                  <div className="mt-2 p-3 bg-muted rounded-md flex items-center">
                    <div className="text-xl mr-3">
                      {dietTypes.find(d => d.id === preferences.dietType)?.icon || '🍽️'}
                    </div>
                    <div>
                      <p className="font-medium">{dietTypes.find(d => d.id === preferences.dietType)?.name || 'Not specified'}</p>
                      <p className="text-sm text-muted-foreground">{dietTypes.find(d => d.id === preferences.dietType)?.description || ''}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Regional Cuisine</h3>
                  <div className="mt-2 p-3 bg-muted rounded-md flex items-center">
                    <div className="text-xl mr-3">
                      {regionOptions.find(r => r.id === preferences.region)?.icon || '🌍'}
                    </div>
                    <div>
                      <p className="font-medium">{regionOptions.find(r => r.id === preferences.region)?.name || 'Not specified'}</p>
                      <p className="text-sm text-muted-foreground">{regionOptions.find(r => r.id === preferences.region)?.description || ''}</p>
                    </div>
                  </div>
                </div>
                
                {preferences.healthTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">Health Priorities</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences.healthTags.map(tagId => {
                        const tag = healthTags.find(t => t.id === tagId);
                        return (
                          <Badge key={tagId} className="py-1.5 px-3">
                            <span className="mr-1">{tag?.icon}</span> {tag?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {preferences.avoidances.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium">Ingredients You Avoid</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences.avoidances.map(avoidId => {
                        const item = commonAvoidances.find(a => a.id === avoidId);
                        return (
                          <Badge key={avoidId} variant="destructive" className="py-1.5 px-3">
                            {item?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(5)}>
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Complete Setup
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 