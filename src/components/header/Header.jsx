import { Link, useLocation } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'

export default function Header() {
  const location = useLocation()

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-white text-lg">DrawCheck</span>
          <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-medium">MVP</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className={`transition-colors ${location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Analyze
          </Link>
          <Link
            to="/results"
            className={`transition-colors ${location.pathname === '/results' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Results
          </Link>
        </nav>
      </div>
    </header>
  )
}
