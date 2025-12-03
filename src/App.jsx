import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NouveauLeads from './components/sections/NouveauLeads'
import LeadsTraite from './components/sections/LeadsTraite'
import RdvPris from './components/sections/RdvPris'
import RdvJ1 from './components/sections/RdvJ1'
import RdvAutreCentre from './components/sections/RdvAutreCentre'
import SuiviLeads from './components/sections/SuiviLeads'
import SuiviRdv from './components/sections/SuiviRdv'
import CorrectionExcel from './components/sections/CorrectionExcel'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/dashboard/nouveau-leads" replace />} />
                        <Route path="nouveau-leads" element={<NouveauLeads />} />
                        <Route path="leads-traite" element={<LeadsTraite />} />
                        <Route path="rdv-pris" element={<RdvPris />} />
                        <Route path="rdv-j1" element={<RdvJ1 />} />
                        <Route path="rdv-autre-centre" element={<RdvAutreCentre />} />
                        <Route path="suivi-leads" element={<SuiviLeads />} />
                        <Route path="suivi-rdv" element={<SuiviRdv />} />
                        <Route path="correction-excel" element={<CorrectionExcel />} />
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
