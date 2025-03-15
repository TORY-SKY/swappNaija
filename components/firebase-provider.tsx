"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
// Import the centralized Firebase config
import { firebaseConfig, isFirebaseConfigValid } from "@/lib/firebase-config";
import type { UserProfile } from "@/types/user";
import { initializeApp, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "buyer" | "seller" | "both";
}

// Create Firebase context
interface FirebaseContextType {
  user: UserData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  updateBankDetails: (bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  }) => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserData | null>;
}

export const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// Firebase app instance
let firebaseInitialized = false;
let auth: any = null;
let db: any = null;
let storage: any = null;
let googleProvider: any = null;

export default function FirebaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize Firebase
  useEffect(() => {
    try {
      getApp();
    } catch {
      initializeApp(firebaseConfig);
    }

    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence); // Enable persistent sessions

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.data();

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userData?.role || "buyer", // Default to buyer if no role is set
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string): Promise<UserData | null> => {
    if (!db) return null;

    try {
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        return { ...userDoc.data(), uid: userId } as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, role: string) => {
    const auth = getAuth();
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Store additional user data in Firestore
    const db = getFirestore();
    await setDoc(doc(db, "users", firebaseUser.uid), {
      email: firebaseUser.email,
      role: role,
      createdAt: new Date(),
    });
  };

  const signOut = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const { user: firebaseUser } = await signInWithPopup(auth, provider);

    // Check if user exists in Firestore
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      // First time Google sign-in, create user document
      await setDoc(doc(db, "users", firebaseUser.uid), {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: "buyer", // Default role for Google sign-in
        createdAt: new Date(),
      });
    }
  };

  const resetPassword = async (email: string) => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Error resetting password:", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/configuration-not-found") {
        throw new Error(
          "Authentication configuration not found. Please check your Firebase setup."
        );
      } else if (error.code === "auth/user-not-found") {
        throw new Error("No user found with this email address.");
      } else {
        throw new Error(error.message || "Failed to send password reset email");
      }
    }
  };

  const updateUserProfile = async (data: Partial<UserData>) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !db) {
      console.log("Auth not initialized or no current user, using demo mode");
      return;
    }

    try {
      const { updateProfile } = await import("firebase/auth");
      const { doc, updateDoc, setDoc } = await import("firebase/firestore");

      // Update auth profile if displayName or photoURL is provided
      if (data.displayName || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL,
        });
        console.log("Auth profile updated");
      }

      // Update Firestore document
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, data, { merge: true });
      console.log("Firestore profile updated");

      // Update local state
      if (user) {
        setUser({ ...user, ...data });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update profile");
    }
  };

  const updateBankDetails = async (bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  }) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !db) {
      console.log("Auth not initialized or no current user, using demo mode");
      return;
    }

    try {
      const { doc, setDoc } = await import("firebase/firestore");

      // Update Firestore document with bank details
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { bankDetails }, { merge: true });
      console.log("Bank details updated");

      // Update local state
      if (user) {
        setUser({ ...user, bankDetails });
      }

      // In a real app, you would also create a Paystack recipient here
      // and store the recipient code
    } catch (error) {
      console.error("Error updating bank details:", error);
      throw new Error("Failed to update bank details");
    }
  };

  const getUserProfile = async (userId: string): Promise<UserData | null> => {
    return await fetchUserProfile(userId);
  };

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
  );
}
