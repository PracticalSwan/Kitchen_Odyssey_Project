// LoadingSkeleton - Skeleton loading states for recipe grid, profile, and admin stats
import React from 'react';

// Reusable skeleton block with pulse animation
function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded bg-warm-gray-20 ${className}`.trim()} />;
}

// Recipe grid skeleton - matches RecipeCard layout with image, title, and metadata
export function RecipeGridSkeleton({ count = 10 }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-warm-gray-20 p-2">
          {/* Image placeholder */}
          <SkeletonBlock className="h-28 w-full" />
          {/* Title placeholder */}
          <SkeletonBlock className="h-4 w-3/4" />
          {/* Metadata placeholder */}
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Profile page skeleton - header banner, title, and recipe grid
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Banner placeholder */}
      <SkeletonBlock className="h-24 w-full" />
      {/* Title/name placeholder */}
      <SkeletonBlock className="h-10 w-40" />
      {/* Recipe grid placeholder */}
      <RecipeGridSkeleton count={5} />
    </div>
  );
}

// Admin stats skeleton - four stat cards and main chart area
export function AdminStatsSkeleton() {
  return (
    <div className="space-y-3">
      {/* Four stat cards in a responsive grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 w-full" />
        ))}
      </div>
      {/* Main chart/table placeholder */}
      <SkeletonBlock className="h-56 w-full" />
    </div>
  );
}
