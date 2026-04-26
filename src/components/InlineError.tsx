type Props = {
  message: string | null
  id?: string
}

export function InlineError({ message, id }: Props) {
  if (!message) return null
  return (
    <p role="alert" id={id} className="text-xs text-destructive mt-1">
      {message}
    </p>
  )
}
