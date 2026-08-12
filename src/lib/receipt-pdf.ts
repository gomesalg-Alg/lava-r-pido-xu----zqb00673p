import { formatCurrency, formatDateBR, formatDateTimeBR } from '@/lib/format'
import { maskCPF, maskCPFCNPJ, maskPhone } from '@/lib/masks'

export interface ReceiptPdfInput {
  companyName: string
  companyPhone?: string
  companyAddress?: string
  companyNumber?: string
  companyCity?: string
  companyState?: string
  logoUrl?: string | null
  orderNumber?: number | null
  emissionDate?: string
  status?: string
  customerName?: string
  customerPhone?: string
  customerCpf?: string
  customerDocument?: string
  itemGroups: Array<{
    title: string
    items: Array<{ name: string; quantity: number; unit_price: number; total_price: number }>
    subtotal: number
  }>
  subtotal: number
  discount?: number
  surcharge?: number
  total: number
  payments: Array<{ method: string; amount: number; card_flag?: string; installments?: number }>
  totalPaid: number
  troco: number
  description?: string
  receivedAt?: string
  isPaid: boolean
}

export function formatPaymentLabel(p: {
  method: string
  card_flag?: string
  installments?: number
}): string {
  if (p.method === 'Cartão de Crédito') {
    const inst = p.installments && p.installments > 0 ? p.installments : null
    return `${p.method}${inst ? ` (${inst}x)` : ''}${p.card_flag ? ` - Bandeira: ${p.card_flag}` : ''}`
  }
  if (p.method === 'Cartão de Débito') {
    return `${p.method} (1x)${p.card_flag ? ` - Bandeira: ${p.card_flag}` : ''}`
  }
  return p.method
}

function buildItemsHtml(groups: ReceiptPdfInput['itemGroups']): string {
  return groups
    .map((g) => {
      const rows = g.items
        .map(
          (i) =>
            `<tr><td>${i.name || '--'}</td><td class="c">${i.quantity || 1}</td><td class="r">${formatCurrency(i.unit_price || 0)}</td><td class="r">${formatCurrency(i.total_price || (i.quantity || 1) * (i.unit_price || 0))}</td></tr>`,
        )
        .join('')
      return `<h3 class="st">${g.title}</h3><table><thead><tr><th>Item</th><th class="c">Qtd</th><th class="r">Valor Unit.</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody></table><div class="sub"><div class="sb"><span>Sub-total:</span><span>${formatCurrency(g.subtotal)}</span></div></div>`
    })
    .join('')
}

