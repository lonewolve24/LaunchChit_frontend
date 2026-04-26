import { useEffect, useState } from 'react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollUp() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Scroll to top"
      title="Scroll to top"
      className="fixed bottom-4 left-4 z-[80] w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-colors"
      style={{ boxShadow: '0 8px 20px -4px rgb(0 0 0 / 0.25)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}
