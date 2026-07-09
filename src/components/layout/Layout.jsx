import { useState } from 'react'
import WelcomeOverlay from '../welcome/WelcomeOverlay'
import BackgroundEffects from '../common/BackgroundEffects'
import Header from '../header/Header'
import Footer from '../footer/Footer'
import Routers from '../routers/Routers'
import { BrowserRouter as Router } from 'react-router-dom'

export default function Layout() {
  const [showWelcome, setShowWelcome] = useState(
    () => sessionStorage.getItem('drawcheck_entered') !== 'true'
  )

  const handleEnter = () => {
    sessionStorage.setItem('drawcheck_entered', 'true')
    setShowWelcome(false)
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col relative">
        <BackgroundEffects />
        {showWelcome && <WelcomeOverlay onEnter={handleEnter} />}
        {!showWelcome && (
          <>
            <Header />
            <main className="flex-1 px-4 py-8 relative z-10">
              <Routers />
            </main>
            <Footer />
          </>
        )}
      </div>
    </Router>
  )
}
