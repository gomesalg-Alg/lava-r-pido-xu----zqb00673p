import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { fetchBankMapData, type BankMapData } from '@/services/bank-map'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MONTH_LABELS[idx]}/${year.slice(2)}`
}

function getDefaultPeriod(): { start: string; end: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}`,
    end: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
  }
}

export default function BankMapPage() {
  const defaults = getDefaultPeriod()
  const [startMonth, setStartMonth] = useState(defaults.start)
  const [endMonth, setEndMonth] = useState(defaults.end)
  const [data, setData] = useState<BankMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  const loadData = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBankMapData(startMonth, endMonth)
      setData(result)
    } catch (err: unknown) {
      const e = err as { response?: { error?: string; message?: string }; message?: string }
      const serverMsg =
        e?.response?.error || e?.response?.message || e?.message || 'Erro desconhecido'
      setError(serverMsg)
      setData(null)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [startMonth, endMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
    reloadTimerRef.current = setTimeout(() => loadData(), 500)
  }, [loadData])

  useRealtime('service_orders', () => scheduleReload())
  useRealtime('vendas_avulsas', () => scheduleReload())
  useRealtime('accounts_receivable', () => scheduleReload())
  useRealtime('account_categories', () => scheduleReload())

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mapa Bancário</h1>
          <p className="text-sm text-muted-foreground">
            Receita consolidada por conta analítica e mês
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="startMonth" className="text-xs">
              De
            </Label>
            <Input
              id="startMonth"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endMonth" className="text-xs">
              Até
            </Label>
            <Input
              id="endMonth"
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="w-[150px]"
            />
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
              <p className="font-medium text-destructive">
                Falha ao carregar os dados do mapa bancário
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => loadData()} variant="outline">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {data && !error && (
        <div className={cn('space-y-6', loading && 'opacity-50 pointer-events-none')}>
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Conta Analítica</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-medium">
                      Conta
                    </th>
                    {data.months.map((mo) => (
                      <th key={mo} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                        {formatMonthLabel(mo)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={data.months.length + 2}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        Nenhuma conta analítica de receita encontrada
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row) => (
                      <tr key={row.accountId} className="border-b hover:bg-muted/50">
                        <td className="sticky left-0 z-10 bg-background whitespace-nowrap px-3 py-2 font-medium">
                          {row.accountCode && (
                            <span className="text-muted-foreground">{row.accountCode} - </span>
                          )}
                          {row.accountName}
                        </td>
                        {data.months.map((mo) => (
                          <td key={mo} className="px-3 py-2 text-right tabular-nums">
                            {row.values[mo] ? formatCurrency(row.values[mo]) : '—'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="sticky left-0 z-10 bg-background px-3 py-2">Total</td>
                      {data.months.map((mo) => (
                        <td key={mo} className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(data.columnTotals[mo] || 0)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(data.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faturado × Recebido</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Mês</th>
                    <th className="px-3 py-2 text-right font-medium">Faturado</th>
                    <th className="px-3 py-2 text-right font-medium">Recebido</th>
                    <th className="px-3 py-2 text-right font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((mo) => {
                    const faturado = data.columnTotals[mo] || 0
                    const recebido = data.received[mo] || 0
                    const diff = faturado - recebido
                    return (
                      <tr key={mo} className="border-b hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">{formatMonthLabel(mo)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(faturado)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(recebido)}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 text-right tabular-nums',
                            diff > 0
                              ? 'text-amber-600'
                              : diff < 0
                                ? 'text-red-600'
                                : 'text-green-600',
                          )}
                        >
                          {formatCurrency(diff)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(data.grandTotal)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(data.receivedTotal)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(data.grandTotal - data.receivedTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
