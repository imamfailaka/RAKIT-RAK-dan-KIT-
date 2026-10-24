import Button from "@/components/Button";
import type { Pagination as P } from "@/types/api";

export default function Pagination({ pagination, onChange }: { pagination: P; onChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Halaman">
      <Button variant="secondary" disabled={pagination.current <= 1} onClick={() => onChange(pagination.current - 1)}>
        Sebelumnya
      </Button>
      <span className="text-sm text-muted">
        {pagination.current} / {pagination.totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={pagination.current >= pagination.totalPages}
        onClick={() => onChange(pagination.current + 1)}
      >
        Berikutnya
      </Button>
    </nav>
  );
}
