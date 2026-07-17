import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/admin/CustomerForm'

export default function NewCustomer() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-primary">Novo Cliente</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CustomerForm />
      </main>
    </div>
  )
}
