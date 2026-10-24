export default function Skeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Memuat...</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-[14px] bg-surface-alt" />
      ))}
    </div>
  );
}