export function generateReceiptPdf(data: ReceiptPdfInput): void {
  const addr = [data.companyAddress, data.companyNumber].filter(Boolean).join(', ')
  const loc = [data.companyCity, data.companyState].filter(Boolean).join(' - ')
  const docValue = data.customerDocument || data.customerCpf || ''
  const docLabel = data.customerDocument ? 'CPF/CNPJ' : 'CPF'
  const docMasked = data.customerDocument ? maskCPFCNPJ(docValue) : maskCPF(docValue)
  const itemsHtml = buildItemsHtml(data.itemGroups)
  const paymentsHtml = data.payments
    .map(
      (p, i) =>
        `<div class="pr${i % 2 === 0 ? ' pr-zebra' : ''}"><span>${formatPaymentLabel(p)}</span><span>${formatCurrency(p.amount)}</span></div>`,
    )
    .join('')
  const yr = new Date().getFullYear()

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1e293b;background:#f1f5f9;padding:16px}.page{max-width:800px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06)}.t-wrap{text-align:center;margin-bottom:14px}h1.t{display:inline-block;font-size:26px;font-weight:700;letter-spacing:3px;color:#1e3a8a;padding:6px 28px;background:#eff6ff;border-top:3px double #1e40af;border-bottom:3px double #1e40af;border-radius:4px}.t-sub{font-size:10px;text-transform:uppercase;letter-spacing:4px;color:#64748b;margin-top:6px}.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e293b;padding-bottom:12px;margin-bottom:8px}.hl{display:flex;gap:12px;align-items:flex-start}.hl img{max-height:56px;object-fit:contain}.cn{font-size:16px;font-weight:700}.ci{font-size:11px;color:#64748b;line-height:1.4}.hr{text-align:right;font-size:11px;color:#475569}.hr strong{color:#1e293b}.cust{margin:6px 0;font-size:12px;font-weight:500}.st{font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin:10px 0 4px;border-bottom:1px solid #cbd5e1;padding-bottom:2px}table{width:100%;border-collapse:collapse;font-size:11px}thead th{background:#1e40af;color:#fff;padding:4px 8px;text-align:left;font-size:10px;text-transform:uppercase}thead th.r{text-align:right}thead th.c{text-align:center}tbody td{padding:4px 8px;border-bottom:1px solid #e2e8f0}tbody td.r{text-align:right}tbody td.c{text-align:center}.sub{display:flex;justify-content:flex-end;margin-top:2px}.sb{width:220px;display:flex;justify-content:space-between;font-size:11px;font-weight:600;border-top:1px solid #cbd5e1;padding-top:2px}.tot{display:flex;justify-content:flex-end;margin-top:6px}.tb{width:220px}.tr{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}.tg{border-top:2px solid #1e293b;padding-top:4px;margin-top:4px;font-size:14px;font-weight:700}.pay{margin-top:8px}.pr{display:flex;justify-content:space-between;font-size:11px;padding:4px 8px}.pr-zebra{background:#f1f5f9}.pt{display:flex;justify-content:space-between;font-size:11px;font-weight:700;border-top:1px solid #cbd5e1;padding-top:2px;margin-top:2px}.paid{margin-top:8px;padding:6px 10px;background:#d1fae5;border:1px solid #6ee7b7;border-radius:4px;font-size:11px;font-weight:700;color:#065f46}.desc{margin-top:8px;font-size:11px}.sig{margin-top:36px;padding:14px 18px;border:1px solid #dbeafe;border-radius:8px;background:#f8fafc}.sig-h{text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#1e40af;font-weight:700;margin-bottom:24px}.sig-grid{display:flex;gap:40px}.sg{flex:1;text-align:center}.sg-l{display:flex;align-items:center;justify-content:center;gap:4px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:2px}.sg-line{border-top:2px dotted #1e40af;padding-top:3px}.sg-r{font-size:10px;color:#64748b}.sg-cn{font-size:10px;font-weight:700;color:#334155;margin-top:1px}.ft-sep{display:flex;align-items:center;margin-top:18px;margin-bottom:6px}.ft-sep .l{flex:1;height:1px;background:#e2e8f0}.ft-sep .d{padding:0 10px;color:#1e40af;font-size:10px}.ft{text-align:center;font-size:9px;color:#94a3b8}@media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;max-width:100%;padding:12px}@page{size:A4 portrait;margin:8mm}}
</style></head><body><div class="page">
<div class="t-wrap"><h1 class="t">RECIBO</h1><div class="t-sub">Lava Rápido Xuá</div></div>
<div class="hd"><div class="hl">${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo"/>` : ''}<div><div class="cn">${data.companyName}</div>${data.companyPhone ? `<div class="ci">Tel: ${data.companyPhone}</div>` : ''}${addr ? `<div class="ci">${addr}</div>` : ''}${loc ? `<div class="ci">${loc}</div>` : ''}</div></div><div class="hr">${data.orderNumber ? `<div>OS Nº: <strong>${data.orderNumber}</strong></div>` : ''}${data.emissionDate ? `<div>Emissão: ${formatDateBR(data.emissionDate)}</div>` : ''}<div>Status: <strong>${data.status || '--'}</strong></div></div></div>
${data.customerName ? `<div class="cust">Cliente: ${data.customerName}${data.customerPhone ? ` - Tel: ${maskPhone(data.customerPhone)}` : ''}${docValue ? ` - ${docLabel}: ${docMasked}` : ''}</div>` : ''}
${itemsHtml}
<div class="tot"><div class="tb"><div class="tr"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>${data.discount && data.discount > 0 ? `<div class="tr" style="color:#b91c1c"><span>Desconto:</span><span>- ${formatCurrency(data.discount)}</span></div>` : ''}${data.surcharge && data.surcharge > 0 ? `<div class="tr" style="color:#15803d"><span>Acréscimo:</span><span>+ ${formatCurrency(data.surcharge)}</span></div>` : ''}<div class="tg"><span>Total:</span><span>${formatCurrency(data.total)}</span></div></div></div>
${data.payments.length > 0 ? `<div class="pay"><h3 class="st">FORMA DE PAGAMENTO</h3>${paymentsHtml}${data.troco > 0 ? `<div class="pr"><span>Troco:</span><span class="r">${formatCurrency(data.troco)}</span></div>` : ''}<div class="pt"><span>Total Pago:</span><span>${formatCurrency(data.totalPaid)}</span></div></div>` : ''}
${data.isPaid ? `<div class="paid">✓ PAGO${data.receivedAt ? ` em ${formatDateTimeBR(data.receivedAt)}` : ''}</div>` : ''}
${data.description ? `<div class="desc"><h3 class="st">Descrição</h3>${data.description}</div>` : ''}
<div class="sig"><div class="sig-h">Assinaturas</div><div class="sig-grid"><div class="sg"><div class="sg-l">✎ Assinatura</div><div class="sg-line"><div class="sg-r">Cliente</div></div></div><div class="sg"><div class="sg-l">✎ Assinatura</div><div class="sg-line"><div class="sg-r">Responsável</div><div class="sg-cn">Lava Rápido Xuá</div></div></div></div></div>
<div class="ft-sep"><div class="l"></div><span class="d">◆</span><div class="l"></div></div><div class="ft">Copyright &copy; ${yr} ${data.companyName} · www.lavarapidoxua.com.br</div>
</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>`

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    throw new Error(
      'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.',
    )
  }
  printWindow.document.write(html)
  printWindow.document.close()
}
