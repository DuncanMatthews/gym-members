import { InvoiceListActions } from "../_components/invoicelist-actions"
import { getInvoices } from "./actions"

export default async function InvoicesPage() {
    const { invoices } = await getInvoices()
    
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage member invoices and payments</p>
            
            <InvoiceListActions invoices={invoices} />
        </div>
    )
}