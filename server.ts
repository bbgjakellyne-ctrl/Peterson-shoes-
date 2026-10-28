import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type {
  BespokeProduct,
  ColorOption,
  CustomerRecord,
  BespokeOrder,
  PaymentRecord,
  StoreSettings,
  PaymentStatus,
  ProductionStatus,
} from './src/types/peterson.ts';
import { INITIAL_PRODUCTS as STORE_INITIAL_PRODUCTS } from './src/data/storeData.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const BUNDLED_DB_FILE = path.resolve(process.cwd(), 'data', 'peterson-db.json');
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'peterson-data') : path.resolve(process.cwd(), 'data');
const DB_FILE_PROD = path.join(DATA_DIR, 'peterson-db.json');
const DB_FILE_HOMOLOG = path.join(DATA_DIR, 'peterson-db-homolog.json');
const ADMIN_AUTH_FILE = path.join(DATA_DIR, 'admin-auth.secret.json');
const SQL_SCHEMA_FILE = path.resolve(process.cwd(), 'supabase-schema.sql');
const INSTAGRAM_PUBLIC_DIR = path.resolve(process.cwd(), 'public', 'instagram');

export type AppEnvironment = 'homologacao' | 'producao';

function resolveEnv(req?: Request): AppEnvironment {
  if (!req) return 'producao';
  const headerEnv = String(req.headers['x-peterson-env'] || '').toLowerCase().trim();
  const queryEnv = String(req.query?.env || '').toLowerCase().trim();
  if (headerEnv === 'homologacao' || queryEnv === 'homologacao') {
    return 'homologacao';
  }
  return 'producao';
}

export interface AnalyticsEventItem {
  id: string;
  type: 'VISITA' | 'PRODUTO' | 'SACOLA' | 'WHATSAPP';
  label: string;
  source: string;
  timestamp: string;
}

export interface AnalyticsData {
  totalVisits: number;
  uniqueVisitorsCount: number;
  visitorIds: string[];
  dailyVisits: Record<string, number>;
  sources: {
    google: number;
    instagram: number;
    whatsapp: number;
    direto: number;
  };
  productViews: Record<string, { sku: string; name: string; count: number }>;
  whatsappClicks: number;
  cartAdditions: number;
  recentEvents: AnalyticsEventItem[];
}

interface DatabaseSchema {
  products: BespokeProduct[];
  customers: CustomerRecord[];
  orders: BespokeOrder[];
  payments: PaymentRecord[];
  settings: StoreSettings;
  analytics?: AnalyticsData;
}

function createEmptyAnalytics(): AnalyticsData {
  return {
    totalVisits: 0,
    uniqueVisitorsCount: 0,
    visitorIds: [],
    dailyVisits: {},
    sources: {
      google: 0,
      instagram: 0,
      whatsapp: 0,
      direto: 0,
    },
    productViews: {},
    whatsappClicks: 0,
    cartAdditions: 0,
    recentEvents: [],
  };
}

const STANDARD_SIZES = [34, 35, 36, 37, 38, 39];

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Payload estático oficial decodificado do QR Code do Banco Inter (CNPJ 50.789.636/0001-32 — 50789636 JACKELINE GOMES PETERSON)
const BANCO_INTER_OFFICIAL_BRCODE =
  '00020101021126360014br.gov.bcb.pix0114507896360001325204000053039865802BR5912SONHO ANIMAL6007GOIANIA62070503***63049D03';

function generateMercadoPagoPixPayload(_amount: number, _reference: string, _pixKey: string): string {
  return BANCO_INTER_OFFICIAL_BRCODE;
}

/**
 * Monta as cores padrão oficiais da Peterson Shoes em todos os modelos:
 * Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa + Outra Cor (Personalizada)
 * Mantendo as fotos reais do Instagram associadas às cores correspondentes de cada post.
 */
