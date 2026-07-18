import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers, type Customer } from '@/services/customers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, UserCheck, Phone, Mail } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch(() => toast.error('Erro ao carregar clientes'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/admin/clientes/novo">
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-center py-20 text-slate-400">Carregando...</p>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-400">
            Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {c.email || '—'}
                      </span>
                    </TableCell>
                    <TableCell>{c.city ? `${c.city}/${c.state}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
