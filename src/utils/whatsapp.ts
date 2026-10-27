import { BespokeOrder, BespokeProduct } from '../types/peterson';
import { formatBRL } from './payment';
import { isHomologacao } from './environment';

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
  const prefix = isHomologacao()
    ? '🧪 *[TESTE EM AMBIENTE DE HOMOLOGAÇÃO]*\n'
    : '';
  return [
    `${prefix}Olá, equipe *Peterson Shoes*! ✨`,
    `Gostaria de tirar uma dúvida sobre a sandália sob encomenda:`,
    ``,
    `👠 *Modelo:* ${product.name} (${product.sku})`,
    selectedColor ? `🎨 *Cor escolhida:* ${selectedColor}` : null,
    selectedSize ? `📏 *Numeração:* ${selectedSize} BR (34 ao 39)` : null,
    selectedHeel ? `✨ *Salto / Solado:* ${selectedHeel}` : null,
    `💎 *Valor Total:* ${formatBRL(product.price)} (Entrada 50%: ${formatBRL(deposit)} no Pix ou no Cartão c/ taxa do banco + 50% na entrega)`,
    `⏳ *Prazo de produção:* ${product.productionDays} dias`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildCustomerOrderMessage(order: BespokeOrder): string {
  const depositPay = order.payments?.find((p) => p.installmentType === 'ENTRADA_50');
  const isCard = depositPay?.method === 'CARTAO_MERCADO_PAGO';
  const prefix = isHomologacao()
    ? '🧪 *[PEDIDO DE TESTE — AMBIENTE DE HOMOLOGAÇÃO]*\n'
    : '';

  const itemsLines = order.items
    .map((item, idx) => {
      const specs = [
        item.customization.heelOption
          ? `Salto: ${item.customization.heelOption}`
          : null,
        item.customization.strapFinish
          ? `Acabamento: ${item.customization.strapFinish}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');
      return (
        `${idx + 1}. *${item.name}* (${item.quantity}x)\n` +
        `   • Cor: *${item.colorName}* | Tam: *${item.size} BR*\n` +
        (specs ? `   • ${specs}\n` : '') +
        `   • Forma: ${item.customization.footWidth}` +
        (item.customization.customNotes
          ? `\n   • Obs para a Fábrica: ${item.customization.customNotes}`
          : '')
      );
    })
    .join('\n\n');

  const depositLine = isCard
    ? `💳 *Entrada (50% no Cartão de Crédito ${depositPay?.installments || 1}x):* ${formatBRL(
        depositPay?.amount || order.depositAmount
      )} (Valor 50%: ${formatBRL(order.depositAmount)} + Taxa do banco: ${formatBRL(
        depositPay?.feeAmount || 0
      )}) — Aguardando conferência`
    : `🏦 *Entrada (50% via Pix Banco Inter):* ${formatBRL(order.depositAmount)} (CNPJ 50.789.636/0001-32 — 50789636 JACKELINE GOMES PETERSON) — Aguardando conferência do recebimento`;

  return [
    `${prefix}Olá, *Peterson Shoes*! Acabei de realizar minha encomenda pelo site e envio o comprovante para conferência:`,
    ``,
    `📋 *Pedido:* #${order.orderCode}`,
    `👩 *Cliente:* ${order.customerName}`,
    `📱 *WhatsApp:* ${order.customerWhatsapp}`,
    ``,
    `👠 *Itens Sob Encomenda:*`,
    itemsLines,
    ``,
    `💰 *Total da(s) Sandália(s):* ${formatBRL(order.totalAmount)}`,
    depositLine,
    `⏳ *Restante da Sandália (50% na entrega):* ${formatBRL(order.remainingAmount)}`,
    `🗓️ *Previsão de Conclusão (15 dias):* ${order.estimatedDeliveryDate.split('-').reverse().join('/')}`,
    `📍 *Endereço de Entrega:* ${order.shippingAddress}`,
    `🚚 *Frete / Entrega (separado da sandália):* O frete é por conta da cliente. A forma de envio e o valor da entrega serão combinados quando a sandália estiver pronta (Goiânia e região: Uber Moto | Outras cidades: Correios, com o frete pago antes da postagem).`,
  ].join('\n');
}

export function buildFactoryProductionMessage(order: BespokeOrder): string {
  const prefix = isHomologacao()
    ? '🧪 *[TESTE DE HOMOLOGAÇÃO — NÃO PRODUZIR]*\n'
    : '';
  const itemsLines = order.items
    .map(
      (item, idx) =>
        `*[ITEM ${idx + 1}] ${item.name.toUpperCase()} (SKU: ${item.sku})*\n` +
        `• Quantidade: ${item.quantity} par(es)\n` +
        `• Numeração: *${item.size} BR*\n` +
        `• Cor Solicitada: *${item.colorName}*\n` +
        (item.customization.heelOption
          ? `• Salto / Solado: *${item.customization.heelOption}*\n`
          : '') +
        `• Metais / Acabamento: *${item.customization.strapFinish}*\n` +
        `• Ajuste de Forma: *${item.customization.footWidth}*\n` +
        `• Observações para a Fábrica: ${item.customization.customNotes || 'Padrão de ficha técnica'}`
    )
    .join('\n\n');

  return [
    `${prefix}🛠️ *ORDEM DE PRODUÇÃO — PETERSON SHOES*`,
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
  const prefix = isHomologacao()
    ? '🧪 *[TESTE EM HOMOLOGAÇÃO — SEM COBRANÇA REAL]*\n'
    : '';
  return [
    `${prefix}Olá, *${order.customerName}*! Tudo bem? ✨`,
    `Temos uma notícia maravilhosa da *Peterson Shoes*: sua sandália sob encomenda do pedido *#${order.orderCode}* já está *100% pronta* e aprovada pelo nosso controle de qualidade! 👠`,
    ``,
    `Conforme combinado no pedido:`,
    `• Entrada de 50% da sandália já confirmada: *${formatBRL(order.depositAmount)}* ✅`,
    `• Saldo final de 50% da sandália na entrega: *${formatBRL(order.remainingAmount)}*`,
    `• *Frete / Entrega:* Agora podemos combinar a forma de envio e o valor da entrega para o seu endereço (${order.shippingAddress}) — por *Uber Moto* (Goiânia e região) ou pelos *Correios* (outras cidades, com o frete pago antes da postagem).`,
    ``,
    `Dados para pagamento via Pix (Banco Inter):`,
    `• *Banco:* Inter`,
    `• *Nome:* 50789636 JACKELINE GOMES PETERSON`,
    `• *Chave Pix (CNPJ):* 50.789.636/0001-32`,
    `• *Valor dos 50% finais da sandália:* ${formatBRL(order.remainingAmount)}`,
    ``,
    `Me avise por aqui para combinarmos a entrega!`,
  ].join('\n');
}

export function toWhatsAppHref(
  phone: string,
  text: string,
  options?: { isCustomerRecipient?: boolean }
): string {
  // Em ambiente de homologação, bloqueia o disparo de mensagens para números de clientes reais
  if (isHomologacao() && options?.isCustomerRecipient) {
    return '#homologacao-envio-cliente-bloqueado';
  }
  const clean = cleanWhatsAppPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
