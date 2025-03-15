"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Package, Heart, ShoppingCart, User, Menu, X, Sun, Moon, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { cartItems } = useCart()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/browse",
      label: "Browse",
      icon: Search,
      active: pathname === "/browse",
    },
    {
      href: "/sell",
      label: "Sell",
      icon: Package,
      active: pathname === "/sell",
    },
    {
      href: "/saved",
      label: "Saved",
      icon: Heart,
      active: pathname === "/saved",
    },
  ]

  return (
    <header className="sticky top-0 z-50 glass-panel border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">SwapNaira</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggler */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:flex"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                  {cartItems.length}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          {/* User/Auth */}
          {user ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link href="/auth/sign-in">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-panel">
              <div className="flex flex-col space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2">
                    <Package className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">SwapNaira</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </SheetClose>
                </div>

                <div className="flex flex-col space-y-3 pt-4">
                  {routes.map((route) => (
                    <SheetClose asChild key={route.href}>
                      <Link
                        href={route.href}
                        className={cn(
                          "flex items-center space-x-3 px-2 py-3 text-sm font-medium rounded-md hover:bg-primary/10",
                          route.active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                        )}
                      >
                        <route.icon className="h-5 w-5" />
                        <span>{route.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="border-t pt-4">
                  {user ? (
                    <SheetClose asChild>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-2 py-3 text-sm font-medium rounded-md hover:bg-primary/10"
                      >
                        <User className="h-5 w-5" />
                        <span>My Profile</span>
                      </Link>
                    </SheetClose>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href="/auth/sign-in"
                        className="flex items-center space-x-3 px-2 py-3 text-sm font-medium rounded-md hover:bg-primary/10"
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </Link>
                    </SheetClose>
                  )}

                  <div
                    className="flex items-center space-x-3 px-2 py-3 text-sm font-medium rounded-md hover:bg-primary/10"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-5 w-5" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-5 w-5" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

