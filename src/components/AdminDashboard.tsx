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
import { formatBRL } from '../utils/payment';
import {
  buildFactoryProductionMessage,
  buildReadyForFinalPaymentMessage,
  toWhatsAppHref,
} from '../utils/whatsapp';
import {
  buildStandardColors,
  getBrowserStoreDb,
  saveBrowserStoreDb,
  STANDARD_SIZES,
  updateBrowserOrderAdmin,
} from '../data/storeData';

interface AdminDashboardProps {
  onCloseAdmin: () => void;
  onCatalogUpdated: () => void;
}

const IMAGE_PRESETS = [
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
  const [loginEmail, setLoginEmail] = useState('contato@petersonshoes.com.br');
  const [loginPassword, setLoginPassword] = useState('peterson2026');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<
    'PRODUCTS' | 'ORDERS' | 'FINANCE' | 'CUSTOMERS' | 'SETTINGS' | 'SEO'
  >('PRODUCTS');

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
  const [sqlSchema, setSqlSchema] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Fast manual price editing state per product ID
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [savedPriceId, setSavedPriceId] = useState<string | null>(null);

  // Product Form Modal / Drawer State
  const [editingProduct, setEditingProduct] = useState<Partial<BespokeProduct> | null>(
    null
  );
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

  const applyDashboardFromDb = (db = getBrowserStoreDb()) => {
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
    const drafts: Record<string, string> = {};
    for (const p of db.products) {
      drafts[p.id] = p.price.toFixed(2);
    }
    setPriceDrafts(drafts);
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

  const fetchAdminData = async (adminToken: string) => {
    setLoading(true);
    applyDashboardFromDb(getBrowserStoreDb());
    try {
      const [dashRes, sqlRes] = await Promise.all([
        fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
        fetch('/api/admin/sql-schema', {
          headers: { Authorization: `Bearer ${adminToken}` },
        }),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data?.products && Array.isArray(data.products)) {
          const localDb = getBrowserStoreDb();
          const updatedDb = {
            ...localDb,
            products: data.products,
            settings: data.settings || localDb.settings,
          };
          saveBrowserStoreDb(updatedDb);
          applyDashboardFromDb(updatedDb);
        }
      }
      if (sqlRes.ok) {
        const sqlData = await sqlRes.json();
        setSqlSchema(sqlData.sql || '');
      }
    } catch {
      // Fallback already populated from getBrowserStoreDb()
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        fetchAdminData(data.token);
        return;
      }
    } catch {
      // Fallback to local password verification below
    }

    if (loginPassword.trim() === 'peterson2026') {
      const fallbackToken = 'peterson-local-admin-token';
      setToken(fallbackToken);
      fetchAdminData(fallbackToken);
    } else {
      setLoginError(
        'Credenciais inválidas. Para acessar use a senha padrão: peterson2026'
      );
    }
  };

  // 1-Click Manual Price Update Handler
  const handleQuickSavePrice = async (productId: string) => {
    if (!token) return;
    const rawVal = (priceDrafts[productId] || '').replace(',', '.');
    const numericPrice = parseFloat(rawVal);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    const roundedPrice = Math.round(numericPrice * 100) / 100;
    setSavingPriceId(productId);
    try {
      const localDb = getBrowserStoreDb();
      const updatedProducts = localDb.products.map((p) =>
        p.id === productId ? { ...p, price: roundedPrice } : p
      );
      saveBrowserStoreDb({ ...localDb, products: updatedProducts });
      setProducts(updatedProducts);
      setPriceDrafts((prev) => ({
        ...prev,
        [productId]: roundedPrice.toFixed(2),
      }));

      try {
        await fetch(`/api/admin/products/${productId}/price`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ price: roundedPrice }),
        });
      } catch {
        // Local storage already updated
      }

      setSavedPriceId(productId);
      onCatalogUpdated();
      setTimeout(() => {
        setSavedPriceId((curr) => (curr === productId ? null : curr));
      }, 2500);
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    updates: {
      productionStatus?: ProductionStatus;
      paymentStatus?: PaymentStatus;
      factoryNotes?: string;
      trackingCode?: string;
    }
  ) => {
    if (!token) return;
    updateBrowserOrderAdmin(orderId, updates);
    applyDashboardFromDb(getBrowserStoreDb());
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchAdminData(token);
      }
    } catch {
      // Local update already applied
    }
  };

  const openNewProductForm = () => {
    setEditingProduct({
      name: '',
      sku: `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      subtitle: 'Modelo Oficial @petersonshoes_ Feito Sob Encomenda',
      category: 'Flatforms & Papetes',
      price: 229.9,
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
        const res = await fetch('/api/admin/upload-image', {
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
    setEditingProduct({ ...prod });
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

    const payload: BespokeProduct = {
      id: editingProduct.id || `prod-${Date.now()}`,
      sku:
        editingProduct.sku || `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      name: editingProduct.name || 'Sandália Peterson Shoes',
      subtitle:
        editingProduct.subtitle || 'Sandália Feminina Feita Sob Encomenda',
      category: editingProduct.category || 'Flatforms & Papetes',
      price: Number(editingProduct.price || 229.9),
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
      const localDb = getBrowserStoreDb();
      const isExisting = Boolean(editingProduct.id);
      if (isExisting) {
        localDb.products = localDb.products.map((p) =>
          p.id === payload.id ? payload : p
        );
      } else {
        localDb.products.unshift(payload);
      }
      saveBrowserStoreDb(localDb);
      applyDashboardFromDb(localDb);

      try {
        const url = isExisting
          ? `/api/admin/products/${editingProduct.id}`
          : '/api/admin/products';
        const method = isExisting ? 'PUT' : 'POST';

        await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // Local storage already updated
      }

      setEditingProduct(null);
      onCatalogUpdated();
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    const localDb = getBrowserStoreDb();
    localDb.products = localDb.products.filter((p) => p.id !== id);
    saveBrowserStoreDb(localDb);
    applyDashboardFromDb(localDb);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Local storage already updated
    }
    onCatalogUpdated();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settings) return;
    setSavingSettings(true);
    setSettingsSavedMsg('');
    try {
      const localDb = getBrowserStoreDb();
      localDb.settings = { ...settings };
      saveBrowserStoreDb(localDb);
      applyDashboardFromDb(localDb);

      try {
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        });
      } catch {
        // Local storage already updated
      }

      setSettingsSavedMsg(
        'Configurações salvas e aplicadas na loja com sucesso!'
      );
      onCatalogUpdated();
      setTimeout(() => setSettingsSavedMsg(''), 3500);
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2500);
  };

  // If not logged in, render Admin Login Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex flex-col justify-center items-center p-4">
        <div className="bg-white border border-[#DFD3C3] rounded-xl max-w-md w-full p-8 shadow-xl">
          <button
            onClick={onCloseAdmin}
            className="text-xs font-medium text-[#5B1824] hover:underline flex items-center gap-1 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a Vitrine da Loja
          </button>

          <div className="flex items-center gap-2.5 text-[#5B1824] mb-2">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Acesso Restrito · Peterson Shoes
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-[#231619]">
            Painel Administrativo
          </h1>
          <p className="text-xs text-[#6E5A5F] mt-1">
            Edite manualmente o valor de cada modelo do Instagram em 1 clique. O cálculo de 50% de entrada + 50% final, produção e envio para o WhatsApp ficam 100% automatizados.
          </p>

          {loginError && (
            <div className="mt-4 p-3 rounded-lg bg-[#7A2434]/10 border border-[#7A2434] text-xs text-[#5B1824] font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#231619] mb-1">
                E-mail Administrativo
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231619] mb-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-sm text-[#231619] focus:outline-none focus:border-[#5B1824]"
              />
              <p className="text-[11px] text-[#6E5A5F] mt-1">
                Credencial padrão pré-configurada: <code className="font-mono">peterson2026</code>
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Entrar no Painel de Gestão
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#231619]">
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
                WhatsApp Integrado · Pagamento Automático 50% Entrada + 50% na Conclusão
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => token && fetchAdminData(token)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </button>
            <button
              onClick={() => setToken(null)}
              className="px-3 py-1.5 bg-black/25 hover:bg-black/40 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Financial Summary KPI Strip */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <span>Encomendas & Produção 15 Dias ({orders.length})</span>
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
        </div>

        {/* TAB 1: PRODUCTS CATALOG & 1-CLICK MANUAL PRICE EDITOR */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            <div className="p-5 bg-white border border-[#DFD3C3] rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5B1824]">
                  Edição Manual de Valores · Restante 100% Automatizado
                </span>
                <h2 className="text-2xl font-semibold text-[#231619]">
                  Todos os {products.length} Modelos do Instagram @petersonshoes_
                </h2>
                <p className="text-xs text-[#6E5A5F] max-w-2xl">
                  Para alterar o preço de qualquer sandália, basta digitar o novo valor no campo{' '}
                  <strong>&ldquo;Valor Total (R$)&rdquo;</strong> abaixo de cada modelo e clicar em{' '}
                  <strong>&ldquo;Salvar Valor&rdquo;</strong>. O sistema recalcula sozinho os{' '}
                  <strong>50% de entrada (Pix)</strong> e os <strong>50% finais</strong> na loja!
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
                      Categoria *
                    </label>
                    <select
                      value={editingProduct.category || 'Flatforms & Papetes'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs"
                    >
                      <option value="Flatforms & Papetes">Flatforms & Papetes</option>
                      <option value="Anabelas & Plataformas">Anabelas & Plataformas</option>
                      <option value="Rasteiras & Gladiadoras">Rasteiras & Gladiadoras</option>
                      <option value="Tamancos & Saltos">Tamancos & Saltos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231619] mb-1">
                      Preço Total (R$) * — Entrada será 50%
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingProduct.price ?? 229.9}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-[#F7F3EC] border border-[#DFD3C3] rounded-lg text-xs font-mono-tabular"
                    />
                  </div>
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
                      Prazo de Produção (Dias)
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
                      Foto do Produto (30 Fotos Reais @petersonshoes_ ou Enviar Nova Foto)
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

            {/* Products Grid with Direct Manual Price Input on Every Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => {
                const draftVal = priceDrafts[prod.id] ?? prod.price.toFixed(2);
                const numericDraft = parseFloat(String(draftVal).replace(',', '.'));
                const previewDeposit = !isNaN(numericDraft)
                  ? numericDraft * 0.5
                  : prod.price * 0.5;
                const isJustSaved = savedPriceId === prod.id;

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
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5B1824]">
                            {prod.category}
                          </p>
                          <h3 className="text-base font-semibold text-[#231619] mt-0.5">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#6E5A5F] mt-0.5 line-clamp-1">
                            {prod.subtitle}
                          </p>
                        </div>

                        {/* INLINE MANUAL PRICE EDITOR BOX */}
                        <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#DFD3C3] space-y-2">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor={`price-input-${prod.id}`}
                              className="text-xs font-bold text-[#5B1824]"
                            >
                              Editar Valor Manual (R$):
                            </label>
                            {isJustSaved && (
                              <span className="text-[11px] font-semibold text-[#2E6B3E] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Salvo na loja!
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="text-xs font-semibold text-[#6E5A5F] absolute left-3 top-1/2 -translate-y-1/2">
                                R$
                              </span>
                              <input
                                id={`price-input-${prod.id}`}
                                type="number"
                                step="0.10"
                                value={draftVal}
                                onChange={(e) =>
                                  setPriceDrafts((prev) => ({
                                    ...prev,
                                    [prod.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleQuickSavePrice(prod.id);
                                  }
                                }}
                                className="w-full pl-8 pr-3 py-2 bg-white border border-[#DFD3C3] focus:border-[#5B1824] rounded-lg text-sm font-mono-tabular font-bold text-[#231619] focus:outline-none"
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

            {orders.map((order) => {
              const factoryMsg = buildFactoryProductionMessage(order);
              const customerReadyMsg = buildReadyForFinalPaymentMessage(order);
              const factoryPhone = settings?.whatsappFactory || '5562984998265';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#DFD3C3] rounded-xl p-6 space-y-5 shadow-xs"
                >
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

                    <div className="text-right font-mono-tabular">
                      <p className="text-sm font-bold text-[#231619]">
                        Total: {formatBRL(order.totalAmount)}
                      </p>
                      <p className="text-xs text-[#5B1824]">
                        Entrada 50%: {formatBRL(order.depositAmount)} · Final 50%:{' '}
                        {formatBRL(order.remainingAmount)}
                      </p>
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
                              <strong>{item.size} BR</strong> · Salto:{' '}
                              <strong>{item.customization.heelOption}</strong> · Acabamento:{' '}
                              <strong>{item.customization.strapFinish}</strong>
                            </p>
                            <p className="text-[#6E5A5F]">
                              Forma: <strong>{item.customization.footWidth}</strong>
                              {item.customization.insoleEngraving
                                ? ` · Iniciais na Palmilha: "${item.customization.insoleEngraving}"`
                                : ''}
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
                        Status do Pagamento (50% / 50%)
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
                        Observações Internas da Fábrica
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
                        href={toWhatsAppHref(order.customerWhatsapp, customerReadyMsg)}
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
                Relatório Financeiro & Pagamentos Automatizados (50% Entrada / 50% Final)
              </h2>
              <p className="text-xs text-[#6E5A5F]">
                Cada encomenda gera automaticamente duas parcelas de 50%. A cliente pode pagar via <strong>Pix sem taxa</strong> (Chave: {settings?.pixKey || '62984998265'}) ou via <strong>Cartão de Crédito com repasse da taxa do banco</strong>.
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
                    <th className="py-3 px-4 font-semibold text-right">Ação</th>
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
                            : 'Pix Instantâneo'}
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
                          {pay.status === 'APROVADO' ? 'Recebido ✓' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pay.pixCopyPaste, pay.id)}
                          className="text-xs font-medium text-[#5B1824] hover:underline cursor-pointer"
                        >
                          {copiedTextId === pay.id ? 'Pix Copiado!' : 'Copiar Pix Copia e Cola'}
                        </button>
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
                            `Olá, ${c.name}! Aqui é do atendimento da Peterson Shoes.`
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
      </main>
    </div>
  );
};
