
import { useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'

// 重点词汇
type Vocabulary = {
  word: string
  meaning: string
  explanation: string
}

// 固定搭配
type Phrase = {
  phrase: string
  meaning: string
  explanation: string
}

// 重要句式
type SentencePattern = {
  pattern: string
  meaning: string
  example: string
  example_meaning: string
}

// AI 返回的翻译结果
type TranslationResult = {
  english: string
  vocabulary: Vocabulary[]
  phrases: Phrase[]
  sentence_patterns: SentencePattern[]
}

// 学习记录
type HistoryRecord = {
  id: number
  chinese: string
  result: TranslationResult
  createdAt: string
}

// 主题名称
type ThemeName = 'purple' | 'blue' | 'green' | 'orange' | 'pink'

// 主题配置
const themes: {
  name: ThemeName
  label: string
  color: string
}[] = [
  { name: 'purple', label: '梦幻紫', color: '#8057E8' },
  { name: 'blue', label: '天空蓝', color: '#2586D8' },
  { name: 'green', label: '薄荷绿', color: '#239568' },
  { name: 'orange', label: '奶油橘', color: '#E87943' },
  { name: 'pink', label: '樱花粉', color: '#D94F78' },
]

function App() {
  // 初始化主题：优先读取用户上次选择的主题
  const [theme, setTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('linguamate-theme')

    if (
      savedTheme === 'purple' ||
      savedTheme === 'blue' ||
      savedTheme === 'green' ||
      savedTheme === 'orange' ||
      savedTheme === 'pink'
    ) {
      return savedTheme
    }

    return 'purple'
  })

  // 页面状态
  const [chinese, setChinese] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // 读取本地保存的学习记录
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
  try {
    const savedHistory = localStorage.getItem('linguamate-history')
    const parsedHistory = savedHistory ? JSON.parse(savedHistory) : []

    return Array.isArray(parsedHistory) ? parsedHistory : []
  } catch {
    return []
  }
})

  // 获取当前主题颜色
  const themeColor =
    themes.find((item) => item.name === theme)?.color ?? '#8057E8'

  // 生成英文表达
  async function handleTranslate() {
    if (!chinese.trim() || loading) return

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/translate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chinese: chinese.trim(),
          }),
        },
      )

      // 检查请求是否成功
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)

        throw new Error(
          errorData?.detail || `请求失败，状态码：${response.status}`,
        )
      }

      const data: TranslationResult = await response.json()

      setResult(data)

      // 保存本次学习记录
      try {
        const newRecord: HistoryRecord = {
          id: Date.now(),
          chinese: chinese.trim(),
          result: data,
          createdAt: new Date().toISOString(),
        }

        const savedHistory = localStorage.getItem('linguamate-history')

        // 读取已有记录，并检查数据格式
        const parsedHistory = savedHistory
          ? JSON.parse(savedHistory)
          : []

        const history: HistoryRecord[] = Array.isArray(parsedHistory)
          ? parsedHistory
          : []

        // 最新记录放在最前面，最多保存50条
        const updatedHistory = [newRecord, ...history].slice(0, 50)

        localStorage.setItem(
          'linguamate-history',
          JSON.stringify(updatedHistory),
        )
        setHistory(updatedHistory)
      } catch (storageError) {
        console.error('学习记录保存失败：', storageError)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '发生未知错误，请稍后重试。',
      )
    } finally {
      setLoading(false)
    }
  }

  // 复制英文表达
  async function handleCopy() {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result.english)

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setError('复制失败，请检查浏览器剪贴板权限。')
    }
  }

  // 朗读指定的英文文本（整句和重点词汇共用）
  function speakText(text: string) {
    if (!text.trim()) return

    // 检查浏览器是否支持语音朗读
    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持语音朗读。')
      return
    }

    // 点击朗读按钮时，先停止当前播放，再播放新的内容
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9

    window.speechSynthesis.speak(utterance)
  }

  // 朗读英文表达
  function handleSpeak() {
    if (!result) return
    speakText(result.english)
  }

  // 清空输入框
  function handleClear() {
    setChinese('')
    setError('')
    setCopied(false)
  }

  // 学习记录独立页面
  if (showHistory) {
    return (
      <main
        className={`app theme-${theme}`}
        style={
          {
            '--theme-color': themeColor,
          } as CSSProperties
        }
      >
        <header className="header">
          <div className="brand">
            <div className="logo">LM</div>

            <div>
              <h1>LinguaMate</h1>
              <p>AI 英语表达学习助手</p>
            </div>
          </div>

          <button
            type="button"
            className="history-button"
            onClick={() => setShowHistory(false)}
          >
            ← 返回首页
          </button>
        </header>

        <section className="history-page">
          <div className="history-heading">
            <span className="tag">YOUR LEARNING JOURNEY</span>
            <h2>我的学习记录</h2>
            <p>回顾每一次英语表达的进步。</p>
          </div>

        <div className="history-list">
  {history.length === 0 ? (
    <div className="history-empty">
      <h3>还没有学习记录</h3>
      <p>快去生成你的第一条英文表达吧！</p>
    </div>
  ) : (
    history.map((record) => (
      <article className="history-record" key={record.id}>
        <p className="history-time">
          {new Date(record.createdAt).toLocaleString('zh-CN')}
        </p>

        <div>
          <h3>中文原文</h3>
          <p>{record.chinese}</p>
        </div>

        <div>
          <h3>英文表达</h3>
          <p>{record.result.english}</p>
        </div>
      </article>
    ))
  )}
</div>
        </section>
      </main>
    )
  }

  // 首页
  return (
    <main
      className={`app theme-${theme}`}
      style={
        {
          '--theme-color': themeColor,
        } as CSSProperties
      }
    >
      {/* 顶部导航 */}
      <header className="header">
        <div className="brand">
          <div className="logo">LM</div>

          <div>
            <h1>LinguaMate</h1>
            <p>AI 英语表达学习助手</p>
          </div>
        </div>

        {/* 主题切换 */}
        <div className="theme-switcher" aria-label="选择主题颜色">
          {themes.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`theme-swatch ${
                theme === item.name ? 'active' : ''
              }`}
              style={{ backgroundColor: item.color }}
              title={item.label}
              aria-label={`切换到${item.label}`}
              aria-pressed={theme === item.name}
              onClick={() => {
                setTheme(item.name)
                localStorage.setItem('linguamate-theme', item.name)
              }}
            />
          ))}
        </div>

        {/* 学习记录入口 */}
        <button
          type="button"
          className="history-button"
          onClick={() => setShowHistory(true)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>

          <span>学习记录</span>
        </button>
      </header>

      {/* 页面介绍 */}
      <section className="hero">
        <span className="tag">YOUR AI ENGLISH PARTNER</span>

        <h2>
          把你想说的中文，
          <br />
          变成地道的英语。
        </h2>

        <p>不止翻译，更帮你理解词汇与句式。</p>
      </section>

      {/* 中文输入区域 */}
      <section className="translator">
        <label htmlFor="chinese">输入你想表达的中文</label>

        <div className="textarea-wrapper">
          <textarea
            id="chinese"
            value={chinese}
            onChange={(event) =>
              setChinese(event.target.value.slice(0, 500))
            }
            placeholder="例如：我本来想早点完成作业，但是临时有事耽搁了……"
          />

          {/* 清空输入 */}
          {chinese.length > 0 && (
            <button
              type="button"
              className="clear-icon-button"
              title="清空输入"
              aria-label="清空输入"
              disabled={loading}
              onClick={handleClear}
            >
              ×
            </button>
          )}
        </div>

        {/* 输入框底部 */}
        <div className="input-footer">
          <span>{chinese.length}/500 个字符</span>

          <button
            type="button"
            disabled={!chinese.trim() || loading}
            onClick={handleTranslate}
          >
            {loading ? 'AI 正在生成...' : '生成英文表达 →'}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {/* 加载提示 */}
        {loading && (
          <p className="loading-message">
            正在分析你的表达，请稍候……
          </p>
        )}

        {/* AI 生成结果 */}
        {result && (
          <section className="result">
            <div className="result-heading">
              <span className="tag">YOUR ENGLISH EXPRESSION</span>
              <h2>地道英文表达</h2>
            </div>

            {/* 英文表达卡片 */}
            <div className="result-card english-card">
              <h3>英文表达</h3>

              <p className="english-text">{result.english}</p>

              {/* 复制和重新生成按钮 */}
              <div className="result-actions">
                {/* 英文朗读按钮 */}
                <button
                  type="button"
                  className="icon-action"
                  title="朗读英文表达"
                  aria-label="朗读英文表达"
                  onClick={handleSpeak}
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M19 5a10 10 0 0 1 0 14" />
                  </svg>
                </button>

                {/* 复制按钮 */}
                <button
                  type="button"
                  className="icon-action"
                  title={copied ? '复制成功' : '复制英文表达'}
                  aria-label="复制英文表达"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  ) : (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="8"
                        y="8"
                        width="12"
                        height="12"
                        rx="2"
                      />
                      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>

                {/* 重新生成按钮 */}
                <button
                  type="button"
                  className="icon-action"
                  title="重新生成"
                  aria-label="重新生成英文表达"
                  disabled={loading}
                  onClick={handleTranslate}
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 7v5h-5" />
                    <path d="M4 17v-5h5" />
                    <path d="M5.6 9a7 7 0 0 1 11.5-2L20 12" />
                    <path d="M18.4 15a7 7 0 0 1-11.5 2L4 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 重点词汇 */}
            <div className="result-card">
              <h3>重点词汇</h3>

              {result.vocabulary.map((item, index) => (
                <article
                  className="learning-item"
                  key={`${item.word}-${index}`}
                >
                  <h4>
                    {item.word}
                    <button
                      type="button"
                      className="icon-action vocabulary-speak-button"
                      title={`朗读单词 ${item.word}`}
                      aria-label={`朗读单词 ${item.word}`}
                      onClick={() => speakText(item.word)}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                        <path d="M19 5a10 10 0 0 1 0 14" />
                      </svg>
                    </button>
                  </h4>
                  <p>{item.meaning}</p>
                  <p className="explanation">{item.explanation}</p>
                </article>
              ))}
            </div>

            {/* 固定搭配 */}
            <div className="result-card">
              <h3>固定搭配</h3>

              {result.phrases.map((item, index) => (
                <article
                  className="learning-item"
                  key={`${item.phrase}-${index}`}
                >
                  <h4>{item.phrase}</h4>
                  <p>{item.meaning}</p>
                  <p className="explanation">{item.explanation}</p>
                </article>
              ))}
            </div>

            {/* 重要句式 */}
            <div className="result-card">
              <h3>重要句式</h3>

              {result.sentence_patterns.map((item, index) => (
                <article
                  className="learning-item"
                  key={`${item.pattern}-${index}`}
                >
                  <h4>{item.pattern}</h4>
                  <p>{item.meaning}</p>
                  <p className="explanation">
                    例句：{item.example}
                  </p>
                  <p className="explanation">
                    翻译：{item.example_meaning}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      {/* 页面底部 */}
      <footer>LEARN TO EXPRESS · EXPRESS TO LEARN</footer>
    </main>
  )
}

export default App
