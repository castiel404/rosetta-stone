import streamlit as st
from google import genai
from google.genai import types
import re
import time
from streamlit_ace import st_ace

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Code Rosetta Stone",
    page_icon="🗿",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@300;400;600;700&display=swap');
:root {
    --bg:#1e1f29; --surface:#282a36; --border:#44475a;
    --purple:#bd93f9; --pink:#ff79c6; --cyan:#8be9fd;
    --green:#50fa7b; --yellow:#f1fa8c; --orange:#ffb86c;
    --comment:#6272a4; --fg:#f8f8f2;
}
html,body,[data-testid="stAppViewContainer"]{background:var(--bg)!important;color:var(--fg)!important;font-family:'Space Grotesk',sans-serif!important}
[data-testid="stHeader"]{background:var(--bg)!important}
#MainMenu,footer{visibility:hidden}
[data-testid="stSidebar"]{background:var(--surface)!important;border-right:1px solid var(--border)!important}
[data-testid="stSidebar"] *{color:var(--fg)!important}
.stSelectbox>div>div,.stTextInput>div>div>input{background:var(--surface)!important;color:var(--fg)!important;border:1px solid var(--border)!important;border-radius:6px!important;font-family:'Space Grotesk',sans-serif!important}
.stSelectbox label,.stTextInput label{color:var(--comment)!important;font-size:0.75rem!important;letter-spacing:0.08em!important;text-transform:uppercase!important;font-weight:600!important}
.stButton>button{background:linear-gradient(135deg,var(--purple),var(--pink))!important;color:var(--bg)!important;border:none!important;border-radius:8px!important;font-family:'Space Grotesk',sans-serif!important;font-weight:700!important;font-size:0.95rem!important;padding:0.55rem 1.4rem!important;letter-spacing:0.03em!important}
.stButton>button:hover{transform:translateY(-2px)!important;box-shadow:0 6px 24px rgba(189,147,249,0.35)!important}
.stDownloadButton>button{background:var(--surface)!important;color:var(--cyan)!important;border:1px solid var(--cyan)!important;border-radius:8px!important;font-weight:600!important;font-family:'Space Grotesk',sans-serif!important}
.section-label{font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--comment);margin-bottom:6px;padding:4px 10px;border-left:3px solid var(--purple);background:rgba(98,114,164,0.08);border-radius:0 4px 4px 0}
.explain-box{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--green);border-radius:8px;padding:1rem 1.2rem;font-family:'Space Grotesk',sans-serif;font-size:0.88rem;line-height:1.65;color:var(--fg);white-space:pre-wrap}
.chip{display:inline-block;padding:3px 12px;border-radius:999px;font-family:'JetBrains Mono',monospace;font-size:0.72rem;font-weight:700;margin:2px 4px}
.chip-easy{background:rgba(80,250,123,0.15);color:var(--green);border:1px solid var(--green)}
.chip-medium{background:rgba(241,250,140,0.15);color:var(--yellow);border:1px solid var(--yellow)}
.chip-hard{background:rgba(255,184,108,0.15);color:var(--orange);border:1px solid var(--orange)}
.chip-lang{background:rgba(139,233,253,0.12);color:var(--cyan);border:1px solid var(--cyan)}
.chip-lines{background:rgba(189,147,249,0.12);color:var(--purple);border:1px solid var(--purple)}
.hero{text-align:center;padding:1.4rem 0 0.8rem}
.hero h1{font-family:'JetBrains Mono',monospace;font-size:2rem;font-weight:700;background:linear-gradient(90deg,var(--purple),var(--pink),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0}
.hero p{color:var(--comment);font-size:0.88rem;margin:4px 0 0}
hr{border-color:var(--border)!important}
.stProgress>div>div>div{background:linear-gradient(90deg,var(--purple),var(--pink))!important}
</style>
""", unsafe_allow_html=True)

# ── Constants ─────────────────────────────────────────────────────────────────
LANGUAGES = [
    "Python","JavaScript","TypeScript","Java","C","C++","C#",
    "Go","Rust","Swift","Kotlin","Ruby","PHP","Scala","R",
    "MATLAB","Perl","Haskell","Lua","Dart","Julia","Elixir",
    "Clojure","F#","COBOL","Fortran","Assembly (x86)","Bash",
]
EXTENSIONS = {
    "Python":"py","JavaScript":"js","TypeScript":"ts","Java":"java",
    "C":"c","C++":"cpp","C#":"cs","Go":"go","Rust":"rs","Swift":"swift",
    "Kotlin":"kt","Ruby":"rb","PHP":"php","Scala":"scala","R":"r",
    "MATLAB":"m","Perl":"pl","Haskell":"hs","Lua":"lua","Dart":"dart",
    "Julia":"jl","Elixir":"ex","Clojure":"clj","F#":"fs","COBOL":"cob",
    "Fortran":"f90","Assembly (x86)":"asm","Bash":"sh",
}
ACE_MODES = {
    "Python":"python","JavaScript":"javascript","TypeScript":"typescript",
    "Java":"java","C":"c_cpp","C++":"c_cpp","C#":"csharp","Go":"golang",
    "Rust":"rust","Swift":"swift","Kotlin":"kotlin","Ruby":"ruby",
    "PHP":"php","Scala":"scala","R":"r","MATLAB":"matlab","Perl":"perl",
    "Haskell":"haskell","Lua":"lua","Dart":"dart","Elixir":"elixir",
    "Clojure":"clojure","Bash":"sh",
}
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-pro",
]
EXAMPLES = {
    "Fibonacci — Recursive": """\
# Fibonacci — Recursive
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)

