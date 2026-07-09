export default function Footer() {
  return (
    <footer className="border-t border-blue-500/10 bg-slate-950/50 backdrop-blur-sm mt-auto relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          DrawCheck — AI Drawing Revision Reconciliation Engine
        </p>
        <p className="text-[10px] font-mono text-slate-600">
          Hackathon 2026 · Mechanical AI · Built with ❤️
        </p>
      </div>
    </footer>
  )
}
