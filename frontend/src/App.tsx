import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import SupervisorDashboard from './pages/Supervisor/SupervisorDashboard'
import PreventionistDashboard from './pages/Preventionist/PreventionistDashboard'
import SupervisorActivitiesPage from './pages/Preventionist/SupervisorActivitiesPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  // test comment
  // test comment
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard/supervisor"
        element={
          <ProtectedRoute allowedRole="supervisor">
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/preventionist"
        element={
          <ProtectedRoute allowedRole="preventionist">
            <PreventionistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preventionist/supervisor/:supervisorId"
        element={
          <ProtectedRoute allowedRole="preventionist">
            <SupervisorActivitiesPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
