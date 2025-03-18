# Provider Pattern

This folder contains the implementation of a scalable provider pattern using React Context API and a reducer approach to combine multiple providers.

## Structure

- `app-provider.tsx` - Main app provider that wraps the application
- `provider-composer.tsx` - Utility to compose multiple providers together using `reduceRight`
- `contexts/` - Directory containing individual context providers
  - `user-provider.tsx` - User related state and operations
  - `menu-provider.tsx` - Menu related state and operations
  - `swipe-provider.tsx` - Swipe related state and operations
  - `types.ts` - Shared types for all contexts
  - `index.ts` - Exports for all contexts and their hooks
- `index.ts` - Main exports for the provider pattern

## Usage

### Wrapping the application

```tsx
// In your layout.tsx or app.tsx
import { AppProvider } from '@/providers'

export default function Layout({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  )
}
```

### Using context hooks in components

```tsx
import { useUser, useMenu, useSwipe } from '@/providers'

export function MyComponent() {
  const { user, updateUserProfile } = useUser()
  const { activeMenu, createMenu } = useMenu()
  const { swipeOnDish } = useSwipe()
  
  // Use the context values and methods
}
```

### Compatibility Layer

For backward compatibility with existing code that uses the `useApp` hook, we provide a compatibility layer that combines all the separate hooks:

```tsx
import { useApp } from '@/providers'

export function LegacyComponent() {
  const { 
    user,            // From useUser
    activeMenu,      // From useMenu
    swipeOnDish      // From useSwipe
  } = useApp()
  
  // Use the combined context
}
```

This allows for gradual migration from the monolithic context to the separated contexts.

### Adding a new provider

1. Create a new provider file in the `contexts` directory
2. Export the provider and hook from the file
3. Add exports to `contexts/index.ts`
4. Add the provider to the array in `provider-composer.tsx`
5. Update the types in `contexts/types.ts`

### Creating a custom provider composition

For cases where you only need specific providers:

```tsx
import { createProviderComposition } from '@/providers/provider-composer'
import { UserProvider, MenuProvider } from '@/providers/contexts'

// Create a custom composition with just user and menu providers
const CustomProviders = createProviderComposition([UserProvider, MenuProvider])

export function MyFeature({ children }) {
  return (
    <CustomProviders>
      {children}
    </CustomProviders>
  )
}
```

## Benefits

- **Separation of concerns**: Each provider focuses on a specific domain
- **Type safety**: Comprehensive TypeScript type definitions
- **Scalability**: Easy to add new providers without modifying existing code
- **Performance**: Only re-renders components that consume changed contexts
- **Cleanliness**: Avoids prop drilling and keeps component code clean 