if __name__ == "__main__":
    for i in range(10):
        print(f"fib({i}) = {fibonacci(i)}")
""",
    "Fibonacci — Iterative": """\
# Fibonacci — Iterative (space-efficient)
def fibonacci(n):
    if n <= 0:
        return 0
    a, b = 0, 1
    for _ in range(1, n):
        a, b = b, a + b  # swap without temp
    return b

if __name__ == "__main__":
    for i in range(10):
        print(f"fib({i}) = {fibonacci(i)}")
""",
    "Bubble Sort": """\
# Bubble Sort — O(n^2)
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

if __name__ == "__main__":
    print("Sorted:", bubble_sort([64, 34, 25, 12, 22, 11, 90]))
""",
    "Linked List": """\
# Singly Linked List
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        cur = self.head
        while cur.next:
            cur = cur.next
        cur.next = new_node

    def display(self):
        cur, out = self.head, []
        while cur:
            out.append(str(cur.data))
            cur = cur.next
        print(" -> ".join(out))

if __name__ == "__main__":
    ll = LinkedList()
    for v in [1, 2, 3, 4, 5]:
        ll.append(v)
    ll.display()
""",
    "Binary Search": """\
# Binary Search — O(log n)
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

if __name__ == "__main__":
    data = list(range(0, 100, 5))
    print(binary_search(data, 45))
""",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def complexity_analysis(code):
    lines      = [l for l in code.splitlines() if l.strip()]
    loc        = len(lines)
    comments   = sum(1 for l in lines if re.match(r'^\s*(#|//|/\*|\*)', l))
    loops      = len(re.findall(r'\b(for|while|forEach)\b', code))
    conditions = len(re.findall(r'\b(if|else|elif|switch|case)\b', code))
    nesting    = max((len(l)-len(l.lstrip()))//4 for l in lines) if lines else 0
    score      = loc*0.5 + loops*3 + conditions*2 + nesting*4
    difficulty = "Easy" if score < 20 else ("Medium" if score < 60 else "Hard")
    return {"loc":loc,"comments":comments,"loops":loops,
            "conditions":conditions,"nesting":nesting,
            "difficulty":difficulty,"score":round(score,1)}

def detect_language(code):
    patterns = {
        "Python":     [r'def ', r'import ', r'elif ', r'print\('],
        "JavaScript": [r'const ', r'let ', r'var ', r'=>', r'console\.log'],
        "TypeScript": [r': string', r': number', r'interface '],
        "Java":       [r'public class', r'System\.out', r'void main'],
        "C++":        [r'#include', r'std::', r'cout'],
        "C":          [r'#include', r'printf\(', r'int main\('],
        "C#":         [r'using System', r'Console\.Write', r'namespace '],
        "Go":         [r'func ', r'fmt\.', r':=', r'package main'],
        "Rust":       [r'fn main', r'let mut', r'println!'],
        "Ruby":       [r'def ', r'puts ', r'end$'],
        "PHP":        [r'<\?php', r'\$[a-z]', r'echo '],
        "Bash":       [r'#!/bin/bash', r'fi$', r'done$'],
    }
    scores = {lang: sum(1 for p in pats if re.search(p, code, re.MULTILINE))
              for lang, pats in patterns.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Unknown"

def clean_fences(text):
    text = re.sub(r'^```[\w]*\n?', '', text.strip())
    return re.sub(r'\n?```$', '', text).strip()

def call_gemini(api_key, model_name, prompt):
    client   = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=4096),
    )
    return clean_fences(response.text)

def stream_gemini(api_key, model_name, prompt):
    client = genai.Client(api_key=api_key)
    for chunk in client.models.generate_content_stream(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=4096),
    ):
        if chunk.text:
            yield chunk.text

# ── Session state ─────────────────────────────────────────────────────────────
for k, v in [("translated_code",""),("explanation",""),("source_code","")]:
    if k not in st.session_state:
        st.session_state[k] = v

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align:center;padding:0.5rem 0 1rem'>
        <span style='font-size:2.5rem'>🗿</span>
        <p style='color:#bd93f9;font-family:"JetBrains Mono",monospace;font-size:0.75rem;letter-spacing:0.12em;margin:4px 0 0'>ROSETTA STONE</p>
        <p style='color:#50fa7b;font-size:0.68rem;margin:4px 0 0'>✦ Powered by Google Gemini (Free)</p>
    </div>""", unsafe_allow_html=True)
    st.markdown("---")

    st.markdown('<p class="section-label">🔑 Gemini API Key</p>', unsafe_allow_html=True)
    api_key = st.text_input("API Key", type="password", placeholder="AIza...", label_visibility="collapsed")
    st.markdown("<div style='font-size:0.71rem;color:#50fa7b;padding:2px 0 8px'>🆓 Free at <strong>aistudio.google.com</strong></div>", unsafe_allow_html=True)

    model_choice = st.selectbox("Gemini Model", GEMINI_MODELS, index=0)

    st.markdown("---")
    st.markdown('<p class="section-label">📚 Algorithm Library</p>', unsafe_allow_html=True)
    for name in EXAMPLES:
        if st.button(f"  {name}", use_container_width=True, key=f"ex_{name}"):
            st.session_state.update({"source_code":EXAMPLES[name],"translated_code":"","explanation":""})
            st.rerun()

    st.markdown("---")
    st.markdown("<div style='color:#6272a4;font-size:0.72rem;line-height:1.6'>Supports <strong style='color:#8be9fd'>28+ languages</strong>.<br>Auto-detects source language.</div>", unsafe_allow_html=True)

