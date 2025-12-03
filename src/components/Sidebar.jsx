import { NavLink } from 'react-router-dom'
import {
    UserPlus,
    CheckCircle,
    Calendar,
    CalendarPlus,
    Building2,
    FileSpreadsheet,
    History,
    ClipboardList,
    LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
    { path: '/dashboard/nouveau-leads', icon: UserPlus, label: 'Nouveau leads' },
    { path: '/dashboard/leads-traite', icon: CheckCircle, label: 'Leads traité' },
    { path: '/dashboard/rdv-pris', icon: Calendar, label: 'RDV pris' },
    { path: '/dashboard/rdv-j1', icon: CalendarPlus, label: 'RDV j+1' },
    { path: '/dashboard/rdv-autre-centre', icon: Building2, label: 'RDV autre centre' },
    { path: '/dashboard/suivi-leads', icon: History, label: 'Suivi leads' },
    { path: '/dashboard/suivi-rdv', icon: ClipboardList, label: 'Suivi des RDV' },
    { path: '/dashboard/correction-excel', icon: FileSpreadsheet, label: 'Correction excel' },
]

export default function Sidebar() {
    const { signOut, user } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col z-10">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    Admin Dashboard
                </h2>
                <p className="text-sm text-slate-500 mt-1 truncate">
                    {user?.email}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200 font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    )
}
