import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="ml-72 min-h-screen">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
