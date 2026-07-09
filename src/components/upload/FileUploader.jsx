import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'

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
      <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <button onClick={() => onFile(null)} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
    </div>
  )
}
