import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Results from '../pages/Results'

export default function Routers() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workspace" replace />} />
      <Route path="/workspace" element={<Home />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}
