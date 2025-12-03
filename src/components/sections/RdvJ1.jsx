import { CalendarPlus } from 'lucide-react'
import LeadsTable from '../LeadsTable'

export default function RdvJ1() {
    return (
        <LeadsTable
            onglet="RDV j+1"
            icon={CalendarPlus}
            title="RDV j+1"
            description="Rendez-vous programmés pour le lendemain"
        />
    )
}
