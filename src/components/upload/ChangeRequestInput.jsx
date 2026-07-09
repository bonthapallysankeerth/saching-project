import { useState } from 'react'
import { FileText, Type } from 'lucide-react'
import FileUploader from './FileUploader'

export default function ChangeRequestInput({ text, onTextChange, file, onFileChange }) {
  const [mode, setMode] = useState('text')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${mode === 'text' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
        >
          <Type className="w-3.5 h-3.5" /> ECO / Email Text
        </button>
        <button
          onClick={() => setMode('markup')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${mode === 'markup' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Markup PDF
        </button>
      </div>

      {mode === 'text' ? (
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Paste your ECO or change request email here...\n\nExample:\n1. Increase bore diameter from 10mm to 12mm (Section A-A)\n2. Add M6 tapped hole at top-left corner\n3. Update material to 6061-T6 Aluminum`}
          className="w-full h-40 bg-slate-800/80 border border-slate-600 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      ) : (
        <FileUploader
          label="Drop marked-up drawing PDF"
          sublabel="Scanned or annotated drawing with handwritten changes"
          file={file}
          onFile={onFileChange}
        />
      )}
    </div>
  )
}
