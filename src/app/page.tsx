'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Lightbulb, BookOpen, Target, Mic, MicOff, History } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Waveform({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 14 }, () => 20))
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setBars(prev => prev.map(() => 10 + Math.floor(Math.random() * 90)))
    }, 140)
    return () => clearInterval(id)
  }, [active])
  return (
    <div className="flex items-end gap-1 h-8 px-2 py-1 rounded-md bg-red-50 border border-red-100">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 bg-red-500/70 transition-all duration-150"
          style={{ height: `${active ? h : 10}%` }}
        />
      ))}
    </div>
  )
}

interface AnalysisResponse {
  explanation: string
}

interface SubmissionItem {
  id: string
  question: string
  explanation: string
  createdAt: string | Date
}

export default function HomePage() {
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [sttSupported, setSttSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null)
  const questionRef = useRef('')
  const isAnalyzingRef = useRef(false)
  const [tab, setTab] = useState<'analyze' | 'history'>('analyze')
  const [historyItems, setHistoryItems] = useState<SubmissionItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info', duration = 2500) => {
    setToast({ message, type })
    window.clearTimeout((showToast as any)._t)
    ;(showToast as any)._t = window.setTimeout(() => setToast(null), duration)
  }

  useEffect(() => {
    questionRef.current = question
  }, [question])

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing
  }, [isAnalyzing])

  // Initialize Web Speech API recognition
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttSupported(false)
      return
    }
    setSttSupported(true)
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    const stripCommand = (text: string) => text.replace(/let\s+me\s+think/gi, '').trim()
    const containsCommand = (text: string) => /\blet\s+me\s+think\b/i.test(text)

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    recognition.onerror = (event: any) => {
      // Common errors: 'not-allowed', 'no-speech', 'audio-capture'
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setError('Microphone access blocked. Please allow mic permissions in your browser.')
      } else if (event?.error && event?.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`)
      }
      setIsListening(false)
    }
    recognition.onresult = (event: any) => {
      let finalChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = String(result[0]?.transcript || '')
        if (result.isFinal) {
          finalChunk += transcript
        }
        // If the command is detected at any point, stop listening and trigger analyze
        if (containsCommand(transcript)) {
          // Remove the command words from what gets added to the question
          const cleaned = stripCommand(transcript)
          const currentQ = questionRef.current
          const nextQ = cleaned ? (currentQ ? `${currentQ} ${cleaned}`.trim() : cleaned) : currentQ
          if (nextQ !== currentQ) {
            setQuestion(nextQ)
            questionRef.current = nextQ
          }
          try {
            recognition.stop()
          } catch {}
          setIsListening(false)
          // Only trigger analyze if it would be equivalent to clicking the enabled button
          if (nextQ.trim() && !isAnalyzingRef.current) {
            showToast('Heard "let me think" — analyzing…', 'success')
            // Trigger analyze on the next tick to ensure state updates apply
            setTimeout(() => {
              handleAnalyze(nextQ)
            }, 0)
          }
          return
        }
      }
      if (finalChunk) {
        const cleaned = finalChunk.trim()
        if (cleaned) {
          setQuestion(prev => (prev ? `${prev} ${cleaned}`.trim() : cleaned))
        }
      }
    }

    recognitionRef.current = recognition
    return () => {
      try { recognition.stop() } catch {}
    }
  }, [])

  const handleAnalyze = async (overrideQuestion?: string) => {
    const toAnalyze = (overrideQuestion ?? questionRef.current ?? question).trim()
    if (!toAnalyze) {
      setError('Please enter a question to analyze')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: toAnalyze }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze question')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      // Optimistically prepend to history if returned
      if (data.submissionId) {
        const item: SubmissionItem = {
          id: data.submissionId,
          question: toAnalyze,
          explanation: data.analysis.explanation,
          createdAt: new Date().toISOString(),
        }
        setHistoryItems(prev => [item, ...prev])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setQuestion('')
    setAnalysis(null)
    setError('')
  }

  const toggleMic = () => {
    if (!sttSupported) {
      setError('Voice input not supported in this browser. Try Chrome or Edge.')
      return
    }
    const rec = recognitionRef.current
    if (!rec) return
    if (isListening) {
      try { rec.stop() } catch {}
      setIsListening(false)
    } else {
      setError('')
      try { rec.start() } catch (e) {
        // Some browsers throw if start() is called too quickly
      }
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/submissions', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load history')
      const json = await res.json()
      setHistoryItems(json.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory()
    }
  }, [tab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={cn(
              'rounded-md border shadow-lg px-4 py-3 text-sm max-w-xs backdrop-blur bg-white/90',
              toast.type === 'success' && 'border-green-200 text-green-800',
              toast.type === 'error' && 'border-red-200 text-red-800',
              (!toast.type || toast.type === 'info') && 'border-gray-200 text-gray-800'
            )}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MOCK MOCK MOCK Interview Question Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Paste your interview question and get comprehensive analysis powered by Claude
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Interview Question Analysis
            </CardTitle>
            <CardDescription>
              Paste your interview question below and get comprehensive analysis, solutions, and explanations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your interview question here... (e.g., 'Given an array of integers, find two numbers that add up to a target value')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handleAnalyze()
                  }
                }}
                rows={6}
                className={cn(
                  'resize-none',
                  isListening && 'ring-2 ring-red-500/60 animate-pulse'
                )}
              />
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !question.trim()}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      Teach Me
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isListening ? 'destructive' : 'outline'}
                  onClick={toggleMic}
                  className="flex items-center gap-2"
                  disabled={!sttSupported}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      {sttSupported ? 'Speak' : 'Voice Unavailable'}
                    </>
                  )}
                </Button>
                
                {(analysis || question) && (
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                )}
              </div>
              {isListening && (
                <div className="flex items-center gap-3 text-red-600 text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Badge variant="secondary">Listening… say "let me think" to submit</Badge>
                  <Waveform active={isListening} />
                </div>
              )}
              {!isListening && sttSupported && (
                <p className="text-xs text-gray-500">Tip: say "let me think" to submit your question.</p>
              )}
              {!sttSupported && (
                <p className="text-xs text-gray-500">
                  Voice input is not supported in this browser. Use the Analyze button or press Ctrl/Cmd+Enter to submit. Try Chrome or Edge for voice.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Submissions
                </CardTitle>
                <CardDescription>Click an item to load it into the analyzer.</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-sm text-gray-600">Loading history…</div>
                ) : historyItems.length === 0 ? (
                  <div className="text-sm text-gray-600">No submissions yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {historyItems.map((item) => (
                      <li key={item.id} className="py-3">
                        <button
                          className="text-left w-full group"
                          onClick={() => {
                            setQuestion(item.question)
                            setAnalysis({ explanation: item.explanation })
                            setTab('analyze')
                          }}
                        >
                          <div className="font-medium text-gray-900 group-hover:underline line-clamp-2">{item.question}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </button>
                      </li>) )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.explanation}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
