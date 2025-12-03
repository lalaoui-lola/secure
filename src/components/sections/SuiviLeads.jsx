import { useState } from 'react'
import { supabase } from '../../config/supabase'
import { Search, Loader2, History, Calendar, User, FileText, Clock } from 'lucide-react'

const ONGLETS = [
    'Nouveau leads',
    'Leads traité',
    'RDV pris',
    'RDV j+1',
    'RDV autre centre'
]

export default function SuiviLeads() {
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        setLoading(true)
        setSearched(true)
        try {
            // Rechercher le lead dans tous les onglets
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .ilike('nom', `%${searchTerm.trim()}%`)
                .order('created_at', { ascending: true })

            if (error) throw error

            // Grouper par onglet et trier par date d'injection
            const historyData = data.map(lead => ({
                ...lead,
                dateReference: lead.created_at // Date d'injection comme référence
            }))

            setHistory(historyData)
        } catch (error) {
            console.error('Error searching lead:', error)
            alert(`Erreur lors de la recherche : ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getOngletColor = (onglet) => {
        const colors = {
            'Nouveau leads': 'bg-blue-100 text-blue-700 border-blue-200',
            'Leads traité': 'bg-green-100 text-green-700 border-green-200',
            'RDV pris': 'bg-purple-100 text-purple-700 border-purple-200',
            'RDV j+1': 'bg-orange-100 text-orange-700 border-orange-200',
            'RDV autre centre': 'bg-pink-100 text-pink-700 border-pink-200'
        }
        return colors[onglet] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white">
                    <History className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Suivi Leads</h1>
                    <p className="text-slate-500">Recherchez et suivez l'historique complet d'un lead</p>
                </div>
            </div>

            {/* Search Form */}
            <div className="glass-effect rounded-xl p-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Entrez le nom du lead..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchTerm.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Recherche...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Rechercher
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Results */}
            {searched && (
                <div className="glass-effect rounded-xl p-6">
                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">Aucun lead trouvé avec ce nom</p>
                            <p className="text-slate-400 text-sm mt-2">Essayez avec un autre nom ou vérifiez l'orthographe</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">
                                    Historique trouvé : <span className="text-primary-600">{history.length}</span> entrée(s)
                                </h2>
                            </div>

                            {/* Timeline */}
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200"></div>

                                {/* Timeline items */}
                                <div className="space-y-6">
                                    {history.map((entry, index) => (
                                        <div key={entry.id} className="relative pl-20">
                                            {/* Timeline dot */}
                                            <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary-500 border-4 border-white shadow-lg"></div>

                                            {/* Card */}
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                {/* Card Header */}
                                                <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-200">
                                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getOngletColor(entry.onglet)}`}>
                                                                {entry.onglet}
                                                            </span>
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="font-medium">Date injection:</span>
                                                                <span className="font-semibold text-slate-800">{formatDate(entry.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-4 space-y-3">
                                                    {/* Nom et Statut */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <User className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-medium">Nom</p>
                                                                <p className="text-slate-800 font-semibold">{entry.nom || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <FileText className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-medium">Statut Lead</p>
                                                                <p className="text-slate-800 font-semibold">{entry.statut_lead || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Propriétaire */}
                                                    <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                                        <User className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-red-500 uppercase font-medium">Propriétaire</p>
                                                            <p className="text-red-600 font-bold text-lg">{entry.proprietaire_contact || '-'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Dates importantes selon statut */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {entry.statut_lead === 'Nouveau' ? (
                                                            /* Pour les leads avec statut Nouveau */
                                                            <>
                                                                <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                                    <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs text-blue-500 uppercase font-medium">Date de création</p>
                                                                        <p className="text-blue-700 font-semibold">{formatDateTime(entry.date_creation_lead) || '-'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                                    <Clock className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs text-purple-500 uppercase font-medium">Date d'attribution</p>
                                                                        <p className="text-purple-700 font-semibold">{formatDateTime(entry.date_attribution_proprietaire) || '-'}</p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            /* Pour les leads avec autres statuts */
                                                            <>
                                                                <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs text-amber-500 uppercase font-medium">Dernière modification</p>
                                                                        <p className="text-amber-700 font-semibold">{formatDateTime(entry.date_derniere_modification) || '-'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                                                    <Clock className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-xs text-emerald-500 uppercase font-medium">Date d'attribution</p>
                                                                        <p className="text-emerald-700 font-semibold">{formatDateTime(entry.date_attribution_proprietaire) || '-'}</p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Informations RDV (si applicable) */}
                                                    {(entry.date_prise_rdv || entry.date_rdv || entry.date_heure_rdv) && (
                                                        <div className="border-t border-slate-200 pt-3 mt-3">
                                                            <p className="text-xs text-slate-500 uppercase font-medium mb-2">Informations RDV</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {entry.date_prise_rdv && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-slate-600">Prise RDV:</span>
                                                                        <span className="font-semibold text-slate-800">{formatDate(entry.date_prise_rdv)}</span>
                                                                    </div>
                                                                )}
                                                                {entry.date_rdv && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-slate-600">Date RDV:</span>
                                                                        <span className="font-semibold text-slate-800">{formatDate(entry.date_rdv)}</span>
                                                                    </div>
                                                                )}
                                                                {entry.date_heure_rdv && (
                                                                    <div className="flex items-center gap-2 text-sm col-span-full">
                                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-slate-600">Date & Heure RDV:</span>
                                                                        <span className="font-semibold text-slate-800">{formatDateTime(entry.date_heure_rdv)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Contact Info */}
                                                    <div className="border-t border-slate-200 pt-3 mt-3">
                                                        <p className="text-xs text-slate-500 uppercase font-medium mb-2">Coordonnées</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-slate-600">Email:</span>
                                                                <p className="font-medium text-slate-800 truncate">{entry.email || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Téléphone:</span>
                                                                <p className="font-medium text-slate-800">{entry.telephone || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Code Postal:</span>
                                                                <p className="font-medium text-slate-800">{entry.code_postal || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Notes */}
                                                    {entry.contact_notes && (
                                                        <div className="border-t border-slate-200 pt-3 mt-3">
                                                            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Notes</p>
                                                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{entry.contact_notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Fichier source */}
                                                    <div className="text-xs text-slate-400 flex items-center gap-2 pt-2">
                                                        <FileText className="w-3 h-3" />
                                                        <span>Fichier: {entry.nom_fichier || 'Non spécifié'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
