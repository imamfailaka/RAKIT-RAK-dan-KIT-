export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line-strong p-10 text-center text-muted">
      {message}
    </div>
  );
}