function buildStandardColors(
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
      'Preto' | 'Branco' | 'Marsala' | 'Nude' | 'Dourado' | 'Prata' | 'Vermelho' | 'Rosa',
      string
    >
  > = {}
): ColorOption[] {
  const basePalette: {
    name: 'Preto' | 'Branco' | 'Marsala' | 'Nude' | 'Dourado' | 'Prata' | 'Vermelho' | 'Rosa';
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

  // Coloca a cor da capa do post em primeiro lugar para que a foto principal do card corresponda ao 1º círculo
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

export const INITIAL_PRODUCTS: BespokeProduct[] = [
  // 1. POST 1 (C454LXbOzrn Slide 1) — Papete Flatform Pirâmides & Fivela (Dourada) — R$ 130,00
  {
    id: 'prod-ig-01-papete-piramides',
    sku: 'PTS-IG-01',
    name: 'Papete Flatform Pirâmides & Fivela (Dourada)',
    subtitle: 'Bico Quadrado Anatômico com Pirâmides Espelhadas & Pulseira no Tornozelo',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Cromadas & Fivela Prata'],
    colors: buildStandardColors('Dourado', '/instagram/feed_1_C454LXbOzrn_slide_1.jpg', {
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 2. POST 8 Parte A (C4Tc5OnpB_L Slide 1) — Anabela Plataforma Pirâmides & Fivela (Preta) — R$ 150,00
  {
    id: 'prod-ig-02-anabela-piramides-fivela',
    sku: 'PTS-IG-02',
    name: 'Anabela Plataforma Pirâmides & Fivela (Preta)',
    subtitle: 'Plataforma Alta Bico Quadrado com Tiras em Pirâmides & Fechamento por Fivela',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Cromada'],
    colors: buildStandardColors('Preto', '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg', {
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 3. POST 8 Parte B (C4Tc5OnpB_L Slide 6) — Anabela Plataforma Pirâmides Gladiadora (Dourada) — R$ 150,00
  {
    id: 'prod-ig-03-anabela-piramides-amarracao',
    sku: 'PTS-IG-03',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Dourada)',
    subtitle: 'Plataforma Alta Bico Quadrado com Pirâmides & Amarração Lace-Up na Perna',
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
    strapFinishes: ['Pirâmides Douradas & Ponteiras Ouro', 'Pirâmides Prata & Ponteiras Prata'],
    colors: buildStandardColors('Dourado', '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg', {
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 4. POST 9 (C4Tc1qCpAdX Slide 1) — Papete Flatform Tratorada Strass & Amarração (Off-White) — R$ 130,00
  {
    id: 'prod-ig-04-papete-tratorada-strass',
    sku: 'PTS-IG-04',
    name: 'Papete Flatform Tratorada Strass & Amarração (Off-White)',
    subtitle: 'Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarração Nó Frontal',
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
    colors: buildStandardColors('Branco', '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg', {
      Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Nude: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Esferas (Dourada) — R$ 150,00
  {
    id: 'prod-ig-05-anabela-trancada-gold',
    sku: 'PTS-IG-05',
    name: 'Anabela Plataforma Trançada Esferas (Dourada)',
    subtitle: 'Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela',
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
    colors: buildStandardColors('Dourado', '/instagram/feed_5_C4539VxO5om_slide_1.jpg', {
      Dourado: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 6. POST 10 (C4Tcs31JPdl Slide 1) — Flatform Gladiadora Tiras Cruzadas Strass (Dourada) — R$ 130,00
  {
    id: 'prod-ig-06-flatform-amarracao-strass',
    sku: 'PTS-IG-06',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass (Dourada)',
    subtitle: 'Flatform Anatômica com Vira de Strass, Tiras Finas Brilhantes & Amarração Gladiadora',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    gallery: [
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tcs31JPdl/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Dourado & Vira Brilhante', 'Strass Prata Cristal'],
    colors: buildStandardColors('Dourado', '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg', {
      Dourado: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      Branco: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      Prata: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 7. POST 11 (C4TcpFaJ9ll Slide 1) — Papete Flatform Espelhada Tiras Strass (Prata) — R$ 130,00
  {
    id: 'prod-ig-07-papete-metalizada-transpassada',
    sku: 'PTS-IG-07',
    name: 'Papete Flatform Espelhada Tiras Strass (Prata)',
    subtitle: 'Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    gallery: [
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcpFaJ9ll/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Cristal & Fivela Prata', 'Strass Champagne & Fivela Ouro'],
    colors: buildStandardColors('Prata', '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg', {
      Prata: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      Dourado: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 8. POST 7 (C4ayCqZteae) — Flatform Normal Tira de Dedo Strass Duo — R$ 110,00
  {
    id: 'prod-ig-08-papete-dos-sonhos-strass',
    sku: 'PTS-IG-08',
    name: 'Flatform Tira de Dedo Strass Duo (Dourada & Prata)',
    subtitle: 'Flatform Normal Bico Quadrado com Tiras de Dedo e Peito do Pé Cravejadas em Strass',
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
    colors: buildStandardColors('Dourado', '/instagram/feed_7_C4ayCqZteae_main.jpg', {
      Dourado: '/instagram/feed_7_C4ayCqZteae_main.jpg',
      Prata: '/instagram/feed_7_C4ayCqZteae_main.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 9. POST 12 (C4TcmhYpO8_) — Flatform Normal Slide Tira de Dedo Nó em Strass — R$ 110,00
  {
    id: 'prod-ig-09-chinelo-flatform-no-strass',
    sku: 'PTS-IG-09',
    name: 'Flatform Slide Tira de Dedo Nó em Strass',
    subtitle: 'Flatform Normal Anatômica Macia com Tiras Revestidas em Manta de Strass e Nó',
    category: 'Flatforms & Papetes',
    price: 109.9,
    image: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
    gallery: ['/instagram/feed_12_C4TcmhYpO8__main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcmhYpO8_/',
    heelOptions: ['Solado Anatômico 3,5cm', 'Solado Conforto 2,5cm'],
    strapFinishes: ['Manta de Strass Cristal c/ Nó Central', 'Manta de Strass Dourado'],
    colors: buildStandardColors('Nude', '/instagram/feed_12_C4TcmhYpO8__main.jpg', {
      Nude: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      Preto: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      Branco: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Conforto absoluto nos pés com o glamour da manta de strass! Nossa Flatform Normal Slide com nó central do Instagram @petersonshoes_ é confeccionado em todas as cores padrão ou sob encomenda na cor que você desejar.',
    craftDetails: [
      'Palmilha anatômica tipo nuvem de altíssima maciez (34 ao 39 BR)',
      'Tiras revestidas em manta de strass com forro interno suave',
      'Ideal para varejo ou pedidos em atacado (a partir de 6 pares)',
    ],
    createdAt: new Date().toISOString(),
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
    colors: buildStandardColors('Branco', '/instagram/feed_2_C454HJKO2oG_main.jpg', {
      Branco: '/instagram/feed_2_C454HJKO2oG_main.jpg',
    }),
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
    createdAt: new Date().toISOString(),
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
    colors: buildStandardColors('Prata', '/instagram/feed_4_C454A4GujcN_slide_1.jpg', {
      Prata: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Anabela Tamanco Plataforma Trançado Nó — R$ 150,00
  {
    id: 'prod-ig-12-tamanco-plataforma-no',
    sku: 'PTS-IG-12',
    name: 'Anabela Tamanco Plataforma Trançado c/ Nó (Off-White)',
    subtitle: 'Anabela Plataforma Alta Revestida em Trama Artesanal & Tira Larga com Nó Central',
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
    colors: buildStandardColors('Branco', '/instagram/feed_6_C45360nuL6q_slide_1.jpg', {
      Branco: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      Nude: '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 13. POST 3 (C454E0zuuFv Slide 1) — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Dourada) — R$ 100,00
  {
    id: 'prod-ig-13-rasteira-medalhao-esferas',
    sku: 'PTS-IG-13',
    name: 'Rasteira Esferas & Medalhão Metalizada (Dourada)',
    subtitle: 'Rasteira de Dedo com Tachas Esféricas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    gallery: [
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454E0zuuFv/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: ['Esferas & Medalhões Dourados', 'Esferas & Medalhões Prateados'],
    colors: buildStandardColors('Dourado', '/instagram/feed_3_C454E0zuuFv_slide_1.jpg', {
      Dourado: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      Prata: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 14. POST 1 Slide 4 — Papete Flatform Pirâmides Black & Gold (Preta) — R$ 130,00
  {
    id: 'prod-ig-14-papete-piramides-preta',
    sku: 'PTS-IG-14',
    name: 'Papete Flatform Pirâmides Black & Gold (Preta)',
    subtitle: 'Edição Preta com Pirâmides Douradas Espelhadas & Solado Anatômico',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Dourada', 'Pirâmides Prata & Fivela Prata'],
    colors: buildStandardColors('Preto', '/instagram/feed_1_C454LXbOzrn_slide_4.jpg', {
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 15. POST 8 Slide 2 — Anabela Plataforma Pirâmides & Fivela (Nude Rosé) — R$ 150,00
  {
    id: 'prod-ig-15-anabela-piramides-nude',
    sku: 'PTS-IG-15',
    name: 'Anabela Plataforma Pirâmides & Fivela (Nude Rosé)',
    subtitle: 'Edição Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado',
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
    strapFinishes: ['Fivela no Tornozelo (Foto 1)', 'Amarração Gladiadora (Foto 2)'],
    colors: buildStandardColors('Nude', '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg', {
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 16. POST 1 Slide 2 — Papete Flatform Pirâmides & Fivela (Off-White / Nude) — R$ 130,00
  {
    id: 'prod-ig-16-papete-piramides-nude',
    sku: 'PTS-IG-16',
    name: 'Papete Flatform Pirâmides & Fivela (Off-White / Nude)',
    subtitle: 'Palmilha Anatômica Off-White com Pirâmides Douradas & Fivela Ajustável',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Prata'],
    colors: buildStandardColors('Nude', '/instagram/feed_1_C454LXbOzrn_slide_2.jpg', {
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 17. POST 1 Slide 3 — Papete Flatform Pirâmides & Fivela (Prata Metalizada) — R$ 130,00
  {
    id: 'prod-ig-17-papete-piramides-prata',
    sku: 'PTS-IG-17',
    name: 'Papete Flatform Pirâmides & Fivela (Prata)',
    subtitle: 'Acabamento Metalizado Prata com Pirâmides Espelhadas & Pulseira no Tornozelo',
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
    strapFinishes: ['Pirâmides Cromadas & Fivela Prata', 'Pirâmides Douradas & Fivela Ouro'],
    colors: buildStandardColors('Prata', '/instagram/feed_1_C454LXbOzrn_slide_3.jpg', {
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 18. POST 3 Slide 2 — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Prata) — R$ 100,00
  {
    id: 'prod-ig-18-rasteira-medalhao-prata',
    sku: 'PTS-IG-18',
    name: 'Rasteira Esferas & Medalhão Metalizada (Prata)',
    subtitle: 'Rasteira de Dedo Prateada com Esferas Cromadas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 99.9,
    image: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    gallery: [
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454E0zuuFv/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: ['Esferas & Medalhões Prateados', 'Esferas & Medalhões Dourados'],
    colors: buildStandardColors('Prata', '/instagram/feed_3_C454E0zuuFv_slide_2.jpg', {
      Prata: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
      Dourado: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 19. POST 8 Slide 3 — Anabela Plataforma Pirâmides & Fivela (Prata Champagne) — R$ 150,00
  {
    id: 'prod-ig-19-anabela-piramides-prata',
    sku: 'PTS-IG-19',
    name: 'Anabela Plataforma Pirâmides & Fivela (Prata Champagne)',
    subtitle: 'Plataforma Alta Metalizada com Tachas Piramidais & Fivela no Tornozelo',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Cromada'],
    colors: buildStandardColors('Prata', '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg', {
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 20. POST 8 Slide 4 — Anabela Plataforma Pirâmides & Fivela (Dourada) — R$ 150,00
  {
    id: 'prod-ig-20-anabela-piramides-dourada',
    sku: 'PTS-IG-20',
    name: 'Anabela Plataforma Pirâmides & Fivela (Dourada)',
    subtitle: 'Edição Ouro Metalizado com Pirâmides Douradas & Pulseira de Fivela',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Cromada'],
    colors: buildStandardColors('Dourado', '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg', {
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 21. POST 8 Slide 5 — Anabela Plataforma Pirâmides & Fivela (Branca) — R$ 150,00
  {
    id: 'prod-ig-21-anabela-piramides-branca',
    sku: 'PTS-IG-21',
    name: 'Anabela Plataforma Pirâmides & Fivela (Branca)',
    subtitle: 'Edição Branca com Tachas Piramidais Douradas & Bico Quadrado Moderno',
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
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Cromada'],
    colors: buildStandardColors('Branco', '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg', {
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 22. POST 8 Slide 7 — Anabela Plataforma Pirâmides Gladiadora (Nude Rosé) — R$ 150,00
  {
    id: 'prod-ig-22-anabela-gladiadora-nude',
    sku: 'PTS-IG-22',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Nude Rosé)',
    subtitle: 'Anabela Bico Quadrado Nude Rosé com Pirâmides Douradas & Amarração na Perna',
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
    strapFinishes: ['Pirâmides Douradas & Ponteiras Ouro', 'Pirâmides Prata & Ponteiras Prata'],
    colors: buildStandardColors('Nude', '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg', {
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 23. POST 8 Slide 8 — Anabela Plataforma Pirâmides Gladiadora (Prata) — R$ 150,00
  {
    id: 'prod-ig-23-anabela-gladiadora-prata',
    sku: 'PTS-IG-23',
    name: 'Anabela Plataforma Pirâmides Gladiadora (Prata)',
    subtitle: 'Anabela Metalizada Prata com Tachas Piramidais & Amarração Gladiadora',
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
    strapFinishes: ['Pirâmides Prata & Ponteiras Prata', 'Pirâmides Douradas & Ponteiras Ouro'],
    colors: buildStandardColors('Prata', '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg', {
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 24. POST 9 Slide 2 — Papete Flatform Tratorada Strass & Amarração (Preta Onix) — R$ 130,00
  {
    id: 'prod-ig-24-papete-tratorada-preta',
    sku: 'PTS-IG-24',
    name: 'Papete Flatform Tratorada Strass & Amarração (Preta)',
    subtitle: 'Solado Tratorado Preto com Vira de Strass Cristal & Amarração Nó Central',
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
    colors: buildStandardColors('Preto', '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg', {
      Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 25. POST 9 Slide 3 — Papete Flatform Tratorada Strass & Amarração (Dourada) — R$ 130,00
  {
    id: 'prod-ig-25-papete-tratorada-dourada',
    sku: 'PTS-IG-25',
    name: 'Papete Flatform Tratorada Strass & Amarração (Dourada)',
    subtitle: 'Edição Dourada Metalizada com Tiras Duplas de Strass & Solado Tratorado',
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
    colors: buildStandardColors('Dourado', '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg', {
      Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
      Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 26. POST 10 Slide 2 — Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata) — R$ 130,00
  {
    id: 'prod-ig-26-flatform-gladiadora-branca',
    sku: 'PTS-IG-26',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata)',
    subtitle: 'Flatform Gladiadora Branca com Tiras Finas em Strass Cristal & Vira Cravejada',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    gallery: [
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tcs31JPdl/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Prata Cristal & Vira Brilhante', 'Strass Dourado'],
    colors: buildStandardColors('Branco', '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg', {
      Branco: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      Prata: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      Dourado: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },

  // 27. POST 11 Slide 2 — Papete Flatform Espelhada Tiras Strass (Dourado Champagne) — R$ 130,00
  {
    id: 'prod-ig-27-papete-espelhada-dourada',
    sku: 'PTS-IG-27',
    name: 'Papete Flatform Espelhada Tiras Strass (Dourado Champagne)',
    subtitle: 'Palmilha Espelhada Champagne com Tiras Transpassadas em Strass & Fivela',
    category: 'Flatforms & Papetes',
    price: 129.9,
    image: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    gallery: [
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcpFaJ9ll/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Champagne & Fivela Ouro', 'Strass Cristal & Fivela Prata'],
    colors: buildStandardColors('Dourado', '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg', {
      Dourado: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      Prata: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    }),
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
    createdAt: new Date().toISOString(),
  },
];

// Create real Mercado Pago Pix payment if MERCADO_PAGO_ACCESS_TOKEN is configured and live charges enabled
async function createMercadoPagoPixPayment(params: {
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  externalReference: string;
  pixKey: string;
  liveEnabled: boolean;
}): Promise<{
  pixCopyPaste: string;
  mpReferenceId: string;
  sandboxMode: boolean;
}> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (params.liveEnabled && token && token !== 'MY_MERCADO_PAGO_ACCESS_TOKEN') {
    try {
      const cleanCpf = params.payerCpf.replace(/\D/g, '');
      const nameParts = params.payerName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'PetersonShoes';

      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          transaction_amount: Number(params.amount.toFixed(2)),
          description: params.description,
          payment_method_id: 'pix',
          external_reference: params.externalReference,
          payer: {
            email: params.payerEmail || 'cliente@petersonshoes.com.br',
            first_name: firstName,
            last_name: lastName,
            ...(cleanCpf.length === 11
              ? {
                  identification: {
                    type: 'CPF',
                    number: cleanCpf,
                  },
                }
              : {}),
          },
        }),
      });

      if (mpRes.ok) {
        const mpData: any = await mpRes.json();
        const qrCode =
          mpData?.point_of_interaction?.transaction_data?.qr_code ||
          generateMercadoPagoPixPayload(params.amount, params.externalReference, params.pixKey);
        return {
          pixCopyPaste: qrCode,
          mpReferenceId: `MP-LIVE-${mpData.id || Date.now()}`,
          sandboxMode: false,
        };
      }
    } catch (err) {
      console.error('Aviso: Falha ao chamar API Mercado Pago ao vivo, usando BRCode Pix direto:', err);
    }
  }

  return {
    pixCopyPaste: generateMercadoPagoPixPayload(
      params.amount,
      params.externalReference,
      params.pixKey
    ),
    mpReferenceId: `MP-PIX-${Date.now().toString().slice(-7)}`,
    sandboxMode: !params.liveEnabled,
  };
}

function createInitialDatabase(): DatabaseSchema {
  const order1Date = new Date(Date.now() - 6 * 86400000).toISOString();
  const order1Est = addDaysISO(9);
  const order2Date = new Date(Date.now() - 14 * 86400000).toISOString();
  const order2Est = addDaysISO(1);

  const settings: StoreSettings = {
    storeName: 'PETERSON SHOES',
    instagramUrl: 'https://www.instagram.com/petersonshoes_/',
    whatsappStore: process.env.WHATSAPP_STORE_NUMBER || '5562984998265',
    whatsappFactory: process.env.WHATSAPP_FACTORY_NUMBER || '5562984998265',
    productionDays: 15,
    depositPercentage: 50,
    creditCardFeePercentage: 4.99,
    mercadoPagoLiveEnabled: process.env.MERCADO_PAGO_LIVE_CHARGES_ENABLED === 'true',
    pixKey: '50.789.636/0001-32',
    pixKeyType: 'CNPJ',
    bankName: 'Inter',
    bankHolderName: '50789636 JACKELINE GOMES PETERSON',
    bankHolderDoc: '50.789.636/0001-32',
    bankAgency: '',
    bankAccount: '',
    cardPaymentLink: '',
  };

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
      pixCopyPaste: generateMercadoPagoPixPayload(65, 'PTS2026101E', settings.pixKey),
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
      pixCopyPaste: generateMercadoPagoPixPayload(65, 'PTS2026101F', settings.pixKey),
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
      pixCopyPaste: generateMercadoPagoPixPayload(75, 'PTS2026102E', settings.pixKey),
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
      pixCopyPaste: generateMercadoPagoPixPayload(75, 'PTS2026102F', settings.pixKey),
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
      shippingAddress: 'Av. T-63, 1420, Apto 82 - Setor Bueno, Goiânia/GO - CEP 74150-040',
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
      shippingAddress: 'Rua 1136, 615, Casa 2 - Setor Marista, Goiânia/GO - CEP 74810-100',
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
    products: STORE_INITIAL_PRODUCTS,
    customers,
    orders,
    payments,
    settings,
    analytics: createEmptyAnalytics(),
  };
}

function getDbFilePath(env: AppEnvironment): string {
  return env === 'homologacao' ? DB_FILE_HOMOLOG : DB_FILE_PROD;
}

function loadDb(env: AppEnvironment = 'producao'): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const targetFile = getDbFilePath(env);
  if (!fs.existsSync(targetFile)) {
    if (fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        fs.copyFileSync(BUNDLED_DB_FILE, targetFile);
      } catch {
        // Fallback to initial database creation below
      }
    }
    if (!fs.existsSync(targetFile)) {
      const initial = createInitialDatabase();
      fs.writeFileSync(targetFile, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }
  try {
    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;

    const needsUpgrade =
      !parsed.products ||
      parsed.products.length < 54 ||
      parsed.settings?.whatsappStore !== '5562984998265' ||
      parsed.products[0]?.availableSizes?.includes(33) ||
      !parsed.products[0]?.colors?.some((c) => c.name === 'Marsala');

    if (needsUpgrade) {
      const upgraded = createInitialDatabase();
      if (parsed.orders && parsed.orders.length > 0) {
        upgraded.orders = parsed.orders;
      }
      if (parsed.customers && parsed.customers.length > 0) {
        upgraded.customers = parsed.customers;
      }
      if (parsed.payments && parsed.payments.length > 0) {
        upgraded.payments = parsed.payments;
      }
      if (parsed.analytics) {
        upgraded.analytics = parsed.analytics;
      }
      fs.writeFileSync(targetFile, JSON.stringify(upgraded, null, 2), 'utf-8');
      return upgraded;
    }

    // Apply owner-authorized Option A psychological pricing (.90) across existing integer tiers
    // while keeping PTS-IG-47..54 at 149.90 and preserving all manufacturing costs & additional expenses
    const scarpinSkus = new Set([
      'PTS-IG-47',
      'PTS-IG-48',
      'PTS-IG-49',
      'PTS-IG-50',
      'PTS-IG-51',
      'PTS-IG-52',
      'PTS-IG-53',
      'PTS-IG-54',
    ]);
    const optionAMap: Record<number, number> = {
      150: 149.9,
      130: 129.9,
      110: 109.9,
      100: 99.9,
    };
    let batchUpdated = false;
    parsed.products = parsed.products.map((prod) => {
      let targetPrice: number | null = null;
      if (scarpinSkus.has(prod.sku) && (prod.price === 130 || prod.price === 129.9)) {
        targetPrice = 149.9;
      } else if (optionAMap[prod.price] !== undefined) {
        targetPrice = optionAMap[prod.price];
      }

      if (targetPrice !== null) {
        batchUpdated = true;
        const mCost = Number(prod.manufacturingCost) || 0;
        const extraExp = Number(prod.additionalExpenses) || 0;
        const totalCost = Math.round((mCost + extraExp) * 100) / 100;
        const gProfit = Math.round((targetPrice - totalCost) * 100) / 100;
        const pMargin = Math.round((gProfit / targetPrice) * 10000) / 100;
        return {
          ...prod,
          price: targetPrice,
          grossProfit: mCost > 0 || extraExp > 0 ? gProfit : prod.grossProfit,
          profitMarginPercent:
            mCost > 0 || extraExp > 0 ? pMargin : prod.profitMarginPercent,
        };
      }
      return prod;
    });
    if (batchUpdated) {
      fs.writeFileSync(targetFile, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    parsed.settings = {
      ...parsed.settings,
      bankName: 'Inter',
      bankHolderName: '50789636 JACKELINE GOMES PETERSON',
      bankHolderDoc: '50.789.636/0001-32',
      pixKeyType: 'CNPJ',
      pixKey: '50.789.636/0001-32',
    };

    if (!parsed.analytics) {
      parsed.analytics = createEmptyAnalytics();
    } else {
      parsed.analytics.sources = parsed.analytics.sources || {
        google: 0,
        instagram: 0,
        whatsapp: 0,
        direto: 0,
      };
      parsed.analytics.dailyVisits = parsed.analytics.dailyVisits || {};
      parsed.analytics.productViews = parsed.analytics.productViews || {};
      parsed.analytics.visitorIds = parsed.analytics.visitorIds || [];
      parsed.analytics.recentEvents = parsed.analytics.recentEvents || [];
    }

    return parsed;
  } catch (err) {
    console.error(`Erro ao ler banco de dados (${env}), recriando estado inicial:`, err);
    const initial = createInitialDatabase();
    fs.writeFileSync(targetFile, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDb(data: DatabaseSchema, env: AppEnvironment = 'producao'): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const targetFile = getDbFilePath(env);
  fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// HARDENED ADMIN AUTHENTICATION (No hardcoded passwords, no bypass tokens)
// ============================================================================

interface StoredAdminCredentials {
  email: string;
  salt: string;
  passwordHash: string;
  sessionSecret: string;
  updatedAt: string;
}

const activeAdminSessions = new Map<string, { email: string; expiresAt: number }>();
const loginRateLimiter = new Map<string, { count: number; resetAt: number }>();

function loadStoredAdminCredentials(): StoredAdminCredentials | null {
  try {
    if (fs.existsSync(ADMIN_AUTH_FILE)) {
      const raw = fs.readFileSync(ADMIN_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoredAdminCredentials;
      if (parsed && parsed.passwordHash && parsed.salt) {
        return parsed;
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function hasEnvAdminPassword(): boolean {
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  return envPass.length >= 6;
}

function isAdminConfigured(): boolean {
  return hasEnvAdminPassword() || Boolean(loadStoredAdminCredentials());
}

function hashPasswordWithSalt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

function verifyAdminCredentials(emailInput: string, passwordInput: string): { ok: boolean; email: string } {
  const cleanPassword = String(passwordInput || '');
  const cleanEmail = String(emailInput || '').trim().toLowerCase();

  if (!cleanPassword) {
    return { ok: false, email: '' };
  }

  // 1. Check environment variables if configured
  if (hasEnvAdminPassword()) {
    const expectedPass = String(process.env.ADMIN_PASSWORD).trim();
    const expectedEmail = (process.env.ADMIN_EMAIL || 'contato@petersonshoes.com.br').trim().toLowerCase();
    const passBufA = Buffer.from(cleanPassword);
    const passBufB = Buffer.from(expectedPass);
    const passMatches =
      passBufA.length === passBufB.length && crypto.timingSafeEqual(passBufA, passBufB);
    const emailMatches = !cleanEmail || cleanEmail === expectedEmail;
    return {
      ok: passMatches && emailMatches,
      email: expectedEmail,
    };
  }

  // 2. Check hashed credentials file
  const stored = loadStoredAdminCredentials();
  if (stored) {
    const computedHash = hashPasswordWithSalt(cleanPassword, stored.salt);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(stored.passwordHash, 'hex');
    const passMatches = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
    const emailMatches = !cleanEmail || cleanEmail === stored.email.toLowerCase();
    return {
      ok: passMatches && emailMatches,
      email: stored.email,
    };
  }

  return { ok: false, email: '' };
}

function issueAdminSessionToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 12-hour session expiration
  activeAdminSessions.set(token, {
    email,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  });
  return token;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token administrativo ausente.' });
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado: Token administrativo vazio.' });
  }

  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão administrativa inválida ou expirada. Faça login novamente.' });
  }

  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return res.status(401).json({ error: 'Sessão administrativa expirada. Faça login novamente.' });
  }

  next();
}

export const app = express();
app.use(express.json({ limit: '12mb' }));

// Normalize rewritten Vercel Serverless paths (/api/(.*) -> /api/index.js?__path=$1)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const rewrittenPath = req.query?.__path;
  if (typeof rewrittenPath === 'string' && rewrittenPath.length > 0) {
    const cleanTarget = `/api/${rewrittenPath.replace(/^\/+/, '')}`;
    if (!req.url.startsWith(cleanTarget)) {
      const qIndex = req.url.indexOf('?');
      const rawQuery = qIndex >= 0 ? req.url.slice(qIndex + 1) : '';
      const params = new URLSearchParams(rawQuery);
      params.delete('__path');
      const qs = params.toString();
      req.url = `${cleanTarget}${qs ? `?${qs}` : ''}`;
    }
  }
  next();
});

function registerApiRoutes() {

  // Ensure both Production and Homologation DBs exist on startup, completely isolated
  loadDb('producao');
  loadDb('homologacao');

  // ==========================================================================
  // GOOGLE SEO ENDPOINTS (robots.txt & sitemap.xml with Image Sitemap)
  // ==========================================================================

  const OFFICIAL_PUBLIC_DOMAIN = 'https://peterson-shoes.vercel.app';

  const resolveBaseUrl = (_req: Request): string => {
    return OFFICIAL_PUBLIC_DOMAIN;
  };

  app.get(['/robots.txt', '/api/robots.txt'], (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const robotsTxt = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/admin/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robotsTxt);
  });

  app.get(['/sitemap.xml', '/api/sitemap.xml'], (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const db = loadDb();
    const activeProducts = db.products.filter((p) => p.active);
    const today = new Date().toISOString().split('T')[0];

    const escapeXml = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const productUrlsXml = activeProducts
      .map((p) => {
        const imageFullUrl = p.image.startsWith('http')
          ? p.image
          : `${baseUrl}${p.image.startsWith('/') ? '' : '/'}${p.image}`;
        return `  <url>
    <loc>${escapeXml(`${baseUrl}/?modelo=${encodeURIComponent(p.sku)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${escapeXml(imageFullUrl)}</image:loc>
      <image:title>${escapeXml(`${p.name} - Peterson Shoes Goiânia`)}</image:title>
      <image:caption>${escapeXml(`${p.subtitle} | Numeração 34 ao 39 BR | R$ ${p.price.toFixed(2)}`)}</image:caption>
    </image:image>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${escapeXml(`${baseUrl}/`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Scarpins+%26+Saltos`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Flatforms+%26+Papetes`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Anabelas+%26+Plataformas`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Rasteiras+%26+Gladiadoras`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${productUrlsXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  // ==========================================================================
  // PUBLIC STOREFRONT ENDPOINTS
  // ==========================================================================

  app.get('/api/products', (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const activeProducts = db.products.filter((p) => p.active);
    res.json(activeProducts);
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    res.json({
      ...db.settings,
      creditCardFeePercentage: db.settings.creditCardFeePercentage ?? 4.99,
      supabaseConfigured: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      environment: env,
    });
  });

  // Public Visitor & Product Click Analytics Tracker
  app.post('/api/analytics/event', (req: Request, res: Response) => {
    try {
      const env = resolveEnv(req);
      const db = loadDb(env);
      if (!db.analytics) {
        db.analytics = createEmptyAnalytics();
      }
      const {
        type,
        visitorId,
        referrer,
        productId,
        productSku,
        productName,
        label,
      } = req.body as {
        type?: 'VISITA' | 'PRODUTO' | 'SACOLA' | 'WHATSAPP';
        visitorId?: string;
        referrer?: string;
        productId?: string;
        productSku?: string;
        productName?: string;
        label?: string;
      };

      const refLower = String(referrer || '').toLowerCase();
      let sourceKey: 'google' | 'instagram' | 'whatsapp' | 'direto' = 'direto';
      let sourceLabel = 'Acesso Direto / Link';
      if (refLower.includes('google.')) {
        sourceKey = 'google';
        sourceLabel = 'Busca do Google';
      } else if (refLower.includes('instagram.') || refLower.includes('ig')) {
        sourceKey = 'instagram';
        sourceLabel = 'Instagram (@petersonshoes_)';
      } else if (refLower.includes('whatsapp') || refLower.includes('wa.me')) {
        sourceKey = 'whatsapp';
        sourceLabel = 'WhatsApp';
      }

      const todayKey = new Date().toISOString().split('T')[0];

      if (type === 'VISITA') {
        db.analytics.totalVisits = (db.analytics.totalVisits || 0) + 1;
        db.analytics.dailyVisits[todayKey] = (db.analytics.dailyVisits[todayKey] || 0) + 1;
        db.analytics.sources[sourceKey] = (db.analytics.sources[sourceKey] || 0) + 1;

        if (visitorId && !db.analytics.visitorIds.includes(visitorId)) {
          db.analytics.visitorIds.push(visitorId);
          if (db.analytics.visitorIds.length > 3000) {
            db.analytics.visitorIds = db.analytics.visitorIds.slice(-3000);
          }
          db.analytics.uniqueVisitorsCount = (db.analytics.uniqueVisitorsCount || 0) + 1;
        }
      } else if (type === 'PRODUTO' && (productId || productSku)) {
        const key = String(productSku || productId);
        const existing = db.analytics.productViews[key] || {
          sku: String(productSku || key),
          name: String(productName || 'Sandália Peterson Shoes'),
          count: 0,
        };
        existing.count += 1;
        if (productName) existing.name = productName;
        db.analytics.productViews[key] = existing;
      } else if (type === 'SACOLA') {
        db.analytics.cartAdditions = (db.analytics.cartAdditions || 0) + 1;
      } else if (type === 'WHATSAPP') {
        db.analytics.whatsappClicks = (db.analytics.whatsappClicks || 0) + 1;
      }

      const eventItem: AnalyticsEventItem = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: type || 'VISITA',
        label:
          label ||
          (type === 'PRODUTO'
            ? `Visualizou ${productName || productSku || 'sandália'}`
            : type === 'SACOLA'
            ? `Adicionou ${productName || 'sandália'} à sacola`
            : type === 'WHATSAPP'
            ? 'Clicou para atendimento no WhatsApp'
            : 'Acessou a loja online'),
        source: sourceLabel,
        timestamp: new Date().toISOString(),
      };

      db.analytics.recentEvents = [eventItem, ...(db.analytics.recentEvents || [])].slice(0, 40);
      saveDb(db, env);
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  // Create new bespoke order with automated 50% deposit + 50% final installment
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const env = resolveEnv(req);
      const db = loadDb(env);
      const {
        customerName,
        customerEmail,
        customerWhatsapp,
        customerCpf,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        items,
      } = req.body;

      if (!customerName || !customerWhatsapp || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Por favor, preencha nome, WhatsApp e adicione ao menos uma sandália.',
        });
      }

      const totalAmount = items.reduce(
        (acc: number, item: any) => acc + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
      const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;

      // Upsert customer record
      let customer = db.customers.find(
        (c) =>
          (customerCpf &&
            c.cpf.replace(/\D/g, '') === String(customerCpf).replace(/\D/g, '')) ||
          c.whatsapp.replace(/\D/g, '') === String(customerWhatsapp).replace(/\D/g, '')
      );

      if (customer) {
        customer.name = customerName;
        customer.email = customerEmail || customer.email;
        customer.whatsapp = customerWhatsapp;
        customer.cep = cep || customer.cep;
        customer.street = street || customer.street;
        customer.number = number || customer.number;
        customer.complement = complement ?? customer.complement;
        customer.neighborhood = neighborhood || customer.neighborhood;
        customer.city = city || customer.city;
        customer.state = state || customer.state;
        customer.totalOrders += 1;
        customer.totalSpent += totalAmount;
      } else {
        customer = {
          id: `cust-${Date.now()}`,
          name: customerName,
          email: customerEmail || '',
          whatsapp: customerWhatsapp,
          cpf: customerCpf || '',
          cep: cep || '',
          street: street || '',
          number: number || '',
          complement: complement || '',
          neighborhood: neighborhood || '',
          city: city || '',
          state: state || '',
          totalOrders: 1,
          totalSpent: totalAmount,
          createdAt: new Date().toISOString(),
        };
        db.customers.unshift(customer);
      }

      const orderNumber = 101 + db.orders.length;
      const orderCode =
        env === 'homologacao' ? `PTS-HML-${orderNumber}` : `PTS-2026-${orderNumber}`;
      const orderId = `ord-${Date.now()}`;
      const productionDays = db.settings.productionDays || 15;
      const estimatedDeliveryDate = addDaysISO(productionDays);

      const shippingAddress = `${street}, ${number}${complement ? ` (${complement})` : ''} - ${neighborhood}, ${city}/${state} - CEP ${cep}`;

      // Em Homologação, cobranças externas nunca são disparadas
      const allowLiveCharges = env === 'producao' && db.settings.mercadoPagoLiveEnabled;

      const [mpDeposit, mpFinal] = await Promise.all([
        createMercadoPagoPixPayment({
          amount: depositAmount,
          description: `Peterson Shoes - Entrada 50% Pedido ${orderCode}`,
          payerEmail: customerEmail || 'cliente@petersonshoes.com.br',
          payerName: customerName,
          payerCpf: customerCpf || '',
          externalReference: `${orderCode}E`,
          pixKey: db.settings.pixKey || '50.789.636/0001-32',
          liveEnabled: allowLiveCharges,
        }),
        createMercadoPagoPixPayment({
          amount: remainingAmount,
          description: `Peterson Shoes - 50% Final Pedido ${orderCode}`,
          payerEmail: customerEmail || 'cliente@petersonshoes.com.br',
          payerName: customerName,
          payerCpf: customerCpf || '',
          externalReference: `${orderCode}F`,
          pixKey: db.settings.pixKey || '50.789.636/0001-32',
          liveEnabled: allowLiveCharges,
        }),
      ]);

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
        pixCopyPaste: mpDeposit.pixCopyPaste,
        mpReferenceId: mpDeposit.mpReferenceId,
        sandboxMode: mpDeposit.sandboxMode,
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
        pixCopyPaste: mpFinal.pixCopyPaste,
        mpReferenceId: mpFinal.mpReferenceId,
        sandboxMode: mpFinal.sandboxMode,
        paidAt: null,
        createdAt: new Date().toISOString(),
      };

      const newOrder: BespokeOrder = {
        id: orderId,
        orderCode,
        customerId: customer.id,
        customerName,
        customerWhatsapp,
        customerEmail: customerEmail || '',
        customerCpf: customerCpf || '',
        shippingAddress,
        items,
        totalAmount,
        depositAmount,
        remainingAmount,
        paymentStatus: 'AGUARDANDO_ENTRADA_50',
        productionStatus: 'AGUARDANDO_CONFIRMACAO',
        estimatedDeliveryDate,
        productionDays,
        factoryNotes:
          'Encomenda registrada no site. Aguardando conferência do recebimento dos 50% de entrada no Banco Inter pela administração.',
        trackingCode: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);
      db.payments.unshift(finalPayment, depositPayment);
      saveDb(db, env);

      res.status(201).json({
        order: {
          ...newOrder,
          payments: [depositPayment, finalPayment],
        },
        depositPayment,
        finalPayment,
      });
    } catch (error: any) {
      console.error('Erro ao criar encomenda:', error);
      res.status(500).json({ error: 'Erro interno ao registrar sua encomenda.' });
    }
  });

  // Lookup orders by Order Code, CPF, or WhatsApp
  app.get('/api/orders/lookup', (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const query = String(req.query.query || '').trim();
    const db = loadDb(env);

    if (!query) {
      const enriched = db.orders.slice(0, 10).map((o) => ({
        ...o,
        payments: db.payments.filter((p) => p.orderId === o.id),
      }));
      return res.json(enriched);
    }

    const cleanDigits = query.replace(/\D/g, '');
    const matched = db.orders.filter((o) => {
      const codeMatch = o.orderCode.toLowerCase().includes(query.toLowerCase());
      const nameMatch = o.customerName.toLowerCase().includes(query.toLowerCase());
      const cpfMatch =
        cleanDigits.length >= 4 && o.customerCpf.replace(/\D/g, '').includes(cleanDigits);
      const phoneMatch =
        cleanDigits.length >= 4 && o.customerWhatsapp.replace(/\D/g, '').includes(cleanDigits);
      return codeMatch || nameMatch || cpfMatch || phoneMatch;
    });

    const enriched = matched.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));

    res.json(enriched);
  });

  // Customer Payment Notification Endpoint:
  // IMPORTANT: Never marks an order as paid automatically when the customer clicks a button.
  // Only records the customer's notification so the store owner (Admin) can verify the receipt in Banco Inter.
  const handleCustomerNotifyPayment = (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const {
      installmentType,
      method,
      installments,
      feeAmount,
      totalCharged,
      cardBrand,
      cardLast4,
    } = req.body as {
      installmentType: 'ENTRADA_50' | 'FINAL_50';
      method?: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO';
      installments?: number;
      feeAmount?: number;
      totalCharged?: number;
      cardBrand?: string;
      cardLast4?: string;
    };

    const db = loadDb(env);
    const order = db.orders.find((o) => o.id === id || o.orderCode === id);
    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    const payment = db.payments.find(
      (p) => p.orderId === order.id && p.installmentType === (installmentType || 'ENTRADA_50')
    );

    const chosenMethod = method || 'PIX_MERCADO_PAGO';

    if (payment && payment.status !== 'APROVADO') {
      payment.method = chosenMethod;
      // Keep status strictly PENDENTE until Admin confirms in Banco Inter
      payment.status = 'PENDENTE';

      if (chosenMethod === 'CARTAO_MERCADO_PAGO') {
        const baseVal =
          payment.baseAmount ??
          (installmentType === 'FINAL_50' ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = typeof feeAmount === 'number' ? feeAmount : 0;
        payment.installments = installments || 1;
        payment.amount =
          typeof totalCharged === 'number' && totalCharged >= baseVal
            ? totalCharged
            : baseVal + (payment.feeAmount || 0);
        payment.cardBrand = cardBrand || 'Cartão';
        payment.cardLast4 = cardLast4 || '0000';
      } else {
        const baseVal =
          payment.baseAmount ??
          (installmentType === 'FINAL_50' ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = 0;
        payment.installments = 1;
        payment.amount = baseVal;
      }
    }

    const methodLabel =
      chosenMethod === 'CARTAO_MERCADO_PAGO'
        ? `Cartão de Crédito (${installments || 1}x c/ taxa do banco)`
        : 'Pix Banco Inter';

    const parcelaLabel =
      installmentType === 'FINAL_50' ? '50% finais' : '50% de entrada';

    order.factoryNotes = `${order.factoryNotes} | Cliente informou envio de pagamento (${parcelaLabel} via ${methodLabel}) em ${new Date().toLocaleString('pt-BR')} — Aguardando conferência no Banco Inter pelo Admin.`;
    order.updatedAt = new Date().toISOString();
    saveDb(db, env);

    res.json({
      notified: true,
      message:
        'Aviso de pagamento registrado! O status será atualizado para Pago assim que a Peterson Shoes conferir o recebimento no Banco Inter.',
      order: {
        ...order,
        payments: db.payments.filter((p) => p.orderId === order.id),
      },
    });
  };

  app.post('/api/orders/:id/notify-payment', handleCustomerNotifyPayment);
  app.post('/api/orders/:id/confirm-payment', handleCustomerNotifyPayment);

  // Mercado Pago Webhook endpoint (Protected by MERCADO_PAGO_WEBHOOK_SECRET and disabled in Homologação)
  app.post('/api/webhooks/mercadopago', (req: Request, res: Response) => {
    try {
      const env = resolveEnv(req);
      if (env === 'homologacao') {
        return res.status(200).json({ received: true, ignoredInHomologacao: true });
      }

      const webhookSecret = (process.env.MERCADO_PAGO_WEBHOOK_SECRET || '').trim();
      const providedSecret = String(
        req.headers['x-webhook-secret'] || req.query.secret || ''
      ).trim();

      if (!webhookSecret || providedSecret !== webhookSecret) {
        return res.status(401).json({ error: 'Webhook não autorizado.' });
      }

      const { external_reference, installmentType } = req.body || {};
      if (external_reference) {
        const db = loadDb('producao');
        const cleanCode = String(external_reference).replace(/[EF]$/, '');
        const order = db.orders.find(
          (o) => o.orderCode.replace(/[^a-zA-Z0-9]/g, '') === cleanCode || o.orderCode === cleanCode
        );
        if (order) {
          const isFinal =
            String(external_reference).endsWith('F') || installmentType === 'FINAL_50';
          const pay = db.payments.find(
            (p) =>
              p.orderId === order.id &&
              p.installmentType === (isFinal ? 'FINAL_50' : 'ENTRADA_50')
          );
          if (pay) {
            pay.status = 'APROVADO';
            pay.paidAt = new Date().toISOString();
          }
          if (isFinal) {
            order.paymentStatus = 'QUITADO_100';
          } else {
            order.paymentStatus = 'ENTRADA_50_PAGA';
            if (order.productionStatus === 'AGUARDANDO_CONFIRMACAO') {
              order.productionStatus = 'CORTE_MODELAGEM';
            }
          }
          order.updatedAt = new Date().toISOString();
          saveDb(db, 'producao');
        }
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(200).json({ received: true });
    }
  });

  // ==========================================================================
  // AI VIRTUAL ASSISTANT ENDPOINT (GEMINI 3.8 FLASH)
  // ==========================================================================

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body as {
        message: string;
        history?: { role: 'user' | 'model'; text: string }[];
      };

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Mensagem vazia.' });
      }

      const db = loadDb();
      const activeProducts = db.products.filter((p) => p.active);

      const catalogSummary = activeProducts
        .map(
          (p) =>
            `- ${p.name} (SKU: ${p.sku} | Categoria: ${p.category}): R$ ${p.price.toFixed(2)} (Entrada de 50%: R$ ${(p.price / 2).toFixed(2)} no Pix sem taxa ou no Cartão de Crédito com a taxa do banco + 50% quando ficar pronta). Cores: Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor personalizada. Numerações: 34 ao 39 BR.`
        )
        .join('\n');

      const ordersSummary = db.orders
        .slice(0, 15)
        .map(
          (o) =>
            `- Pedido ${o.orderCode} (${o.customerName}): Status Produção = ${o.productionStatus}, Status Pagamento = ${o.paymentStatus}, Entrega Estimada = ${o.estimatedDeliveryDate}, Total = R$ ${o.totalAmount.toFixed(2)} (Entrada 50% = R$ ${o.depositAmount.toFixed(2)}, Restante 50% = R$ ${o.remainingAmount.toFixed(2)})`
        )
        .join('\n');

      const systemInstruction = `Você é a Consultora Virtual Oficial da **Peterson Shoes** (@petersonshoes_ — "Seu estilo, sua sandália!"), marca de **Goiânia - Goiás** especializada em sandálias femininas de fabricação própria feitas sob encomenda.

INFORMAÇÕES REAIS E OBRIGATÓRIAS DA LOJA:
1. **Localização & Fabricação Própria**: Somos de **Goiânia - Goiás (GO)**, com fabricação própria sob encomenda (Atacado a partir de 6 pares e Varejo). O prazo estimado de produção é de **${db.settings.productionDays} dias**.
2. **Numeração Oficial**: Produzimos do **34 ao 39 BR** (34, 35, 36, 37, 38 e 39).
3. **Cores Padrão & Cor Personalizada**: Todos os modelos podem ser feitos nas cores padrão **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho e Rosa**, além da opção **"Outra Cor"** onde a cliente escreve exatamente qual cor deseja.
4. **Como Funciona o Pagamento (50% + 50% no Pix ou Cartão de Crédito)**:
   - A cliente paga **50% de entrada da sandália** para confirmar o pedido (sem precisar aguardar cotação de frete) e os outros **50% da sandália na entrega**, quando estiver pronta (em 15 dias).
   - A cliente escolhe se prefere pagar os 50% no **Pix (sem taxa)** ou no **Cartão de Crédito (em até 6x, com o acréscimo da taxa cobrada pelo banco/operadora)**.
5. **Regra de Frete e Entrega (Separado do preço da sandália)**:
   - Informe sempre de forma clara: **"O frete é por conta da cliente. A forma de envio e o valor da entrega serão combinados quando a sandália estiver pronta."**
   - Para **Goiânia e região**, a entrega poderá ser combinada por **Uber Moto**.
   - Para **outras cidades**, o envio poderá ser combinado pelos **Correios**, com o frete pago pela cliente antes da postagem.
   - Nunca informe frete grátis, R$ 0,00 ou valor estimado de frete.
6. **Atendimento via WhatsApp**: O site possui botões com link direto para o WhatsApp oficial da loja (não exiba o número de telefone por extenso na mensagem; oriente a cliente a clicar no botão "Falar no WhatsApp" da página) | Instagram: ${db.settings.instagramUrl}.

CATÁLOGO COMPLETO DO INSTAGRAM @petersonshoes_ (${activeProducts.length} MODELOS):
${catalogSummary}

PEDIDOS EM ANDAMENTO NO SISTEMA (Caso a cliente pergunte sobre um código PTS-...):
${ordersSummary}

DIRETRIZES DE ESTILO:
- Responda sempre em português do Brasil, com tom elegante, acolhedor, prestativo e objetivo.
- Nunca escreva o número de telefone no texto; convide a cliente a clicar diretamente no botão de WhatsApp do site caso queira falar com uma atendente.
- Destaque que somos de Goiânia - Goiás com fabricação própria e enviamos para todo o Brasil.
- Sempre mencione que a entrada de 50% pode ser paga no Pix (sem taxa) ou no Cartão de Crédito (com a taxa do banco), e que todos os modelos são feitos do 34 ao 39 nas cores Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor escolhida pela cliente.`;

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        return res.json({
          reply: `Olá! Sou a consultora da **Peterson Shoes (@petersonshoes_)**, direto da nossa fabricação própria em **Goiânia - Goiás**. Produzimos sandálias femininas sob encomenda (numeração **34 ao 39**, prazo de **${db.settings.productionDays} dias**, com envio para todo o Brasil e entrega em Goiânia). Todos os modelos podem ser feitos nas cores **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa** ou em **Outra Cor** que você escrever! Você confirma seu pedido pagando **50% de entrada** (no **Pix sem taxa** ou no **Cartão de Crédito com a taxa do banco**) e os outros **50% quando sua sandália estiver pronta**. Se preferir, basta clicar no botão de **WhatsApp** aqui abaixo para falar direto conosco! Como posso ajudar você hoje?`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationContents = [
        ...(history || []).map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      res.json({
        reply:
          response.text ||
          'Estou à disposição para ajudar você a escolher sua sandália sob encomenda da Peterson Shoes.',
      });
    } catch (error: any) {
      console.error('Erro na IA Peterson Shoes:', error);
      res.status(500).json({
        error:
          'Não foi possível processar sua pergunta no momento. Tente novamente ou clique no botão para falar direto pelo WhatsApp.',
      });
    }
  });

  // ==========================================================================
  // SECURE ADMIN ENDPOINTS (Backend Authenticated & Environment Isolated)
  // ==========================================================================

  app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
    res.json({
      configured: isAdminConfigured(),
      configuredViaEnv: hasEnvAdminPassword(),
    });
  });

  app.post('/api/admin/setup-credentials', (req: Request, res: Response) => {
    if (isAdminConfigured()) {
      return res.status(403).json({
        error: 'As credenciais administrativas já estão configuradas. Faça login com sua senha.',
      });
    }

    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail administrativo válido.' });
    }
    if (cleanPassword.length < 8) {
      return res.status(400).json({
        error: 'A senha administrativa deve ter pelo menos 8 caracteres.',
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPasswordWithSalt(cleanPassword, salt);
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    const record: StoredAdminCredentials = {
      email: cleanEmail,
      salt,
      passwordHash,
      sessionSecret,
      updatedAt: new Date().toISOString(),
    };

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(record, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });

    const token = issueAdminSessionToken(cleanEmail);
    return res.status(201).json({
      token,
      adminEmail: cleanEmail,
    });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.ip || 'local');
    const now = Date.now();
    const rateRecord = loginRateLimiter.get(clientIp);
    if (rateRecord && now < rateRecord.resetAt && rateRecord.count >= 8) {
      return res.status(429).json({
        error: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
      });
    }

    if (!isAdminConfigured()) {
      return res.status(403).json({
        error: 'A senha administrativa ainda não foi configurada. Realize a configuração inicial.',
      });
    }

    const { email, password } = req.body as { email?: string; password?: string };
    const verification = verifyAdminCredentials(email || '', password || '');

    if (verification.ok) {
      loginRateLimiter.delete(clientIp);
      const token = issueAdminSessionToken(verification.email);
      return res.json({
        token,
        adminEmail: verification.email,
      });
    }

    const nextCount = rateRecord && now < rateRecord.resetAt ? rateRecord.count + 1 : 1;
    loginRateLimiter.set(clientIp, {
      count: nextCount,
      resetAt: now + 10 * 60 * 1000,
    });

    return res.status(401).json({
      error: 'Credenciais inválidas. Verifique seu e-mail e senha administrativa.',
    });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      activeAdminSessions.delete(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/dashboard', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const enrichedOrders = db.orders.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));

    const totalOrdersVolume = db.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaidAmount = db.payments
      .filter((p) => p.status === 'APROVADO')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingReceivables = db.payments
      .filter((p) => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      environment: env,
      products: db.products,
      customers: db.customers,
      orders: enrichedOrders,
      payments: db.payments,
      settings: {
        ...db.settings,
        creditCardFeePercentage: db.settings.creditCardFeePercentage ?? 4.99,
        supabaseConfigured: Boolean(
          process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
        mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      },
      analytics: db.analytics || createEmptyAnalytics(),
      metrics: {
        totalOrdersCount: db.orders.length,
        totalCustomersCount: db.customers.length,
        totalProductsCount: db.products.length,
        totalOrdersVolume,
        totalPaidAmount,
        pendingReceivables,
        readyForFinalPaymentCount: db.orders.filter(
          (o) =>
            o.productionStatus === 'PRONTA_PARA_ENTREGA' &&
            o.paymentStatus !== 'QUITADO_100'
        ).length,
      },
    });
  });

  // Upload new product photo from Admin Panel (saves to /public/instagram/)
  app.post('/api/admin/upload-image', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Formato de imagem inválido.' });
      }

      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Não foi possível decodificar a imagem.' });
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      fs.mkdirSync(INSTAGRAM_PUBLIC_DIR, { recursive: true });
      const safeBase = (filename || 'sandalia')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const finalFile = `custom_${safeBase}_${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(INSTAGRAM_PUBLIC_DIR, finalFile), buffer);

      return res.json({ url: `/instagram/${finalFile}` });
    } catch (err) {
      console.error('Erro ao salvar imagem enviada:', err);
      return res.status(500).json({ error: 'Falha ao salvar imagem no servidor.' });
    }
  });

  // FAST MANUAL PRICING, COST & PROFIT MARGIN UPDATE ENDPOINT
  const handleUpdateProductPricing = (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const {
      price,
      manufacturingCost,
      additionalExpenses,
    } = req.body as {
      price?: number;
      manufacturingCost?: number;
      additionalExpenses?: number;
    };

    const db = loadDb(env);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Modelo não encontrado.' });
    }

    const current = db.products[idx];

    const nextPrice =
      price !== undefined ? Math.round(Number(price) * 100) / 100 : current.price;
    if (!nextPrice || isNaN(nextPrice) || nextPrice <= 0) {
      return res.status(400).json({ error: 'Informe um preço de venda válido maior que zero.' });
    }

    // Never alter manufacturingCost or additionalExpenses automatically unless explicitly sent
    const nextManufacturingCost =
      manufacturingCost !== undefined
        ? Math.max(0, Math.round(Number(manufacturingCost) * 100) / 100)
        : Number(current.manufacturingCost) || 0;

    const nextAdditionalExpenses =
      additionalExpenses !== undefined
        ? Math.max(0, Math.round(Number(additionalExpenses) * 100) / 100)
        : Number(current.additionalExpenses) || 0;

    const totalCost = Math.round((nextManufacturingCost + nextAdditionalExpenses) * 100) / 100;
    const grossProfit = Math.round((nextPrice - totalCost) * 100) / 100;
    const profitMarginPercent =
      nextPrice > 0 ? Math.round((grossProfit / nextPrice) * 10000) / 100 : 0;

    db.products[idx] = {
      ...current,
      price: nextPrice,
      manufacturingCost: nextManufacturingCost,
      additionalExpenses: nextAdditionalExpenses,
      grossProfit,
      profitMarginPercent,
    };

    saveDb(db, env);
    return res.json(db.products[idx]);
  };

  app.patch('/api/admin/products/:id/price', requireAdminAuth, handleUpdateProductPricing);
  app.patch('/api/admin/products/:id/pricing', requireAdminAuth, handleUpdateProductPricing);

  // Create Product
  app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const body = req.body as Partial<BespokeProduct>;

    if (!body.name || !body.price) {
      return res.status(400).json({ error: 'Nome e preço da sandália são obrigatórios.' });
    }

    const defaultImg = body.image || '/instagram/feed_1_C454LXbOzrn_slide_1.jpg';
    const salePrice = Math.round(Number(body.price) * 100) / 100;
    const mCost = Math.max(0, Math.round(Number(body.manufacturingCost || 0) * 100) / 100);
    const extraExp = Math.max(0, Math.round(Number(body.additionalExpenses || 0) * 100) / 100);
    const totalCost = Math.round((mCost + extraExp) * 100) / 100;
    const grossProfit = Math.round((salePrice - totalCost) * 100) / 100;
    const profitMarginPercent =
      salePrice > 0 ? Math.round((grossProfit / salePrice) * 10000) / 100 : 0;

    const newProduct: BespokeProduct = {
      id: `prod-${Date.now()}`,
      sku: body.sku || `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      name: body.name,
      subtitle: body.subtitle || 'Sandália Feminina Feita Sob Encomenda',
      category: body.category || 'Flatforms & Papetes',
      price: salePrice,
      manufacturingCost: mCost,
      additionalExpenses: extraExp,
      grossProfit,
      profitMarginPercent,
      image: defaultImg,
      gallery:
        Array.isArray(body.gallery) && body.gallery.length > 0
          ? body.gallery
          : [defaultImg],
      instagramPostUrl: body.instagramPostUrl || 'https://www.instagram.com/petersonshoes_/',
      heelOptions:
        Array.isArray(body.heelOptions) && body.heelOptions.length > 0
          ? body.heelOptions
          : ['Flatform Anatômica 3,5cm', 'Anabela 8cm'],
      strapFinishes:
        Array.isArray(body.strapFinishes) && body.strapFinishes.length > 0
          ? body.strapFinishes
          : ['Metais Dourados', 'Metais Prateados'],
      colors:
        Array.isArray(body.colors) && body.colors.length > 0
          ? body.colors
          : buildStandardColors('Dourado', defaultImg),
      availableSizes:
        Array.isArray(body.availableSizes) && body.availableSizes.length > 0
          ? body.availableSizes
          : STANDARD_SIZES,
      productionDays: Number(body.productionDays || 15),
      featured: Boolean(body.featured),
      active: body.active !== undefined ? Boolean(body.active) : true,
      description:
        body.description ||
        'Sandália artesanal Peterson Shoes produzida sob encomenda com material de alta qualidade.',
      craftDetails:
        Array.isArray(body.craftDetails) && body.craftDetails.length > 0
          ? body.craftDetails
          : [
              'Fabricação própria sob encomenda em 15 dias (Numeração 34 ao 39)',
              'Pagamento 50% na encomenda (Pix ou Cartão) e 50% quando ficar pronta',
            ],
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDb(db, env);
    res.status(201).json(newProduct);
  });

  // Update Product
  app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const db = loadDb(env);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const current = db.products[idx];
    const nextPrice = Math.round(Number(req.body.price ?? current.price) * 100) / 100;
    const nextMCost =
      req.body.manufacturingCost !== undefined
        ? Math.max(0, Math.round(Number(req.body.manufacturingCost) * 100) / 100)
        : Number(current.manufacturingCost) || 0;
    const nextExtraExp =
      req.body.additionalExpenses !== undefined
        ? Math.max(0, Math.round(Number(req.body.additionalExpenses) * 100) / 100)
        : Number(current.additionalExpenses) || 0;
    const totalCost = Math.round((nextMCost + nextExtraExp) * 100) / 100;
    const grossProfit = Math.round((nextPrice - totalCost) * 100) / 100;
    const profitMarginPercent =
      nextPrice > 0 ? Math.round((grossProfit / nextPrice) * 10000) / 100 : 0;

    const updated: BespokeProduct = {
      ...current,
      ...req.body,
      id: current.id,
      price: nextPrice,
      manufacturingCost: nextMCost,
      additionalExpenses: nextExtraExp,
      grossProfit,
      profitMarginPercent,
    };

    db.products[idx] = updated;
    saveDb(db, env);
    res.json(updated);
  });

  // Delete Product
  app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const db = loadDb(env);
    db.products = db.products.filter((p) => p.id !== id);
    saveDb(db, env);
    res.json({ ok: true });
  });

  // Update Order Production / Payment Status (Exclusive Admin Confirmation)
  app.patch('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const {
      productionStatus,
      paymentStatus,
      factoryNotes,
      trackingCode,
      estimatedDeliveryDate,
    } = req.body as {
      productionStatus?: ProductionStatus;
      paymentStatus?: PaymentStatus;
      factoryNotes?: string;
      trackingCode?: string;
      estimatedDeliveryDate?: string;
    };

    const db = loadDb(env);
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    if (productionStatus) {
      order.productionStatus = productionStatus;
      if (
        productionStatus === 'PRONTA_PARA_ENTREGA' &&
        order.paymentStatus === 'ENTRADA_50_PAGA'
      ) {
        order.paymentStatus = 'AGUARDANDO_FINAL_50';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      const orderPayments = db.payments.filter((p) => p.orderId === order.id);
      const depositPay = orderPayments.find((p) => p.installmentType === 'ENTRADA_50');
      const finalPay = orderPayments.find((p) => p.installmentType === 'FINAL_50');

      if (paymentStatus === 'AGUARDANDO_ENTRADA_50') {
        if (depositPay) {
          depositPay.status = 'PENDENTE';
          depositPay.paidAt = null;
        }
      }
      if (paymentStatus === 'ENTRADA_50_PAGA' && depositPay && depositPay.status !== 'APROVADO') {
        depositPay.status = 'APROVADO';
        depositPay.paidAt = new Date().toISOString();
      }
      if (paymentStatus === 'QUITADO_100') {
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

    if (factoryNotes !== undefined) order.factoryNotes = factoryNotes;
    if (trackingCode !== undefined) order.trackingCode = trackingCode;
    if (estimatedDeliveryDate !== undefined) order.estimatedDeliveryDate = estimatedDeliveryDate;

    order.updatedAt = new Date().toISOString();
    saveDb(db, env);

    res.json({
      ...order,
      payments: db.payments.filter((p) => p.orderId === order.id),
    });
  });

  // Update Store Settings
  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    db.settings = {
      ...db.settings,
      ...req.body,
      productionDays: Number(req.body.productionDays ?? db.settings.productionDays),
      depositPercentage: Number(req.body.depositPercentage ?? db.settings.depositPercentage),
      creditCardFeePercentage: Number(
        req.body.creditCardFeePercentage ?? db.settings.creditCardFeePercentage ?? 4.99
      ),
    };
    saveDb(db, env);
    res.json(db.settings);
  });

  // Get SQL Schema for Supabase
  app.get('/api/admin/sql-schema', requireAdminAuth, (_req: Request, res: Response) => {
    let sqlContent = '';
    if (fs.existsSync(SQL_SCHEMA_FILE)) {
      sqlContent = fs.readFileSync(SQL_SCHEMA_FILE, 'utf-8');
    }
    res.json({ sql: sqlContent });
  });
}

registerApiRoutes();

async function startServer() {
  const publicPath = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // ==========================================================================
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // ==========================================================================
  const distPath = path.join(process.cwd(), 'dist');
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Peterson Shoes Full-Stack Server running on http://localhost:${PORT}`);
  });
}

if (!IS_VERCEL) {
  startServer();
}

export default app;
