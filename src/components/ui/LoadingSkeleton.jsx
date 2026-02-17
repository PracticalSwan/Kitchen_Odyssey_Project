import React from 'react';

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded bg-warm-gray-20 ${className}`.trim()} />;
}

export function RecipeGridSkeleton({ count = 10 }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-warm-gray-20 p-2">
          <SkeletonBlock className="h-28 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-10 w-40" />
      <RecipeGridSkeleton count={5} />
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 w-full" />
        ))}
      </div>
      <SkeletonBlock className="h-56 w-full" />
    </div>
  );
}
