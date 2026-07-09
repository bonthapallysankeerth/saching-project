import { useMemo, useState } from 'react'
import { Cpu, Layers, Zap } from 'lucide-react'

const COLS = 12
const ROWS = 8

function generatePieces() {
  return Array.from({ length: COLS * ROWS }, (_, i) => ({
    col: i % COLS,
    row: Math.floor(i / COLS),
    tx: `${(Math.random() - 0.5) * 120}vw`,
    ty: `${(Math.random() - 0.5) * 120}vh`,
    rot: `${(Math.random() - 0.5) * 720}deg`,
    delay: `${Math.random() * 0.25}s`,
    light: Math.random(),
  }))
}

export default function WelcomeOverlay({ onEnter }) {
  const [shattering, setShattering] = useState(false)
  const pieces = useMemo(() => generatePieces(), [])

  const handleEnter = () => {
    if (shattering) return
    setShattering(true)
    setTimeout(onEnter, 950)
  }

  if (shattering) {
    return (
      <div className="shatter-grid">
        {pieces.map((p, i) => (
          <div
            key={i}
            className="shatter-piece"
            style={{
              '--tx': p.tx,
              '--ty': p.ty,
              '--rot': p.rot,
              '--delay': p.delay,
              '--light': p.light,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0a0f1a]">
      {/* Animated background */}
      <div className="absolute inset-0 blueprint-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="scan-line" />
      </div>

      {/* Blueprint decoration lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="50%" r="200" fill="none" stroke="#3b82f6" strokeWidth="1" />
        <circle cx="50%" cy="50%" r="300" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3b82f6" strokeWidth="0.5" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#3b82f6" strokeWidth="0.5" />
      </svg>

      <div className="relative z-10 text-center px-6 max-w-3xl">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-mono mb-8">
          <Cpu className="w-3.5 h-3.5" />
          MECHANICAL AI · DRAWING INTELLIGENCE
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-up animate-fade-up-delay-1 text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
          <span className="text-white">Hey Buddy!</span>
        </h1>

        <p className="animate-fade-up animate-fade-up-delay-1 text-xl sm:text-2xl text-slate-300 font-light leading-relaxed mb-2">
          Welcome to the
        </p>
        <p className="animate-fade-up animate-fade-up-delay-2 text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent glow-text mb-10">
          Mechanical Artificial Intelligence World
        </p>

        {/* Feature pills */}
        <div className="animate-fade-up animate-fade-up-delay-2 flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: Layers, text: 'Revision Diff Engine' },
            { icon: Zap, text: 'ECO Reconciliation' },
            { icon: Cpu, text: 'Zero Manual Review' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
              <Icon className="w-3.5 h-3.5 text-blue-400" />
              {text}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          className="animate-fade-up animate-fade-up-delay-3 relative group btn-shine pulse-ring
            px-10 py-4 rounded-2xl font-semibold text-lg text-white
            bg-gradient-to-r from-blue-600 to-cyan-600
            hover:from-blue-500 hover:to-cyan-500
            shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Enter to the Designing World
          <span className="block text-xs font-normal text-blue-200/70 mt-1">Click to begin your journey →</span>
        </button>

        <p className="animate-fade-up animate-fade-up-delay-3 mt-8 text-xs text-slate-600 font-mono">
          DrawCheck · AI-Powered Drawing Revision Reconciliation
        </p>
      </div>
    </div>
  )
}
