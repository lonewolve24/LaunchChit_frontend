import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

const router = getRouter()

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const rootElement = document.getElementById('app')!
  // Don't pre-clear the boot shell — React's first commit will replace
  // it atomically. Manually emptying #app first causes a one-frame flash
  // of the page background that reads as a header border / glitch.
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}

bootstrap()
