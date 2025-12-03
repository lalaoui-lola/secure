import { UserPlus } from 'lucide-react'
import LeadsTable from '../LeadsTable'

export default function NouveauLeads() {
    return (
        <LeadsTable
            onglet="Nouveau leads"
            icon={UserPlus}
            title="Nouveau leads"
            description="Gérez vos nouveaux leads"
        />
    )
}
