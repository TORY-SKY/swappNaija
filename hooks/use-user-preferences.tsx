"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"

interface UserPreferences {
  theme: "light" | "dark" | "system"
  // Add other preferences as needed
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        let loadedPreferences: UserPreferences = {
          theme: "system",
        }

        // Try to load from localStorage first
        const localPrefs = localStorage.getItem("userPreferences")
        if (localPrefs) {
          loadedPreferences = { ...loadedPreferences, ...JSON.parse(localPrefs) }
        }

        // If user is logged in, try to load from Firestore
        if (user) {
          try {
            const { getFirestore, doc, getDoc } = await import("firebase/firestore")
            const { getApp } = await import("firebase/app")

            const app = getApp()
            const db = getFirestore(app)

            const prefsDoc = await getDoc(doc(db, "userPreferences", user.uid))

            if (prefsDoc.exists()) {
              const firestorePrefs = prefsDoc.data() as UserPreferences
              // Merge with local preferences, prioritizing Firestore
              loadedPreferences = { ...loadedPreferences, ...firestorePrefs }
            } else if (localPrefs) {
              // If no Firestore prefs but we have local prefs, save them to Firestore
              savePreferencesToFirestore(JSON.parse(localPrefs))
            }
          } catch (error) {
            console.error("Error loading preferences from Firestore:", error)
          }
        }

        setPreferences(loadedPreferences)
      } catch (error) {
        console.error("Failed to load preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  // Save preferences
  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences }

      // Save to localStorage
      localStorage.setItem("userPreferences", JSON.stringify(updatedPreferences))

      // Save to Firestore if user is logged in
      if (user) {
        savePreferencesToFirestore(updatedPreferences)
      }

      setPreferences(updatedPreferences)
      return true
    } catch (error) {
      console.error("Failed to save preferences:", error)
      return false
    }
  }

  const savePreferencesToFirestore = async (prefs: UserPreferences) => {
    if (!user) return

    try {
      const { getFirestore, doc, setDoc } = await import("firebase/firestore")
      const { getApp } = await import("firebase/app")

      const app = getApp()
      const db = getFirestore(app)

      await setDoc(doc(db, "userPreferences", user.uid), prefs)
      console.log("Preferences saved to Firestore")
    } catch (error) {
      console.error("Error saving preferences to Firestore:", error)
    }
  }

  return {
    preferences,
    isLoading,
    savePreferences,
  }
}

