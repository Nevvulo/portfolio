import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import ProjectsPage from '../../pages/projects/index'
import { LightTheme } from '../../constants/theme'

jest.mock('../../constants/projects', () => ({
  Projects: [
    {
      projectId: 'test-project',
      preview: () => <div>Test Project Preview</div>,
      background: 'linear-gradient(90deg, #000, #fff)',
    },
    {
      projectId: 'flux',
      preview: () => <div>Flux Preview</div>,
      background: 'linear-gradient(90deg, #000, #fff)',
    },
  ],
}))

describe('Projects Page', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={LightTheme}>
        {component}
      </ThemeProvider>
    )
  }

  it('renders without crashing', () => {
    renderWithTheme(<ProjectsPage />)
  })

  it('displays the projects title', () => {
    renderWithTheme(<ProjectsPage />)
    const title = screen.getByText('Projects')
    expect(title).toBeInTheDocument()
  })

  it('displays project filter tabs', () => {
    renderWithTheme(<ProjectsPage />)
    const allTab = screen.getByText('All')
    expect(allTab).toBeInTheDocument()
  })

  it('renders featured project', () => {
    renderWithTheme(<ProjectsPage />)
    const fluxProject = screen.getByText('Flux Preview')
    expect(fluxProject).toBeInTheDocument()
  })
})