import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Search,
  Ruler,
  Clock,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Lock,
  Check,
  ExternalLink,
  ZoomIn,
  X,
} from 'lucide-react';
import {
  BespokeOrder,
  BespokeProduct,
  OrderItem,
  StoreSettings,
} from './types/peterson';
import { formatBRL } from './utils/payment';
import { buildCustomerProductMessage, toWhatsAppHref } from './utils/whatsapp';
import { ProductCustomModal } from './components/ProductCustomModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AiConsultantDrawer } from './components/AiConsultantDrawer';
import { SizeGuideModal } from './components/SizeGuideModal';
import { AdminDashboard } from './components/AdminDashboard';
import {
  getBrowserStoreDb,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  saveBrowserStoreDb,
} from './data/storeData';
import {
  apiFetch,
  isHomologacao,
  switchEnvironment,
} from './utils/environment';

const CATEGORIES = [
  'Todos',
  'Flatforms & Papetes',
  'Anabelas & Plataformas',
  'Rasteiras & Gladiadoras',
] as const;

export default function App() {
  const [products, setProducts] = useState<BespokeProduct[]>(() => {
    const local = getBrowserStoreDb().products.filter((p) => p.active);
    return local.length > 0 ? local : INITIAL_PRODUCTS;
  });
  const [settings, setSettings] = useState<StoreSettings>(() => {
    return getBrowserStoreDb().settings || INITIAL_SETTINGS;
  });
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Hero showcase selector
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardColorMap, setSelectedCardColorMap] = useState<
    Record<string, number>
  >({});

  // Cart & Modals
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeProductModal, setActiveProductModal] =
    useState<BespokeProduct | null>(null);
  const [activeModalColorIdx, setActiveModalColorIdx] = useState<number>(0);
  const [activeModalPhotoUrl, setActiveModalPhotoUrl] = useState<
    string | undefined
  >(undefined);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('acesso') === 'admin' ||
      window.location.pathname.replace(/\/+$/, '') === '/admin'
    );
  });
  const homologMode = isHomologacao();
  const [quickZoomPhoto, setQuickZoomPhoto] = useState<{
    url: string;
    title: string;
    subtitle: string;
    product: BespokeProduct;
    colorIdx: number;
  } | null>(null);

  const loadStoreData = useCallback(async () => {
    const localDb = getBrowserStoreDb();
    const localActive = localDb.products.filter((p) => p.active);
    if (localActive.length > 0) {
      setProducts(localActive);
    }
    if (localDb.settings) {
      setSettings(localDb.settings);
    }

    try {
      const [prodRes, setRes] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/settings'),
      ]);
      if (prodRes.ok) {
        const prods = await prodRes.json();
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
          saveBrowserStoreDb({
            ...getBrowserStoreDb(),
            products: prods,
          });
        }
      }
      if (setRes.ok) {
        const cfg = await setRes.json();
        if (cfg && cfg.storeName) {
          setSettings(cfg);
          saveBrowserStoreDb({
            ...getBrowserStoreDb(),
            settings: cfg,
          });
        }
      }
    } catch {
      // Fallback already populated from getBrowserStoreDb() / INITIAL_PRODUCTS
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Deep-linking support for Google Sitemap URLs (?modelo=PTS-IG-XX or ?categoria=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('categoria');
    const modParam = params.get('modelo');

    if (
      catParam &&
      (CATEGORIES as readonly string[]).includes(catParam)
    ) {
      setSelectedCategory(catParam);
    }

    if (modParam && products.length > 0) {
      const found = products.find(
        (p) =>
          p.sku.toLowerCase() === modParam.toLowerCase() ||
          p.id.toLowerCase() === modParam.toLowerCase()
      );
      if (found) {
        setActiveModalColorIdx(0);
        setActiveModalPhotoUrl(found.image);
        setActiveProductModal(found);
      }
    }
  }, [products]);

  // Dynamic SEO Title, Meta Description, Canonical Link & Schema.org Product JSON-LD
  useEffect(() => {
    const origin = window.location.origin;
    const baseTitle =
      'Peterson Shoes - Goiânia | Sandálias Femininas (34 ao 39)';
    const baseDescription =
      'Peterson Shoes - Goiânia (@petersonshoes_): sandálias femininas de fabricação própria em Goiânia - GO sob encomenda do 34 ao 39. Papetes, Anabelas e Rasteiras com 50% de entrada.';

    let nextTitle = baseTitle;
    let nextDescription = baseDescription;
    let canonicalHref = `${origin}/`;

    if (activeProductModal) {
      const deposit = (activeProductModal.price * 0.5).toFixed(2).replace('.', ',');
      const total = activeProductModal.price.toFixed(2).replace('.', ',');
      nextTitle = `${activeProductModal.name} — R$ ${total} | Peterson Shoes - Goiânia`;
      nextDescription = `${activeProductModal.name} (${activeProductModal.subtitle}). Confeccionada sob encomenda em Goiânia do 34 ao 39 BR por R$ ${total} (50% de entrada: R$ ${deposit} no Pix).`;
      canonicalHref = `${origin}/?modelo=${encodeURIComponent(activeProductModal.sku)}`;
    } else if (selectedCategory !== 'Todos') {
      nextTitle = `${selectedCategory} Sob Encomenda (34 ao 39) | Peterson Shoes - Goiânia`;
      nextDescription = `Confira ${selectedCategory} de fabricação própria da Peterson Shoes - Goiânia (@petersonshoes_) em Goiânia - GO. Numeração 34 ao 39 BR com 50% de entrada no Pix ou Cartão.`;
      canonicalHref = `${origin}/?categoria=${encodeURIComponent(selectedCategory)}`;
    }

    document.title = nextTitle;

    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', nextDescription);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', nextTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', nextDescription);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref);

    let canonicalEl = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalHref);

    // Inject dynamic Schema.org Product + ItemList JSON-LD for Google Rich Snippets
    const scriptId = 'schema-org-dynamic-catalog';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const catalogToIndex = (products.length > 0 ? products : INITIAL_PRODUCTS).slice(0, 46);
    const dynamicSchema = activeProductModal
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: activeProductModal.name,
          sku: activeProductModal.sku,
          description: activeProductModal.description,
          category: activeProductModal.category,
          image: activeProductModal.image.startsWith('http')
            ? activeProductModal.image
            : `${origin}${activeProductModal.image}`,
          brand: {
            '@type': 'Brand',
            name: 'Peterson Shoes',
          },
          offers: {
            '@type': 'Offer',
            url: canonicalHref,
            priceCurrency: 'BRL',
            price: activeProductModal.price.toFixed(2),
            availability: 'https://schema.org/PreOrder',
            itemCondition: 'https://schema.org/NewCondition',
            seller: {
              '@type': 'Organization',
              name: 'Peterson Shoes Goiânia',
            },
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Catálogo Oficial Peterson Shoes (@petersonshoes_) — Goiânia GO',
          numberOfItems: catalogToIndex.length,
          itemListElement: catalogToIndex.map((prod, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Product',
              name: prod.name,
              sku: prod.sku,
              description: prod.description,
              image: prod.image.startsWith('http')
                ? prod.image
                : `${origin}${prod.image}`,
              url: `${origin}/?modelo=${encodeURIComponent(prod.sku)}`,
              brand: {
                '@type': 'Brand',
                name: 'Peterson Shoes',
              },
              offers: {
                '@type': 'Offer',
                priceCurrency: 'BRL',
                price: prod.price.toFixed(2),
                availability: 'https://schema.org/PreOrder',
              },
            },
          })),
        };

    scriptEl.textContent = JSON.stringify(dynamicSchema);
  }, [activeProductModal, selectedCategory, products]);

  // Helper to obtain/create a persistent anonymous visitor ID and send analytics events
  const trackStoreEvent = useCallback(
    (payload: {
      type: 'VISITA' | 'PRODUTO' | 'SACOLA' | 'WHATSAPP';
      productId?: string;
      productSku?: string;
      productName?: string;
      label?: string;
    }) => {
      try {
        let visitorId = localStorage.getItem('peterson_visitor_id');
        if (!visitorId) {
          visitorId = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem('peterson_visitor_id', visitorId);
        }
        const referrer = document.referrer || window.location.search || '';
        apiFetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            visitorId,
            referrer,
          }),
        }).catch(() => {});
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  // Track initial storefront visit once per session
  useEffect(() => {
    if (isAdminView) return;
    try {
      const logged = sessionStorage.getItem('peterson_visit_logged');
      if (!logged) {
        sessionStorage.setItem('peterson_visit_logged', '1');
        trackStoreEvent({ type: 'VISITA' });
      }
    } catch {
      trackStoreEvent({ type: 'VISITA' });
    }
  }, [isAdminView, trackStoreEvent]);

  const handleAddToCart = (newItem: OrderItem) => {
    setCart((prev) => [...prev, newItem]);
    setIsCartOpen(true);
    trackStoreEvent({
      type: 'SACOLA',
      productId: newItem.productId,
      productSku: newItem.sku,
      productName: newItem.name,
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, idx) =>
          idx === index
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const openProductCustomizer = (
    product: BespokeProduct,
    colorIdx = 0,
    photoUrl?: string
  ) => {
    setActiveModalColorIdx(colorIdx);
    setActiveModalPhotoUrl(photoUrl);
    setActiveProductModal(product);
    trackStoreEvent({
      type: 'PRODUTO',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
    });
  };

  if (isAdminView) {
    return (
      <AdminDashboard
        onCloseAdmin={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('acesso');
          if (url.pathname.replace(/\/+$/, '') === '/admin') {
            url.pathname = '/';
          }
          window.history.replaceState({}, '', url.toString());
          setIsAdminView(false);
        }}
        onCatalogUpdated={loadStoreData}
      />
    );
  }

  const catalogList = products.length > 0 ? products : INITIAL_PRODUCTS;

  const filteredProducts = catalogList.filter((prod) => {
    const matchCategory =
      selectedCategory === 'Todos' || prod.category === selectedCategory;
    const matchSize =
      selectedSizeFilter === null ||
      prod.availableSizes.includes(selectedSizeFilter);
    const matchSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.colors.some((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchCategory && matchSize && matchSearch;
  });

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartDepositTotal =
    cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0) * 0.5;

  const heroProducts = catalogList.slice(0, 4);
  const currentHeroProduct =
    heroProducts[heroSlideIdx] || catalogList[0] || INITIAL_PRODUCTS[0];

  return (
    <div translate="no" className="notranslate min-h-screen bg-[#FAF7F2] text-[#1F1215] flex flex-col justify-between">
      {/* =====================================================================
          HOMOLOGAÇÃO BANNER (Visível apenas quando no ambiente de Homologação)
      ===================================================================== */}
      {homologMode && (
        <div className="bg-[#8C4A27] text-[#FAF7F2] px-4 py-2 text-xs border-b border-[#6E381B]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/20 font-bold uppercase tracking-wider text-[10px]">
                Ambiente de Homologação
              </span>
              <span>
                Você está visualizando o ambiente de testes da <strong>Peterson Shoes</strong>. Dados, pedidos e pagamentos estão isolados da produção oficial.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('acesso', 'admin');
                  window.history.replaceState({}, '', url.toString());
                  setIsAdminView(true);
                }}
                className="px-2.5 py-1 rounded bg-white text-[#8C4A27] font-semibold text-[11px] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Painel Admin (Restrito)
              </button>
              <button
                type="button"
                onClick={() => switchEnvironment('producao')}
                className="px-2.5 py-1 rounded bg-black/25 hover:bg-black/40 text-white font-medium text-[11px] cursor-pointer"
              >
                Ver Produção Oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP BAR CONTRACT (Strictly 3 Zones separated by gap-4 sm:gap-8)
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DDD0]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            translate="no"
            className="notranslate font-serif-display text-xl sm:text-[1.7rem] font-semibold tracking-tight text-[#631421] whitespace-nowrap shrink-0"
          >
            PETERSON SHOES
          </a>

          {/* Zone 2: Concise single-line public navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#3D2C30]">
            <a
              href="#catalogo"
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Catálogo ({products.length})
            </a>
            <a
              href="#galeria-instagram"
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              @petersonshoes_
            </a>
            <button
              type="button"
              onClick={() => {
                setTrackingQuery('');
                setIsTrackingOpen(true);
              }}
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rastrear Pedido
            </button>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Guia de Medidas (34 ao 39)
            </button>
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Consultora IA
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#E5D3B3]" />
              <span>
                Sacola ({cartCount})
                <span className="hidden sm:inline">
                  {cartCount > 0 ? ` · 50% ${formatBRL(cartDepositTotal)}` : ''}
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="pb-16 sm:pb-0">
        {/* ===================================================================
            TOP E-COMMERCE SEARCH, QUICK ACTIONS & COMPACT TRUST BAR
        =================================================================== */}
        <section className="bg-[#FAF7F2] border-b border-[#E6DDD0]">
          {/* Mobile & Desktop Quick Search + Navigation Bar */}
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-3 pb-3 space-y-2.5">
            {/* Search Input ("O que você está buscando?") */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O que você está buscando? (Ex: papete, anabela, dourada, marsala...)"
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#3D2C30]/30 focus:border-[#631421] rounded-xl text-xs sm:text-sm text-[#1F1215] placeholder:text-[#6E5D5F] focus:outline-none shadow-2xs"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5D5F] hover:text-[#1F1215] cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-[#3D2C30] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setTrackingQuery('');
                  setIsTrackingOpen(true);
                }}
                className="hidden sm:inline-flex px-3.5 py-2.5 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#1F1215] border border-[#D8CBB8] rounded-xl text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#631421]" />
                <span>Rastrear / Quitar 50%</span>
              </button>
            </div>

            {/* Mobile Quick Action Links + Category Filter Strip */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#631421] text-[#FAF7F2] shadow-2xs'
                        : 'bg-[#F3EDE2] text-[#3D2C30] hover:text-[#1F1215]'
                    }`}
                  >
                    {cat === 'Todos' ? `Todos (${products.length})` : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTrackingQuery('');
                    setIsTrackingOpen(true);
                  }}
                  className="sm:hidden px-2.5 py-1.5 bg-white text-[#631421] border border-[#D8CBB8] rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Rastrear Pedido
                </button>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="px-2.5 py-1.5 bg-white text-[#1F1215] border border-[#D8CBB8] rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Ruler className="w-3 h-3 text-[#631421]" />
                  <span>Medidas 34–39</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminView(true)}
                  className="px-2.5 py-1.5 bg-white text-[#631421] border border-[#D8CBB8] rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-[#631421]" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Compact Size Filter Strip (34 ao 39 BR) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EFE7DA] text-xs">
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-[11px] font-medium text-[#6E5D5F] whitespace-nowrap mr-1">
                  Filtrar Tam.:
                </span>
                {[34, 35, 36, 37, 38, 39].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() =>
                      setSelectedSizeFilter(selectedSizeFilter === sz ? null : sz)
                    }
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[11px] sm:text-xs font-mono-tabular font-semibold border transition-colors cursor-pointer shrink-0 ${
                      selectedSizeFilter === sz
                        ? 'bg-[#631421] text-[#FAF7F2] border-[#631421]'
                        : 'bg-white text-[#3D2C30] border-[#E6DDD0] hover:border-[#631421]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
                {selectedSizeFilter !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedSizeFilter(null)}
                    className="text-[11px] font-semibold text-[#631421] hover:underline ml-1 cursor-pointer whitespace-nowrap"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <span className="hidden md:inline text-[11px] text-[#631421] font-medium whitespace-nowrap">
                Fabricação Própria em Goiânia – GO · Envio para todo o Brasil · 50% Entrada + 50% Pronta
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: CATALOG GRID — 2 COLUMNS ON MOBILE, 3 TABLET, 4 DESKTOP
        =================================================================== */}
        <section id="catalogo" className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
          {/* Compact Storefront Banner Strip */}
          <div className="p-3 sm:p-4 rounded-xl bg-[#F3EDE2] border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/instagram/profile_pic.jpg"
                alt="Peterson Shoes"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-[#631421]/30 shrink-0"
              />
              <div>
                <h1 className="font-serif-display text-base sm:text-xl font-semibold text-[#1F1215] leading-tight">
                  Peterson Shoes · A elegância começa pelos pés
                </h1>
                <p className="text-[11px] sm:text-xs text-[#631421] font-medium">
                  Sob encomenda do 34 ao 39 · 8 cores ou cor personalizada · 50% Entrada (Pix ou Cartão)
                </p>
              </div>
            </div>
            <a
              href="#como-funciona"
              className="hidden sm:inline-flex text-xs font-semibold text-[#631421] hover:underline items-center gap-1"
            >
              <span>Como funciona a encomenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {loadingCatalog ? (
            <div className="py-12 text-center text-sm text-[#6E5D5F]">
              Carregando modelos @petersonshoes_...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-10 text-center bg-[#F3EDE2] border border-[#E6DDD0] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#1F1215]">
                Nenhuma sandália encontrada para a sua busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setSelectedSizeFilter(null);
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 bg-[#631421] text-[#FAF7F2] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Ver Todos os {products.length} Modelos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {filteredProducts.map((product) => {
                const depositValue = product.price * 0.5;
                const installment6x = (product.price / 6).toFixed(2).replace('.', ',');
                const activeColorIdx = selectedCardColorMap[product.id] ?? 0;
                const activeColor =
                  product.colors[activeColorIdx] || product.colors[0];
                const cardDisplayImage = activeColor?.image || product.image;

                return (
                  <article
                    key={product.id}
                    className="bg-white border border-[#E6DDD0] rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      {/* Square / Vertical E-Commerce Product Photo */}
                      <div
                        onClick={() =>
                          openProductCustomizer(
                            product,
                            activeColorIdx,
                            cardDisplayImage
                          )
                        }
                        className="w-full aspect-square bg-[#F3EDE2] overflow-hidden cursor-pointer relative group"
                      >
                        <img
                          src={cardDisplayImage}
                          alt={`${product.name} - ${activeColor?.name}`}
                          className="w-full h-full object-cover block transition-transform duration-200 group-hover:scale-103"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickZoomPhoto({
                              url: cardDisplayImage,
                              title: product.name,
                              subtitle: `Cor: ${activeColor?.name || 'Padrão'} · ${formatBRL(product.price)} (50% Entrada: ${formatBRL(depositValue)})`,
                              product,
                              colorIdx: activeColorIdx,
                            });
                          }}
                          className="absolute bottom-2 right-2 p-1.5 sm:px-2 sm:py-1 bg-black/60 hover:bg-black/80 text-[#FAF7F2] text-[10px] font-medium rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                          title="Ampliar foto"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#E5D3B3]" />
                          <span className="hidden sm:inline">Ampliar</span>
                        </button>
                      </div>

                      {/* Card Details */}
                      <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
                        {/* Compact Color Dots */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {product.colors.map((c, cIdx) => {
                            const isChosen = cIdx === activeColorIdx;
                            const isCustomOption =
                              c.isCustom ||
                              c.name.toLowerCase().includes('outra cor');

                            if (isCustomOption) {
                              return (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={() => openProductCustomizer(product, cIdx)}
                                  title="Escolher outra cor personalizada"
                                  className="px-1.5 py-0.5 rounded border border-dashed border-[#631421] bg-[#FAF7F2] text-[9px] font-semibold text-[#631421] cursor-pointer whitespace-nowrap"
                                >
                                  +Cor
                                </button>
                              );
                            }

                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() =>
                                  setSelectedCardColorMap((prev) => ({
                                    ...prev,
                                    [product.id]: cIdx,
                                  }))
                                }
                                title={`Cor ${c.name}`}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-transform cursor-pointer ${
                                  isChosen
                                    ? 'ring-1 ring-[#631421] ring-offset-1 scale-110 border-black/40'
                                    : 'border-black/20 hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.hex }}
                                aria-label={`Cor ${c.name}`}
                              />
                            );
                          })}
                        </div>

                        {/* Product Name */}
                        <h3
                          onClick={() => openProductCustomizer(product, activeColorIdx)}
                          className="text-xs sm:text-sm font-semibold text-[#1F1215] hover:text-[#631421] transition-colors cursor-pointer leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.4rem]"
                        >
                          {product.name}
                        </h3>

                        {/* Clean E-Commerce Price Block (Like LKS layout, adapted for Peterson 50%/50%) */}
                        <div className="pt-0.5 space-y-0.5">
                          <p className="text-sm sm:text-base font-bold text-[#1F1215] font-mono-tabular">
                            {formatBRL(product.price)}
                          </p>
                          <p className="text-[11px] sm:text-xs font-semibold text-[#631421] font-mono-tabular">
                            {formatBRL(depositValue)} de entrada no Pix
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-[#6E5D5F]">
                            Até 6x de R$ {installment6x}* · 34 ao 39
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Button */}
                    <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-4 pt-1 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openProductCustomizer(product, activeColorIdx)}
                        className="flex-1 py-2 px-2.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center"
                      >
                        Comprar
                      </button>

                      <a
                        href={toWhatsAppHref(
                          settings.whatsappStore,
                          buildCustomerProductMessage(
                            product,
                            activeColor?.name,
                            36,
                            product.heelOptions[0]
                          )
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Tirar dúvida no WhatsApp"
                        className="p-2 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#2E6B3E] border border-[#DFD3C3] rounded-lg transition-colors shrink-0"
                        aria-label={`Perguntar sobre ${product.name} no WhatsApp`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================================
            SECTION 3: GALERIA COMPLETA DE FOTOS REAIS DO INSTAGRAM @petersonshoes_
        =================================================================== */}
        <section
          id="galeria-instagram"
          className="bg-[#FAF7F2] border-t border-[#E6DDD0] py-14"
        >
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/instagram/profile_pic.jpg"
                  alt="@petersonshoes_"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#631421]"
                />
                <div>
                  <p className="text-xs font-semibold text-[#631421]">
                    Instagram Oficial · @petersonshoes_ · Todos os Modelos Reais
                  </p>
                  <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1F1215]">
                    Feed Oficial @petersonshoes_ (Clique para Encomendar)
                  </h2>
                </div>
              </div>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#631421] border border-[#D8CBB8] rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Seguir @petersonshoes_ no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {[
                {
                  img: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
                  title: 'Papete Pirâmides Dourada',
                  sku: 'PTS-IG-01',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
                  title: 'Papete Pirâmides Off-White / Nude',
                  sku: 'PTS-IG-16',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
                  title: 'Papete Pirâmides Prata',
                  sku: 'PTS-IG-17',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
                  title: 'Papete Pirâmides Preta',
                  sku: 'PTS-IG-14',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_2_C454HJKO2oG_main.jpg',
                  title: 'Anabela Espadrille Pirâmides & Juta',
                  sku: 'PTS-IG-10',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
                  title: 'Rasteira Esferas & Medalhão Dourada',
                  sku: 'PTS-IG-13',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
                  title: 'Rasteira Esferas & Medalhão Prata',
                  sku: 'PTS-IG-18',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
                  title: 'Rasteira Gladiadora Strass (Foto 1)',
                  sku: 'PTS-IG-11',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_4_C454A4GujcN_slide_2.jpg',
                  title: 'Rasteira Gladiadora Strass (Foto 2)',
                  sku: 'PTS-IG-11',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
                  title: 'Anabela Trançada Dourada (Foto 1)',
                  sku: 'PTS-IG-05',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_5_C4539VxO5om_slide_2.jpg',
                  title: 'Anabela Trançada Dourada (Foto 2)',
                  sku: 'PTS-IG-05',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
                  title: 'Anabela Tamanco Trançado Off-White',
                  sku: 'PTS-IG-12',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
                  title: 'Anabela Tamanco Trançado Nude',
                  sku: 'PTS-IG-12',
                  colorIdx: 1,
                },
                {
                  img: '/instagram/feed_7_C4ayCqZteae_main.jpg',
                  title: 'Flatform Tira de Dedo Strass Duo',
                  sku: 'PTS-IG-08',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
                  title: 'Anabela Pirâmides & Fivela Preta',
                  sku: 'PTS-IG-02',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
                  title: 'Anabela Pirâmides & Fivela Nude Rosé',
                  sku: 'PTS-IG-15',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
                  title: 'Anabela Pirâmides & Fivela Prata',
                  sku: 'PTS-IG-19',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
                  title: 'Anabela Pirâmides & Fivela Dourada',
                  sku: 'PTS-IG-20',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
                  title: 'Anabela Pirâmides & Fivela Branca',
                  sku: 'PTS-IG-21',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
                  title: 'Anabela Gladiadora Pirâmides Dourada',
                  sku: 'PTS-IG-03',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
                  title: 'Anabela Gladiadora Pirâmides Nude Rosé',
                  sku: 'PTS-IG-22',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
                  title: 'Anabela Gladiadora Pirâmides Prata',
                  sku: 'PTS-IG-23',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
                  title: 'Papete Tratorada Strass Off-White',
                  sku: 'PTS-IG-04',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
                  title: 'Papete Tratorada Strass Preta',
                  sku: 'PTS-IG-24',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
                  title: 'Papete Tratorada Strass Dourada',
                  sku: 'PTS-IG-25',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
                  title: 'Flatform Gladiadora Strass Dourada',
                  sku: 'PTS-IG-06',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
                  title: 'Flatform Gladiadora Strass Branca',
                  sku: 'PTS-IG-26',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
                  title: 'Papete Espelhada Strass Prata',
                  sku: 'PTS-IG-07',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
                  title: 'Papete Espelhada Strass Dourada',
                  sku: 'PTS-IG-27',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
                  title: 'Flatform Slide Nó em Strass',
                  sku: 'PTS-IG-09',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_14_C4TcgZrplaC_slide_1.jpg',
                  title: 'Papete Tira Transversal Pirâmides Dourada',
                  sku: 'PTS-IG-28',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_14_C4TcgZrplaC_slide_2.jpg',
                  title: 'Papete Tira Transversal Pirâmides Prata',
                  sku: 'PTS-IG-28',
                  colorIdx: 1,
                },
                {
                  img: '/instagram/feed_15_C4TceEBpcL2_main.jpg',
                  title: 'Rasteira Bico Quadrado Nó em Strass',
                  sku: 'PTS-IG-29',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_44_C12GJ6QORi4_slide_1.jpg',
                  title: 'Rasteira Laço Duplo Strass (No Pé)',
                  sku: 'PTS-IG-30',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_16_C4TccS0J14Z_slide_1.jpg',
                  title: 'Rasteira Laço Duplo Strass Cores',
                  sku: 'PTS-IG-30',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_17_C4TcYo9pYsy_main.jpg',
                  title: 'Rasteira Tira Transversal Strass & Fivela',
                  sku: 'PTS-IG-31',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_20_C4TcQjaJejN_main.jpg',
                  title: 'Rasteira Gladiadora Nó de Strass',
                  sku: 'PTS-IG-32',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_19_C4TcSseJ1vr_main.jpg',
                  title: 'Rasteira Tiras Cruzadas X Pedraria',
                  sku: 'PTS-IG-33',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg',
                  title: 'Flatform 3 Tiras Finas Strass Branca',
                  sku: 'PTS-IG-34',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_22_C4TcJj9Ju9I_slide_4.jpg',
                  title: 'Flatform 3 Tiras Finas Strass Preta',
                  sku: 'PTS-IG-34',
                  colorIdx: 1,
                },
                {
                  img: '/instagram/feed_23_C4TcFzJJLNA_slide_1.jpg',
                  title: 'Flatform Nó Pedraria Espelhada',
                  sku: 'PTS-IG-35',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_24_C4TcBT1pobH_slide_1.jpg',
                  title: 'Flatform Tiras Cruzadas Duplas Strass',
                  sku: 'PTS-IG-36',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg',
                  title: 'Flatform Slide Nó Central Metalizada',
                  sku: 'PTS-IG-37',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_28_C12HMIqOt-1_main.jpg',
                  title: 'Papete Anel de Dedo & Strass c/ Fivela',
                  sku: 'PTS-IG-38',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_29_C12HDhQO1dO_slide_1.jpg',
                  title: 'Papete Vira de Strass & Fivela Branca',
                  sku: 'PTS-IG-39',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_30_C12HAGoOeUg_slide_1.jpg',
                  title: 'Flatform Gladiadora Multitiras Preta',
                  sku: 'PTS-IG-40',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_30_C12HAGoOeUg_slide_2.jpg',
                  title: 'Flatform Gladiadora Multitiras Branca',
                  sku: 'PTS-IG-40',
                  colorIdx: 1,
                },
                {
                  img: '/instagram/feed_49_CzWpulBOVR3_main.jpg',
                  title: 'Flatform 3 Tiras Tubulares Strass',
                  sku: 'PTS-IG-41',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg',
                  title: 'Flatform Pedraria Cristal Espelhada',
                  sku: 'PTS-IG-42',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg',
                  title: 'Rasteira Tiras Entrelaçadas Strass',
                  sku: 'PTS-IG-43',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg',
                  title: 'Flatform Slide Nuvem Metalizada',
                  sku: 'PTS-IG-44',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg',
                  title: 'Flatform Gladiadora Tratorada Strass',
                  sku: 'PTS-IG-45',
                  colorIdx: 0,
                },
                {
                  img: '/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg',
                  title: 'Rasteira Bico Quadrado Multitiras & Fivela',
                  sku: 'PTS-IG-46',
                  colorIdx: 0,
                },
              ].map((item, idx) => {
                const targetProduct =
                  catalogList.find((p) => p.sku === item.sku) ||
                  catalogList[0] ||
                  INITIAL_PRODUCTS[0];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (targetProduct) {
                        const matchedColorIdx = targetProduct.colors.findIndex(
                          (c) => c.image === item.img
                        );
                        openProductCustomizer(
                          targetProduct,
                          matchedColorIdx >= 0 ? matchedColorIdx : item.colorIdx,
                          item.img
                        );
                      }
                    }}
                    className="group relative h-[240px] sm:h-[260px] w-full rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#F3EDE2] text-left cursor-pointer"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover block transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5">
                      <p className="text-[11px] font-semibold text-white leading-tight truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#E5D3B3] font-mono-tabular">
                        {targetProduct
                          ? `${formatBRL(targetProduct.price)} · 50%: ${formatBRL(targetProduct.price / 2)}`
                          : 'Clique p/ encomendar'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 4: ATELIÊ SOB MEDIDA, PAGAMENTO 50%/50% & WHATSAPP
        =================================================================== */}
        <section
          id="como-funciona"
          className="bg-[#F3EDE2] border-t border-b border-[#E6DDD0] py-16"
        >
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <p className="text-xs text-[#631421] font-semibold tracking-wide">
                  Compromisso Peterson Shoes · Goiânia - Goiás · Fabricação Própria (Atacado & Varejo)
                </p>
                <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1F1215] mt-1">
                  Como funciona sua encomenda na Peterson Shoes?
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-xs sm:text-sm text-[#4A383B] leading-relaxed">
                  Somos de <strong>Goiânia - Goiás</strong> e produzimos sua sandália sob encomenda na numeração <strong>34 ao 39</strong> em <strong>{settings.productionDays} dias</strong>. O frete é por conta da cliente e combinado quando a sandália estiver pronta (<strong>Uber Moto</strong> em Goiânia e região ou <strong>Correios</strong> para outras cidades).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-[#631421] font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>50% Entrada + 50% Pronta (Pix ou Cartão)</span>
                </div>
                <p className="text-xs text-[#4A383B] leading-relaxed">
                  Você confirma seu pedido pagando <strong>50% de entrada</strong> (via <strong>Pix sem taxa</strong> ou no <strong>Cartão de Crédito com a taxa do banco</strong>). Os outros <strong>50% restantes</strong> só são pagos quando sua sandália estiver pronta.
                </p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-[#631421] font-semibold text-sm">
                  <Clock className="w-5 h-5 shrink-0" />
                  <span>Rastreamento de Produção em {settings.productionDays} Dias</span>
                </div>
                <p className="text-xs text-[#4A383B] leading-relaxed">
                  Acompanhe pelo site cada etapa: <em>Confirmação</em>, <em>Corte & Modelagem</em>, <em>Montagem Artesanal</em>, <em>Acabamento</em> e <em>Pronta para Entrega</em> usando o código da sua encomenda.
                </p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-[#631421] font-semibold text-sm">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Cores Padrão + Opção &ldquo;Outra Cor&rdquo;</span>
                </div>
                <p className="text-xs text-[#4A383B] leading-relaxed">
                  Todos os modelos podem ser feitos em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou em <strong>Outra Cor personalizada</strong> digitada por você na hora do pedido.
                </p>
              </div>
            </div>

            {/* Concierge CTA Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#631421] text-[#FAF7F2] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-xs text-[#E5D3B3] font-medium">
                  Atendimento Oficial · WhatsApp Direto & Consultora IA
                </p>
                <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold">
                  Deseja auxílio personalizado para montar sua encomenda?
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF7F2]/85 leading-relaxed">
                  Nossa Consultora Virtual IA responde instantaneamente sobre os modelos do Instagram, cores, prazos e status de pedidos, ou clique abaixo para falar diretamente conosco pelo WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAiOpen(true)}
                  className="px-5 py-3 bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#631421] rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Conversar com Consultora IA</span>
                </button>

                <a
                  href={toWhatsAppHref(
                    settings.whatsappStore,
                    'Olá, Peterson Shoes! Vi os modelos do Instagram no site e gostaria de fazer uma encomenda.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#2E6B3E] hover:bg-[#235330] text-white rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar Direto no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          COMPLETE E-COMMERCE FOOTER (Institutional, Payments, Shipping & Support)
      ===================================================================== */}
      <footer className="bg-[#1F1215] text-[#F3EDE2] py-12 border-t border-[#3D2228]">
        <div className="max-w-7xl mx-auto px-6 space-y-10 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand & Location */}
            <div className="space-y-2.5">
              <p className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
                Peterson Shoes
              </p>
              <p className="text-[#C9B9AC] leading-relaxed">
                Fabricação própria de calçados femininos artesanais em <strong>Goiânia – Goiás</strong>. Sandálias personalizadas sob encomenda na numeração 34 ao 39 BR com envio para todo o Brasil.
              </p>
              <p className="text-[11px] text-[#E5D3B3] font-mono-tabular">
                CNPJ: {settings.bankHolderDoc || '50.789.636/0001-32'} · Goiânia/GO
              </p>
            </div>

            {/* Col 2: Categories & Navigation */}
            <div className="space-y-2.5">
              <p className="font-semibold text-[#FAF7F2] uppercase tracking-wider text-[11px]">
                Categorias & Links Úteis
              </p>
              <ul className="space-y-2 text-[#C9B9AC]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Flatforms & Papetes');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    Flatforms & Papetes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Anabelas & Plataformas');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    Anabelas & Plataformas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Rasteiras & Gladiadoras');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    Rasteiras & Gladiadoras
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="hover:text-white cursor-pointer"
                  >
                    Guia de Medidas (34 ao 39 BR)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingQuery('');
                      setIsTrackingOpen(true);
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    Rastrear Pedido / Quitar 50% Finais
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Payment & Production Policy */}
            <div className="space-y-2.5">
              <p className="font-semibold text-[#FAF7F2] uppercase tracking-wider text-[11px]">
                Pagamento & Produção
              </p>
              <ul className="space-y-1.5 text-[#C9B9AC] leading-relaxed">
                <li>• <strong>Entrada de 50%</strong> para iniciar a confecção</li>
                <li>• <strong>50% Restantes</strong> somente quando ficar pronta</li>
                <li>• <strong>Pix sem taxa</strong> (Banco Inter CNPJ Oficial)</li>
                <li>• <strong>Cartão de Crédito</strong> em até 6x (c/ taxa da operadora)</li>
                <li>• <strong>Prazo de confecção:</strong> {settings.productionDays} dias</li>
              </ul>
            </div>

            {/* Col 4: Customer Support & Shipping */}
            <div className="space-y-2.5">
              <p className="font-semibold text-[#FAF7F2] uppercase tracking-wider text-[11px]">
                Atendimento & Entregas
              </p>
              <p className="text-[#C9B9AC] leading-relaxed">
                • <strong>Goiânia e Região:</strong> Entrega via Uber Moto.<br />
                • <strong>Todo o Brasil:</strong> Envio via Correios (PAC / Sedex).<br />
                • <strong>Atendimento Oficial:</strong> Segunda a Sábado pelo WhatsApp e Instagram.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E5D3B3] hover:text-white font-semibold"
                >
                  @petersonshoes_
                </a>
                <span>·</span>
                <a
                  href={toWhatsAppHref(
                    settings.whatsappStore,
                    'Olá, Peterson Shoes! Vim pelo site oficial.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E5D3B3] hover:text-white font-semibold"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#3D2228] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#C9B9AC]">
            <p>© {new Date().getFullYear()} Peterson Shoes · Goiânia - Goiás · Todos os direitos reservados.</p>
            <p>Compra 100% Segura · Fabricação Própria Sob Encomenda</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Customer Service Button (Bottom Right) */}
      <a
        href={toWhatsAppHref(
          settings.whatsappStore,
          'Olá, Peterson Shoes! Estou navegando no site e gostaria de atendimento.'
        )}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackStoreEvent({ type: 'WHATSAPP' })}
        className="fixed bottom-5 right-4 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5B] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Falar com a Peterson Shoes no WhatsApp"
        title="Atendimento via WhatsApp"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
      </a>

      {/* =====================================================================
          MODALS & DRAWERS
      ===================================================================== */}
      <ProductCustomModal
        product={activeProductModal}
        initialColorIdx={activeModalColorIdx}
        initialPhotoUrl={activeModalPhotoUrl}
        isOpen={Boolean(activeProductModal)}
        onClose={() => {
          setActiveProductModal(null);
          setActiveModalPhotoUrl(undefined);
        }}
        onAddToCart={handleAddToCart}
        onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
        whatsappStore={settings.whatsappStore}
        creditCardFeePercentage={settings.creditCardFeePercentage ?? 4.99}
      />

      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderCreated={(newOrder: BespokeOrder) => {
          setTrackingQuery(newOrder.orderCode);
        }}
        whatsappStore={settings.whatsappStore}
        creditCardFeePercentage={settings.creditCardFeePercentage ?? 4.99}
        bankName={settings.bankName}
        bankHolderName={settings.bankHolderName}
        bankHolderDoc={settings.bankHolderDoc}
        pixKey={settings.pixKey}
        pixKeyType={settings.pixKeyType}
        bankAgency={settings.bankAgency}
        bankAccount={settings.bankAccount}
        cardPaymentLink={settings.cardPaymentLink}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialQuery={trackingQuery}
        whatsappStore={settings.whatsappStore}
        creditCardFeePercentage={settings.creditCardFeePercentage ?? 4.99}
      />

      <AiConsultantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        whatsappStore={settings.whatsappStore}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        onSelectSizeFilter={(size) => setSelectedSizeFilter(size)}
      />

      {quickZoomPhoto && (
        <div
          onClick={() => setQuickZoomPhoto(null)}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between gap-4 text-[#FAF7F2] mb-3 px-1">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {quickZoomPhoto.title}
                </p>
                <p className="text-xs text-[#E5D3B3] truncate font-mono-tabular">
                  {quickZoomPhoto.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickZoomPhoto(null)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>

            <div className="w-full max-h-[72vh] bg-[#1A0509] rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center">
              <img
                src={quickZoomPhoto.url}
                alt={quickZoomPhoto.title}
                className="max-h-[72vh] w-auto object-contain block"
              />
            </div>

            <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const target = quickZoomPhoto;
                  setQuickZoomPhoto(null);
                  openProductCustomizer(
                    target.product,
                    target.colorIdx,
                    target.url
                  );
                }}
                className="flex-1 py-3 px-5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Personalizar Cor, Numeração (34 ao 39) & Encomendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
