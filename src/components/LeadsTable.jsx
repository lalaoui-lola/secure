import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { ChevronLeft, ChevronRight, Loader2, Trash2, ChevronDown, ChevronUp, Calendar, Search, X, AlertTriangle } from 'lucide-react'
import DuplicateLeadsModal from './DuplicateLeadsModal'

export default function LeadsTable({ onglet, icon: Icon, title, description }) {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedFile, setExpandedFile] = useState(null)
    const [currentPage, setCurrentPage] = useState({})
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [filteredFiles, setFilteredFiles] = useState([])
    const [isFilterActive, setIsFilterActive] = useState(false)
    const [showDuplicatesModal, setShowDuplicatesModal] = useState(false)
    const [duplicates, setDuplicates] = useState([])
    const leadsPerPage = 50

    useEffect(() => {
        fetchFiles()
    }, [onglet])

    useEffect(() => {
        if (files.length > 0) {
            setFilteredFiles(files)
        }
    }, [files])

    const fetchFiles = async () => {
        setLoading(true)
        try {
            // Get distinct file names with lead counts
            let query = supabase
                .from('leads')
                .select('nom_fichier, id, created_at')
                .eq('onglet', onglet)

            // Ajouter les filtres de date si nécessaire
            if (startDate && endDate) {
                // Convertir à la fin de la journée pour endDate pour inclure toute la journée
                const endDateWithTime = new Date(endDate)
                endDateWithTime.setHours(23, 59, 59, 999)
                
                query = query
                    .gte('created_at', startDate)
                    .lte('created_at', endDateWithTime.toISOString())
            }

            const { data, error } = await query

            if (error) throw error

            // Group by file name and count
            const fileMap = {}
            data.forEach(lead => {
                const fileName = lead.nom_fichier || 'Sans nom'
                if (!fileMap[fileName]) {
                    fileMap[fileName] = 0
                }
                fileMap[fileName]++
            })

            const fileList = Object.entries(fileMap).map(([name, count]) => ({
                name,
                count
            }))

            setFiles(fileList)
            setFilteredFiles(fileList)
        } catch (error) {
            console.error('Error fetching files:', error)
            setFiles([])
            setFilteredFiles([])
        } finally {
            setLoading(false)
        }
    }

    const fetchLeadsForFile = async (fileName) => {
        const page = currentPage[fileName] || 1
        const from = (page - 1) * leadsPerPage
        const to = from + leadsPerPage - 1

        let query = supabase
            .from('leads')
            .select('*')
            .eq('onglet', onglet)
            .eq('nom_fichier', fileName)
        
        // Ajouter les filtres de date si nécessaire
        if (startDate && endDate) {
            // Convertir à la fin de la journée pour endDate pour inclure toute la journée
            const endDateWithTime = new Date(endDate)
            endDateWithTime.setHours(23, 59, 59, 999)
            
            query = query
                .gte('created_at', startDate)
                .lte('created_at', endDateWithTime.toISOString())
        }

        query = query
            .range(from, to)
            .order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) {
            console.error('Error fetching leads:', error)
            return []
        }
        return data || []
    }

    const handleDeleteFile = async (fileName) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${fileName}" et tous ses leads ?`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('onglet', onglet)
                .eq('nom_fichier', fileName)

            if (error) throw error

            // Refresh file list
            fetchFiles()
            setExpandedFile(null)
        } catch (error) {
            console.error('Error deleting file:', error)
            alert(`Erreur lors de la suppression : ${error.message}`)
        }
    }

    const toggleFile = async (fileName) => {
        if (expandedFile === fileName) {
            setExpandedFile(null)
        } else {
            setExpandedFile(fileName)
            if (!currentPage[fileName]) {
                setCurrentPage(prev => ({ ...prev, [fileName]: 1 }))
            }
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR')
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

    const applyDateFilter = () => {
        setIsFilterActive(Boolean(startDate && endDate))
        setExpandedFile(null)
        fetchFiles()
    }
    
    const clearDateFilter = () => {
        setStartDate('')
        setEndDate('')
        setIsFilterActive(false)
        setExpandedFile(null)
        fetchFiles()
    }

    // Fonction de recherche supprimée

    const totalLeads = filteredFiles.reduce((sum, file) => sum + file.count, 0)

    // Fonction pour récupérer les doublons
    const fetchDuplicates = async () => {
        try {
            // Récupérer uniquement les leads de l'onglet "Nouveau leads" avec statut "nouveau"
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('nom, id, created_at, telephone, onglet, statut_lead')
                .eq('onglet', 'Nouveau leads')
                .eq('statut_lead', 'nouveau')
                .order('created_at', { ascending: false })
            
            if (leadsError) throw leadsError
            
            // Trouver les doublons par nom
            const nameCount = {};
            const duplicateLeads = [];
            
            // Première passe pour compter les occurrences
            leadsData.forEach(lead => {
                if (lead.nom) {
                    const normalizedName = lead.nom.trim().toLowerCase();
                    nameCount[normalizedName] = (nameCount[normalizedName] || 0) + 1;
                }
            });
            
            // Deuxième passe pour collecter les leads avec noms en double
            leadsData.forEach(lead => {
                if (lead.nom) {
                    const normalizedName = lead.nom.trim().toLowerCase();
                    if (nameCount[normalizedName] > 1) {
                        duplicateLeads.push(lead);
                    }
                }
            });
            
            // Grouper les leads par nom
            const groupedDuplicates = Object.entries(duplicateLeads.reduce((acc, lead) => {
                const name = lead.nom.trim().toLowerCase();
                if (!acc[name]) acc[name] = [];
                acc[name].push(lead);
                return acc;
            }, {}));
            
            setDuplicates(groupedDuplicates);
            setShowDuplicatesModal(true);
        } catch (error) {
            console.error('Erreur lors de la récupération des doublons:', error)
            alert('Erreur lors de la récupération des doublons. Veuillez réessayer.')
        }
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

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                    {filteredFiles.length} Fichier(s) - {totalLeads} Leads {isFilterActive ? "(filtrés)" : ""}
                </h2>
            </div>

            {/* Filtres de date */}
            <div className="glass-effect rounded-xl p-4">
                <h2 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Filtre par date d'injection
                </h2>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-base text-slate-700 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="w-5 h-5" /> Date de début
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all w-full md:w-60 text-base"
                        />
                    </div>
                    <div className="flex flex-col w-full md:w-auto">
                        <label className="text-base text-slate-700 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="w-5 h-5" /> Date de fin
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all w-full md:w-60 text-base"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={applyDateFilter}
                            disabled={!startDate || !endDate}
                            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-1 md:flex-none justify-center font-medium">
                            <Search className="w-5 h-5" /> Filtrer
                        </button>
                        {isFilterActive && (
                            <button 
                                onClick={clearDateFilter}
                                className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all flex items-center gap-2 flex-1 md:flex-none justify-center font-medium">
                                <X className="w-5 h-5" /> Effacer
                            </button>
                        )}
                    </div>
                </div>
                {isFilterActive && (
                    <div className="mt-3 py-3 px-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 text-sm">
                        <span>Filtrage actif : </span>
                        <span className="font-medium">Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                )}
                
                {/* Button pour les doublons */}
                {onglet === 'Nouveau leads' && (
                    <div className="mt-3">
                        <button 
                            onClick={fetchDuplicates}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Les doublons
                        </button>
                    </div>
                )}
            </div>

            {/* Files List */}
            {loading ? (
                <div className="glass-effect rounded-2xl p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="glass-effect rounded-2xl p-12 text-center">
                    <p className="text-slate-500">Aucun fichier trouvé dans cet onglet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredFiles.map((file) => (
                        <FileCard
                            key={file.name}
                            file={file}
                            onglet={onglet}
                            expanded={expandedFile === file.name}
                            onToggle={() => toggleFile(file.name)}
                            onDelete={() => handleDeleteFile(file.name)}
                            currentPage={currentPage[file.name] || 1}
                            setCurrentPage={(page) => setCurrentPage(prev => ({ ...prev, [file.name]: page }))}
                            fetchLeads={() => fetchLeadsForFile(file.name)}
                            formatDate={formatDate}
                            formatDateTime={formatDateTime}
                            leadsPerPage={leadsPerPage}
                        />
                    ))}
                </div>
            )}
            
            {/* Modal pour afficher les fiches en doublon */}
            {showDuplicatesModal && (
                <DuplicateLeadsModal 
                    duplicates={duplicates} 
                    onClose={() => setShowDuplicatesModal(false)} 
                />
            )}
        </div>
    )
}

