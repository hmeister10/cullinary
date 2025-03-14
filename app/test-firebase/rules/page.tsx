"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function FirestoreRulesPage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Firestore Security Rules Guide</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>Current Issue</h2>
          <p>
            You&apos;re seeing a &quot;Missing or insufficient permissions&quot; error because your Firestore database is in production mode, 
            which by default blocks all read and write operations unless you&apos;ve configured specific security rules.
          </p>

          <h2>How to Fix</h2>
          <ol>
            <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
            <li>Select your project</li>
            <li>Navigate to &quot;Firestore Database&quot; in the left sidebar</li>
            <li>Click on the &quot;Rules&quot; tab</li>
            <li>Replace the current rules with the following:</li>
          </ol>

          <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
            <code>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // For testing only - allow all operations
    // WARNING: This is insecure and should be replaced with proper rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</code>
          </pre>

          <p>Click &quot;Publish&quot; to apply the rules</p>

          <h2>Secure Rules for Production</h2>
          <p>
            For a real production app, you should use more secure rules. Here&apos;s an example of more secure rules for this app:
          </p>

          <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
            <code>{`rules_version = '2';
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
}`}</code>
          </pre>

          <h2>Testing Mode</h2>
          <p>
            For development and testing, you can also use the Firebase Local Emulator Suite. This allows you to test your app without affecting your production Firestore database.
          </p>

          <ol>
            <li>Install the Firebase CLI: <code>npm install -g firebase-tools</code></li>
            <li>Initialize Firebase in your project: <code>firebase init</code></li>
            <li>Start the emulator: <code>firebase emulators:start</code></li>
            <li>Update your code to connect to the emulator:</li>
          </ol>

          <pre className="bg-secondary p-4 rounded-md overflow-x-auto">
            <code>{`// In your firebase.ts file
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}`}</code>
          </pre>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/test-firebase">Back to Firebase Test</Link>
          </Button>
          <Button onClick={() => window.open("https://console.firebase.google.com/", "_blank")}>
            Open Firebase Console
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 