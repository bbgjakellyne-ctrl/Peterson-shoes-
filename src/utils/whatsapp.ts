import { BespokeOrder, BespokeProduct } from '../types/peterson';
import { formatBRL } from './payment';

export function cleanWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits || '5562984998265';
}

export function encodeOrderSyncPayload(order: BespokeOrder): string {
  try {
    const depositPay = order.payments?.find((p) => p.installmentType === 'ENTRADA_50');
    const compact = {
      id: order.id,
      c: order.orderCode,
      n: order.customerName,
      w: order.customerWhatsapp,
      cpf: order.customerCpf || '',
      e: order.customerEmail || '',
      a: order.shippingAddress,
      t: order.totalAmount,
      d: order.depositAmount,
      r: order.remainingAmount,
      m: depositPay?.method || order.preferredPaymentMethod || 'PIX_MERCADO_PAGO',
      dt: order.createdAt,
      i: order.items.map((it) => ({
        p: it.productId,
        s: it.sku,
        nm: it.name,
        im: it.image,
        up: it.unitPrice,
        q: it.quantity,
        sz: it.size,
        cn: it.colorName,
        ch: it.colorHex,
        ho: it.customization?.heelOption || '',
        sf: it.customization?.strapFinish || '',
        fw: it.customization?.footWidth || 'Padrão',
        nt: it.customization?.customNotes || '',
      })),
    };
    const json = JSON.stringify(compact);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://peterson-shoes.vercel.app';
    return `${origin}/?acesso=admin&importar_pedido=${encodeURIComponent(b64)}`;
  } catch {
    return '';
  }
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
    `Gostaria de tirar uma dúvida sobre o calçado sob encomenda:`,
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

export function buildCustomerOrderMessage(
  order: BespokeOrder,
  options?: { pixConfirmedByCustomer?: boolean }
): string {
  const depositPay = order.payments?.find((p) => p.installmentType === 'ENTRADA_50');
  const isCard =
    depositPay?.method === 'CARTAO_MERCADO_PAGO' ||
    order.preferredPaymentMethod === 'CARTAO_MERCADO_PAGO';
  const pixConfirmed = options?.pixConfirmedByCustomer ?? true;

  const createdDateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const itemsLines = order.items
    .map((item, idx) => {
      const specs = [
        item.customization?.heelOption
          ? `Salto/Solado: ${item.customization.heelOption}`
          : null,
        item.customization?.strapFinish
          ? `Acabamento: ${item.customization.strapFinish}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');
      return (
        `*${idx + 1}. ${item.name}* (SKU: ${item.sku})\n` +
        `   • Quantidade: *${item.quantity} par(es)* | Valor Unit.: *${formatBRL(item.unitPrice)}*\n` +
        `   • Cor Escolhida: *${item.colorName}*\n` +
        `   • Numeração: *${item.size} BR*\n` +
        (specs ? `   • ${specs}\n` : '') +
        `   • Forma do Pé: *${item.customization?.footWidth || 'Padrão'}*` +
        (item.customization?.insoleEngraving
          ? `\n   • Palmilha: ${item.customization.insoleEngraving}`
          : '') +
        (item.customization?.customNotes
          ? `\n   • Observações: ${item.customization.customNotes}`
          : '')
      );
    })
    .join('\n\n');

  const depositLine = isCard
    ? `💳 *Entrada de 50% (Cartão de Crédito ${depositPay?.installments || 1}x):* *${formatBRL(
        depositPay?.amount || order.depositAmount
      )}* (Base 50%: ${formatBRL(order.depositAmount)} + Taxa: ${formatBRL(
        depositPay?.feeAmount || 0
      )})`
    : `🏦 *VALOR DO PIX DE 50% PARA CONFERIR NO BANCO INTER:* *${formatBRL(
        order.depositAmount
      )}*\n   • Chave Pix (CNPJ): *50.789.636/0001-32*\n   • Favorecido: *50789636 JACKELINE GOMES PETERSON*`;

  const syncLink = encodeOrderSyncPayload(order);

  return [
    pixConfirmed
      ? `🔔 *CONFIRMAÇÃO DE PIX E PEDIDO — PETERSON SHOES*`
      : `🛍️ *NOVO PEDIDO SOB ENCOMENDA — PETERSON SHOES*`,
    `⏳ *Status:* AGUARDANDO CONFIRMAÇÃO DA PETERSON SHOES`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Código do Pedido:* #${order.orderCode}`,
    `🗓️ *Data/Hora:* ${createdDateStr}`,
    ``,
    `👩 *DADOS DA CLIENTE:*`,
    `• *Nome:* ${order.customerName}`,
    `• *WhatsApp:* ${order.customerWhatsapp}`,
    order.customerCpf ? `• *CPF:* ${order.customerCpf}` : null,
    order.customerEmail ? `• *E-mail:* ${order.customerEmail}` : null,
    ``,
    `📍 *ENDEREÇO COMPLETO DE ENTREGA:*`,
    `${order.shippingAddress}`,
    ``,
    `👠 *ITENS DO PEDIDO:*`,
    itemsLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *RESUMO FINANCEIRO (50% ENTRADA + 50% NA ENTREGA):*`,
    `• *Valor Total do Pedido:* ${formatBRL(order.totalAmount)}`,
    depositLine,
    `• *Saldo Restante (50% quando ficar pronto):* ${formatBRL(order.remainingAmount)}`,
    `• *Previsão de Conclusão (15 dias):* ${order.estimatedDeliveryDate.split('-').reverse().join('/')}`,
    `• *Frete / Entrega:* Combinado quando o calçado estiver pronto (Goiânia e região: Uber Moto | Outras cidades: Correios).`,
    syncLink
      ? `\n🔗 *Link Admin (Clique p/ abrir este pedido no Painel):*\n${syncLink}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildFactoryProductionMessage(order: BespokeOrder): string {
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
  return [
    `Olá, *${order.customerName}*! Tudo bem? ✨`,
    `Temos uma notícia maravilhosa da *Peterson Shoes*: seu calçado sob encomenda do pedido *#${order.orderCode}* já está *100% pronto* e aprovado pelo nosso controle de qualidade! 👠`,
    ``,
    `Conforme combinado no pedido:`,
    `• Entrada de 50% já confirmada: *${formatBRL(order.depositAmount)}* ✅`,
    `• Saldo final de 50% na entrega: *${formatBRL(order.remainingAmount)}*`,
    `• *Frete / Entrega:* Agora podemos combinar a forma de envio e o valor da entrega para o seu endereço (${order.shippingAddress}) — por *Uber Moto* (Goiânia e região) ou pelos *Correios* (outras cidades, com o frete pago antes da postagem).`,
    ``,
    `Dados para pagamento via Pix (Banco Inter):`,
    `• *Banco:* Inter`,
    `• *Nome:* 50789636 JACKELINE GOMES PETERSON`,
    `• *Chave Pix (CNPJ):* 50.789.636/0001-32`,
    `• *Valor dos 50% finais:* ${formatBRL(order.remainingAmount)}`,
    ``,
    `Me avise por aqui para combinarmos a entrega!`,
  ].join('\n');
}

export function toWhatsAppHref(
  phone: string,
  text: string,
  _options?: { isCustomerRecipient?: boolean }
): string {
  const clean = cleanWhatsAppPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppImmediate(phone: string, text: string): void {
  if (typeof window === 'undefined') return;
  const href = toWhatsAppHref(phone, text);
  try {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent || ''
    );
    if (isMobile) {
      window.location.href = href;
      return;
    }
    const win = window.open(href, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = href;
    }
  } catch {
    window.location.href = href;
  }
}
