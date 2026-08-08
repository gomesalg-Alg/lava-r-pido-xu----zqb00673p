import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/admin/SearchableSelect'
import {
  PurchaseOrderItemsEditor,
  type PurchaseOrderItemRow,
} from '@/components/admin/PurchaseOrderItemsEditor'
import { Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { getSuppliers, type Supplier } from '@/services/suppliers'
import { getProducts, type Product } from '@/services/products'
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  createPurchaseOrder,
  updatePurchaseOrder,
  createPurchaseOrderItem,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem,
} from '@/services/purchase-orders'
import { useFormKeyboard } from '@/hooks/use-form-keyboard'

export default function PurchaseOrderFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const keyboardRef = useFormKeyboard<HTMLFormElement>()
  const isEdit = !!id
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({
    supplier_id: '',
    emission_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    observation: '',
  })
  const [items, setItems] = useState<PurchaseOrderItemRow[]>([
    { product_id: '', quantity: 1, unit_price: 0 },
  ])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts()]).then(([s, p]) => {
      setSuppliers(s)
      setProducts(p)
    })
    if (id) {
      Promise.all([getPurchaseOrder(id), getPurchaseOrderItems(id)])
        .then(([order, oi]) => {
          setForm({
            supplier_id: order.supplier_id,
            emission_date: order.emission_date?.split('T')[0] || '',
            expected_date: order.expected_date?.split('T')[0] || '',
            observation: order.observation || '',
          })
          setItems(
            oi.map((i) => ({
              id: i.id,
              product_id: i.product_id,
              quantity: i.quantity || 1,
              unit_price: i.unit_price || 0,
            })),
          )
        })
        .catch(() => toast.error('Erro ao carregar pedido'))
    }
  }, [id])

  const total = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplier_id) {
      toast.error('Selecione um fornecedor')
      return
    }
    if (items.some((i) => !i.product_id)) {
      toast.error('Selecione um produto em todos os itens')
      return
    }
    setSaving(true)
    setErrors({})
    try {
      const data: Record<string, unknown> = {
        supplier_id: form.supplier_id,
        emission_date: form.emission_date || null,
        expected_date: form.expected_date || null,
        observation: form.observation,
        total_amount: total,
      }
      let orderId = id
      if (isEdit && id) {
        await updatePurchaseOrder(id, data)
        const existing = await getPurchaseOrderItems(id)
        const currentIds = items.filter((i) => i.id).map((i) => i.id!)
        for (const old of existing) {
          if (!currentIds.includes(old.id)) await deletePurchaseOrderItem(old.id)
        }
      } else {
        const created = await createPurchaseOrder(data)
        orderId = created.id
      }
      for (const item of items) {
        const itemData = {
          purchase_order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          received_quantity: 0,
          unit_price: item.unit_price,
          total_price: (item.quantity || 0) * (item.unit_price || 0),
        }
        if (item.id) {
          await updatePurchaseOrderItem(item.id, itemData)
        } else {
          await createPurchaseOrderItem(itemData)
        }
      }
      toast.success(isEdit ? 'Pedido atualizado!' : 'Pedido criado!')
      navigate('/admin/pedidos-compra')
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar pedido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={keyboardRef} onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/admin/pedidos-compra">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-slate-800">
        {isEdit ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
      </h1>
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fornecedor *</Label>
            <SearchableSelect
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={form.supplier_id}
              onChange={(v) => setForm((p) => ({ ...p, supplier_id: v }))}
              placeholder="Selecionar fornecedor..."
              searchPlaceholder="Buscar fornecedor..."
            />
            {errors.supplier_id && <p className="text-xs text-red-500">{errors.supplier_id}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Data de Emissão</Label>
            <Input
              type="date"
              value={form.emission_date}
              onChange={(e) => setForm((p) => ({ ...p, emission_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data Prevista</Label>
            <Input
              type="date"
              value={form.expected_date}
              onChange={(e) => setForm((p) => ({ ...p, expected_date: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Observação</Label>
          <Textarea
            value={form.observation}
            onChange={(e) => setForm((p) => ({ ...p, observation: e.target.value }))}
            rows={2}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-bold text-lg">Itens do Pedido</h2>
        <PurchaseOrderItemsEditor items={items} products={products} onChange={setItems} />
        <div className="flex justify-between pt-3 border-t">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-800">{formatCurrency(total)}</span>
        </div>
      </div>
      <Button type="submit" disabled={saving} className="w-full" size="lg">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Pedido'}
      </Button>
    </form>
  )
}
