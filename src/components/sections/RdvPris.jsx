import { Calendar } from 'lucide-react'
import LeadsTable from '../LeadsTable'

export default function RdvPris() {
    return (
        <LeadsTable
            onglet="RDV pris"
            icon={Calendar}
            title="RDV pris"
            description="Gérez les rendez-vous confirmés"
        />
    )
}
