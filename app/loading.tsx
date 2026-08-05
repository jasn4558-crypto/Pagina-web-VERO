export default function Loading() {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="h-9 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="aspect-square w-full animate-pulse bg-zinc-200" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="h-6 w-20 animate-pulse rounded bg-zinc-200" />
                <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-200" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}