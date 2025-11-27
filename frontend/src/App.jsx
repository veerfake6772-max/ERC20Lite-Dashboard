import { useEffect } from 'react'
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Transfer from './pages/Transfer'
import Mint from './pages/Mint'
import Approve from './pages/Approve'
import TransferFrom from './pages/TransferFrom'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/transfer', label: 'Transfer' },
  { path: '/mint', label: 'Mint' },
  { path: '/approve', label: 'Approve' },
  { path: '/transfer-from', label: 'TransferFrom' },
]

const App = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    const handler = (accounts) => {
      const acc = accounts && accounts.length ? accounts[0] : null
      window.dispatchEvent(new CustomEvent('walletChanged', { detail: { account: acc } }))
    }
    window.ethereum.on('accountsChanged', handler)
    return () => {
      window.ethereum.removeListener('accountsChanged', handler)
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <header className="bg-white/10 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">ERC20 Lite Dashboard</h1>
            <nav className="flex flex-wrap gap-3 text-sm font-medium uppercase tracking-wide">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full transition-colors ${
                      isActive ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/approve" element={<Approve />} />
            <Route path="/transfer-from" element={<TransferFrom />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff' } }} />
    </Router>
  )
}

export default App
