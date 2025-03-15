"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isFirebaseConfigValid } from "@/lib/firebase-config"

export default function FirebaseStatus() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // First check if config is valid
        if (!isFirebaseConfigValid()) {
          setStatus("error")
          setMessage("Firebase configuration is incomplete. Some features may not work properly.")
          return
        }

        // Try to initialize Firebase
        try {
          const { getApp } = await import("firebase/app")
          getApp() // This will throw if no app is initialized

          // Test auth
          const { getAuth } = await import("firebase/auth")
          getAuth()

          // If we get here, Firebase is working
          setStatus("success")
          setMessage("Firebase is properly configured and working.")
        } catch (error) {
          console.error("Firebase initialization error:", error)
          setStatus("error")
          setMessage("Firebase initialization failed. Using demo mode.")
        }
      } catch (error) {
        console.error("Error checking Firebase:", error)
        setStatus("error")
        setMessage("Error checking Firebase status. Using demo mode.")
      }
    }

    checkFirebase()
  }, [])

  if (status === "loading") {
    return null
  }

  return (
    <Alert variant={status === "success" ? "default" : "destructive"} className="mb-6">
      {status === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>{status === "success" ? "Firebase Connected" : "Firebase Error"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

