export function formatBRL(value: number): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeVal);
}

/**
 * Verifica se o preço já segue a padronização psicológica terminando em ,90
 */
export function isPsychological90Price(price: number): boolean {
  if (!Number.isFinite(price) || price <= 0) return false;
  const cents = Math.round((price - Math.floor(price)) * 100);
  return cents === 90;
}

/**
 * Gera sugestões de preço psicológico com final ,90 sem aplicar automaticamente:
 * - equivalent90: Ex: R$ 130,00 -> R$ 129,90 | R$ 150,00 -> R$ 149,90 | R$ 170,00 -> R$ 169,90
 * - preserveMargin90: Nunca reduz o valor cadastrado (Ex: R$ 130,00 -> R$ 139,90 | R$ 150,00 -> R$ 159,90)
 */
export function getPsychologicalPriceSuggestions(currentPrice: number): {
  already90: boolean;
  equivalent90: number;
  preserveMargin90: number;
} {
  const safePrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 129.9;
  if (isPsychological90Price(safePrice)) {
    return {
      already90: true,
      equivalent90: Math.round(safePrice * 100) / 100,
      preserveMargin90: Math.round(safePrice * 100) / 100,
    };
  }

  const intPart = Math.floor(safePrice);
  const equivalent90 =
    intPart % 10 === 0 && intPart >= 20
      ? intPart - 1 + 0.9
      : Math.max(9.9, intPart - 1 + 0.9);

  const preserveMargin90 =
    intPart % 10 === 0
      ? intPart + 9.9
      : intPart + 0.9 >= safePrice
      ? intPart + 0.9
      : intPart + 1.9;

  return {
    already90: false,
    equivalent90: Math.round(equivalent90 * 100) / 100,
    preserveMargin90: Math.round(preserveMargin90 * 100) / 100,
  };
}

export interface ProductFinancialMetrics {
  manufacturingCost: number;
  additionalExpenses: number;
  totalCost: number;
  salePrice: number;
  deposit50Value: number;
  grossProfit: number;
  profitMarginPercent: number;
  markupPercent: number;
  depositCoversCost: boolean;
  depositCostCoverageDiff: number;
  already90: boolean;
  suggestedEquivalent90: number;
  suggestedPreserveMargin90: number;
}

/**
 * Calcula automaticamente o custo total, lucro bruto (R$), margem de lucro (%)
 * e cobertura de custo pela entrada de 50% (produção sob encomenda).
 */
export function calculateProductFinancials(params: {
  salePrice: number;
  manufacturingCost?: number;
  additionalExpenses?: number;
}): ProductFinancialMetrics {
  const salePrice = Math.max(0, Number(params.salePrice) || 0);
  const manufacturingCost = Math.max(0, Number(params.manufacturingCost) || 0);
  const additionalExpenses = Math.max(0, Number(params.additionalExpenses) || 0);
  const totalCost = Math.round((manufacturingCost + additionalExpenses) * 100) / 100;

  const grossProfit = Math.round((salePrice - totalCost) * 100) / 100;
  const profitMarginPercent =
    salePrice > 0 ? Math.round((grossProfit / salePrice) * 10000) / 100 : 0;
  const markupPercent =
    totalCost > 0 ? Math.round((grossProfit / totalCost) * 10000) / 100 : 0;

  const deposit50Value = Math.round(salePrice * 0.5 * 100) / 100;
  const depositCoversCost = totalCost === 0 || deposit50Value >= totalCost;
  const depositCostCoverageDiff = Math.round((deposit50Value - totalCost) * 100) / 100;

  const psych = getPsychologicalPriceSuggestions(salePrice);

  return {
    manufacturingCost,
    additionalExpenses,
    totalCost,
    salePrice,
    deposit50Value,
    grossProfit,
    profitMarginPercent,
    markupPercent,
    depositCoversCost,
    depositCostCoverageDiff,
    already90: psych.already90,
    suggestedEquivalent90: psych.equivalent90,
    suggestedPreserveMargin90: psych.preserveMargin90,
  };
}

/**
 * Sugere o preço de venda (com opção padronizada em ,90) a partir do custo total
 * e da margem de lucro percentual desejada, sem alterar custos.
 */
