export default function LoadingInternal() {
  return (
    <div className="container-shell py-6">
      <div className="animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-6">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 rounded bg-slate-100" />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
