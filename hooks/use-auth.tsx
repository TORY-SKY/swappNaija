"use client";

import { useContext } from "react";
import { FirebaseContext } from "@/components/firebase-provider";

export function useAuth() {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error("useAuth must be used within a FirebaseProvider");
  }

  const { user, isLoading } = context;

  // Helper functions to check user roles
  const isBuyer = () => user?.role === "buyer" || user?.role === "both";
  const isSeller = () => user?.role === "seller" || user?.role === "both";
  const canListItems = () => isSeller();
  const canBrowseAndBuy = () => isBuyer();

  return {
    ...context,
    isBuyer,
    isSeller,
    canListItems,
    canBrowseAndBuy,
  };
}
