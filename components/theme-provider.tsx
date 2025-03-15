"use client"

import { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useUserPreferences } from "@/hooks/use-user-preferences"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const { preferences, savePreferences } = useUserPreferences()

  // Set the theme from user preferences
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle theme changes
  const handleThemeChange = (theme: string) => {
    savePreferences({ theme: theme as "light" | "dark" | "system" })
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider {...props} defaultTheme={preferences.theme} onValueChange={handleThemeChange}>
      {children}
    </NextThemesProvider>
  )
}

