import Header from '../header/Header'
import Footer from '../footer/Footer'
import Routers from '../routers/Routers'
import { BrowserRouter as Router } from 'react-router-dom'

export default function Layout() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Header />
        <main className="flex-1 px-4 py-8">
          <Routers />
        </main>
        <Footer />
      </div>
    </Router>
  )
}
