import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getPromotions,
  deletePromotion,
  setActivePromotion,
  updatePromotionActive,
  getPopupEnabled,
  setPopupEnabled,
  getPromotionImageUrl,
  type Promotion,
} from '@/services/promotions'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteDialog } from '@/components/admin/DeleteDialog'
import { PromotionFormDialog } from '@/components/admin/PromotionFormDialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { toDateInput } from '@/lib/format'

export default function EnvironmentConfigPage() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [popupEnabled, setPopupEnabledState] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)

  const loadData = async () => {
    try {
      const [promos, enabled] = await Promise.all([getPromotions(), getPopupEnabled()])
      setPromotions(promos)
      setPopupEnabledState(enabled)
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('promotions', () => {
    loadData()
  })

  if (user?.role !== 'Administrador') return <Navigate to="/admin" replace />

  const handleToggleActive = async (promo: Promotion) => {
    try {
      if (promo.is_active) {
        await updatePromotionActive(promo.id, false)
      } else {
        await setActivePromotion(promo.id)
      }
      loadData()
    } catch {
      toast.error('Erro ao atualizar promoção')
    }
  }

  const handleTogglePopup = async (enabled: boolean) => {
    setPopupEnabledState(enabled)
    try {
      await setPopupEnabled(enabled)
    } catch {
      toast.error('Erro ao atualizar configuração')
      setPopupEnabledState(!enabled)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePromotion(deleteTarget.id)
      toast.success('Promoção excluída!')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro ao excluir promoção')
    }
  }

  const openEdit = (promo: Promotion) => {
    setEditing(promo)
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Configuração de Ambiente</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nova Promoção
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold text-slate-800">Exibir Pop-up na Página Inicial</p>
            <p className="text-sm text-slate-500">
              Ative ou desative globalmente os pop-ups promocionais.
            </p>
          </div>
          <Switch checked={popupEnabled} onCheckedChange={handleTogglePopup} />
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="hidden md:table-cell">Validade</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhuma promoção encontrada.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((p) => {
                const isExpired = p.expires_at && new Date(p.expires_at) < new Date()
                return (
                  <TableRow key={p.id} className="even:bg-slate-50">
                    <TableCell>
                      {p.image ? (
                        <img
                          src={getPromotionImageUrl(p)!}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-slate-500">
                      {p.description || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {p.expires_at ? toDateInput(p.expires_at) : '-'}
                      {isExpired && (
                        <span className="ml-2 text-xs text-red-500 font-medium">Expirada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={() => handleToggleActive(p)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editing}
        onSaved={loadData}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir esta promoção?"
      />
    </div>
  )
}
