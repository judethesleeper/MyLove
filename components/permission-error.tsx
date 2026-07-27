export function PermissionError({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700">
      <p className="font-semibold text-rose-900">Camera problem</p>
      <p>{message}</p>
    </div>
  );
}
