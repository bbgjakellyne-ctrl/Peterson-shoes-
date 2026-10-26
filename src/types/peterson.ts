export interface ColorOption {
  name: string;
  hex: string;
  image?: string;
  isCustom?: boolean;
}

export interface BespokeProduct {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  category:
    | 'Flatforms & Papetes'
    | 'Anabelas & Plataformas'
    | 'Rasteiras & Gladiadoras'
    | 'Tamancos & Saltos'
    | string;
  price: number;
  image: string;
  gallery?: string[];
  instagramPostUrl?: string;
  heelOptions: string[];
  strapFinishes: string[];
  colors: ColorOption[];
  availableSizes: number[];
  productionDays: number;
  featured: boolean;
  active: boolean;
  description: string;
  craftDetails: string[];
  createdAt?: string;
}

export interface BespokeCustomization {
  heelOption: string;
  strapFinish: string;
  footWidth: 'Padrão' | 'Pé Fino (Mais Justa)' | 'Pé Largo (Conforto Extra)';
  insoleEngraving: string;
  customNotes: string;
  customColorDescription?: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  size: number;
  colorName: string;
  colorHex: string;
  customization: BespokeCustomization;
}

export type PaymentStatus =
  | 'AGUARDANDO_ENTRADA_50'
  | 'ENTRADA_50_PAGA'
  | 'AGUARDANDO_FINAL_50'
  | 'QUITADO_100';

export type ProductionStatus =
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CORTE_MODELAGEM'
  | 'MONTAGEM_ARTESANAL'
  | 'ACABAMENTO_QUALIDADE'
  | 'PRONTA_PARA_ENTREGA'
  | 'ENVIADA_ENTREGUE';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderCode: string;
  installmentType: 'ENTRADA_50' | 'FINAL_50';
  method: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO';
  baseAmount?: number;
  feeAmount?: number;
  installments?: number;
  cardBrand?: string;
  cardLast4?: string;
  amount: number;
  status: 'PENDENTE' | 'APROVADO';
  pixCopyPaste: string;
  mpReferenceId: string;
  sandboxMode: boolean;
  paidAt: string | null;
  createdAt: string;
}

export interface BespokeOrder {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  customerCpf: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  depositAmount: number; // 50% entrada base
  remainingAmount: number; // 50% conclusão base
  preferredPaymentMethod?: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO';
  paymentStatus: PaymentStatus;
  productionStatus: ProductionStatus;
  estimatedDeliveryDate: string; // +15 dias
  productionDays: number;
  factoryNotes: string;
  trackingCode: string;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentRecord[];
}

export interface StoreSettings {
  storeName: string;
  instagramUrl: string;
  whatsappStore: string;
  whatsappFactory: string;
  productionDays: number;
  depositPercentage: number;
  creditCardFeePercentage?: number;
  mercadoPagoLiveEnabled: boolean;
  pixKey: string;
  pixKeyType?: 'CELULAR' | 'CNPJ' | 'CPF' | 'EMAIL' | 'ALEATORIA';
  bankName?: string;
  bankHolderName?: string;
  bankHolderDoc?: string;
  bankAgency?: string;
  bankAccount?: string;
  cardPaymentLink?: string;
  supabaseConfigured?: boolean;
  mercadoPagoTokenConfigured?: boolean;
}
