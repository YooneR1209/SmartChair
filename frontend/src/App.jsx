import { useEffect, useState } from 'react'
import './App.css'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import About from './pages/About'
import Submissions from './pages/Submissions'

function App() {
  const [route, setRoute] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to) => {
    if (to === route) return
    window.history.pushState({}, '', to)
    setRoute(to)
  }

  let Page = null
  if (route === '/' || route === '/home') Page = Home
  else if (route === '/about') Page = About
  else if (route === '/submissions') Page = Submissions
  else Page = Home

  const PageComponent = Page

  return (
    <MainLayout onNavigate={navigate} currentPath={route}>
      <PageComponent />
    </MainLayout>
  )
}

export default App
