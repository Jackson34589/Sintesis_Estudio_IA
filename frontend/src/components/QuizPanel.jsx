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
        <h2 className="text-base font-bold text-slate-700">❓ Quiz personalizado</h2>
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>

      {fragments.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          <p className="text-3xl mb-2">✏️</p>
          <p>Resalta fragmentos primero para generar el quiz sobre ellos.</p>
        </div>
      ) : (
        <>
          {questions.length === 0 && (
            <div className="flex gap-3 items-center">
              <label className="text-sm text-slate-600">Preguntas:</label>
              <select
                value={nQuestions}
                onChange={(e) => setNQuestions(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
              >
                {[3, 4, 5, 6, 7, 8, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? 'Generando...' : `Generar quiz (${fragments.length} fragmentos)`}
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {questions.length > 0 && (
            <div className="space-y-5">
              {submitted && (
                <div className={`rounded-xl p-4 text-center font-bold text-lg ${score === questions.length ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  Resultado: {score} / {questions.length} correctas
                  {score === questions.length && ' 🎉'}
                </div>
              )}

              {questions.map((q, qi) => {
                const userAnswer = answers[qi]
                return (
                  <div key={qi} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="font-semibold text-sm mb-3">{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(q.options).map(([opt, text]) => {
                        let cls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:bg-slate-50'
                        if (userAnswer === opt && !submitted) cls += ' border-brand-500 bg-brand-50'
                        if (submitted) {
                          if (opt === q.correct) cls += ' border-green-400 bg-green-50 text-green-800 font-medium'
                          else if (userAnswer === opt) cls += ' border-red-300 bg-red-50 text-red-700'
                        }
                        return (
                          <div key={opt} className={cls} onClick={() => handleAnswer(qi, opt)}>
                            <span className="font-bold mr-2">{opt}.</span>{text}
                          </div>
                        )
                      })}
                    </div>
                    {submitted && (
                      <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
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
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Evaluar ({Object.keys(answers).length}/{questions.length} respondidas)
                  </button>
                  <button
                    onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }}
                    className="py-2 px-4 border border-slate-300 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Nuevo quiz
                  </button>
                </div>
              )}
              {submitted && (
                <button
                  onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }}
                  className="w-full py-2 border border-slate-300 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
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
