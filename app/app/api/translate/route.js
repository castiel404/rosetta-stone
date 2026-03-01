const GEMINI_MODEL = 'gemini-2.0-flash'

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Gemini API error')
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function cleanFences(text) {
  return text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
}

export async function POST(request) {
  try {
    const { sourceCode, sourceLang, targetLang } = await request.json()

    if (!sourceCode?.trim() || !sourceLang || !targetLang) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Server is missing the Gemini API key. Contact the site owner.' }, { status: 500 })
    }

    // ── Step 1: Translate ─────────────────────────────────────────────────────
    const translationPrompt = `You are an elite polyglot programmer. Translate the following ${sourceLang} code into idiomatic, production-quality ${targetLang}.

Rules:
1. Preserve ALL comments — convert them to the correct comment syntax for ${targetLang}.
2. Keep variable and function names identical unless they conflict with ${targetLang} reserved words.
3. Use the most idiomatic patterns and conventions of ${targetLang}.
4. If a library or module has no direct equivalent, use the most common ${targetLang} alternative.
5. Output ONLY the raw translated code. No markdown fences, no preamble, no explanation whatsoever.

Code to translate:
${sourceCode}`

    const rawTranslation = await callGemini(apiKey, translationPrompt)
    const translatedCode = cleanFences(rawTranslation)

    // ── Step 2: Explain ───────────────────────────────────────────────────────
    const explanationPrompt = `You just translated this code from ${sourceLang} to ${targetLang}.

SOURCE (${sourceLang}):
${sourceCode}

TARGET (${targetLang}):
${translatedCode}

Write exactly 5 concise bullet points (use the • character) explaining:
• The key syntax differences that required changes
• Library or API mappings that were made
• Any paradigm shifts (e.g. OOP → functional, manual memory, etc.)
• Idiomatic ${targetLang} patterns or conventions that were applied
• Any gotchas or edge cases the developer should be aware of

Plain text only. No markdown, no bold, no headers. Just the 5 bullet points.`

    const explanation = await callGemini(apiKey, explanationPrompt)

    return Response.json({ translatedCode, explanation })
  } catch (err) {
    console.error('Translate error:', err)
    return Response.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
