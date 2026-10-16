import { useRef, type KeyboardEvent } from 'react'

export function CodeEditor({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const lineCount = value.split('\n').length

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab' || e.shiftKey) return
    e.preventDefault()
    const el = e.currentTarget
    const { selectionStart, selectionEnd } = el
    const next = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`
    onChange(next)
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(selectionStart + 4, selectionStart + 4)
    })
  }

  return (
    <div className="flex min-h-80 overflow-hidden bg-[#070a12] font-mono text-sm leading-6 border-t border-white/10">
      <div aria-hidden className="select-none border-r border-white/10 px-3.5 py-3 text-right text-slate-500 bg-white/[0.02] min-w-10">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-label={label}
        className="min-h-80 flex-1 resize-y whitespace-pre bg-transparent px-4 py-3 text-slate-100 caret-primary outline-none selection:bg-primary/30"
        wrap="off"
      />
    </div>
  )
}

