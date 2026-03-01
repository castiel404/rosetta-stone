import './globals.css'

export const metadata = {
  title: 'Rosetta Stone — Universal Code Translator',
  description: 'Translate code between 28+ programming languages using AI. Free, fast, and accurate.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
