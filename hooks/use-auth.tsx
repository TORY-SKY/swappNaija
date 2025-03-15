"use client"

import { useContext } from "react"
import { FirebaseContext } from "@/components/firebase-provider"

export function useAuth() {
  const context = useContext(FirebaseContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within a FirebaseProvider")
  }

  return context
}

