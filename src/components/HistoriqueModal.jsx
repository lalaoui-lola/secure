import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { X, Loader2, User, FileText, Clock, Calendar } from 'lucide-react'

export default function HistoriqueModal({ lead, onClose }) {
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState([])

    useEffect(() => {
        fetchHistorique()
    }, [])

    const fetchHistorique = async () => {
        setLoading(true)
        try {
            // Récupérer l'historique du lead en utilisant son identifiant
            // Cette requête est similaire à celle utilisée dans l'onglet "Suivi leads"
            const { data, error } = await supabase
                .from('leads_history')
                .select('*')
                .eq('lead_id', lead.id)
                .order('date_modification', { ascending: false })

            if (error) throw error
            
            if (data && data.length > 0) {
                setHistorique(data)
                setEntries(data)
            } else {
                // Si aucun historique n'est trouvé, créer un historique simulé
                const simulatedEntries = createSimulatedHistory()
                setHistorique(simulatedEntries)
                setEntries(simulatedEntries)
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique :', error)
            const simulatedEntries = createSimulatedHistory()
            setHistorique(simulatedEntries)
            setEntries(simulatedEntries)
        } finally {
            setLoading(false)
        }
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('fr-FR')
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR')
    }

    // Créer un historique simulé basé sur les informations du lead
    const createSimulatedHistory = () => {
        const entries = [
            {
                id: `${lead.id}-creation`,
                type: 'Nouveau leads',
                date_injection: lead.created_at,
                nom: lead.nom,
                statut_lead: 'nouveau',
                proprietaire_contact: lead.proprietaire_contact,
                date_derniere_modification: lead.date_derniere_modification || lead.created_at,
                date_attribution: lead.date_attribution_proprietaire,
                email: lead.email,
                telephone: lead.telephone,
                code_postal: lead.code_postal
            }
        ]

        // Ajouter une entrée pour le rendez-vous si disponible
        if (lead.date_heure_rdv) {
            entries.push({
                id: `${lead.id}-rdv`,
                type: 'RDV pris',
                date_injection: lead.date_prise_rdv || lead.date_derniere_modification,
                nom: lead.nom,
                statut_lead: 'rdv_pris',
                proprietaire_contact: lead.proprietaire_contact,
                date_derniere_modification: lead.date_prise_rdv || lead.date_derniere_modification,
                date_attribution: lead.date_attribution_proprietaire,
                email: lead.email,
                telephone: lead.telephone,
                code_postal: lead.code_postal,
                date_heure_rdv: lead.date_heure_rdv
            })
        }

        return entries
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="p-2 bg-primary-100 rounded-lg text-primary-600"><User className="w-6 h-6" /></span>
                        Historique de {lead.nom || 'Lead'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Historique style Suivi des leads */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-primary-50 to-white p-3 rounded-lg mb-4">
                                <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                                    <span className="p-1.5 bg-primary-100 rounded-full text-primary-600"><FileText className="w-4 h-4" /></span>
                                    Historique trouvé : {entries.length} entrée(s)
                                </h3>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-6 space-y-6">
                                {entries.map((entry, index) => (
                                    <div key={entry.id} className="relative">
                                        {/* Timeline dots and line */}
                                        <div className="absolute left-[-24px] top-0 bottom-0 flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full bg-primary-500 z-10"></div>
                                            {index < entries.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-primary-200"></div>
                                            )}
                                        </div>

                                        {/* Card */}
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                            {/* Card header */}
                                            <div className="p-4 flex flex-wrap items-center gap-3">
                                                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                                                    {entry.type || 'Nouveau leads'}
                                                </span>
                                                <div className="flex items-center text-sm text-slate-500">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    Date injection: {formatDate(entry.date_injection)}
                                                </div>
                                            </div>

                                            {/* Card content */}
                                            <div className="p-4 pt-0">
                                                {/* Nom */}
                                                <div className="mb-3 flex items-start">
                                                    <div className="mr-3 mt-1">
                                                        <User className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">NOM</div>
                                                        <div className="font-medium">{entry.nom || lead.nom}</div>
                                                    </div>
                                                </div>

                                                {/* Statut */}
                                                <div className="mb-3 flex items-start">
                                                    <div className="mr-3 mt-1">
                                                        <FileText className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">STATUT LEAD</div>
                                                        <div className="font-medium">{entry.statut_lead || lead.statut_lead || 'nouveau'}</div>
                                                    </div>
                                                </div>

                                                {/* Propriétaire */}
                                                <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-3">
                                                    <div className="flex items-start">
                                                        <div className="mr-3 mt-1">
                                                            <User className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm mb-1">PROPRIÉTAIRE</div>
                                                            <div className="font-medium">{entry.proprietaire_contact || lead.proprietaire_contact || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    <div className="p-3 bg-amber-50 rounded-lg">
                                                        <div className="flex items-start">
                                                            <div className="mr-2">
                                                                <Clock className="w-4 h-4 text-amber-500" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-amber-700 mb-1">DERNIÈRE MODIFICATION</div>
                                                                <div className="text-sm font-medium text-amber-800">
                                                                    {formatDateTime(entry.date_derniere_modification || lead.date_derniere_modification)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-green-50 rounded-lg">
                                                        <div className="flex items-start">
                                                            <div className="mr-2">
                                                                <Clock className="w-4 h-4 text-green-500" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-green-700 mb-1">DATE D'ATTRIBUTION</div>
                                                                <div className="text-sm font-medium text-green-800">
                                                                    {formatDateTime(entry.date_attribution || lead.date_attribution_proprietaire)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Coordonnées */}
                                                <div className="mt-4">
                                                    <div className="text-sm text-slate-500 mb-2">COORDONNÉES</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div>
                                                            <div className="text-xs text-slate-400">Email:</div>
                                                            <div className="text-sm">{entry.email || lead.email || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-400">Téléphone:</div>
                                                            <div className="text-sm">{entry.telephone || lead.telephone || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-400">Code Postal:</div>
                                                            <div className="text-sm">{entry.code_postal || lead.code_postal || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* RDV info if available */}
                                                {(entry.date_heure_rdv || entry.type === 'RDV pris') && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                        <div className="text-sm text-blue-700 font-medium">
                                                            Rendez-vous programmé pour le {formatDateTime(entry.date_heure_rdv || lead.date_heure_rdv)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Fermer
                    </button>
                </div>
            </div>
        </div>
    )
}
