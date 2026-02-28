import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LandingPage } from './components/LandingPage'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { Unsubscribe } from './pages/Unsubscribe'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticlePage } from './pages/ArticlePage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            fontFamily: '"Space Grotesk", sans-serif',
          },
          success: {
            iconTheme: { primary: '#39ff14', secondary: '#0a0a0a' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
