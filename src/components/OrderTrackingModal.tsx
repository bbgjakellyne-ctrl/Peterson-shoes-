import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Hammer,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
} from 'lucide-react';
import { BespokeOrder, ProductionStatus } from '../types/peterson';
import { calculateCardInstallments, formatBRL } from '../utils/payment';
import { QrCodeMatrix } from './QrCodeMatrix';
import { buildCustomerOrderMessage, toWhatsAppHref } from '../utils/whatsapp';
import {
  confirmBrowserOrderPayment,
  getBrowserStoreDb,
  lookupBrowserOrders,
} from '../data/storeData';
import { apiFetch } from '../utils/environment';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  whatsappStore: string;
  creditCardFeePercentage?: number;
}

const PRODUCTION_STEPS: { key: ProductionStatus; label: string; desc: string }[] = [
  {
    key: 'AGUARDANDO_CONFIRMACAO',
    label: '1. Entrada 50%',
    desc: 'Aguardando confirmação dos 50% (Pix ou Cartão)',
  },
  {
    key: 'CORTE_MODELAGEM',
    label: '2. Corte & Forma',
    desc: 'Seleção do material e modelagem do pé',
  },
  {
    key: 'MONTAGEM_ARTESANAL',
    label: '3. Montagem à Mão',
    desc: 'Costura artesanal, palmilha e salto',
  },
  {
    key: 'ACABAMENTO_QUALIDADE',
    label: '4. Acabamento',
    desc: 'Metais, gravação e revisão final',
  },
  {
    key: 'PRONTA_PARA_ENTREGA',
    label: '5. Sandália Pronta!',
    desc: 'Pronta no ateliê · Quitar 50% finais',
  },
  {
    key: 'ENVIADA_ENTREGUE',
    label: '6. Expedida',
    desc: 'Enviada para o endereço da cliente',
  },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  whatsappStore,
  creditCardFeePercentage = 4.99,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [orders, setOrders] = useState<BespokeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [notifiedOrderStage, setNotifiedOrderStage] = useState<Record<string, boolean>>({});
  const [cardInstallmentMap, setCardInstallmentMap] = useState<Record<string, number>>(
    {}
  );

  const fetchOrders = async (searchStr: string) => {
    setLoading(true);
    const localMatched = lookupBrowserOrders(searchStr);
    setOrders(localMatched);
    try {
      const res = await apiFetch(
        `/api/orders/lookup?query=${encodeURIComponent(searchStr)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mergedMap = new Map<string, BespokeOrder>();
          for (const lo of localMatched) mergedMap.set(lo.id, lo);
          for (const so of data) {
            mergedMap.set(so.id, so);
          }
          setOrders(Array.from(mergedMap.values()));
        }
      }
    } catch {
      // Already showing localMatched
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      fetchOrders(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const storeSettings = getBrowserStoreDb().settings;
  const activeBankName = storeSettings.bankName || 'Inter';
  const activeHolderName =
    storeSettings.bankHolderName || '50789636 JACKELINE GOMES PETERSON';
  const activePixKey = storeSettings.pixKey || '50.789.636/0001-32';
  const activePixKeyType = storeSettings.pixKeyType || 'CNPJ';

  const handleConfirmInstallment = async (
    orderId: string,
    installmentType: 'ENTRADA_50' | 'FINAL_50',
    method: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO' = 'PIX_MERCADO_PAGO',
    baseAmount = 0
  ) => {
    setConfirmingOrderId(`${orderId}-${installmentType}-${method}`);
    try {
      const chosenInstallments =
        cardInstallmentMap[`${orderId}-${installmentType}`] || 1;
      const cardOpt =
        calculateCardInstallments(baseAmount, creditCardFeePercentage).find(
          (o) => o.installments === chosenInstallments
        ) || calculateCardInstallments(baseAmount, creditCardFeePercentage)[0];

      confirmBrowserOrderPayment(orderId, {
        installmentType,
        method,
        ...(method === 'CARTAO_MERCADO_PAGO'
          ? {
              installments: cardOpt.installments,
              feeAmount: cardOpt.feeAmount,
              totalCharged: cardOpt.totalWithFee,
            }
          : {}),
      });

      try {
        await apiFetch(`/api/orders/${orderId}/notify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installmentType,
            method,
            ...(method === 'CARTAO_MERCADO_PAGO'
              ? {
                  installments: cardOpt.installments,
                  feeAmount: cardOpt.feeAmount,
                  totalCharged: cardOpt.totalWithFee,
                }
              : {}),
          }),
        });
      } catch {
        // Local notification already recorded
      }
      setNotifiedOrderStage((prev) => ({
        ...prev,
        [`${orderId}-${installmentType}`]: true,
      }));
      await fetchOrders(query);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleCopyPix = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-modal-title"
    >
      <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="px-6 py-5 bg-[#631421] text-[#FAF7F2] flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs text-[#E5D3B3]">
              Controle de Produção (15 Dias) & Pagamento 50% / 50% (Pix ou Cartão c/ Taxa)
            </p>
            <h2
              id="tracking-modal-title"
              className="font-serif-display text-2xl font-semibold mt-0.5"
            >
              Rastrear Encomenda & Quitar 50% Finais
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#FAF7F2]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar rastreamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-5 pb-4 bg-[#F3EDE2] border-b border-[#E6DDD0] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders(query);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6E5D5F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Código do pedido (ex: PTS-2026-101, PTS-2026-102), CPF ou WhatsApp..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6DDD0] rounded-xl text-xs sm:text-sm text-[#1F1215] focus:outline-none focus:border-[#631421]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Consultar Pedido
            </button>
          </form>
        </div>

        {/* Scrollable Orders List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#6E5D5F]">
              Consultando banco de dados de encomendas Peterson Shoes...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center bg-[#F3EDE2] rounded-xl border border-[#E6DDD0] p-6">
              <p className="text-sm font-semibold text-[#1F1215]">
                Nenhuma encomenda encontrada para &ldquo;{query}&rdquo;.
              </p>
              <p className="text-xs text-[#6E5D5F] mt-1">
                Experimente buscar por <strong>PTS-2026-101</strong> (Em Produção) ou{' '}
                <strong>PTS-2026-102</strong> (Sandália Pronta liberada para pagamento dos 50% finais).
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIdx = PRODUCTION_STEPS.findIndex(
                (s) => s.key === order.productionStatus
              );
              const depositPayment = order.payments?.find(
                (p) => p.installmentType === 'ENTRADA_50'
              );
              const finalPayment = order.payments?.find(
                (p) => p.installmentType === 'FINAL_50'
              );
              const finalCardOptions = calculateCardInstallments(
                order.remainingAmount,
                creditCardFeePercentage
              );
              const selectedFinalInst =
                cardInstallmentMap[`${order.id}-FINAL_50`] || 1;
              const currentFinalCardOpt =
                finalCardOptions.find((o) => o.installments === selectedFinalInst) ||
                finalCardOptions[0];

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E6DDD0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F3EDE2]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5D5F]">
                        <span className="font-mono-tabular font-bold text-sm text-[#631421]">
                          Pedido #{order.orderCode}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-[#1F1215]">
                          {order.customerName}
                        </span>
                        <span>·</span>
                        <span>
                          Previsão ({order.productionDays} dias):{' '}
                          <strong className="text-[#1F1215] font-mono-tabular">
                            {order.estimatedDeliveryDate.split('-').reverse().join('/')}
                          </strong>
                        </span>
                      </div>
                      <p className="text-xs text-[#6E5D5F] mt-1">{order.shippingAddress}</p>
                    </div>

                    <a
                      href={toWhatsAppHref(
                        whatsappStore,
                        buildCustomerOrderMessage(order)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#1F1215] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#2E6B3E]" />
                      <span>Falar sobre Pedido no WhatsApp</span>
                    </a>
                  </div>

                  {/* 15-Day Production Timeline */}
                  <div>
                    <p className="text-xs font-semibold text-[#1F1215] mb-3 flex items-center gap-1.5">
                      <Hammer className="w-3.5 h-3.5 text-[#631421]" />
                      <span>
                        Andamento da Produção Sob Encomenda (Prazo Estimado: {order.productionDays} Dias)
                      </span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {PRODUCTION_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div
                            key={step.key}
                            className={`p-2.5 rounded-xl border text-xs transition-colors ${
                              isCurrent
                                ? 'bg-[#631421] text-[#FAF7F2] border-[#631421]'
                                : isDone
                                ? 'bg-[#F3EDE2] text-[#1F1215] border-[#D8CBB8]'
                                : 'bg-[#FAF7F2] text-[#8C7A7E] border-[#E6DDD0]'
                            }`}
                          >
                            <p className="font-semibold leading-tight">{step.label}</p>
                            <p
                              className={`text-[11px] mt-1 leading-snug ${
                                isCurrent ? 'text-[#FAF7F2]/90' : 'text-[#6E5D5F]'
                              }`}
                            >
                              {step.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {order.factoryNotes && (
                      <p className="mt-3 text-xs text-[#3D2C30] bg-[#FAF7F2] px-3.5 py-2.5 rounded-lg border border-[#E6DDD0]">
                        <strong>Atualização do Ateliê:</strong> {order.factoryNotes}
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[#F3EDE2] text-xs">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover border border-[#E6DDD0] shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-[#1F1215] text-sm">
                              {item.name} ({item.quantity}x)
                            </p>
                            <p className="text-[#6E5D5F] mt-0.5">
                              Cor: <strong className="text-[#631421]">{item.colorName}</strong> · Tam: <strong>{item.size} BR</strong>
                              {item.customization.heelOption
                                ? ` · ${item.customization.heelOption}`
                                : ''}
                              {item.customization.strapFinish
                                ? ` · ${item.customization.strapFinish}`
                                : ''}{' '}
                              · Forma: {item.customization.footWidth}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono-tabular font-semibold text-sm text-[#1F1215] whitespace-nowrap">
                          {formatBRL(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Two-Stage 50% / 50% Payment Control (Pix or Credit Card with Bank Fee) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#F3EDE2]">
                    {/* Stage 1: 50% Deposit */}
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#1F1215]">
                            1ª Parcela: 50% de Entrada
                          </span>
                          <span
                            className={`font-semibold whitespace-nowrap ${
                              depositPayment?.status === 'APROVADO'
                                ? 'text-[#2E6B3E]'
                                : 'text-[#8C4A27]'
                            }`}
                          >
                            {depositPayment?.status === 'APROVADO'
                              ? depositPayment.method === 'CARTAO_MERCADO_PAGO'
                                ? `Pago no Cartão (${depositPayment.installments || 1}x) ✓`
                                : 'Pago no Pix ✓'
                              : 'Aguardando 50%'}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-[#1F1215] font-mono-tabular mt-1">
                          {formatBRL(order.depositAmount)}{' '}
                          <span className="text-xs font-normal text-[#6E5D5F]">
                            (no Pix s/ taxa)
                          </span>
                        </p>
                        {depositPayment?.method === 'CARTAO_MERCADO_PAGO' &&
                          depositPayment.feeAmount ? (
                            <p className="text-[11px] text-[#631421] font-mono-tabular">
                              Total c/ taxa do banco: {formatBRL(depositPayment.amount)}
                            </p>
                          ) : null}
                      </div>

                      {depositPayment && depositPayment.status !== 'APROVADO' && (
                        <div className="mt-4 pt-3 border-t border-[#E6DDD0] space-y-2.5">
                          <div className="p-2.5 rounded-lg bg-white border border-[#E6DDD0] text-[11px] text-[#3D2C30] space-y-1">
                            <p className="font-bold text-[#631421]">
                              ⚠️ O QR Code não possui valor fixo — digite no app do banco:{' '}
                              <span className="font-mono-tabular underline">
                                {formatBRL(order.depositAmount)}
                              </span>
                            </p>
                            <p>
                              <strong>Banco:</strong> {activeBankName} ·{' '}
                              <strong>Nome no QR Code:</strong> {activeHolderName}
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F3EDE2]">
                              <p className="font-mono-tabular">
                                <strong>Chave Pix ({activePixKeyType}):</strong>{' '}
                                <span className="text-[#631421] font-bold">
                                  50.789.636/0001-32
                                </span>
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyPix(
                                    '50.789.636/0001-32',
                                    `key-${depositPayment.id}`
                                  )
                                }
                                className="px-2 py-1 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#631421] rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === `key-${depositPayment.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#2E6B3E]" />
                                    <span>Chave Copiada</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar Chave</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <QrCodeMatrix
                              seed={depositPayment.pixCopyPaste}
                              size={112}
                              compact
                            />
                            <div className="flex-1 space-y-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyPix(
                                    depositPayment.pixCopyPaste,
                                    depositPayment.id
                                  )
                                }
                                className="w-full py-2 px-3 bg-white border border-[#E6DDD0] hover:border-[#631421] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {copiedId === depositPayment.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#2E6B3E]" />
                                    <span>Código Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Código Pix</span>
                                  </>
                                )}
                              </button>
                              {notifiedOrderStage[`${order.id}-ENTRADA_50`] ? (
                                <div className="p-2 rounded-lg bg-white border border-[#631421] text-[11px] text-[#631421] font-medium">
                                  ⏳ Pagamento informado! Aguardando conferência do recebimento pela Peterson Shoes.
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConfirmInstallment(
                                      order.id,
                                      'ENTRADA_50',
                                      'PIX_MERCADO_PAGO',
                                      order.depositAmount
                                    )
                                  }
                                  className="w-full py-2 px-3 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Já Paguei — Informar p/ Conferência
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stage 2: 50% Final Payment when sandal is ready */}
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#1F1215]">
                            2ª Parcela: 50% na Conclusão
                          </span>
                          <span
                            className={`font-semibold whitespace-nowrap ${
                              finalPayment?.status === 'APROVADO'
                                ? 'text-[#2E6B3E]'
                                : order.productionStatus === 'PRONTA_PARA_ENTREGA'
                                ? 'text-[#631421]'
                                : 'text-[#6E5D5F]'
                            }`}
                          >
                            {finalPayment?.status === 'APROVADO'
                              ? 'Quitado 100% ✓'
                              : order.productionStatus === 'PRONTA_PARA_ENTREGA'
                              ? 'Sandália Pronta · Liberado!'
                              : 'Pago após ficar pronta'}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-[#1F1215] font-mono-tabular mt-1">
                          {formatBRL(order.remainingAmount)}{' '}
                          <span className="text-xs font-normal text-[#6E5D5F]">
                            (no Pix s/ taxa)
                          </span>
                        </p>
                        <p className="text-xs text-[#6E5D5F] mt-0.5">
                          Você escolhe: Pix sem taxa ou Cartão de Crédito com a taxa do banco.
                        </p>
                      </div>

                      {finalPayment && finalPayment.status !== 'APROVADO' && (
                        <div className="mt-4 pt-3 border-t border-[#E6DDD0]">
                          {order.productionStatus === 'PRONTA_PARA_ENTREGA' ? (
                            <div className="space-y-2.5">
                              <div className="p-2.5 rounded-lg bg-white border border-[#E6DDD0] text-[11px] text-[#3D2C30] space-y-1">
                                <p className="font-bold text-[#631421]">
                                  ⚠️ O QR Code não possui valor fixo — digite no app do banco:{' '}
                                  <span className="font-mono-tabular underline">
                                    {formatBRL(order.remainingAmount)}
                                  </span>
                                </p>
                                <p>
                                  <strong>Banco:</strong> {activeBankName} ·{' '}
                                  <strong>Nome no QR Code:</strong> {activeHolderName}
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F3EDE2]">
                                  <p className="font-mono-tabular">
                                    <strong>Chave Pix ({activePixKeyType}):</strong>{' '}
                                    <span className="text-[#631421] font-bold">
                                      50.789.636/0001-32
                                    </span>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyPix(
                                        '50.789.636/0001-32',
                                        `key-${finalPayment.id}`
                                      )
                                    }
                                    className="px-2 py-1 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#631421] rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === `key-${finalPayment.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#2E6B3E]" />
                                        <span>Chave Copiada</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar Chave</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <QrCodeMatrix
                                  seed={finalPayment.pixCopyPaste}
                                  size={112}
                                  compact
                                />
                                <div className="flex-1 space-y-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyPix(
                                        finalPayment.pixCopyPaste,
                                        finalPayment.id
                                      )
                                    }
                                    className="w-full py-2 px-3 bg-white border border-[#E6DDD0] hover:border-[#631421] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    {copiedId === finalPayment.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-[#2E6B3E]" />
                                        <span>Código Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copiar Código Pix</span>
                                      </>
                                    )}
                                  </button>
                                  {notifiedOrderStage[`${order.id}-FINAL_50`] ? (
                                    <div className="p-2 rounded-lg bg-white border border-[#631421] text-[11px] text-[#631421] font-medium">
                                      ⏳ Pagamento final informado! Aguardando conferência pela Peterson Shoes.
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={
                                        confirmingOrderId ===
                                        `${order.id}-FINAL_50-PIX_MERCADO_PAGO`
                                      }
                                      onClick={() =>
                                        handleConfirmInstallment(
                                          order.id,
                                          'FINAL_50',
                                          'PIX_MERCADO_PAGO',
                                          order.remainingAmount
                                        )
                                      }
                                      className="w-full py-2 px-3 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] rounded-lg text-xs font-semibold cursor-pointer"
                                    >
                                      Já Paguei 50% Finais — Informar p/ Conferência
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#6E5D5F] italic">
                              O pagamento dos 50% finais da sandália (via Pix ou Cartão de Crédito) é liberado quando sua sandália chega à etapa &ldquo;5. Sandália Pronta!&rdquo;.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Freight & Delivery Rule Summary (Kept strictly separate from sandal price) */}
                  <div className="p-3.5 rounded-xl bg-[#F3EDE2] border border-[#E6DDD0] text-xs text-[#3D2C30] space-y-1">
                    <p className="font-bold text-[#631421]">
                      Frete e Entrega (separado do preço da sandália):
                    </p>
                    <p className="font-semibold text-[#1F1215]">
                      &ldquo;O frete é por conta da cliente. A forma de envio e o valor da entrega serão combinados quando a sandália estiver pronta.&rdquo;
                    </p>
                    <p className="text-[11px] text-[#4A383B]">
                      • <strong>Goiânia e região:</strong> entrega combinada por <strong>Uber Moto</strong>.<br />
                      • <strong>Outras cidades:</strong> envio combinado pelos <strong>Correios</strong>, com o frete pago pela cliente antes da postagem.
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