export function suggestSalePriceFromMargin(
  totalCost: number,
  desiredMarginPercent: number,
  roundTo90 = true
): number {
  const safeCost = Math.max(0, Number(totalCost) || 0);
  const clampedMargin = Math.min(95, Math.max(0, Number(desiredMarginPercent) || 0));
  if (safeCost <= 0) return 0;
  const rawPrice = safeCost / (1 - clampedMargin / 100);
  if (!roundTo90) {
    return Math.round(rawPrice * 100) / 100;
  }
  const baseInt = Math.floor(rawPrice);
  const candidate = baseInt + 0.9;
  const final90 = candidate >= rawPrice ? candidate : baseInt + 1 + 0.9;
  return Math.round(final90 * 100) / 100;
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (!clean) return 'Cartão';
  if (/^4/.test(clean)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
  if (/^(4011|4312|4389|5041|5067|5090|6277|6362|6363)/.test(clean)) return 'Elo';
  if (/^3[47]/.test(clean)) return 'Amex';
  return 'Cartão';
}

export interface CardInstallmentOption {
  installments: number;
  feePercentage: number;
  feeAmount: number;
  totalWithFee: number;
  installmentValue: number;
  label: string;
}

/**
 * Calcula o repasse da taxa do banco/operadora (Mercado Pago) para que a loja
 * receba integralmente os 50% líquidos e a cliente possa escolher pagar no cartão.
 */
export function calculateCardInstallments(
  netBaseAmount: number,
  baseFee1x = 4.99
): CardInstallmentOption[] {
  // Taxas médias de operadora/banco por número de parcelas (repasse ao comprador)
  const additionalPerInstallment = [0, 2.6, 4.1, 5.6, 7.1, 8.6];

  return additionalPerInstallment.map((extra, idx) => {
    const installments = idx + 1;
    const feePercentage = Math.round((baseFee1x + extra) * 100) / 100;
    // Repasse exato para que o líquido seja netBaseAmount: Total = Base / (1 - taxa)
    const totalWithFee =
      Math.round((netBaseAmount / (1 - feePercentage / 100)) * 100) / 100;
    const feeAmount = Math.round((totalWithFee - netBaseAmount) * 100) / 100;
    const installmentValue =
      Math.round((totalWithFee / installments) * 100) / 100;

    return {
      installments,
      feePercentage,
      feeAmount,
      totalWithFee,
      installmentValue,
      label: `${installments}x de ${formatBRL(installmentValue)} (Total: ${formatBRL(
        totalWithFee
      )} · Taxa banco ${feePercentage.toFixed(2).replace('.', ',')}%)`,
    };
  });
}

export interface ShippingQuote {
  region: string;
  city: string;
  state: string;
  streetHint: string;
  standardPrice: number;
  standardDays: string;
  expressPrice: number;
  expressDays: string;
}

export function lookupCEP(cep: string): ShippingQuote | null {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const firstDigit = digits[0];
  switch (firstDigit) {
    case '0':
    case '1':
      return {
        region: 'Sudeste (SP)',
        city: 'São Paulo',
        state: 'SP',
        streetHint: 'Jardim Paulista',
        standardPrice: 18.9,
        standardDays: '2 a 3 dias úteis',
        expressPrice: 32.0,
        expressDays: 'No próximo dia útil (Sedex)',
      };
    case '2':
      return {
        region: 'Sudeste (RJ/ES)',
        city: 'Rio de Janeiro',
        state: 'RJ',
        streetHint: 'Leblon',
        standardPrice: 22.9,
        standardDays: '3 a 4 dias úteis',
        expressPrice: 36.0,
        expressDays: '1 a 2 dias úteis (Sedex)',
      };
    case '3':
      return {
        region: 'Sudeste (MG)',
        city: 'Belo Horizonte',
        state: 'MG',
        streetHint: 'Savassi',
        standardPrice: 24.5,
        standardDays: '3 a 4 dias úteis',
        expressPrice: 38.0,
        expressDays: '2 dias úteis (Sedex)',
      };
    case '4':
    case '5':
      return {
        region: 'Nordeste',
        city: 'Salvador',
        state: 'BA',
        streetHint: 'Caminho das Árvores',
        standardPrice: 31.0,
        standardDays: '5 a 6 dias úteis',
        expressPrice: 49.0,
        expressDays: '2 a 3 dias úteis (Aéreo)',
      };
    case '7':
      return {
        region: 'Centro-Oeste',
        city: 'Goiânia',
        state: 'GO',
        streetHint: 'Setor Bueno',
        standardPrice: 19.9,
        standardDays: '1 a 3 dias úteis',
        expressPrice: 29.0,
        expressDays: 'Entrega Rápida / Sedex',
      };
    case '8':
    case '9':
    default:
      return {
        region: 'Sul',
        city: 'Curitiba',
        state: 'PR',
        streetHint: 'Batel',
        standardPrice: 25.0,
        standardDays: '3 a 5 dias úteis',
        expressPrice: 39.0,
        expressDays: '2 dias úteis (Sedex)',
      };
  }
}
