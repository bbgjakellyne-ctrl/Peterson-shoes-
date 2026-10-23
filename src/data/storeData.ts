import {
  BespokeOrder,
  BespokeProduct,
  ColorOption,
  CustomerRecord,
  OrderItem,
  PaymentRecord,
  PaymentStatus,
  ProductionStatus,
  StoreSettings,
} from '../types/peterson';

export interface StoreDatabaseSchema {
  products: BespokeProduct[];
  customers: CustomerRecord[];
  orders: BespokeOrder[];
  payments: PaymentRecord[];
  settings: StoreSettings;
}

export const STANDARD_SIZES = [34, 35, 36, 37, 38, 39];

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Compute standard CRC16-CCITT (0xFFFF) for valid Brazilian Pix EMVCo BRCode payload
export function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

export function generateMercadoPagoPixPayload(
  amount: number,
  reference: string,
  pixKey: string
): string {
  const cleanKey = pixKey.trim() || '62984998265';
  const normalizedKey =
    /^\d{10,11}$/.test(cleanKey) && !cleanKey.startsWith('+55')
      ? `+55${cleanKey}`
      : cleanKey;

  const gui = emvField('00', 'br.gov.bcb.pix');
  const keyField = emvField('01', normalizedKey);
  const merchantAccountInfo = emvField('26', `${gui}${keyField}`);
  const formattedAmount = amount.toFixed(2);
  const txId =
    reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'PETERSONSHOES';
  const additionalData = emvField('62', emvField('05', txId));

  const bodyWithoutCrc =
    '000201' +
    merchantAccountInfo +
    '52040000' +
    '5303986' +
    emvField('54', formattedAmount) +
    '5802BR' +
    emvField('59', 'PETERSON SHOES') +
    emvField('60', 'GOIANIA') +
    additionalData +
    '6304';

  const crc = computeCRC16(bodyWithoutCrc);
  return `${bodyWithoutCrc}${crc}`;
}

export function buildStandardColors(
  defaultColorName:
    | 'Preto'
    | 'Branco'
    | 'Marsala'
    | 'Nude'
    | 'Dourado'
    | 'Prata'
    | 'Vermelho'
    | 'Rosa',
  defaultImage: string,
  photoByColor: Partial<
    Record<
      | 'Preto'
      | 'Branco'
      | 'Marsala'
      | 'Nude'
      | 'Dourado'
      | 'Prata'
      | 'Vermelho'
      | 'Rosa',
      string
    >
  > = {}
): ColorOption[] {
  const basePalette: {
    name:
      | 'Preto'
      | 'Branco'
      | 'Marsala'
      | 'Nude'
      | 'Dourado'
      | 'Prata'
      | 'Vermelho'
      | 'Rosa';
    hex: string;
  }[] = [
    { name: 'Preto', hex: '#1B191A' },
    { name: 'Branco', hex: '#F7F7F5' },
    { name: 'Marsala', hex: '#631421' },
    { name: 'Nude', hex: '#DFC1B4' },
    { name: 'Dourado', hex: '#D4AF37' },
    { name: 'Prata', hex: '#C4C9CE' },
    { name: 'Vermelho', hex: '#B31B2C' },
    { name: 'Rosa', hex: '#E07A9B' },
  ];

  const sortedPalette = [
    ...basePalette.filter((c) => c.name === defaultColorName),
    ...basePalette.filter((c) => c.name !== defaultColorName),
  ];

  const mapped: ColorOption[] = sortedPalette.map((c) => ({
    name: c.name,
    hex: c.hex,
    image: photoByColor[c.name] || defaultImage,
  }));

  mapped.push({
    name: 'Outra Cor',
    hex: '#8E7970',
    image: defaultImage,
    isCustom: true,
  });

  return mapped;
}

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Peterson Shoes',
  instagramUrl: 'https://www.instagram.com/petersonshoes_/',
  whatsappStore: '5562984998265',
  whatsappFactory: '5562984998265',
  productionDays: 15,
  depositPercentage: 50,
  creditCardFeePercentage: 4.99,
  mercadoPagoLiveEnabled: false,
  pixKey: '62984998265',
};

