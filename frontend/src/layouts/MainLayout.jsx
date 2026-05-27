import PropTypes from 'prop-types'
import NavBar from '../components/NavBar'

export default function MainLayout({ children, onNavigate, currentPath }) {
  return (
    <div className="app-root">
      <NavBar onNavigate={onNavigate} currentPath={currentPath} />
      <main id="main" role="main">
        {children}
      </main>
      <footer aria-label="Footer">
        <p>SmartChair — prototype UI · © {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

MainLayout.propTypes = {
  children: PropTypes.node,
  onNavigate: PropTypes.func.isRequired,
  currentPath: PropTypes.string,
}

MainLayout.defaultProps = { currentPath: '/' }
