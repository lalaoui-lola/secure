import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, FileType, Calendar, Trash2, CopyMinus, Eraser, Scissors, Send, AlertTriangle, Search, RefreshCw } from 'lucide-react'
import { supabase } from '../../config/supabase'
import DuplicateLeadsModal from '../DuplicateLeadsModal'

export default function CorrectionExcel() {
    const [file, setFile] = useState(null)
    const [data, setData] = useState([])
    const [headers, setHeaders] = useState([])
    const [corrected, setCorrected] = useState(false)
    const [stats, setStats] = useState({ total: 0, corrected: 0, removed: 0 })
    
    // États pour la détection des doublons
    const [duplicateNames, setDuplicateNames] = useState([])
    const [hasDuplicates, setHasDuplicates] = useState(false)
    const [showDuplicatesModal, setShowDuplicatesModal] = useState(false)
    const [allDuplicates, setAllDuplicates] = useState([])

    // Injection State
    const [selectedTab, setSelectedTab] = useState('Nouveau leads')
    const [fileName, setFileName] = useState('')
    const [isInjecting, setIsInjecting] = useState(false)
    const [injectionStatus, setInjectionStatus] = useState(null)
    const [injectionProgress, setInjectionProgress] = useState({ current: 0, total: 0, percent: 0 })

    // Options
    const [removeEmpty, setRemoveEmpty] = useState(true)
    const [removeDuplicateHeaders, setRemoveDuplicateHeaders] = useState(true)
    const [removeDashes, setRemoveDashes] = useState(false)
    const [removeApercu, setRemoveApercu] = useState(true)

    const tabs = [
        'Nouveau leads',
        'Leads traité',
        'RDV pris',
        'RDV j+1',
        'RDV autre centre'
    ]

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        setFile(file)
        setCorrected(false)
        setInjectionStatus(null)

        // Set default file name (without extension)
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFileName(nameWithoutExt)

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

            if (data.length > 0) {
                setHeaders(data[0])
                setData(data.slice(1))
            }
        }
        reader.readAsBinaryString(file)
    }

    const fixEncoding = (text) => {
        if (typeof text !== 'string') return text

        return text
            .replace(/Ã©/g, 'é')
            .replace(/Ã¨/g, 'è')
            .replace(/Ã /g, 'à')
            .replace(/Ã¢/g, 'â')
            .replace(/Ãª/g, 'ê')
            .replace(/Ã®/g, 'î')
            .replace(/Ã´/g, 'ô')
            .replace(/Ã»/g, 'û')
            .replace(/Ã§/g, 'ç')
            .replace(/Ã«/g, 'ë')
            .replace(/Ã¯/g, 'ï')
            .replace(/Â/g, '')
            .replace(/Ã/g, 'à')
    }

    const getSystemDate = () => {
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

    const getYesterdayDate = () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dd = String(yesterday.getDate()).padStart(2, '0')
        const mm = String(yesterday.getMonth() + 1).padStart(2, '0')
        const yyyy = yesterday.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

    const getTomorrowDate = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dd = String(tomorrow.getDate()).padStart(2, '0')
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
        const yyyy = tomorrow.getFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

    const fixDate = (text) => {
        if (typeof text !== 'string') return text

        const todayRegex = /Aujourd['' ]?hui/gi
        if (todayRegex.test(text)) {
            const currentDate = getSystemDate()
            text = text.replace(todayRegex, currentDate)
        }

        const yesterdayRegex = /Hier/gi
        if (yesterdayRegex.test(text)) {
            const yesterdayDate = getYesterdayDate()
            text = text.replace(yesterdayRegex, yesterdayDate)
        }

        const tomorrowRegex = /Demain/gi
        if (tomorrowRegex.test(text)) {
            const tomorrowDate = getTomorrowDate()
            text = text.replace(tomorrowRegex, tomorrowDate)
        }

        if (text.includes('GMT') || /\d{4}/.test(text)) {
            let cleaned = text.replace(/GMT\+[0-9]+/gi, '').replace(/\s+à\s+/gi, ' ').trim()

            const months = {
                'janvier': '01', 'janv.': '01', 'janv': '01',
                'février': '02', 'févr.': '02', 'févr': '02', 'fevrier': '02', 'fevr.': '02', 'fevr': '02',
                'mars': '03', 'mar.': '03', 'mar': '03',
                'avril': '04', 'avr.': '04', 'avr': '04',
                'mai': '05',
                'juin': '06',
                'juillet': '07', 'juil.': '07', 'juil': '07',
                'août': '08', 'aout': '08',
                'septembre': '09', 'sept.': '09', 'sept': '09',
                'octobre': '10', 'oct.': '10', 'oct': '10',
                'novembre': '11', 'nov.': '11', 'nov': '11',
                'décembre': '12', 'déc.': '12', 'déc': '12', 'decembre': '12', 'dec.': '12', 'dec': '12'
            }

            const dateRegex = /(\d{1,2})\s+([a-zA-Zéû.]+)\s+(\d{4})(?:\s+(\d{1,2}:\d{2}))?/i
            const match = cleaned.match(dateRegex)

            if (match) {
                const [_, day, monthStr, year, time] = match
                const monthKey = monthStr.toLowerCase()
                const monthNum = months[monthKey]

                if (monthNum) {
                    const paddedDay = day.padStart(2, '0')
                    const timeStr = time ? ` ${time}` : ''
                    return `${paddedDay}/${monthNum}/${year}${timeStr}`
                }
            }

            if (text !== cleaned) {
                return cleaned
            }
        }

        return text
    }

    const handleCorrection = () => {
        let correctionCount = 0
        let removedCount = 0
        let processedData = []

        const fixedData = data.map(row => {
            return row.map(cell => {
                const original = cell
                let fixed = fixEncoding(cell)

                // Toujours appliquer les corrections de dates
                fixed = fixDate(fixed)

                if (removeDashes && typeof fixed === 'string' && fixed.trim() === '--') {
                    fixed = ''
                }

                if (removeApercu && typeof fixed === 'string') {
                    fixed = fixed.replace(/Aperçu/gi, '')
                        .replace(/AperÃ§u/gi, '')
                }

                if (original !== fixed) correctionCount++
                return fixed
            })
        })

        const fixedHeaders = headers.map(h => {
            let fixed = fixEncoding(h)
            // Toujours appliquer les corrections de dates
            fixed = fixDate(fixed)
            if (removeApercu && typeof fixed === 'string') {
                fixed = fixed.replace(/Aperçu/gi, '').replace(/AperÃ§u/gi, '')
            }
            if (typeof fixed === 'string') {
                fixed = fixed.replace(/Colonne_1,\s*/gi, '')
            }
            return fixed
        })

        const headerStr = JSON.stringify(fixedHeaders)

        processedData = fixedData.filter(row => {
            if (removeEmpty) {
                const isEmpty = row.every(cell => cell === null || cell === undefined || cell === '')
                if (isEmpty) {
                    removedCount++
                    return false
                }
            }

            if (removeDuplicateHeaders) {
                const rowToCompare = row.slice(0, fixedHeaders.length)
                if (JSON.stringify(rowToCompare) === headerStr) {
                    removedCount++
                    return false
                }
            }

            return true
        })

        setData(processedData)
        setHeaders(fixedHeaders)
        setCorrected(true)
        setStats({
            total: processedData.length * fixedHeaders.length,
            corrected: correctionCount,
            removed: removedCount
        })
    }

    const handleExport = () => {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Données Corrigées")
        XLSX.writeFile(wb, "correction_excel_export.xlsx")
    }

    const mapRowToSupabase = (row, headers) => {
        const rowObj = {}
        headers.forEach((header, index) => {
            rowObj[header] = row[index]
        })

        // Helper function to convert date to ISO format for PostgreSQL
        const convertToISO = (dateStr) => {
            // Check if value is empty, null, or invalid
            if (!dateStr || dateStr === '' || dateStr === '--' || dateStr === 'undefined' || dateStr === 'null') {
                return null
            }

            // Ensure dateStr is a string
            if (typeof dateStr !== 'string') {
                return null
            }

            // Format: "DD/MM/YYYY HH:mm" or "DD/MM/YYYY"
            const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
            const match = dateStr.match(dateTimeRegex)

            if (match) {
                const [_, day, month, year, hours, minutes] = match
                if (hours && minutes) {
                    // With time: Keep exact time as specified in Excel without timezone conversion
                    // Add Z to make it UTC time (which will display exactly as in Excel)
                    return `${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes}:00Z`
                } else {
                    // Date only: "2025-12-22"
                    return `${year}-${month}-${day}`
                }
            }

            // If format doesn't match, return null to avoid errors
            return null
        }

        return {
            nom: rowObj['NOM'] || null,
            code_postal: rowObj['CODE POSTAL'] || null,
            telephone: rowObj['NUMÉRO DE TÉLÉPHONE'] || null,
            date_heure_rdv: convertToISO(rowObj['DATE ET HEURE DU RDV ()']),
            statut_lead: rowObj['STATUT DU LEAD'] || null,
            choix_formation: rowObj['CHOIX DE FORMATION LEAD'] || null,
            date_derniere_modification: convertToISO(rowObj['DATE DE LA DERNIÈRE MODIFICATION ()']),
            type_formation_1: rowObj['TYPE DE FORMATION 1'] || null,
            date_prise_rdv: convertToISO(rowObj['DATE DE LA PRISE DE RDV']),
            contact_notes: rowObj['CONTACT → NOTES'] || null,
            proprietaire_contact: rowObj['PROPRIÉTAIRE DU CONTACT'] || null,
            date_creation_lead: convertToISO(rowObj['DATE DE CRÉATION ()']),
            date_attribution_proprietaire: convertToISO(rowObj["DATE D'ATTRIBUTION DU PROPRIÉTAIRE ()"]),
            email: rowObj['E-MAIL'] || null,
            date_rdv: convertToISO(rowObj['DATE DU RDV']),
            date_heure_2eme_rdv: convertToISO(rowObj['DATE ET HEURE DE 2EME RDV ()']),
            date_debut_cpf_1: convertToISO(rowObj['DATE DE DÉBUT CPF 1']),
            venu_en_rdv: rowObj['VENU EN RDV'] || null,
            onglet: selectedTab,
            nom_fichier: fileName
        }
    }

    // Vérification des noms en doublon dans la base de données
    const checkForDuplicateNames = async (rowsToInsert) => {
        // Ne vérifier les doublons que pour l'onglet "Nouveau leads"
        if (selectedTab !== 'Nouveau leads') return { rowsToInsert, duplicates: [] }
        
        try {
            // Récupérer tous les noms des leads à insérer qui ne sont pas vides
            const namesToCheck = rowsToInsert
                .filter(row => row.nom && row.nom.trim() !== '')
                .map(row => row.nom.trim().toLowerCase())
            
            // Si aucun nom à vérifier, retourner directement
            if (namesToCheck.length === 0) return { rowsToInsert, duplicates: [] }
            
            // Requête pour vérifier les noms existants avec statut "nouveau"
            const { data, error } = await supabase
                .from('leads')
                .select('nom, id')
                .eq('onglet', 'Nouveau leads')
                .eq('statut_lead', 'nouveau')
                .in('nom', namesToCheck)
            
            if (error) throw error
            
            if (!data || data.length === 0) return { rowsToInsert, duplicates: [] }
            
            // Créer une liste des noms en doublon
            const duplicateNamesFound = data.map(item => item.nom.trim().toLowerCase())
            
            // Filtrer les doublons des données à insérer
            const duplicates = rowsToInsert.filter(row => 
                row.nom && duplicateNamesFound.includes(row.nom.trim().toLowerCase())
            )
            
            return { rowsToInsert, duplicates }
        } catch (error) {
            console.error('Erreur lors de la vérification des doublons:', error)
            return { rowsToInsert, duplicates: [] }
        }
    }
    
    // Récupérer tous les doublons de la base de données
    const fetchAllDuplicates = async () => {
        try {
            // Requête pour récupérer uniquement les leads de l'onglet "Nouveau leads" avec statut "nouveau"
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('nom, id, created_at, telephone, onglet, statut_lead')
                .eq('onglet', 'Nouveau leads')
                .eq('statut_lead', 'nouveau')
                .order('created_at', { ascending: false })
            
            if (leadsError) throw leadsError
            
            // Trouver les doublons par nom dans tous les onglets
            const nameCount = {};
            const duplicateLeads = [];
            
            // Première passe pour compter les occurrences de chaque nom
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
            
            setAllDuplicates(groupedDuplicates);
            setShowDuplicatesModal(true);
        } catch (error) {
            console.error('Erreur lors de la récupération des doublons:', error)
            alert('Erreur lors de la récupération des doublons. Veuillez réessayer.')
        }
    }

    // Fonction de délai pour éviter les timeouts et forcer le rendu React
    const delay = (ms) => new Promise(resolve => {
        setTimeout(() => {
            requestAnimationFrame(() => {
                resolve()
            })
        }, ms)
    })

    // Fonction pour réessayer un lot en cas d'échec
    const insertBatchWithRetry = async (batch, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { error } = await supabase.from('leads').insert(batch)
                if (error) throw error
                return { success: true }
            } catch (error) {
                console.warn(`Tentative ${attempt}/${retries} échouée:`, error.message)
                if (attempt === retries) {
                    return { success: false, error }
                }
                // Attendre avant de réessayer (délai exponentiel)
                await delay(1000 * attempt)
            }
        }
    }

    const handleInjection = async () => {
        if (!data.length) return
        
        console.log('🚀 Démarrage de l\'injection...')
        console.log(`📊 Nombre de lignes: ${data.length}`)
        
        setIsInjecting(true)
        setInjectionStatus(null)
        setHasDuplicates(false)
        setDuplicateNames([])
        
        const totalRows = data.length
        const totalBatches = Math.ceil(totalRows / 50)
        
        // Afficher immédiatement la barre de progression
        setInjectionProgress({ 
            current: 0, 
            total: totalRows, 
            percent: 0,
            batch: 0,
            totalBatches: totalBatches,
            status: 'Préparation des données...'
        })
        
        console.log('📝 Barre de progression initialisée')
        
        // Petit délai pour permettre à React de mettre à jour l'interface
        await delay(100)
        
        console.log('✅ Délai passé, début du traitement')

        try {
            console.log('🔄 Mapping des données...')
            const rowsToInsert = data.map(row => mapRowToSupabase(row, headers))
            console.log(`✅ Mapping terminé: ${rowsToInsert.length} lignes`)
            
            // Mettre à jour le statut
            setInjectionProgress(prev => ({ ...prev, status: 'Vérification des doublons...' }))
            await delay(50)
            
            // Vérifier les doublons avant l'injection (seulement si moins de 500 lignes pour éviter les blocages)
            console.log('🔍 Vérification des doublons...')
            let duplicates = []
            if (rowsToInsert.length <= 500) {
                const result = await checkForDuplicateNames(rowsToInsert)
                duplicates = result.duplicates || []
            } else {
                console.log('⚠️ Fichier volumineux - vérification des doublons ignorée')
            }
            console.log(`✅ Vérification terminée: ${duplicates.length} doublons`)
            
            // S'il y a des doublons, les signaler mais continuer l'injection
            if (duplicates && duplicates.length > 0) {
                setHasDuplicates(true)
                setDuplicateNames(duplicates.map(dup => dup.nom))
            }

            // Taille de lot réduite pour les fichiers volumineux
            const batchSize = 50
            let successCount = 0
            let failedBatches = []

            for (let i = 0; i < rowsToInsert.length; i += batchSize) {
                const batch = rowsToInsert.slice(i, i + batchSize)
                const batchNumber = Math.floor(i / batchSize) + 1
                
                // Mettre à jour la progression AVANT l'envoi du lot
                const progress = Math.round((i / rowsToInsert.length) * 100)
                setInjectionProgress({ 
                    current: i, 
                    total: rowsToInsert.length, 
                    percent: progress,
                    batch: batchNumber,
                    totalBatches: totalBatches,
                    status: `Envoi du lot ${batchNumber}/${totalBatches}...`
                })
                
                // Petit délai pour permettre le rendu
                await delay(10)

                // Insérer le lot avec logique de réessai
                const result = await insertBatchWithRetry(batch)
                
                if (result.success) {
                    successCount += batch.length
                } else {
                    failedBatches.push({ batchNumber, error: result.error, count: batch.length })
                }

                // Petit délai entre les lots pour éviter les surcharges
                if (i + batchSize < rowsToInsert.length) {
                    await delay(200)
                }
            }

            // Message de succès avec détails
            if (failedBatches.length === 0) {
                let successMessage = `${successCount} lignes envoyées avec succès vers "${selectedTab}" !`
                if (duplicates && duplicates.length > 0) {
                    successMessage += ` (${duplicates.length} doublons détectés)`
                }
                setInjectionStatus({ type: 'success', message: successMessage })
            } else {
                const failedCount = failedBatches.reduce((sum, b) => sum + b.count, 0)
                setInjectionStatus({ 
                    type: 'error', 
                    message: `${successCount} lignes envoyées, mais ${failedCount} lignes ont échoué. Vérifiez les données et réessayez.` 
                })
            }
        } catch (error) {
            console.error('Error injecting data:', error)
            setInjectionStatus({ type: 'error', message: `Erreur : ${error.message}` })
        } finally {
            setIsInjecting(false)
            setInjectionProgress({ current: 0, total: 0, percent: 0 })
        }
    }

    // Fonction pour réinitialiser et permettre une nouvelle importation
    const handleNewImport = () => {
        setFile(null)
        setData([])
        setHeaders([])
        setCorrected(false)
        setStats({ total: 0, corrected: 0, removed: 0 })
        setDuplicateNames([])
        setHasDuplicates(false)
        setAllDuplicates([])
        setFileName('')
        setInjectionStatus(null)
        setInjectionProgress({ current: 0, total: 0, percent: 0 })
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Correction Excel</h2>
                    <p className="text-slate-500">Importez vos fichiers Excel/CSV pour corriger les erreurs d'encodage</p>
                </div>
                <div className="flex items-center gap-3">
                    {data.length > 0 && (
                        <button
                            onClick={handleNewImport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Nouvelle importation
                        </button>
                    )}
                    <div className="p-3 bg-green-50 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </div>

            {!data.length && (
                <div className="glass-effect rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 hover:border-primary-400 transition-colors">
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700">Cliquez pour importer</h3>
                            <p className="text-slate-500 mt-1">Supporte .xlsx, .xls, .csv</p>
                        </div>
                    </label>
                </div>
            )}

            {data.length > 0 && (
                <div className="space-y-6">
                    <div className="glass-effect rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <FileType className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-700">{file?.name}</p>
                                    <p className="text-xs text-slate-500">{data.length} lignes détectées</p>
                                </div>
                            </div>

                            <div className="flex gap-3 flex-wrap">
                                {!corrected ? (
                                    <button
                                        onClick={handleCorrection}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Corriger les erreurs
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleExport}
                                            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <Download className="w-4 h-4" />
                                            Télécharger
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={fileName}
                                                onChange={(e) => setFileName(e.target.value)}
                                                placeholder="Nom du fichier"
                                                className="bg-white border border-slate-200 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
                                            />
                                            <select
                                                value={selectedTab}
                                                onChange={(e) => setSelectedTab(e.target.value)}
                                                className="bg-white border border-slate-200 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                {tabs.map(tab => (
                                                    <option key={tab} value={tab}>{tab}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleInjection}
                                                disabled={isInjecting || !fileName.trim()}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                            >
                                                {isInjecting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Envoi... {injectionProgress.percent}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Envoyer
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Barre de progression pour les fichiers volumineux */}
                        {isInjecting && injectionProgress.total > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700">
                                        {injectionProgress.status || `Envoi en cours... ${injectionProgress.current} / ${injectionProgress.total} lignes`}
                                    </span>
                                    <span className="text-sm font-bold text-blue-700">
                                        {injectionProgress.percent}%
                                    </span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-3">
                                    <div 
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${injectionProgress.percent}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-blue-600">
                                        {injectionProgress.current} / {injectionProgress.total} lignes
                                    </p>
                                    {injectionProgress.batch > 0 && (
                                        <p className="text-xs text-blue-600">
                                            Lot {injectionProgress.batch} sur {injectionProgress.totalBatches}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {injectionStatus && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${injectionStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                {injectionStatus.type === 'success' ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                <p className="font-medium">{injectionStatus.message}</p>
                                
                                {/* Afficher le bouton pour voir les doublons si détectés */}
                                {hasDuplicates && selectedTab === 'Nouveau leads' && (
                                    <button 
                                        onClick={() => fetchAllDuplicates()}
                                        className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Voir les doublons
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Bouton pour voir les doublons - uniquement dans l'onglet Nouveau leads */}
                        {corrected && selectedTab === 'Nouveau leads' && (
                            <button 
                                onClick={() => fetchAllDuplicates()}
                                className="flex items-center gap-2 p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium self-start"
                            >
                                <Search className="w-4 h-4 text-amber-500" />
                                Les doublons
                            </button>
                        )}

                        {!corrected && (
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={removeApercu}
                                        onChange={(e) => setRemoveApercu(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700 flex items-center gap-2">
                                        <Scissors className="w-4 h-4 text-slate-500" />
                                        Supprimer "Aperçu"
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={removeDashes}
                                        onChange={(e) => setRemoveDashes(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700 flex items-center gap-2">
                                        <Eraser className="w-4 h-4 text-slate-500" />
                                        Effacer les "--"
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={removeEmpty}
                                        onChange={(e) => setRemoveEmpty(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700 flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-slate-500" />
                                        Supprimer lignes vides
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-primary-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={removeDuplicateHeaders}
                                        onChange={(e) => setRemoveDuplicateHeaders(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700 flex items-center gap-2">
                                        <CopyMinus className="w-4 h-4 text-slate-500" />
                                        Supprimer en-têtes dupliqués
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>

                    {corrected && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700">
                                <Check className="w-5 h-5" />
                                <p>Correction terminée ! {stats.corrected} cellules modifiées.</p>
                            </div>
                            {stats.removed > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 text-orange-700">
                                    <Trash2 className="w-5 h-5" />
                                    <p>{stats.removed} lignes inutiles supprimées.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="glass-effect rounded-2xl overflow-hidden border border-slate-200">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-700">Aperçu des données (50 premières lignes)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                    <tr>
                                        {headers.map((header, i) => (
                                            <th key={i} className="px-6 py-3 font-medium whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {data.slice(0, 50).map((row, i) => (
                                        <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-6 py-3 whitespace-nowrap text-slate-600">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal pour afficher les fiches en doublon */}
            {showDuplicatesModal && (
                <DuplicateLeadsModal 
                    duplicates={allDuplicates} 
                    onClose={() => setShowDuplicatesModal(false)} 
                />
            )}
        </div>
    )
}
