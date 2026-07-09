import { useState } from 'react'
import { FileText, Type } from 'lucide-react'
import FileUploader from './FileUploader'

export default function ChangeRequestInput({ text, onTextChange, file, onFileChange }) {
  const [mode, setMode] = useState('text')

  const tabClass = (active) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
        : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-800/50'
    }`

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('text')} className={tabClass(mode === 'text')}>
          <Type className="w-3.5 h-3.5" /> ECO / Email Text
        </button>
        <button onClick={() => setMode('markup')} className={tabClass(mode === 'markup')}>
          <FileText className="w-3.5 h-3.5" /> Markup PDF
        </button>
      </div>

      {mode === 'text' ? (
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Paste your ECO or change request here...

Example:
1. Change hole diameter from 5.5 to 5
2. Change thickness from 2.8 to 2.5
3. Change horizontal position to 11
4. Remove preliminary symbol`}
          className="w-full h-36 glass border border-slate-600/50 rounded-2xl p-4 text-sm text-slate-200
            placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none font-mono"
        />
      ) : (
        <FileUploader
          label="Drop marked-up drawing PDF"
          sublabel="Annotated drawing with client redlines"
          file={file}
          onFile={onFileChange}
        />
      )}
    </div>
  )
}
