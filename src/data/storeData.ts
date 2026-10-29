import type {
  BespokeOrder,
  BespokeProduct,
  ColorOption,
  CustomerRecord,
  OrderItem,
  PaymentRecord,
  PaymentStatus,
  ProductionStatus,
  StoreSettings,
} from '../types/peterson.ts';

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

export const BANCO_INTER_OFFICIAL_BRCODE =
  '00020101021126360014br.gov.bcb.pix0114507896360001325204000053039865802BR5912SONHO ANIMAL6007GOIANIA62070503***63049D03';

export function generateMercadoPagoPixPayload(
  _amount: number,
  _reference: string,
  pixKey: string
): string {
  const digitsOnly = (pixKey || '').replace(/\D/g, '');
  if (!digitsOnly || digitsOnly === '50789636000132') {
    return BANCO_INTER_OFFICIAL_BRCODE;
  }

  const cleanKey = pixKey.trim();
  let normalizedKey = cleanKey;
  if (digitsOnly.length === 14 && !cleanKey.includes('@')) {
    normalizedKey = digitsOnly;
  } else if (/^\d{10,11}$/.test(cleanKey) && !cleanKey.startsWith('+55')) {
    normalizedKey = `+55${cleanKey}`;
  }

  const gui = emvField('00', 'br.gov.bcb.pix');
  const keyField = emvField('01', normalizedKey);
  const merchantAccountInfo = emvField('26', `${gui}${keyField}`);
  const additionalData = emvField('62', emvField('05', '***'));

  const bodyWithoutCrc =
    '000201010211' +
    merchantAccountInfo +
    '52040000' +
    '5303986' +
    '5802BR' +
    emvField('59', '50789636 JACKELINE GOMES ') +
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
  storeName: 'PETERSON SHOES',
  instagramUrl: 'https://www.instagram.com/petersonshoes_/',
  whatsappStore: '5562984998265',
  whatsappFactory: '5562984998265',
  productionDays: 15,
  depositPercentage: 50,
  creditCardFeePercentage: 4.99,
  mercadoPagoLiveEnabled: false,
  pixKey: '50.789.636/0001-32',
  pixKeyType: 'CNPJ',
  bankName: 'Inter',
  bankHolderName: '50789636 JACKELINE GOMES PETERSON',
  bankHolderDoc: '50.789.636/0001-32',
  bankAgency: '',
  bankAccount: '',
  cardPaymentLink: '',
};

