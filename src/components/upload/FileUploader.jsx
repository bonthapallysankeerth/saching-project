import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'

export default function FileUploader({ label, sublabel, file, onFile, accept = { 'application/pdf': ['.pdf'] } }) {
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  })

  if (file) {
    return (
      <div className="glass border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-5 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{file.name}</p>
            <p className="text-xs text-emerald-400/70 font-mono">{(file.size / 1024).toFixed(1)} KB · Ready</p>
          </div>
        </div>
        <button
          onClick={() => onFile(null)}
          className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group
        ${isDragActive
          ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-lg shadow-cyan-500/10'
          : 'border-slate-600/50 hover:border-blue-500/50 hover:bg-blue-500/5 glass'
        }`}
    >
      <input {...getInputProps()} />
      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all
        ${isDragActive ? 'bg-cyan-500/20' : 'bg-slate-800/80 group-hover:bg-blue-500/15'}`}>
        <Upload className={`w-7 h-7 transition-colors ${isDragActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-blue-400'}`} />
      </div>
      <p className="text-sm font-semibold text-slate-200">{label}</p>
      <p className="text-xs text-slate-500 mt-1.5">{sublabel}</p>
      {isDragActive && (
        <p className="text-xs text-cyan-400 mt-3 font-medium animate-pulse">Drop it here!</p>
      )}
    </div>
  )
}
