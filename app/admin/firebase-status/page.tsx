"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { Icons } from "@/components/icons"
import FirebaseStatus from "@/components/firebase-status"
import FirebaseDebug from "@/components/firebase-debug"
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export default function FirebaseStatusPage() {
  const { user, isLoading } = useAuth()
  const [firebaseModules, setFirebaseModules] = useState<
    {
      name: string
      status: "loading" | "success" | "error"
      message?: string
    }[]
  >([
    { name: "Configuration", status: "loading" },
    { name: "Authentication", status: "loading" },
    { name: "Firestore", status: "loading" },
    { name: "Storage", status: "loading" },
  ])

  useEffect(() => {
    const checkFirebaseModules = async () => {
      // Check configuration
      const configStatus = isFirebaseConfigValid()
        ? { status: "success" as const, message: "Valid configuration found" }
        : { status: "error" as const, message: "Incomplete configuration" }

      updateModuleStatus("Configuration", configStatus.status, configStatus.message)

      // If config is invalid, mark all other modules as error
      if (!configStatus.status) {
        updateModuleStatus("Authentication", "error", "Cannot initialize due to config issues")
        updateModuleStatus("Firestore", "error", "Cannot initialize due to config issues")
        updateModuleStatus("Storage", "error", "Cannot initialize due to config issues")
        return
      }

      // Check Authentication
      try {
        const { getAuth } = await import("firebase/auth")
        const auth = getAuth()
        updateModuleStatus("Authentication", "success", "Authentication is working")
      } catch (error) {
        console.error("Auth check error:", error)
        updateModuleStatus("Authentication", "error", "Failed to initialize Authentication")
      }

      // Check Firestore
      try {
        const { getFirestore, collection, getDocs } = await import("firebase/firestore")
        const db = getFirestore()
        try {
          // Try to fetch a document to verify connection
          await getDocs(collection(db, "test"))
          updateModuleStatus("Firestore", "success", "Firestore is working")
        } catch (error) {
          console.error("Firestore query error:", error)
          updateModuleStatus("Firestore", "error", "Firestore initialized but query failed")
        }
      } catch (error) {
        console.error("Firestore check error:", error)
        updateModuleStatus("Firestore", "error", "Failed to initialize Firestore")
      }

      // Check Storage
      try {
        const { getStorage } = await import("firebase/storage")
        getStorage()
        updateModuleStatus("Storage", "success", "Storage is working")
      } catch (error) {
        console.error("Storage check error:", error)
        updateModuleStatus("Storage", "error", "Failed to initialize Storage")
      }
    }

    checkFirebaseModules()
  }, [])

  const updateModuleStatus = (name: string, status: "loading" | "success" | "error", message?: string) => {
    setFirebaseModules((prev) => prev.map((module) => (module.name === name ? { ...module, status, message } : module)))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Firebase Status</h1>

      <FirebaseStatus />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Firebase Configuration</CardTitle>
            <CardDescription>Check the status of your Firebase services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {firebaseModules.map((module) => (
              <div key={module.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{module.name}</h3>
                  <Badge
                    variant={
                      module.status === "success" ? "default" : module.status === "error" ? "destructive" : "outline"
                    }
                  >
                    {module.status === "loading" ? "Checking..." : module.status === "success" ? "Working" : "Error"}
                  </Badge>
                </div>
                {module.message && <p className="text-sm text-muted-foreground">{module.message}</p>}
                <Separator />
              </div>
            ))}

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                If you're experiencing issues with Firebase, make sure all environment variables are correctly set in
                your Vercel project settings.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>

        <FirebaseDebug />
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Required Firebase configuration variables</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_API_KEY</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Missing"}
              </Badge>
            </li>
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Missing"}
              </Badge>
            </li>
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_PROJECT_ID</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Missing"}
              </Badge>
            </li>
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "Set" : "Missing"}
              </Badge>
            </li>
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "Set" : "Missing"}
              </Badge>
            </li>
            <li className="flex justify-between">
              <span className="font-mono text-sm">NEXT_PUBLIC_FIREBASE_APP_ID</span>
              <Badge variant={process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Set" : "Missing"}
              </Badge>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

