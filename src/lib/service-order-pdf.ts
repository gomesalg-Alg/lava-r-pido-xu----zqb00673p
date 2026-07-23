import pb from '@/lib/pocketbase/client'
import { getCompany, type Company } from '@/services/company'
import {
  getServiceOrder,
  getServiceOrderItems,
  type ServiceOrder,
  type ServiceOrderItem,
} from '@/services/service-orders'
import { formatCurrency } from '@/lib/format'

function fileUrl(collection: string, recordId: string, filename: string): string {
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${collection}/${recordId}/${filename}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '--'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function buildItemsRows(items: ServiceOrderItem[]): string {
  if (items.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;padding:16px;color:#94a3b8;">Nenhum item adicionado.</td></tr>`
  }
  return items
    .map((item, i) => {
      const serviceName = item.expand?.service_id?.name || '--'
      const operatorName = item.expand?.operator_id?.name || '--'
      const qty = item.quantity || 1
      const unit = formatCurrency(item.unit_price || 0)
      const total = formatCurrency(qty * (item.unit_price || 0))
      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 12px;">${serviceName}</td>
          <td style="padding:8px 12px;">${operatorName}</td>
          <td style="padding:8px 12px;text-align:center;">${qty}</td>
          <td style="padding:8px 12px;text-align:right;">${unit}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:600;">${total}</td>
        </tr>`
    })
    .join('')
}

function calcSubtotal(items: ServiceOrderItem[]): number {
  return items.reduce((sum, i) => sum + (i.unit_price || 0) * (i.quantity || 1), 0)
}

function calcGrandTotal(items: ServiceOrderItem[]): number {
  const subtotal = calcSubtotal(items)
  const discount = calcTotalDiscount(items)
  const surcharge = calcTotalSurcharge(items)
  return subtotal - discount + surcharge
}

function calcTotalDiscount(items: ServiceOrderItem[]): number {
  return items.reduce((sum, i) => sum + (i.discount_amount || 0), 0)
}

function calcTotalSurcharge(items: ServiceOrderItem[]): number {
  return items.reduce((sum, i) => sum + (i.surcharge_amount || 0), 0)
}

function buildLogoHtml(company: Company): string {
  if (company.logo) {
    const url = fileUrl('company', company.id, company.logo)
    return `<img src="${url}" alt="${company.trading_name || company.name}" style="max-height:64px;max-width:200px;object-fit:contain;" />`
  }
  return `<span style="font-size:24px;font-weight:700;color:#1e40af;">${company.trading_name || company.name}</span>`
}

function buildAddressHtml(company: Company): string {
  const parts: string[] = []
  if (company.address) {
    let addr = company.address
    if (company.number) addr += `, ${company.number}`
    parts.push(addr)
  }
  if (company.neighborhood) parts.push(company.neighborhood)
  const cityParts: string[] = []
  if (company.city) cityParts.push(company.city)
  if (company.state) cityParts.push(company.state)
  if (cityParts.length) parts.push(cityParts.join(' - '))
  if (company.cep) parts.push(`CEP: ${company.cep}`)
  return parts.join('<br/>')
}

function buildHtml(company: Company, order: ServiceOrder, items: ServiceOrderItem[]): string {
  const customer = order.expand?.customer_id
  const vehicle = order.expand?.vehicle_id
  const subtotal = calcSubtotal(items)
  const totalDiscount = calcTotalDiscount(items)
  const totalSurcharge = calcTotalSurcharge(items)
  const grandTotal = calcGrandTotal(items)
  const logo = buildLogoHtml(company)
  const address = buildAddressHtml(company)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Ordem de Serviço #${String(order.ticket_number).padStart(4, '0')}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b; background:#f1f5f9; padding:24px; }
  .page { max-width:800px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding:28px 32px; background:linear-gradient(135deg,#1e40af,#2563eb); color:#fff; }
  .header .logo-area { flex:1; }
  .header .company-info { text-align:right; font-size:12px; line-height:1.6; color:#dbeafe; }
  .header .company-info .name { font-size:16px; font-weight:700; color:#fff; margin-bottom:4px; }
  .doc-title { padding:20px 32px; background:#eff6ff; border-bottom:2px solid #2563eb; }
  .doc-title h1 { font-size:20px; color:#1e40af; }
  .doc-title .subtitle { font-size:12px; color:#64748b; margin-top:4px; }
  .section { padding:20px 32px; }
  .section h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; margin-bottom:12px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
  .info-grid { display:flex; gap:32px; flex-wrap:wrap; }
  .info-grid .col { flex:1; min-width:200px; }
  .info-grid .field { margin-bottom:8px; }
  .info-grid .label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.03em; }
  .info-grid .value { font-size:14px; font-weight:500; color:#1e293b; }
  .badge { display:inline-block; padding:3px 12px; border-radius:20px; font-size:12px; font-weight:600; }
  .badge-andamento { background:#fef3c7; color:#92400e; }
  .badge-finalizado { background:#d1fae5; color:#065f46; }
  .badge-orcamento { background:#e0e7ff; color:#3730a3; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead th { background:#1e40af; color:#fff; padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.03em; }
  thead th.right { text-align:right; }
  thead th.center { text-align:center; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  .totals { padding:16px 32px; display:flex; justify-content:flex-end; }
  .totals .box { min-width:260px; }
  .totals .row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
  .totals .grand { border-top:2px solid #1e40af; margin-top:8px; padding-top:10px; font-size:18px; font-weight:700; color:#1e40af; }
  .obs { padding:16px 32px 28px; }
  .obs .obs-box { background:#f8fafc; border-left:3px solid #2563eb; padding:12px 16px; border-radius:0 8px 8px 0; font-size:13px; color:#475569; min-height:40px; }
  .footer { padding:16px 32px; background:#f1f5f9; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; }
  @media print {
    body { background:#fff; padding:0; }
    .page { box-shadow:none; border-radius:0; max-width:100%; }
    @page { size:A4; margin:12mm; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-area">${logo}</div>
      <div class="company-info">
        <div class="name">${company.trading_name || company.name}</div>
        ${company.cnpj ? `<div>CNPJ: ${company.cnpj}</div>` : ''}
        ${address ? `<div>${address}</div>` : ''}
        ${company.phone ? `<div>Tel: ${company.phone}</div>` : ''}
      </div>
    </div>
    <div class="doc-title">
      <h1>Ordem de Serviço</h1>
      <div class="subtitle">Ticket #${String(order.ticket_number).padStart(4, '0')}${order.prisma_number ? ` &middot; Nº Prisma: ${order.prisma_number}` : ''}</div>
    </div>
    <div class="section">
      <div class="info-grid">
        <div class="col">
          <div class="field"><div class="label">Data de Emissão</div><div class="value">${formatDate(order.emission_date)}</div></div>
          <div class="field"><div class="label">Status</div><div class="value">
            <span class="badge ${order.status === 'Finalizado' ? 'badge-finalizado' : order.status === 'Em Andamento' ? 'badge-andamento' : 'badge-orcamento'}">${order.status || '--'}</span>
          </div></div>
        </div>
        <div class="col">
          <div class="field"><div class="label">Forma de Pagamento</div><div class="value">${order.payment_method || '--'}</div></div>
          <div class="field"><div class="label">Nº Prisma</div><div class="value">${order.prisma_number || '--'}</div></div>
        </div>
      </div>
    </div>
    <div class="section">
      <h2>Cliente e Veículo</h2>
      <div class="info-grid">
        <div class="col">
          <div class="field"><div class="label">Cliente</div><div class="value">${customer?.name || '--'}</div></div>
          <div class="field"><div class="label">Telefone</div><div class="value">${customer?.phone || '--'}</div></div>
        </div>
        <div class="col">
          <div class="field"><div class="label">Veículo</div><div class="value">${vehicle ? `${vehicle.brand} ${vehicle.model}` : '--'}</div></div>
          <div class="field"><div class="label">Ano</div><div class="value">${vehicle?.year || '--'}</div></div>
          <div class="field"><div class="label">Placa</div><div class="value">${vehicle?.placa ? vehicle.placa.toUpperCase() : '--'}</div></div>
        </div>
      </div>
    </div>
    <div class="section">
      <h2>Serviços Realizados</h2>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Operador</th>
            <th class="center">Qtd</th>
            <th class="right">Valor Unit.</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>${buildItemsRows(items)}</tbody>
      </table>
    </div>
    <div class="totals">
      <div class="box">
        <div class="row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        ${totalDiscount > 0 ? `<div class="row" style="color:#dc2626;"><span>Desconto</span><span>- ${formatCurrency(totalDiscount)}</span></div>` : ''}
        ${totalSurcharge > 0 ? `<div class="row" style="color:#059669;"><span>Acréscimo</span><span>+ ${formatCurrency(totalSurcharge)}</span></div>` : ''}
        <div class="row"><span>Total Geral</span><span class="grand">${formatCurrency(grandTotal)}</span></div>
      </div>
    </div>
    <div class="obs">
      <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px;">Observações</h2>
      <div class="obs-box">${order.observation || 'Sem observações.'}</div>
    </div>
    <div class="footer">
      Copyright &copy; ${new Date().getFullYear()} ${company.trading_name || company.name} · www.lavarapidoxua.com.br
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  </script>
</body>
</html>`
}

export async function generateServiceOrderPdf(orderId: string): Promise<void> {
  const [company, order, items] = await Promise.all([
    getCompany(),
    getServiceOrder(orderId),
    getServiceOrderItems(orderId),
  ])

  const html = buildHtml(company || ({} as Company), order, items)
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    throw new Error(
      'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.',
    )
  }
  printWindow.document.write(html)
  printWindow.document.close()
}
