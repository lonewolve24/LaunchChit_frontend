import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

function Hello() {
  return <p>LaunchedChit</p>
}

describe('test runner', () => {
  it('renders a component', () => {
    render(<Hello />)
    expect(screen.getByText('LaunchedChit')).toBeInTheDocument()
  })
})
