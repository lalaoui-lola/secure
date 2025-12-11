import { useState } from 'react'
import { X, User, Phone, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

export default function DuplicateLeadsModal({ duplicates, onClose }) {
    const [expandedGroups, setExpandedGroups] = useState({})
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR')
    }
    
    const toggleGroup = (name) => {
        setExpandedGroups(prev => ({
            ...prev,
            [name]: !prev[name]
        }))
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Fiches en doublon détectées
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {duplicates.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            Aucun doublon trouvé.
                        </div>
                    ) : (
                        <div>
                            {duplicates.map(([name, leads], index) => {
                                const isExpanded = expandedGroups[name] || false;
                                return (
                                    <div key={name} className="border-b border-slate-200">
                                        {/* Group Header */}
                                        <div className="p-4 bg-slate-50 flex items-center">
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium text-slate-800">{leads[0].nom}</span>
                                                <span className="ml-2 text-sm text-slate-500">{leads.length} fiches trouvées</span>
                                            </div>
                                            <button 
                                                onClick={() => toggleGroup(name)}
                                                className="ml-auto text-slate-500 hover:text-slate-700"
                                            >
                                                {isExpanded ? (
                                                    <span className="text-sm text-blue-600">Masquer les détails</span>
                                                ) : (
                                                    <span className="text-sm text-blue-600">Afficher les détails</span>
                                                )}
                                                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1 inline" /> : <ChevronDown className="w-4 h-4 ml-1 inline" />}
                                            </button>
                                        </div>
                                        
                                        {/* Group Details */}
                                        {isExpanded && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="text-sm text-slate-500 bg-slate-100">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">ID</th>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">NOM</th>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">TÉLÉPHONE</th>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">DATE D'INJECTION</th>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">FICHIER</th>
                                                            <th className="px-6 py-3 text-left font-medium whitespace-nowrap">STATUT</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white">
                                                        {leads.map((lead) => (
                                                            <tr key={lead.id} className="border-t border-slate-200">
                                                                <td className="px-6 py-4 text-slate-600">{lead.id}</td>
                                                                <td className="px-6 py-4 text-slate-600 font-medium">{lead.nom}</td>
                                                                <td className="px-6 py-4 text-slate-600">
                                                                    {lead.telephone && (
                                                                        <div className="flex items-center">
                                                                            <Phone className="w-4 h-4 text-slate-400 mr-1" />
                                                                            {lead.telephone}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600">
                                                                    {lead.created_at && (
                                                                        <div className="flex items-center">
                                                                            <Calendar className="w-4 h-4 text-slate-400 mr-1" />
                                                                            {formatDate(lead.created_at)}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600">
                                                                    {lead.nom_fichier && (
                                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                            {lead.nom_fichier}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-600">
                                                                    {lead.statut_lead && (
                                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                            {lead.statut_lead}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
    );
}