export const INITIAL_PRODUCTS: BespokeProduct[] = [
  // 1. POST 1 (C454LXbOzrn) — Papete Flatform Pirâmides & Fivela
  {
    id: 'prod-ig-01-papete-piramides',
    sku: 'PTS-IG-01',
    name: 'Papete Flatform Pirâmides & Fivela',
    subtitle:
      'Bico Quadrado Anatômico com Pirâmides Espelhadas & Pulseira no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 229.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Cromadas & Fivela Prata',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      {
        Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
        Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
        Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Modelo oficial @petersonshoes_ de fabricação própria em Goiânia - GO! Nossa Papete Flatform Pirâmides combina palmilha anatômica macia de bico quadrado, tiras de dedo com aplicação de pirâmides espelhadas e fivela regulável no tornozelo.',
    craftDetails: [
      'Fabricação própria @petersonshoes_ sob encomenda em até 15 dias (Numeração 34 ao 39)',
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor à sua escolha',
      'Pagamento de 50% de entrada (Pix ou Cartão c/ taxa do banco) e 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 2. POST 8 Parte A (C4Tc5OnpB_L Slides 1 a 5) — Anabela Plataforma Pirâmides & Fivela
  {
    id: 'prod-ig-02-anabela-piramides-fivela',
    sku: 'PTS-IG-02',
    name: 'Anabela Plataforma Pirâmides & Fivela',
    subtitle:
      'Plataforma Alta Bico Quadrado com Tiras em Pirâmides & Fechamento por Fivela',
    category: 'Anabelas & Plataformas',
    price: 279.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Prata & Fivela Cromada',
    ],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      {
        Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
        Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Clássica e imponente! Nossa Anabela Plataforma de bico quadrado com tachas piramidais e tira de fivela no tornozelo é produzida sob encomenda na sua cor favorita e numeração do 34 ao 39.',
    craftDetails: [
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada escrita por você',
      'Meia pata frontal anatômica que proporciona estabilidade e leveza',
      'Confeccionada sob medida no seu número (34 ao 39 BR) em até 15 dias',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 3. POST 8 Parte B (C4Tc5OnpB_L Slides 6 a 8) — Anabela Plataforma Pirâmides Gladiadora Amarração
  {
    id: 'prod-ig-03-anabela-piramides-amarracao',
    sku: 'PTS-IG-03',
    name: 'Anabela Plataforma Pirâmides Gladiadora',
    subtitle:
      'Plataforma Alta Bico Quadrado com Pirâmides & Amarração Lace-Up na Perna',
    category: 'Anabelas & Plataformas',
    price: 289.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Ponteiras Ouro',
      'Pirâmides Prata & Ponteiras Prata',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      {
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
        Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Versão Gladiadora com amarração na perna da nossa Anabela Plataforma @petersonshoes_! Tiras de dedo cravejadas em pirâmides metalizadas e cordões macios que permitem diversas formas de amarração no tornozelo.',
    craftDetails: [
      'Escolha entre Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Cordões macios de alta resistência com ajuste perfeito na perna',
      'Produção própria sob encomenda em 15 dias (50% no Pix ou Cartão de Crédito)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 4. POST 9 (C4Tc1qCpAdX Slides 1 a 3) — Papete Flatform Tratorada Amarração Nó & Strass
  {
    id: 'prod-ig-04-papete-tratorada-strass',
    sku: 'PTS-IG-04',
    name: 'Papete Flatform Tratorada Strass & Amarração',
    subtitle:
      'Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarração Nó Frontal',
    category: 'Flatforms & Papetes',
    price: 249.9,
    image: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
    gallery: [
      '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc1qCpAdX/',
    heelOptions: ['Flatform Tratorada 4cm', 'Flatform Anatômica 3cm'],
    strapFinishes: ['Strass Cristal & Vira Cravejada', 'Strass Grafite Onix'],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      {
        Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
        Nude: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
        Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
        Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Brilho intenso e design super moderno do Instagram @petersonshoes_! Papete Flatform com solado tratorado contornado por fileira de strass, duas tiras frontais cravejadas e amarração com nó central sobre o peito do pé.',
    craftDetails: [
      'Disponível em todas as cores padrão ou cor personalizada sob encomenda (34 ao 39 BR)',
      'Vira da palmilha inteiramente contornada em manta de strass',
      'Solado tratorado leve e antiderrapante feito sob encomenda',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Dourada c/ Esferas
  {
    id: 'prod-ig-05-anabela-trancada-gold',
    sku: 'PTS-IG-05',
    name: 'Anabela Plataforma Trançada Esferas',
    subtitle:
      'Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela',
    category: 'Anabelas & Plataformas',
    price: 289.9,
    image: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
    gallery: [
      '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
      '/instagram/feed_5_C4539VxO5om_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4539VxO5om/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: ['Esferas & Fivela Dourada', 'Esferas & Fivela Prateada'],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
      {
        Dourado: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Destaque absoluto do Instagram @petersonshoes_! Sandália Anabela Plataforma inteiramente revestida em trama artesanal, com tira frontal de dedo adornada por esferas e tiras cruzadas no tornozelo.',
    craftDetails: [
      'Revestimento completo da plataforma em trançado artesanal feito à mão',
      'Meia pata frontal que reduz a inclinação do pé e garante conforto prolongado',
      'Confeccionada sob encomenda (34 ao 39 BR) com 50% de entrada no Pix ou Cartão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 6. POST 10 (C4Tcs31JPdl Slides 1 a 2) — Flatform Gladiadora Tiras Finas Strass & Vira Cravejada
  {
    id: 'prod-ig-06-flatform-amarracao-strass',
    sku: 'PTS-IG-06',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass',
    subtitle:
      'Flatform Anatômica com Vira de Strass, Tiras Finas Brilhantes & Amarração',
    category: 'Flatforms & Papetes',
    price: 239.9,
    image: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    gallery: [
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tcs31JPdl/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Dourado & Vira Brilhante',
      'Strass Prata Cristal',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      {
        Dourado: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
        Branco: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
        Prata: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Delicadeza e sofisticação em cada detalhe! Nossa Flatform Gladiadora @petersonshoes_ possui tiras finas cruzadas recobertas por strass, borda da palmilha cravejada e amarração ajustável no tornozelo.',
    craftDetails: [
      'Produzida em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Palmilha anatômica acolchoada com filete lateral de strass',
      'Fabricação própria sob encomenda em até 15 dias (Numeração 34 ao 39)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 7. POST 11 (C4TcpFaJ9ll Slides 1 a 2) — Papete Flatform Metalizada Tiras Transpassadas Strass & Fivela
  {
    id: 'prod-ig-07-papete-metalizada-transpassada',
    sku: 'PTS-IG-07',
    name: 'Papete Flatform Espelhada Tiras Strass',
    subtitle:
      'Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 234.9,
    image: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    gallery: [
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcpFaJ9ll/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Fivela Prata',
      'Strass Champagne & Fivela Ouro',
    ],
    colors: buildStandardColors(
      'Prata',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      {
        Prata: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
        Dourado: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Para quem ama brilho com máximo conforto! Papete Flatform @petersonshoes_ com tiras curvas cravejadas em strass e fechamento seguro por fivela no tornozelo.',
    craftDetails: [
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada',
      'Bico quadrado anatômico que acomoda os dedos com perfeição (34 ao 39 BR)',
      'Encomenda confirmada com 50% de entrada via Pix ou Cartão de Crédito',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 8. POST 7 (C4ayCqZteae) — Papete dos Sonhos Metalizada Tiras de Dedo em Strass
  {
    id: 'prod-ig-08-papete-dos-sonhos-strass',
    sku: 'PTS-IG-08',
    name: 'Papete dos Sonhos Strass Duo',
    subtitle:
      'Flatform Bico Quadrado com Tiras de Dedo e Peito do Pé Cravejadas em Strass',
    category: 'Flatforms & Papetes',
    price: 219.9,
    image: '/instagram/feed_7_C4ayCqZteae_main.jpg',
    gallery: [
      '/instagram/feed_7_C4ayCqZteae_main.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4ayCqZteae/',
    heelOptions: ['Flatform Anatômica 3cm', 'Flatform Baixa 2cm'],
    strapFinishes: ['Manta de Strass Dourado', 'Manta de Strass Prata Cristal'],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_7_C4ayCqZteae_main.jpg',
      {
        Dourado: '/instagram/feed_7_C4ayCqZteae_main.jpg',
        Prata: '/instagram/feed_7_C4ayCqZteae_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      '"A papete dos sonhos!" Publicada em nosso Instagram @petersonshoes_, combina calce prático estilo slide com anel de dedo e três tiras superiores inteiramente cravejadas em strass de alto brilho.',
    craftDetails: [
      'Prática de calçar e super leve para o dia a dia ou eventos',
      'Disponível nas cores padrão ou cor personalizada (Numeração 34 ao 39 BR)',
      'Produzida sob encomenda pela Peterson Shoes em até 15 dias',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 9. POST 12 (C4TcmhYpO8_) — Chinelo Flatform Nuvem Tira de Dedo em Manta de Strass com Nó
  {
    id: 'prod-ig-09-chinelo-flatform-no-strass',
    sku: 'PTS-IG-09',
    name: 'Flatform Slide Tira de Dedo Nó em Strass',
    subtitle:
      'Solado Anatômico Macio com Tiras Largura Conforto Revestidas em Manta de Strass',
    category: 'Flatforms & Papetes',
    price: 179.9,
    image: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
    gallery: ['/instagram/feed_12_C4TcmhYpO8__main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcmhYpO8_/',
    heelOptions: ['Solado Anatômico 3,5cm', 'Solado Conforto 2,5cm'],
    strapFinishes: [
      'Manta de Strass Cristal c/ Nó Central',
      'Manta de Strass Dourado',
    ],
    colors: buildStandardColors(
      'Nude',
      '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      {
        Nude: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
        Preto: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
        Branco: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Conforto absoluto nos pés com o glamour da manta de strass! Nosso Chinelo Flatform Slide com nó central do Instagram @petersonshoes_ é confeccionado em todas as cores padrão ou sob encomenda na cor que você desejar.',
    craftDetails: [
      'Palmilha anatômica tipo nuvem de altíssima maciez (34 ao 39 BR)',
      'Tiras revestidas em manta de strass com forro interno suave',
      'Ideal para varejo ou pedidos em atacado (a partir de 6 pares)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 10. POST 2 (C454HJKO2oG) — Anabela Espadrille Branca Pirâmides Prateadas & Corda de Juta
  {
    id: 'prod-ig-10-anabela-espadrille-branca',
    sku: 'PTS-IG-10',
    name: 'Anabela Espadrille Pirâmides & Juta',
    subtitle: 'Anabela com Tachas Piramidais Espelhadas & Corda de Juta Natural',
    category: 'Anabelas & Plataformas',
    price: 269.9,
    image: '/instagram/feed_2_C454HJKO2oG_main.jpg',
    gallery: ['/instagram/feed_2_C454HJKO2oG_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C454HJKO2oG/',
    heelOptions: ['Anabela 9cm com Meia Pata', 'Anabela 7cm Conforto'],
    strapFinishes: ['Pirâmides Prateadas Cromadas', 'Pirâmides Douradas'],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_2_C454HJKO2oG_main.jpg',
      {
        Branco: '/instagram/feed_2_C454HJKO2oG_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Modelo oficial @petersonshoes_ pensado para produções sofisticadas! Sandália Anabela estruturada em napa macia, com tira frontal e tornozeleira cravejadas de pirâmides e vira contornada em corda de juta.',
    craftDetails: [
      'Tira frontal e pulseira do tornozelo com aplicação firme de pirâmides espelhadas',
      'Base contornada em juta natural trançada e tachas metálicas',
      'Feita sob medida no seu número (34 ao 39 BR) em até 15 dias',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 11. POST 4 (C454A4GujcN Slides 1 a 2) — Rasteira Gladiadora Dupla Strass Cristal c/ Amarração
  {
    id: 'prod-ig-11-rasteira-gladiadora-strass',
    sku: 'PTS-IG-11',
    name: 'Rasteira Gladiadora Strass Cristal',
    subtitle: 'Tiras Duplas em Manta de Strass & Amarração Delicada na Perna',
    category: 'Rasteiras & Gladiadoras',
    price: 199.9,
    image: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
    gallery: [
      '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
      '/instagram/feed_4_C454A4GujcN_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454A4GujcN/',
    heelOptions: ['Rasteira Plana Conforto 1,2cm', 'Salto Baixo 2cm'],
    strapFinishes: ['Strass Cristal Prata', 'Strass Dourado Champagne'],
    colors: buildStandardColors(
      'Prata',
      '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
      {
        Prata: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Sucesso absoluto no Instagram @petersonshoes_ ("Quando amamos o que fazemos")! Rasteira Gladiadora com duas tiras frontais revestidas em manta de strass cristal de alto brilho e cordões macios para amarração.',
    craftDetails: [
      'Manta de strass cristal com fixação reforçada e forro interno macio',
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Fabricação própria sob encomenda em até 15 dias (34 ao 39 BR)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Tamanco Plataforma Trançado Nó
  {
    id: 'prod-ig-12-tamanco-plataforma-no',
    sku: 'PTS-IG-12',
    name: 'Tamanco Plataforma Trançado c/ Nó',
    subtitle:
      'Plataforma Alta Revestida em Trama Artesanal & Tira Larga com Nó Central',
    category: 'Tamancos & Saltos',
    price: 259.9,
    image: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
    gallery: [
      '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C45360nuL6q/',
    heelOptions: ['Plataforma Alta 8,5cm', 'Plataforma Média 6,5cm'],
    strapFinishes: ['Napa Macia Sem Metais', 'Detalhe Dourado na Palmilha'],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      {
        Branco: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
        Nude: '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Conforto, leveza e altura em um design autoral do nosso Instagram @petersonshoes_! Tamanco Plataforma com base inteiramente revestida em trama trançada e gáspea em napa ultra macia com nó frontal anatômico.',
    craftDetails: [
      'Plataforma super leve com estabilidade total ao caminhar (34 ao 39 BR)',
      'Tira larga forrada em espuma macia para zero atrito nos dedos',
      'Produzido sob encomenda com 50% de entrada via Pix ou Cartão de Crédito',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 13. POST 3 (C454E0zuuFv Slides 1 a 2) — Rasteira Esferas & Medalhão Metalizada
  {
    id: 'prod-ig-13-rasteira-medalhao-esferas',
    sku: 'PTS-IG-13',
    name: 'Rasteira Esferas & Medalhão Metalizada',
    subtitle:
      'Rasteira de Dedo com Tachas Esféricas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 189.9,
    image: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    gallery: [
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454E0zuuFv/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Esferas & Medalhões Dourados',
      'Esferas & Medalhões Prateados',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      {
        Dourado: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
        Prata: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Escolha a sua favorita do nosso Instagram @petersonshoes_! Rasteira de dedo confeccionada com aplicação contínua de esferas e medalhões trabalhados e tira dupla que valoriza o tornozelo.',
    craftDetails: [
      'Disponível em todas as cores padrão ou outra cor personalizada escrita por você',
      'Aplicação de esferas e medalhões com rebites internos protegidos',
      'Bico levemente quadrado moderno com palmilha macia (34 ao 39 BR)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 14. POST 1 Slide 4 em Destaque — Papete Flatform Pirâmides Edição Black & Gold
  {
    id: 'prod-ig-14-papete-piramides-preta',
    sku: 'PTS-IG-14',
    name: 'Papete Flatform Pirâmides Black & Gold',
    subtitle:
      'Edição Preta com Pirâmides Douradas Espelhadas & Solado Anatômico',
    category: 'Flatforms & Papetes',
    price: 229.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Dourada',
      'Pirâmides Prata & Fivela Prata',
    ],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      {
        Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
        Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
        Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Contraste marcante entre o preto intenso e o brilho das pirâmides douradas! Esta versão da nossa Papete Flatform @petersonshoes_ traz palmilha anatômica contornada, tira de dedo com nó frontal e pulseira regulável.',
    craftDetails: [
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Metais piramidais dourados com banho resistente à oxidação',
      'Feita sob encomenda em até 15 dias (Numeração 34 ao 39 BR)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 15. POST 8 Slide 2 em Destaque — Anabela Plataforma Pirâmides Edição Nude & Ouro
  {
    id: 'prod-ig-15-anabela-piramides-nude',
    sku: 'PTS-IG-15',
    name: 'Anabela Plataforma Pirâmides Nude & Ouro',
    subtitle:
      'Edição Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado',
    category: 'Anabelas & Plataformas',
    price: 279.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Fivela no Tornozelo (Foto 1)',
      'Amarração Gladiadora (Foto 2)',
    ],
    colors: buildStandardColors(
      'Nude',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      {
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
        Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
        Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Elegância suave que alonga a silhueta! Nossa Anabela Plataforma Pirâmides pode ser encomendada tanto na versão com Fivela clássica no tornozelo quanto na versão Gladiadora de Amarração, do 34 ao 39.',
    craftDetails: [
      'Escolha entre fechamento com Fivela ou Amarração Gladiadora',
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada',
      'Pagamento facilitado: 50% de entrada (Pix ou Cartão c/ taxa) e 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },
];

export function createInitialStoreDatabase(): StoreDatabaseSchema {
  const order1Date = new Date(Date.now() - 6 * 86400000).toISOString();
  const order1Est = addDaysISO(9);
  const order2Date = new Date(Date.now() - 14 * 86400000).toISOString();
  const order2Est = addDaysISO(1);

  const settings: StoreSettings = { ...INITIAL_SETTINGS };

  const customers: CustomerRecord[] = [
    {
      id: 'cust-1',
      name: 'Carolina Mendonça',
      email: 'carolina.mendonca@email.com.br',
      whatsapp: '(62) 99412-8831',
      cpf: '348.912.408-22',
      cep: '74150-040',
      street: 'Av. T-63',
      number: '1420',
      complement: 'Apto 82',
      neighborhood: 'Setor Bueno',
      city: 'Goiânia',
      state: 'GO',
      totalOrders: 1,
      totalSpent: 229.9,
      createdAt: order1Date,
    },
    {
      id: 'cust-2',
      name: 'Juliana Vasconcelos',
      email: 'juliana.vasc@email.com.br',
      whatsapp: '(62) 98731-5509',
      cpf: '129.845.307-10',
      cep: '74810-100',
      street: 'Rua 1136',
      number: '615',
      complement: 'Casa 2',
      neighborhood: 'Setor Marista',
      city: 'Goiânia',
      state: 'GO',
      totalOrders: 1,
      totalSpent: 279.9,
      createdAt: order2Date,
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay-1a',
      orderId: 'ord-1001',
      orderCode: 'PTS-2026-101',
      installmentType: 'ENTRADA_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 114.95,
      feeAmount: 0,
      installments: 1,
      amount: 114.95,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(
        114.95,
        'PTS2026101E',
        settings.pixKey
      ),
      mpReferenceId: 'MP-PIX-9841201',
      sandboxMode: true,
      paidAt: order1Date,
      createdAt: order1Date,
    },
    {
      id: 'pay-1b',
      orderId: 'ord-1001',
      orderCode: 'PTS-2026-101',
      installmentType: 'FINAL_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 114.95,
      feeAmount: 0,
      installments: 1,
      amount: 114.95,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(
        114.95,
        'PTS2026101F',
        settings.pixKey
      ),
      mpReferenceId: 'MP-PIX-9841202',
      sandboxMode: true,
      paidAt: null,
      createdAt: order1Date,
    },
    {
      id: 'pay-2a',
      orderId: 'ord-1002',
      orderCode: 'PTS-2026-102',
      installmentType: 'ENTRADA_50',
      method: 'CARTAO_MERCADO_PAGO',
      baseAmount: 139.95,
      feeAmount: 7.35,
      installments: 2,
      cardBrand: 'Mastercard',
      cardLast4: '4829',
      amount: 147.3,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(
        139.95,
        'PTS2026102E',
        settings.pixKey
      ),
      mpReferenceId: 'MP-CARD-9840911',
      sandboxMode: true,
      paidAt: order2Date,
      createdAt: order2Date,
    },
    {
      id: 'pay-2b',
      orderId: 'ord-1002',
      orderCode: 'PTS-2026-102',
      installmentType: 'FINAL_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 139.95,
      feeAmount: 0,
      installments: 1,
      amount: 139.95,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(
        139.95,
        'PTS2026102F',
        settings.pixKey
      ),
      mpReferenceId: 'MP-PIX-9840912',
      sandboxMode: true,
      paidAt: null,
      createdAt: order2Date,
    },
  ];

  const orders: BespokeOrder[] = [
    {
      id: 'ord-1001',
      orderCode: 'PTS-2026-101',
      customerId: 'cust-1',
      customerName: 'Carolina Mendonça',
      customerWhatsapp: '(62) 99412-8831',
      customerEmail: 'carolina.mendonca@email.com.br',
      customerCpf: '348.912.408-22',
      shippingAddress:
        'Av. T-63, 1420, Apto 82 - Setor Bueno, Goiânia/GO - CEP 74150-040',
      items: [
        {
          productId: 'prod-ig-01-papete-piramides',
          sku: 'PTS-IG-01',
          name: 'Papete Flatform Pirâmides & Fivela',
          image: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
          unitPrice: 229.9,
          quantity: 1,
          size: 37,
          colorName: 'Dourado',
          colorHex: '#D4AF37',
          customization: {
            heelOption: 'Flatform Anatômica 3,5cm',
            strapFinish: 'Pirâmides Douradas & Fivela Ouro',
            footWidth: 'Padrão',
            insoleEngraving: 'C.M.',
            customNotes: 'Favor deixar a tira do tornozelo com 1 furo extra.',
          },
        },
      ],
      totalAmount: 229.9,
      depositAmount: 114.95,
      remainingAmount: 114.95,
      paymentStatus: 'ENTRADA_50_PAGA',
      productionStatus: 'MONTAGEM_ARTESANAL',
      estimatedDeliveryDate: order1Est,
      productionDays: 15,
      factoryNotes:
        'Material dourado metalizado separado. Montagem da flatform com pirâmides em andamento.',
      trackingCode: '',
      createdAt: order1Date,
      updatedAt: order1Date,
    },
    {
      id: 'ord-1002',
      orderCode: 'PTS-2026-102',
      customerId: 'cust-2',
      customerName: 'Juliana Vasconcelos',
      customerWhatsapp: '(62) 98731-5509',
      customerEmail: 'juliana.vasc@email.com.br',
      customerCpf: '129.845.307-10',
      shippingAddress:
        'Rua 1136, 615, Casa 2 - Setor Marista, Goiânia/GO - CEP 74810-100',
      items: [
        {
          productId: 'prod-ig-02-anabela-piramides-fivela',
          sku: 'PTS-IG-02',
          name: 'Anabela Plataforma Pirâmides & Fivela',
          image: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
          unitPrice: 279.9,
          quantity: 1,
          size: 36,
          colorName: 'Preto',
          colorHex: '#1B191A',
          customization: {
            heelOption: 'Anabela Alta 9,5cm (Meia Pata 3,5cm)',
            strapFinish: 'Pirâmides Douradas & Fivela Ouro',
            footWidth: 'Pé Fino (Mais Justa)',
            insoleEngraving: 'J.V.',
            customNotes: 'Encomenda para evento no final do mês.',
          },
        },
      ],
      totalAmount: 279.9,
      depositAmount: 139.95,
      remainingAmount: 139.95,
      paymentStatus: 'AGUARDANDO_FINAL_50',
      productionStatus: 'PRONTA_PARA_ENTREGA',
      estimatedDeliveryDate: order2Est,
      productionDays: 15,
      factoryNotes:
        'Sandália Anabela Pirâmides finalizada e revisada! Aguardando pagamento dos 50% finais da cliente (Pix ou Cartão).',
      trackingCode: '',
      createdAt: order2Date,
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    products: INITIAL_PRODUCTS,
    customers,
    orders,
    payments,
    settings,
  };
}

const LOCAL_STORAGE_KEY = 'peterson_shoes_store_v3';

export function getBrowserStoreDb(): StoreDatabaseSchema {
  if (typeof window === 'undefined') {
    return createInitialStoreDatabase();
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialStoreDatabase();
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as StoreDatabaseSchema;
    if (!parsed.products || parsed.products.length === 0) {
      const initial = createInitialStoreDatabase();
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return createInitialStoreDatabase();
  }
}

export function saveBrowserStoreDb(db: StoreDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

export function createBrowserBespokeOrder(params: {
  customerName: string;
  customerEmail?: string;
  customerWhatsapp: string;
  customerCpf?: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  items: OrderItem[];
}): {
  order: BespokeOrder;
  depositPayment: PaymentRecord;
  finalPayment: PaymentRecord;
} {
  const db = getBrowserStoreDb();
  const totalAmount = params.items.reduce(
    (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
    0
  );
  const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
  const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;

  let customer = db.customers.find(
    (c) =>
      (params.customerCpf &&
        c.cpf.replace(/\D/g, '') ===
          String(params.customerCpf).replace(/\D/g, '')) ||
      c.whatsapp.replace(/\D/g, '') ===
        String(params.customerWhatsapp).replace(/\D/g, '')
  );

  if (customer) {
    customer.name = params.customerName;
    customer.email = params.customerEmail || customer.email;
    customer.whatsapp = params.customerWhatsapp;
    customer.cep = params.cep || customer.cep;
    customer.street = params.street || customer.street;
    customer.number = params.number || customer.number;
    customer.complement = params.complement ?? customer.complement;
    customer.neighborhood = params.neighborhood || customer.neighborhood;
    customer.city = params.city || customer.city;
    customer.state = params.state || customer.state;
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
  } else {
    customer = {
      id: `cust-${Date.now()}`,
      name: params.customerName,
      email: params.customerEmail || '',
      whatsapp: params.customerWhatsapp,
      cpf: params.customerCpf || '',
      cep: params.cep || '',
      street: params.street || '',
      number: params.number || '',
      complement: params.complement || '',
      neighborhood: params.neighborhood || '',
      city: params.city || '',
      state: params.state || '',
      totalOrders: 1,
      totalSpent: totalAmount,
      createdAt: new Date().toISOString(),
    };
    db.customers.unshift(customer);
  }

  const orderNumber = 101 + db.orders.length;
  const orderCode = `PTS-2026-${orderNumber}`;
  const orderId = `ord-${Date.now()}`;
  const productionDays = db.settings.productionDays || 15;
  const estimatedDeliveryDate = addDaysISO(productionDays);
  const shippingAddress = `${params.street}, ${params.number}${
    params.complement ? ` (${params.complement})` : ''
  } - ${params.neighborhood}, ${params.city}/${params.state} - CEP ${params.cep}`;

  const pixKey = db.settings.pixKey || '62984998265';

  const depositPayment: PaymentRecord = {
    id: `pay-${Date.now()}-1`,
    orderId,
    orderCode,
    installmentType: 'ENTRADA_50',
    method: 'PIX_MERCADO_PAGO',
    baseAmount: depositAmount,
    feeAmount: 0,
    installments: 1,
    amount: depositAmount,
    status: 'PENDENTE',
    pixCopyPaste: generateMercadoPagoPixPayload(
      depositAmount,
      `${orderCode}E`,
      pixKey
    ),
    mpReferenceId: `MP-PIX-${Date.now().toString().slice(-7)}`,
    sandboxMode: true,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };

  const finalPayment: PaymentRecord = {
    id: `pay-${Date.now()}-2`,
    orderId,
    orderCode,
    installmentType: 'FINAL_50',
    method: 'PIX_MERCADO_PAGO',
    baseAmount: remainingAmount,
    feeAmount: 0,
    installments: 1,
    amount: remainingAmount,
    status: 'PENDENTE',
    pixCopyPaste: generateMercadoPagoPixPayload(
      remainingAmount,
      `${orderCode}F`,
      pixKey
    ),
    mpReferenceId: `MP-PIX-${(Date.now() + 1).toString().slice(-7)}`,
    sandboxMode: true,
    paidAt: null,
    createdAt: new Date().toISOString(),
  };

  const newOrder: BespokeOrder = {
    id: orderId,
    orderCode,
    customerId: customer.id,
    customerName: params.customerName,
    customerWhatsapp: params.customerWhatsapp,
    customerEmail: params.customerEmail || '',
    customerCpf: params.customerCpf || '',
    shippingAddress,
    items: params.items,
    totalAmount,
    depositAmount,
    remainingAmount,
    paymentStatus: 'AGUARDANDO_ENTRADA_50',
    productionStatus: 'AGUARDANDO_CONFIRMACAO',
    estimatedDeliveryDate,
    productionDays,
    factoryNotes:
      'Encomenda registrada no site. Aguardando confirmação dos 50% de entrada (Pix ou Cartão de Crédito) para envio à bancada de corte.',
    trackingCode: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  db.payments.unshift(finalPayment, depositPayment);
  saveBrowserStoreDb(db);

  return {
    order: {
      ...newOrder,
      payments: [depositPayment, finalPayment],
    },
    depositPayment,
    finalPayment,
  };
}

export function confirmBrowserOrderPayment(
  orderIdOrCode: string,
  payload: {
    installmentType: 'ENTRADA_50' | 'FINAL_50';
    method?: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO';
    installments?: number;
    feeAmount?: number;
    totalCharged?: number;
    cardBrand?: string;
    cardLast4?: string;
  }
): BespokeOrder | null {
  const db = getBrowserStoreDb();
  const order = db.orders.find(
    (o) => o.id === orderIdOrCode || o.orderCode === orderIdOrCode
  );
  if (!order) return null;

  const payment = db.payments.find(
    (p) =>
      p.orderId === order.id &&
      p.installmentType === (payload.installmentType || 'ENTRADA_50')
  );

  const chosenMethod = payload.method || 'PIX_MERCADO_PAGO';

  if (payment) {
    payment.method = chosenMethod;
    payment.status = 'APROVADO';
    payment.paidAt = new Date().toISOString();

    if (chosenMethod === 'CARTAO_MERCADO_PAGO') {
      const baseVal =
        payment.baseAmount ??
        (payload.installmentType === 'FINAL_50'
          ? order.remainingAmount
          : order.depositAmount);
      payment.baseAmount = baseVal;
      payment.feeAmount =
        typeof payload.feeAmount === 'number' ? payload.feeAmount : 0;
      payment.installments = payload.installments || 1;
      payment.amount =
        typeof payload.totalCharged === 'number' &&
        payload.totalCharged >= baseVal
          ? payload.totalCharged
          : baseVal + (payment.feeAmount || 0);
      payment.cardBrand = payload.cardBrand || 'Cartão';
      payment.cardLast4 = payload.cardLast4 || '0000';
      payment.mpReferenceId = `MP-CARD-${Date.now().toString().slice(-7)}`;
    } else {
      const baseVal =
        payment.baseAmount ??
        (payload.installmentType === 'FINAL_50'
          ? order.remainingAmount
          : order.depositAmount);
      payment.baseAmount = baseVal;
      payment.feeAmount = 0;
      payment.installments = 1;
      payment.amount = baseVal;
    }
  }

  const methodLabel =
    chosenMethod === 'CARTAO_MERCADO_PAGO'
      ? `Cartão de Crédito (${payload.installments || 1}x c/ taxa do banco)`
      : 'Pix Mercado Pago';

  if (payload.installmentType === 'FINAL_50') {
    order.paymentStatus = 'QUITADO_100';
    if (order.productionStatus === 'PRONTA_PARA_ENTREGA') {
      order.factoryNotes = `${order.factoryNotes} | 50% finais confirmados via ${methodLabel}. Liberada para expedição.`;
    }
  } else {
    order.paymentStatus = 'ENTRADA_50_PAGA';
    if (order.productionStatus === 'AGUARDANDO_CONFIRMACAO') {
      order.productionStatus = 'CORTE_MODELAGEM';
      order.factoryNotes = `Entrada de 50% aprovada via ${methodLabel}. Ficha técnica liberada automaticamente para Corte & Modelagem (Prazo: 15 dias).`;
    }
  }

  order.updatedAt = new Date().toISOString();
  saveBrowserStoreDb(db);

  return {
    ...order,
    payments: db.payments.filter((p) => p.orderId === order.id),
  };
}

export function lookupBrowserOrders(query: string): BespokeOrder[] {
  const db = getBrowserStoreDb();
  const trimmed = query.trim();
  if (!trimmed) {
    return db.orders.slice(0, 10).map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));
  }

  const cleanDigits = trimmed.replace(/\D/g, '');
  const matched = db.orders.filter((o) => {
    const codeMatch = o.orderCode.toLowerCase().includes(trimmed.toLowerCase());
    const nameMatch = o.customerName
      .toLowerCase()
      .includes(trimmed.toLowerCase());
    const cpfMatch =
      cleanDigits.length >= 4 &&
      o.customerCpf.replace(/\D/g, '').includes(cleanDigits);
    const phoneMatch =
      cleanDigits.length >= 4 &&
      o.customerWhatsapp.replace(/\D/g, '').includes(cleanDigits);
    return codeMatch || nameMatch || cpfMatch || phoneMatch;
  });

  return matched.map((o) => ({
    ...o,
    payments: db.payments.filter((p) => p.orderId === o.id),
  }));
}

export function updateBrowserOrderAdmin(
  orderId: string,
  updates: {
    productionStatus?: ProductionStatus;
    paymentStatus?: PaymentStatus;
    factoryNotes?: string;
    trackingCode?: string;
    estimatedDeliveryDate?: string;
  }
): BespokeOrder | null {
  const db = getBrowserStoreDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;

  if (updates.productionStatus) {
    order.productionStatus = updates.productionStatus;
    if (
      updates.productionStatus === 'PRONTA_PARA_ENTREGA' &&
      order.paymentStatus === 'ENTRADA_50_PAGA'
    ) {
      order.paymentStatus = 'AGUARDANDO_FINAL_50';
    }
  }

  if (updates.paymentStatus) {
    order.paymentStatus = updates.paymentStatus;
    const orderPayments = db.payments.filter((p) => p.orderId === order.id);
    const depositPay = orderPayments.find(
      (p) => p.installmentType === 'ENTRADA_50'
    );
    const finalPay = orderPayments.find(
      (p) => p.installmentType === 'FINAL_50'
    );

    if (
      updates.paymentStatus === 'ENTRADA_50_PAGA' &&
      depositPay &&
      depositPay.status !== 'APROVADO'
    ) {
      depositPay.status = 'APROVADO';
      depositPay.paidAt = new Date().toISOString();
    }
    if (updates.paymentStatus === 'QUITADO_100') {
      if (depositPay && depositPay.status !== 'APROVADO') {
        depositPay.status = 'APROVADO';
        depositPay.paidAt = new Date().toISOString();
      }
      if (finalPay && finalPay.status !== 'APROVADO') {
        finalPay.status = 'APROVADO';
        finalPay.paidAt = new Date().toISOString();
      }
    }
  }

  if (updates.factoryNotes !== undefined) {
    order.factoryNotes = updates.factoryNotes;
  }
  if (updates.trackingCode !== undefined) {
    order.trackingCode = updates.trackingCode;
  }
  if (updates.estimatedDeliveryDate !== undefined) {
    order.estimatedDeliveryDate = updates.estimatedDeliveryDate;
  }

  order.updatedAt = new Date().toISOString();
  saveBrowserStoreDb(db);

  return {
    ...order,
    payments: db.payments.filter((p) => p.orderId === order.id),
  };
}