export const INITIAL_PRODUCTS: BespokeProduct[] = [
  // NOVO 1 (PTS-IG-49) — 3 FOTOS DO MESMO MODELO JUNTAS (IMG_3086, IMG_3071, IMG_3070) — R$ 149,90
  {
    id: 'prod-ig-49-scarpin-marsala-pulseira',
    sku: 'PTS-IG-49',
    name: 'Scarpin Bico Fino Salto Alto & Pulseira (Marsala)',
    subtitle:
      'Bico Fino Clássico com Calcanhar Fechado, Recorte Lateral & Tira com Fivela Dourada no Tornozelo',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3086_5529b321.jpeg',
    gallery: [
      '/assets/aistudio/IMG_3086_5529b321.jpeg',
      '/assets/aistudio/IMG_3071_c77843a9.jpeg',
      '/assets/aistudio/IMG_3070_2d89dc6b.jpeg',
    ],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Alto 9,5cm', 'Salto Fino Médio 7,5cm'],
    strapFinishes: [
      'Fivela Dourada no Tornozelo',
      'Fivela Prateada no Tornozelo',
    ],
    colors: buildStandardColors(
      'Marsala',
      '/assets/aistudio/IMG_3086_5529b321.jpeg',
      {
        Marsala: '/assets/aistudio/IMG_3086_5529b321.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Elegância absoluta em cada ângulo! Nosso Scarpin Bico Fino com calcanhar fechado e tira regulável com fivela no tornozelo (@petersonshoes_) une sustentação firme, salto fino alinhado e acabamento artesanal impecável. Veja as 3 fotos reais do modelo na galeria!',
    craftDetails: [
      'Fabricação própria @petersonshoes_ sob encomenda em até 15 dias (Numeração 34 ao 39 BR)',
      'Disponível em Marsala, Preto, Branco, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor personalizada',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix sem taxa ou Cartão) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 2 (PTS-IG-47) — IMG_3061 — Scarpin Slingback Verniz Salto Fino & Pulseira (Marrom Café / Nude) — R$ 149,90
  {
    id: 'prod-ig-47-scarpin-slingback-verniz',
    sku: 'PTS-IG-47',
    name: 'Scarpin Slingback Verniz Salto Fino & Pulseira (Marrom Café)',
    subtitle:
      'Bico Fino em Verniz de Alto Brilho com Calcanhar Slingback & Pulseira Fivela Dourada',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3061_70e03cce.jpeg',
    gallery: ['/assets/aistudio/IMG_3061_70e03cce.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Alto 9,5cm', 'Salto Fino Médio 7,5cm'],
    strapFinishes: [
      'Verniz c/ Fivela Dourada',
      'Couro Fosco c/ Fivela Dourada',
    ],
    colors: buildStandardColors(
      'Nude',
      '/assets/aistudio/IMG_3061_70e03cce.jpeg',
      {
        Nude: '/assets/aistudio/IMG_3061_70e03cce.jpeg',
        Marsala: '/assets/aistudio/IMG_3061_70e03cce.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Sofisticação e poder que alongam a silhueta! Scarpin Slingback confeccionado em verniz de alto brilho com bico fino, tira traseira confortável e pulseira delicada com fivela dourada no tornozelo.',
    craftDetails: [
      'Confeccionado sob encomenda na numeração 34 ao 39 BR em nossa fábrica em Goiânia - GO',
      'Disponível em Nude/Café, Preto, Branco, Marsala, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 3 (PTS-IG-48) — IMG_3064 — Scarpin Slingback Ponteira Dourada & Salto Taça (Preto & Ouro) — R$ 149,90
  {
    id: 'prod-ig-48-scarpin-ponteira-dourada-salto-taca',
    sku: 'PTS-IG-48',
    name: 'Scarpin Slingback Ponteira Dourada & Salto Taça (Preto & Ouro)',
    subtitle:
      'Bico Fino Cap Toe com Biqueira Metalizada Dourada, Tira Slingback & Salto Taça Escultural',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3064_d165c2a2.jpeg',
    gallery: ['/assets/aistudio/IMG_3064_d165c2a2.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Taça Escultural 8,5cm', 'Salto Fino Clássico 8,5cm'],
    strapFinishes: [
      'Biqueira Dourada & Fivela Ouro',
      'Biqueira Prateada & Fivela Prata',
    ],
    colors: buildStandardColors(
      'Preto',
      '/assets/aistudio/IMG_3064_d165c2a2.jpeg',
      {
        Preto: '/assets/aistudio/IMG_3064_d165c2a2.jpeg',
        Dourado: '/assets/aistudio/IMG_3064_d165c2a2.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Design de alta costura nos seus pés! Scarpin Slingback com ponteira metalizada dourada (Cap Toe) e salto taça geométrico que garante elegância e estabilidade ao caminhar.',
    craftDetails: [
      'Biqueira espelhada dourada e palmilha macia acolchoada (34 ao 39 BR)',
      'Disponível em Preto c/ Dourado ou nas 8 cores padrão + opção Outra Cor personalizada',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 4 (PTS-IG-50) — IMG_3067 — Sandália Salto Fino Dourado 3 Tiras & Bico Quadrado (Caramelo Verniz) — R$ 149,90
  {
    id: 'prod-ig-50-sandalia-3-tiras-salto-dourado',
    sku: 'PTS-IG-50',
    name: 'Sandália Salto Fino Dourado 3 Tiras & Bico Quadrado (Caramelo)',
    subtitle:
      'Três Tiras Finas Abaulada no Peito do Pé, Pulseira Fivela & Salto Fino Metalizado Dourado',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3067_8bebcc9c.jpeg',
    gallery: ['/assets/aistudio/IMG_3067_8bebcc9c.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Dourado 8,5cm', 'Salto Fino Médio 7cm'],
    strapFinishes: [
      'Salto Metalizado Dourado & Fivela Ouro',
      'Salto no Tom da Sandália & Fivela Ouro',
    ],
    colors: buildStandardColors(
      'Nude',
      '/assets/aistudio/IMG_3067_8bebcc9c.jpeg',
      {
        Nude: '/assets/aistudio/IMG_3067_8bebcc9c.jpeg',
        Dourado: '/assets/aistudio/IMG_3067_8bebcc9c.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Delicada, feminina e super sofisticada! Sandália de bico quadrado com três tiras finas abauladas sobre os dedos, pulseira fina no tornozelo e salto fino metalizado dourado de destaque.',
    craftDetails: [
      'Fabricação própria em Goiânia - GO sob encomenda na sua numeração (34 ao 39 BR)',
      'Disponível em Nude/Caramelo, Preto, Branco, Marsala, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% somente quando estiver pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 5 (PTS-IG-51) — IMG_3069 — Tamanco Salto Bloco Bico Quadrado & Fivela Dourada (Marsala) — R$ 149,90
  {
    id: 'prod-ig-51-tamanco-salto-bloco-marsala',
    sku: 'PTS-IG-51',
    name: 'Tamanco Salto Bloco Bico Quadrado & Fivela (Marsala)',
    subtitle:
      'Mule de Salto Bloco Médio Conforto com Tira no Peito do Pé & Fivela Dourada Lateral',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3069_b9feb338.jpeg',
    gallery: ['/assets/aistudio/IMG_3069_b9feb338.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Bloco Médio 6,5cm', 'Salto Bloco Baixo 5cm'],
    strapFinishes: [
      'Fivela Dourada Retangular',
      'Fivela Prateada Retangular',
    ],
    colors: buildStandardColors(
      'Marsala',
      '/assets/aistudio/IMG_3069_b9feb338.jpeg',
      {
        Marsala: '/assets/aistudio/IMG_3069_b9feb338.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Praticidade e elegância para o dia todo! Nosso Tamanco Mule de bico quadrado e salto bloco médio oferece máxima estabilidade com detalhe de fivela dourada lateral no peito do pé.',
    craftDetails: [
      'Salto bloco anatômico perfeito para trabalhar, sair e caminhar com conforto (34 ao 39 BR)',
      'Disponível em Marsala, Preto, Branco, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% na entrega',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 6 (PTS-IG-52) — IMG_3075 — Tamanco Anabela Dedo Detalhe Orgânico Dourado (Branco Off-White) — R$ 149,90
  {
    id: 'prod-ig-52-tamanco-anabela-dedo-dourado',
    sku: 'PTS-IG-52',
    name: 'Tamanco Anabela Dedo Aplique Orgânico Dourado (Off-White)',
    subtitle:
      'Anabela Escultural Bico Quadrado com Tira Larga Conforto & Joia Orgânica Dourada no Dedo',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/assets/aistudio/IMG_3075_2729f411.jpeg',
    gallery: ['/assets/aistudio/IMG_3075_2729f411.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Anabela Escultural 8cm', 'Anabela Média 6,5cm'],
    strapFinishes: [
      'Aplique Orgânico Dourado no Dedo',
      'Aplique Orgânico Prateado no Dedo',
    ],
    colors: buildStandardColors(
      'Branco',
      '/assets/aistudio/IMG_3075_2729f411.jpeg',
      {
        Branco: '/assets/aistudio/IMG_3075_2729f411.jpeg',
        Nude: '/assets/aistudio/IMG_3075_2729f411.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Tendência absoluta da estação! Tamanco Anabela de design escultural com bico quadrado, tira larga macia no peito do pé e anel de dedo com aplique orgânico dourado espelhado.',
    craftDetails: [
      'Design moderno super leve com aplique metalizado polido no dedo (34 ao 39 BR)',
      'Disponível em Branco/Off-White, Preto, Nude, Marsala, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 7 (PTS-IG-53) — IMG_3078 — Tamanco Mule Bico Folha Salto Fino Metalizado (Dourado Champagne) — R$ 149,90
  {
    id: 'prod-ig-53-mule-bico-folha-salto-fino-dourado',
    sku: 'PTS-IG-53',
    name: 'Tamanco Mule Bico Folha Salto Fino (Dourado Champagne)',
    subtitle:
      'Mule Salto Alto Fino com Bico Folha Alongado & Tira Larga em Couro Metalizado Champagne',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3078_33e91306.jpeg',
    gallery: ['/assets/aistudio/IMG_3078_33e91306.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Alto 9cm', 'Salto Fino Médio 7cm'],
    strapFinishes: [
      'Acabamento Metalizado Champagne / Ouro',
      'Acabamento Couro Liso / Verniz',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/assets/aistudio/IMG_3078_33e91306.jpeg',
      {
        Dourado: '/assets/aistudio/IMG_3078_33e91306.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Minimalismo glamouroso que valoriza os pés! Tamanco Mule de bico folha alongado e salto fino alto em tom dourado champagne metalizado, perfeito para eventos e produções sofisticadas.',
    craftDetails: [
      'Gáspea anatômica forrada que abraça o pé com firmeza e maciez (34 ao 39 BR)',
      'Disponível em Dourado Champagne, Prata, Preto, Branco, Marsala, Nude, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 8 (PTS-IG-54) — IMG_3083 — Sandália Mule Bico Fino Salto Alto & Tira Fivela (Preta) — R$ 149,90
  {
    id: 'prod-ig-54-sandalia-mule-bico-fino-preta',
    sku: 'PTS-IG-54',
    name: 'Sandália Mule Bico Fino Salto Alto & Fivela (Preta)',
    subtitle:
      'Design Bico Fino com Calcanhar Aberto, Tira Frontal & Pulseira Ajustável com Fivela Dourada',
    category: 'Scarpins & Saltos',
    price: 149.9,
    image: '/assets/aistudio/IMG_3083_28dd9dab.jpeg',
    gallery: ['/assets/aistudio/IMG_3083_28dd9dab.jpeg'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Alto 9cm', 'Salto Fino Médio 7cm'],
    strapFinishes: [
      'Fivela Dourada Lateral',
      'Fivela Prateada Lateral',
    ],
    colors: buildStandardColors(
      'Preto',
      '/assets/aistudio/IMG_3083_28dd9dab.jpeg',
      {
        Preto: '/assets/aistudio/IMG_3083_28dd9dab.jpeg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Sensualidade e firmeza ao caminhar! Sandália Mule de bico fino e salto alto fino com tira frontal e alça regulável com fivela dourada sobre o peito do pé.',
    craftDetails: [
      'Produzida sob encomenda na numeração 34 ao 39 BR em nossa fábrica própria em Goiânia - GO',
      'Disponível em Preto, Marsala, Branco, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 149,90 · Entrada de 50% (R$ 74,95 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // 1. POST 1 (C454LXbOzrn Slide 1) — Papete Flatform Pirâmides & Fivela (Dourada) — R$ 130,00
  {
    id: 'prod-ig-01-papete-piramides',
    sku: 'PTS-IG-01',
    name: 'Papete Flatform Pirâmides & Fivela (Dourada)',
    subtitle:
      'Bico Quadrado Anatômico com Pirâmides Espelhadas & Pulseira no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 129.9,
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
      'Pagamento de 50% de entrada (Pix sem taxa ou Cartão c/ taxa do banco) e 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 2. POST 8 Parte A (C4Tc5OnpB_L Slide 1) — Anabela Plataforma Pirâmides & Fivela (Preta) — R$ 150,00
  {
    id: 'prod-ig-02-anabela-piramides-fivela',
    sku: 'PTS-IG-02',
    name: 'Anabela Plataforma Pirâmides & Fivela (Preta)',
    subtitle:
      'Plataforma Alta Bico Quadrado com Tiras em Pirâmides & Fechamento por Fivela',
    category: 'Anabelas & Plataformas',
    price: 149.9,
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

  // 3. POST 8 Parte B (C4Tc5OnpB_L Slide 6) — Anabela Plataforma Pirâmides Gladiadora (Dourada) — R$ 150,00
  {
    id: 'prod-ig-03-anabela-piramides-amarracao',
    sku: 'PTS-IG-03',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Dourada)',
    subtitle:
      'Plataforma Alta Bico Quadrado com Pirâmides & Amarração Lace-Up na Perna',
    category: 'Anabelas & Plataformas',
    price: 149.9,
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

  // 4. POST 9 (C4Tc1qCpAdX Slide 1) — Papete Flatform Tratorada Strass & Amarração (Off-White) — R$ 130,00
  {
    id: 'prod-ig-04-papete-tratorada-strass',
    sku: 'PTS-IG-04',
    name: 'Papete Flatform Tratorada Strass & Amarração (Off-White)',
    subtitle:
      'Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarração Nó Frontal',
    category: 'Flatforms & Papetes',
    price: 129.9,
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

  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Esferas (Dourada) — R$ 150,00
  {
    id: 'prod-ig-05-anabela-trancada-gold',
    sku: 'PTS-IG-05',
    name: 'Anabela Plataforma Trançada Esferas (Dourada)',
    subtitle:
      'Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela',
    category: 'Anabelas & Plataformas',
    price: 149.9,
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

  // 6. POST 10 (C4Tcs31JPdl Slide 1) — Flatform Gladiadora Tiras Cruzadas Strass (Dourada) — R$ 130,00
  {
    id: 'prod-ig-06-flatform-amarracao-strass',
    sku: 'PTS-IG-06',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass (Dourada)',
    subtitle:
      'Flatform Anatômica com Vira de Strass, Tiras Finas Brilhantes & Amarração Gladiadora',
    category: 'Flatforms & Papetes',
    price: 129.9,
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

  // 7. POST 11 (C4TcpFaJ9ll Slide 1) — Papete Flatform Espelhada Tiras Strass (Prata) — R$ 130,00
  {
    id: 'prod-ig-07-papete-metalizada-transpassada',
    sku: 'PTS-IG-07',
    name: 'Papete Flatform Espelhada Tiras Strass (Prata)',
    subtitle:
      'Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 129.9,
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

  // 8. POST 7 (C4ayCqZteae) — Flatform Normal Tira de Dedo Strass Duo — R$ 110,00
  {
    id: 'prod-ig-08-papete-dos-sonhos-strass',
    sku: 'PTS-IG-08',
    name: 'Flatform Tira de Dedo Strass Duo (Dourada & Prata)',
    subtitle:
      'Flatform Normal Bico Quadrado com Tiras de Dedo e Peito do Pé Cravejadas em Strass',
    category: 'Flatforms & Papetes',
    price: 109.9,
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
      'Publicada em nosso Instagram @petersonshoes_, nossa Flatform de Dedo Strass Duo combina calce prático estilo slide com anel de dedo e três tiras superiores inteiramente cravejadas em strass de alto brilho.',
    craftDetails: [
      'Flatform normal prática de calçar e super leve para o dia a dia ou eventos',
      'Disponível nas cores padrão ou cor personalizada (Numeração 34 ao 39 BR)',
      'Produzida sob encomenda pela Peterson Shoes em até 15 dias',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 9. POST 12 (C4TcmhYpO8_) — Flatform Normal Slide Tira de Dedo Nó em Strass — R$ 110,00
  {
    id: 'prod-ig-09-chinelo-flatform-no-strass',
    sku: 'PTS-IG-09',
    name: 'Flatform Slide Tira de Dedo Nó em Strass',
    subtitle:
      'Flatform Normal Anatômica Macia com Tiras Revestidas em Manta de Strass e Nó',
    category: 'Flatforms & Papetes',
    price: 109.9,
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
      'Conforto absoluto nos pés com o glamour da manta de strass! Nossa Flatform Normal Slide com nó central do Instagram @petersonshoes_ é confeccionada em todas as cores padrão ou sob encomenda na cor que você desejar.',
    craftDetails: [
      'Palmilha anatômica tipo nuvem de altíssima maciez (34 ao 39 BR)',
      'Tiras revestidas em manta de strass com forro interno suave',
      'Ideal para varejo ou pedidos em atacado (a partir de 6 pares)',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 10. POST 2 (C454HJKO2oG) — Anabela Espadrille Branca Pirâmides Prateadas & Corda de Juta — R$ 150,00
  {
    id: 'prod-ig-10-anabela-espadrille-branca',
    sku: 'PTS-IG-10',
    name: 'Anabela Espadrille Pirâmides & Juta (Branca)',
    subtitle: 'Anabela com Tachas Piramidais Espelhadas & Corda de Juta Natural',
    category: 'Anabelas & Plataformas',
    price: 149.9,
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

  // 11. POST 4 (C454A4GujcN Slides 1 a 2) — Rasteira Gladiadora Strass Cristal — R$ 110,00
  {
    id: 'prod-ig-11-rasteira-gladiadora-strass',
    sku: 'PTS-IG-11',
    name: 'Rasteira Gladiadora Strass Cristal (Prata)',
    subtitle: 'Tiras Duplas em Manta de Strass & Amarração Gladiadora Delicada na Perna',
    category: 'Rasteiras & Gladiadoras',
    price: 109.9,
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

  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Anabela Tamanco Plataforma Trançado Nó — R$ 150,00
  {
    id: 'prod-ig-12-tamanco-plataforma-no',
    sku: 'PTS-IG-12',
    name: 'Anabela Tamanco Plataforma Trançado c/ Nó (Off-White)',
    subtitle:
      'Anabela Plataforma Alta Revestida em Trama Artesanal & Tira Larga com Nó Central',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
    gallery: [
      '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C45360nuL6q/',
    heelOptions: ['Anabela Plataforma Alta 8,5cm', 'Anabela Plataforma Média 6,5cm'],
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
      'Conforto, leveza e altura em um modelo tendência do nosso Instagram @petersonshoes_! Anabela Tamanco Plataforma com base inteiramente revestida em trama trançada e gáspea em napa ultra macia com nó frontal anatômico.',
    craftDetails: [
      'Plataforma super leve com estabilidade total ao caminhar (34 ao 39 BR)',
      'Tira larga forrada em espuma macia para zero atrito nos dedos',
      'Produzido sob encomenda com 50% de entrada via Pix ou Cartão de Crédito',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 13. POST 3 (C454E0zuuFv Slide 1) — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Dourada) — R$ 100,00
  {
    id: 'prod-ig-13-rasteira-medalhao-esferas',
    sku: 'PTS-IG-13',
    name: 'Rasteira Esferas & Medalhão Metalizada (Dourada)',
    subtitle:
      'Rasteira de Dedo com Tachas Esféricas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
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

  // 14. POST 1 Slide 4 — Papete Flatform Pirâmides Black & Gold (Preta) — R$ 130,00
  {
    id: 'prod-ig-14-papete-piramides-preta',
    sku: 'PTS-IG-14',
    name: 'Papete Flatform Pirâmides Black & Gold (Preta)',
    subtitle:
      'Edição Preta com Pirâmides Douradas Espelhadas & Solado Anatômico',
    category: 'Flatforms & Papetes',
    price: 129.9,
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

  // 15. POST 8 Slide 2 — Anabela Plataforma Pirâmides & Fivela (Nude Rosé) — R$ 150,00
  {
    id: 'prod-ig-15-anabela-piramides-nude',
    sku: 'PTS-IG-15',
    name: 'Anabela Plataforma Pirâmides & Fivela (Nude Rosé)',
    subtitle:
      'Edição Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado',
    category: 'Anabelas & Plataformas',
    price: 149.9,
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

  // 16. POST 1 Slide 2 — Papete Flatform Pirâmides & Fivela (Off-White / Nude) — R$ 130,00
  {
    id: 'prod-ig-16-papete-piramides-nude',
    sku: 'PTS-IG-16',
    name: 'Papete Flatform Pirâmides & Fivela (Off-White / Nude)',
    subtitle:
      'Palmilha Anatômica Off-White com Pirâmides Douradas & Fivela Ajustável',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Prata & Fivela Prata',
    ],
    colors: buildStandardColors(
      'Nude',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      {
        Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
        Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
        Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Versão Off-White / Nude super versátil do nosso Instagram @petersonshoes_! Combina com todos os looks e traz palmilha macia de bico quadrado com tachas piramidais.',
    craftDetails: [
      'Fabricação própria em Goiânia - GO sob encomenda (34 ao 39 BR)',
      'Disponível nas 8 cores padrão ou na cor personalizada que você escrever',
      'Entrada de 50% (R$ 65,00 no Pix sem taxa) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 17. POST 1 Slide 3 — Papete Flatform Pirâmides & Fivela (Prata Metalizada) — R$ 130,00
  {
    id: 'prod-ig-17-papete-piramides-prata',
    sku: 'PTS-IG-17',
    name: 'Papete Flatform Pirâmides & Fivela (Prata)',
    subtitle:
      'Acabamento Metalizado Prata com Pirâmides Espelhadas & Pulseira no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pirâmides Cromadas & Fivela Prata',
      'Pirâmides Douradas & Fivela Ouro',
    ],
    colors: buildStandardColors(
      'Prata',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      {
        Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
        Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
        Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
        Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Edição Prata Metalizada da nossa Papete Flatform Pirâmides @petersonshoes_! Moderna, confortável e feita sob medida na sua numeração.',
    craftDetails: [
      'Confeccionada sob encomenda do 34 ao 39 BR em até 15 dias',
      'Escolha Prata ou qualquer uma das cores padrão / cor personalizada',
      'Entrada de 50% (R$ 65,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 18. POST 3 Slide 2 — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Prata) — R$ 100,00
  {
    id: 'prod-ig-18-rasteira-medalhao-prata',
    sku: 'PTS-IG-18',
    name: 'Rasteira Esferas & Medalhão Metalizada (Prata)',
    subtitle:
      'Rasteira de Dedo Prateada com Esferas Cromadas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    gallery: [
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454E0zuuFv/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Esferas & Medalhões Prateados',
      'Esferas & Medalhões Dourados',
    ],
    colors: buildStandardColors(
      'Prata',
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
      {
        Prata: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
        Dourado: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Versão Prata Metalizada da nossa Rasteira Esferas & Medalhão @petersonshoes_! Leve, fresca e elegante para todas as ocasiões.',
    craftDetails: [
      'Fabricação própria sob encomenda em Goiânia - GO (Numeração 34 ao 39)',
      'Disponível em todas as cores padrão ou outra cor personalizada',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 19. POST 8 Slide 3 — Anabela Plataforma Pirâmides & Fivela (Prata Champagne) — R$ 150,00
  {
    id: 'prod-ig-19-anabela-piramides-prata',
    sku: 'PTS-IG-19',
    name: 'Anabela Plataforma Pirâmides & Fivela (Prata Champagne)',
    subtitle:
      'Plataforma Alta Metalizada com Tachas Piramidais & Fivela no Tornozelo',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
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
      'Prata',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      {
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
        Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
        Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Brilho sofisticado para festas e eventos! Anabela Plataforma Pirâmides @petersonshoes_ na edição Prata Champagne, confeccionada sob encomenda do 34 ao 39.',
    craftDetails: [
      'Meia pata anatômica que garante conforto mesmo em salto alto',
      'Disponível em todas as cores padrão ou cor personalizada',
      'Entrada de 50% (R$ 75,00 no Pix) + 50% quando sua Anabela estiver pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 20. POST 8 Slide 4 — Anabela Plataforma Pirâmides & Fivela (Dourada) — R$ 150,00
  {
    id: 'prod-ig-20-anabela-piramides-dourada',
    sku: 'PTS-IG-20',
    name: 'Anabela Plataforma Pirâmides & Fivela (Dourada)',
    subtitle:
      'Edição Ouro Metalizado com Pirâmides Douradas & Pulseira de Fivela',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Prata & Fivela Cromada',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      {
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
        Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
        Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Uma das campeãs de pedidos no Instagram @petersonshoes_! Anabela Plataforma inteiramente dourada com pirâmides espelhadas e fechamento por fivela no tornozelo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR',
      'Disponível em Dourado ou qualquer outra cor escolhida por você',
      'Valor R$ 150,00 · Entrada de 50% (R$ 75,00) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 21. POST 8 Slide 5 — Anabela Plataforma Pirâmides & Fivela (Branca) — R$ 150,00
  {
    id: 'prod-ig-21-anabela-piramides-branca',
    sku: 'PTS-IG-21',
    name: 'Anabela Plataforma Pirâmides & Fivela (Branca)',
    subtitle:
      'Edição Branca com Tachas Piramidais Douradas & Bico Quadrado Moderno',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Prata & Fivela Cromada',
    ],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      {
        Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
        Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Destaque especial do carrossel @petersonshoes_! A Anabela Plataforma Branca com pirâmides douradas valoriza produções diurnas e noturnas com máximo conforto.',
    craftDetails: [
      'Fabricação própria em Goiânia - GO sob encomenda (34 ao 39 BR)',
      '8 cores padrão + opção Outra Cor personalizada',
      'Entrada de 50% (R$ 75,00 no Pix) + 50% somente quando estiver pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 22. POST 8 Slide 7 — Anabela Plataforma Pirâmides Gladiadora (Nude Rosé) — R$ 150,00
  {
    id: 'prod-ig-22-anabela-gladiadora-nude',
    sku: 'PTS-IG-22',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Nude Rosé)',
    subtitle:
      'Anabela Bico Quadrado Nude Rosé com Pirâmides Douradas & Amarração na Perna',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Ponteiras Ouro',
      'Pirâmides Prata & Ponteiras Prata',
    ],
    colors: buildStandardColors(
      'Nude',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      {
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
        Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Delicada e imponente! Anabela Plataforma Pirâmides Gladiadora na cor Nude Rosé com amarração lace-up macia no tornozelo.',
    craftDetails: [
      'Produzida sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Nude, Rosa, Dourado, Prata, Preto, Branco, Marsala, Vermelho ou Outra Cor',
      'Valor R$ 150,00 · Entrada de 50% (R$ 75,00) + 50% na entrega',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 23. POST 8 Slide 8 — Anabela Plataforma Pirâmides Gladiadora (Prata) — R$ 150,00
  {
    id: 'prod-ig-23-anabela-gladiadora-prata',
    sku: 'PTS-IG-23',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Prata)',
    subtitle:
      'Anabela Metalizada Prata com Tachas Piramidais & Amarração Gladiadora',
    category: 'Anabelas & Plataformas',
    price: 149.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: [
      'Pirâmides Prata & Ponteiras Prata',
      'Pirâmides Douradas & Ponteiras Ouro',
    ],
    colors: buildStandardColors(
      'Prata',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
      {
        Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
        Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
        Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Edição Prata Metalizada da nossa Anabela Plataforma Gladiadora @petersonshoes_! Perfeita para quem busca altura com estabilidade e brilho.',
    craftDetails: [
      'Meia pata frontal confortável e amarração ajustável',
      'Confeccionada sob encomenda do 34 ao 39 BR em Goiânia - GO',
      'Entrada de 50% (R$ 75,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 24. POST 9 Slide 2 — Papete Flatform Tratorada Strass & Amarração (Preta Onix) — R$ 130,00
  {
    id: 'prod-ig-24-papete-tratorada-preta',
    sku: 'PTS-IG-24',
    name: 'Papete Flatform Tratorada Strass & Amarração (Preta)',
    subtitle:
      'Solado Tratorado Preto com Vira de Strass Cristal & Amarração Nó Central',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
    gallery: [
      '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc1qCpAdX/',
    heelOptions: ['Flatform Tratorada 4cm', 'Flatform Anatômica 3cm'],
    strapFinishes: ['Strass Cristal & Vira Cravejada', 'Strass Grafite Onix'],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      {
        Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
        Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
        Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Destaque em preto com strass cristal do nosso Instagram @petersonshoes_! Papete Flatform Tratorada com amarração que abraça o pé com firmeza e maciez.',
    craftDetails: [
      'Solado tratorado contornado por filete de strass brilhante',
      'Disponível do 34 ao 39 BR em todas as cores padrão ou cor personalizada',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 25. POST 9 Slide 3 — Papete Flatform Tratorada Strass & Amarração (Dourada) — R$ 130,00
  {
    id: 'prod-ig-25-papete-tratorada-dourada',
    sku: 'PTS-IG-25',
    name: 'Papete Flatform Tratorada Strass & Amarração (Dourada)',
    subtitle:
      'Edição Dourada Metalizada com Tiras Duplas de Strass & Solado Tratorado',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    gallery: [
      '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc1qCpAdX/',
    heelOptions: ['Flatform Tratorada 4cm', 'Flatform Anatômica 3cm'],
    strapFinishes: ['Strass Dourado & Vira Cravejada', 'Strass Cristal'],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
      {
        Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
        Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
        Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Versão Dourada da Papete Tratorada Strass @petersonshoes_! Confeccionada sob encomenda na numeração 34 ao 39 em nossa fábrica própria em Goiânia - GO.',
    craftDetails: [
      'Tiras frontais em manta de strass com amarração ajustável',
      'Disponível nas 8 cores padrão ou na cor personalizada que você digitar',
      'Entrada de 50% (R$ 65,00 no Pix) + 50% somente na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 26. POST 10 Slide 2 — Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata) — R$ 130,00
  {
    id: 'prod-ig-26-flatform-gladiadora-branca',
    sku: 'PTS-IG-26',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata)',
    subtitle:
      'Flatform Gladiadora Branca com Tiras Finas em Strass Cristal & Vira Cravejada',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    gallery: [
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tcs31JPdl/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Prata Cristal & Vira Brilhante',
      'Strass Dourado',
    ],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      {
        Branco: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
        Prata: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
        Dourado: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Edição Branca & Prata Cristal da nossa Flatform Gladiadora Tiras Cruzadas @petersonshoes_! Delicada, iluminada e super confortável.',
    craftDetails: [
      'Fabricação própria sob encomenda em até 15 dias (34 ao 39 BR)',
      'Escolha Branco, Prata, Dourado ou qualquer outra cor personalizada',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 27. POST 11 Slide 2 — Papete Flatform Espelhada Tiras Strass (Dourado Champagne) — R$ 130,00
  {
    id: 'prod-ig-27-papete-espelhada-dourada',
    sku: 'PTS-IG-27',
    name: 'Papete Flatform Espelhada Tiras Strass (Dourado Champagne)',
    subtitle:
      'Palmilha Espelhada Champagne com Tiras Transpassadas em Strass & Fivela',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    gallery: [
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcpFaJ9ll/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Champagne & Fivela Ouro',
      'Strass Cristal & Fivela Prata',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      {
        Dourado: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
        Prata: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Edição Dourado Champagne da Papete Flatform Espelhada @petersonshoes_! Tiras sinuosas cravejadas de strass sobre o peito do pé e fivela delicada no tornozelo.',
    craftDetails: [
      'Produzida sob medida na numeração 34 ao 39 BR em Goiânia - GO',
      'Disponível em todas as cores padrão ou outra cor personalizada',
      'Entrada de 50% (R$ 65,00 no Pix) + 50% somente quando estiver pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 28. POST 14 (C4TcgZrplaC) — Papete Flatform Tira Transversal Pirâmides & Fivela — R$ 130,00
  {
    id: 'prod-ig-28-papete-transversal-piramides',
    sku: 'PTS-IG-28',
    name: 'Papete Flatform Tira Transversal Pirâmides & Fivela (Dourada & Prata)',
    subtitle:
      'Bico Quadrado Anatômico com Tira Diagonal Cravejada de Pirâmides & Fivela no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_14_C4TcgZrplaC_slide_1.jpg',
    gallery: [
      '/instagram/feed_14_C4TcgZrplaC_slide_1.jpg',
      '/instagram/feed_14_C4TcgZrplaC_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcgZrplaC/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pirâmides Douradas & Fivela Ouro',
      'Pirâmides Prata & Fivela Cromada',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_14_C4TcgZrplaC_slide_1.jpg',
      {
        Dourado: '/instagram/feed_14_C4TcgZrplaC_slide_1.jpg',
        Prata: '/instagram/feed_14_C4TcgZrplaC_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Um dos modelos mais pedidos do Instagram @petersonshoes_! Papete Flatform com tira transversal e pulseira inteiramente aplicadas com pirâmides metalizadas, garantindo firmeza e muito destaque.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Dourado, Prata, Preto, Branco, Marsala, Nude, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 29. POST 15 (C4TceEBpcL2) — Outras Rasteiras: Rasteira Bico Quadrado Tira de Dedo Nó em Strass — R$ 100,00
  {
    id: 'prod-ig-29-rasteira-no-strass-bico-quadrado',
    sku: 'PTS-IG-29',
    name: 'Rasteira Bico Quadrado Tira de Dedo Nó em Strass',
    subtitle:
      'Rasteira Elegante de Bico Quadrado com Tiras em Manta de Strass & Nó Central',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
    gallery: ['/instagram/feed_15_C4TceEBpcL2_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TceEBpcL2/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Manta de Strass Cristal Brilhante',
      'Manta de Strass Dourado Champagne',
    ],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_15_C4TceEBpcL2_main.jpg',
      {
        Preto: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
        Dourado: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
        Nude: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
        Prata: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Clássica, leve e super brilhante! Rasteira de bico quadrado do nosso perfil @petersonshoes_ com tiras de dedo unidas por nó central cravejado de strass.',
    craftDetails: [
      'Produzida sob medida na numeração 34 ao 39 BR em nossa fábrica em Goiânia - GO',
      'Disponível em Preto, Dourado, Nude, Branco, Marsala, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 30. POST 16 (C4TccS0J14Z) & POST 44 (C12GJ6QORi4) — Outras Rasteiras: Rasteira Laço Duplo Strass — R$ 100,00
  {
    id: 'prod-ig-30-rasteira-laco-duplo-strass',
    sku: 'PTS-IG-30',
    name: 'Rasteira Bico Quadrado Laço Duplo Cravejado em Strass',
    subtitle:
      'Modelo Tendência com Dois Laços Estruturados em Strass Cristal & Bico Quadrado',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_44_C12GJ6QORi4_slide_1.jpg',
    gallery: [
      '/instagram/feed_44_C12GJ6QORi4_slide_1.jpg',
      '/instagram/feed_16_C4TccS0J14Z_slide_1.jpg',
      '/instagram/feed_16_C4TccS0J14Z_slide_2.jpg',
      '/instagram/feed_16_C4TccS0J14Z_slide_3.jpg',
      '/instagram/feed_44_C12GJ6QORi4_slide_2.jpg',
      '/instagram/feed_44_C12GJ6QORi4_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TccS0J14Z/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Laço Duplo em Manta de Strass Cristal',
      'Laço Duplo em Strass Dourado',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_44_C12GJ6QORi4_slide_1.jpg',
      {
        Dourado: '/instagram/feed_44_C12GJ6QORi4_slide_1.jpg',
        Branco: '/instagram/feed_16_C4TccS0J14Z_slide_3.jpg',
        Rosa: '/instagram/feed_16_C4TccS0J14Z_slide_1.jpg',
        Preto: '/instagram/feed_16_C4TccS0J14Z_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Campeã de olhares no perfil @petersonshoes_! Rasteira de bico quadrado com dois laços frontais inteiramente revestidos em strass de alto brilho. Sofisticada, feminina e ultra confortável.',
    craftDetails: [
      'Laços duplos estruturados manualmente com manta de strass premium',
      'Numeração 34 ao 39 BR em todas as cores padrão ou cor personalizada',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 31. POST 17 (C4TcYo9pYsy) — Outras Rasteiras: Rasteira Tira Transversal Strass & Fivela — R$ 100,00
  {
    id: 'prod-ig-31-rasteira-transversal-strass-fivela',
    sku: 'PTS-IG-31',
    name: 'Rasteira Bico Quadrado Tira Transversal Strass & Fivela',
    subtitle:
      'Tira Diagonal em Manta de Strass, Anel de Dedo & Fechamento por Fivela no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
    gallery: ['/instagram/feed_17_C4TcYo9pYsy_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcYo9pYsy/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Fivela Metalizada',
      'Strass Dourado & Fivela Ouro',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
      {
        Dourado: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
        Branco: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
        Prata: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
        Preto: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Delicadeza e segurança ao caminhar! Modelo oficial @petersonshoes_ com tira transversal brilhante no peito do pé e pulseira com fivela ajustável no tornozelo.',
    craftDetails: [
      'Fabricação própria em Goiânia - GO sob encomenda (Numeração 34 ao 39 BR)',
      'Disponível em Dourado, Branco, Prata, Preto, Marsala, Nude, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% na entrega',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 32. POST 18 (C4TcU91p2E8) & POST 20 (C4TcQjaJejN) — Rasteira Gladiadora Multitiras Nó de Strass — R$ 110,00
  {
    id: 'prod-ig-32-rasteira-gladiadora-no-strass',
    sku: 'PTS-IG-32',
    name: 'Rasteira Gladiadora Multitiras Nó de Strass & Amarração',
    subtitle:
      'Rasteira Gladiadora Bico Quadrado com Tiras Cravejadas, Nó Frontal & Amarração na Perna',
    category: 'Rasteiras & Gladiadoras',
    price: 109.9,
    image: '/instagram/feed_20_C4TcQjaJejN_main.jpg',
    gallery: [
      '/instagram/feed_20_C4TcQjaJejN_main.jpg',
      '/instagram/feed_18_C4TcU91p2E8_main.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcQjaJejN/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Amarração Macia',
      'Strass Dourado & Amarração Macia',
    ],
    colors: buildStandardColors(
      'Rosa',
      '/instagram/feed_20_C4TcQjaJejN_main.jpg',
      {
        Rosa: '/instagram/feed_20_C4TcQjaJejN_main.jpg',
        Preto: '/instagram/feed_20_C4TcQjaJejN_main.jpg',
        Branco: '/instagram/feed_18_C4TcU91p2E8_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Moderna e super estilosa! Nossa Rasteira Gladiadora com nó de strass e amarração lace-up no tornozelo (@petersonshoes_) valoriza qualquer produção e pode ser feita na sua cor favorita.',
    craftDetails: [
      'Tiras finas confortáveis com aplicação de strass e cordões macios para amarração',
      'Numeração 34 ao 39 BR · Escolha entre as cores padrão ou digite Outra Cor',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 33. POST 19 (C4TcSseJ1vr) — Outras Rasteiras: Rasteira Bico Quadrado Tiras Cruzadas X em Pedraria — R$ 100,00
  {
    id: 'prod-ig-33-rasteira-tiras-x-pedraria',
    sku: 'PTS-IG-33',
    name: 'Rasteira Bico Quadrado Tiras Cruzadas X em Pedraria',
    subtitle:
      'Slide Rasteira com Tiras Largas Cruzadas em X Revestidas de Pedraria e Strass',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
    gallery: ['/instagram/feed_19_C4TcSseJ1vr_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcSseJ1vr/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Pedraria & Strass no Tom da Sandália',
      'Pedraria Cristal Prateada',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
      {
        Dourado: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
        Preto: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
        Prata: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
        Nude: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Calce fácil e acabamento de joia nos pés! Rasteira de tiras cruzadas em X cravejadas em pedraria e strass, confeccionada sob encomenda pela Peterson Shoes em Goiânia - GO.',
    craftDetails: [
      'Tiras largas cruzadas com forro interno acolchoado que abraça o peito do pé',
      'Numeração 34 ao 39 BR em todas as cores padrão ou cor personalizada',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 34. POST 22 (C4TcJj9Ju9I) — Flatform Normal: Flatform 3 Tiras Finas Assimétricas em Strass — R$ 110,00
  {
    id: 'prod-ig-34-flatform-3-tiras-strass',
    sku: 'PTS-IG-34',
    name: 'Flatform 3 Tiras Finas Assimétricas em Strass (Branca & Preta)',
    subtitle:
      'Flatform Normal Slide com Três Tiras Delicadas em Strass & Vira Brilhante',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg',
    gallery: [
      '/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg',
      '/instagram/feed_22_C4TcJj9Ju9I_slide_4.jpg',
      '/instagram/feed_22_C4TcJj9Ju9I_slide_2.jpg',
      '/instagram/feed_22_C4TcJj9Ju9I_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcJj9Ju9I/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Vira Cravejada',
      'Strass Onix / Dourado',
    ],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg',
      {
        Branco: '/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg',
        Preto: '/instagram/feed_22_C4TcJj9Ju9I_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Minimalista, iluminada e super confortável! Nossa Flatform Normal de 3 tiras finas em strass (@petersonshoes_) combina praticidade de calce com vira contornada por brilho.',
    craftDetails: [
      'Solado flatform macio com filete de strass em toda a borda (34 ao 39 BR)',
      'Disponível em Branco, Preto, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 35. POST 23 (C4TcFzJJLNA) — Flatform Normal: Flatform Tiras Entrelaçadas & Nó Pedraria Espelhada — R$ 110,00
  {
    id: 'prod-ig-35-flatform-no-pedraria-espelhada',
    sku: 'PTS-IG-35',
    name: 'Flatform Tiras Entrelaçadas & Nó Pedraria Espelhada',
    subtitle:
      'Flatform Normal com Palmilha Metalizada, Vira de Strass & Nó Frontal Cravejado',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_23_C4TcFzJJLNA_slide_1.jpg',
    gallery: [
      '/instagram/feed_23_C4TcFzJJLNA_slide_1.jpg',
      '/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg',
      '/instagram/feed_23_C4TcFzJJLNA_slide_3.jpg',
      '/instagram/feed_23_C4TcFzJJLNA_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcFzJJLNA/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pedraria Cristal & Vira de Strass',
      'Pedraria Dourada & Vira de Strass',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg',
      {
        Dourado: '/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg',
        Nude: '/instagram/feed_23_C4TcFzJJLNA_slide_3.jpg',
        Preto: '/instagram/feed_23_C4TcFzJJLNA_slide_4.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Sucesso absoluto no feed @petersonshoes_! Flatform Normal com tiras duplas cravejadas unidas por nó frontal e palmilha com acabamento espelhado de luxo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em Goiânia - GO',
      'Escolha Dourado, Nude, Preto ou qualquer outra cor personalizada',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 36. POST 24 (C4TcBT1pobH) — Flatform Normal: Flatform Tiras Cruzadas Duplas em Manta de Strass — R$ 110,00
  {
    id: 'prod-ig-36-flatform-tiras-cruzadas-duplas',
    sku: 'PTS-IG-36',
    name: 'Flatform Tiras Cruzadas Duplas em Manta de Strass',
    subtitle:
      'Flatform Normal Anatômica com Duplo X em Manta de Strass & Vira Brilhante',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
    gallery: [
      '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
      '/instagram/feed_24_C4TcBT1pobH_slide_2.jpg',
      '/instagram/feed_24_C4TcBT1pobH_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcBT1pobH/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Manta de Strass Cristal & Vira Cravejada',
      'Manta de Strass Dourado',
    ],
    colors: buildStandardColors(
      'Nude',
      '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
      {
        Nude: '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
        Branco: '/instagram/feed_24_C4TcBT1pobH_slide_2.jpg',
        Preto: '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
        Dourado: '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Design que abraça o pé com muito brilho e maciez! Flatform Normal com tiras cruzadas duplas em manta de strass do nosso Instagram @petersonshoes_.',
    craftDetails: [
      'Palmilha macia e vira lateral contornada em strass (34 ao 39 BR)',
      'Disponível em Nude, Branco, Preto, Dourado, Marsala, Prata, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 37. POST 26 (C4Tb7oxJ70j) — Flatform Normal: Flatform Slide de Dedo Nó Central Strass Metalizada — R$ 110,00
  {
    id: 'prod-ig-37-flatform-slide-no-dourada',
    sku: 'PTS-IG-37',
    name: 'Flatform Slide de Dedo Nó Central Strass Metalizada (Dourada)',
    subtitle:
      'Flatform Normal Metalizada com Tiras em Strass Unido por Nó Central & Vira Cravejada',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg',
    gallery: [
      '/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg',
      '/instagram/feed_26_C4Tb7oxJ70j_slide_2.jpg',
      '/instagram/feed_26_C4Tb7oxJ70j_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tb7oxJ70j/',
    heelOptions: ['Flatform Metalizada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Dourado & Vira Cravejada',
      'Strass Prata Cristal & Vira Cravejada',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg',
      {
        Dourado: '/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Praticidade e glamour para todos os momentos! Nossa Flatform Normal Slide com nó central em strass (@petersonshoes_) é confeccionada sob encomenda do 34 ao 39.',
    craftDetails: [
      'Acabamento metalizado espelhado e filete de strass ao redor da sola',
      'Numeração 34 ao 39 BR em todas as cores padrão ou cor personalizada',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 38. POST 28 (C12HMIqOt-1) — Papete Flatform Anel de Dedo & Tiras Cruzadas Strass c/ Fivela — R$ 130,00
  {
    id: 'prod-ig-38-papete-anel-dedo-strass-fivela',
    sku: 'PTS-IG-38',
    name: 'Papete Flatform Anel de Dedo & Tiras Strass c/ Fivela (Dourada)',
    subtitle:
      'Papete Metalizada com Anel de Dedo Cravejado, Tira Transversal em Strass & Fivela',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_28_C12HMIqOt-1_main.jpg',
    gallery: ['/instagram/feed_28_C12HMIqOt-1_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C12HMIqOt-1/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Dourado & Fivela no Tornozelo',
      'Strass Prata & Fivela no Tornozelo',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_28_C12HMIqOt-1_main.jpg',
      {
        Dourado: '/instagram/feed_28_C12HMIqOt-1_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Design anatômico que prende o pé com delicadeza e brilho! Papete Flatform @petersonshoes_ com anel de dedo cravejado, tiras de strass e pulseira com fivela no tornozelo.',
    craftDetails: [
      'Produzida sob medida na numeração 34 ao 39 BR em nossa fábrica em Goiânia - GO',
      'Disponível nas 8 cores padrão ou na cor personalizada que você escrever',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 39. POST 29 (C12HDhQO1dO) — Papete Flatform Vira de Strass & Duas Tiras Brilhantes c/ Fivela — R$ 130,00
  {
    id: 'prod-ig-39-papete-duas-tiras-strass-fivela',
    sku: 'PTS-IG-39',
    name: 'Papete Flatform Vira de Strass & Duas Tiras c/ Fivela (Branca)',
    subtitle:
      'Papete Branca com Duas Tiras Frontais em Strass, Vira Cravejada & Fivela Traseira',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_29_C12HDhQO1dO_slide_1.jpg',
    gallery: [
      '/instagram/feed_29_C12HDhQO1dO_slide_1.jpg',
      '/instagram/feed_29_C12HDhQO1dO_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C12HDhQO1dO/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Fivela Regulável',
      'Strass Dourado & Fivela Ouro',
    ],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_29_C12HDhQO1dO_slide_1.jpg',
      {
        Branco: '/instagram/feed_29_C12HDhQO1dO_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Delicada, romântica e super estável nos pés! Papete Flatform @petersonshoes_ com duas tiras paralelas de strass na frente, contorno brilhante na vira e fechamento por fivela.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Escolha Branco, Preto, Nude, Dourado, Prata, Marsala, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 40. POST 30 (C12HAGoOeUg) — Flatform Gladiadora Multitiras Strass & Amarração Lace-Up — R$ 130,00
  {
    id: 'prod-ig-40-flatform-gladiadora-multitiras',
    sku: 'PTS-IG-40',
    name: 'Flatform Gladiadora Multitiras Strass & Amarração (Preta & Branca)',
    subtitle:
      'Flatform Gladiadora com Tiras Finas Brilhantes, Vira de Strass & Amarração na Perna',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_30_C12HAGoOeUg_slide_1.jpg',
    gallery: [
      '/instagram/feed_30_C12HAGoOeUg_slide_1.jpg',
      '/instagram/feed_30_C12HAGoOeUg_slide_2.jpg',
      '/instagram/feed_30_C12HAGoOeUg_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C12HAGoOeUg/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Strass Cristal & Amarração Gladiadora',
      'Strass Dourado & Amarração Gladiadora',
    ],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_30_C12HAGoOeUg_slide_1.jpg',
      {
        Preto: '/instagram/feed_30_C12HAGoOeUg_slide_1.jpg',
        Branco: '/instagram/feed_30_C12HAGoOeUg_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Visual marcante direto da nossa fábrica em Goiânia - GO! Flatform Gladiadora @petersonshoes_ com multitiras de strass e amarração ajustável no tornozelo.',
    craftDetails: [
      'Vira contornada em strass e palmilha macia (Numeração 34 ao 39 BR)',
      'Disponível em Preto, Branco, Dourado, Prata, Nude, Marsala, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 41. POST 49 (CzWpulBOVR3) — Flatform Normal: Flatform Metalizada 3 Tiras Tubulares Strass — R$ 110,00
  {
    id: 'prod-ig-41-flatform-3-tiras-tubulares-dourada',
    sku: 'PTS-IG-41',
    name: 'Flatform Metalizada 3 Tiras Tubulares em Strass (Dourada)',
    subtitle:
      'Flatform Normal Slide com Três Tiras Tubulares Cravejadas & Solado Tratorado c/ Strass',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_49_CzWpulBOVR3_main.jpg',
    gallery: ['/instagram/feed_49_CzWpulBOVR3_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/CzWpulBOVR3/',
    heelOptions: ['Flatform Tratorada 3,5cm', 'Flatform Anatômica 2,5cm'],
    strapFinishes: [
      '3 Tiras Tubulares Strass Champagne',
      '3 Tiras Tubulares Strass Cristal',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_49_CzWpulBOVR3_main.jpg',
      {
        Dourado: '/instagram/feed_49_CzWpulBOVR3_main.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Brilho triplo e conforto de nuvem! Nossa Flatform Normal com 3 tiras tubulares de strass (@petersonshoes_) é perfeita para quem ama praticidade sem abrir mão da sofisticação.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em todas as cores padrão ou cor personalizada',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 42. POST 51 (CzWpluLO3Lx — Post mais curtido do perfil!) — Flatform Normal Tiras Cruzadas Pedraria Cristal — R$ 110,00
  {
    id: 'prod-ig-42-flatform-pedraria-cristal-espelhada',
    sku: 'PTS-IG-42',
    name: 'Flatform Tiras Cruzadas Pedraria Cristal Espelhada',
    subtitle:
      'Recordista de Curtidas @petersonshoes_ · Flatform Normal com Pedraria Lapidada & Vira de Strass',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg',
    gallery: [
      '/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg',
      '/instagram/feed_51_CzWpluLO3Lx_slide_2.jpg',
      '/instagram/feed_51_CzWpluLO3Lx_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/CzWpluLO3Lx/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Pedraria Lapidada Cristal & Vira de Strass',
      'Pedraria Dourada & Vira de Strass',
    ],
    colors: buildStandardColors(
      'Branco',
      '/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg',
      {
        Branco: '/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg',
        Dourado: '/instagram/feed_51_CzWpluLO3Lx_slide_2.jpg',
        Prata: '/instagram/feed_51_CzWpluLO3Lx_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'O modelo mais curtido do Instagram @petersonshoes_! Flatform Normal com tiras cruzadas ricamente trabalhadas em pedraria cristal lapidada e vira espelhada com strass.',
    craftDetails: [
      'Sucesso absoluto de vendas no varejo e atacado (Numeração 34 ao 39 BR)',
      'Disponível em Branco, Dourado, Prata, Preto, Nude, Marsala, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 43. POST 54 (CzJ_ceLJwx6) — Outras Rasteiras: Rasteira Bico Quadrado Tiras Entrelaçadas em Strass — R$ 100,00
  {
    id: 'prod-ig-43-rasteira-tiras-entrelacadas-dourada',
    sku: 'PTS-IG-43',
    name: 'Rasteira Bico Quadrado Tiras Entrelaçadas em Strass (Dourada)',
    subtitle:
      'Rasteira Metalizada de Bico Quadrado com Tiras Finas Entrelaçadas em Strass',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg',
    gallery: [
      '/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg',
      '/instagram/feed_54_CzJ_ceLJwx6_slide_2.jpg',
      '/instagram/feed_54_CzJ_ceLJwx6_slide_3.jpg',
      '/instagram/feed_54_CzJ_ceLJwx6_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/CzJ_ceLJwx6/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Tiras Entrelaçadas Strass Dourado',
      'Tiras Entrelaçadas Strass Cristal',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg',
      {
        Dourado: '/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Elegância atemporal nos pés! Rasteira de bico quadrado do nosso perfil @petersonshoes_ com desenho de tiras finas entrelaçadas em strass sobre o peito do pé.',
    craftDetails: [
      'Palmilha metalizada macia e solado antiderrapante (34 ao 39 BR)',
      'Disponível em Dourado, Prata, Preto, Branco, Nude, Marsala, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 44. POST 62 (CzJ-wYRpoWs) — Flatform Normal: Flatform Slide Tira Larga Nuvem Metalizada — R$ 110,00
  {
    id: 'prod-ig-44-flatform-slide-nuvem-metalizada',
    sku: 'PTS-IG-44',
    name: 'Flatform Slide Tira Larga Nuvem Metalizada (Dourada & Prata)',
    subtitle:
      'Flatform Normal Anatômica Estilo Nuvem com Gáspea Larga Acolchoada Metalizada',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg',
    gallery: [
      '/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg',
      '/instagram/feed_62_CzJ-wYRpoWs_slide_2.jpg',
      '/instagram/feed_62_CzJ-wYRpoWs_slide_3.jpg',
      '/instagram/feed_62_CzJ-wYRpoWs_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/CzJ-wYRpoWs/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: [
      'Napa Metalizada Macia Acolchoada',
      'Napa Fosca Acolchoada',
    ],
    colors: buildStandardColors(
      'Dourado',
      '/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg',
      {
        Dourado: '/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg',
        Prata: '/instagram/feed_62_CzJ-wYRpoWs_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Um dos posts mais amados do nosso Instagram @petersonshoes_! Flatform Normal Slide com tira larga acolchoada e palmilha anatômica super leve para usar o dia inteiro.',
    craftDetails: [
      'Conforto absoluto com espuma interna macia (Numeração 34 ao 39 BR)',
      'Disponível em Dourado, Prata, Preto, Branco, Nude, Marsala, Vermelho, Rosa ou Outra Cor',
      'Valor R$ 110,00 · Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 45. POST 69 (Cqk8GO5NMY1) — Flatform Gladiadora Tratorada Tiras Strass & Amarração — R$ 130,00
  {
    id: 'prod-ig-45-flatform-gladiadora-tratorada-cores',
    sku: 'PTS-IG-45',
    name: 'Flatform Gladiadora Tratorada Tiras Strass & Amarração (Preta, Branca & Nude)',
    subtitle:
      'Solado Flatform Tratorado com Vira Brilhante, Tiras Cruzadas em Strass & Amarração',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg',
    gallery: [
      '/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg',
      '/instagram/feed_69_Cqk8GO5NMY1_slide_2.jpg',
      '/instagram/feed_69_Cqk8GO5NMY1_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/Cqk8GO5NMY1/',
    heelOptions: ['Flatform Tratorada 4cm', 'Flatform Anatômica 3cm'],
    strapFinishes: [
      'Strass Cristal & Amarração Longa',
      'Strass Dourado & Amarração Longa',
    ],
    colors: buildStandardColors(
      'Preto',
      '/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg',
      {
        Preto: '/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg',
        Branco: '/instagram/feed_69_Cqk8GO5NMY1_slide_2.jpg',
        Nude: '/instagram/feed_69_Cqk8GO5NMY1_slide_3.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Moderna, imponente e cheia de personalidade! Flatform Gladiadora Tratorada @petersonshoes_ com tiras cruzadas em strass e amarração macia no tornozelo.',
    craftDetails: [
      'Produzida sob encomenda na numeração 34 ao 39 BR em nossa fábrica em Goiânia - GO',
      'Escolha Preto, Branco, Nude ou qualquer outra cor personalizada',
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // 46. POST 72 (Cqk6zKsOtGe) — Outras Rasteiras: Rasteira Bico Quadrado Multitiras Finas & Fivela — R$ 100,00
  {
    id: 'prod-ig-46-rasteira-multitiras-finas-fivela',
    sku: 'PTS-IG-46',
    name: 'Rasteira Bico Quadrado Multitiras Finas & Fivela',
    subtitle:
      'Rasteira Delicada de Bico Quadrado com Tiras Finas Assimétricas & Fivela no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg',
    gallery: [
      '/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg',
      '/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/Cqk6zKsOtGe/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: [
      'Tiras Finas em Napa Macia c/ Fivela',
      'Tiras Finas Metalizadas c/ Fivela',
    ],
    colors: buildStandardColors(
      'Rosa',
      '/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg',
      {
        Rosa: '/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg',
        Branco: '/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg',
        Preto: '/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg',
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Leveza minimalista que valoriza os pés! Rasteira de bico quadrado com multitiras finas e fechamento por fivela do nosso perfil @petersonshoes_.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Rosa, Branco, Preto, Marsala, Nude, Dourado, Prata, Vermelho ou Outra Cor',
      'Valor R$ 100,00 · Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-01T12:00:00.000Z',
  },

  // =========================================================================
  // 15 NOVOS MODELOS SELECIONADOS (PALMILHAS 100% LIMPAS SEM MARCA) POR CATEGORIA DE ESTILO
  // =========================================================================
  {
    id: 'prod-lks-06-plataforma-elisa',
    sku: 'PTS-LKS-06',
    name: 'Plataforma Anabela de Ráfia Trançada — Elisa',
    subtitle: 'Salto Anabela revestido em Ráfia Artesanal com Tira Frontal & Fivela no Tornozelo',
    category: 'Plataforma',
    price: 249.9,
    image: '/lks/products/lks-10-plataforma-de-rafia-elisa.webp?v=clean2',
    gallery: ['/lks/products/lks-10-plataforma-de-rafia-elisa.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Anabela Alta 10cm c/ Meia Pata', 'Anabela Média 7,5cm'],
    strapFinishes: ['Fivela Dourada c/ Trama em Ráfia', 'Fivela Prateada'],
    colors: buildStandardColors('Branco', '/lks/products/lks-10-plataforma-de-rafia-elisa.webp?v=clean2', {
      Branco: '/lks/products/lks-10-plataforma-de-rafia-elisa.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Leveza natural e elegância solar! Plataforma Anabela trabalhada em ráfia trançada com pulseira delicada e fivela dourada no tornozelo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Off-White/Branco, Nude, Caramelo, Dourado, Preto ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-07-plataforma-ayla',
    sku: 'PTS-LKS-07',
    name: 'Tamanco Plataforma Anabela Cortiça & Tiras Vinil — Ayla',
    subtitle: 'Design Moderno com Tiras Transparentes em Vinil Macio & Salto Anabela em Cortiça',
    category: 'Plataforma',
    price: 239.9,
    image: '/lks/products/lks-14-tamanco-salto-anabela-ayla.webp?v=clean2',
    gallery: ['/lks/products/lks-14-tamanco-salto-anabela-ayla.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Anabela Cortiça 9,5cm', 'Anabela Cortiça 7cm'],
    strapFinishes: ['Tiras Duplas em Vinil Cristal', 'Tiras em Couro Nude'],
    colors: buildStandardColors('Nude', '/lks/products/lks-14-tamanco-salto-anabela-ayla.webp?v=clean2', {
      Nude: '/lks/products/lks-14-tamanco-salto-anabela-ayla.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Tendência absoluta que alonga as pernas! O Tamanco Anabela Ayla combina o visual leve do vinil transparente com a base de cortiça anatômica.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Vinil flexível de toque macio que não machuca o peito do pé',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-08-plataforma-cecilia',
    sku: 'PTS-LKS-08',
    name: 'Plataforma Anabela Metalizada & Vinil — Cecília',
    subtitle: 'Acabamento Dourado Champagne com Recorte Lateral Transparente & Pulseira',
    category: 'Plataforma',
    price: 249.9,
    image: '/lks/products/lks-18-plataforma-anabela-cecilia.webp?v=clean2',
    gallery: ['/lks/products/lks-18-plataforma-anabela-cecilia.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Anabela Alta 10cm', 'Anabela Média 7,5cm'],
    strapFinishes: ['Metalizado Dourado c/ Vinil', 'Todo em Couro Metalizado'],
    colors: buildStandardColors('Dourado', '/lks/products/lks-18-plataforma-anabela-cecilia.webp?v=clean2', {
      Dourado: '/lks/products/lks-18-plataforma-anabela-cecilia.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Brilho sofisticado e estabilidade impecável! Plataforma Anabela dourada com detalhe em vinil e tira regulável no tornozelo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Dourado, Prata, Off-White, Nude, Preto ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-09-plataforma-taina',
    sku: 'PTS-LKS-09',
    name: 'Plataforma Salto Anabela Romântica — Tainá',
    subtitle: 'Tira Frontal Minimalista, Calcanhar Fechado & Pulseira Fivela Dourada',
    category: 'Plataforma',
    price: 249.9,
    image: '/lks/products/lks-22-plataforma-salto-annabela-taina.webp?v=clean2',
    gallery: ['/lks/products/lks-22-plataforma-salto-annabela-taina.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Anabela Alta 10cm', 'Anabela Média 7,5cm'],
    strapFinishes: ['Fivela Dourada Delicada', 'Fivela Prateada Delicada'],
    colors: buildStandardColors('Rosa', '/lks/products/lks-22-plataforma-salto-annabela-taina.webp?v=clean2', {
      Rosa: '/lks/products/lks-22-plataforma-salto-annabela-taina.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Delicadeza e conforto em altura! A Plataforma Anabela Tainá traz linhas limpas e modernas que valorizam os pés com extrema leveza.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Rosa Bebê, Branco, Nude, Dourado, Preto ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-10-sandalia-cristal',
    sku: 'PTS-LKS-10',
    name: 'Sandália Salto Acrílico & Vinil Transparente — Cristal',
    subtitle: 'Bico Folha Metalizado com Gáspea em Vinil & Salto Geométrico Cristal',
    category: 'Sandália de Salto',
    price: 229.9,
    image: '/lks/products/lks-28-sandalia-salto-anabela-cristal.webp?v=clean2',
    gallery: ['/lks/products/lks-28-sandalia-salto-anabela-cristal.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Acrílico Cristal 9cm', 'Salto Taça Dourado 8,5cm'],
    strapFinishes: ['Fivela Dourada c/ Tira Cristal', 'Fivela Prateada c/ Tira Cristal'],
    colors: buildStandardColors('Dourado', '/lks/products/lks-28-sandalia-salto-anabela-cristal.webp?v=clean2', {
      Dourado: '/lks/products/lks-28-sandalia-salto-anabela-cristal.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'O efeito Cinderela moderno! Sandália com bico folha metalizado, tiras em vinil cristal transparente e salto escultural translúcido.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível com base Dourada, Prata, Nude, Branca ou Preta',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-11-sandalia-lulu',
    sku: 'PTS-LKS-11',
    name: 'Sandália Salto Bloco Alto Dupla Pata Metalizada — Lulu',
    subtitle: 'Meia Pata Dupla Estruturada, Salto Bloco Alto & Tira no Tornozelo',
    category: 'Sandália de Salto',
    price: 249.9,
    image: '/lks/products/lks-30-sandalia-salto-dupla-pata-lulu.webp?v=clean2',
    gallery: ['/lks/products/lks-30-sandalia-salto-dupla-pata-lulu.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Bloco 11cm c/ Dupla Pata', 'Salto Bloco 9cm c/ Meia Pata'],
    strapFinishes: ['Couro Espelhado Prata', 'Couro Espelhado Dourado'],
    colors: buildStandardColors('Prata', '/lks/products/lks-30-sandalia-salto-dupla-pata-lulu.webp?v=clean2', {
      Prata: '/lks/products/lks-30-sandalia-salto-dupla-pata-lulu.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Presença marcante para festas, formaturas e eventos especiais! A meia pata dupla proporciona altura imponente com inclinação suave e confortável.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Prata, Dourado, Preto, Branco, Marsala, Rosa ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-12-sandalia-thais',
    sku: 'PTS-LKS-12',
    name: 'Sandália Salto Fino Tiras Texturizadas & Amarração — Thaís',
    subtitle: 'Tiras Frontais Trabalhadas, Salto Fino Clássico & Tira Envolvente no Tornozelo',
    category: 'Sandália de Salto',
    price: 229.9,
    image: '/lks/products/lks-32-sandalia-salto-fino-thais.webp?v=clean2',
    gallery: ['/lks/products/lks-32-sandalia-salto-fino-thais.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino 9,5cm', 'Salto Fino Médio 7,5cm'],
    strapFinishes: ['Fivela Dourada no Tornozelo', 'Fivela Prateada no Tornozelo'],
    colors: buildStandardColors('Dourado', '/lks/products/lks-32-sandalia-salto-fino-thais.webp?v=clean2', {
      Dourado: '/lks/products/lks-32-sandalia-salto-fino-thais.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Sofisticação que abraça os pés! Sandália de salto fino com tiras texturizadas e design envolvente no tornozelo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Dourado, Prata, Nude, Preto, Branco, Marsala ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-13-sandalia-diana',
    sku: 'PTS-LKS-13',
    name: 'Sandália Salto Fino Bico Folha & Strass — Diana',
    subtitle: 'Bico Folha Elegante com Tiras Cravejadas em Strass Cristal & Salto Fino',
    category: 'Sandália de Salto',
    price: 229.9,
    image: '/lks/products/lks-34-sandalia-de-salto-fino-bico-folha-e-strass-diana.webp?v=clean2',
    gallery: ['/lks/products/lks-34-sandalia-de-salto-fino-bico-folha-e-strass-diana.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino 9,5cm', 'Salto Fino Médio 7,5cm'],
    strapFinishes: ['Tiras em Strass Cristal Prata', 'Tiras em Strass Dourado'],
    colors: buildStandardColors('Prata', '/lks/products/lks-34-sandalia-de-salto-fino-bico-folha-e-strass-diana.webp?v=clean2', {
      Prata: '/lks/products/lks-34-sandalia-de-salto-fino-bico-folha-e-strass-diana.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Glamour em estado puro! Sandália de bico folha com tiras espiraladas em strass de alto brilho e salto fino alinhado.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Prata, Dourado, Preto, Branco, Nude, Rosa ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-14-rasteira-brasil',
    sku: 'PTS-LKS-14',
    name: 'Rasteira Gladiadora de Corda Trançada — Brasil',
    subtitle: 'Amarração Artesanal em Corda Macia no Tornozelo & Solado Flat Conforto',
    category: 'Rasteiras',
    price: 159.9,
    image: '/lks/products/lks-38-rasteira-de-corda-brasil.webp?v=clean2',
    gallery: [
      '/lks/products/lks-38-rasteira-de-corda-brasil.webp?v=clean2',
      '/lks/products/lks-39-rasteira-de-corda-brasil.webp?v=clean2',
    ],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Solado Flat Rasteiro Conforto'],
    strapFinishes: ['Corda Trançada Macia c/ Amarração', 'Corda em Tom Único'],
    colors: buildStandardColors('Dourado', '/lks/products/lks-38-rasteira-de-corda-brasil.webp?v=clean2', {
      Dourado: '/lks/products/lks-38-rasteira-de-corda-brasil.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Frescor tropical e charme artesanal! Rasteira com tiras em corda macia que permitem diferentes formas de amarração no tornozelo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Multicolor/Brasil, Off-White, Caramelo, Preto, Dourado ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-15-rasteira-concha',
    sku: 'PTS-LKS-15',
    name: 'Rasteira Slide Trama Natural & Aplique Dourado — Concha',
    subtitle: 'Tira Larga em Trama Natural Artesanal com Escultura de Concha Dourada',
    category: 'Rasteiras',
    price: 159.9,
    image: '/lks/products/lks-52-rasteira-com-aplicacao-concha.webp?v=clean2',
    gallery: [
      '/lks/products/lks-52-rasteira-com-aplicacao-concha.webp?v=clean2',
    ],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Solado Flat Rasteiro c/ Bico Quadrado'],
    strapFinishes: ['Aplique Concha Dourada', 'Tira Trama Natural sem Aplique'],
    colors: buildStandardColors('Nude', '/lks/products/lks-52-rasteira-com-aplicacao-concha.webp?v=clean2', {
      Nude: '/lks/products/lks-52-rasteira-com-aplicacao-concha.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Elegância resort chic! Rasteira slide em trama natural com aplicação escultural dourada, perfeita para dias ensolarados com muito estilo.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Palmilha lisa acolchoada e solado antiderrapante',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-16-papete-ariane',
    sku: 'PTS-LKS-16',
    name: 'Papete Flat Trançada com Detalhe Dourado — Ariane',
    subtitle: 'Tiras Cruzadas em Trama Artesanal & Solado Flatform Anatômico',
    category: 'Papetes',
    price: 229.9,
    image: '/lks/products/lks-59-flat-com-aplicacao-ariane.webp?v=clean2',
    gallery: ['/lks/products/lks-59-flat-com-aplicacao-ariane.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Flatform Anatômica 3,5cm'],
    strapFinishes: ['Trama Artesanal c/ Detalhe Dourado', 'Trama Artesanal c/ Detalhe Prata'],
    colors: buildStandardColors('Branco', '/lks/products/lks-59-flat-com-aplicacao-ariane.webp?v=clean2', {
      Branco: '/lks/products/lks-59-flat-com-aplicacao-ariane.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Conforto absoluto com acabamento artesanal de luxo! A Flat Ariane combina tiras trançadas macias e solado flatform contornado.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Branco, Off-White, Nude, Caramelo, Preto ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-17-papete-poly',
    sku: 'PTS-LKS-17',
    name: 'Papete Flat com Fivela Orgânica Dourada — Poly',
    subtitle: 'Tira Larga Texturizada com Maxi Aplique Orgânico Dourado & Base Trabalhada',
    category: 'Papetes',
    price: 239.9,
    image: '/lks/products/lks-60-flat-com-aplicacoes-poly.webp?v=clean2',
    gallery: ['/lks/products/lks-60-flat-com-aplicacoes-poly.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Flatform Estruturada 4cm'],
    strapFinishes: ['Maxi Aplique Orgânico Dourado', 'Maxi Aplique Orgânico Prata'],
    colors: buildStandardColors('Branco', '/lks/products/lks-60-flat-com-aplicacoes-poly.webp?v=clean2', {
      Branco: '/lks/products/lks-60-flat-com-aplicacoes-poly.webp?v=clean2',
      Nude: '/lks/products/lks-60-flat-com-aplicacoes-poly.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Design contemporâneo com maxi aplique orgânico dourado e base flatform texturizada que eleva qualquer produção casual chic.',
    craftDetails: [
      'Confeccionada sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Off-White, Branco, Nude, Preto, Dourado ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-18-scarpin-dara',
    sku: 'PTS-LKS-18',
    name: 'Scarpin Fechado Salto Anabela — Dara',
    subtitle: 'Bico Fino Clássico com Salto Anabela Contínuo de Alta Estabilidade',
    category: 'Scarpin',
    price: 249.9,
    image: '/lks/products/lks-69-scarpin-salto-anabela-dara.webp?v=clean2',
    gallery: ['/lks/products/lks-69-scarpin-salto-anabela-dara.webp?v=clean2'],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Anabela 8,5cm', 'Salto Fino Clássico 8,5cm'],
    strapFinishes: ['Acabamento Liso Clássico', 'Acabamento em Verniz'],
    colors: buildStandardColors('Branco', '/lks/products/lks-69-scarpin-salto-anabela-dara.webp?v=clean2', {
      Branco: '/lks/products/lks-69-scarpin-salto-anabela-dara.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'A elegância do Scarpin bico fino unida ao conforto incomparável do salto Anabela! Ideal para trabalhar, eventos e ocasiões especiais.',
    craftDetails: [
      'Confeccionado sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Branco, Off-White, Nude, Preto, Marsala, Vermelho ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-19-scarpin-sabrina',
    sku: 'PTS-LKS-19',
    name: 'Scarpin Salto Fino c/ Pulseira no Tornozelo — Sabrina',
    subtitle: 'Bico Fino Alongado, Calcanhar Fechado & Tira Delicada com Fivela',
    category: 'Scarpin',
    price: 189.9,
    image: '/lks/products/lks-72-scarpin-sabrina.webp?v=clean2',
    gallery: [
      '/lks/products/lks-72-scarpin-sabrina.webp?v=clean2',
      '/lks/products/lks-73-scarpin-sabrina.webp?v=clean2',
    ],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Salto Fino Alto 9,5cm', 'Salto Fino Médio 7,5cm'],
    strapFinishes: ['Pulseira c/ Fivela Dourada', 'Pulseira c/ Fivela Prateada'],
    colors: buildStandardColors('Nude', '/lks/products/lks-72-scarpin-sabrina.webp?v=clean2', {
      Nude: '/lks/products/lks-72-scarpin-sabrina.webp?v=clean2',
      Branco: '/lks/products/lks-72-scarpin-sabrina.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Clássico, feminino e atemporal! O Scarpin Sabrina traz bico fino elegante e pulseira no tornozelo para caminhar com total segurança.',
    craftDetails: [
      'Confeccionado sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Mousse/Nude, Branco, Preto, Marsala, Dourado, Prata ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
  {
    id: 'prod-lks-20-tenis-erica',
    sku: 'PTS-LKS-20',
    name: 'Tênis Casual Chunky Conforto — Érica',
    subtitle: 'Solado Anatômico Ultra Leve, Design Casual Chic & Palmilha Macia',
    category: 'Tênis Casual',
    price: 199.0,
    image: '/lks/products/lks-74-tenis-chunky-esportivo-erica.webp?v=clean2',
    gallery: [
      '/lks/products/lks-74-tenis-chunky-esportivo-erica.webp?v=clean2',
      '/lks/products/lks-75-tenis-chunky-esportivo-erica.webp?v=clean2',
    ],
    instagramPostUrl: 'https://www.instagram.com/petersonshoes_/',
    heelOptions: ['Solado Chunky Anatômico 4,5cm'],
    strapFinishes: ['Cadarço Algodão Premium', 'Acabamento Monocromático'],
    colors: buildStandardColors('Branco', '/lks/products/lks-74-tenis-chunky-esportivo-erica.webp?v=clean2', {
      Branco: '/lks/products/lks-74-tenis-chunky-esportivo-erica.webp?v=clean2',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Versatilidade e conforto para o dia a dia! O Tênis Casual Érica une design moderno com solado super leve que absorve o impacto a cada passo.',
    craftDetails: [
      'Confeccionado sob encomenda na numeração 34 ao 39 BR em até 15 dias',
      'Disponível em Branco, Off-White/Nude, Preto, Prata, Dourado ou Outra Cor',
      'Entrada de 50% no Pix (Banco Inter) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-06T12:00:00.000Z',
  },
];

export interface StyleCategoryItem {
  id: string;
  label: string;
  image: string;
}

export const STYLE_CATEGORIES: StyleCategoryItem[] = [
  {
    id: 'Plataforma',
    label: 'Plataforma',
    image: '/lks/categories/plataforma.webp?v=clean2',
  },
  {
    id: 'Sandália de Salto',
    label: 'Sandália de Salto',
    image: '/lks/categories/sandalia-salto.webp?v=clean2',
  },
  {
    id: 'Rasteiras',
    label: 'Rasteiras',
    image: '/lks/categories/rasteiras.webp?v=clean2',
  },
  {
    id: 'Papetes',
    label: 'Papetes',
    image: '/lks/categories/papetes.webp?v=clean2',
  },
  {
    id: 'Chinelos',
    label: 'Chinelos',
    image: '/lks/categories/chinelos.webp?v=clean2',
  },
  {
    id: 'Scarpin',
    label: 'Scarpin',
    image: '/lks/categories/scarpin.webp?v=clean2',
  },
  {
    id: 'Tênis Casual',
    label: 'Tênis Casual',
    image: '/lks/categories/tenis-casual.webp?v=clean2',
  },
];

const EXACT_STYLE_IDS = new Set(STYLE_CATEGORIES.map((c) => c.id));

export function isRemovedBootProduct(
  product?: Partial<Pick<BespokeProduct, 'id' | 'sku' | 'name' | 'category'>> | null
): boolean {
  if (!product) return false;
  const id = (product.id || '').toLowerCase();
  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();
  return id.includes('-bota-') || c === 'bota' || n.startsWith('bota ');
}

export function resolveProductStyleCategory(
  product: Pick<BespokeProduct, 'sku' | 'name' | 'category'>
): string {
  if (EXACT_STYLE_IDS.has(product.category)) {
    return product.category;
  }
  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();

  if (n.includes('tênis') || n.includes('tenis')) return 'Tênis Casual';
  if (n.includes('scarpin')) return 'Scarpin';
  if (
    c.includes('scarpins & saltos') ||
    c.includes('tamancos & saltos') ||
    n.includes('salto fino') ||
    n.includes('salto bloco') ||
    n.includes('salto taça') ||
    n.includes('meia pata') ||
    n.includes('dupla pata')
  ) {
    return 'Sandália de Salto';
  }
  if (
    c.includes('anabelas & plataformas') ||
    n.includes('anabela') ||
    n.includes('plataforma') ||
    n.includes('espadrille')
  ) {
    return 'Plataforma';
  }
  if (c.includes('rasteiras') || n.includes('rasteira')) {
    return 'Rasteiras';
  }
  if (
    n.includes('chinelo') ||
    n.includes('slide') ||
    n.includes('tira de dedo') ||
    (!n.includes('papete') &&
      !n.includes('gladiadora') &&
      !n.includes('amarração') &&
      !n.includes('fivela'))
  ) {
    return 'Chinelos';
  }
  return 'Papetes';
}

// Normalize all INITIAL_PRODUCTS so their .category matches one of the 7 organized style categories
for (const p of INITIAL_PRODUCTS) {
  p.category = resolveProductStyleCategory(p);
}

export function createInitialStoreDatabase(): StoreDatabaseSchema {
  const settings: StoreSettings = { ...INITIAL_SETTINGS };
  const customers: CustomerRecord[] = [];
  const payments: PaymentRecord[] = [];
  const orders: BespokeOrder[] = [];

  return {
    products: INITIAL_PRODUCTS,
    customers,
    orders,
    payments,
    settings,
  };
}

const STORAGE_KEY_PROD = 'peterson_shoes_store_prod_v16';
const STORAGE_KEY_HOMOLOG = 'peterson_shoes_store_homolog_v16';
const DELETED_ORDERS_KEY = 'peterson_deleted_order_ids_v1';

const DEMO_ORDER_IDS = new Set(['ord-1001', 'ord-1002']);
const DEMO_CUSTOMER_IDS = new Set(['cust-1', 'cust-2']);
const DEMO_PAYMENT_IDS = new Set(['pay-1a', 'pay-1b', 'pay-2a', 'pay-2b']);

function getDeletedOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_ORDERS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function addDeletedOrderId(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedOrderIds();
    current.add(orderId);
    window.localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore
  }
}

export function broadcastOrderRealtimeUpdate(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('peterson-orders-updated'));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('peterson_orders_realtime');
      bc.postMessage({ type: 'ORDERS_UPDATED', timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // Ignore broadcast errors
  }
}

function resolveCurrentStorageKey(): string {
  return STORAGE_KEY_PROD;
}

const INITIAL_PRODUCT_BY_ID = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
const PRODUCT_OVERRIDES_KEY = 'peterson_product_overrides_v1';

export function getProductOverrides(): Record<string, Partial<BespokeProduct>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PRODUCT_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProductOverride(
  productId: string,
  override: Partial<BespokeProduct>
): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const current = getProductOverrides();
    current[productId] = {
      ...(current[productId] || {}),
      ...override,
    };
    window.localStorage.setItem(PRODUCT_OVERRIDES_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

export function sanitizeProductCatalog(products: BespokeProduct[]): BespokeProduct[] {
  const overrides = getProductOverrides();
  const byId = new Map<string, BespokeProduct>();
  for (const p of products || []) {
    if (!p || !p.id || isRemovedBootProduct(p)) continue;
    const canonical = INITIAL_PRODUCT_BY_ID.get(p.id);
    const ov = overrides[p.id];
    const baseProd =
      canonical && p.id.startsWith('prod-lks-')
        ? {
            ...p,
            image: canonical.image,
            gallery: canonical.gallery,
            colors: canonical.colors,
            category: resolveProductStyleCategory(canonical),
          }
        : {
            ...p,
            category: resolveProductStyleCategory(p),
          };
    byId.set(
      p.id,
      ov
        ? {
            ...baseProd,
            ...ov,
            id: p.id,
            price:
              typeof ov.price === 'number' && ov.price > 0
                ? ov.price
                : baseProd.price,
          }
        : baseProd
    );
  }
  for (const initP of INITIAL_PRODUCTS) {
    if (!byId.has(initP.id)) {
      const ov = overrides[initP.id];
      const baseInit = {
        ...initP,
        category: resolveProductStyleCategory(initP),
      };
      byId.set(
        initP.id,
        ov
          ? {
              ...baseInit,
              ...ov,
              id: initP.id,
              price:
                typeof ov.price === 'number' && ov.price > 0
                  ? ov.price
                  : baseInit.price,
            }
          : baseInit
      );
    }
  }
  return Array.from(byId.values());
}

export function getBrowserStoreDb(): StoreDatabaseSchema {
  if (typeof window === 'undefined') {
    return createInitialStoreDatabase();
  }
  const activeKey = resolveCurrentStorageKey();
  const deletedIds = getDeletedOrderIds();

  try {
    // Collect orders, customers, and payments across ALL peterson_shoes_store* keys
    // so orders placed when the tab was in Homologação vs Produção are never lost or hidden
    const ordersMap = new Map<string, BespokeOrder>();
    const customersMap = new Map<string, CustomerRecord>();
    const paymentsMap = new Map<string, PaymentRecord>();

    const allCandidateKeys: string[] = [STORAGE_KEY_HOMOLOG, STORAGE_KEY_PROD];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('peterson_shoes_store') && !allCandidateKeys.includes(k)) {
        allCandidateKeys.unshift(k);
      }
    }

    let baseParsed: StoreDatabaseSchema | null = null;

    for (const key of allCandidateKeys) {
      const rawKey = window.localStorage.getItem(key);
      if (!rawKey) continue;
      try {
        const parsedKey = JSON.parse(rawKey) as StoreDatabaseSchema;
        if (key === activeKey && parsedKey?.products && parsedKey.products.length >= 69) {
          baseParsed = parsedKey;
        }
        for (const o of parsedKey?.orders || []) {
          if (
            o &&
            o.id &&
            !DEMO_ORDER_IDS.has(o.id) &&
            !deletedIds.has(o.id) &&
            !deletedIds.has(o.orderCode)
          ) {
            const existing = ordersMap.get(o.id);
            if (!existing || (o.updatedAt || '') >= (existing.updatedAt || '')) {
              ordersMap.set(o.id, o);
            }
          }
        }
        for (const c of parsedKey?.customers || []) {
          if (c && c.id && !DEMO_CUSTOMER_IDS.has(c.id)) {
            customersMap.set(c.id, c);
          }
        }
        for (const p of parsedKey?.payments || []) {
          if (
            p &&
            p.id &&
            !DEMO_PAYMENT_IDS.has(p.id) &&
            !DEMO_ORDER_IDS.has(p.orderId) &&
            !deletedIds.has(p.orderId)
          ) {
            paymentsMap.set(p.id, p);
          }
        }
      } catch {
        // Ignore malformed legacy storage item
      }
    }

    const base = baseParsed || createInitialStoreDatabase();
    const normalizedProducts = sanitizeProductCatalog(
      base.products && base.products.length >= 69 ? base.products : INITIAL_PRODUCTS
    );

    const mergedOrders = Array.from(ordersMap.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
    const mergedCustomers = Array.from(customersMap.values());
    const mergedPayments = Array.from(paymentsMap.values());

    const result: StoreDatabaseSchema = {
      products: normalizedProducts,
      customers: mergedCustomers,
      orders: mergedOrders,
      payments: mergedPayments,
      settings: {
        ...INITIAL_SETTINGS,
        ...(base.settings || {}),
        bankName: 'Inter',
        bankHolderName: '50789636 JACKELINE GOMES PETERSON',
        bankHolderDoc: '50.789.636/0001-32',
        pixKey: '50.789.636/0001-32',
        pixKeyType: 'CNPJ',
      },
    };

    window.localStorage.setItem(STORAGE_KEY_PROD, JSON.stringify(result));
    window.localStorage.setItem(STORAGE_KEY_HOMOLOG, JSON.stringify(result));
    return result;
  } catch {
    return createInitialStoreDatabase();
  }
}

export function saveBrowserStoreDb(db: StoreDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(db);
    window.localStorage.setItem(STORAGE_KEY_PROD, serialized);
    window.localStorage.setItem(STORAGE_KEY_HOMOLOG, serialized);
    broadcastOrderRealtimeUpdate();
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

  const pixKey = db.settings.pixKey || '50.789.636/0001-32';

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
    mpReferenceId: `PIX-INTER-${Date.now().toString().slice(-7)}`,
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
    mpReferenceId: `PIX-INTER-${(Date.now() + 1).toString().slice(-7)}`,
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
      '⏳ Pedido Aguardando Confirmação da Peterson Shoes (conferir entrada de 50% no Banco Inter).',
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

/**
 * Registra apenas o aviso de que a cliente realizou ou enviou o comprovante do pagamento.
 * NÃO aprova o pagamento automaticamente: a confirmação só pode ser feita pela administração
 * da Peterson Shoes após conferir o recebimento real no Banco Inter.
 */
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

  if (payment && payment.status !== 'APROVADO') {
    payment.method = chosenMethod;
    // Mantém status PENDENTE até conferência manual da administradora
    payment.status = 'PENDENTE';
    payment.paidAt = null;

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
      ? `Cartão de Crédito (${payload.installments || 1}x)`
      : 'Pix Banco Inter';

  const etapaLabel =
    payload.installmentType === 'FINAL_50' ? '50% finais' : '50% de entrada';

  order.factoryNotes = `🔔 Cliente informou pagamento (${etapaLabel} via ${methodLabel}) em ${new Date().toLocaleString(
    'pt-BR'
  )}. Aguardando confirmação da Peterson Shoes após verificar o recebimento no Banco Inter.`;

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
    totalAmount?: number;
    depositAmount?: number;
    remainingAmount?: number;
  }
): BespokeOrder | null {
  const db = getBrowserStoreDb();
  const order = db.orders.find((o) => o.id === orderId || o.orderCode === orderId);
  if (!order) return null;

  if (typeof updates.totalAmount === 'number' && !isNaN(updates.totalAmount) && updates.totalAmount > 0) {
    const nextTotal = Math.round(updates.totalAmount * 100) / 100;
    const nextDeposit =
      typeof updates.depositAmount === 'number' && !isNaN(updates.depositAmount) && updates.depositAmount >= 0
        ? Math.round(updates.depositAmount * 100) / 100
        : Math.round(nextTotal * 0.5 * 100) / 100;
    const nextRemaining =
      typeof updates.remainingAmount === 'number' && !isNaN(updates.remainingAmount) && updates.remainingAmount >= 0
        ? Math.round(updates.remainingAmount * 100) / 100
        : Math.round((nextTotal - nextDeposit) * 100) / 100;

    order.totalAmount = nextTotal;
    order.depositAmount = nextDeposit;
    order.remainingAmount = nextRemaining;

    const orderPayments = db.payments.filter((p) => p.orderId === order.id);
    const depositPay = orderPayments.find((p) => p.installmentType === 'ENTRADA_50');
    const finalPay = orderPayments.find((p) => p.installmentType === 'FINAL_50');
    if (depositPay) {
      depositPay.baseAmount = nextDeposit;
      depositPay.amount = nextDeposit + (depositPay.feeAmount || 0);
    }
    if (finalPay) {
      finalPay.baseAmount = nextRemaining;
      finalPay.amount = nextRemaining + (finalPay.feeAmount || 0);
    }
  }

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

    if (updates.paymentStatus === 'ENTRADA_50_PAGA') {
      if (depositPay && depositPay.status !== 'APROVADO') {
        depositPay.status = 'APROVADO';
        depositPay.paidAt = new Date().toISOString();
      }
      if (!updates.productionStatus && order.productionStatus === 'AGUARDANDO_CONFIRMACAO') {
        order.productionStatus = 'CORTE_MODELAGEM';
      }
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

export function deleteBrowserOrderAdmin(orderId: string): void {
  addDeletedOrderId(orderId);
  const db = getBrowserStoreDb();
  const target = db.orders.find((o) => o.id === orderId || o.orderCode === orderId);
  if (target) {
    addDeletedOrderId(target.id);
    addDeletedOrderId(target.orderCode);
  }
  db.orders = db.orders.filter((o) => o.id !== orderId && o.orderCode !== orderId);
  db.payments = db.payments.filter((p) => p.orderId !== orderId);
  saveBrowserStoreDb(db);
}

export function importBrowserOrderFromWhatsAppSync(rawInput: string): BespokeOrder | null {
  if (!rawInput || !rawInput.trim()) return null;
  try {
    let b64Candidate = rawInput.trim();
    const paramMatch = b64Candidate.match(/importar_pedido=([^&\s]+)/);
    if (paramMatch && paramMatch[1]) {
      b64Candidate = decodeURIComponent(paramMatch[1]);
    }

    const decodedJson = decodeURIComponent(escape(atob(b64Candidate)));
    const parsed = JSON.parse(decodedJson);
    if (!parsed || !parsed.c || !parsed.n) return null;

    const db = getBrowserStoreDb();
    const existing = db.orders.find(
      (o) => o.id === parsed.id || o.orderCode === parsed.c
    );
    if (existing) {
      return {
        ...existing,
        payments: db.payments.filter((p) => p.orderId === existing.id),
      };
    }

    const orderId = parsed.id || `ord-${Date.now()}`;
    const orderCode = parsed.c || `PTS-2026-${101 + db.orders.length}`;
    const totalAmount = Number(parsed.t) || 0;
    const depositAmount =
      Number(parsed.d) || Math.round(totalAmount * 0.5 * 100) / 100;
    const remainingAmount =
      Number(parsed.r) || Math.round((totalAmount - depositAmount) * 100) / 100;
    const pixKey = db.settings.pixKey || '50.789.636/0001-32';

    const items: OrderItem[] = Array.isArray(parsed.i)
      ? parsed.i.map((it: Record<string, unknown>) => ({
          productId: String(it.p || 'prod-sync'),
          sku: String(it.s || 'PTS-IG'),
          name: String(it.nm || 'Calçado Sob Encomenda'),
          image: String(it.im || INITIAL_PRODUCTS[0]?.image || ''),
          unitPrice: Number(it.up) || totalAmount,
          quantity: Number(it.q) || 1,
          size: Number(it.sz) || 36,
          colorName: String(it.cn || 'Padrão'),
          colorHex: String(it.ch || '#1B191A'),
          customization: {
            heelOption: String(it.ho || ''),
            strapFinish: String(it.sf || ''),
            footWidth:
              (it.fw as OrderItem['customization']['footWidth']) || 'Padrão',
            insoleEngraving: '',
            customNotes: String(it.nt || ''),
          },
        }))
      : [];

    const depositPayment: PaymentRecord = {
      id: `pay-${Date.now()}-1`,
      orderId,
      orderCode,
      installmentType: 'ENTRADA_50',
      method:
        parsed.m === 'CARTAO_MERCADO_PAGO'
          ? 'CARTAO_MERCADO_PAGO'
          : 'PIX_MERCADO_PAGO',
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
      mpReferenceId: `PIX-INTER-${Date.now().toString().slice(-7)}`,
      sandboxMode: true,
      paidAt: null,
      createdAt: parsed.dt || new Date().toISOString(),
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
      mpReferenceId: `PIX-INTER-${(Date.now() + 1).toString().slice(-7)}`,
      sandboxMode: true,
      paidAt: null,
      createdAt: parsed.dt || new Date().toISOString(),
    };

    const newOrder: BespokeOrder = {
      id: orderId,
      orderCode,
      customerId: `cust-${Date.now()}`,
      customerName: String(parsed.n),
      customerWhatsapp: String(parsed.w || ''),
      customerEmail: String(parsed.e || ''),
      customerCpf: String(parsed.cpf || ''),
      shippingAddress: String(parsed.a || ''),
      items,
      totalAmount,
      depositAmount,
      remainingAmount,
      preferredPaymentMethod:
        parsed.m === 'CARTAO_MERCADO_PAGO'
          ? 'CARTAO_MERCADO_PAGO'
          : 'PIX_MERCADO_PAGO',
      paymentStatus: 'AGUARDANDO_ENTRADA_50',
      productionStatus: 'AGUARDANDO_CONFIRMACAO',
      estimatedDeliveryDate: addDaysISO(15),
      productionDays: 15,
      factoryNotes:
        '🔔 Pedido recebido via WhatsApp — Aguardando confirmação da Peterson Shoes após conferir o Pix no Banco Inter.',
      trackingCode: '',
      createdAt: parsed.dt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    db.payments.unshift(finalPayment, depositPayment);
    saveBrowserStoreDb(db);

    return {
      ...newOrder,
      payments: [depositPayment, finalPayment],
    };
  } catch {
    return null;
  }
}


