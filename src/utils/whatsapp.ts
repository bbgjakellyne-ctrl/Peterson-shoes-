import { BespokeOrder, BespokeProduct } from '../types/peterson';
import { formatBRL } from './payment';

export function cleanWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits || '5562984998265';
}

export function buildCustomerProductMessage(
  product: BespokeProduct,
  selectedColor?: string,
  selectedSize?: number,
  selectedHeel?: string
): string {
  const deposit = product.price * 0.5;
  return [
    `Olá, equipe *Peterson Shoes*! ✨`,
    `Gostaria de tirar uma dúvida sobre a sandália sob encomenda:`,
    ``,
    `👠 *Modelo:* ${product.name} (${product.sku})`,
    selectedColor ? `🎨 *Cor escolhida:* ${selectedColor}` : null,
    selectedSize ? `📏 *Numeração:* ${selectedSize} BR (34 ao 39)` : null,
    selectedHeel ? `✨ *Salto / Solado:* ${selectedHeel}` : null,
    `💎 *Valor Total:* ${formatBRL(product.price)} (Entrada 50%: ${formatBRL(deposit)} no Pix ou no Cartão c/ taxa do banco + 50% quando ficar pronta)`,
    `⏳ *Prazo de produção:* ${product.productionDays} dias`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildCustomerOrderMessage(order: BespokeOrder): string {
  const depositPay = order.payments?.find((p) => p.installmentType === 'ENTRADA_50');
  const isCard = depositPay?.method === 'CARTAO_MERCADO_PAGO';

  const itemsLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (${item.quantity}x)\n   • Cor: *${item.colorName}* | Tam: *${item.size} BR*\n   • Salto: ${item.customization.heelOption} | Acabamento: ${item.customization.strapFinish}\n   • Forma: ${item.customization.footWidth}${
          item.customization.insoleEngraving
            ? ` | Iniciais: "${item.customization.insoleEngraving}"`
            : ''
        }${item.customization.customNotes ? `\n   • Obs: ${item.customization.customNotes}` : ''}`
    )
    .join('\n\n');

  const depositLine = isCard
    ? `💳 *Entrada (50% no Cartão de Crédito ${depositPay?.installments || 1}x):* ${formatBRL(
        depositPay?.amount || order.depositAmount
      )} (Valor 50%: ${formatBRL(order.depositAmount)} + Taxa do banco: ${formatBRL(
        depositPay?.feeAmount || 0
      )})`
    : `✅ *Entrada (50% via Pix):* ${formatBRL(order.depositAmount)}`;

  return [
    `Olá, *Peterson Shoes*! Acabei de realizar minha encomenda pelo site:`,
    ``,
    `📋 *Pedido:* #${order.orderCode}`,
    `👩 *Cliente:* ${order.customerName}`,
    `📱 *WhatsApp:* ${order.customerWhatsapp}`,
    ``,
    `👠 *Itens Sob Encomenda:*`,
    itemsLines,
    ``,
    `💰 *Total do Pedido:* ${formatBRL(order.totalAmount)}`,
    depositLine,
    `⏳ *Restante (50% quando ficar pronta):* ${formatBRL(order.remainingAmount)} (Pix ou Cartão c/ taxa)`,
    `🗓️ *Previsão de Conclusão (15 dias):* ${order.estimatedDeliveryDate.split('-').reverse().join('/')}`,
    `📍 *Entrega:* ${order.shippingAddress}`,
  ].join('\n');
}

export function buildFactoryProductionMessage(order: BespokeOrder): string {
  const itemsLines = order.items
    .map(
      (item, idx) =>
        `*[ITEM ${idx + 1}] ${item.name.toUpperCase()} (SKU: ${item.sku})*\n` +
        `• Quantidade: ${item.quantity} par(es)\n` +
        `• Numeração: *${item.size} BR*\n` +
        `• Cor Solicitada: *${item.colorName}*\n` +
        `• Salto / Solado: *${item.customization.heelOption}*\n` +
        `• Metais / Acabamento: *${item.customization.strapFinish}*\n` +
        `• Ajuste de Forma: *${item.customization.footWidth}*\n` +
        `• Gravação na Palmilha: *${item.customization.insoleEngraving || 'Sem gravação'}*\n` +
        `• Observações Técnicas: ${item.customization.customNotes || 'Padrão de ficha técnica'}`
    )
    .join('\n\n');

  return [
    `🛠️ *ORDEM DE PRODUÇÃO — PETERSON SHOES*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 *Código da Encomenda:* #${order.orderCode}`,
    `🗓️ *Data de Entrada:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`,
    `⏰ *Meta de Conclusão (15 dias):* ${order.estimatedDeliveryDate.split('-').reverse().join('/')}`,
    `👩 *Cliente:* ${order.customerName}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    itemsLines,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📝 *Notas Internas do Ateliê:* ${order.factoryNotes || 'Priorizar acabamento de palmilha.'}`,
    `Por favor, confirmar recebimento desta ficha para início do Corte & Modelagem.`,
  ].join('\n');
}

export function buildReadyForFinalPaymentMessage(order: BespokeOrder): string {
  const finalPay = order.payments?.find((p) => p.installmentType === 'FINAL_50');
  return [
    `Olá, *${order.customerName}*! Tudo bem? ✨`,
    `Temos uma notícia maravilhosa da *Peterson Shoes*: sua sandália sob encomenda do pedido *#${order.orderCode}* já está *100% pronta* e aprovada pelo nosso controle de qualidade! 👠`,
    ``,
    `Conforme combinado no pedido:`,
    `• Entrada de 50% já confirmada: *${formatBRL(order.depositAmount)}* ✅`,
    `• Saldo final de 50% para envio: *${formatBRL(order.remainingAmount)}* (no Pix sem taxa ou no Cartão de Crédito com a taxa do banco)`,
    ``,
    `Você pode quitar os 50% finais(Pix ou Cartão) diretamente na aba *"Rastrear Pedido"* em nosso site ou utilizando o código Pix Copia e Cola abaixo:`,
    ``,
    `${finalPay?.pixCopyPaste || 'Consulte no site com o código ' + order.orderCode}`,
    ``,
    `Assim que confirmado, faremos o envio imediato para: ${order.shippingAddress}.`,
  ].join('\n');
}

export function toWhatsAppHref(phone: string, text: string): string {
  const clean = cleanWhatsAppPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