# ── Hero ──────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero">
    <h1>🗿 Universal Code Rosetta Stone</h1>
    <p>Translate any code between 28+ programming languages — preserving logic, comments & structure.</p>
</div>""", unsafe_allow_html=True)
st.markdown("---")

# ── Language selectors ────────────────────────────────────────────────────────
c1, c2, c3 = st.columns([5, 1, 5])
with c1:
    opts = ["Auto-Detect"] + LANGUAGES
    src_lang_sel = st.selectbox("Source Language", opts, index=opts.index("Python"))
with c2:
    st.markdown("<div style='text-align:center;padding-top:1.9rem;font-size:1.5rem'>⇄</div>", unsafe_allow_html=True)
with c3:
    tgt_lang_sel = st.selectbox("Target Language", LANGUAGES, index=LANGUAGES.index("JavaScript"))

st.markdown("<br>", unsafe_allow_html=True)

# ── Editors ───────────────────────────────────────────────────────────────────
left_col, right_col = st.columns(2, gap="medium")

with left_col:
    st.markdown('<p class="section-label">◈ Source Code</p>', unsafe_allow_html=True)
    ace_src = ACE_MODES.get(
        detect_language(st.session_state["source_code"])
        if src_lang_sel == "Auto-Detect" and st.session_state["source_code"]
        else src_lang_sel, "text")
    source_code = st_ace(
        value=st.session_state.get("source_code",""),
        language=ace_src, theme="dracula", font_size=14, tab_size=4,
        show_gutter=True, show_print_margin=False, wrap=False,
        auto_update=True, height=380, key="source_editor",
        placeholder="// Paste your code here — any language...",
    )
    if source_code:
        st.session_state["source_code"] = source_code
    if src_lang_sel == "Auto-Detect" and source_code:
        st.markdown(f'<span class="chip chip-lang">⚡ Detected: {detect_language(source_code)}</span>', unsafe_allow_html=True)

with right_col:
    st.markdown('<p class="section-label">◈ Translated Code</p>', unsafe_allow_html=True)
    tgt_ace_mode = ACE_MODES.get(tgt_lang_sel, "text")
    st_ace(
        value=st.session_state.get("translated_code",""),
        language=tgt_ace_mode, theme="dracula", font_size=14, tab_size=4,
        show_gutter=True, show_print_margin=False, wrap=False,
        auto_update=False, readonly=True, height=380, key="target_editor",
        placeholder="// Translation will appear here...",
    )
    if st.session_state["translated_code"]:
        ext = EXTENSIONS.get(tgt_lang_sel,"txt")
        st.download_button(f"⬇ Download .{ext}", data=st.session_state["translated_code"],
                           file_name=f"translated.{ext}", mime="text/plain", use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)

# ── Complexity ────────────────────────────────────────────────────────────────
if source_code:
    s  = complexity_analysis(source_code)
    cc = {"Easy":"chip-easy","Medium":"chip-medium","Hard":"chip-hard"}[s["difficulty"]]
    st.markdown(
        f'<p class="section-label">⚙ Complexity Analysis</p>'
        f'<span class="chip chip-lines">📄 {s["loc"]} lines</span>'
        f'<span class="chip chip-lang">💬 {s["comments"]} comments</span>'
        f'<span class="chip chip-lang">🔁 {s["loops"]} loops</span>'
        f'<span class="chip chip-lang">🔀 {s["conditions"]} conditionals</span>'
        f'<span class="chip chip-lang">⚡ nesting ≤ {s["nesting"]}</span>'
        f'<span class="chip {cc}">Difficulty: {s["difficulty"]} ({s["score"]} pts)</span>',
        unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

# ── Translate button ──────────────────────────────────────────────────────────
btn_col, _, _ = st.columns([2, 3, 2])
with btn_col:
    go = st.button("🚀  Translate Code", use_container_width=True, type="primary")

if go:
    if not api_key:
        st.error("🔑 Enter your Gemini API key in the sidebar. Free at aistudio.google.com")
    elif not source_code or not source_code.strip():
        st.warning("✏️ Paste some source code first.")
    else:
        actual_src = detect_language(source_code) if src_lang_sel == "Auto-Detect" else src_lang_sel
        if actual_src == tgt_lang_sel:
            st.warning("⚠️ Source and target languages are the same.")
        else:
            progress = st.progress(0, text="Initialising Gemini…")
            time.sleep(0.15)
            progress.progress(15, text=f"Translating {actual_src} → {tgt_lang_sel}…")

            t_prompt = f"""You are an elite polyglot programmer. Translate the following {actual_src} code into idiomatic {tgt_lang_sel}.
