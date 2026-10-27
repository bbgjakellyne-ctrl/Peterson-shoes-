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
  // NOVO 1 (PTS-IG-49) — 3 FOTOS DO MESMO MODELO JUNTAS (IMG_3086, IMG_3071, IMG_3070) — R$ 130,00
  {
    id: 'prod-ig-49-scarpin-marsala-pulseira',
    sku: 'PTS-IG-49',
    name: 'Scarpin Bico Fino Salto Alto & Pulseira (Marsala)',
    subtitle:
      'Bico Fino Clássico com Calcanhar Fechado, Recorte Lateral & Tira com Fivela Dourada no Tornozelo',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix sem taxa ou Cartão) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 2 (PTS-IG-47) — IMG_3061 — Scarpin Slingback Verniz Salto Fino & Pulseira (Marrom Café / Nude) — R$ 130,00
  {
    id: 'prod-ig-47-scarpin-slingback-verniz',
    sku: 'PTS-IG-47',
    name: 'Scarpin Slingback Verniz Salto Fino & Pulseira (Marrom Café)',
    subtitle:
      'Bico Fino em Verniz de Alto Brilho com Calcanhar Slingback & Pulseira Fivela Dourada',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 3 (PTS-IG-48) — IMG_3064 — Scarpin Slingback Ponteira Dourada & Salto Taça (Preto & Ouro) — R$ 130,00
  {
    id: 'prod-ig-48-scarpin-ponteira-dourada-salto-taca',
    sku: 'PTS-IG-48',
    name: 'Scarpin Slingback Ponteira Dourada & Salto Taça (Preto & Ouro)',
    subtitle:
      'Bico Fino Cap Toe com Biqueira Metalizada Dourada, Tira Slingback & Salto Taça Escultural',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 4 (PTS-IG-50) — IMG_3067 — Sandália Salto Fino Dourado 3 Tiras & Bico Quadrado (Caramelo Verniz) — R$ 130,00
  {
    id: 'prod-ig-50-sandalia-3-tiras-salto-dourado',
    sku: 'PTS-IG-50',
    name: 'Sandália Salto Fino Dourado 3 Tiras & Bico Quadrado (Caramelo)',
    subtitle:
      'Três Tiras Finas Abaulada no Peito do Pé, Pulseira Fivela & Salto Fino Metalizado Dourado',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% somente quando estiver pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 5 (PTS-IG-51) — IMG_3069 — Tamanco Salto Bloco Bico Quadrado & Fivela Dourada (Marsala) — R$ 130,00
  {
    id: 'prod-ig-51-tamanco-salto-bloco-marsala',
    sku: 'PTS-IG-51',
    name: 'Tamanco Salto Bloco Bico Quadrado & Fivela (Marsala)',
    subtitle:
      'Mule de Salto Bloco Médio Conforto com Tira no Peito do Pé & Fivela Dourada Lateral',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% na entrega',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 6 (PTS-IG-52) — IMG_3075 — Tamanco Anabela Dedo Detalhe Orgânico Dourado (Branco Off-White) — R$ 130,00
  {
    id: 'prod-ig-52-tamanco-anabela-dedo-dourado',
    sku: 'PTS-IG-52',
    name: 'Tamanco Anabela Dedo Aplique Orgânico Dourado (Off-White)',
    subtitle:
      'Anabela Escultural Bico Quadrado com Tira Larga Conforto & Joia Orgânica Dourada no Dedo',
    category: 'Anabelas & Plataformas',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 7 (PTS-IG-53) — IMG_3078 — Tamanco Mule Bico Folha Salto Fino Metalizado (Dourado Champagne) — R$ 130,00
  {
    id: 'prod-ig-53-mule-bico-folha-salto-fino-dourado',
    sku: 'PTS-IG-53',
    name: 'Tamanco Mule Bico Folha Salto Fino (Dourado Champagne)',
    subtitle:
      'Mule Salto Alto Fino com Bico Folha Alongado & Tira Larga em Couro Metalizado Champagne',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% na conclusão',
    ],
    createdAt: '2026-03-05T12:00:00.000Z',
  },

  // NOVO 8 (PTS-IG-54) — IMG_3083 — Sandália Mule Bico Fino Salto Alto & Tira Fivela (Preta) — R$ 130,00
  {
    id: 'prod-ig-54-sandalia-mule-bico-fino-preta',
    sku: 'PTS-IG-54',
    name: 'Sandália Mule Bico Fino Salto Alto & Fivela (Preta)',
    subtitle:
      'Design Bico Fino com Calcanhar Aberto, Tira Frontal & Pulseira Ajustável com Fivela Dourada',
    category: 'Scarpins & Saltos',
    price: 130,
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
      'Valor R$ 130,00 · Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta',
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
    price: 130,
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
    price: 150,
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
    price: 150,
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
    price: 130,
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
    price: 150,
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
    price: 130,
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
    price: 130,
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
    price: 110,
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
    price: 110,
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
    price: 150,
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
    price: 110,
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
    price: 150,
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
    price: 100,
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
    price: 130,
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
    price: 150,
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
    price: 130,
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
    price: 130,
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
    price: 100,
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
    price: 150,
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
    price: 150,
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
    price: 150,
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
    price: 150,
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
    price: 150,
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
    price: 130,
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
    price: 130,
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
    price: 130,
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
    price: 130,
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
    price: 130,
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
    price: 100,
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
    price: 100,
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
    price: 100,
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
    price: 110,
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
    price: 100,
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
    price: 110,
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
    price: 110,
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
    price: 110,
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
    price: 110,
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
    price: 130,
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
    price: 130,
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
    price: 130,
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
    price: 110,
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
    price: 110,
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
    price: 100,
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
    price: 110,
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
    price: 130,
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
    price: 100,
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
      totalSpent: 130,
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
      totalSpent: 150,
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
      baseAmount: 65,
      feeAmount: 0,
      installments: 1,
      amount: 65,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(
        65,
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
      baseAmount: 65,
      feeAmount: 0,
      installments: 1,
      amount: 65,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(
        65,
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
      baseAmount: 75,
      feeAmount: 3.74,
      installments: 2,
      cardBrand: 'Mastercard',
      cardLast4: '4829',
      amount: 78.74,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(
        75,
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
      baseAmount: 75,
      feeAmount: 0,
      installments: 1,
      amount: 75,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(
        75,
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
          name: 'Papete Flatform Pirâmides & Fivela (Dourada)',
          image: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
          unitPrice: 130,
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
      totalAmount: 130,
      depositAmount: 65,
      remainingAmount: 65,
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
          name: 'Anabela Plataforma Pirâmides & Fivela (Preta)',
          image: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
          unitPrice: 150,
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
      totalAmount: 150,
      depositAmount: 75,
      remainingAmount: 75,
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

const STORAGE_KEY_PROD = 'peterson_shoes_store_prod_v11';
const STORAGE_KEY_HOMOLOG = 'peterson_shoes_store_homolog_v11';

function resolveCurrentStorageKey(): string {
  if (typeof window === 'undefined') return STORAGE_KEY_HOMOLOG;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlEnv = (params.get('ambiente') || params.get('env') || '').toLowerCase().trim();
    if (urlEnv === 'producao' || urlEnv === 'prod' || urlEnv === 'oficial') {
      return STORAGE_KEY_PROD;
    }
    if (urlEnv === 'homologacao' || urlEnv === 'homolog' || urlEnv === 'teste') {
      return STORAGE_KEY_HOMOLOG;
    }
    const stored = window.sessionStorage.getItem('peterson_shoes_active_env');
    if (stored === 'producao') return STORAGE_KEY_PROD;
    return STORAGE_KEY_HOMOLOG;
  } catch {
    return STORAGE_KEY_HOMOLOG;
  }
}

export function getBrowserStoreDb(): StoreDatabaseSchema {
  if (typeof window === 'undefined') {
    return createInitialStoreDatabase();
  }
  const activeKey = resolveCurrentStorageKey();
  try {
    const raw = window.localStorage.getItem(activeKey);
    if (!raw) {
      const initial = createInitialStoreDatabase();
      window.localStorage.setItem(activeKey, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as StoreDatabaseSchema;
    if (
      !parsed.products ||
      parsed.products.length < 54 ||
      parsed.products[0]?.price !== 130
    ) {
      const initial = createInitialStoreDatabase();
      window.localStorage.setItem(activeKey, JSON.stringify(initial));
      return initial;
    }
    parsed.settings = {
      ...INITIAL_SETTINGS,
      ...parsed.settings,
      bankName: 'Inter',
      bankHolderName: '50789636 JACKELINE GOMES PETERSON',
      bankHolderDoc: '50.789.636/0001-32',
      pixKey: '50.789.636/0001-32',
      pixKeyType: 'CNPJ',
    };
    return parsed;
  } catch {
    return createInitialStoreDatabase();
  }
}

export function saveBrowserStoreDb(db: StoreDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  const activeKey = resolveCurrentStorageKey();
  try {
    window.localStorage.setItem(activeKey, JSON.stringify(db));
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
  const isHomolog = resolveCurrentStorageKey() === STORAGE_KEY_HOMOLOG;
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
  const orderCode = isHomolog
    ? `HOMOLOG-PTS-2026-${orderNumber}`
    : `PTS-2026-${orderNumber}`;
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
      'Encomenda registrada no site. Aguardando pagamento dos 50% de entrada e conferência do recebimento pela Peterson Shoes no Banco Inter.',
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

  order.factoryNotes = `Cliente informou envio de pagamento (${etapaLabel} via ${methodLabel}) em ${new Date().toLocaleString(
    'pt-BR'
  )}. Aguardando conferência e aprovação da Peterson Shoes após verificar o recebimento no Banco Inter.`;

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
