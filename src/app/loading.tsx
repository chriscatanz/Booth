export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand-purple" />
        <p className="text-sm text-text-secondary">Loading Booth...</p>
      </div>
    </div>
  );
}
