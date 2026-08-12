import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, RefreshCw, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { fetchBankMapData, type BankMapData } from '@/services/bank-map'
import { getBankAccounts, type BankAccount } from '@/services/bank-accounts'
import { formatCurrency, formatDateOnlyBR } from '@/lib/format'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'settled', label: 'Recebido / Pago' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Cancelado', label: 'Cancelado' },
]

function getCurrentMonth(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

function formatMonthLabel(month: string): string {
  if (!month) return ''
  const [year, m] = month.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MONTH_NAMES[idx]}/${year}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Recebido' || status === 'Pago')
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{status}</Badge>
  if (status === 'Cancelado') return <Badge variant="destructive">{status}</Badge>
  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
      {status}
    </Badge>
  )
}

export default function BankMapPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [bankAccountId, setBankAccountId] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [data, setData] = useState<BankMapData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    getBankAccounts()
      .then((accounts) =>
        setBankAccounts([...accounts].sort((a, b) => a.name.localeCompare(b.name))),
      )
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBankMapData({ month, bankAccountId, status: statusFilter })
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [month, bankAccountId, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
    reloadTimerRef.current = setTimeout(() => loadData(), 500)
  }, [loadData])

  useRealtime('accounts_receivable', () => scheduleReload())
  useRealtime('accounts_payable', () => scheduleReload())

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mapa Bancário</h1>
          <p className="text-sm text-muted-foreground">
            Receitas, Despesas e Saldo por conta bancária
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="month" className="text-xs">
              Mês/Ano
            </Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Conta Bancária</Label>
            <Select
              value={bankAccountId || 'all'}
              onValueChange={(v) => setBankAccountId(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {bankAccounts.map((ba) => (
                  <SelectItem key={ba.id} value={ba.id}>
                    {ba.trading_name || ba.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => loadData()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Atualizar
          </Button>
        </div>
      </div>

      {loading && !data && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <p className="font-medium text-destructive">Falha ao carregar o mapa bancário</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => loadData()} variant="outline">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {data && !error && (
        <div className={cn('space-y-6', loading && 'pointer-events-none opacity-50')}>
          <p className="text-sm text-muted-foreground">
            Período: <span className="font-medium">{formatMonthLabel(data.month)}</span> — O saldo
            considera apenas movimentações liquidadas (Recebido/Pago).
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Receitas</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(data.summary.totalReceitas)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-red-100 p-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Despesas</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(data.summary.totalDespesas)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Mês</p>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      data.summary.saldo >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatCurrency(data.summary.saldo)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo por Conta Bancária</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Conta</th>
                    <th className="px-3 py-2 text-right font-medium">Receitas</th>
                    <th className="px-3 py-2 text-right font-medium">Despesas</th>
                    <th className="px-3 py-2 text-right font-medium">Saldo</th>
                    <th className="px-3 py-2 text-center font-medium">Movimentos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accountBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Nenhuma conta bancária encontrada
                      </td>
                    </tr>
                  ) : (
                    data.accountBreakdown.map((row) => (
                      <tr
                        key={row.accountId || 'no-account'}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-medium">
                          {row.tradingName || row.accountName}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-600">
                          {formatCurrency(row.totalReceitas)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-red-600">
                          {formatCurrency(row.totalDespesas)}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 text-right font-semibold tabular-nums',
                            row.saldo >= 0 ? 'text-green-600' : 'text-red-600',
                          )}
                        >
                          {formatCurrency(row.saldo)}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          {row.receitasCount + row.despesasCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.accountBreakdown.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="px-3 py-2">Total Consolidado</td>
                      <td className="px-3 py-2 text-right tabular-nums text-green-600">
                        {formatCurrency(data.summary.totalReceitas)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-600">
                        {formatCurrency(data.summary.totalDespesas)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right tabular-nums',
                          data.summary.saldo >= 0 ? 'text-green-600' : 'text-red-600',
                        )}
                      >
                        {formatCurrency(data.summary.saldo)}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {data.receitas.length + data.despesas.length}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>

          <Tabs defaultValue="receitas">
            <TabsList>
              <TabsTrigger value="receitas">Receitas ({data.receitas.length})</TabsTrigger>
              <TabsTrigger value="despesas">Despesas ({data.despesas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="receitas">
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  {data.receitas.length === 0 ? (
                    <div className="px-3 py-8 text-center text-muted-foreground">
                      Nenhuma receita encontrada para os filtros selecionados
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Descrição</th>
                          <th className="px-3 py-2 text-left font-medium">Cliente</th>
                          <th className="px-3 py-2 text-left font-medium">Conta</th>
                          <th className="px-3 py-2 text-left font-medium">Vencimento</th>
                          <th className="px-3 py-2 text-left font-medium">Recebido em</th>
                          <th className="px-3 py-2 text-left font-medium">Pagamento</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.receitas.map((r) => (
                          <tr key={r.id} className="border-b hover:bg-muted/50">
                            <td className="px-3 py-2 font-medium">{r.description || '—'}</td>
                            <td className="px-3 py-2">{r.customerName || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.bankAccountName}</td>
                            <td className="px-3 py-2">
                              {r.dueDate ? formatDateOnlyBR(r.dueDate) : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {r.receivedAt ? formatDateOnlyBR(r.receivedAt) : '—'}
                            </td>
                            <td className="px-3 py-2">{r.paymentMethod || '—'}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                              {formatCurrency(r.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="despesas">
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  {data.despesas.length === 0 ? (
                    <div className="px-3 py-8 text-center text-muted-foreground">
                      Nenhuma despesa encontrada para os filtros selecionados
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Descrição</th>
                          <th className="px-3 py-2 text-left font-medium">Fornecedor</th>
                          <th className="px-3 py-2 text-left font-medium">Conta</th>
                          <th className="px-3 py-2 text-left font-medium">Vencimento</th>
                          <th className="px-3 py-2 text-left font-medium">Pago em</th>
                          <th className="px-3 py-2 text-left font-medium">Pagamento</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.despesas.map((d) => (
                          <tr key={d.id} className="border-b hover:bg-muted/50">
                            <td className="px-3 py-2 font-medium">{d.description || '—'}</td>
                            <td className="px-3 py-2">{d.supplierName || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{d.bankAccountName}</td>
                            <td className="px-3 py-2">
                              {d.dueDate ? formatDateOnlyBR(d.dueDate) : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {d.paidAt ? formatDateOnlyBR(d.paidAt) : '—'}
                            </td>
                            <td className="px-3 py-2">{d.paymentMethodCode || '—'}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={d.status} />
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                              {formatCurrency(d.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
