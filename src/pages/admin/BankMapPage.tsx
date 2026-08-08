import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getBankMap, formatMonthLabel, type BankMapData } from '@/services/bank-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Table2, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function BankMapPage() {
  const { user } = useAuth()
  const [startMonth, setStartMonth] = useState('')
  const [endMonth, setEndMonth] = useState('')
  const [data, setData] = useState<BankMapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    setStartMonth(`${year}-01`)
    setEndMonth(`${year}-12`)
  }, [])

  const loadData = useCallback(async () => {
    if (!startMonth || !endMonth) return
    setLoading(true)
    setError(null)
    try {
      const result = await getBankMap(startMonth, endMonth)
      setData(result)
    } catch {
      setError('Falha ao carregar os dados do mapa bancário.')
    } finally {
      setLoading(false)
    }
  }, [startMonth, endMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const debouncedRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => loadData(), 500)
  }, [loadData])

  useRealtime('service_orders', debouncedRefresh)
  useRealtime('service_order_items', debouncedRefresh)
  useRealtime('vendas_avulsas', debouncedRefresh)
  useRealtime('accounts_receivable', debouncedRefresh)
  useRealtime('account_categories', debouncedRefresh)

  const { rowTotals, colTotals, grandTotal, billedPerMonth, totalReceived } = useMemo(() => {
    if (!data)
      return { rowTotals: {}, colTotals: {}, grandTotal: 0, billedPerMonth: {}, totalReceived: 0 }
    const rT: Record<string, number> = {}
    const cT: Record<string, number> = {}
    const bM: Record<string, number> = {}
    let grand = 0
    for (const acc of data.accounts) {
      let rowSum = 0
      for (const month of data.months) {
        const val = data.revenue[acc.id]?.[month] || 0
        rowSum += val
        cT[month] = (cT[month] || 0) + val
        bM[month] = (bM[month] || 0) + val
        grand += val
      }
      rT[acc.id] = rowSum
    }
    let tRec = 0
    for (const month of data.months) tRec += data.received[month] || 0
    return {
      rowTotals: rT,
      colTotals: cT,
      grandTotal: grand,
      billedPerMonth: bM,
      totalReceived: tRec,
    }
  }, [data])

  if (user && user.role !== 'Administrador') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Acesso negado</p>
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <p className="text-lg font-medium">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const isEmpty = !data || data.accounts.length === 0 || grandTotal === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Mapa Bancário (Receitas)
            {loading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">Receitas por conta analítica e mês</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">De</label>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <input
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {!isEmpty && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Faturado</p>
              <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  grandTotal - totalReceived >= 0 ? 'text-amber-600' : 'text-green-600',
                )}
              >
                {formatCurrency(grandTotal - totalReceived)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isEmpty ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <Table2 className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">Nenhuma receita encontrada</p>
            <p className="text-sm text-muted-foreground">
              Não há receitas registradas para o período selecionado.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="w-5 h-5" /> Mapa de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background min-w-[200px]">
                        Conta
                      </TableHead>
                      {data!.months.map((month) => (
                        <TableHead key={month} className="text-right min-w-[120px]">
                          {formatMonthLabel(month)}
                        </TableHead>
                      ))}
                      <TableHead className="text-right min-w-[120px] font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.accounts.map((acc) => (
                      <TableRow key={acc.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium sticky left-0 bg-background">
                          {acc.code} - {acc.name}
                        </TableCell>
                        {data!.months.map((month) => {
                          const val = data!.revenue[acc.id]?.[month] || 0
                          return (
                            <TableCell key={month} className="text-right">
                              {val ? (
                                formatCurrency(val)
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right font-bold">
                          {formatCurrency(rowTotals[acc.id] || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold sticky left-0 bg-muted">Total</TableCell>
                      {data!.months.map((month) => (
                        <TableCell key={month} className="text-right font-bold">
                          {formatCurrency(colTotals[month] || 0)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-bold">
                        {formatCurrency(grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Reconciliação: Faturado × Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Faturado</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.months.map((month) => {
                      const billed = billedPerMonth[month] || 0
                      const received = data!.received[month] || 0
                      const diff = billed - received
                      return (
                        <TableRow key={month} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{formatMonthLabel(month)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(billed)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(received)}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              diff >= 0 ? 'text-amber-600' : 'text-green-600',
                            )}
                          >
                            {formatCurrency(diff)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(grandTotal)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(totalReceived)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold',
                          grandTotal - totalReceived >= 0 ? 'text-amber-600' : 'text-green-600',
                        )}
                      >
                        {formatCurrency(grandTotal - totalReceived)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
