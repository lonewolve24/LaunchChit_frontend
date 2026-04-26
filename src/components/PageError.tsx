type Props = {
  status: 404 | 500
  message?: string
}

const copy = {
  404: {
    heading: 'Page Not Found',
    body: 'The page you are looking for does not exist.',
  },
  500: {
    heading: 'Something Went Wrong',
    body: 'An unexpected error occurred. Please try again.',
  },
}

export function PageError({ status, message }: Props) {
  const { heading, body } = copy[status]
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl font-bold text-primary-muted mb-4">{status}</p>
      <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
      <p className="mt-2 text-sm text-foreground-muted max-w-sm">{message ?? body}</p>
      <a
        href="/"
        className="mt-6 text-sm font-semibold text-primary hover:text-primary-light transition-colors"
      >
        ← Back to feed
      </a>
    </div>
  )
}
