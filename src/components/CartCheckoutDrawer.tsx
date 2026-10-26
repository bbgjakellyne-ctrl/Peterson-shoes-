import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Clock,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { BespokeOrder, OrderItem, PaymentRecord } from '../types/peterson';
import {
  calculateCardInstallments,
  detectCardBrand,
  formatBRL,
  formatCardNumber,
  formatCEP,
  formatCPF,
  formatExpiry,
  formatPhone,
  lookupCEP,
} from '../utils/payment';
import { QrCodeMatrix } from './QrCodeMatrix';
import { buildCustomerOrderMessage, toWhatsAppHref } from '../utils/whatsapp';
import {
  confirmBrowserOrderPayment,
  createBrowserBespokeOrder,
  getBrowserStoreDb,
} from '../data/storeData';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderCreated: (order: BespokeOrder) => void;
  whatsappStore: string;
  creditCardFeePercentage?: number;
  bankName?: string;
  bankHolderName?: string;
  bankHolderDoc?: string;
  pixKey?: string;
  pixKeyType?: string;
  bankAgency?: string;
  bankAccount?: string;
  cardPaymentLink?: string;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  whatsappStore,
  creditCardFeePercentage = 4.99,
  bankName,
  bankHolderName,
  bankHolderDoc,
  pixKey,
  pixKeyType,
  bankAgency,
  bankAccount,
  cardPaymentLink,
}) => {
  const [step, setStep] = useState<'CART' | 'CUSTOMER' | 'PAYMENT'>('CART');

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment Method Choice for the 50% Deposit: PIX or CREDIT CARD (with bank fee)
  const [selectedPayMethod, setSelectedPayMethod] = useState<
    'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO'
  >('PIX_MERCADO_PAGO');
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState('');

  // Created order & Mercado Pago state
  const [createdOrder, setCreatedOrder] = useState<BespokeOrder | null>(null);
  const [depositPayment, setDepositPayment] = useState<PaymentRecord | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedDirectKey, setCopiedDirectKey] = useState(false);
  const [confirmingDeposit, setConfirmingDeposit] = useState(false);

  if (!isOpen) return null;

  const fallbackSettings = getBrowserStoreDb().settings;
  const activeBankName =
    bankName || fallbackSettings.bankName || 'Banco Inter';
  const activeHolderName =
    bankHolderName || fallbackSettings.bankHolderName || 'Jackeline Peterson';
  const activeHolderDoc =
    bankHolderDoc || fallbackSettings.bankHolderDoc || '50.789.636/0001-32';
  const activePixKey = pixKey || fallbackSettings.pixKey || '50789636000132';
  const activePixKeyType = pixKeyType || fallbackSettings.pixKeyType || 'CNPJ';
  const activeBankAgency = bankAgency || fallbackSettings.bankAgency || '';
  const activeBankAccount = bankAccount || fallbackSettings.bankAccount || '';
  const activeCardLink = cardPaymentLink || fallbackSettings.cardPaymentLink || '';

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
  const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;

  const activeBaseDeposit = createdOrder ? createdOrder.depositAmount : depositAmount;
  const installmentOptions = calculateCardInstallments(
    activeBaseDeposit,
    creditCardFeePercentage
  );
  const currentCardOption =
    installmentOptions.find((o) => o.installments === selectedInstallments) ||
    installmentOptions[0];

  const handleCepChange = (val: string) => {
    const formatted = formatCEP(val);
    setCep(formatted);
    const quote = lookupCEP(formatted);
    if (quote) {
      if (!city) setCity(quote.city);
      if (!state) setState(quote.state);
      if (!neighborhood) setNeighborhood(quote.streetHint);
    }
  };

  const handleCreateBespokeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !customerName.trim() ||
      !customerWhatsapp.trim() ||
      !cep.trim() ||
      !street.trim() ||
      !number.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      setFormError(
        'Por favor, preencha seu nome, WhatsApp e endereço completo para entrega.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const localResult = createBrowserBespokeOrder({
        customerName,
        customerWhatsapp,
        customerEmail,
        customerCpf,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        items: cart,
      });

      let finalOrder = localResult.order;
      let finalDeposit = localResult.depositPayment;

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            customerWhatsapp,
            customerEmail,
            customerCpf,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            items: cart,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.order && data?.depositPayment) {
            finalOrder = data.order;
            finalDeposit = data.depositPayment;
          }
        }
      } catch {
        // Fallback to localResult already created
      }

      setCreatedOrder(finalOrder);
      setDepositPayment(finalDeposit);
      setCardHolder(customerName.toUpperCase());
      onClearCart();
      onOrderCreated(finalOrder);
      setStep('PAYMENT');
    } catch (err) {
      setFormError('Erro ao registrar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPixDeposit = async () => {
    if (!createdOrder) return;
    setConfirmingDeposit(true);
    try {
      const localUpdated = confirmBrowserOrderPayment(createdOrder.id, {
        installmentType: 'ENTRADA_50',
        method: 'PIX_MERCADO_PAGO',
      });
      if (localUpdated) {
        setCreatedOrder(localUpdated);
        const updatedDep = localUpdated.payments?.find(
          (p: PaymentRecord) => p.installmentType === 'ENTRADA_50'
        );
        if (updatedDep) setDepositPayment(updatedDep);
        onOrderCreated(localUpdated);
      }

      try {
        const res = await fetch(
          `/api/orders/${createdOrder.id}/confirm-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installmentType: 'ENTRADA_50',
              method: 'PIX_MERCADO_PAGO',
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.order) {
            setCreatedOrder(data.order);
            const updatedDeposit = data.order.payments?.find(
              (p: PaymentRecord) => p.installmentType === 'ENTRADA_50'
            );
            if (updatedDeposit) setDepositPayment(updatedDeposit);
            onOrderCreated(data.order);
          }
        }
      } catch {
        // Local update already applied
      }
    } finally {
      setConfirmingDeposit(false);
    }
  };

  const handleConfirmCardDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    setCardError('');

    const cleanDigits = cardNumber.replace(/\D/g, '');
    if (
      cleanDigits.length < 13 ||
      !cardHolder.trim() ||
      cardExpiry.length < 5 ||
      cardCvv.length < 3
    ) {
      setCardError(
        'Por favor, preencha os dados do cartão de crédito corretamente para processar os 50% de entrada.'
      );
      return;
    }

    setConfirmingDeposit(true);
    try {
      const brand = detectCardBrand(cleanDigits);
      const last4 = cleanDigits.slice(-4);

      const localUpdated = confirmBrowserOrderPayment(createdOrder.id, {
        installmentType: 'ENTRADA_50',
        method: 'CARTAO_MERCADO_PAGO',
        installments: currentCardOption.installments,
        feeAmount: currentCardOption.feeAmount,
        totalCharged: currentCardOption.totalWithFee,
        cardBrand: brand,
        cardLast4: last4,
      });

      if (localUpdated) {
        setCreatedOrder(localUpdated);
        const updatedDep = localUpdated.payments?.find(
          (p: PaymentRecord) => p.installmentType === 'ENTRADA_50'
        );
        if (updatedDep) setDepositPayment(updatedDep);
        onOrderCreated(localUpdated);
      }

      try {
        const res = await fetch(
          `/api/orders/${createdOrder.id}/confirm-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installmentType: 'ENTRADA_50',
              method: 'CARTAO_MERCADO_PAGO',
              installments: currentCardOption.installments,
              feeAmount: currentCardOption.feeAmount,
              totalCharged: currentCardOption.totalWithFee,
              cardBrand: brand,
              cardLast4: last4,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.order) {
            setCreatedOrder(data.order);
            const updatedDeposit = data.order.payments?.find(
              (p: PaymentRecord) => p.installmentType === 'ENTRADA_50'
            );
            if (updatedDeposit) setDepositPayment(updatedDeposit);
            onOrderCreated(data.order);
          }
        }
      } catch {
        // Local update already applied
      }
    } finally {
      setConfirmingDeposit(false);
    }
  };

  const handleCopyPix = () => {
    if (!depositPayment) return;
    navigator.clipboard.writeText(depositPayment.pixCopyPaste);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="bg-[#F7F3EC] w-full max-w-xl h-full flex flex-col justify-between shadow-2xl border-l border-[#DFD3C3] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 bg-[#5B1824] text-[#F7F3EC] flex items-center justify-between">
          <div>
            <p className="text-xs text-[#E5D3B3]">
              Encomenda Artesanal · Numeração 34 ao 39 · Prazo 15 Dias
            </p>
            <h2 id="cart-drawer-title" className="text-xl font-semibold mt-0.5">
              {step === 'CART' && 'Sua Sacola de Encomendas'}
              {step === 'CUSTOMER' && 'Seus Dados & Endereço'}
              {step === 'PAYMENT' && 'Pagamento dos 50% de Entrada (Pix ou Cartão)'}
            </h2>
          </div>
          <button
            onClick={() => {
              if (step === 'PAYMENT') {
                setStep('CART');
                setCreatedOrder(null);
              }
              onClose();
            }}
            className="p-2 text-[#F7F3EC]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar sacola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'CART' && (
            <>
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-[#5B1824]/60 mx-auto" />
                  <p className="text-base font-semibold text-[#231619]">
                    Sua sacola de encomendas está vazia
                  </p>
                  <p className="text-xs text-[#6E5A5F] max-w-xs mx-auto">
                    Escolha sua sandália no catálogo, personalize a cor (ou escreva outra cor desejada), numeração do 34 ao 39 e pague apenas 50% de entrada (no Pix ou Cartão de Crédito).
                  </p>
                </div>
              ) : (
                <>
                  {/* 50% / 50% Explainer Banner */}
                  <div className="p-4 rounded-lg bg-[#EFE7DA] border border-[#DFD3C3] text-xs text-[#3E2C30] space-y-1">
                    <p className="font-semibold text-[#5B1824] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sistema de Encomenda Peterson Shoes (50% + 50%)</span>
                    </p>
                    <p>
                      Você paga <strong>50% de entrada</strong> hoje para confirmar o pedido (você decide se prefere no <strong>Pix sem taxa</strong> ou no <strong>Cartão de Crédito com a taxa do banco</strong>) e os outros <strong>50% somente quando sua sandália estiver pronta</strong> (prazo estimado de 15 dias).
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="p-4 bg-white rounded-xl border border-[#DFD3C3] flex gap-4"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover border border-[#EFE7DA] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[#231619] truncate">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(idx)}
                              className="text-[#8C7A7E] hover:text-[#7A2434] p-1 cursor-pointer"
                              aria-label="Remover item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-[#6E5A5F] mt-0.5">
                            Cor: <strong className="text-[#5B1824]">{item.colorName}</strong> · Tam:{' '}
                            <strong className="text-[#231619]">{item.size} BR</strong>
                          </p>
                          <p className="text-xs text-[#6E5A5F]">
                            {item.customization.heelOption} · {item.customization.strapFinish} · Forma:{' '}
                            {item.customization.footWidth}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center border border-[#DFD3C3] rounded-lg bg-[#F7F3EC]">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(idx, -1)}
                                className="p-1.5 text-[#231619] hover:bg-[#EFE7DA] rounded-l-lg cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2.5 text-xs font-mono-tabular font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(idx, 1)}
                                className="p-1.5 text-[#231619] hover:bg-[#EFE7DA] rounded-r-lg cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right font-mono-tabular">
                              <p className="text-xs text-[#6E5A5F]">
                                Total: {formatBRL(item.unitPrice * item.quantity)}
                              </p>
                              <p className="text-xs font-bold text-[#5B1824]">
                                Entrada 50%: {formatBRL((item.unitPrice * item.quantity) / 2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {step === 'CUSTOMER' && (
            <form
              id="checkout-customer-form"
              onSubmit={handleCreateBespokeOrder}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setStep('CART')}
                className="text-xs font-medium text-[#5B1824] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para a sacola
              </button>

              {formError && (
                <div className="p-3 bg-[#7A2434]/10 border border-[#7A2434] rounded-lg text-xs text-[#5B1824] font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#231619] mb-1">
                  Nome Completo da Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Maria Clara Almeida"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(formatPhone(e.target.value))}
                    placeholder="(62) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    CPF (Emissão de Comprovante) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#231619] mb-1">
                  E-mail para Acompanhamento
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com.br"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                />
              </div>

              <div className="pt-3 border-t border-[#DFD3C3]">
                <p className="text-xs font-semibold text-[#5B1824] mb-3">
                  Endereço de Entrega (Envio após conclusão em 15 dias)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      required
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="74000-000"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Av. T-63"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, Bloco, Casa..."
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Setor Bueno"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Goiânia"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="GO"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 'PAYMENT' && createdOrder && depositPayment && (
            <div className="space-y-5">
              {/* Order Registered Banner */}
              <div className="p-4 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-tabular font-bold text-[#5B1824]">
                    Encomenda #{createdOrder.orderCode}
                  </span>
                  <span className="text-xs text-[#6E5A5F] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#5B1824]" />
                    Prazo: {createdOrder.productionDays} dias (
                    {createdOrder.estimatedDeliveryDate.split('-').reverse().join('/')})
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#231619]">
                  Encomenda registrada! Escolha como pagar os 50% de entrada:
                </p>
                <p className="text-xs text-[#6E5A5F]">
                  Você decide: pague os <strong>50% de entrada ({formatBRL(createdOrder.depositAmount)})</strong> via <strong>Pix sem taxa</strong> ou no <strong>Cartão de Crédito</strong> (com o acréscimo da taxa cobrada pelo banco/operadora).
                </p>
              </div>

              {/* Payment Method Selector Tabs (PIX vs CREDIT CARD) */}
              {depositPayment.status !== 'APROVADO' && (
                <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#EFE7DA] border border-[#DFD3C3] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('PIX_MERCADO_PAGO')}
                    className={`py-3 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedPayMethod === 'PIX_MERCADO_PAGO'
                        ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                        : 'bg-white/70 text-[#231619] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      <span>Pix Instantâneo</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono-tabular ${
                        selectedPayMethod === 'PIX_MERCADO_PAGO'
                          ? 'text-[#E5D3B3]'
                          : 'text-[#2E6B3E]'
                      }`}
                    >
                      {formatBRL(createdOrder.depositAmount)} (Sem taxa)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod('CARTAO_MERCADO_PAGO')}
                    className={`py-3 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedPayMethod === 'CARTAO_MERCADO_PAGO'
                        ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                        : 'bg-white/70 text-[#231619] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão de Crédito</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono-tabular ${
                        selectedPayMethod === 'CARTAO_MERCADO_PAGO'
                          ? 'text-[#E5D3B3]'
                          : 'text-[#6E5A5F]'
                      }`}
                    >
                      Até 6x (c/ taxa do banco)
                    </span>
                  </button>
                </div>
              )}

              {/* Payment Card Box */}
              <div className="p-5 rounded-xl bg-[#EFE7DA] border border-[#DFD3C3] space-y-4">
                {depositPayment.status === 'APROVADO' ? (
                  <div className="p-4 rounded-lg bg-[#2E6B3E]/10 border border-[#2E6B3E] text-[#1E4A29] space-y-2 text-center">
                    <CheckCircle2 className="w-8 h-8 text-[#2E6B3E] mx-auto" />
                    <p className="text-sm font-semibold">
                      Entrada de 50% Confirmada com Sucesso!
                    </p>
                    <p className="text-xs font-mono-tabular">
                      {depositPayment.method === 'CARTAO_MERCADO_PAGO'
                        ? `Pago no Cartão de Crédito (${depositPayment.installments || 1}x): ${formatBRL(
                            depositPayment.amount
                          )} (Entrada 50%: ${formatBRL(
                            createdOrder.depositAmount
                          )} + Taxa do banco: ${formatBRL(depositPayment.feeAmount || 0)})`
                        : `Pago via Pix (Sem taxa): ${formatBRL(createdOrder.depositAmount)}`}
                    </p>
                    <p className="text-xs">
                      Sua encomenda <strong>#{createdOrder.orderCode}</strong> já entrou automaticamente na etapa de{' '}
                      <strong>Corte & Modelagem</strong>. Os outros 50% ({formatBRL(createdOrder.remainingAmount)}) só serão cobrados quando sua sandália estiver pronta em até 15 dias!
                    </p>
                  </div>
                ) : selectedPayMethod === 'PIX_MERCADO_PAGO' ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#DFD3C3] pb-3">
                      <div>
                        <p className="text-xs font-semibold text-[#5B1824]">
                          Pix Instantâneo (1ª Parcela — 50% sem taxa)
                        </p>
                        <p className="text-[11px] text-[#6E5A5F]">
                          Valor exato dos 50% de entrada sem acréscimos
                        </p>
                      </div>
                      <span className="text-xl font-bold text-[#231619] font-mono-tabular">
                        {formatBRL(createdOrder.depositAmount)}
                      </span>
                    </div>

                    {/* Bank & Receiver Verification Card */}
                    <div className="p-3.5 rounded-xl bg-white border border-[#DFD3C3] space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-[#EFE7DA] pb-1.5">
                        <span className="font-bold text-[#5B1824] uppercase tracking-wider text-[11px]">
                          Dados Bancários do Recebedor (Conta Oficial)
                        </span>
                        <span className="text-[11px] font-semibold text-[#2E6B3E]">
                          Pix Verificado ✓
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[#231619]">
                        <div>
                          <span className="text-[#6E5A5F]">Banco / Instituição:</span>{' '}
                          <strong className="text-[#231619]">{activeBankName}</strong>
                        </div>
                        <div>
                          <span className="text-[#6E5A5F]">Favorecido / Titular:</span>{' '}
                          <strong className="text-[#231619]">
                            {activeHolderName}
                            {activeHolderDoc ? ` (${activeHolderDoc})` : ''}
                          </strong>
                        </div>
                        {(activeBankAgency || activeBankAccount) && (
                          <div className="sm:col-span-2">
                            <span className="text-[#6E5A5F]">Agência / Conta:</span>{' '}
                            <strong className="font-mono-tabular">
                              {activeBankAgency ? `Ag: ${activeBankAgency}` : ''}{' '}
                              {activeBankAccount ? `· Cc: ${activeBankAccount}` : ''}
                            </strong>
                          </div>
                        )}
                      </div>
                      <div className="pt-1.5 border-t border-[#EFE7DA] flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-[#6E5A5F]">
                            Chave Pix ({activePixKeyType}):
                          </span>{' '}
                          <strong className="font-mono-tabular text-[#5B1824]">
                            {activePixKey}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activePixKey);
                            setCopiedDirectKey(true);
                            setTimeout(() => setCopiedDirectKey(false), 2500);
                          }}
                          className="px-2.5 py-1 bg-[#F7F3EC] hover:bg-[#EFE7DA] border border-[#DFD3C3] rounded-md text-[11px] font-semibold text-[#5B1824] flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedDirectKey ? (
                            <>
                              <Check className="w-3 h-3 text-[#2E6B3E]" />
                              <span>Chave Copiada!</span>
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

                    <div className="flex flex-col items-center text-center space-y-3">
                      <QrCodeMatrix seed={depositPayment.pixCopyPaste} size={160} />
                      <p className="text-xs text-[#4A373B]">
                        Escaneie o QR Code no aplicativo do seu banco ou copie o código Pix Copia e Cola abaixo:
                      </p>
                      <div className="w-full flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={depositPayment.pixCopyPaste}
                          className="flex-1 px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#4A373B]"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-3.5 py-2 bg-white border border-[#DFD3C3] hover:border-[#5B1824] rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {copiedPix ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#2E6B3E]" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Pix</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={confirmingDeposit}
                        onClick={handleConfirmPixDeposit}
                        className="w-full py-3 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {confirmingDeposit
                          ? 'Confirmando pagamento e liberando produção...'
                          : 'Já Paguei o Pix de 50% — Confirmar e Iniciar Produção'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* CREDIT CARD PAYMENT FORM WITH BANK FEE BREAKDOWN */
                  <form onSubmit={handleConfirmCardDeposit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#DFD3C3] pb-3">
                      <div>
                        <p className="text-xs font-semibold text-[#5B1824]">
                          Cartão de Crédito (1ª Parcela — 50% + Taxa do Banco)
                        </p>
                        <p className="text-[11px] text-[#6E5A5F]">
                          A taxa cobrada pela operadora/banco é somada ao valor dos 50%
                        </p>
                      </div>
                      <span className="text-xl font-bold text-[#5B1824] font-mono-tabular">
                        {formatBRL(currentCardOption.totalWithFee)}
                      </span>
                    </div>

                    {/* Transparent Bank Fee Breakdown Box */}
                    <div className="p-3.5 rounded-lg bg-white border border-[#DFD3C3] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#4A373B] pb-1.5 border-b border-[#EFE7DA]">
                        <span>Instituição Recebedora:</span>
                        <span className="font-semibold text-[#231619]">
                          {activeBankName} ({activeHolderName})
                        </span>
                      </div>
                      <div className="flex justify-between text-[#4A373B]">
                        <span>Valor líquido dos 50% de Entrada:</span>
                        <span className="font-mono-tabular font-semibold">
                          {formatBRL(createdOrder.depositAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#8C4A27]">
                        <span>
                          Taxa cobrada pelo banco ({currentCardOption.feePercentage.toFixed(2).replace('.', ',')}%):
                        </span>
                        <span className="font-mono-tabular font-semibold">
                          + {formatBRL(currentCardOption.feeAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#231619] font-bold pt-1.5 border-t border-[#EFE7DA]">
                        <span>Total a pagar no Cartão ({currentCardOption.installments}x):</span>
                        <span className="font-mono-tabular text-[#5B1824]">
                          {currentCardOption.installments}x de {formatBRL(currentCardOption.installmentValue)} ({formatBRL(currentCardOption.totalWithFee)})
                        </span>
                      </div>
                    </div>

                    {activeCardLink && (
                      <a
                        href={activeCardLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Abrir Link Oficial do Banco / Maquininha ({activeBankName})</span>
                      </a>
                    )}

                    {cardError && (
                      <div className="p-2.5 rounded-lg bg-[#7A2434]/10 border border-[#7A2434] text-xs text-[#5B1824] font-medium">
                        {cardError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Parcelamento no Cartão (c/ taxa do banco)
                      </label>
                      <select
                        value={selectedInstallments}
                        onChange={(e) =>
                          setSelectedInstallments(parseInt(e.target.value, 10))
                        }
                        className="w-full px-3 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none focus:border-[#5B1824]"
                      >
                        {installmentOptions.map((opt) => (
                          <option key={opt.installments} value={opt.installments}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Número do Cartão de Crédito * ({detectCardBrand(cardNumber)})
                      </label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none focus:border-[#5B1824]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Nome Impresso no Cartão *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                        className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619] focus:outline-none focus:border-[#5B1824]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#231619] mb-1">
                          Validade (MM/AA) *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none focus:border-[#5B1824]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#231619] mb-1">
                          CVV (3 ou 4 dígitos) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          placeholder="123"
                          className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none focus:border-[#5B1824]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={confirmingDeposit}
                      className="w-full py-3 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {confirmingDeposit
                        ? 'Processando Cartão junto à Operadora...'
                        : `Pagar 50% no Cartão (${currentCardOption.installments}x de ${formatBRL(
                            currentCardOption.installmentValue
                          )})`}
                    </button>
                  </form>
                )}

                <div className="pt-3 border-t border-[#DFD3C3] flex items-center justify-between text-xs text-[#4A373B]">
                  <span>2ª Parcela (50% quando ficar pronta em 15 dias):</span>
                  <span className="font-mono-tabular font-semibold">
                    {formatBRL(createdOrder.remainingAmount)} (Pix ou Cartão)
                  </span>
                </div>
              </div>

              {/* WhatsApp Direct Order Transmission */}
              <div className="space-y-2.5">
                <a
                  href={toWhatsAppHref(
                    whatsappStore,
                    buildCustomerOrderMessage(createdOrder)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Pedido e Comprovante Direto no WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Primary CTA */}
        {step !== 'PAYMENT' && cart.length > 0 && (
          <div className="p-6 bg-[#EFE7DA] border-t border-[#DFD3C3] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4A373B]">
                <span>Valor Total da Encomenda:</span>
                <span className="font-mono-tabular font-medium">
                  {formatBRL(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-[#5B1824] font-semibold text-sm">
                <span>Entrada de 50% Hoje (Pix sem taxa):</span>
                <span className="font-mono-tabular">{formatBRL(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-[#6E5A5F]">
                <span>Ou 50% no Cartão de Crédito (1x c/ taxa do banco):</span>
                <span className="font-mono-tabular">
                  {formatBRL(installmentOptions[0].totalWithFee)}
                </span>
              </div>
              <div className="flex justify-between text-[#6E5A5F]">
                <span>Restante (50% quando ficar pronta — 15 dias):</span>
                <span className="font-mono-tabular">{formatBRL(remainingAmount)}</span>
              </div>
            </div>

            {step === 'CART' ? (
              <button
                type="button"
                onClick={() => setStep('CUSTOMER')}
                className="w-full py-3.5 px-6 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar para Dados & Entrega</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-customer-form"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Registrando Encomenda...'
                    : `Ir para Pagamento dos 50% (Pix ou Cartão)`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
