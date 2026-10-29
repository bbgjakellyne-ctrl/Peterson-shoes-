import React, { useState } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Check,
  Copy,
  MessageCircle,
  Hammer,
  DollarSign,
  Users,
  ShoppingBag,
  Database,
  Settings,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  BespokeOrder,
  BespokeProduct,
  CustomerRecord,
  PaymentRecord,
  PaymentStatus,
  ProductionStatus,
  StoreSettings,
} from '../types/peterson';
import {
  calculateProductFinancials,
  formatBRL,
  getPsychologicalPriceSuggestions,
  isPsychological90Price,
  suggestSalePriceFromMargin,
} from '../utils/payment';
import {
  buildFactoryProductionMessage,
  buildReadyForFinalPaymentMessage,
  toWhatsAppHref,
} from '../utils/whatsapp';
import {
  buildStandardColors,
  deleteBrowserOrderAdmin,
  getBrowserStoreDb,
  getProductOverrides,
  importBrowserOrderFromWhatsAppSync,
  INITIAL_PRODUCTS,
  resolveProductStyleCategory,
  sanitizeProductCatalog,
  saveBrowserStoreDb,
  saveProductOverride,
  STANDARD_SIZES,
  STYLE_CATEGORIES,
  updateBrowserOrderAdmin,
} from '../data/storeData';
import {
  apiFetch,
  getActiveEnvironment,
  isHomologacao,
  switchEnvironment,
} from '../utils/environment';

const CATEGORIES = ['Todos', ...STYLE_CATEGORIES.map((c) => c.id)];

interface AdminDashboardProps {
  onCloseAdmin: () => void;
  onCatalogUpdated: () => void;
}

