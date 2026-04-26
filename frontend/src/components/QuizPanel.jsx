import { useState } from 'react'
import { generateQuiz } from '../services/api'

export default function QuizPanel({ highlights, onClose }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nQuestions, setNQuestions] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  const fragments = highlights.map((h) => h.text)

  const handleGenerate = async () => {
    if (!fragments.length) return
    setLoading(true)
    setError('')
    setAnswers({})
    setSubmitted(false)
    try {
      const data = await generateQuiz(fragments, nQuestions)
      setQuestions(data.questions)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qIdx, option) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qIdx]: option }))
  }

  const handleSubmit = () => setSubmitted(true)

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">❓ Quiz personalizado</h2>
        <button
          onClick={onClose}
          className="text-sm text-ink-muted hover:text-ink border border-brand-100 hover:bg-brand-50 px-3 py-1 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>

      {fragments.length === 0 ? (
        <div className="text-center py-10 text-ink-muted text-sm">
          <p className="text-3xl mb-2">✏️</p>
          <p>Resalta fragmentos primero para generar el quiz sobre ellos.</p>
        </div>
      ) : (
        <>
          {questions.length === 0 && (
            <div className="flex gap-3 items-center">
              <label className="text-sm text-ink-muted">Preguntas:</label>
              <select
                value={nQuestions}
                onChange={(e) => setNQuestions(Number(e.target.value))}
                className="border border-brand-100 rounded-lg px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {[3, 4, 5, 6, 7, 8, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-surface disabled:text-ink-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? 'Generando...' : `Generar quiz (${fragments.length} fragmentos)`}
              </button>
            </div>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}

          {questions.length > 0 && (
            <div className="space-y-5">
              {submitted && (
                <div className={`rounded-xl p-4 text-center font-bold text-lg ${
                  score === questions.length
                    ? 'bg-success-50 text-success'
                    : 'bg-secondary-50 text-secondary-600'
                }`}>
                  Resultado: {score} / {questions.length} correctas
                  {score === questions.length && ' 🎉'}
                </div>
              )}

              {questions.map((q, qi) => {
                const userAnswer = answers[qi]
                return (
                  <div key={qi} className="bg-white border border-brand-100 rounded-xl p-4 shadow-sm">
                    <p className="font-semibold text-sm text-ink mb-3">{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(q.options).map(([opt, text]) => {
                        let cls = 'border border-brand-100 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:bg-brand-50 text-ink'
                        if (userAnswer === opt && !submitted) cls = 'border-brand-600 bg-brand-50 text-ink rounded-lg px-3 py-2 text-sm cursor-pointer'
                        if (submitted) {
                          if (opt === q.correct) cls = 'border border-success bg-success-50 text-success rounded-lg px-3 py-2 text-sm font-medium'
                          else if (userAnswer === opt) cls = 'border border-danger bg-danger-50 text-danger rounded-lg px-3 py-2 text-sm'
                          else cls = 'border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink-muted'
                        }
                        return (
                          <div key={opt} className={cls} onClick={() => handleAnswer(qi, opt)}>
                            <span className="font-bold mr-2">{opt}.</span>{text}
                          </div>
                        )
                      })}
                    </div>
                    {submitted && (
                      <p className="mt-3 text-xs text-ink-muted bg-surface rounded-lg p-2">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}

              {!submitted && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < questions.length}
                    className="flex-1 py-2 px-4 bg-secondary-600 hover:bg-secondary-700 disabled:bg-surface disabled:text-ink-muted text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Evaluar ({Object.keys(answers).length}/{questions.length} respondidas)
                  </button>
                  <button
                    onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }}
                    className="py-2 px-4 border border-brand-100 rounded-xl text-sm text-ink-muted hover:bg-brand-50 transition-colors"
                  >
                    Nuevo quiz
                  </button>
                </div>
              )}
              {submitted && (
                <button
                  onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }}
                  className="w-full py-2 border border-brand-100 rounded-xl text-sm text-ink-muted hover:bg-brand-50 transition-colors"
                >
                  Generar otro quiz
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
