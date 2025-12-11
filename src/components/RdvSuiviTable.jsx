import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Calendar, Loader2, Search, X, Info } from 'lucide-react'
import HistoriqueModal from './HistoriqueModal'

export default function RdvSuiviTable({ onglet, icon: Icon, title, description }) {
    const [selectedDate, setSelectedDate] = useState('')
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)

    useEffect(() => {
        // Si une date est déjà sélectionnée au chargement, appliquer le filtre
        if (selectedDate) {
            fetchLeadsByDate(selectedDate)
        }
    }, [])

    const fetchLeadsByDate = async (date) => {
        if (!date) return

        setLoading(true)
        
        try {
            // Créer les limites de dates pour inclure toute la journée
            const startDateStr = `${date}T00:00:00`
            const endDateStr = `${date}T23:59:59`
            
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('onglet', 'RDV j+1')
                .gte('date_heure_rdv', startDateStr)
                .lte('date_heure_rdv', endDateStr)
                .order('date_heure_rdv', { ascending: true })

            if (error) throw error
            setLeads(data || [])
        } catch (error) {
            console.error('Erreur lors de la récupération des leads :', error)
            setLeads([])
            setFilteredLeads([])
        } finally {
            setLoading(false)
        }
    }

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value)
    }

    const applyDateFilter = () => {
        fetchLeadsByDate(selectedDate)
    }

    const clearDateFilter = () => {
        setSelectedDate('')
        setLeads([])
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-'
        
        // Vérifier si la date a un Z à la fin (format UTC)
        if (typeof dateStr === 'string' && dateStr.endsWith('Z')) {
            // Utiliser le parse manuel pour préserver l'heure exacte sans conversion
            const parts = dateStr.slice(0, -1).split('T') // Retirer le Z et séparer date et heure
            const dateParts = parts[0].split('-')
            const timeParts = parts[1].split(':')
            
            // Construire une chaîne de date au format français
            return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`
        }
        
        // Pour les autres formats, utiliser la méthode standard
        const date = new Date(dateStr)
        return date.toLocaleString('fr-FR')
    }

    const showHistorique = (lead) => {
        setSelectedLead(lead)
        setModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
                    <p className="text-slate-500">{description}</p>
                </div>
            </div>

            {/* Filtre de date */}
            <div className="glass-effect rounded-xl p-4">
                <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Filtre par date de rendez-vous
                </h2>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-base text-slate-700 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="w-5 h-5" /> Sélectionner une date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all w-full md:w-60 text-base"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={applyDateFilter}
                            disabled={!selectedDate}
                            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-1 md:flex-none justify-center font-medium">
                            <Search className="w-5 h-5" /> Afficher les RDV
                        </button>
                        {selectedDate && (
                            <button 
                                onClick={clearDateFilter}
                                className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center font-medium">
                                <X className="w-5 h-5" /> Effacer
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Champ de recherche supprimé */}

            {/* Tableau des rendez-vous */}
            {loading ? (
                <div className="glass-effect rounded-2xl p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : selectedDate && leads.length === 0 ? (
                <div className="glass-effect rounded-2xl p-12 text-center">
                    <p className="text-slate-500">Aucun rendez-vous trouvé pour cette date.</p>
                </div>
            ) : selectedDate ? (
                <div className="glass-effect rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">
                            {leads.length} rendez-vous le {new Date(selectedDate).toLocaleDateString('fr-FR')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nom</th>
                                    <th className="px-6 py-3 font-medium">Téléphone</th>
                                    <th className="px-6 py-3 font-medium">Date & Heure RDV</th>
                                    <th className="px-6 py-3 font-medium">Propriétaire</th>
                                    <th className="px-6 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-medium">{lead.nom || '-'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.telephone || '-'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_heure_rdv)}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.proprietaire_contact || '-'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <button
                                                onClick={() => showHistorique(lead)}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
                                            >
                                                <Info className="w-4 h-4" />
                                                Historique
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-effect rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 mb-1">Sélectionnez une date pour afficher les rendez-vous</p>
                    <p className="text-slate-400 text-sm">Les rendez-vous correspondant à la date sélectionnée seront affichés ici</p>
                </div>
            )}

            {/* Modal d'historique */}
            {modalOpen && selectedLead && (
                <HistoriqueModal 
                    lead={selectedLead}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    )
}
