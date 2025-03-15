"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ItemSwiper from "@/components/item-swiper";
import CategoryFilter from "@/components/category-filter";
import FeaturedItems from "@/components/featured-items";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Home = () => {
  return (
    <div className="container px-4 py-8 mx-auto space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl">
        <div className="glass-panel p-8 md:p-10 rounded-xl relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Buy, Sell, or Give Away Items on{" "}
            <span className="text-primary">SwapNaira</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            A seamless platform for Nigerians to sell, buy, or give away
            pre-loved items at great prices.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button size="lg" asChild>
              <Link href="/browse">Start Browsing</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sell">List an Item</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Browse Categories</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/browse">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CategoryFilter />
      </section>

      {/* Item Swiper */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Discover Items</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/browse">
              See More <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card className="glass-card p-6">
          <ItemSwiper />
        </Card>
      </section>

      {/* Featured Items */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Featured Items</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/browse">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <FeaturedItems />
      </section>
    </div>
  );
};

export default Home;
