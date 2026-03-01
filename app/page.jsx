'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sun, Moon, ArrowLeftRight, Copy, Check,
  Clock, ChevronRight, Download, Trash2,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'Scala', 'R',
  'MATLAB', 'Perl', 'Haskell', 'Lua', 'Dart', 'Julia', 'Elixir',
  'Clojure', 'F#', 'COBOL', 'Fortran', 'Bash',
]

const EXTENSIONS = {
  Python: 'py', JavaScript: 'js', TypeScript: 'ts', Java: 'java',
  C: 'c', 'C++': 'cpp', 'C#': 'cs', Go: 'go', Rust: 'rs',
  Swift: 'swift', Kotlin: 'kt', Ruby: 'rb', PHP: 'php', Scala: 'scala',
  R: 'r', MATLAB: 'm', Perl: 'pl', Haskell: 'hs', Lua: 'lua',
  Dart: 'dart', Julia: 'jl', Elixir: 'ex', Clojure: 'clj',
  'F#': 'fs', COBOL: 'cob', Fortran: 'f90', Bash: 'sh',
}

const EXAMPLES = {
  'Fibonacci': `# Fibonacci — Recursive
def fibonacci(n):
    # Base cases
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    # Recursive call
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")`,

  'Bubble Sort': `# Bubble Sort — O(n²)
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # already sorted
    return arr

print("Sorted:", bubble_sort([64, 34, 25, 12, 22, 11, 90]))`,

  'Binary Search': `# Binary Search — O(log n)
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid       # found
        elif arr[mid] < target:
            low = mid + 1    # search right
        else:
            high = mid - 1   # search left
    return -1  # not found

data = list(range(0, 100, 5))
print(binary_search(data, 45))`,

  'Linked List': `# Singly Linked List
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None  # pointer to next node

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        node = Node(data)
        if not self.head:
            self.head = node
            return
        cur = self.head
        while cur.next:
            cur = cur.next
        cur.next = node

    def display(self):
        cur, out = self.head, []
        while cur:
            out.append(str(cur.data))
            cur = cur.next
        print(" -> ".join(out))

ll = LinkedList()
for v in [1, 2, 3, 4, 5]:
    ll.append(v)
ll.display()`,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function countLines(code) { return code ? code.split('\n').length : 0 }
function countChars(code) { return code ? code.length : 0 }

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark] = useState(false)
  const [sourceLang, setSourceLang] = useState('Python')
  const [targetLang, setTargetLang] = useState('JavaScript')
  const [sourceCode, setSourceCode] = useState('')
  const [translatedCode, setTranslatedCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [swapAnim, setSwapAnim] = useState(false)
  const sourceRef = useRef(null)

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedDark = localStorage.getItem('rsDark') === 'true'
    const savedHistory = JSON.parse(localStorage.getItem('rsHistory') || '[]')
    setDark(savedDark)
    setHistory(savedHistory)
    if (savedDark) document.documentElement.classList.add('dark')
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('rsDark', next)
    document.documentElement.classList.toggle('dark', next)
  }

  const swapLanguages = () => {
    setSwapAnim(true)
    setTimeout(() => setSwapAnim(false), 400)
    const prevSrc = sourceLang
    const prevTgt = targetLang
    const prevCode = sourceCode
    setSourceLang(prevTgt)
    setTargetLang(prevSrc)
    setSourceCode(translatedCode || prevCode)
    setTranslatedCode('')
    setExplanation('')
    setError('')
  }

  const copyToClipboard = async () => {
    if (!translatedCode) return
    await navigator.clipboard.writeText(translatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFile = () => {
    if (!translatedCode) return
    const ext = EXTENSIONS[targetLang] || 'txt'
    const blob = new Blob([translatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translated.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadExample = (name) => {
    setSourceCode(EXAMPLES[name])
    setTranslatedCode('')
    setExplanation('')
    setError('')
    sourceRef.current?.focus()
  }

  const loadFromHistory = (entry) => {
    setSourceLang(entry.sourceLang)
    setTargetLang(entry.targetLang)
    setSourceCode(entry.sourceCode)
    setTranslatedCode(entry.translatedCode)
    setExplanation(entry.explanation)
    setShowHistory(false)
    setShowExplanation(true)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('rsHistory')
  }

  const translate = async () => {
    if (!sourceCode.trim() || loading) return
    if (sourceLang === targetLang) {
      setError('Source and target languages must be different.')
      return
    }
    setLoading(true)
    setError('')
    setTranslatedCode('')
    setExplanation('')
    setShowExplanation(false)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode, sourceLang, targetLang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Translation failed.')

      setTranslatedCode(data.translatedCode)
      setExplanation(data.explanation)
      setShowExplanation(true)

      // Save to history
      const entry = {
        id: Date.now(),
        sourceLang,
        targetLang,
        sourceCode,
        translatedCode: data.translatedCode,
        explanation: data.explanation,
        preview: sourceCode.trim().split('\n')[0].slice(0, 60),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      const next = [entry, ...history].slice(0, 10)
      setHistory(next)
      localStorage.setItem('rsHistory', JSON.stringify(next))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') translate()
    // Allow real Tab in textarea
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.target
      const start = el.selectionStart
      const end = el.selectionEnd
      const newVal = sourceCode.slice(0, start) + '    ' + sourceCode.slice(end)
      setSourceCode(newVal)
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4 }, 0)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const card = 'border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950'
  const barBg = 'bg-gray-50 dark:bg-gray-900/80'
  const muted  = 'text-gray-500 dark:text-gray-400'
  const chip   = 'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer select-none'
  const selectCls = `w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg
    bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600
    transition-all cursor-pointer`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗿</span>
            <div>
              <span className="font-semibold text-sm tracking-tight">Rosetta Stone</span>
              <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 ml-2">Universal Code Translator</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all
                ${showHistory
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <Clock size={12} />
              History
              {history.length > 0 && (
                <span className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium
                  ${showHistory ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {history.length}
                </span>
              )}
            </button>

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── Language bar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className={`block text-[10px] font-medium uppercase tracking-widest ${muted} mb-1.5`}>From</label>
            <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className={selectCls}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Swap */}
          <div className="pt-5">
            <button
              onClick={swapLanguages}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-800
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400
                ${swapAnim ? 'rotate-180' : 'rotate-0'} duration-300`}
              title="Swap languages"
            >
              <ArrowLeftRight size={15} />
            </button>
          </div>

          <div className="flex-1">
            <label className={`block text-[10px] font-medium uppercase tracking-widest ${muted} mb-1.5`}>To</label>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className={selectCls}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* ── Code editors ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Source editor */}
          <div className={card}>
            {/* Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 ${barBg}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className={`ml-2 text-[11px] font-medium ${muted}`}>{sourceLang}</span>
              </div>
              {/* Example snippets */}
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {Object.keys(EXAMPLES).map(name => (
                  <button key={name} onClick={() => loadExample(name)} className={chip}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={sourceRef}
              value={sourceCode}
              onChange={e => setSourceCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Paste your ${sourceLang} code here...\n\nTip: Ctrl+Enter to translate`}
              className="code-area h-72 p-4"
              spellCheck={false}
            />

            {/* Footer */}
            <div className={`flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 ${barBg}`}>
              <span className={`text-[11px] font-mono ${muted}`}>
                {countLines(sourceCode)} lines · {countChars(sourceCode)} chars
              </span>
              {sourceCode && (
                <button
                  onClick={() => { setSourceCode(''); setTranslatedCode(''); setExplanation(''); setError('') }}
                  className={`text-[11px] ${muted} hover:text-red-500 transition-colors`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Output editor */}
          <div className={card}>
            {/* Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 ${barBg}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className={`ml-2 text-[11px] font-medium ${muted}`}>{targetLang}</span>
              </div>
              {translatedCode && (
                <div className="flex items-center gap-1.5">
                  <button onClick={copyToClipboard} className={chip}>
                    {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={downloadFile} className={chip}>
                    <Download size={10} />
                    .{EXTENSIONS[targetLang] || 'txt'}
                  </button>
                </div>
              )}
            </div>

            {/* Output area */}
            <div className="relative h-72">
              <textarea
                value={translatedCode}
                readOnly
                placeholder={`${targetLang} translation will appear here...`}
                className="code-area h-full p-4"
                spellCheck={false}
              />
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-gray-950/85 backdrop-blur-[2px]">
                  <Loader2 size={20} className="spin text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Translating {sourceLang} → {targetLang}</p>
                  <p className="text-xs text-gray-400 mt-1">This takes a few seconds…</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800 ${barBg}`}>
              <span className={`text-[11px] font-mono ${muted}`}>
                {translatedCode
                  ? `${countLines(translatedCode)} lines · ${countChars(translatedCode)} chars`
                  : 'Awaiting translation'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Translate button ────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <button
            onClick={translate}
            disabled={loading || !sourceCode.trim()}
            className="flex items-center gap-2 px-7 py-2.5 text-sm font-medium rounded-lg
              bg-gray-900 dark:bg-white text-white dark:text-gray-900
              hover:bg-gray-700 dark:hover:bg-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all active:scale-95"
          >
            {loading ? (
              <><Loader2 size={14} className="spin" /> Translating…</>
            ) : (
              <>Translate <ChevronRight size={14} /></>
            )}
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="fade-in px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Explanation ────────────────────────────────────────────────── */}
        {explanation && (
          <div className={`${card} fade-in`}>
            <button
              onClick={() => setShowExplanation(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 ${barBg} hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors`}
            >
              <span className="text-sm font-medium">Key Differences Explained</span>
              {showExplanation ? <ChevronUp size={15} className={muted} /> : <ChevronDown size={15} className={muted} />}
            </button>
            {showExplanation && (
              <div className={`px-5 py-4 text-sm ${muted} whitespace-pre-wrap leading-relaxed border-t border-gray-200 dark:border-gray-800`}>
                {explanation}
              </div>
            )}
          </div>
        )}

        {/* ── History panel ───────────────────────────────────────────────── */}
        {showHistory && (
          <div className={`${card} fade-in`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 ${barBg}`}>
              <span className="text-sm font-medium">Translation History</span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className={`flex items-center gap-1 text-xs ${muted} hover:text-red-500 transition-colors`}
                >
                  <Trash2 size={11} /> Clear all
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No translations yet. Make one above!
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {history.map(entry => (
                  <li key={entry.id}>
                    <button
                      onClick={() => loadFromHistory(entry)}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">
                            {entry.sourceLang} → {entry.targetLang}
                          </span>
                          <span className={`text-[11px] ${muted}`}>{entry.timestamp}</span>
                        </div>
                        <p className={`text-xs font-mono truncate ${muted}`}>{entry.preview}</p>
                      </div>
                      <ChevronRight size={13} className={`${muted} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={`border-t border-gray-200 dark:border-gray-800 mt-16 py-5 text-center text-xs ${muted}`}>
        🗿 Rosetta Stone · Powered by Google Gemini · {LANGUAGES.length}+ languages · Free to use
      </footer>
    </div>
  )
}
