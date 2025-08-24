'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Lightbulb, BookOpen, Target } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnalysisResponse {
  explanation: string
}

export default function HomePage() {
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!question.trim()) {
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
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze question')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MOCK MOCK MOCK Interview Question Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Paste your interview question and get comprehensive analysis powered by Claude
          </p>
        </div>

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
                rows={6}
                className="resize-none"
              />
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleAnalyze}
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
                
                {(analysis || question) && (
                  <Button variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
