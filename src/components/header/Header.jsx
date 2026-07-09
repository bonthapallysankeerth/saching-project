import { Link, useLocation } from 'react-router-dom'
import { ClipboardCheck, Sparkles } from 'lucide-react'

export default function Header() {
  const location = useLocation()

  const linkClass = (path) =>
    `relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'text-white bg-blue-500/20 border border-blue-500/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`

  return (
    <header className="border-b border-blue-500/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/workspace" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">DrawCheck</span>
            <span className="hidden sm:block text-[10px] text-slate-500 font-mono -mt-0.5">MECHANICAL AI</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/workspace" className={linkClass('/workspace')}>
            Workspace
          </Link>
          <Link to="/results" className={linkClass('/results')}>
            Results
          </Link>
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
