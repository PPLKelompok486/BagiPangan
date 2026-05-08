/**
 * Shared loading-state skeletons for donation card grids.
 *
 * Used by donor dashboard, donor donations list, and receiver dashboard.
 */

export function DonationCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--brand-100)] bg-white h-44" />
  );
}

type GridProps = {
  count?: number;
  className?: string;
};

export function DonationSkeletonGrid({
  count = 6,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
}: GridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <DonationCardSkeleton key={i} />
      ))}
    </div>
  );
}
