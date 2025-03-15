"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import ItemCard from "@/components/item-card";
import { Filter, Search, Loader2 } from "lucide-react";
import { useFirestore } from "@/hooks/use-firestore";
import type { ItemType } from "@/types/item";
import { useAuth } from "@/hooks/use-auth";

export default function BrowsePage() {
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { getItems } = useFirestore();
  const { canBrowseAndBuy } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial filter values from URL
  const initialCategory = searchParams.get("category") || "all";
  const initialCondition = searchParams.get("condition") || "all";
  const initialType = searchParams.get("type") || "all";

  const [filters, setFilters] = useState({
    category: initialCategory,
    condition: initialCondition,
    type: initialType,
  });

  // Check access and redirect if not authorized
  useEffect(() => {
    if (!canBrowseAndBuy()) {
      router.push("/");
    }
  }, [canBrowseAndBuy, router]);

  // Load items with filters
  useEffect(() => {
    const loadItems = async () => {
      if (!canBrowseAndBuy()) return;

      setIsLoading(true);
      try {
        const options: any = {
          maxPrice: priceRange[1],
        };

        if (filters.category !== "all") {
          options.category = filters.category;
        }

        if (filters.condition !== "all") {
          options.condition = filters.condition;
        }

        if (filters.type === "free") {
          options.isFree = true;
        }

        const fetchedItems = await getItems(options);

        // Apply search filter client-side
        let filteredItems = fetchedItems;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredItems = fetchedItems.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query) ||
              item.category.toLowerCase().includes(query)
          );
        }

        setItems(filteredItems);
      } catch (error) {
        console.error("Error loading items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [filters, priceRange, searchQuery, getItems, canBrowseAndBuy]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.condition !== "all") params.set("condition", filters.condition);
    if (filters.type !== "all") params.set("type", filters.type);

    const newUrl = `/browse${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl);
  }, [filters, router]);

  const handleApplyFilters = () => {
    setFilters({ ...filters });
  };

  if (!canBrowseAndBuy()) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Items</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div
          className={`w-full md:w-64 space-y-6 ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Filters</h3>

                <div className="space-y-2">
                  <label className="text-sm">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters({ ...filters, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Price Range</label>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[0, 10000]}
                      max={20000}
                      step={500}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value)}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>₦{priceRange[0].toLocaleString()}</span>
                    <span>₦{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Condition</label>
                  <Select
                    value={filters.condition}
                    onValueChange={(value) =>
                      setFilters({ ...filters, condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Item Type</label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="free">Free Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Items */}
        <div className="flex-1 space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
