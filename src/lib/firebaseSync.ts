import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  BespokeOrder,
  CustomerRecord,
  PaymentRecord,
  StoreSettings,
} from '../types/peterson';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function sanitizeId(raw: string | undefined, prefix = 'doc'): string {
  const cleaned = String(raw || `${prefix}-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 120);
  return cleaned || `${prefix}-${Date.now()}`;
}

function stripUndefined<T>(val: T): T {
  if (val === undefined) return null as unknown as T;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefined(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = stripUndefined(v);
    }
  }
  return out as T;
}

export function sanitizeOrderForFirestore(order: BespokeOrder): BespokeOrder {
  const id = sanitizeId(order.id, 'ord');
  const nowIso = new Date().toISOString();
  const rawPayments = order.payments;
  const cleanedOrder: BespokeOrder = {
    id,
    orderCode: String(order.orderCode || `PTS-2026-101`).slice(0, 64),
    customerId: sanitizeId(order.customerId, 'cust'),
    customerName: String(order.customerName || 'Cliente Peterson Shoes').slice(0, 200),
    customerWhatsapp: String(order.customerWhatsapp || '').slice(0, 60),
    customerEmail: String(order.customerEmail || '').slice(0, 200),
    customerCpf: String(order.customerCpf || '').slice(0, 40),
    shippingAddress: String(order.shippingAddress || '').slice(0, 500),
    items: Array.isArray(order.items) ? stripUndefined(order.items) : [],
    totalAmount: Math.max(0, Number(order.totalAmount) || 0),
    depositAmount: Math.max(0, Number(order.depositAmount) || 0),
    remainingAmount: Math.max(0, Number(order.remainingAmount) || 0),
    preferredPaymentMethod:
      order.preferredPaymentMethod === 'CARTAO_MERCADO_PAGO'
        ? 'CARTAO_MERCADO_PAGO'
        : 'PIX_MERCADO_PAGO',
    paymentStatus: [
      'AGUARDANDO_ENTRADA_50',
      'ENTRADA_50_PAGA',
      'AGUARDANDO_FINAL_50',
      'QUITADO_100',
    ].includes(order.paymentStatus)
      ? order.paymentStatus
      : 'AGUARDANDO_ENTRADA_50',
    productionStatus: [
      'AGUARDANDO_CONFIRMACAO',
      'CORTE_MODELAGEM',
      'MONTAGEM_ARTESANAL',
      'ACABAMENTO_QUALIDADE',
      'PRONTA_PARA_ENTREGA',
      'ENVIADA_ENTREGUE',
    ].includes(order.productionStatus)
      ? order.productionStatus
      : 'AGUARDANDO_CONFIRMACAO',
    estimatedDeliveryDate: String(order.estimatedDeliveryDate || '').slice(0, 64),
    productionDays: Number(order.productionDays) || 15,
    factoryNotes: String(order.factoryNotes || '').slice(0, 2000),
    trackingCode: String(order.trackingCode || '').slice(0, 120),
    createdAt: String(order.createdAt || nowIso).slice(0, 64),
    updatedAt: String(order.updatedAt || nowIso).slice(0, 64),
  };
  if (rawPayments && Array.isArray(rawPayments)) {
    cleanedOrder.payments = rawPayments.map((p) =>
      sanitizePaymentForFirestore(p, id, cleanedOrder.orderCode)
    );
  }
  return stripUndefined(cleanedOrder);
}

export function sanitizePaymentForFirestore(
  payment: PaymentRecord,
  fallbackOrderId?: string,
  fallbackOrderCode?: string
): PaymentRecord {
  const id = sanitizeId(payment.id, 'pay');
  const nowIso = new Date().toISOString();
  return stripUndefined({
    id,
    orderId: sanitizeId(payment.orderId || fallbackOrderId, 'ord'),
    orderCode: String(payment.orderCode || fallbackOrderCode || 'PTS-2026-101').slice(
      0,
      64
    ),
    installmentType:
      payment.installmentType === 'FINAL_50' ? 'FINAL_50' : 'ENTRADA_50',
    method:
      payment.method === 'CARTAO_MERCADO_PAGO'
        ? 'CARTAO_MERCADO_PAGO'
        : 'PIX_MERCADO_PAGO',
    baseAmount: Math.max(0, Number(payment.baseAmount ?? payment.amount) || 0),
    feeAmount: Math.max(0, Number(payment.feeAmount) || 0),
    installments: Math.max(1, Number(payment.installments) || 1),
    cardBrand: String(payment.cardBrand || '').slice(0, 40),
    cardLast4: String(payment.cardLast4 || '').slice(0, 10),
    amount: Math.max(0, Number(payment.amount) || 0),
    status: payment.status === 'APROVADO' ? 'APROVADO' : 'PENDENTE',
    pixCopyPaste: String(payment.pixCopyPaste || '').slice(0, 1000),
    mpReferenceId: String(payment.mpReferenceId || '').slice(0, 128),
    sandboxMode: Boolean(payment.sandboxMode ?? true),
    paidAt: payment.paidAt ? String(payment.paidAt).slice(0, 64) : null,
    createdAt: String(payment.createdAt || nowIso).slice(0, 64),
  });
}

export function sanitizeCustomerForFirestore(
  customer: Partial<CustomerRecord> & { id?: string; name?: string; whatsapp?: string }
): CustomerRecord {
  const id = sanitizeId(customer.id, 'cust');
  const nowIso = new Date().toISOString();
  return stripUndefined({
    id,
    name: String(customer.name || 'Cliente Peterson Shoes').slice(0, 200),
    email: String(customer.email || '').slice(0, 200),
    whatsapp: String(customer.whatsapp || '').slice(0, 60),
    cpf: String(customer.cpf || '').slice(0, 40),
    cep: String(customer.cep || '').slice(0, 20),
    street: String(customer.street || '').slice(0, 200),
    number: String(customer.number || '').slice(0, 40),
    complement: String(customer.complement || '').slice(0, 120),
    neighborhood: String(customer.neighborhood || '').slice(0, 120),
    city: String(customer.city || 'Goiânia').slice(0, 120),
    state: String(customer.state || 'GO').slice(0, 40),
    totalOrders: Math.max(1, Number(customer.totalOrders) || 1),
    totalSpent: Math.max(0, Number(customer.totalSpent) || 0),
    createdAt: String(customer.createdAt || nowIso).slice(0, 64),
  });
}

export async function syncOrderToCloud(
  order: BespokeOrder,
  payments?: PaymentRecord[],
  customer?: Partial<CustomerRecord>
): Promise<void> {
  const cleanOrder = sanitizeOrderForFirestore(order);
  const orderPath = `orders/${cleanOrder.id}`;
  try {
    await setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder, { merge: true });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, orderPath);
    } catch {
      // Logged via handleFirestoreError
    }
  }

  const allPayments = payments || order.payments || [];
  for (const pay of allPayments) {
    const cleanPay = sanitizePaymentForFirestore(
      pay,
      cleanOrder.id,
      cleanOrder.orderCode
    );
    const payPath = `payments/${cleanPay.id}`;
    try {
      await setDoc(doc(db, 'payments', cleanPay.id), cleanPay, { merge: true });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, payPath);
      } catch {
        // Logged
      }
    }
  }

  const custData = sanitizeCustomerForFirestore(
    customer || {
      id: cleanOrder.customerId,
      name: cleanOrder.customerName,
      whatsapp: cleanOrder.customerWhatsapp,
      email: cleanOrder.customerEmail,
      cpf: cleanOrder.customerCpf,
      totalOrders: 1,
      totalSpent: cleanOrder.totalAmount,
      createdAt: cleanOrder.createdAt,
    }
  );
  const custPath = `customers/${custData.id}`;
  try {
    await setDoc(doc(db, 'customers', custData.id), custData, { merge: true });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, custPath);
    } catch {
      // Logged
    }
  }
}

export async function deleteOrderFromCloud(
  orderId: string,
  orderCode?: string,
  paymentIds?: string[]
): Promise<void> {
  const cleanOrderId = sanitizeId(orderId, 'ord');
  try {
    await deleteDoc(doc(db, 'orders', cleanOrderId));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `orders/${cleanOrderId}`);
    } catch {
      // Logged
    }
  }

  if (Array.isArray(paymentIds)) {
    for (const pid of paymentIds) {
      const cleanPid = sanitizeId(pid, 'pay');
      try {
        await deleteDoc(doc(db, 'payments', cleanPid));
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, `payments/${cleanPid}`);
        } catch {
          // Logged
        }
      }
    }
  }

  try {
    const delRef = doc(db, 'store_state', 'deleted_items');
    const snap = await getDoc(delRef);
    const existing = snap.exists() ? snap.data() : {};
    const prevOrders: string[] = Array.isArray(existing.deletedOrderIds)
      ? existing.deletedOrderIds
      : [];
    const nextOrders = Array.from(
      new Set([...prevOrders, cleanOrderId, ...(orderCode ? [orderCode] : [])])
    ).slice(-500);
    await setDoc(
      delRef,
      {
        ...existing,
        id: 'deleted_items',
        deletedOrderIds: nextOrders,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'store_state/deleted_items');
    } catch {
      // Logged
    }
  }
}

export async function deleteCustomerFromCloud(customerId: string): Promise<void> {
  const cleanCustId = sanitizeId(customerId, 'cust');
  try {
    await deleteDoc(doc(db, 'customers', cleanCustId));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `customers/${cleanCustId}`);
    } catch {
      // Logged
    }
  }

  try {
    const delRef = doc(db, 'store_state', 'deleted_items');
    const snap = await getDoc(delRef);
    const existing = snap.exists() ? snap.data() : {};
    const prevCusts: string[] = Array.isArray(existing.deletedCustomerIds)
      ? existing.deletedCustomerIds
      : [];
    const nextCusts = Array.from(new Set([...prevCusts, cleanCustId])).slice(-500);
    await setDoc(
      delRef,
      {
        ...existing,
        id: 'deleted_items',
        deletedCustomerIds: nextCusts,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'store_state/deleted_items');
    } catch {
      // Logged
    }
  }
}

export async function syncCatalogOverridesToCloud(
  productOverrides: Record<string, unknown>,
  deletedProductIds?: string[]
): Promise<void> {
  const path = 'store_state/catalog_overrides';
  try {
    const payload: Record<string, unknown> = {
      id: 'catalog_overrides',
      productOverrides: stripUndefined(productOverrides),
      updatedAt: new Date().toISOString(),
    };
    if (Array.isArray(deletedProductIds)) {
      payload.deletedProductIds = deletedProductIds;
    }
    await setDoc(doc(db, 'store_state', 'catalog_overrides'), payload, {
      merge: true,
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged
    }
  }
}

export async function syncSettingsToCloud(settings: StoreSettings): Promise<void> {
  const path = 'store_state/settings';
  try {
    await setDoc(
      doc(db, 'store_state', 'settings'),
      {
        id: 'settings',
        settings: stripUndefined(settings),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged
    }
  }
}

export interface CloudAnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: string[];
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
}

export async function recordAnalyticsEventToCloud(event: {
  type: 'VISITA' | 'PRODUTO' | 'SACOLA' | 'WHATSAPP';
  visitorId?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  referrer?: string;
  source?: string;
}): Promise<CloudAnalyticsSummary | null> {
  const path = 'store_state/analytics';
  try {
    const ref = doc(db, 'store_state', 'analytics');
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};

    let totalVisits = Number(data.totalVisits) || 0;
    const uniqueVisitors: string[] = Array.isArray(data.uniqueVisitors)
      ? [...data.uniqueVisitors]
      : [];
    const dailyVisits: Record<string, number> =
      data.dailyVisits && typeof data.dailyVisits === 'object'
        ? { ...data.dailyVisits }
        : {};
    const sources = {
      google: Number(data.sources?.google) || 0,
      instagram: Number(data.sources?.instagram) || 0,
      whatsapp: Number(data.sources?.whatsapp) || 0,
      direto: Number(data.sources?.direto) || 0,
    };
    const productViews: Record<
      string,
      { sku: string; name: string; count: number }
    > =
      data.productViews && typeof data.productViews === 'object'
        ? { ...data.productViews }
        : {};
    let whatsappClicks = Number(data.whatsappClicks) || 0;
    let cartAdditions = Number(data.cartAdditions) || 0;
    const recentEvents: CloudAnalyticsSummary['recentEvents'] = Array.isArray(
      data.recentEvents
    )
      ? [...data.recentEvents]
      : [];

    const rawRef = String(event.source || event.referrer || '').toLowerCase();
    let sourceKey: 'google' | 'instagram' | 'whatsapp' | 'direto' = 'direto';
    if (rawRef.includes('instagram') || rawRef.includes('ig')) {
      sourceKey = 'instagram';
    } else if (rawRef.includes('google') || rawRef.includes('bing')) {
      sourceKey = 'google';
    } else if (rawRef.includes('whatsapp') || rawRef.includes('wa.me')) {
      sourceKey = 'whatsapp';
    }

    const today = new Date().toISOString().split('T')[0];
    let label = 'Visitou a loja online Peterson Shoes';

    if (event.type === 'VISITA') {
      totalVisits += 1;
      dailyVisits[today] = (dailyVisits[today] || 0) + 1;
      sources[sourceKey] = (sources[sourceKey] || 0) + 1;
      if (
        event.visitorId &&
        !uniqueVisitors.includes(event.visitorId) &&
        uniqueVisitors.length < 2000
      ) {
        uniqueVisitors.push(event.visitorId);
      }
    } else if (event.type === 'PRODUTO') {
      const pid = sanitizeId(event.productId || event.productSku || 'prod', 'prod');
      const existingView = productViews[pid] || {
        sku: String(event.productSku || 'PTS').slice(0, 32),
        name: String(event.productName || 'Modelo Peterson Shoes').slice(0, 120),
        count: 0,
      };
      productViews[pid] = {
        ...existingView,
        count: existingView.count + 1,
      };
      label = `Visualizou: ${existingView.name}`;
    } else if (event.type === 'SACOLA') {
      cartAdditions += 1;
      label = `Adicionou à sacola: ${event.productName || 'Sandália Sob Encomenda'}`;
    } else if (event.type === 'WHATSAPP') {
      whatsappClicks += 1;
      label = 'Clicou para atendimento/pedido no WhatsApp';
    }

    const newEventItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: event.type,
      label: label.slice(0, 180),
      source: sourceKey,
      timestamp: new Date().toISOString(),
    };

    const updatedRecent = [newEventItem, ...recentEvents].slice(0, 40);
    const summary: CloudAnalyticsSummary = {
      totalVisits,
      uniqueVisitors,
      uniqueVisitorsCount: Math.max(uniqueVisitors.length, totalVisits > 0 ? 1 : 0),
      dailyVisits,
      sources,
      productViews,
      whatsappClicks,
      cartAdditions,
      recentEvents: updatedRecent,
    };

    await setDoc(
      ref,
      {
        id: 'analytics',
        ...summary,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return summary;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged
    }
    return null;
  }
}

export async function seedInitialOrderToCloudIfEmpty(
  initialOrders: BespokeOrder[],
  initialPayments: PaymentRecord[],
  initialCustomers: CustomerRecord[]
): Promise<void> {
  try {
    const delSnap = await getDoc(doc(db, 'store_state', 'deleted_items'));
    const deletedOrderIds = new Set<string>(
      delSnap.exists() && Array.isArray(delSnap.data()?.deletedOrderIds)
        ? delSnap.data().deletedOrderIds
        : []
    );

    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty && initialOrders.length > 0) {
      for (const ord of initialOrders) {
        if (!deletedOrderIds.has(ord.id) && !deletedOrderIds.has(ord.orderCode)) {
          const ordPayments = initialPayments.filter((p) => p.orderId === ord.id);
          const ordCustomer = initialCustomers.find((c) => c.id === ord.customerId);
          await syncOrderToCloud(ord, ordPayments, ordCustomer);
        }
      }
    }
  } catch {
    // Non-blocking seed
  }
}

export function subscribeToCloudStore(callbacks: {
  onCloudOrdersUpdated?: (payload: {
    orders: BespokeOrder[];
    payments: PaymentRecord[];
    customers: CustomerRecord[];
    deletedOrderIds: string[];
    deletedCustomerIds: string[];
  }) => void;
  onCloudAnalyticsUpdated?: (analytics: CloudAnalyticsSummary) => void;
  onCloudCatalogUpdated?: (payload: {
    productOverrides: Record<string, Partial<Record<string, unknown>>>;
    deletedProductIds: string[];
    settings?: StoreSettings;
  }) => void;
}): () => void {
  let latestOrders: BespokeOrder[] = [];
  let latestPayments: PaymentRecord[] = [];
  let latestCustomers: CustomerRecord[] = [];
  let latestDeletedOrderIds: string[] = [];
  let latestDeletedCustomerIds: string[] = [];
  let ordersLoaded = false;

  const emitOrdersBundle = () => {
    if (!ordersLoaded || !callbacks.onCloudOrdersUpdated) return;
    callbacks.onCloudOrdersUpdated({
      orders: latestOrders,
      payments: latestPayments,
      customers: latestCustomers,
      deletedOrderIds: latestDeletedOrderIds,
      deletedCustomerIds: latestDeletedCustomerIds,
    });
  };

  const unsubOrders = onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      latestOrders = snapshot.docs.map(
        (d) => d.data() as unknown as BespokeOrder
      );
      ordersLoaded = true;
      emitOrdersBundle();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } catch {
        // Logged
      }
    }
  );

  const unsubPayments = onSnapshot(
    collection(db, 'payments'),
    (snapshot) => {
      latestPayments = snapshot.docs.map(
        (d) => d.data() as unknown as PaymentRecord
      );
      emitOrdersBundle();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'payments');
      } catch {
        // Logged
      }
    }
  );

  const unsubCustomers = onSnapshot(
    collection(db, 'customers'),
    (snapshot) => {
      latestCustomers = snapshot.docs.map(
        (d) => d.data() as unknown as CustomerRecord
      );
      emitOrdersBundle();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      } catch {
        // Logged
      }
    }
  );

  const unsubStoreState = onSnapshot(
    collection(db, 'store_state'),
    (snapshot) => {
      let productOverrides: Record<string, Partial<Record<string, unknown>>> = {};
      let deletedProductIds: string[] = [];
      let cloudSettings: StoreSettings | undefined;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (docSnap.id === 'deleted_items') {
          if (Array.isArray(data.deletedOrderIds)) {
            latestDeletedOrderIds = data.deletedOrderIds;
          }
          if (Array.isArray(data.deletedCustomerIds)) {
            latestDeletedCustomerIds = data.deletedCustomerIds;
          }
          if (Array.isArray(data.deletedProductIds)) {
            deletedProductIds = [
              ...deletedProductIds,
              ...data.deletedProductIds,
            ];
          }
        } else if (docSnap.id === 'catalog_overrides') {
          if (data.productOverrides && typeof data.productOverrides === 'object') {
            productOverrides = data.productOverrides;
          }
          if (Array.isArray(data.deletedProductIds)) {
            deletedProductIds = [
              ...deletedProductIds,
              ...data.deletedProductIds,
            ];
          }
        } else if (docSnap.id === 'settings' && data.settings) {
          cloudSettings = data.settings as StoreSettings;
        } else if (docSnap.id === 'analytics' && callbacks.onCloudAnalyticsUpdated) {
          callbacks.onCloudAnalyticsUpdated({
            totalVisits: Number(data.totalVisits) || 0,
            uniqueVisitors: Array.isArray(data.uniqueVisitors)
              ? data.uniqueVisitors
              : [],
            uniqueVisitorsCount:
              Number(data.uniqueVisitorsCount) ||
              (Array.isArray(data.uniqueVisitors)
                ? data.uniqueVisitors.length
                : 0),
            dailyVisits: data.dailyVisits || {},
            sources: data.sources || {
              google: 0,
              instagram: 0,
              whatsapp: 0,
              direto: 0,
            },
            productViews: data.productViews || {},
            whatsappClicks: Number(data.whatsappClicks) || 0,
            cartAdditions: Number(data.cartAdditions) || 0,
            recentEvents: Array.isArray(data.recentEvents)
              ? data.recentEvents
              : [],
          });
        }
      }

      emitOrdersBundle();
      if (callbacks.onCloudCatalogUpdated) {
        callbacks.onCloudCatalogUpdated({
          productOverrides,
          deletedProductIds: Array.from(new Set(deletedProductIds)),
          settings: cloudSettings,
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'store_state');
      } catch {
        // Logged
      }
    }
  );

  return () => {
    unsubOrders();
    unsubPayments();
    unsubCustomers();
    unsubStoreState();
  };
}

// Web Audio API Sound Alert for New Pending Orders in Admin Dashboard
let sharedAudioCtx: AudioContext | null = null;

export function unlockAdminAudioAlert(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio context errors
  }
}

export function playNewOrderAlertSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    // 3-chime harmonic bell sequence (E5 -> G#5 -> B5 -> E6) repeated twice for clear attention
    const notes = [
      { freq: 659.25, start: 0, duration: 0.22 },
      { freq: 830.61, start: 0.18, duration: 0.22 },
      { freq: 987.77, start: 0.36, duration: 0.25 },
      { freq: 1318.51, start: 0.56, duration: 0.55 },
      { freq: 987.77, start: 1.25, duration: 0.22 },
      { freq: 1318.51, start: 1.45, duration: 0.65 },
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.32, now + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + n.start + n.duration
      );

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.02);
    }
  } catch {
    // Ignore if browser blocked autoplay before user gesture
  }
}

export const PETERSON_MOBILE_PUSH_TOPIC = 'peterson-shoes-alerta-62984998265';

export async function sendMobilePushOrderAlert(
  order: BespokeOrder,
  stage: 'PEDIDO_CRIADO' | 'PIX_CONFIRMADO' | 'TESTE' = 'PEDIDO_CRIADO'
): Promise<boolean> {
  try {
    const itemsSummary = (order.items || [])
      .map(
        (it) =>
          `${it.quantity}x ${it.name} (Cor: ${it.colorName}, Tam: ${it.size} BR)`
      )
      .join(' + ');

    const totalFormatted = `R$ ${Number(order.totalAmount || 0)
      .toFixed(2)
      .replace('.', ',')}`;
    const depositFormatted = `R$ ${Number(order.depositAmount || 0)
      .toFixed(2)
      .replace('.', ',')}`;

    const title =
      stage === 'TESTE'
        ? `🔔 Teste de Alerta no Celular — Peterson Shoes`
        : stage === 'PIX_CONFIRMADO'
        ? `💰 PIX DE 50% INFORMADO (#${order.orderCode}) — Confirmar Agora!`
        : `🚨 NOVO PEDIDO #${order.orderCode} — Peterson Shoes!`;

    const message = [
      `Cliente: ${order.customerName} (${order.customerWhatsapp})`,
      `Modelo: ${itemsSummary || 'Sandália Sob Encomenda'}`,
      `Total: ${totalFormatted} | Entrada 50%: ${depositFormatted}`,
      `Toque aqui para abrir seu Painel Admin e aprovar em 1 clique!`,
    ].join('\n');

    const adminUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?acesso=admin`
        : 'https://ais-pre-hjb47jbbnfvcnibk2wkogq-443983653592.us-east1.run.app/?acesso=admin';

    const response = await fetch('https://ntfy.sh', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: PETERSON_MOBILE_PUSH_TOPIC,
        title,
        message,
        priority: 5,
        tags: ['bell', 'high_heeled_shoe', 'moneybag'],
        click: adminUrl,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

