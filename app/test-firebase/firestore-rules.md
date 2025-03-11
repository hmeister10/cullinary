# Firestore Security Rules Guide

## Current Issue

You're seeing a "Missing or insufficient permissions" error because your Firestore database is in production mode, which by default blocks all read and write operations unless you've configured specific security rules.

## How to Fix

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the current rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For testing only - allow all operations
    // WARNING: This is insecure and should be replaced with proper rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click "Publish" to apply the rules

## Secure Rules for Production

For a real production app, you should use more secure rules. Here's an example of more secure rules for this app:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default: deny all
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow menu participants to read and write to their menus
    match /menus/{menuId} {
      allow read: if request.auth != null && exists(/databases/$(database)/documents/menus/$(menuId)/participants/$(request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                     (resource.data.participants.hasAny([request.auth.uid]) || 
                      request.resource.data.participants.hasAny([request.auth.uid]));
    }
    
    // Allow users to record swipes for menus they participate in
    match /swipes/{swipeId} {
      allow read, write: if request.auth != null && 
                          exists(/databases/$(database)/documents/menus/$(request.resource.data.menu_id)/participants/$(request.auth.uid));
    }
  }
}
```

## Testing Mode

For development and testing, you can also use the Firebase Local Emulator Suite. This allows you to test your app without affecting your production Firestore database.

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase in your project: `firebase init`
3. Start the emulator: `firebase emulators:start`
4. Update your code to connect to the emulator:

```typescript
// In your firebase.ts file
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
``` 