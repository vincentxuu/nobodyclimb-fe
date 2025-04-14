"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from '@/components/shared/page-transition';
import SearchResults from '@/components/search/search-results';
import SearchFilters from '@/components/search/search-filters';

function SearchContent() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-8 pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <SearchFilters />
        <SearchResults />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>
              <div className="grid gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
    </PageTransition>
  );
}