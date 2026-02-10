export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        <span className="text-sm text-white/60">Loading...</span>
      </div>
    </div>
  );
}
