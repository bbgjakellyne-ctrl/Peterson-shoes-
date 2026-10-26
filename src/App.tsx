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
  const [isAdminView, setIsAdminView] = useState(false);
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
        fetch('/api/products'),
        fetch('/api/settings'),
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
      'Peterson Shoes | Sandálias Femininas em Goiânia (34 ao 39)';
    const baseDescription =
      'Peterson Shoes (@petersonshoes_): sandálias femininas de fabricação própria em Goiânia - GO sob encomenda do 34 ao 39. Papetes, Anabelas e Rasteiras com 50% de entrada.';

    let nextTitle = baseTitle;
    let nextDescription = baseDescription;
    let canonicalHref = `${origin}/`;

    if (activeProductModal) {
      const deposit = (activeProductModal.price * 0.5).toFixed(2).replace('.', ',');
      const total = activeProductModal.price.toFixed(2).replace('.', ',');
      nextTitle = `${activeProductModal.name} — R$ ${total} | Peterson Shoes Goiânia`;
      nextDescription = `${activeProductModal.name} (${activeProductModal.subtitle}). Confeccionada sob encomenda em Goiânia do 34 ao 39 BR por R$ ${total} (50% de entrada: R$ ${deposit} no Pix).`;
      canonicalHref = `${origin}/?modelo=${encodeURIComponent(activeProductModal.sku)}`;
    } else if (selectedCategory !== 'Todos') {
      nextTitle = `${selectedCategory} Sob Encomenda (34 ao 39) | Peterson Shoes Goiânia`;
      nextDescription = `Confira ${selectedCategory} de fabricação própria da Peterson Shoes (@petersonshoes_) em Goiânia - GO. Numeração 34 ao 39 BR com 50% de entrada no Pix ou Cartão.`;
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

  const handleAddToCart = (newItem: OrderItem) => {
    setCart((prev) => [...prev, newItem]);
    setIsCartOpen(true);
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
  };

  if (isAdminView) {
    return (
      <AdminDashboard
        onCloseAdmin={() => setIsAdminView(false)}
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
          TOP BAR CONTRACT (Strictly 3 Zones separated by gap-8)
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DDD0]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            translate="no"
            className="notranslate font-serif-display text-2xl sm:text-[1.7rem] font-semibold tracking-tight text-[#631421] whitespace-nowrap shrink-0"
          >
            PETERSON SHOES
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#3D2C30]">
            <a
              href="#catalogo"
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Coleção Instagram ({products.length})
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
              onClick={() => setIsAiOpen(true)}
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Consultora IA
            </button>
            <button
              type="button"
              onClick={() => setIsAdminView(true)}
              className="hover:text-[#631421] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Editar Preços / Admin
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#E5D3B3]" />
              <span>
                Sacola ({cartCount})
                {cartCount > 0 ? ` · 50% ${formatBRL(cartDepositTotal)}` : ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ===================================================================
            SECTION 1: EDITORIAL COUTURE HERO + 4-COLUMN BESPOKE PROCESS STRIP
        =================================================================== */}
        <section className="bg-[#FAF7F2] border-b border-[#E6DDD0]">
          {/* Mobile Navigation Bar */}
          <div className="md:hidden px-6 pt-3 pb-1 flex items-center gap-2 overflow-x-auto">
            <a
              href="#catalogo"
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#1F1215] rounded-lg text-xs font-medium whitespace-nowrap shrink-0"
            >
              Modelos Instagram ({products.length})
            </a>
            <a
              href="#galeria-instagram"
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#1F1215] rounded-lg text-xs font-medium whitespace-nowrap shrink-0"
            >
              @petersonshoes_
            </a>
            <button
              type="button"
              onClick={() => {
                setTrackingQuery('');
                setIsTrackingOpen(true);
              }}
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#1F1215] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rastrear Pedido
            </button>
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#631421] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Consultora IA
            </button>
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#1F1215] rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Guia de Medidas (34 ao 39)
            </button>
            <button
              type="button"
              onClick={() => setIsAdminView(true)}
              className="px-3 py-1.5 bg-[#F3EDE2] text-[#631421] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Editar Preços / Admin
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left Column: High-Fashion Typography & Value Proposition */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/instagram/profile_pic.jpg"
                      alt="Logo Peterson Shoes"
                      className="w-10 h-10 rounded-full object-cover border border-[#631421]/30 shrink-0"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#631421]">
                      <span>Fabricação Própria · Goiânia - Goiás</span>
                      <span aria-hidden="true">·</span>
                      <a
                        href={settings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold hover:underline"
                      >
                        @petersonshoes_
                      </a>
                      <span aria-hidden="true">·</span>
                      <a
                        href={toWhatsAppHref(
                          settings.whatsappStore,
                          'Olá, Peterson Shoes! Vi os modelos no site e gostaria de atendimento.'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#2E6B3E] hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Atendimento via WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <h1
                    className="font-serif-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.08] text-[#1F1215]"
                    style={{ textWrap: 'balance' }}
                  >
                    A elegância começa pelos pés.
                  </h1>

                  <p className="text-base sm:text-lg font-semibold text-[#631421] leading-snug max-w-xl">
                    Sofisticação, personalidade e exclusividade em cada passo.
                  </p>

                  <div className="space-y-3 text-sm sm:text-base text-[#4A383B] leading-relaxed max-w-xl">
                    <p>
                      Na <strong className="text-[#1F1215]">Peterson Shoes</strong>, cada sandália é mais do que um acessório: é uma expressão do seu estilo.
                    </p>
                    <p>
                      Descubra modelos que encantam, detalhes que fazem a diferença e o charme de uma produção artesanal feita especialmente para você.
                    </p>
                    <p className="font-semibold text-[#1F1215] pt-0.5">
                      Peterson Shoes — Porque cada detalhe do seu estilo importa.
                    </p>
                  </div>

                  {/* Clean Luxury Atelier Specification Highlights */}
                  <div className="bg-[#F3EDE2]/85 border border-[#E6DDD0] rounded-xl p-4 space-y-2.5 max-w-xl">
                    <div className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#3D2C30]">
                      <Check className="w-4 h-4 text-[#631421] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#1F1215]">Sob Medida (34 ao 39 BR):</strong> Todos os modelos do nosso Instagram confeccionados exclusivamente na sua numeração.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#3D2C30]">
                      <Check className="w-4 h-4 text-[#631421] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#1F1215]">Cores Clássicas ou Personalizada:</strong> Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou a{' '}
                        <strong className="text-[#631421]">cor que você escolher</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#3D2C30]">
                      <Check className="w-4 h-4 text-[#631421] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#1F1215]">Pagamento 50% + 50%:</strong> Confirme com{' '}
                        <strong className="text-[#631421]">50% de entrada</strong> (no Pix sem taxa ou no Cartão de Crédito com taxa da operadora) e pague os{' '}
                        <strong className="text-[#631421]">50% restantes somente quando ficar pronta</strong>.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls & Bespoke Guarantees */}
                <div className="space-y-5 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href="#catalogo"
                      className="px-6 py-3.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs sm:text-sm font-bold tracking-wider uppercase rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
                    >
                      <span>✨ EXPLORAR COLEÇÃO</span>
                      <ArrowRight className="w-4 h-4 text-[#E5D3B3]" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackingQuery('');
                        setIsTrackingOpen(true);
                      }}
                      className="px-5 py-3.5 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#1F1215] border border-[#D8CBB8] text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Acompanhar Pedido / Quitar 50%
                    </button>
                  </div>

                  {/* Quick Interactive Tools Strip */}
                  <div className="pt-4 border-t border-[#E6DDD0] flex flex-wrap items-center gap-5 text-xs text-[#6E5D5F]">
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="hover:text-[#631421] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Ruler className="w-3.5 h-3.5 text-[#631421]" />
                      <span>Guia de Numeração (34 ao 39 BR)</span>
                    </button>

                    <span aria-hidden="true">·</span>

                    <a
                      href={toWhatsAppHref(
                        settings.whatsappStore,
                        'Olá, Peterson Shoes! Vi os modelos do Instagram no site e gostaria de fazer uma encomenda.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#2E6B3E] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#2E6B3E]" />
                      <span>Falar Direto no WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Real Instagram Showcase Card */}
              <div className="lg:col-span-6 flex">
                <div className="w-full rounded-2xl overflow-hidden border border-[#E6DDD0] bg-[#2B0910] relative h-[440px] sm:h-[500px] shadow-lg group">
                  {currentHeroProduct ? (
                    <>
                      <img
                        src={currentHeroProduct.image}
                        alt={currentHeroProduct.name}
                        onClick={() =>
                          openProductCustomizer(
                            currentHeroProduct,
                            0,
                            currentHeroProduct.image
                          )
                        }
                        className="w-full h-full object-cover block cursor-pointer transition-transform duration-300 group-hover:scale-102"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0509]/95 via-[#1A0509]/25 to-black/25 flex flex-col justify-between p-5 sm:p-7 pointer-events-none">
                        {/* Top switcher inside showcase */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                          <span className="text-xs text-[#E5D3B3] font-medium bg-black/55 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/15">
                            Foto Real @petersonshoes_ · Goiânia - GO
                          </span>
                          {heroProducts.length > 1 && (
                            <div className="flex items-center gap-1 bg-black/55 backdrop-blur-xs p-1 rounded-lg border border-white/15">
                              {heroProducts.map((hp, idx) => (
                                <button
                                  key={hp.id}
                                  type="button"
                                  onClick={() => setHeroSlideIdx(idx)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                                    heroSlideIdx === idx
                                      ? 'bg-[#FAF7F2] text-[#631421]'
                                      : 'text-[#FAF7F2]/80 hover:text-white'
                                  }`}
                                >
                                  {idx === 0
                                    ? 'Papete Pirâmides'
                                    : idx === 1
                                      ? 'Anabela Fivela'
                                      : idx === 2
                                        ? 'Anabela Gladiadora'
                                        : 'Papete Strass'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bottom info & direct customizer button */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-12 pointer-events-auto">
                          <div>
                            <p className="text-xs text-[#E5D3B3]">
                              {currentHeroProduct.category} · Numerações 34 ao 39 BR
                            </p>
                            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#FAF7F2] mt-0.5">
                              {currentHeroProduct.name}
                            </h2>
                            <p className="text-xs text-[#FAF7F2]/90 mt-1 font-mono-tabular">
                              Valor Total: {formatBRL(currentHeroProduct.price)} ·{' '}
                              <strong className="text-[#E5D3B3]">
                                Entrada 50% (Pix ou Cartão): {formatBRL(currentHeroProduct.price / 2)}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setQuickZoomPhoto({
                                  url: currentHeroProduct.image,
                                  title: currentHeroProduct.name,
                                  subtitle: `${formatBRL(currentHeroProduct.price)} (50% Entrada: ${formatBRL(currentHeroProduct.price / 2)})`,
                                  product: currentHeroProduct,
                                  colorIdx: 0,
                                })
                              }
                              className="px-3 py-2.5 bg-black/55 hover:bg-black/75 text-[#FAF7F2] border border-white/20 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Ampliar foto da sandália"
                            >
                              <ZoomIn className="w-3.5 h-3.5 text-[#E5D3B3]" />
                              <span>Ver Foto</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openProductCustomizer(
                                  currentHeroProduct,
                                  0,
                                  currentHeroProduct.image
                                )
                              }
                              className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#631421] text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Personalizar Modelo
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Bespoke Process Bar Below Hero Split */}
            <div className="mt-12 pt-8 border-t border-[#E6DDD0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl bg-[#F3EDE2]/70 border border-[#E6DDD0]">
                <p className="text-xs font-bold text-[#631421]">
                  01. Modelo, Cor & Tam. 34 ao 39
                </p>
                <p className="text-xs text-[#4A383B] mt-1.5 leading-relaxed">
                  Escolha entre as 8 cores padrão (Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa) ou clique em <strong>Outra Cor</strong> e escreva a cor que deseja na numeração 34 ao 39.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F3EDE2]/70 border border-[#E6DDD0]">
                <p className="text-xs font-bold text-[#631421]">
                  02. 50% Entrada (Pix ou Cartão)
                </p>
                <p className="text-xs text-[#4A383B] mt-1.5 leading-relaxed">
                  Você escolhe como pagar os 50% de entrada: <strong>Pix sem taxa</strong> ou <strong>Cartão de Crédito em até 6x</strong> (com acréscimo da taxa cobrada pelo banco/operadora).
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F3EDE2]/70 border border-[#E6DDD0]">
                <p className="text-xs font-bold text-[#631421]">
                  03. Fabricação em {settings.productionDays} Dias
                </p>
                <p className="text-xs text-[#4A383B] mt-1.5 leading-relaxed">
                  Produção própria com materiais selecionados. Acompanhe corte, montagem e acabamento pelo código do seu pedido ou WhatsApp.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F3EDE2]/70 border border-[#E6DDD0]">
                <p className="text-xs font-bold text-[#631421]">
                  04. 50% Finais na Conclusão
                </p>
                <p className="text-xs text-[#4A383B] mt-1.5 leading-relaxed">
                  Somente quando sua sandália estiver pronta você paga os 50% restantes (também via Pix ou Cartão de Crédito) para envio ou entrega.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: BESPOKE CATALOG WITH ALL REAL INSTAGRAM MODELS
        =================================================================== */}
        <section id="catalogo" className="max-w-7xl mx-auto px-6 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0]">
            <div>
              <p className="text-xs text-[#631421] font-semibold tracking-wide">
                Todos os {products.length} Modelos Oficiais @petersonshoes_ · Numeração 34 ao 39 · Cores Padrão ou Outra Cor Sob Medida
              </p>
              <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#1F1215] mt-1">
                Catálogo Completo do Instagram Peterson Shoes
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdminView(true)}
                className="px-4 py-2.5 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#631421] border border-[#D8CBB8] rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#631421]" />
                <span>Editar Valores Manualmente</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="px-4 py-2.5 bg-[#F3EDE2] hover:bg-[#E6DDD0] text-[#1F1215] border border-[#D8CBB8] rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5 text-[#631421]" />
                <span>Provador de Medidas (34 ao 39)</span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Segmented Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F3EDE2] border border-[#E6DDD0] rounded-xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#631421] text-[#FAF7F2] shadow-xs'
                      : 'text-[#4A383B] hover:text-[#1F1215]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Size Filter + Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-[#6E5D5F] whitespace-nowrap mr-1">
                  Tam. (34 ao 39):
                </span>
                {[34, 35, 36, 37, 38, 39].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() =>
                      setSelectedSizeFilter(selectedSizeFilter === sz ? null : sz)
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-mono-tabular font-semibold border transition-colors cursor-pointer ${
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
                    className="text-xs font-semibold text-[#631421] hover:underline ml-1 cursor-pointer whitespace-nowrap"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="relative min-w-[230px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-[#6E5D5F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar papete, anabela, marsala, dourado..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E6DDD0] rounded-xl text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                />
              </div>
            </div>
          </div>

          {/* 3-Column Product Grid */}
          {loadingCatalog ? (
            <div className="py-16 text-center text-sm text-[#6E5D5F]">
              Carregando todos os modelos reais @petersonshoes_...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center bg-[#F3EDE2] border border-[#E6DDD0] rounded-2xl p-6">
              <p className="text-sm font-semibold text-[#1F1215]">
                Nenhuma sandália encontrada para o filtro selecionado.
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
                Exibir Todas as Sandálias
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const depositValue = product.price * 0.5;
                const activeColorIdx = selectedCardColorMap[product.id] ?? 0;
                const activeColor =
                  product.colors[activeColorIdx] || product.colors[0];
                const cardDisplayImage = activeColor?.image || product.image;

                return (
                  <article
                    key={product.id}
                    className="bg-white border border-[#E6DDD0] rounded-2xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      {/* Product Image with explicit height so it never collapses */}
                      <div
                        onClick={() =>
                          openProductCustomizer(
                            product,
                            activeColorIdx,
                            cardDisplayImage
                          )
                        }
                        className="w-full h-[340px] sm:h-[380px] bg-[#F3EDE2] overflow-hidden cursor-pointer relative border-b border-[#E6DDD0] group"
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
                          className="absolute bottom-3 right-3 px-2.5 py-1.5 bg-black/65 hover:bg-black/85 text-[#FAF7F2] text-[11px] font-medium rounded-lg flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
                          title="Ampliar foto em tela cheia"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#E5D3B3]" />
                          <span>Ampliar Foto</span>
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 space-y-3.5">
                        {/* Clean unboxed metadata with typographic separators */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E5D5F]">
                          <span className="uppercase tracking-wider font-medium text-[#631421]">
                            {product.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Produção: {product.productionDays} dias</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Tam. {product.availableSizes[0]} ao{' '}
                            {product.availableSizes[product.availableSizes.length - 1]}
                          </span>
                        </div>

                        <div>
                          <h3
                            onClick={() => openProductCustomizer(product, activeColorIdx)}
                            className="font-serif-display text-xl font-semibold text-[#1F1215] hover:text-[#631421] transition-colors cursor-pointer leading-snug"
                          >
                            {product.name}
                          </h3>
                          <p className="text-xs text-[#6E5D5F] mt-1 line-clamp-2">
                            {product.subtitle}
                          </p>
                        </div>

                        {/* Interactive Color Swatches + Outra Cor Trigger */}
                        <div className="pt-1 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6E5D5F]">
                              Cor Selecionada:{' '}
                              <strong className="text-[#1F1215]">
                                {activeColor?.name}
                              </strong>
                            </span>
                            <span className="text-[11px] text-[#631421] font-medium">
                              8 cores + Outra Cor
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
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
                                    title="Escolher outra cor personalizada e digitar qual cor você quer"
                                    className="px-2 py-1 rounded-md border border-dashed border-[#631421] bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[10px] font-semibold text-[#631421] transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    + Outra Cor
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
                                  title={`Selecionar cor ${c.name}`}
                                  className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                                    isChosen
                                      ? 'ring-2 ring-[#631421] ring-offset-1 scale-110 border-black/30'
                                      : 'border-black/25 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  aria-label={`Selecionar cor ${c.name}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Bespoke Action */}
                    <div className="px-6 pb-6 pt-4 border-t border-[#F3EDE2] space-y-3.5 bg-[#FAF7F2]/50">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-[#6E5D5F] block">
                            Valor Total Sob Encomenda
                          </span>
                          <span className="text-base font-semibold text-[#1F1215] font-mono-tabular">
                            {formatBRL(product.price)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-[#631421] block">
                            50% Entrada (Pix ou Cartão*)
                          </span>
                          <span className="text-lg font-bold text-[#631421] font-mono-tabular">
                            {formatBRL(depositValue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openProductCustomizer(product, activeColorIdx)}
                          className="flex-1 py-2.5 px-4 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Personalizar & Encomendar
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
                          title="Tirar dúvida desta sandália direto no WhatsApp"
                          className="p-2.5 bg-white hover:bg-[#F3EDE2] text-[#2E6B3E] border border-[#E6DDD0] rounded-xl transition-colors shrink-0"
                          aria-label={`Perguntar sobre ${product.name} no WhatsApp`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
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
                  Somos de <strong>Goiânia - Goiás</strong> e produzimos sua sandália sob encomenda na numeração <strong>34 ao 39</strong> em um ciclo cuidadoso de{' '}
                  <strong>{settings.productionDays} dias</strong>, com entrega em Goiânia e região ou envio para todo o Brasil via Correios.
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
          CLEAN FOOTER
      ===================================================================== */}
      <footer className="bg-[#1F1215] text-[#F3EDE2] py-12 border-t border-[#3D2228]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs">
          <div className="space-y-1.5">
            <p className="font-serif-display text-2xl font-semibold text-[#FAF7F2]">
              Peterson Shoes · Goiânia - Goiás
            </p>
            <p className="text-[#C9B9AC]">
              Seu estilo, sua sandália! Fabricação própria em Goiânia - GO sob encomenda (34 ao 39 BR) · Entrada de 50% (Pix ou Cartão c/ taxa) + 50% na conclusão ({settings.productionDays} dias).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[#C9B9AC]">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Instagram @petersonshoes_
            </a>
            <a
              href={toWhatsAppHref(
                settings.whatsappStore,
                'Olá, Peterson Shoes! Vim pelo site oficial.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Atendimento via WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                setTrackingQuery('');
                setIsTrackingOpen(true);
              }}
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Rastrear Pedido
            </button>
            <button
              type="button"
              onClick={() => setIsAdminView(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[#E5D3B3]" />
              <span>Editar Preços / Painel Admin</span>
            </button>
          </div>
        </div>
      </footer>

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
