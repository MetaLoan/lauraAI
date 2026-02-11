export default function ProfileLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-white">Loading...</span>
      </div>
    </div>
  );
}