function FileCard({ file, onglet, expanded, onToggle, onDelete, currentPage, setCurrentPage, fetchLeads, formatDate, formatDateTime, leadsPerPage }) {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (expanded) {
            loadLeads()
        }
    }, [expanded, currentPage])

    const loadLeads = async () => {
        setLoading(true)
        const data = await fetchLeads()
        setLeads(data)
        setLoading(false)
    }

    const totalPages = Math.ceil(file.count / leadsPerPage)

    return (
        <div className="glass-effect rounded-xl border border-slate-200 overflow-hidden">
            {/* File Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-200">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-3 flex-1 text-left hover:text-primary-600 transition-colors"
                >
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                        <h3 className="font-semibold text-slate-800">{file.name}</h3>
                        <p className="text-sm text-slate-500">{file.count} leads</p>
                    </div>
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer ce fichier"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* File Content */}
            {expanded && (
                <div className="p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Nom</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Email</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Téléphone</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Code Postal</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Statut Lead</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Choix Formation</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Type Formation 1</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date & Heure RDV</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date RDV</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date & Heure 2ème RDV</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Prise RDV</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Début CPF 1</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Venu en RDV</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Propriétaire Contact</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Contact Notes</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Création Lead</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Attribution Propriétaire</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Dernière Modification</th>
                                            <th className="px-6 py-3 font-medium whitespace-nowrap">Date Injection</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {leads.map((lead) => (
                                            <tr key={lead.id} className="bg-white hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-medium">{lead.nom || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.email || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.telephone || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.code_postal || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                        {lead.statut_lead || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.choix_formation || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.type_formation_1 || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_heure_rdv)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDate(lead.date_rdv)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_heure_2eme_rdv)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDate(lead.date_prise_rdv)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDate(lead.date_debut_cpf_1)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.venu_en_rdv || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{lead.proprietaire_contact || '-'}</td>
                                                <td className="px-6 py-3 max-w-xs truncate text-slate-600" title={lead.contact_notes}>{lead.contact_notes || '-'}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_creation_lead)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_attribution_proprietaire)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDateTime(lead.date_derniere_modification)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap text-slate-600">{formatDate(lead.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-sm text-slate-600">
                                        Page <span className="font-semibold text-slate-800">{currentPage}</span> sur <span className="font-semibold text-slate-800">{totalPages}</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-slate-700"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Précédent
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-slate-700"
                                        >
                                            Suivant
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
