import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Sparkles, FileSearch, GitCompare, ShieldCheck, ArrowRight } from 'lucide-react'
import FileUploader from '../upload/FileUploader'
import ChangeRequestInput from '../upload/ChangeRequestInput'
import ProgressSteps from '../common/ProgressSteps'
import { analyzeRevisions, runDemo } from '../../api/client'
import { STEPS } from '../../utils/constants'

const FEATURES = [
  { icon: GitCompare, title: 'Visual Diff', desc: 'Pixel-level Rev A → Rev B comparison' },
  { icon: FileSearch, title: 'ECO Parsing', desc: 'Reads change requests automatically' },
  { icon: ShieldCheck, title: 'Reconciliation', desc: 'Flags missing & unauthorized changes' },
]

export default function Home() {
  const navigate = useNavigate()
  const [revA, setRevA] = useState(null)
  const [revB, setRevB] = useState(null)
  const [ecoText, setEcoText] = useState('')
  const [markupFile, setMarkupFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(1)

  const simulateProgress = () => {
    let step = 0
    const interval = setInterval(() => {
      step++
      setCurrentStep(step)
      if (step >= STEPS.length - 1) clearInterval(interval)
    }, 1200)
    return interval
  }

  const handleAnalyze = async () => {
    if (!revA || !revB) {
      setError('Please upload both Rev A and Rev B PDFs.')
      return
    }
    setError('')
    setLoading(true)
    setCurrentStep(0)
    const interval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append('rev_a', revA)
      formData.append('rev_b', revB)
      if (ecoText.trim()) formData.append('change_request_text', ecoText)
      if (markupFile) formData.append('change_request_file', markupFile)

      const result = await analyzeRevisions(formData)
      sessionStorage.setItem('drawcheck_result', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Analysis failed. Try Run Demo instead.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setError('')
    setLoading(true)
    setCurrentStep(0)
    const interval = simulateProgress()
    try {
      const result = await runDemo()
      sessionStorage.setItem('drawcheck_result', JSON.stringify(result))
      navigate('/results')
    } catch {
      setError('Demo failed. Please refresh and try again.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
            <GitCompare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Analyzing Revisions...</h2>
          <p className="text-slate-400 text-sm">AI engine is comparing your drawings</p>
        </div>
        <div className="glass rounded-2xl p-8 w-full max-w-lg">
          <ProgressSteps currentStep={currentStep} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 stagger-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Drawing Revision{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Reconciliation
          </span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Upload two drawing revisions + a change request. Our AI diffs every dimension,
          reconciles ECO items, and flags what was missed.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="glass glass-hover rounded-2xl p-5 transition-all duration-300 stagger-in"
            style={{ animationDelay: `${0.2 + i * 0.1}s` }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Step wizard */}
      <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {[
            { n: 1, label: 'Upload PDFs' },
            { n: 2, label: 'Change Request' },
            { n: 3, label: 'Analyze' },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setActiveStep(n)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeStep === n
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                activeStep >= n ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Upload */}
        {(activeStep === 1 || activeStep === 3) && (
          <div className="space-y-4 stagger-in">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
              Upload Drawing Revisions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FileUploader label="Rev A — Old Drawing" sublabel="Drop PDF or click to browse" file={revA} onFile={(f) => { setRevA(f); if (f) setActiveStep(2) }} />
              <FileUploader label="Rev B — New Drawing" sublabel="Drop PDF or click to browse" file={revB} onFile={setRevB} />
            </div>
          </div>
        )}

        {/* Step 2: Change request */}
        {(activeStep === 2 || activeStep === 3) && (
          <div className="space-y-4 stagger-in">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">2</span>
              Change Request (ECO / Markup)
            </h3>
            <ChangeRequestInput
              text={ecoText}
              onTextChange={setEcoText}
              file={markupFile}
              onFileChange={setMarkupFile}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="shrink-0">⚠️</span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handleAnalyze}
            className="group flex items-center justify-center gap-2 btn-shine
              bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
              text-white font-semibold px-8 py-3.5 rounded-xl
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40
              transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-4 h-4" />
            Analyze Revisions
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleDemo}
            className="flex items-center justify-center gap-2
              glass glass-hover text-white font-medium px-8 py-3.5 rounded-xl
              transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Run Demo
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full ml-1">JURY</span>
          </button>
        </div>
      </div>
    </div>
  )
}
