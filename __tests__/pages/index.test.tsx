import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import Home from '../../pages/index'
import { LightTheme } from '../../constants/theme'

describe('Home Page', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={LightTheme}>
        {component}
      </ThemeProvider>
    )
  }

  it('renders without crashing', () => {
    renderWithTheme(<Home />)
  })

  it('displays the main heading', () => {
    renderWithTheme(<Home />)
    const heading = screen.getByText(/Blake/i)
    expect(heading).toBeInTheDocument()
  })

  it('displays the subtitle', () => {
    renderWithTheme(<Home />)
    const subtitle = screen.getByText(/full-stack developer/i)
    expect(subtitle).toBeInTheDocument()
  })

  it('has navigation buttons', () => {
    renderWithTheme(<Home />)
    const blogButton = screen.getByRole('link', { name: /blog/i })
    const projectsButton = screen.getByRole('link', { name: /projects/i })
    
    expect(blogButton).toBeInTheDocument()
    expect(projectsButton).toBeInTheDocument()
  })

  it('displays social links', () => {
    renderWithTheme(<Home />)
    // Check for social links container
    const socialLinks = screen.getByText(/Connect with me/i)
    expect(socialLinks).toBeInTheDocument()
  })
})