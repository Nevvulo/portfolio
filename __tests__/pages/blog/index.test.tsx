import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import Blog from '../../../pages/blog/index'
import { LightTheme } from '../../../constants/theme'

const mockPosts = [
  {
    slug: 'test-post-1',
    title: 'Test Post 1',
    description: 'This is a test post',
    labels: ['javascript', 'react'],
    created: '2024-01-01',
    cover: null,
  },
  {
    slug: 'test-post-2',
    title: 'Test Post 2',
    description: 'Another test post',
    labels: ['typescript'],
    created: '2024-01-02',
    cover: null,
  },
]

describe('Blog Page', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={LightTheme}>
        {component}
      </ThemeProvider>
    )
  }

  it('renders without crashing', () => {
    renderWithTheme(<Blog posts={mockPosts} />)
  })

  it('displays the blog title', () => {
    renderWithTheme(<Blog posts={mockPosts} />)
    const title = screen.getByText(/Blog/i)
    expect(title).toBeInTheDocument()
  })

  it('renders blog posts', () => {
    renderWithTheme(<Blog posts={mockPosts} />)
    
    expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    expect(screen.getByText('Test Post 2')).toBeInTheDocument()
  })

  it('displays post descriptions', () => {
    renderWithTheme(<Blog posts={mockPosts} />)
    
    expect(screen.getByText('This is a test post')).toBeInTheDocument()
    expect(screen.getByText('Another test post')).toBeInTheDocument()
  })

  it('handles empty posts array', () => {
    renderWithTheme(<Blog posts={[]} />)
    const title = screen.getByText(/Blog/i)
    expect(title).toBeInTheDocument()
  })

  it('handles null posts', () => {
    renderWithTheme(<Blog posts={null} />)
    const title = screen.getByText(/Blog/i)
    expect(title).toBeInTheDocument()
  })
})