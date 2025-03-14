"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { db, isFirebaseAvailable } from "@/lib/firebase"
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp } from "firebase/firestore"
import { FirebaseError } from "firebase/app"
import Link from "next/link"

// Define a type for the Firebase config status
interface FirebaseConfigStatus {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export default function TestFirebasePage() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigStatus | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean>(false)

  useEffect(() => {
    // Check if Firebase is available on component mount
    setIsAvailable(isFirebaseAvailable())
  }, [])

  // Test writing to Firestore
  const testFirestoreWrite = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult("")
    
    if (!isAvailable || !db) {
      setError("Firebase is not properly configured. Please check your environment variables.")
      setIsLoading(false)
      return
    }
    
    try {
      // Log the actual Firebase config values (except sensitive ones)
      console.log("Using Firebase config:", {
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        // Don't log API keys or other sensitive values
      });
      
      // Create a test document
      const testId = `test_${Date.now()}`
      const testData = {
        id: testId,
        message: "Test successful",
        timestamp: serverTimestamp()
      }
      
      console.log(`Attempting to write document with ID: ${testId}`);
      
      // Write to Firestore
      await setDoc(doc(db, "test_collection", testId), testData)
      
      console.log(`Document written successfully, now reading it back`);
      
      // Read back from Firestore
      const docRef = doc(db, "test_collection", testId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        setTestResult(`Successfully wrote and read from Firestore. Document ID: ${testId}`)
      } else {
        setError("Document was written but could not be read back")
      }
    } catch (err) {
      console.error("Error testing Firestore:", err)
      
      // Log more detailed error information
      if (err instanceof FirebaseError) {
        console.error("Firebase Error Details:", {
          code: err.code,
          message: err.message,
          customData: err.customData,
          stack: err.stack
        });
        
        // Handle Firebase-specific errors
        if (err.code === 'permission-denied') {
          setError(`Permission Denied: Your Firestore database is in production mode and requires security rules.
          
Go to your Firebase Console → Firestore Database → Rules and update them to:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: For testing only!
    }
  }
}`)
        } else {
          setError(`Firebase Error (${err.code}): ${err.message}`)
        }
      } else {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Check Firebase configuration
  const checkFirebaseConfig = () => {
    // Log the actual values for debugging
    console.log("Actual Firebase Config Values:", {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      // Don't log sensitive values
    });
    
    setFirebaseConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "✅ Set" : "❌ Missing",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✅ Set" : "❌ Missing"
    })
  }

  // List all documents in test collection
  const listTestDocuments = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult("")
    
    if (!isAvailable || !db) {
      setError("Firebase is not properly configured. Please check your environment variables.")
      setIsLoading(false)
      return
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, "test_collection"))
      let results = "Documents in test_collection:\n"
      
      if (querySnapshot.empty) {
        results = "No documents found in test_collection"
      } else {
        querySnapshot.forEach((doc) => {
          results += `- ${doc.id}: ${JSON.stringify(doc.data())}\n`
        })
      }
      
      setTestResult(results)
    } catch (err) {
      console.error("Error listing documents:", err)
      
      // Handle Firebase-specific errors
      if (err instanceof FirebaseError) {
        if (err.code === 'permission-denied') {
          setError(`Permission Denied: Your Firestore database is in production mode and requires security rules.
          
Go to your Firebase Console → Firestore Database → Rules and update them to:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: For testing only!
    }
  }
}`)
        } else {
          setError(`Firebase Error (${err.code}): ${err.message}`)
        }
      } else {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to your component
  const testCORS = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult("");
    
    try {
      // Create a direct fetch to the Firestore API
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/test_collection`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        setTestResult(`CORS check successful: ${response.status}`);
      } else {
        setError(`CORS check failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setError(`CORS Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Firebase Firestore Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className={`p-4 rounded-md ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              <h3 className="font-bold mb-2">Firebase Status:</h3>
              <p>{isAvailable ? "✅ Firebase is properly configured and available" : "⚠️ Firebase is not properly configured"}</p>
              {!isAvailable && (
                <p className="text-sm mt-2">
                  You need to set up your Firebase project and add the configuration to .env.local file.
                </p>
              )}
            </div>
            
            <Button onClick={checkFirebaseConfig} variant="outline">
              Check Firebase Config
            </Button>
            
            {firebaseConfig && (
              <div className="bg-secondary p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                <h3 className="font-bold mb-2">Firebase Config Status:</h3>
                {Object.entries(firebaseConfig).map(([key, value]) => (
                  <div key={key}>
                    {key}: {value as string}
                  </div>
                ))}
              </div>
            )}
            
            <Button onClick={testFirestoreWrite} disabled={isLoading || !isAvailable}>
              {isLoading ? "Testing..." : "Test Firestore Write"}
            </Button>
            
            <Button onClick={listTestDocuments} disabled={isLoading || !isAvailable} variant="secondary">
              List Test Documents
            </Button>
            
            <Button onClick={testCORS} disabled={isLoading || !isAvailable} variant="outline">
              Test CORS
            </Button>
            
            {error && (
              <div className="bg-destructive/20 text-destructive p-4 rounded-md">
                <h3 className="font-bold mb-2">Error:</h3>
                <p className="whitespace-pre-wrap">{error}</p>
              </div>
            )}
            
            {testResult && (
              <div className="bg-primary/20 text-primary p-4 rounded-md">
                <h3 className="font-bold mb-2">Result:</h3>
                <p className="whitespace-pre-wrap">{testResult}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={() => window.open("https://console.firebase.google.com/", "_blank")} variant="secondary" className="w-full">
            Open Firebase Console
          </Button>
          <Link href="/test-firebase/rules" className="text-sm text-center text-primary hover:underline">
            View Firestore Security Rules Guide
          </Link>
          <Button onClick={() => window.history.back()} variant="outline" className="w-full">
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 