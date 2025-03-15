"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { firebaseConfig } from "@/lib/firebase-config"

export default function FirebaseDebug() {
  const [showDetails, setShowDetails] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testFirebaseAuth = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Try to initialize Firebase
      const { initializeApp } = await import("firebase/app")
      const { getAuth, signInAnonymously } = await import("firebase/auth")

      // Create a temporary app for testing
      const testApp = initializeApp(firebaseConfig, "testApp")
      const auth = getAuth(testApp)

      // Try anonymous sign in to test auth
      await signInAnonymously(auth)

      setTestResult("✅ Firebase Authentication is working correctly!")
    } catch (error: any) {
      console.error("Firebase test error:", error)
      setTestResult(`❌ Error: ${error.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Firebase Debug</CardTitle>
        <CardDescription>Troubleshoot your Firebase configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">Configuration Status</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          </div>

          {showDetails && (
            <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
              <p>authDomain: {firebaseConfig.authDomain || "Not set"}</p>
              <p>projectId: {firebaseConfig.projectId || "Not set"}</p>
              <p>storageBucket: {firebaseConfig.storageBucket || "Not set"}</p>
              <p>databaseURL: {firebaseConfig.databaseURL || "Not set"}</p>
              <p>messagingSenderId: {firebaseConfig.messagingSenderId || "Not set"}</p>
              <p>API Key: {firebaseConfig.apiKey ? "Set (hidden)" : "Not set"}</p>
              <p>App ID: {firebaseConfig.appId ? "Set (hidden)" : "Not set"}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Test Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Click the button below to test if your Firebase Authentication is configured correctly.
          </p>
          <Button onClick={testFirebaseAuth} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? "Testing..." : "Test Firebase Auth"}
          </Button>

          {testResult && (
            <div
              className={`p-3 rounded-md text-sm ${testResult.startsWith("✅") ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
            >
              {testResult}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          If you're experiencing issues with Firebase Authentication, make sure your Firebase project has Authentication
          enabled and the correct domains are whitelisted.
        </p>
      </CardFooter>
    </Card>
  )
}