Rules:
1. Preserve ALL comments in target language comment syntax.
2. Keep variable names identical unless they are reserved keywords.
3. Use idiomatic {tgt_lang_sel} patterns.
4. Map libraries to the closest {tgt_lang_sel} equivalent.
5. Output ONLY the translated code — no markdown fences, no explanation.

{source_code}"""

            live = st.empty()
            buf  = ""
            with st.spinner(f"✦ Gemini is translating {actual_src} → {tgt_lang_sel}…"):
                try:
                    for chunk in stream_gemini(api_key, model_choice, t_prompt):
                        buf += chunk
                        live.code(clean_fences(buf), language=tgt_ace_mode)
                    buf = clean_fences(buf)
                    progress.progress(65, text="Generating explanation…")
                except Exception as e:
                    st.error(f"Translation error: {e}")
                    st.stop()

            st.session_state["translated_code"] = buf

            e_prompt = f"""Given this {actual_src} → {tgt_lang_sel} translation, write 5 concise bullet points (use • character) explaining:
• Key syntax differences
• Library/API mappings used
• Paradigm shifts if any
• Idiomatic {tgt_lang_sel} patterns applied
• Gotchas to watch for
Plain text only, no markdown.

SOURCE ({actual_src}):
{source_code}

TARGET ({tgt_lang_sel}):
{buf}"""

            with st.spinner("📝 Generating explanation…"):
                try:
                    st.session_state["explanation"] = call_gemini(api_key, model_choice, e_prompt)
                except Exception as e:
                    st.session_state["explanation"] = f"Could not generate explanation: {e}"

            progress.progress(100, text="✅ Done!")
            time.sleep(0.3)
            progress.empty()
            live.empty()
            st.rerun()

# ── Explanation ───────────────────────────────────────────────────────────────
if st.session_state["explanation"]:
    st.markdown('<p class="section-label">💡 Key Differences Explained</p>', unsafe_allow_html=True)
    st.markdown(f'<div class="explain-box">{st.session_state["explanation"]}</div>', unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("""<hr>
<div style='text-align:center;color:#44475a;font-size:0.72rem;font-family:"JetBrains Mono",monospace;padding:0.5rem 0 1.5rem'>
    🗿 Universal Code Rosetta Stone &nbsp;·&nbsp; Powered by Google Gemini (Free) &nbsp;·&nbsp; Your API key is never stored
</div>""", unsafe_allow_html=True)