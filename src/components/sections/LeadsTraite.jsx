import { CheckCircle } from 'lucide-react'
import LeadsTable from '../LeadsTable'

export default function LeadsTraite() {
    return (
        <LeadsTable
            onglet="Leads traité"
            icon={CheckCircle}
            title="Leads traité"
            description="Consultez les leads déjà traités"
        />
    )
}
