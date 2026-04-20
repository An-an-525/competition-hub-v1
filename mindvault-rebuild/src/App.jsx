import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Skills from './pages/Skills'
import Thoughts from './pages/Thoughts'
import Goals from './pages/Goals'
import Sources from './pages/Sources'
import Files from './pages/Files'
import Achievements from './pages/Achievements'
import Review from './pages/Review'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/thoughts" element={<Thoughts />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/files" element={<Files />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
