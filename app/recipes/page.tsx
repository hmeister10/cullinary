import { Metadata } from "next"
import Image from "next/image"
import RecipesPageContent from "./RecipesPageContent"

export const metadata: Metadata = {
  title: "Recipe Collection | Cullinary",
  description: "Explore our collection of delicious recipes for every meal",
}

export default function RecipesPage() {
  return (
    <div className="container py-12 space-y-8">
      {/* Hero section with title and subtitle */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Recipe Collection
          <span className="inline-block ml-2">
            <Image src="/assets/sparkles.svg" alt="Sparkles" width={40} height={40} className="inline-block" />
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore 1000+ recipes curated by our global culinary community
        </p>
      </div>

      {/* Client component for interactive features */}
      <RecipesPageContent />
    </div>
  )
} 