const IMAGE_PRESETS = [
  {
    label: 'Novo — Scarpin Bico Fino Marsala (Foto 1 nos Pés)',
    url: '/assets/aistudio/IMG_3086_5529b321.jpeg',
  },
  {
    label: 'Novo — Scarpin Bico Fino Marsala (Foto 2 Lateral)',
    url: '/assets/aistudio/IMG_3071_c77843a9.jpeg',
  },
  {
    label: 'Novo — Scarpin Bico Fino Marsala (Foto 3 Superior)',
    url: '/assets/aistudio/IMG_3070_2d89dc6b.jpeg',
  },
  {
    label: 'Novo — Scarpin Slingback Verniz Marrom Café',
    url: '/assets/aistudio/IMG_3061_70e03cce.jpeg',
  },
  {
    label: 'Novo — Scarpin Slingback Ponteira Dourada & Salto Taça',
    url: '/assets/aistudio/IMG_3064_d165c2a2.jpeg',
  },
  {
    label: 'Novo — Sandália 3 Tiras Salto Fino Dourado Caramelo',
    url: '/assets/aistudio/IMG_3067_8bebcc9c.jpeg',
  },
  {
    label: 'Novo — Tamanco Salto Bloco & Fivela Marsala',
    url: '/assets/aistudio/IMG_3069_b9feb338.jpeg',
  },
  {
    label: 'Novo — Tamanco Anabela Dedo Aplique Dourado Off-White',
    url: '/assets/aistudio/IMG_3075_2729f411.jpeg',
  },
  {
    label: 'Novo — Tamanco Mule Bico Folha Salto Fino Dourado',
    url: '/assets/aistudio/IMG_3078_33e91306.jpeg',
  },
  {
    label: 'Novo — Sandália Mule Bico Fino Salto Alto Preta',
    url: '/assets/aistudio/IMG_3083_28dd9dab.jpeg',
  },
  {
    label: 'Post 1 — Papete Flatform Pirâmides Dourada',
    url: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
  },
  {
    label: 'Post 1 — Papete Flatform Pirâmides Off-White Creme',
    url: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
  },
  {
    label: 'Post 1 — Papete Flatform Pirâmides Prata',
    url: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
  },
  {
    label: 'Post 1 — Papete Flatform Pirâmides Preta & Ouro',
    url: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
  },
  {
    label: 'Post 2 — Anabela Espadrille Branca Pirâmides & Juta',
    url: '/instagram/feed_2_C454HJKO2oG_main.jpg',
  },
  {
    label: 'Post 3 — Rasteira Esferas & Medalhão Dourada',
    url: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
  },
  {
    label: 'Post 3 — Rasteira Esferas & Medalhão Prata',
    url: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
  },
  {
    label: 'Post 4 — Rasteira Gladiadora Strass Prata (Foto 1)',
    url: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
  },
  {
    label: 'Post 4 — Rasteira Gladiadora Strass Prata (Foto 2)',
    url: '/instagram/feed_4_C454A4GujcN_slide_2.jpg',
  },
  {
    label: 'Post 5 — Anabela Plataforma Trançada Dourada (Foto 1)',
    url: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
  },
  {
    label: 'Post 5 — Anabela Plataforma Trançada Dourada (Foto 2)',
    url: '/instagram/feed_5_C4539VxO5om_slide_2.jpg',
  },
  {
    label: 'Post 6 — Tamanco Plataforma Trançado Nó Off-White (Foto 1)',
    url: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
  },
  {
    label: 'Post 6 — Tamanco Plataforma Trançado Nó Off-White (Foto 2)',
    url: '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
  },
  {
    label: 'Post 7 — Papete dos Sonhos Strass Dourada & Prata',
    url: '/instagram/feed_7_C4ayCqZteae_main.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Fivela Preta Camurça',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Fivela Nude Rosé',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Fivela Prata Champagne',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Fivela Dourada Metalizada',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Fivela Branca Neve',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Gladiadora Amarração Dourada',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Gladiadora Amarração Nude Rosé',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
  },
  {
    label: 'Post 8 — Anabela Pirâmides Gladiadora Amarração Prata',
    url: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
  },
  {
    label: 'Post 9 — Papete Tratorada Strass & Amarração Off-White',
    url: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
  },
  {
    label: 'Post 9 — Papete Tratorada Strass & Amarração Preta Onix',
    url: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
  },
  {
    label: 'Post 9 — Papete Tratorada Strass & Amarração Dourada',
    url: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
  },
  {
    label: 'Post 10 — Flatform Gladiadora Tiras Cruzadas Strass Dourada',
    url: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
  },
  {
    label: 'Post 10 — Flatform Gladiadora Tiras Cruzadas Strass Branca',
    url: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
  },
  {
    label: 'Post 11 — Papete Espelhada Tiras Strass Prata',
    url: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
  },
  {
    label: 'Post 11 — Papete Espelhada Tiras Strass Dourado Champagne',
    url: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
  },
  {
    label: 'Post 12 — Flatform Slide Tira de Dedo Nó em Strass',
    url: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onCloseAdmin,
  onCatalogUpdated,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmSetupPassword, setConfirmSetupPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [checkingAuthStatus, setCheckingAuthStatus] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'PRODUCTS' | 'ORDERS' | 'FINANCE' | 'CUSTOMERS' | 'SETTINGS' | 'ANALYTICS' | 'SEO' | 'REELS'
  >('PRODUCTS');
  const [downloadingMobileVideo, setDownloadingMobileVideo] = useState(false);
  const [mobileVideoStatus, setMobileVideoStatus] = useState('');
  const [preloadedVideoFile, setPreloadedVideoFile] = useState<File | null>(null);
  const [preloadedVideoBlobUrl, setPreloadedVideoBlobUrl] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/assets/peterson-reels-privado-admin.mp4?v=nitido-hd-v4')
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        const file = new File([blob], 'peterson-shoes-reels-campanha-hd.mp4', {
          type: 'video/mp4',
        });
        const bUrl = URL.createObjectURL(blob);
        setPreloadedVideoFile(file);
        setPreloadedVideoBlobUrl(bUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMobileVideoDownload = async (mode: 'share' | 'download') => {
    try {
      // 1. If already preloaded in memory, call navigator.share SYNCHRONOUSLY inside iOS tap gesture!
      if (preloadedVideoFile) {
        if (
          mode === 'share' &&
          typeof navigator !== 'undefined' &&
          navigator.share &&
          (!navigator.canShare || navigator.canShare({ files: [preloadedVideoFile] }))
        ) {
          await navigator.share({
            files: [preloadedVideoFile],
            title: 'Peterson Shoes — Vídeo Reels Instagram',
          });
          setMobileVideoStatus('✅ Menu do iPhone/Android aberto! Toque em "Salvar Vídeo".');
          return;
        }

        if (preloadedVideoBlobUrl) {
          const a = document.createElement('a');
          a.href = preloadedVideoBlobUrl;
          a.download = 'peterson-shoes-reels-campanha-nova.mp4';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setMobileVideoStatus('✅ Vídeo pronto! Se estiver no iPhone, toque no botão verde acima e escolha "Salvar Vídeo".');
          return;
        }
      }

      // 2. If still loading in background, finish loading into memory first
      setDownloadingMobileVideo(true);
      setMobileVideoStatus('⏳ Carregando vídeo na memória do aparelho (aguarde 2 segundos e toque novamente)...');
      const response = await fetch('/assets/peterson-reels-privado-admin.mp4?v=nitido-hd-v4');
      const blob = await response.blob();
      const file = new File([blob], 'peterson-shoes-reels-campanha-hd.mp4', {
        type: 'video/mp4',
      });
      const bUrl = URL.createObjectURL(blob);
      setPreloadedVideoFile(file);
      setPreloadedVideoBlobUrl(bUrl);
      setMobileVideoStatus('✅ Vídeo carregado! Toque mais uma vez no botão verde para abrir "Salvar Vídeo" no seu celular.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('cancel')) {
        setMobileVideoStatus('');
      } else {
        setMobileVideoStatus('✅ Vídeo pronto! Toque novamente no botão verde e escolha "Salvar Vídeo".');
      }
    } finally {
      setDownloadingMobileVideo(false);
    }
  };

  const REELS_CAPTION_TEXT = `✨ Elegância, conforto e poder em cada passo! Conheça os novos lançamentos da Peterson Shoes (@petersonshoes_) feitos sob encomenda especialmente para você.

👠 Destaques do Vídeo (Numeração 34 ao 39):
• Scarpin Bico Fino & Pulseira Marsala — R$ 149,90
• Scarpin Slingback Ponteira Dourada & Salto Taça — R$ 149,90
• Scarpin Slingback Verniz Marrom Café — R$ 149,90
• Sandália 3 Tiras Salto Fino Dourada — R$ 149,90
• Papetes, Rasteiras & Anabelas — a partir de R$ 99,90

💳 Facilidade Direto da Fábrica:
• 50% de entrada no Pix (R$ 74,95 nos modelos de R$ 149,90) + 50% somente quando sua sandália ficar pronta!
• Ou parcele em até 6x no cartão.
• Escolha sua cor favorita e sua numeração (34 ao 39).

📍 Fábrica e Loja em Goiânia - GO (Av. C-7, Setor Sudoeste)
🚚 Entregas rápidas em Goiânia e Região + Envio para todo o Brasil!

📲 Garanta já o seu par! Clique no link da bio (peterson-shoes.vercel.app) ou chame agora no WhatsApp: (62) 98499-8265

#petersonshoes #calçadosfemininos #sandaliasgoiania #scarpin #slingback #modagoiania #fabricadecalcados #goiania #papetes #sapatosfemininos`;

  React.useEffect(() => {
    let active = true;
    apiFetch('/api/admin/auth-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) {
          setNeedsInitialSetup(Boolean(data.needsInitialSetup));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingAuthStatus(false);
      });

    apiFetch('/api/analytics/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && typeof data.totalVisits === 'number') {
          if (data.totalVisits === 0) {
            apiFetch('/api/analytics/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'VISITA',
                visitorId: 'vis-session',
                referrer: document.referrer || '',
              }),
            })
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((d2) => {
                if (active && d2?.analytics) setAnalytics(d2.analytics);
              })
              .catch(() => {});
          } else {
            setAnalytics(data);
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const [products, setProducts] = useState<BespokeProduct[]>([]);
  const [orders, setOrders] = useState<BespokeOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [metrics, setMetrics] = useState<{
    totalOrdersCount: number;
    totalCustomersCount: number;
    totalProductsCount: number;
    totalOrdersVolume: number;
    totalPaidAmount: number;
    pendingReceivables: number;
    readyForFinalPaymentCount: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalVisits: number;
    uniqueVisitorsCount: number;
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
    recentEvents: Array<{
      id: string;
      type: 'VISITA' | 'PRODUTO' | 'SACOLA' | 'WHATSAPP';
      label: string;
      source: string;
      timestamp: string;
    }>;
  }>({
    totalVisits: 0,
    uniqueVisitorsCount: 0,
    dailyVisits: {},
    sources: { google: 0, instagram: 0, whatsapp: 0, direto: 0 },
    productViews: {},
    whatsappClicks: 0,
    cartAdditions: 0,
    recentEvents: [],
  });
  const [sqlSchema, setSqlSchema] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Fast manual price & cost editing state per product ID
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({});
  const [expenseDrafts, setExpenseDrafts] = useState<Record<string, string>>({});
  const [profitDrafts, setProfitDrafts] = useState<Record<string, string>>({});
  const [marginDrafts, setMarginDrafts] = useState<Record<string, string>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [savedPriceId, setSavedPriceId] = useState<string | null>(null);
  const [approvingTierKey, setApprovingTierKey] = useState<string | null>(null);
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('Todos');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [bulkManualPriceInput, setBulkManualPriceInput] = useState<string>('');
  const [savingBulkPrice, setSavingBulkPrice] = useState<boolean>(false);
  const [bulkPriceSavedMsg, setBulkPriceSavedMsg] = useState<string>('');

  // Manual order value editing state per order ID
  const [orderTotalDrafts, setOrderTotalDrafts] = useState<Record<string, string>>({});
  const [savedOrderValueId, setSavedOrderValueId] = useState<string | null>(null);

  // Product Form Modal / Drawer State
  const [editingProduct, setEditingProduct] = useState<Partial<BespokeProduct> | null>(
    null
  );
  const [modalPriceInput, setModalPriceInput] = useState<string>('149.90');
  const [colorInputText, setColorInputText] = useState(
    'Preto:#1B191A, Branco:#F7F7F5, Marsala:#631421, Nude:#DFC1B4, Dourado:#D4AF37, Prata:#C4C9CE, Vermelho:#B31B2C, Rosa:#E07A9B, Outra Cor:#8E7970'
  );
  const [heelInputText, setHeelInputText] = useState(
    'Flatform Anatômica 3,5cm, Flatform Conforto 2,5cm'
  );
  const [strapInputText, setStrapInputText] = useState(
    'Pirâmides Douradas, Pirâmides Cromadas'
  );
  const [sizesInputText, setSizesInputText] = useState('34, 35, 36, 37, 38, 39');
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  const applyDashboardFromDb = (
    db = getBrowserStoreDb(),
    options?: { preserveDrafts?: boolean }
  ) => {
    const enrichedOrders = db.orders.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));
    const totalOrdersVolume = db.orders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const totalPaidAmount = db.payments
      .filter((p) => p.status === 'APROVADO')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingReceivables = db.payments
      .filter((p) => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + p.amount, 0);

    setProducts(db.products);
    if (!options?.preserveDrafts) {
      const pDrafts: Record<string, string> = {};
      const cDrafts: Record<string, string> = {};
      const eDrafts: Record<string, string> = {};
      const prDrafts: Record<string, string> = {};
      const mDrafts: Record<string, string> = {};
      for (const p of db.products) {
        pDrafts[p.id] = p.price.toFixed(2);
        const mCost = p.manufacturingCost ?? 0;
        const aExp = p.additionalExpenses ?? 0;
        cDrafts[p.id] = mCost > 0 ? mCost.toFixed(2) : '';
        eDrafts[p.id] = aExp > 0 ? aExp.toFixed(2) : '';
        const fin = calculateProductFinancials(p.price, mCost, aExp);
        prDrafts[p.id] = mCost > 0 || aExp > 0 ? fin.grossProfit.toFixed(2) : '';
        mDrafts[p.id] = mCost > 0 || aExp > 0 ? fin.profitMarginPercent.toFixed(2) : '';
      }
      setPriceDrafts(pDrafts);
      setCostDrafts(cDrafts);
      setExpenseDrafts(eDrafts);
      setProfitDrafts(prDrafts);
      setMarginDrafts(mDrafts);
    }
    setOrders(enrichedOrders);
    setCustomers(db.customers);
    setPayments(db.payments);
    setSettings(db.settings);
    setMetrics({
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
    });
  };

  const fetchAdminData = async (
    adminToken: string,
    options?: { silent?: boolean }
  ) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const dashRes = await apiFetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (dashRes.status === 401 || dashRes.status === 403) {
        setToken(null);
        setLoginError('Sessão administrativa expirada. Faça login novamente.');
        return;
      }

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data?.products && Array.isArray(data.products)) {
          if (typeof window !== 'undefined' && window.location.search.includes('importar_pedido=')) {
            importBrowserOrderFromWhatsAppSync(window.location.search);
          }
          const localDb = getBrowserStoreDb();
          const serverOrders = Array.isArray(data.orders) ? data.orders : [];
          const serverCustomers = Array.isArray(data.customers) ? data.customers : [];
          const serverPayments = Array.isArray(data.payments) ? data.payments : [];

          // Merge server + localStorage so orders placed on this browser never vanish on serverless restarts
          const mergedOrdersMap = new Map<string, BespokeOrder>();
          for (const o of localDb.orders || []) {
            if (o && o.id) mergedOrdersMap.set(o.id, o);
          }
          for (const o of serverOrders) {
            if (o && o.id) {
              const existing = mergedOrdersMap.get(o.id);
              if (!existing || (o.updatedAt || '') >= (existing.updatedAt || '')) {
                mergedOrdersMap.set(o.id, o);
              }
            }
          }
          const mergedOrders = Array.from(mergedOrdersMap.values()).sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || '')
          );

          const mergedCustomersMap = new Map<string, CustomerRecord>();
          for (const c of localDb.customers || []) {
            if (c && c.id) mergedCustomersMap.set(c.id, c);
          }
          for (const c of serverCustomers) {
            if (c && c.id) mergedCustomersMap.set(c.id, c);
          }
          const mergedCustomers = Array.from(mergedCustomersMap.values());

          const mergedPaymentsMap = new Map<string, PaymentRecord>();
          for (const p of localDb.payments || []) {
            if (p && p.id) mergedPaymentsMap.set(p.id, p);
          }
          for (const p of serverPayments) {
            if (p && p.id) mergedPaymentsMap.set(p.id, p);
          }
          const mergedPayments = Array.from(mergedPaymentsMap.values());

          // Ensure all 69 models (without Botas) and normalized style categories are preserved
          const mergedProducts = sanitizeProductCatalog(data.products || []);

          const updatedDb = {
            products: mergedProducts,
            customers: mergedCustomers,
            orders: mergedOrders,
            payments: mergedPayments,
            settings: data.settings || localDb.settings,
          };

          const prevOrdersSig = JSON.stringify(
            (localDb.orders || []).map((o) => `${o.id}:${o.paymentStatus}:${o.productionStatus}:${o.updatedAt}`)
          );
          const nextOrdersSig = JSON.stringify(
            mergedOrders.map((o) => `${o.id}:${o.paymentStatus}:${o.productionStatus}:${o.updatedAt}`)
          );
          if (prevOrdersSig !== nextOrdersSig || !options?.silent) {
            saveBrowserStoreDb(updatedDb);
          }
          applyDashboardFromDb(updatedDb, { preserveDrafts: Boolean(options?.silent) });

          const localOverrides = getProductOverrides();
          if (mergedOrders.length > serverOrders.length || Object.keys(localOverrides).length > 0) {
            apiFetch('/api/admin/sync-orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                orders: mergedOrders,
                customers: mergedCustomers,
                payments: mergedPayments,
                productOverrides: localOverrides,
              }),
            }).catch(() => {});
          }
        }
        if (data?.analytics) {
          setAnalytics(data.analytics);
        }
      }
      if (!options?.silent) {
        const sqlRes = await apiFetch('/api/admin/sql-schema', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (sqlRes.ok) {
          const sqlData = await sqlRes.json();
          setSqlSchema(sqlData.sql || '');
        }
      }
    } catch {
      if (!options?.silent) {
        setLoginError('Não foi possível conectar ao servidor administrativo.');
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  // Real-time instant order synchronization (BroadcastChannel + storage + visibility + 2s polling)
  React.useEffect(() => {
    if (!token) return;

    const refreshFromLocalAndServer = () => {
      const latestLocal = getBrowserStoreDb();
      applyDashboardFromDb(latestLocal, { preserveDrafts: true });
      fetchAdminData(token, { silent: true });
    };

    const intervalId = window.setInterval(() => {
      fetchAdminData(token, { silent: true });
    }, 2000);

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('peterson_')) {
        refreshFromLocalAndServer();
      }
    };

    const handleCustomOrderEvent = () => {
      refreshFromLocalAndServer();
    };

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshFromLocalAndServer();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('peterson-orders-updated', handleCustomOrderEvent);
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('peterson_orders_realtime');
        bc.onmessage = () => {
          refreshFromLocalAndServer();
        };
      } catch {
        // Ignore BroadcastChannel errors
      }
    }

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('peterson-orders-updated', handleCustomOrderEvent);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (needsInitialSetup) {
      if (loginPassword.length < 8) {
        setLoginError(
          'Por segurança, escolha uma senha forte com pelo menos 8 caracteres.'
        );
        return;
      }
      if (loginPassword !== confirmSetupPassword) {
        setLoginError('A confirmação de senha não confere.');
        return;
      }
      try {
        const res = await apiFetch('/api/admin/setup-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token) {
          setNeedsInitialSetup(false);
          setLoginPassword('');
          setConfirmSetupPassword('');
          setToken(data.token);
          fetchAdminData(data.token);
          return;
        }
        setLoginError(
          data.error || 'Não foi possível configurar as credenciais administrativas.'
        );
      } catch {
        setLoginError('Erro de conexão ao salvar credenciais no servidor.');
      }
      return;
    }

    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setLoginPassword('');
        setToken(data.token);
        fetchAdminData(data.token);
        return;
      }
      setLoginError(
        data.error ||
          'E-mail ou senha administrativa inválidos. Acesso permitido apenas à proprietária.'
      );
    } catch {
      setLoginError(
        'Erro ao validar autenticação no servidor. Verifique sua conexão.'
      );
    }
  };

  // Helper to parse localized numbers
  const parseNumInput = (val: string | undefined): number => {
    if (!val || val.trim() === '') return 0;
    const parsed = parseFloat(val.replace(',', '.'));
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  // Real-time financial recalculation when Price, Manufacturing Cost, or Additional Expenses change
  const handleFinancialFieldChange = (
    productId: string,
    field: 'price' | 'cost' | 'expenses',
    rawValue: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    const nextPriceStr = field === 'price' ? rawValue : priceDrafts[productId] ?? String(prod?.price ?? 0);
    const nextCostStr = field === 'cost' ? rawValue : costDrafts[productId] ?? '';
    const nextExpStr = field === 'expenses' ? rawValue : expenseDrafts[productId] ?? '';

    if (field === 'price') {
      setPriceDrafts((prev) => ({ ...prev, [productId]: rawValue }));
    } else if (field === 'cost') {
      setCostDrafts((prev) => ({ ...prev, [productId]: rawValue }));
    } else {
      setExpenseDrafts((prev) => ({ ...prev, [productId]: rawValue }));
    }

    const salePrice = parseNumInput(nextPriceStr);
    const mCost = parseNumInput(nextCostStr);
    const aExp = parseNumInput(nextExpStr);

    if (salePrice > 0 && (mCost > 0 || aExp > 0 || nextCostStr.trim() !== '' || nextExpStr.trim() !== '')) {
      const fin = calculateProductFinancials(salePrice, mCost, aExp);
      setProfitDrafts((prev) => ({ ...prev, [productId]: fin.grossProfit.toFixed(2) }));
      setMarginDrafts((prev) => ({ ...prev, [productId]: fin.profitMarginPercent.toFixed(2) }));
    } else {
      setProfitDrafts((prev) => ({ ...prev, [productId]: '' }));
      setMarginDrafts((prev) => ({ ...prev, [productId]: '' }));
    }
  };

  // Real-time simulation when Gross Profit (R$) or Profit Margin (%) is edited by the admin
  const handleTargetProfitOrMarginChange = (
    productId: string,
    mode: 'profit' | 'margin',
    rawValue: string
  ) => {
    const mCost = parseNumInput(costDrafts[productId]);
    const aExp = parseNumInput(expenseDrafts[productId]);
    const totalCost = mCost + aExp;

    if (mode === 'profit') {
      setProfitDrafts((prev) => ({ ...prev, [productId]: rawValue }));
      const desiredProfit = parseFloat(rawValue.replace(',', '.'));
      if (!isNaN(desiredProfit) && totalCost > 0) {
        const rawTargetPrice = totalCost + desiredProfit;
        if (rawTargetPrice > 0) {
          const fin = calculateProductFinancials(rawTargetPrice, mCost, aExp);
          setMarginDrafts((prev) => ({
            ...prev,
            [productId]: fin.profitMarginPercent.toFixed(2),
          }));
        }
      }
    } else {
      setMarginDrafts((prev) => ({ ...prev, [productId]: rawValue }));
      const desiredMargin = parseFloat(rawValue.replace(',', '.'));
      if (!isNaN(desiredMargin) && desiredMargin > 0 && desiredMargin < 95 && totalCost > 0) {
        const suggestedPrice = suggestSalePriceFromMargin(mCost, aExp, desiredMargin, true);
        const fin = calculateProductFinancials(suggestedPrice, mCost, aExp);
        setProfitDrafts((prev) => ({
          ...prev,
          [productId]: fin.grossProfit.toFixed(2),
        }));
      }
    }
  };

  // 1-Click Manual Pricing & Cost Save Handler (Requires explicit owner action)
  const handleQuickSavePrice = async (
    productId: string,
    overrideSalePrice?: number
  ) => {
    if (!token) return;
    const rawVal =
      overrideSalePrice !== undefined
        ? String(overrideSalePrice)
        : String(priceDrafts[productId] || '')
            .replace(/R\$/gi, '')
            .trim()
            .replace(',', '.');
    const numericPrice = parseFloat(rawVal);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    const roundedPrice = Math.round(numericPrice * 100) / 100;
    const costRaw = (costDrafts[productId] || '').trim();
    const expRaw = (expenseDrafts[productId] || '').trim();
    const hasCostInput = costRaw !== '' || expRaw !== '';
    const mCost = parseNumInput(costRaw);
    const aExp = parseNumInput(expRaw);
    const fin = calculateProductFinancials(roundedPrice, mCost, aExp);

    setSavingPriceId(productId);
    try {
      // 1. Save immediately in browser override + localStorage so it never reverts
      const localDb = getBrowserStoreDb();
      const updatedProducts = localDb.products.map((p) => {
        if (p.id !== productId) return p;
        const nextCost = hasCostInput ? mCost : p.manufacturingCost ?? 0;
        const nextExp = hasCostInput ? aExp : p.additionalExpenses ?? 0;
        const calc = calculateProductFinancials(roundedPrice, nextCost, nextExp);
        const updatedItem: BespokeProduct = {
          ...p,
          price: roundedPrice,
          manufacturingCost: hasCostInput ? mCost : p.manufacturingCost,
          additionalExpenses: hasCostInput ? aExp : p.additionalExpenses,
          grossProfit: nextCost > 0 || nextExp > 0 ? calc.grossProfit : p.grossProfit,
          profitMarginPercent:
            nextCost > 0 || nextExp > 0
              ? calc.profitMarginPercent
              : p.profitMarginPercent,
        };
        saveProductOverride(productId, {
          price: updatedItem.price,
          manufacturingCost: updatedItem.manufacturingCost,
          additionalExpenses: updatedItem.additionalExpenses,
          grossProfit: updatedItem.grossProfit,
          profitMarginPercent: updatedItem.profitMarginPercent,
        });
        return updatedItem;
      });

      saveBrowserStoreDb({ ...localDb, products: updatedProducts });
      setProducts(updatedProducts);
      setPriceDrafts((prev) => ({
        ...prev,
        [productId]: roundedPrice.toFixed(2),
      }));
      if (hasCostInput || mCost > 0 || aExp > 0) {
        setProfitDrafts((prev) => ({
          ...prev,
          [productId]: fin.grossProfit.toFixed(2),
        }));
        setMarginDrafts((prev) => ({
          ...prev,
          [productId]: fin.profitMarginPercent.toFixed(2),
        }));
      }
      setSavedPriceId(productId);
      onCatalogUpdated();
      setTimeout(() => {
        setSavedPriceId((curr) => (curr === productId ? null : curr));
      }, 2500);

      // 2. Persist on server
      const payloadBody: Record<string, number> = { price: roundedPrice };
      if (hasCostInput) {
        payloadBody.manufacturingCost = mCost;
        payloadBody.additionalExpenses = aExp;
      }

      const res = await apiFetch(`/api/admin/products/${productId}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBody),
      });

      if (res.status === 401 || res.status === 403) {
        setToken(null);
        return;
      }
    } finally {
      setSavingPriceId(null);
    }
  };

  // Manual bulk price update for currently filtered category or all models
  const handleBulkSetManualPrice = async () => {
    if (!token) return;
    const cleaned = bulkManualPriceInput.replace(/R\$/gi, '').trim().replace(',', '.');
    const numericPrice = parseFloat(cleaned);
    if (isNaN(numericPrice) || numericPrice <= 0) return;
    const roundedPrice = Math.round(numericPrice * 100) / 100;

    const targetProducts = products.filter((prod) => {
      const prodStyle = resolveProductStyleCategory(prod);
      const matchCat =
        adminCategoryFilter === 'Todos' ||
        prodStyle === adminCategoryFilter ||
        prod.category === adminCategoryFilter;
      const matchSearch =
        !adminSearchQuery.trim() ||
        prod.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(adminSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (targetProducts.length === 0) return;
    const targetIds = new Set(targetProducts.map((p) => p.id));

    setSavingBulkPrice(true);
    setBulkPriceSavedMsg('');
    try {
      const localDb = getBrowserStoreDb();
      const nextDrafts: Record<string, string> = { ...priceDrafts };
      const updatedProducts = localDb.products.map((p) => {
        if (!targetIds.has(p.id)) return p;
        const mCost = p.manufacturingCost ?? 0;
        const aExp = p.additionalExpenses ?? 0;
        const calc = calculateProductFinancials(roundedPrice, mCost, aExp);
        nextDrafts[p.id] = roundedPrice.toFixed(2);
        saveProductOverride(p.id, {
          price: roundedPrice,
          grossProfit: mCost > 0 || aExp > 0 ? calc.grossProfit : p.grossProfit,
          profitMarginPercent:
            mCost > 0 || aExp > 0 ? calc.profitMarginPercent : p.profitMarginPercent,
        });
        return {
          ...p,
          price: roundedPrice,
          grossProfit: mCost > 0 || aExp > 0 ? calc.grossProfit : p.grossProfit,
          profitMarginPercent:
            mCost > 0 || aExp > 0 ? calc.profitMarginPercent : p.profitMarginPercent,
        };
      });

      saveBrowserStoreDb({ ...localDb, products: updatedProducts });
      setProducts(updatedProducts);
      setPriceDrafts(nextDrafts);
      onCatalogUpdated();

      await apiFetch('/api/admin/sync-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productOverrides: getProductOverrides(),
        }),
      }).catch(() => {});

      setBulkPriceSavedMsg(
        `Preço ${formatBRL(roundedPrice)} aplicado em ${targetProducts.length} modelo(s) com sucesso!`
      );
      setBulkManualPriceInput('');
      setTimeout(() => setBulkPriceSavedMsg(''), 4000);
    } finally {
      setSavingBulkPrice(false);
    }
  };

  // Batch approval handler for a price tier (e.g., R$ 150,00 -> R$ 149,90) upon owner's click
  const handleApprovePriceTierBatch = async (fromPrice: number, toPrice: number) => {
    if (!token) return;
    const matchingProducts = products.filter(
      (p) => Math.abs(p.price - fromPrice) < 0.01
    );
    if (matchingProducts.length === 0) return;

    const tierKey = `${fromPrice}->${toPrice}`;
    setApprovingTierKey(tierKey);
    try {
      for (const prod of matchingProducts) {
        saveProductOverride(prod.id, { price: toPrice });
        await apiFetch(`/api/admin/products/${prod.id}/price`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ price: toPrice }),
        });
      }

      const localDb = getBrowserStoreDb();
      const updatedProducts = localDb.products.map((p) => {
        if (Math.abs(p.price - fromPrice) >= 0.01) return p;
        const mCost = p.manufacturingCost ?? 0;
        const aExp = p.additionalExpenses ?? 0;
        const calc = calculateProductFinancials(toPrice, mCost, aExp);
        return {
          ...p,
          price: toPrice,
          grossProfit: mCost > 0 || aExp > 0 ? calc.grossProfit : p.grossProfit,
          profitMarginPercent:
            mCost > 0 || aExp > 0 ? calc.profitMarginPercent : p.profitMarginPercent,
        };
      });
      saveBrowserStoreDb({ ...localDb, products: updatedProducts });
      applyDashboardFromDb({ ...localDb, products: updatedProducts });
      onCatalogUpdated();
    } finally {
      setApprovingTierKey(null);
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    updates: {
      productionStatus?: ProductionStatus;
      paymentStatus?: PaymentStatus;
      factoryNotes?: string;
      trackingCode?: string;
      totalAmount?: number;
      depositAmount?: number;
      remainingAmount?: number;
    }
  ) => {
    if (!token) return;
    const targetOrder = orders.find((o) => o.id === orderId);
    updateBrowserOrderAdmin(orderId, updates);
    applyDashboardFromDb(getBrowserStoreDb());
    if (updates.totalAmount !== undefined) {
      setSavedOrderValueId(orderId);
      setTimeout(() => {
        setSavedOrderValueId((curr) => (curr === orderId ? null : curr));
      }, 2500);
    }
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updates,
          orderSnapshot: targetOrder,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        setToken(null);
        return;
      }
      if (res.ok) {
        await fetchAdminData(token);
      }
    } catch {
      // Local state already updated above
    }
  };

  const handleSaveManualOrderTotal = (order: BespokeOrder) => {
    const raw = (orderTotalDrafts[order.id] ?? String(order.totalAmount))
      .replace(/R\$/gi, '')
      .trim()
      .replace(',', '.');
    const parsedTotal = parseFloat(raw);
    if (isNaN(parsedTotal) || parsedTotal <= 0) return;
    const nextTotal = Math.round(parsedTotal * 100) / 100;
    const nextDeposit = Math.round(nextTotal * 0.5 * 100) / 100;
    const nextRemaining = Math.round((nextTotal - nextDeposit) * 100) / 100;
    handleUpdateOrder(order.id, {
      totalAmount: nextTotal,
      depositAmount: nextDeposit,
      remainingAmount: nextRemaining,
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!token) return;
    deleteBrowserOrderAdmin(orderId);
    applyDashboardFromDb(getBrowserStoreDb());
    try {
      await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Local state already updated
    }
  };

  const openNewProductForm = () => {
    setEditingProduct({
      name: '',
      sku: `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      subtitle: 'Modelo Oficial @petersonshoes_ Feito Sob Encomenda',
      category: 'Plataforma',
      price: 149.9,
      image: IMAGE_PRESETS[0].url,
      productionDays: 15,
      featured: true,
      active: true,
      description:
        'Sandália de fabricação própria @petersonshoes_ produzida sob encomenda com material de alta qualidade e acabamento confortável.',
      craftDetails: [
        'Fabricação própria sob encomenda em até 15 dias',
        'Pagamento 50% na encomenda e 50% quando ficar pronta',
      ],
    });
    setModalPriceInput('149,90');
    setColorInputText(
      'Preto:#1B191A, Branco:#F7F7F5, Marsala:#631421, Nude:#DFC1B4, Dourado:#D4AF37, Prata:#C4C9CE, Vermelho:#B31B2C, Rosa:#E07A9B, Outra Cor:#8E7970'
    );
    setHeelInputText('Flatform Anatômica 3,5cm, Flatform Conforto 2,5cm');
    setStrapInputText('Pirâmides Douradas, Pirâmides Cromadas');
    setSizesInputText('34, 35, 36, 37, 38, 39');
  };

  const handleUploadLocalPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token || !editingProduct) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setEditingProduct((prev) => (prev ? { ...prev, image: dataUrl } : prev));
      try {
        const res = await apiFetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setEditingProduct((prev) =>
            prev ? { ...prev, image: data.url } : prev
          );
        }
      } catch {
        // Keeps dataUrl directly in product
      }
    };
    reader.readAsDataURL(file);
  };

  const openEditProductForm = (prod: BespokeProduct) => {
    setEditingProduct({ ...prod, category: resolveProductStyleCategory(prod) });
    setModalPriceInput(prod.price.toFixed(2).replace('.', ','));
    setColorInputText(prod.colors.map((c) => `${c.name}:${c.hex}`).join(', '));
    setHeelInputText(prod.heelOptions.join(', '));
    setStrapInputText(prod.strapFinishes.join(', '));
    setSizesInputText(prod.availableSizes.join(', '));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    setSavingProduct(true);

    const existingProd = products.find((p) => p.id === editingProduct.id);
    const parsedColors = colorInputText
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair, idx) => {
        const [name, hex] = pair.split(':').map((s) => s.trim());
        const matchedExisting = existingProd?.colors[idx];
        const isCustom = (name || '').toLowerCase().includes('outra cor');
        return {
          name: name || 'Dourado',
          hex: hex || '#D4AF37',
          image: matchedExisting?.image || editingProduct.image,
          isCustom,
        };
      });

    const parsedHeels = heelInputText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedStraps = strapInputText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedSizes = sizesInputText
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const defaultImg =
      editingProduct.image || '/instagram/feed_1_C454LXbOzrn_slide_1.jpg';

    const parsedModalPrice = parseFloat(
      String(modalPriceInput || editingProduct.price || 149.9)
        .replace(/R\$/gi, '')
        .trim()
        .replace(',', '.')
    );
    const numericPrice =
      !isNaN(parsedModalPrice) && parsedModalPrice > 0
        ? Math.round(parsedModalPrice * 100) / 100
        : Number(editingProduct.price || 149.9);
    const numericMfgCost = Number(editingProduct.manufacturingCost || 0);
    const numericAddExp = Number(editingProduct.additionalExpenses || 0);
    const prodFinancials = calculateProductFinancials(
      numericPrice,
      numericMfgCost,
      numericAddExp
    );

    const payload: BespokeProduct = {
      id: editingProduct.id || `prod-${Date.now()}`,
      sku:
        editingProduct.sku || `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      name: editingProduct.name || 'Sandália Peterson Shoes',
      subtitle:
        editingProduct.subtitle || 'Sandália Feminina Feita Sob Encomenda',
      category: editingProduct.category || 'Plataforma',
      price: numericPrice,
      manufacturingCost:
        numericMfgCost > 0 ? numericMfgCost : existingProd?.manufacturingCost,
      additionalExpenses:
        numericAddExp > 0 ? numericAddExp : existingProd?.additionalExpenses,
      grossProfit:
        numericMfgCost > 0 || numericAddExp > 0
          ? prodFinancials.grossProfit
          : existingProd?.grossProfit,
      profitMarginPercent:
        numericMfgCost > 0 || numericAddExp > 0
          ? prodFinancials.profitMarginPercent
          : existingProd?.profitMarginPercent,
      image: defaultImg,
      gallery:
        Array.isArray(editingProduct.gallery) &&
        editingProduct.gallery.length > 0
          ? editingProduct.gallery
          : [defaultImg],
      instagramPostUrl:
        editingProduct.instagramPostUrl ||
        'https://www.instagram.com/petersonshoes_/',
      heelOptions:
        parsedHeels.length > 0
          ? parsedHeels
          : ['Flatform Anatômica 3,5cm', 'Anabela 8cm'],
      strapFinishes:
        parsedStraps.length > 0
          ? parsedStraps
          : ['Metais Dourados', 'Metais Prateados'],
      colors:
        parsedColors.length > 0
          ? parsedColors
          : buildStandardColors('Dourado', defaultImg),
      availableSizes: parsedSizes.length > 0 ? parsedSizes : STANDARD_SIZES,
      productionDays: Number(editingProduct.productionDays || 15),
      featured: Boolean(editingProduct.featured),
      active:
        editingProduct.active !== undefined
          ? Boolean(editingProduct.active)
          : true,
      description:
        editingProduct.description ||
        'Sandália artesanal Peterson Shoes produzida sob encomenda com material de alta qualidade.',
      craftDetails:
        Array.isArray(editingProduct.craftDetails) &&
        editingProduct.craftDetails.length > 0
          ? editingProduct.craftDetails
          : [
              'Fabricação própria sob encomenda em 15 dias (Numeração 34 ao 39)',
              'Pagamento 50% na encomenda (Pix ou Cartão) e 50% quando ficar pronta',
            ],
      createdAt: editingProduct.createdAt || new Date().toISOString(),
    };

    try {
      saveProductOverride(payload.id, {
        price: payload.price,
        name: payload.name,
        subtitle: payload.subtitle,
        category: payload.category,
        manufacturingCost: payload.manufacturingCost,
        additionalExpenses: payload.additionalExpenses,
        grossProfit: payload.grossProfit,
        profitMarginPercent: payload.profitMarginPercent,
      });

      const localDb = getBrowserStoreDb();
      const isExisting = Boolean(editingProduct.id);
      const nextProducts = isExisting
        ? localDb.products.map((p) => (p.id === payload.id ? payload : p))
        : [payload, ...localDb.products];
      saveBrowserStoreDb({ ...localDb, products: nextProducts });
      applyDashboardFromDb({ ...localDb, products: nextProducts });

      const url = isExisting
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        setToken(null);
        return;
      }

      if (res.ok) {
        await fetchAdminData(token);
      }
      setEditingProduct(null);
      onCatalogUpdated();
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    try {
      const res = await apiFetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setToken(null);
        return;
      }
      if (res.ok) {
        await fetchAdminData(token);
        onCatalogUpdated();
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settings) return;
    setSavingSettings(true);
    setSettingsSavedMsg('');
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.status === 401 || res.status === 403) {
        setToken(null);
        return;
      }

      if (res.ok) {
        await fetchAdminData(token);
        setSettingsSavedMsg(
          'Configurações salvas e aplicadas na loja com sucesso!'
        );
        onCatalogUpdated();
        setTimeout(() => setSettingsSavedMsg(''), 3500);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2500);
  };

  const activeEnv = getActiveEnvironment();

  // If not logged in, render Protected Admin Login / Initial Setup Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col justify-center items-center p-4">
        <div className="bg-white border border-[#DFD3C3] rounded-xl max-w-md w-full p-8 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-6">
            <button
              onClick={onCloseAdmin}
              className="text-xs font-medium text-[#5B1824] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para a Vitrine da Loja
            </button>
            <span
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                activeEnv === 'homologacao'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {activeEnv === 'homologacao' ? '🧪 Homologação' : '🔒 Produção'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[#5B1824] mb-2">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Acesso Restrito · Proprietária Peterson Shoes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#231619]">
            Painel Administrativo
          </h1>
          <p className="text-xs text-[#6E5A5F] mt-1 leading-relaxed">
            Área restrita e protegida por senha exclusiva da proprietária da <strong>Peterson Shoes</strong>. Digite seu e-mail e senha administrativa para gerenciar preços, confirmar pedidos e acessar os vídeos da loja.
          </p>

          {loginError && (
            <div className="mt-4 p-3 rounded-lg bg-[#7A2434]/10 border border-[#7A2434] text-xs text-[#5B1824] font-medium">
              {loginError}
            </div>
          )}

          {checkingAuthStatus ? (
            <div className="py-8 text-center text-xs text-[#6E5A5F]">
              Verificando proteção do servidor...
            </div>
          ) : (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#231619] mb-1">
                  E-mail Administrativo *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="Digite seu e-mail de administradora"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#231619] mb-1">
                  {needsInitialSetup
                    ? 'Criar Senha Forte (mínimo 8 caracteres) *'
                    : 'Senha de Acesso *'}
                </label>
                <input
                  type="password"
                  required
                  autoComplete={
                    needsInitialSetup ? 'new-password' : 'current-password'
                  }
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                />
              </div>
              {needsInitialSetup && (
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={confirmSetupPassword}
                    onChange={(e) => setConfirmSetupPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                {needsInitialSetup
                  ? 'Salvar Senha Criptografada e Entrar'
                  : 'Entrar no Painel de Gestão'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const pendingConfirmationOrders = orders.filter(
    (o) =>
      o.paymentStatus === 'AGUARDANDO_ENTRADA_50' ||
      o.productionStatus === 'AGUARDANDO_CONFIRMACAO'
  );

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#231619]">
      {/* Real-time Sync Status Banner inside Admin */}
      <div className="px-6 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-3 bg-emerald-950 text-emerald-100 border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            🔒 PAINEL OFICIAL PETERSON SHOES — Sincronização em Tempo Real Ativa (novos pedidos aparecem automaticamente na tela a cada 2 segundos).
          </span>
        </div>
      </div>

      {/* Admin Header */}
      <header className="bg-[#5B1824] text-[#F7F3EC] px-6 py-4 border-b border-[#46111B]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onCloseAdmin}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Loja Online</span>
            </button>
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                Peterson Shoes · Gestão de Preços, Encomendas & Pagamentos
              </h1>
              <p className="text-xs text-[#E5D3B3]">
                Confirmação Manual de Recebimento (Banco Inter) · 50% Entrada + 50% na Entrega
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => token && fetchAdminData(token)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </button>
            <button
              onClick={() => {
                apiFetch('/api/admin/logout', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                }).catch(() => {});
                setToken(null);
              }}
              className="px-3 py-1.5 bg-black/25 hover:bg-black/40 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* CENTRAL DE PEDIDOS AGUARDANDO CONFIRMAÇÃO DA PETERSON SHOES */}
        <div
          className={`rounded-2xl p-6 border-2 shadow-sm transition-colors ${
            pendingConfirmationOrders.length > 0
              ? 'bg-[#FFF9EB] border-[#D4AF37]'
              : 'bg-white border-[#DFD3C3]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    pendingConfirmationOrders.length > 0
                      ? 'bg-[#8C4A27] text-white'
                      : 'bg-[#2E6B3E]/15 text-[#2E6B3E]'
                  }`}
                >
                  {pendingConfirmationOrders.length > 0
                    ? `🔔 ${pendingConfirmationOrders.length} Pedido(s) Aguardando sua Confirmação`
                    : '✅ Tudo em Dia · Nenhum Pedido Pendente'}
                </span>
                <span className="text-[11px] font-semibold text-[#2E6B3E] flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#2E6B3E] animate-pulse" />
                  Atualização Instantânea Ativa
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#231619]">
                Pedidos Aguardando Confirmação da Peterson Shoes
              </h2>
              <p className="text-xs text-[#6E5A5F]">
                Quando a cliente confirma o Pix no site, o pedido vai <strong>na mesma hora para o seu WhatsApp (62 98499-8265)</strong> com todas as informações e um <strong>Link Admin</strong> no final da mensagem. Ao tocar no Link Admin recebido no WhatsApp, o pedido aparece automaticamente aqui abaixo para você aprovar em 1 clique!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ORDERS')}
              className="px-4 py-2.5 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Ver Todos os Pedidos ({orders.length})
            </button>
          </div>

          {pendingConfirmationOrders.length > 0 && (
            <div className="mt-5 space-y-3">
              {pendingConfirmationOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-[#D4AF37]/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono-tabular font-bold text-sm text-[#5B1824] bg-[#5B1824]/10 px-2 py-0.5 rounded">
                        #{order.orderCode}
                      </span>
                      <span className="font-bold text-[#231619] text-sm">
                        {order.customerName}
                      </span>
                      <span className="text-[#6E5A5F]">· WhatsApp: {order.customerWhatsapp}</span>
                    </div>
                    <p className="text-xs text-[#4A373B]">
                      {order.items
                        .map(
                          (it) =>
                            `${it.quantity}x ${it.name} (Cor: ${it.colorName}, Tam: ${it.size} BR)`
                        )
                        .join(' + ')}
                    </p>
                    <p className="text-xs font-mono-tabular text-[#5B1824] font-semibold">
                      Valor Total: {formatBRL(order.totalAmount)} · Entrada 50% a Confirmar:{' '}
                      <strong className="text-[#2E6B3E]">{formatBRL(order.depositAmount)}</strong> (
                      {order.paymentMethod === 'PIX_50_50' ? 'Pix' : 'Cartão'})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateOrder(order.id, {
                          paymentStatus: 'ENTRADA_50_PAGA',
                          productionStatus: 'CORTE_MODELAGEM',
                        })
                      }
                      className="px-4 py-2.5 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Recebimento dos 50% e Aprovar Pedido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="px-3 py-2.5 bg-[#7A2434]/10 hover:bg-[#7A2434]/20 text-[#7A2434] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Excluir Teste / Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial & Visitor Summary KPI Strip */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div
              onClick={() => setActiveTab('ANALYTICS')}
              className="bg-white border-2 border-[#5B1824]/30 hover:border-[#5B1824] rounded-xl p-5 cursor-pointer transition-colors"
            >
              <p className="text-xs font-semibold text-[#5B1824]">
                Acessos & Visitantes no Site
              </p>
              <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                {analytics.totalVisits} Visitas
              </p>
              <p className="text-xs text-[#6E5A5F] mt-1">
                {analytics.uniqueVisitorsCount} visitante(s) único(s) · Hoje:{' '}
                {analytics.dailyVisits[new Date().toISOString().split('T')[0]] || 0}
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl p-5">
              <p className="text-xs text-[#6E5A5F]">Modelos do Instagram Ativos</p>
              <p className="text-2xl font-bold text-[#5B1824] font-mono-tabular mt-1">
                {metrics.totalProductsCount} Modelos
              </p>
              <p className="text-xs text-[#6E5A5F] mt-1">
                Edição rápida de preços em 1 clique abaixo
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl p-5">
              <p className="text-xs text-[#6E5A5F]">Volume Total de Encomendas</p>
              <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                {formatBRL(metrics.totalOrdersVolume)}
              </p>
              <p className="text-xs text-[#5B1824] mt-1">
                {metrics.totalOrdersCount} encomenda(s) registrada(s)
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl p-5">
              <p className="text-xs text-[#6E5A5F]">Total Recebido (Pix Confirmados)</p>
              <p className="text-2xl font-bold text-[#2E6B3E] font-mono-tabular mt-1">
                {formatBRL(metrics.totalPaidAmount)}
              </p>
              <p className="text-xs text-[#6E5A5F] mt-1">
                Entradas de 50% + Quitações finais
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl p-5">
              <p className="text-xs text-[#6E5A5F]">Saldo a Receber (50% Restantes)</p>
              <p className="text-2xl font-bold text-[#8C4A27] font-mono-tabular mt-1">
                {formatBRL(metrics.pendingReceivables)}
              </p>
              <p className="text-xs text-[#5B1824] mt-1">
                {metrics.readyForFinalPaymentCount} pronta(s) aguardando 50% final
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#EFE7DA] border border-[#DFD3C3] rounded-xl">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PRODUCTS'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#4A373B] hover:text-[#231619]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Modelos do Instagram & Edição Manual de Preços ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#4A373B] hover:text-[#231619]'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>
              Encomendas & Confirmação de Pedidos ({orders.length}
              {pendingConfirmationOrders.length > 0
                ? ` · 🔔 ${pendingConfirmationOrders.length} Pendente`
                : ''}
              )
            </span>
          </button>

          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'FINANCE'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#4A373B] hover:text-[#231619]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pagamentos 50%/50% & Pix Mercado Pago</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'CUSTOMERS'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#4A373B] hover:text-[#231619]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SETTINGS'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#5B1824] bg-[#5B1824]/10 hover:bg-[#5B1824]/20'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cadastrar Banco, Chave Pix & Cartão</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ANALYTICS'
                ? 'bg-[#5B1824] text-[#F7F3EC] shadow-xs'
                : 'text-[#5B1824] bg-[#5B1824]/10 hover:bg-[#5B1824]/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Acessos & Visitantes ({analytics.totalVisits})</span>
          </button>

          <button
            onClick={() => setActiveTab('SEO')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SEO'
                ? 'bg-[#2E6B3E] text-white shadow-xs'
                : 'text-[#2E6B3E] bg-[#2E6B3E]/10 hover:bg-[#2E6B3E]/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Google & SEO (Aparecer nas Buscas)</span>
          </button>

          <button
            onClick={() => setActiveTab('REELS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'REELS'
                ? 'bg-[#231619] text-[#E5D3B3] shadow-xs'
                : 'text-[#5B1824] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30'
            }`}
          >
            <span>🎬 Vídeo Reels Instagram (Exclusivo Loja)</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS CATALOG, COST/PROFIT CALCULATOR & PSYCHOLOGICAL PRICING (.90) */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            <div className="p-5 bg-white border border-[#DFD3C3] rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                  Gestão Estratégica de Custos, Lucro, Margem & Precificação Psicológica (,90)
                </span>
                <h2 className="text-2xl font-semibold text-[#231619]">
                  Todos os {products.length} Modelos Sob Encomenda @petersonshoes_
                </h2>
                <p className="text-xs text-[#6E5A5F] max-w-3xl">
                  Cadastre e edite o <strong>Custo de Fabricação</strong>,{' '}
                  <strong>Despesas Adicionais por Produto</strong> e o{' '}
                  <strong>Preço de Venda (R$)</strong>. O sistema calcula automaticamente o{' '}
                  <strong>Lucro Bruto (R$)</strong> e a <strong>Margem de Lucro (%)</strong> sem
                  nunca alterar seus custos automaticamente e sem modificar nenhum preço cadastrado sem
                  a sua autorização.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewProductForm}
                className="px-4 py-2.5 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Modelo</span>
              </button>
            </div>

            {/* PAINEL DE SUGESTÕES DE PADRONIZAÇÃO PSICOLÓGICA (,90) PARA APROVAÇÃO DA PROPRIETÁRIA */}
            {(() => {
              const nonStandardProducts = products.filter(
                (p) => !isPsychological90Price(p.price)
              );
              const standardCount = products.length - nonStandardProducts.length;
              const tierGroups = [150, 130, 110, 100]
                .map((basePrice) => ({
                  basePrice,
                  items: nonStandardProducts.filter(
                    (p) => Math.abs(p.price - basePrice) < 0.01
                  ),
                  psychPrice: basePrice - 0.1, // Ex: 150 -> 149,90 | 130 -> 129,90
                  upTierPrice: basePrice + 9.9, // Ex: 150 -> 159,90 | 130 -> 139,90 (zero redução)
                }))
                .filter((g) => g.items.length > 0);

              return (
                <div className="p-5 bg-[#FAF6F0] border-2 border-[#5B1824]/25 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#5B1824] text-[#F7F3EC] text-[10px] font-bold uppercase tracking-wider">
                          Estratégia Psicológica Final ,90
                        </span>
                        <span className="text-xs font-semibold text-[#2E6B3E]">
                          {standardCount} de {products.length} modelos já padronizados com final ,90
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#231619]">
                        Sugestões de Padronização de Preços (Aguardando Sua Aprovação)
                      </h3>
                      <p className="text-xs text-[#6E5A5F] max-w-3xl">
                        Os 8 novos modelos de Scarpins & Saltos (<code className="font-mono-tabular">PTS-IG-47</code> a{' '}
                        <code className="font-mono-tabular">PTS-IG-54</code>) já foram atualizados para{' '}
                        <strong className="text-[#5B1824]">R$ 149,90</strong> conforme solicitado. Os demais{' '}
                        <strong>{nonStandardProducts.length} modelos</strong> permanecem nos valores originais até
                        que você aprove uma sugestão abaixo ou ajuste individualmente no card de cada produto:
                      </p>
                    </div>
                  </div>

                  {tierGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {tierGroups.map((group) => (
                        <div
                          key={group.basePrice}
                          className="p-3.5 bg-white border border-[#DFD3C3] rounded-xl flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E5A5F]">
                                Faixa Atual: {formatBRL(group.basePrice)}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#F7F3EC] text-[#5B1824] text-[11px] font-bold font-mono-tabular">
                                {group.items.length} modelo(s)
                              </span>
                            </div>
                            <p className="text-xs text-[#4A373B] mt-1.5">
                              Sugestão Psicológica:{' '}
                              <strong className="text-[#231619] font-mono-tabular">
                                {formatBRL(group.basePrice)} → {formatBRL(group.psychPrice)}
                              </strong>
                            </p>
                            <p className="text-[11px] text-[#6E5A5F] mt-0.5">
                              Ou manter/elevar margem:{' '}
                              <strong className="text-[#2E6B3E] font-mono-tabular">
                                {formatBRL(group.upTierPrice)}
                              </strong>
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#EFE7DA]">
                            <button
                              type="button"
                              disabled={approvingTierKey !== null}
                              onClick={() =>
                                handleApprovePriceTierBatch(
                                  group.basePrice,
                                  group.psychPrice
                                )
                              }
                              className="w-full py-1.5 px-2.5 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              {approvingTierKey ===
                              `${group.basePrice}->${group.psychPrice}`
                                ? 'Aplicando...'
                                : `Aprovar ${formatBRL(group.psychPrice)} (${group.items.length})`}
                            </button>
                            <button
                              type="button"
                              disabled={approvingTierKey !== null}
                              onClick={() =>
                                handleApprovePriceTierBatch(
                                  group.basePrice,
                                  group.upTierPrice
                                )
                              }
                              className="w-full py-1.5 px-2.5 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              {approvingTierKey ===
                              `${group.basePrice}->${group.upTierPrice}`
                                ? 'Aplicando...'
                                : `Aprovar ${formatBRL(group.upTierPrice)} (Sem Reduzir)`}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#2E6B3E]/10 border border-[#2E6B3E]/30 rounded-lg text-xs text-[#2E6B3E] font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>
                        Todos os produtos do catálogo já estão padronizados com precificação psicológica final ,90!
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* FILTRO POR ESTILO, BUSCA RÁPIDA & EDIÇÃO MANUAL EM LOTE */}
            <div className="p-5 bg-white border-2 border-[#5B1824]/25 rounded-xl space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B1824]">
                    ✏️ Edição Manual de Valores (Individual ou por Categoria)
                  </span>
                  <h3 className="text-base font-bold text-[#231619]">
                    Filtre por Estilo, Busque pelo Nome/SKU ou Defina um Valor Manual
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <span className="text-xs font-semibold text-[#6E5A5F] absolute left-3 top-1/2 -translate-y-1/2">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 149,90"
                      value={bulkManualPriceInput}
                      onChange={(e) => setBulkManualPriceInput(e.target.value)}
                      className="w-36 pl-8 pr-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] focus:border-[#5B1824] rounded-lg text-xs font-mono-tabular font-bold text-[#231619] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingBulkPrice || !bulkManualPriceInput.trim()}
                    onClick={handleBulkSetManualPrice}
                    className="px-3.5 py-2 bg-[#5B1824] hover:bg-[#46111B] disabled:opacity-50 text-[#F7F3EC] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {savingBulkPrice
                      ? 'Aplicando...'
                      : `Aplicar Valor em "${adminCategoryFilter}"`}
                  </button>
                </div>
              </div>

              {bulkPriceSavedMsg && (
                <div className="p-2.5 rounded-lg bg-[#2E6B3E]/10 border border-[#2E6B3E]/30 text-xs font-semibold text-[#2E6B3E] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{bulkPriceSavedMsg}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFE7DA]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const count =
                      cat === 'Todos'
                        ? products.length
                        : products.filter(
                            (p) =>
                              resolveProductStyleCategory(p) === cat ||
                              p.category === cat
                          ).length;
                    const active = adminCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setAdminCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#5B1824] text-[#F7F3EC]'
                            : 'bg-[#F7F3EC] text-[#4A373B] hover:bg-[#EFE7DA]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Buscar modelo por nome ou código (ex: PTS-LKS)..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2 bg-[#F7F3EC] border border-[#DFD3C3] focus:border-[#5B1824] rounded-lg text-xs text-[#231619] focus:outline-none"
                />
              </div>
            </div>

            {/* Full Product Editor Modal/Form (Optional when editing full details) */}
            {editingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white border-2 border-[#5B1824] rounded-xl p-6 space-y-4 shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-[#EFE7DA] pb-3">
                  <h3 className="text-lg font-semibold text-[#5B1824]">
                    {editingProduct.id
                      ? `Editando Detalhes Completos: ${editingProduct.name}`
                      : 'Cadastrar Nova Sandália Peterson Shoes'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-[#6E5A5F] hover:text-[#231619] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Nome da Sandália *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Código SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.sku || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, sku: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Estilo / Categoria *
                    </label>
                    <select
                      value={editingProduct.category || 'Plataforma'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    >
                      <option value="Plataforma">Plataforma</option>
                      <option value="Sandália de Salto">Sandália de Salto</option>
                      <option value="Rasteiras">Rasteiras</option>
                      <option value="Papetes">Papetes</option>
                      <option value="Chinelos">Chinelos</option>
                      <option value="Scarpin">Scarpin</option>
                      <option value="Tênis Casual">Tênis Casual</option>
                    </select>
                  </div>
                </div>

                {/* Bloco de Custos, Preço de Venda, Lucro Bruto e Margem no Modal */}
                {(() => {
                  const parsedModalP = parseFloat(
                    String(modalPriceInput || editingProduct.price || 149.9)
                      .replace(',', '.')
                  );
                  const modalPrice =
                    !isNaN(parsedModalP) && parsedModalP > 0
                      ? parsedModalP
                      : Number(editingProduct.price ?? 149.9);
                  const modalCost = Number(editingProduct.manufacturingCost ?? 0);
                  const modalExp = Number(editingProduct.additionalExpenses ?? 0);
                  const modalFin = calculateProductFinancials(
                    modalPrice,
                    modalCost,
                    modalExp
                  );
                  return (
                    <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#DFD3C3] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#231619] mb-1">
                          Custo de Fabricação (R$)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 55,00"
                          value={editingProduct.manufacturingCost ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.');
                            setEditingProduct({
                              ...editingProduct,
                              manufacturingCost:
                                val === '' ? undefined : parseFloat(val),
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#231619] mb-1">
                          Despesas Adicionais (R$)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Embalagem, etc."
                          value={editingProduct.additionalExpenses ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.');
                            setEditingProduct({
                              ...editingProduct,
                              additionalExpenses:
                                val === '' ? undefined : parseFloat(val),
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5B1824] mb-1">
                          Preço de Venda (R$) *
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          placeholder="Ex: 149,90"
                          value={modalPriceInput}
                          onChange={(e) => {
                            setModalPriceInput(e.target.value);
                            const parsed = parseFloat(
                              e.target.value.replace(',', '.')
                            );
                            if (!isNaN(parsed) && parsed > 0) {
                              setEditingProduct({
                                ...editingProduct,
                                price: parsed,
                              });
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border-2 border-[#5B1824] rounded-lg text-xs font-mono-tabular font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2E6B3E] mb-1">
                          Lucro Bruto (R$)
                        </label>
                        <div className="w-full px-3 py-2 bg-[#EFE7DA]/60 border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular font-bold text-[#2E6B3E]">
                          {formatBRL(modalFin.grossProfit)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2E6B3E] mb-1">
                          Margem de Lucro (%)
                        </label>
                        <div className="w-full px-3 py-2 bg-[#EFE7DA]/60 border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular font-bold text-[#2E6B3E]">
                          {modalFin.profitMarginPercent.toFixed(1).replace('.', ',')}%
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Subtítulo / Material
                    </label>
                    <input
                      type="text"
                      value={editingProduct.subtitle || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          subtitle: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Prazo de Produção Sob Encomenda (Dias)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.productionDays ?? 15}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          productionDays: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Foto do Produto (Fotos Reais @petersonshoes_ ou Enviar Nova Foto)
                    </label>
                    <select
                      value={editingProduct.image || IMAGE_PRESETS[0].url}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, image: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs mb-2"
                    >
                      {IMAGE_PRESETS.map((preset) => (
                        <option key={preset.url} value={preset.url}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editingProduct.image || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, image: e.target.value })
                        }
                        placeholder="Ou cole a URL da foto..."
                        className="flex-1 px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                      />
                      <label className="px-3 py-2 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold cursor-pointer text-center whitespace-nowrap">
                        <span>Enviar Foto do Aparelho</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLocalPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Descrição Detalhada da Sandália
                    </label>
                    <textarea
                      rows={3}
                      value={editingProduct.description || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Cores Disponíveis (Nome:#HEX separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={colorInputText}
                      onChange={(e) => setColorInputText(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Opções de Salto (Separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={heelInputText}
                      onChange={(e) => setHeelInputText(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Opções de Fivela / Acabamento (Separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={strapInputText}
                      onChange={(e) => setStrapInputText(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Numerações Disponíveis (Separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={sizesInputText}
                      onChange={(e) => setSizesInputText(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE7DA]">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-[#EFE7DA] text-[#231619] rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-5 py-2 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {savingProduct ? 'Salvando no Banco...' : 'Salvar Produto na Loja'}
                  </button>
                </div>
              </form>
            )}

            {/* Products Grid with Cost, Expenses, Sale Price, Profit, Margin & Psychological .90 Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products
                .filter((prod) => {
                  const prodStyle = resolveProductStyleCategory(prod);
                  const matchCat =
                    adminCategoryFilter === 'Todos' ||
                    prodStyle === adminCategoryFilter ||
                    prod.category === adminCategoryFilter;
                  const matchSearch =
                    !adminSearchQuery.trim() ||
                    prod.name
                      .toLowerCase()
                      .includes(adminSearchQuery.toLowerCase()) ||
                    prod.sku
                      .toLowerCase()
                      .includes(adminSearchQuery.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((prod) => {
                const draftVal = priceDrafts[prod.id] ?? prod.price.toFixed(2);
                const costVal = costDrafts[prod.id] ?? '';
                const expVal = expenseDrafts[prod.id] ?? '';
                const profitVal = profitDrafts[prod.id] ?? '';
                const marginVal = marginDrafts[prod.id] ?? '';

                const numericDraft = parseFloat(String(draftVal).replace(',', '.'));
                const activeSalePrice = !isNaN(numericDraft) && numericDraft > 0
                  ? numericDraft
                  : prod.price;
                const numericCost = parseNumInput(costVal);
                const numericExp = parseNumInput(expVal);
                const totalUnitCost = numericCost + numericExp;
                const liveFinancials = calculateProductFinancials(
                  activeSalePrice,
                  numericCost,
                  numericExp
                );
                const previewDeposit = activeSalePrice * 0.5;
                const isJustSaved = savedPriceId === prod.id;
                const hasPsych90 = isPsychological90Price(prod.price);
                const psychSuggestions = getPsychologicalPriceSuggestions(prod.price);

                // Check if admin simulated a different profit or margin that suggests a new .90 sale price
                const desiredMarginNum = parseFloat(String(marginVal).replace(',', '.'));
                const suggestedPriceFromMargin =
                  totalUnitCost > 0 &&
                  !isNaN(desiredMarginNum) &&
                  desiredMarginNum > 0 &&
                  desiredMarginNum < 95
                    ? suggestSalePriceFromMargin(
                        numericCost,
                        numericExp,
                        desiredMarginNum,
                        true
                      )
                    : null;

                return (
                  <div
                    key={prod.id}
                    className="bg-white border border-[#DFD3C3] rounded-xl overflow-hidden flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="aspect-4/5 bg-[#EFE7DA] relative border-b border-[#EFE7DA]">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/65 text-white text-[11px] font-mono-tabular">
                          {prod.sku} · {prod.colors.length} cor(es)
                        </div>
                        <div
                          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono-tabular ${
                            hasPsych90
                              ? 'bg-[#2E6B3E] text-white'
                              : 'bg-[#5B1824] text-[#F7F3EC]'
                          }`}
                        >
                          {formatBRL(prod.price)}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5B1824]">
                              {prod.category}
                            </p>
                            <span className="text-[10px] font-medium text-[#6E5A5F]">
                              Sob Encomenda ({prod.productionDays}d)
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-[#231619] mt-0.5">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#6E5A5F] mt-0.5 line-clamp-1">
                            {prod.subtitle}
                          </p>
                        </div>

                        {/* PAINEL DE PRECIFICAÇÃO, CUSTO DE FABRICAÇÃO, DESPESAS, LUCRO E MARGEM */}
                        <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#5B1824]">
                              Precificação & Estrutura de Lucro
                            </span>
                            {isJustSaved && (
                              <span className="text-[11px] font-semibold text-[#2E6B3E] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Salvo com sucesso!
                              </span>
                            )}
                          </div>

                          {/* Linha 1: Custo de Fabricação + Despesas Adicionais */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor={`cost-input-${prod.id}`}
                                className="block text-[10px] font-semibold text-[#4A373B] mb-1"
                              >
                                Custo de Fabricação (R$)
                              </label>
                              <div className="relative">
                                <span className="text-[10px] font-semibold text-[#6E5A5F] absolute left-2.5 top-1/2 -translate-y-1/2">
                                  R$
                                </span>
                                <input
                                  id={`cost-input-${prod.id}`}
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  placeholder="0,00"
                                  value={costVal}
                                  onChange={(e) =>
                                    handleFinancialFieldChange(
                                      prod.id,
                                      'cost',
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-[#DFD3C3] focus:border-[#5B1824] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`exp-input-${prod.id}`}
                                className="block text-[10px] font-semibold text-[#4A373B] mb-1"
                              >
                                Despesas Adicionais (R$)
                              </label>
                              <div className="relative">
                                <span className="text-[10px] font-semibold text-[#6E5A5F] absolute left-2.5 top-1/2 -translate-y-1/2">
                                  R$
                                </span>
                                <input
                                  id={`exp-input-${prod.id}`}
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  placeholder="0,00"
                                  value={expVal}
                                  onChange={(e) =>
                                    handleFinancialFieldChange(
                                      prod.id,
                                      'expenses',
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-[#DFD3C3] focus:border-[#5B1824] rounded-lg text-xs font-mono-tabular text-[#231619] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Linha 2: Lucro Bruto (R$) + Margem de Lucro (%) — Calculados automaticamente e editáveis */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor={`profit-input-${prod.id}`}
                                className="block text-[10px] font-semibold text-[#2E6B3E] mb-1"
                              >
                                Lucro Bruto (R$)
                              </label>
                              <div className="relative">
                                <span className="text-[10px] font-semibold text-[#2E6B3E] absolute left-2.5 top-1/2 -translate-y-1/2">
                                  R$
                                </span>
                                <input
                                  id={`profit-input-${prod.id}`}
                                  type="number"
                                  step="0.10"
                                  placeholder={liveFinancials.grossProfit.toFixed(2)}
                                  value={
                                    profitVal !== ''
                                      ? profitVal
                                      : totalUnitCost > 0
                                        ? liveFinancials.grossProfit.toFixed(2)
                                        : ''
                                  }
                                  onChange={(e) =>
                                    handleTargetProfitOrMarginChange(
                                      prod.id,
                                      'profit',
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-[#2E6B3E]/40 focus:border-[#2E6B3E] rounded-lg text-xs font-mono-tabular font-semibold text-[#2E6B3E] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`margin-input-${prod.id}`}
                                className="block text-[10px] font-semibold text-[#2E6B3E] mb-1"
                              >
                                Margem de Lucro (%)
                              </label>
                              <div className="relative">
                                <input
                                  id={`margin-input-${prod.id}`}
                                  type="number"
                                  step="0.5"
                                  placeholder={liveFinancials.profitMarginPercent.toFixed(1)}
                                  value={
                                    marginVal !== ''
                                      ? marginVal
                                      : totalUnitCost > 0
                                        ? liveFinancials.profitMarginPercent.toFixed(2)
                                        : ''
                                  }
                                  onChange={(e) =>
                                    handleTargetProfitOrMarginChange(
                                      prod.id,
                                      'margin',
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-2.5 pr-6 py-1.5 bg-white border border-[#2E6B3E]/40 focus:border-[#2E6B3E] rounded-lg text-xs font-mono-tabular font-semibold text-[#2E6B3E] focus:outline-none"
                                />
                                <span className="text-[10px] font-semibold text-[#2E6B3E] absolute right-2.5 top-1/2 -translate-y-1/2">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Resumo Automático de Custo Total, Lucro Bruto e Margem */}
                          <div className="px-2.5 py-2 rounded-lg bg-white/80 border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular">
                            <span className="text-[#6E5A5F]">
                              Custo Total:{' '}
                              <strong className="text-[#231619]">
                                {formatBRL(totalUnitCost)}
                              </strong>
                            </span>
                            <span className="text-[#2E6B3E]">
                              Lucro:{' '}
                              <strong>{formatBRL(liveFinancials.grossProfit)}</strong> (
                              <strong>
                                {liveFinancials.profitMarginPercent
                                  .toFixed(1)
                                  .replace('.', ',')}
                                %
                              </strong>
                              )
                            </span>
                          </div>

                          {/* Sugestão automática caso a proprietária simule uma margem específica */}
                          {suggestedPriceFromMargin !== null &&
                            Math.abs(suggestedPriceFromMargin - activeSalePrice) >= 0.1 && (
                              <div className="p-2 rounded-lg bg-[#2E6B3E]/10 border border-[#2E6B3E]/30 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-[#231619]">
                                  Preço sugerido p/ margem de{' '}
                                  <strong>{desiredMarginNum.toFixed(1).replace('.', ',')}%</strong>:{' '}
                                  <strong className="text-[#2E6B3E] font-mono-tabular">
                                    {formatBRL(suggestedPriceFromMargin)}
                                  </strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFinancialFieldChange(
                                      prod.id,
                                      'price',
                                      suggestedPriceFromMargin.toFixed(2)
                                    )
                                  }
                                  className="px-2 py-1 bg-[#2E6B3E] text-white rounded text-[10px] font-semibold cursor-pointer shrink-0"
                                >
                                  Usar {formatBRL(suggestedPriceFromMargin)}
                                </button>
                              </div>
                            )}

                          {/* Linha 3: Preço de Venda (R$) + Botão Salvar */}
                          <div>
                            <label
                              htmlFor={`price-input-${prod.id}`}
                              className="block text-[11px] font-bold text-[#5B1824] mb-1"
                            >
                              ✏️ Preço de Venda Manual no Site (R$):
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="text-xs font-semibold text-[#6E5A5F] absolute left-3 top-1/2 -translate-y-1/2">
                                  R$
                                </span>
                                <input
                                  id={`price-input-${prod.id}`}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="Ex: 149,90"
                                  value={draftVal}
                                  onChange={(e) =>
                                    handleFinancialFieldChange(
                                      prod.id,
                                      'price',
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickSavePrice(prod.id);
                                    }
                                  }}
                                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-[#5B1824]/40 focus:border-[#5B1824] rounded-lg text-sm font-mono-tabular font-bold text-[#231619] focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={savingPriceId === prod.id}
                                onClick={() => handleQuickSavePrice(prod.id)}
                                className="px-3.5 py-2 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                              >
                                {savingPriceId === prod.id ? 'Salvando...' : 'Salvar Valor'}
                              </button>
                            </div>
                          </div>

                          {/* Sugestão individual de padronização ,90 (caso o preço atual não termine em ,90) */}
                          {!hasPsych90 && (
                            <div className="p-2.5 rounded-lg bg-white border border-[#5B1824]/25 space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B1824]">
                                Sugestão Psicológica (,90) — Aprovação Manual:
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={savingPriceId === prod.id}
                                  onClick={() =>
                                    handleQuickSavePrice(
                                      prod.id,
                                      psychSuggestions.nearestPsychological
                                    )
                                  }
                                  className="px-2.5 py-1 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-md text-[11px] font-semibold font-mono-tabular cursor-pointer"
                                >
                                  Aprovar {formatBRL(psychSuggestions.nearestPsychological)}
                                </button>
                                <button
                                  type="button"
                                  disabled={savingPriceId === prod.id}
                                  onClick={() =>
                                    handleQuickSavePrice(
                                      prod.id,
                                      psychSuggestions.marginPreservingUp
                                    )
                                  }
                                  className="px-2.5 py-1 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-md text-[11px] font-semibold font-mono-tabular cursor-pointer"
                                >
                                  Aprovar {formatBRL(psychSuggestions.marginPreservingUp)}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-[#4A373B] pt-1 border-t border-[#E6DDD0] font-mono-tabular">
                            <span>
                              Entrada 50% (Pix):{' '}
                              <strong className="text-[#5B1824]">
                                {formatBRL(previewDeposit)}
                              </strong>
                            </span>
                            <span>
                              Final 50%:{' '}
                              <strong>{formatBRL(previewDeposit)}</strong>
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#6E5A5F]">
                          Cores: {prod.colors.map((c) => c.name).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-[#EFE7DA] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEditProductForm(prod)}
                        className="flex-1 py-2 px-3 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Detalhes / Fotos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="py-2 px-3 bg-white hover:bg-[#7A2434]/10 text-[#7A2434] border border-[#DFD3C3] rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & 15-DAY PRODUCTION */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#231619]">
                  Controle de Encomendas & Envio Direto ao WhatsApp
                </h2>
                <p className="text-xs text-[#6E5A5F]">
                  Acompanhe o pagamento dos 50% de entrada, envie a Ordem de Produção via WhatsApp e libere a cobrança dos 50% finais quando a sandália ficar pronta.
                </p>
              </div>
            </div>

            {orders.length === 0 && (
              <div className="bg-white border border-[#DFD3C3] rounded-xl p-8 text-center space-y-2">
                <p className="text-base font-semibold text-[#231619]">
                  Nenhuma encomenda registrada até o momento
                </p>
                <p className="text-xs text-[#6E5A5F] max-w-lg mx-auto">
                  Assim que uma cliente finalizar um pedido na vitrine da loja, ele aparecerá imediatamente aqui com o botão verde para você confirmar o recebimento dos 50% de entrada.
                </p>
              </div>
            )}

            {orders.map((order) => {
              const factoryMsg = buildFactoryProductionMessage(order);
              const customerReadyMsg = buildReadyForFinalPaymentMessage(order);
              const factoryPhone = settings?.whatsappFactory || '5562984998265';
              const isAwaitingConfirmation =
                order.paymentStatus === 'AGUARDANDO_ENTRADA_50' ||
                order.productionStatus === 'AGUARDANDO_CONFIRMACAO';

              return (
                <div
                  key={order.id}
                  className={`bg-white border-2 rounded-xl p-6 space-y-5 shadow-xs ${
                    isAwaitingConfirmation ? 'border-[#D4AF37]' : 'border-[#DFD3C3]'
                  }`}
                >
                  {isAwaitingConfirmation && (
                    <div className="p-4 rounded-xl bg-[#FFF9EB] border border-[#D4AF37] flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C4A27]">
                          ⏳ Aguardando Confirmação da Peterson Shoes
                        </span>
                        <p className="text-xs text-[#231619]">
                          Confira se o pagamento de entrada de{' '}
                          <strong className="font-mono-tabular">{formatBRL(order.depositAmount)}</strong>{' '}
                          caiu na sua conta Banco Inter e clique no botão ao lado para aprovar.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateOrder(order.id, {
                              paymentStatus: 'ENTRADA_50_PAGA',
                              productionStatus: 'CORTE_MODELAGEM',
                            })
                          }
                          className="px-4 py-2.5 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar 50% de Entrada e Iniciar Produção</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-3 py-2.5 bg-[#7A2434]/10 hover:bg-[#7A2434]/20 text-[#7A2434] rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Excluir Pedido
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EFE7DA]">
                    <div>
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="font-mono-tabular font-bold text-base text-[#5B1824]">
                          #{order.orderCode}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-[#231619]">
                          {order.customerName}
                        </span>
                        <span>·</span>
                        <span className="text-[#6E5A5F]">{order.customerWhatsapp}</span>
                        <span>·</span>
                        <span className="text-[#6E5A5F]">
                          Meta 15 dias:{' '}
                          <strong className="text-[#231619] font-mono-tabular">
                            {order.estimatedDeliveryDate.split('-').reverse().join('/')}
                          </strong>
                        </span>
                      </div>
                      <p className="text-xs text-[#6E5A5F] mt-1">
                        Entrega: {order.shippingAddress}
                      </p>
                    </div>

                    <div className="text-right font-mono-tabular space-y-1.5">
                      <p className="text-sm font-bold text-[#231619]">
                        Total: {formatBRL(order.totalAmount)}
                      </p>
                      <p className="text-xs text-[#5B1824]">
                        Entrada 50%: {formatBRL(order.depositAmount)} · Final 50%:{' '}
                        {formatBRL(order.remainingAmount)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <span className="text-[11px] font-sans font-semibold text-[#6E5A5F]">
                          Editar Total (R$):
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={
                            orderTotalDrafts[order.id] ??
                            order.totalAmount.toFixed(2).replace('.', ',')
                          }
                          onChange={(e) =>
                            setOrderTotalDrafts((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          className="w-24 px-2 py-1 bg-[#F7F3EC] border border-[#DFD3C3] focus:border-[#5B1824] rounded text-xs font-mono-tabular font-bold text-[#231619] text-right focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveManualOrderTotal(order)}
                          className="px-2.5 py-1 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded text-[11px] font-sans font-semibold cursor-pointer"
                        >
                          {savedOrderValueId === order.id ? 'Salvo ✓' : 'Salvar Valor'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items & Bespoke Specifications */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#F7F3EC] border border-[#EFE7DA] flex flex-wrap items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover border border-[#DFD3C3]"
                          />
                          <div>
                            <p className="font-semibold text-[#231619] text-sm">
                              {item.name} (SKU: {item.sku}) · Qtd: {item.quantity}
                            </p>
                            <p className="text-[#4A373B]">
                              Cor: <strong>{item.colorName}</strong> · Numeração:{' '}
                              <strong>{item.size} BR</strong>
                              {item.customization.heelOption ? (
                                <>
                                  {' '}
                                  · Salto: <strong>{item.customization.heelOption}</strong>
                                </>
                              ) : null}{' '}
                              · Acabamento: <strong>{item.customization.strapFinish}</strong>
                            </p>
                            <p className="text-[#6E5A5F]">
                              Forma: <strong>{item.customization.footWidth}</strong>
                              {item.customization.customNotes
                                ? ` · Obs: ${item.customization.customNotes}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status Selectors & Factory Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Status do Pagamento (50% / 50%) — Confirmação Exclusiva Admin
                      </label>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          handleUpdateOrder(order.id, {
                            paymentStatus: e.target.value as PaymentStatus,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-medium text-[#231619]"
                      >
                        <option value="AGUARDANDO_ENTRADA_50">
                          Aguardando 50% de Entrada
                        </option>
                        <option value="ENTRADA_50_PAGA">
                          50% Entrada Paga (Liberado p/ Produção)
                        </option>
                        <option value="AGUARDANDO_FINAL_50">
                          Aguardando 50% Final (Sandália Pronta)
                        </option>
                        <option value="QUITADO_100">
                          100% Quitado (Entrada + Final Pagos)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Etapa da Produção (15 Dias)
                      </label>
                      <select
                        value={order.productionStatus}
                        onChange={(e) =>
                          handleUpdateOrder(order.id, {
                            productionStatus: e.target.value as ProductionStatus,
                          })
                        }
                        className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-medium text-[#231619]"
                      >
                        <option value="AGUARDANDO_CONFIRMACAO">
                          1. Aguardando Confirmação
                        </option>
                        <option value="CORTE_MODELAGEM">2. Corte & Modelagem</option>
                        <option value="MONTAGEM_ARTESANAL">3. Montagem Artesanal</option>
                        <option value="ACABAMENTO_QUALIDADE">
                          4. Acabamento & Qualidade
                        </option>
                        <option value="PRONTA_PARA_ENTREGA">
                          5. Pronta para Entrega (Cobrar 50% Final)
                        </option>
                        <option value="ENVIADA_ENTREGUE">6. Enviada / Entregue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#231619] mb-1">
                        Observações Internas da Fábrica / Avisos de Pagamento
                      </label>
                      <input
                        type="text"
                        defaultValue={order.factoryNotes}
                        onBlur={(e) =>
                          handleUpdateOrder(order.id, { factoryNotes: e.target.value })
                        }
                        placeholder="Anote lote de material, artesão ou código de rastreio..."
                        className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs text-[#231619]"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Integration Bar: Factory Work-Order & Customer Notification */}
                  <div className="pt-4 border-t border-[#EFE7DA] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={toWhatsAppHref(factoryPhone, factoryMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Enviar Ordem de Produção p/ WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(factoryMsg, `factory-${order.id}`)
                        }
                        className="px-3 py-2 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {copiedTextId === `factory-${order.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2E6B3E]" />
                            <span>Ficha Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Ficha para Fabricante</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={toWhatsAppHref(order.customerWhatsapp, customerReadyMsg, {
                          isCustomerRecipient: true,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>
                          Avisar Cliente no WhatsApp (Sandália Pronta / 50% Final)
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: PAYMENTS 50%/50% & FINANCIAL REPORT */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#231619]">
                Relatório Financeiro & Confirmação de Recebimento (50% Entrada / 50% Final)
              </h2>
              <p className="text-xs text-[#6E5A5F]">
                Cada encomenda gera duas parcelas de 50%. Nenhum pedido é considerado pago automaticamente pelo clique da cliente: confira o recebimento no seu <strong>Banco Inter</strong> (Chave Pix CNPJ: <strong>{settings?.pixKey || '50.789.636/0001-32'}</strong>) e clique em <strong>Confirmar Recebimento</strong> abaixo.
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EFE7DA] bg-[#EFE7DA]/50 text-[#4A373B]">
                    <th className="py-3 px-4 font-semibold">Pedido</th>
                    <th className="py-3 px-4 font-semibold">Parcela (50%)</th>
                    <th className="py-3 px-4 font-semibold">Modalidade / Referência</th>
                    <th className="py-3 px-4 font-semibold">Valor Cobrado</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação Administrativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-[#F7F3EC]/60">
                      <td className="py-3 px-4 font-mono-tabular font-bold text-[#5B1824]">
                        #{pay.orderCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#231619]">
                        {pay.installmentType === 'ENTRADA_50'
                          ? '1ª Parcela: 50% Entrada'
                          : '2ª Parcela: 50% Sandália Pronta'}
                      </td>
                      <td className="py-3 px-4 text-[#6E5A5F]">
                        <span className="font-semibold text-[#231619]">
                          {pay.method === 'CARTAO_MERCADO_PAGO'
                            ? `Cartão de Crédito (${pay.installments || 1}x)`
                            : 'Pix Banco Inter'}
                        </span>
                        <span className="block font-mono-tabular text-[11px]">
                          {pay.mpReferenceId}
                          {pay.cardLast4 ? ` · Final ${pay.cardLast4}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono-tabular font-semibold text-[#231619]">
                        {formatBRL(pay.amount)}
                        {pay.feeAmount && pay.feeAmount > 0 ? (
                          <span className="block text-[10px] text-[#8C4A27]">
                            Base 50%: {formatBRL(pay.baseAmount || pay.amount - pay.feeAmount)} + Taxa Banco: {formatBRL(pay.feeAmount)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            pay.status === 'APROVADO'
                              ? 'text-[#2E6B3E]'
                              : 'text-[#8C4A27]'
                          }`}
                        >
                          {pay.status === 'APROVADO'
                            ? 'Confirmado pelo Admin ✓'
                            : 'Aguardando Conferência no Banco Inter'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pay.status !== 'APROVADO' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrder(pay.orderId, {
                                  paymentStatus:
                                    pay.installmentType === 'FINAL_50'
                                      ? 'QUITADO_100'
                                      : 'ENTRADA_50_PAGA',
                                })
                              }
                              className="px-2.5 py-1.5 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                            >
                              Confirmar Recebimento ✓
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                settings?.pixKey || '50.789.636/0001-32',
                                pay.id
                              )
                            }
                            className="text-xs font-medium text-[#5B1824] hover:underline cursor-pointer"
                          >
                            {copiedTextId === pay.id ? 'Chave Copiada!' : 'Copiar Chave CNPJ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS */}
        {activeTab === 'CUSTOMERS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#231619]">
                Cadastro de Clientes Peterson Shoes
              </h2>
              <p className="text-xs text-[#6E5A5F]">
                Clientes armazenadas permanentemente a partir das encomendas realizadas na loja.
              </p>
            </div>

            <div className="bg-white border border-[#DFD3C3] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EFE7DA] bg-[#EFE7DA]/50 text-[#4A373B]">
                    <th className="py-3 px-4 font-semibold">Cliente</th>
                    <th className="py-3 px-4 font-semibold">CPF</th>
                    <th className="py-3 px-4 font-semibold">WhatsApp</th>
                    <th className="py-3 px-4 font-semibold">Cidade / Endereço</th>
                    <th className="py-3 px-4 font-semibold">Encomendas</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Comprado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DA]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F7F3EC]/60">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#231619]">{c.name}</p>
                        <p className="text-[#6E5A5F]">{c.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-[#4A373B]">
                        {c.cpf}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={toWhatsAppHref(
                            c.whatsapp,
                            `Olá, ${c.name}! Aqui é do atendimento da Peterson Shoes.`,
                            { isCustomerRecipient: true }
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2E6B3E] font-medium hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{c.whatsapp}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 text-[#4A373B]">
                        {c.street}, {c.number} · {c.neighborhood}, {c.city}/{c.state} (CEP{' '}
                        {c.cep})
                      </td>
                      <td className="py-3 px-4 font-mono-tabular font-semibold">
                        {c.totalOrders}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-[#5B1824]">
                        {formatBRL(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS, WHATSAPP, MERCADO PAGO & SUPABASE SQL */}
        {activeTab === 'SETTINGS' && settings && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-6 bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-[#5B1824]">
                <Settings className="w-5 h-5" />
                <div>
                  <h3 className="text-lg font-semibold text-[#231619]">
                    Cadastro do Banco Recebedor, Chave Pix & Cartão
                  </h3>
                  <p className="text-xs text-[#6E5A5F]">
                    Cadastre abaixo o banco e a chave Pix onde os pagamentos de 50% das clientes cairão diretamente na sua conta.
                  </p>
                </div>
              </div>

              {settingsSavedMsg && (
                <div className="p-3 rounded-lg bg-[#2E6B3E]/10 border border-[#2E6B3E] text-xs text-[#2E6B3E] font-semibold">
                  {settingsSavedMsg}
                </div>
              )}

              {/* Bank Quick Selection & Input */}
              <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                  1. Conta Bancária & Chave Pix para Recebimento Direto
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    Banco / Instituição Financeira Recebedora *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.bankName || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, bankName: e.target.value })
                    }
                    placeholder="Ex: Nubank, Mercado Pago, Caixa, Itaú, Sicoob, Inter..."
                    className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Mercado Pago',
                      'Nubank',
                      'Caixa Econômica',
                      'Banco do Brasil',
                      'Itaú',
                      'Bradesco',
                      'Santander',
                      'Sicoob',
                      'Sicredi',
                      'Banco Inter',
                      'PagBank',
                      'Cora',
                    ].map((bName) => (
                      <button
                        key={bName}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, bankName: bName })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                          settings.bankName === bName
                            ? 'bg-[#5B1824] text-white border-[#5B1824]'
                            : 'bg-white text-[#4A373B] border-[#DFD3C3] hover:border-[#5B1824]'
                        }`}
                      >
                        {bName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Nome do Titular / Favorecido *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.bankHolderName || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankHolderName: e.target.value,
                        })
                      }
                      placeholder="Nome que aparece no Pix"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      CPF ou CNPJ do Titular (Opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.bankHolderDoc || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankHolderDoc: e.target.value,
                        })
                      }
                      placeholder="Ex: ***.123.456-** ou CNPJ"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Tipo da Chave Pix *
                    </label>
                    <select
                      value={settings.pixKeyType || 'CELULAR'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pixKeyType: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619]"
                    >
                      <option value="CELULAR">Celular</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="ALEATORIA">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Chave Pix Oficial (Geradora do QR Code) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.pixKey}
                      onChange={(e) =>
                        setSettings({ ...settings, pixKey: e.target.value })
                      }
                      placeholder="Ex: 62984998265, CPF, CNPJ ou E-mail"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Agência Bancária (Opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.bankAgency || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, bankAgency: e.target.value })
                      }
                      placeholder="Ex: 0001"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Conta Corrente / Poupança (Opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.bankAccount || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          bankAccount: e.target.value,
                        })
                      }
                      placeholder="Ex: 123456-7"
                      className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular text-[#231619]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    Link Externo para Pagamento no Cartão / Maquininha (Opcional)
                  </label>
                  <input
                    type="url"
                    value={settings.cardPaymentLink || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cardPaymentLink: e.target.value,
                      })
                    }
                    placeholder="Ex: https://link.mercadopago.com.br/petersonshoes"
                    className="w-full px-3.5 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619]"
                  />
                  <p className="text-[11px] text-[#6E5A5F] mt-1">
                    O site já possui checkout de cartão integrado. Se você também colar um link da sua maquininha (Mercado Pago, InfinitePay, Ton, PagBank), um botão direto para ele aparecerá na aba de Cartão.
                  </p>
                </div>
              </div>

              {/* Store WhatsApp & Production Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    WhatsApp de Atendimento da Loja
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappStore}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappStore: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    WhatsApp de Recebimento de Pedidos
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappFactory}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        whatsappFactory: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    Prazo de Produção (Dias)
                  </label>
                  <input
                    type="number"
                    value={settings.productionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        productionDays: parseInt(e.target.value, 10) || 15,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231619] mb-1">
                    Taxa Base do Banco no Cartão 1x (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.creditCardFeePercentage ?? 4.99}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        creditCardFeePercentage:
                          parseFloat(e.target.value) || 4.99,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#EFE7DA] border border-[#DFD3C3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5B1824] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Geração de QR Code Pix Padrão Banco Central (BRCode)</span>
                  </span>
                  <span className="text-xs font-semibold text-[#2E6B3E]">
                    Ativo Direto na Sua Chave Pix ✓
                  </span>
                </div>
                <p className="text-[11px] text-[#4A373B]">
                  Todo QR Code e código Pix Copia e Cola gerado no site envia o valor de 50% diretamente para a <strong>Chave Pix ({settings.pixKey})</strong> do banco <strong>{settings.bankName || 'cadastrado'}</strong> sem intermediários.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                {savingSettings
                  ? 'Salvando dados bancários...'
                  : 'Salvar Banco Recebedor, Chave Pix e Configurações'}
              </button>
            </form>

            {/* PostgreSQL / Supabase Schema & Instructions */}
            <div className="lg:col-span-6 bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5B1824]">
                    <Database className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-[#231619]">
                      Banco de Dados PostgreSQL / Supabase
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sqlSchema, 'sql-schema')}
                    className="px-3 py-1.5 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedTextId === 'sql-schema' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E6B3E]" />
                        <span>SQL Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Script SQL Supabase</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#6E5A5F] leading-relaxed">
                  Todos os produtos, preços editados, clientes, pedidos e pagamentos já estão sendo salvos permanentemente no servidor Node.js (<code className="font-mono">/data/peterson-db.json</code>). Para espelhar em um projeto externo gratuito no <strong>Supabase (PostgreSQL)</strong>, basta colar o script abaixo no <em>SQL Editor</em> do Supabase.
                </p>

                <pre className="p-3 bg-[#1E191A] text-[#F7F3EC] rounded-lg text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {sqlSchema}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE & SEO (INDEXAÇÃO & VISIBILIDADE NAS BUSCAS) */}
        {activeTab === 'SEO' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE7DA] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2E6B3E] mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SEO Técnico 100% Configurado & Ativo no Código</span>
                  </span>
                  <h2 className="text-2xl font-semibold text-[#231619]">
                    Visibilidade da Peterson Shoes no Google
                  </h2>
                  <p className="text-xs text-[#6E5A5F] max-w-3xl mt-1">
                    O site já conta com <strong>Meta Tags Otimizadas</strong>,{' '}
                    <strong>Dados Estruturados Schema.org (ShoeStore + 46 Produtos + FAQ)</strong>,{' '}
                    <strong>OpenGraph para WhatsApp/Instagram</strong>,{' '}
                    <strong>/robots.txt</strong> e <strong>/sitemap.xml com fotos</strong>{' '}
                    gerados automaticamente. Siga os 4 passos abaixo para colocar o site na primeira página do Google!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-semibold transition-colors"
                  >
                    Abrir /sitemap.xml
                  </a>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#EFE7DA] hover:bg-[#E2D4C0] text-[#231619] rounded-lg text-xs font-semibold transition-colors"
                  >
                    Abrir /robots.txt
                  </a>
                </div>
              </div>

              {/* Quick Copy Box for Sitemap & Site URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-2">
                  <p className="text-xs font-bold text-[#231619]">
                    Link do Sitemap para enviar no Google Search Console:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-[#DFD3C3] rounded-lg text-xs font-mono text-[#5B1824] truncate">
                      {`${window.location.origin}/sitemap.xml`}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(`${window.location.origin}/sitemap.xml`, 'sitemap-url')
                      }
                      className="px-3 py-2 bg-[#5B1824] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedTextId === 'sitemap-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Sitemap</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-2">
                  <p className="text-xs font-bold text-[#231619]">
                    Como o seu site aparece hoje nas buscas do Google (Prévia):
                  </p>
                  <div className="p-3 bg-white border border-[#DFD3C3] rounded-lg space-y-0.5">
                    <p className="text-[11px] text-[#2E6B3E] truncate">
                      {window.location.origin} › Goiânia - GO
                    </p>
                    <p className="text-sm font-semibold text-[#1a0dab] hover:underline">
                      Peterson Shoes | Sandálias Femininas em Goiânia (34 ao 39)
                    </p>
                    <p className="text-xs text-[#4d5156] line-clamp-2">
                      Peterson Shoes (@petersonshoes_): sandálias femininas de fabricação própria em Goiânia - GO sob encomenda do 34 ao 39. Papetes, Anabelas e Rasteiras com 50% de entrada.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Practical Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                    Passo 1 · Google Search Console (Gratuito)
                  </span>
                  <h3 className="text-base font-semibold text-[#231619]">
                    Cadastrar o site no índice oficial do Google
                  </h3>
                  <p className="text-xs text-[#4A373B] leading-relaxed">
                    1. Acesse <strong>search.google.com/search-console</strong> com sua conta Google.<br />
                    2. Em <strong>&ldquo;Prefixo do URL&rdquo;</strong>, cole o endereço público do seu site.<br />
                    3. No menu lateral esquerdo, clique em <strong>Sitemaps</strong>, digite{' '}
                    <code className="font-mono bg-[#F7F3EC] px-1.5 py-0.5 rounded">sitemap.xml</code> e clique em <strong>Enviar</strong>. O Google indexará todas as 46 sandálias e fotos!
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                    Passo 2 · Google Meu Negócio (Perfil da Empresa)
                  </span>
                  <h3 className="text-base font-semibold text-[#231619]">
                    Aparecer no topo e no Google Maps em Goiânia - GO
                  </h3>
                  <p className="text-xs text-[#4A373B] leading-relaxed">
                    1. Acesse <strong>business.google.com</strong> gratuitamente.<br />
                    2. Cadastre <strong>Peterson Shoes — Fábrica de Sandálias Femininas</strong> em <strong>Goiânia - GO</strong>.<br />
                    3. Coloque o link deste site no campo <strong>Website</strong>. Quando alguém pesquisar <em>&ldquo;sandálias femininas em Goiânia&rdquo;</em> ou <em>&ldquo;Peterson Shoes&rdquo;</em>, sua loja aparecerá em destaque com fotos e botão para o site!
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                    Passo 3 · Domínio Próprio (.com.br)
                  </span>
                  <h3 className="text-base font-semibold text-[#231619]">
                    Ter seu endereço www.petersonshoes.com.br
                  </h3>
                  <p className="text-xs text-[#4A373B] leading-relaxed">
                    Para um endereço profissional fácil de lembrar, registre{' '}
                    <strong>petersonshoes.com.br</strong> no <strong>Registro.br</strong> (custa R$ 40/ano) e conecte ao seu site publicado (Cloud Run ou Vercel).
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                    Passo 4 · Link na Bio do Instagram @petersonshoes_
                  </span>
                  <h3 className="text-base font-semibold text-[#231619]">
                    Gerar tráfego imediato para acelerar o Google
                  </h3>
                  <p className="text-xs text-[#4A373B] leading-relaxed">
                    Coloque o link do site na bio do seu perfil{' '}
                    <strong>@petersonshoes_</strong>. Quando o Google percebe acessos reais vindos do Instagram e WhatsApp, ele sobe a posição do site nas pesquisas muito mais rápido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: REAL-TIME VISITOR & ACCESS ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EFE7DA] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                    Monitoramento em Tempo Real · Contador de Acessos Integrado
                  </span>
                  <h2 className="text-2xl font-semibold text-[#231619]">
                    Quantas Pessoas Acessam o Site da Peterson Shoes
                  </h2>
                  <p className="text-xs text-[#6E5A5F] max-w-3xl leading-relaxed">
                    Acompanhe abaixo em tempo real todas as visitas na loja, de onde as clientes estão vindo (Google, Instagram ou WhatsApp) e quais modelos de sandálias são os mais clicados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => token && fetchAdminData(token)}
                  className="px-4 py-2 bg-[#5B1824] hover:bg-[#46111B] text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar Contador Agora</span>
                </button>
              </div>

              {/* 4 Main Visitor Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3]">
                  <p className="text-xs text-[#6E5A5F]">Total de Visitas no Site</p>
                  <p className="text-3xl font-bold text-[#5B1824] font-mono-tabular mt-1">
                    {analytics.totalVisits}
                  </p>
                  <p className="text-[11px] text-[#6E5A5F] mt-1">
                    Acessos acumulados na loja
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3]">
                  <p className="text-xs text-[#6E5A5F]">Visitantes Únicos (Pessoas)</p>
                  <p className="text-3xl font-bold text-[#231619] font-mono-tabular mt-1">
                    {analytics.uniqueVisitorsCount}
                  </p>
                  <p className="text-[11px] text-[#6E5A5F] mt-1">
                    Clientes diferentes que abriram o site
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3]">
                  <p className="text-xs text-[#6E5A5F]">Acessos de Hoje</p>
                  <p className="text-3xl font-bold text-[#2E6B3E] font-mono-tabular mt-1">
                    {analytics.dailyVisits[new Date().toISOString().split('T')[0]] || 0}
                  </p>
                  <p className="text-[11px] text-[#6E5A5F] mt-1">
                    Visitas registradas na data de hoje
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3]">
                  <p className="text-xs text-[#6E5A5F]">Sandálias Adicionadas à Sacola</p>
                  <p className="text-3xl font-bold text-[#8C4A27] font-mono-tabular mt-1">
                    {analytics.cartAdditions}
                  </p>
                  <p className="text-[11px] text-[#6E5A5F] mt-1">
                    Intenções de compra iniciadas
                  </p>
                </div>
              </div>

              {/* Traffic Sources Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#231619]">
                      De Onde Vêm os Acessos (Origem das Clientes)
                    </h3>
                    <p className="text-xs text-[#6E5A5F]">
                      Identificação automática de como a cliente chegou ao site
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white rounded-lg border border-[#DFD3C3]">
                      <p className="text-xs font-semibold text-[#2E6B3E]">Busca do Google</p>
                      <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                        {analytics.sources?.google || 0}
                      </p>
                    </div>
                    <div className="p-3.5 bg-white rounded-lg border border-[#DFD3C3]">
                      <p className="text-xs font-semibold text-[#5B1824]">
                        Instagram (@petersonshoes_)
                      </p>
                      <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                        {analytics.sources?.instagram || 0}
                      </p>
                    </div>
                    <div className="p-3.5 bg-white rounded-lg border border-[#DFD3C3]">
                      <p className="text-xs font-semibold text-[#231619]">WhatsApp</p>
                      <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                        {analytics.sources?.whatsapp || 0}
                      </p>
                    </div>
                    <div className="p-3.5 bg-white rounded-lg border border-[#DFD3C3]">
                      <p className="text-xs font-semibold text-[#6E5A5F]">
                        Link Direto / Favoritos
                      </p>
                      <p className="text-2xl font-bold text-[#231619] font-mono-tabular mt-1">
                        {analytics.sources?.direto || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Viewed Sandals */}
                <div className="p-5 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#231619]">
                      Sandálias Mais Clicadas pelas Clientes
                    </h3>
                    <p className="text-xs text-[#6E5A5F]">
                      Modelos que despertaram mais interesse na loja
                    </p>
                  </div>
                  {Object.values(analytics.productViews || {}).length === 0 ? (
                    <p className="text-xs text-[#6E5A5F] py-6 text-center bg-white rounded-lg border border-[#DFD3C3]">
                      Assim que as clientes clicarem nas sandálias para escolher cor e numeração, o ranking aparecerá aqui.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {Object.values(analytics.productViews || {})
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                        .map((item, idx) => (
                          <div
                            key={item.sku}
                            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DFD3C3] text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="w-5 h-5 rounded-full bg-[#5B1824] text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-[#231619] truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-[#5B1824] shrink-0 ml-2">
                              {item.count} {item.count === 1 ? 'visualização' : 'visualizações'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Google Search Console Guide */}
              <div className="p-5 rounded-xl bg-[#2E6B3E]/10 border border-[#2E6B3E]/30 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E6B3E]">
                  Dica Extra · Como Ver as Pesquisas no Google Search Console
                </span>
                <h3 className="text-base font-semibold text-[#231619]">
                  Acompanhar quantas vezes seu site apareceu no Google
                </h3>
                <p className="text-xs text-[#231619] leading-relaxed">
                  Além deste contador automático aqui do seu Painel Administrativo, você também pode abrir o{' '}
                  <strong>Google Search Console</strong> (que já está conectado ao seu site) e clicar em{' '}
                  <strong>&ldquo;Desempenho&rdquo;</strong> no menu lateral esquerdo. Lá o Google mostra:
                  <br />• <strong>Total de cliques</strong>: quantas pessoas pesquisaram no Google e entraram na loja.
                  <br />• <strong>Total de impressões</strong>: quantas vezes a Peterson Shoes apareceu nos resultados de busca.
                  <br />• <strong>Consultas</strong>: quais palavras exatas as clientes digitaram para encontrar suas sandálias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: REELS VIDEO & INSTAGRAM MARKETING STUDIO (ADMIN ONLY) */}
        {activeTab === 'REELS' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE7DA] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B1824] mb-1">
                    <span>🎬 Estúdio Exclusivo da Proprietária · Oculto dos Clientes</span>
                  </span>
                  <h2 className="text-2xl font-semibold text-[#231619]">
                    Vídeo Comercial Reels & Stories Pronto para Postar (@petersonshoes_)
                  </h2>
                  <p className="text-xs text-[#6E5A5F] max-w-3xl mt-1">
                    Vídeo vertical em <strong>Alta Definição Full HD (1080x1920 · 9:16 · 18 segundos com trilha sonora)</strong> apresentando os novos lançamentos de <strong>R$ 149,90 (Entrada de R$ 74,95 no Pix)</strong> e as campeãs de vendas a partir de <strong>R$ 99,90</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={downloadingMobileVideo}
                    onClick={() => handleMobileVideoDownload('share')}
                    className="px-4 py-3 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    📲 Salvar na Galeria do Celular (iPhone / Android)
                  </button>
                  <button
                    type="button"
                    disabled={downloadingMobileVideo}
                    onClick={() => handleMobileVideoDownload('download')}
                    className="px-4 py-3 bg-[#5B1824] hover:bg-[#46111B] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    ⬇️ Baixar MP4 Direto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 flex flex-col items-center space-y-3">
                  <div className="w-full max-w-[280px] rounded-2xl overflow-hidden border-4 border-[#231619] shadow-xl bg-black">
                    <video
                      src="/assets/peterson-reels-privado-admin.mp4?v=nitido-hd-v4"
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full aspect-[9/16] object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={downloadingMobileVideo}
                    onClick={() => handleMobileVideoDownload('share')}
                    className="w-full max-w-[280px] py-3 px-4 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-xl text-xs font-bold text-center transition-colors cursor-pointer"
                  >
                    📲 Salvar Vídeo na Galeria do Celular
                  </button>
                  <button
                    type="button"
                    disabled={downloadingMobileVideo}
                    onClick={() => handleMobileVideoDownload('download')}
                    className="w-full max-w-[280px] py-2.5 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-xl text-xs font-bold text-center transition-colors cursor-pointer"
                  >
                    ⬇️ Baixar Arquivo MP4 no Aparelho
                  </button>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div className="p-5 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#231619]">
                        Legenda Pronta para Instagram Reels & Feed
                      </h3>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(REELS_CAPTION_TEXT, 'tab-reels-caption')}
                        className="px-3.5 py-2 bg-[#5B1824] hover:bg-[#46111B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedTextId === 'tab-reels-caption' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Legenda Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Legenda Completa</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619] whitespace-pre-wrap font-sans leading-relaxed">
                      {REELS_CAPTION_TEXT}
                    </pre>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-[#DFD3C3] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2E6B3E]">
                      Configuração Recomendada para Tráfego Pago Local (Turbinar / Meta Ads)
                    </span>
                    <h4 className="text-sm font-semibold text-[#231619]">
                      Como atrair clientes reais de Goiânia e região todos os dias:
                    </h4>
                    <ul className="text-xs text-[#4A373B] space-y-1.5 leading-relaxed">
                      <li>• <strong>Objetivo do Anúncio:</strong> Mensagens no WhatsApp <code className="font-mono">(62) 98499-8265</code> ou Visitas ao Perfil/Site.</li>
                      <li>• <strong>Localização:</strong> Goiânia - GO + Aparecida de Goiânia + Senador Canedo (raio de 25 km do Setor Sudoeste).</li>
                      <li>• <strong>Público:</strong> Mulheres, 20 a 54 anos · Interesses: Calçados femininos, Sandálias, Moda feminina, Compras na internet.</li>
                      <li>• <strong>Orçamento sugerido:</strong> R$ 15,00 a R$ 25,00 por dia nos horários de pico (11h às 14h e 18h às 22h).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
