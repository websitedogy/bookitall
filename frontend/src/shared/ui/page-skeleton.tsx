export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-1 py-4" aria-busy="true" aria-live="polite">
      <div className="h-4 w-24 rounded-full bg-[var(--border)]" />
      <div className="mt-4 h-10 w-2/3 max-w-md rounded-2xl bg-[var(--border)]" />
      <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-[var(--border)]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-[1.6rem] ring-1 ring-[var(--border)]">
            <div className="h-40 bg-[var(--border)]" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-20 rounded-full bg-[var(--border)]" />
              <div className="h-5 w-3/4 rounded-full bg-[var(--border)]" />
              <div className="h-3 w-1/2 rounded-full bg-[var(--border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
