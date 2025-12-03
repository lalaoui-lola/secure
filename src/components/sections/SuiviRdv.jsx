import { ClipboardList } from 'lucide-react'
import RdvSuiviTable from '../RdvSuiviTable'

export default function SuiviRdv() {
    return (
        <RdvSuiviTable
            onglet="Suivi des RDV"
            icon={ClipboardList}
            title="Suivi des RDV"
            description="Consultez et gérez les rendez-vous par date"
        />
    )
}
