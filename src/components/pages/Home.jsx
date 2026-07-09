import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Sparkles } from 'lucide-react'
import FileUploader from '../upload/FileUploader'
import ChangeRequestInput from '../upload/ChangeRequestInput'
import ProgressSteps from '../common/ProgressSteps'
import { analyzeRevisions, runDemo } from '../../api/client'
import { STEPS } from '../../utils/constants'

export default function Home() {
  const navigate = useNavigate()
  const [revA, setRevA] = useState(null)
  const [revB, setRevB] = useState(null)
  const [ecoText, setEcoText] = useState('')
  const [markupFile, setMarkupFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

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
      setError(err.response?.data?.detail || 'Analysis failed. Is the backend running?')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    setCurrentStep(0)
    const interval = simulateProgress()
    try {
      const result = await runDemo()
      sessionStorage.setItem('drawcheck_result', JSON.stringify(result))
      navigate('/results')
    } catch {
      setError('Demo failed. Is the backend running on port 8000?')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <h2 className="text-xl font-semibold text-white">Analyzing Revisions...</h2>
        <ProgressSteps currentStep={currentStep} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-white">
          Drawing Revision <span className="text-blue-400">Reconciliation</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Upload two drawing revisions and a change request. DrawCheck will diff Rev A → Rev B
          and reconcile every requested change — no paid APIs, fully offline.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FileUploader label="Rev A — Old Drawing" sublabel="Drop PDF or click to browse" file={revA} onFile={setRevA} />
        <FileUploader label="Rev B — New Drawing" sublabel="Drop PDF or click to browse" file={revB} onFile={setRevB} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Change Request</h3>
        <ChangeRequestInput
          text={ecoText}
          onTextChange={setEcoText}
          file={markupFile}
          onFileChange={setMarkupFile}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleAnalyze}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Play className="w-4 h-4" /> Analyze Revisions
        </button>
        <button
          onClick={handleDemo}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Sparkles className="w-4 h-4" /> Run Demo
        </button>
      </div>
    </div>
  )
}
