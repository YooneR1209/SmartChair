import PropTypes from 'prop-types'

export default function NavBar({ onNavigate, currentPath }) {
  const links = [
    { to: '/home', label: 'Home' },
    { to: '/submissions', label: 'Submissions' },
    { to: '/about', label: 'About' },
  ]

  const handleClick = (e, to) => {
    e.preventDefault()
    onNavigate(to)
  }

  return (
    <header>
      <a href="#main" className="skip-link">Skip to content</a>
      <nav aria-label="Primary" className="site-nav">
        <ul>
          {links.map((l) => (
            <li key={l.to}>
              <a
                href={l.to}
                onClick={(e) => handleClick(e, l.to)}
                aria-current={currentPath === l.to ? 'page' : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

NavBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  currentPath: PropTypes.string,
}

NavBar.defaultProps = { currentPath: '/' }
