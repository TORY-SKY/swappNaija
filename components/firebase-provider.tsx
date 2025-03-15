"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
// Import the centralized Firebase config
import { firebaseConfig, isFirebaseConfigValid } from "@/lib/firebase-config"
import type { UserProfile } from "@/types/user"

// Create Firebase context
interface FirebaseContextType {
  user: UserProfile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userType: string, userData?: Partial<UserProfile>) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
  updateBankDetails: (bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
  }) => Promise<void>
  getUserProfile: (userId: string) => Promise<UserProfile | null>
}

export const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  updateBankDetails: async () => {},
  getUserProfile: async () => null,
})

// Firebase app instance
let firebaseInitialized = false
let auth: any = null
let db: any = null
let storage: any = null
let googleProvider: any = null

export default function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Initialize Firebase
  useEffect(() => {
    const initializeFirebase = async () => {
      if (firebaseInitialized) return

      try {
        // Dynamically import Firebase modules
        const { initializeApp } = await import("firebase/app")
        const { getAuth, onAuthStateChanged, GoogleAuthProvider } = await import("firebase/auth")
        const { getFirestore } = await import("firebase/firestore")
        const { getStorage } = await import("firebase/storage")

        // Check if Firebase config is valid
        if (!isFirebaseConfigValid()) {
          throw new Error("Firebase configuration is incomplete")
        }

        // Initialize Firebase
        const app = initializeApp(firebaseConfig)
        auth = getAuth(app)
        db = getFirestore(app)
        storage = getStorage(app)
        googleProvider = new GoogleAuthProvider()

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
          if (authUser) {
            // User is signed in
            console.log("User is signed in:", authUser.uid)

            try {
              // Get additional user data from Firestore
              const userProfile = await fetchUserProfile(authUser.uid)

              if (userProfile) {
                // Combine auth user with Firestore profile
                setUser({
                  ...userProfile,
                  uid: authUser.uid,
                  email: authUser.email || userProfile.email,
                  displayName: authUser.displayName || userProfile.displayName,
                  photoURL: authUser.photoURL || userProfile.photoURL,
                })
              } else {
                // If no profile exists, use basic auth data
                setUser({
                  uid: authUser.uid,
                  email: authUser.email || "",
                  displayName: authUser.displayName || "",
                  photoURL: authUser.photoURL || "",
                  userType: "buyer", // Default
                  createdAt: new Date(),
                })
              }

              // Update last login
              updateUserLastLogin(authUser.uid)
            } catch (error) {
              console.error("Error fetching user profile:", error)
              setUser({
                uid: authUser.uid,
                email: authUser.email || "",
                displayName: authUser.displayName || "",
                photoURL: authUser.photoURL || "",
                userType: "buyer", // Default
                createdAt: new Date(),
              })
            }
          } else {
            // User is signed out
            console.log("User is signed out")
            setUser(null)
          }
          setIsLoading(false)
        })

        firebaseInitialized = true
        console.log("Firebase initialized successfully")

        return () => unsubscribe()
      } catch (error) {
        console.error("Error initializing Firebase:", error)

        // For demo purposes, create a mock user
        setUser(null)
        setIsLoading(false)

        // Show error toast
        toast({
          title: "Firebase Error",
          description: "Using demo mode due to Firebase initialization error. Check your configuration.",
          variant: "destructive",
        })
      }
    }

    initializeFirebase()
  }, [toast])

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!db) return null

    try {
      const { doc, getDoc } = await import("firebase/firestore")
      const userDoc = await getDoc(doc(db, "users", userId))

      if (userDoc.exists()) {
        return { ...userDoc.data(), uid: userId } as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    if (!auth) {
      console.log("Auth not initialized, using demo mode")
      // For demo purposes, simulate sign in
      setUser({
        uid: "demo-user-id",
        email: email,
        displayName: email.split("@")[0],
        photoURL: null,
        userType: "both",
        createdAt: new Date(),
      })
      return
    }

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("User signed in successfully:", result.user.uid)

      // User profile will be fetched by the auth state listener
    } catch (error: any) {
      console.error("Error signing in:", error)

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        throw new Error("Authentication configuration not found. Please check your Firebase setup.")
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Invalid email or password. Please try again.")
      } else {
        throw new Error(error.message || "Failed to sign in")
      }
    }
  }

  const signUp = async (email: string, password: string, userType: string, userData?: Partial<UserProfile>) => {
    if (!auth || !db) {
      console.log("Auth or Firestore not initialized, using demo mode")
      // For demo purposes, simulate sign up
      setUser({
        uid: "demo-user-id",
        email: email,
        displayName: email.split("@")[0],
        photoURL: null,
        userType: userType as "buyer" | "seller" | "both",
        createdAt: new Date(),
      })
      return
    }

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid
      console.log("User account created:", userId)

      // Set display name
      const displayName = userData?.displayName || email.split("@")[0]
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: userData?.photoURL || null,
      })

      // Store additional user data in Firestore
      const userProfile: UserProfile = {
        uid: userId,
        email,
        displayName,
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        phoneNumber: userData?.phoneNumber || "",
        photoURL: userData?.photoURL || null,
        userType: (userType as "buyer" | "seller" | "both") || "buyer",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isVerified: false,
        ...userData,
      }

      await setDoc(doc(db, "users", userId), userProfile)
      console.log("User data stored in Firestore")
    } catch (error: any) {
      console.error("Error signing up:", error)

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        throw new Error("Authentication configuration not found. Please check your Firebase setup.")
      } else if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already in use. Try signing in instead.")
      } else {
        throw new Error(error.message || "Failed to create account")
      }
    }
  }

  const signOut = async () => {
    if (!auth) {
      console.log("Auth not initialized, using demo mode")
      // For demo purposes, simulate sign out
      setUser(null)
      return
    }

    try {
      const { signOut } = await import("firebase/auth")
      await signOut(auth)
      console.log("User signed out successfully")
    } catch (error: any) {
      console.error("Error signing out:", error)
      throw new Error(error.message || "Failed to sign out")
    }
  }

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      console.log("Auth or Google provider not initialized, using demo mode")
      // For demo purposes, simulate Google sign in
      setUser({
        uid: "google-demo-user-id",
        email: "demo.user@gmail.com",
        displayName: "Demo Google User",
        photoURL: null,
        userType: "buyer",
        createdAt: new Date(),
      })
      return
    }

    try {
      const { signInWithPopup } = await import("firebase/auth")
      const { doc, setDoc, getDoc, serverTimestamp } = await import("firebase/firestore")

      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log("User signed in with Google:", user.uid)

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))

      // If user doesn't exist, create a new document
      if (!userDoc.exists()) {
        console.log("Creating new user document for Google user")

        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL,
          userType: "buyer", // Default for new users
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isVerified: false,
        }

        await setDoc(doc(db, "users", user.uid), userProfile)
      } else {
        // Update last login and photoURL if it has changed
        const userData = userDoc.data() as UserProfile
        const updates: any = { lastLogin: serverTimestamp() }

        if (user.photoURL && user.photoURL !== userData.photoURL) {
          updates.photoURL = user.photoURL
        }

        await setDoc(doc(db, "users", user.uid), updates, { merge: true })
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error)

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        throw new Error("Authentication configuration not found. Please check your Firebase setup.")
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in popup was closed before completing the sign in.")
      } else {
        throw new Error(error.message || "Failed to sign in with Google")
      }
    }
  }

  const resetPassword = async (email: string) => {
    if (!auth) {
      console.log("Auth not initialized, using demo mode")
      // For demo purposes, simulate password reset
      return
    }

    try {
      const { sendPasswordResetEmail } = await import("firebase/auth")
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent to:", email)
    } catch (error: any) {
      console.error("Error resetting password:", error)

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        throw new Error("Authentication configuration not found. Please check your Firebase setup.")
      } else if (error.code === "auth/user-not-found") {
        throw new Error("No user found with this email address.")
      } else {
        throw new Error(error.message || "Failed to send password reset email")
      }
    }
  }

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!auth?.currentUser || !db) {
      console.log("Auth not initialized or no current user, using demo mode")
      return
    }

    try {
      const { updateProfile } = await import("firebase/auth")
      const { doc, updateDoc, setDoc } = await import("firebase/firestore")

      const currentUser = auth.currentUser

      // Update auth profile if displayName or photoURL is provided
      if (data.displayName || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL,
        })
        console.log("Auth profile updated")
      }

      // Update Firestore document
      const userRef = doc(db, "users", currentUser.uid)
      await setDoc(userRef, data, { merge: true })
      console.log("Firestore profile updated")

      // Update local state
      if (user) {
        setUser({ ...user, ...data })
      }
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw new Error("Failed to update profile")
    }
  }

  const updateBankDetails = async (bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
  }) => {
    if (!auth?.currentUser || !db) {
      console.log("Auth not initialized or no current user, using demo mode")
      return
    }

    try {
      const { doc, setDoc } = await import("firebase/firestore")

      const currentUser = auth.currentUser

      // Update Firestore document with bank details
      const userRef = doc(db, "users", currentUser.uid)
      await setDoc(userRef, { bankDetails }, { merge: true })
      console.log("Bank details updated")

      // Update local state
      if (user) {
        setUser({ ...user, bankDetails })
      }

      // In a real app, you would also create a Paystack recipient here
      // and store the recipient code
    } catch (error) {
      console.error("Error updating bank details:", error)
      throw new Error("Failed to update bank details")
    }
  }

  const updateUserLastLogin = async (userId: string) => {
    if (!db) return

    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      })
      console.log("Updated last login timestamp")
    } catch (error) {
      console.error("Error updating last login:", error)
    }
  }

  const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    return await fetchUserProfile(userId)
  }

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        updateUserProfile,
        updateBankDetails,
        getUserProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

