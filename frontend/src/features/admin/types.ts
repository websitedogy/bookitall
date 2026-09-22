export type OrderCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
};

export type DashboardCounts = {
  dailyVerified: {
    pendingUsers: number;
    pendingVendors: number;
    weeklyAmount: number;
  };
  management: {
    users: number;
    customers: number;
    vendors: number;
    pendingPayments: number;
    pendingPayouts: number;
    openTickets: number;
  };
  vendors: {
    pending: number;
    active: number;
    rejected: number;
    blocked: number;
    pendingPosts: number;
    categories: { id: string; name: string; count: number }[];
  };
  customers: {
    total: number;
    bookings: number;
    working: number;
    worked: number;
    scheduled: number;
  };
  orders?: OrderCounts;
  services?: { enabled: number; total: number };
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  role: string;
  status: string;
  businessName?: string | null;
  partnerType?: string | null;
  listings?: number;
  pendingPosts?: number;
  activePosts?: number;
  rejectedPosts?: number;
  createdAt?: string;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  verificationStatus?: string | null;
};

export type AdminBooking = {
  id: string;
  bookingNumber: string;
  type: string;
  status: string;
  total: string;
  scheduledAt: string | null;
  title: string;
  createdAt: string;
  customer?: { fullName: string; phone: string } | null;
  partner?: { fullName: string; phone: string } | null;
  payment?: { status: string; method: string; amount: string } | null;
  escalatedToAdmin?: boolean;
  vendorRespondBy?: string | null;
  address?: string;
  customerLocation?: string;
  details?: Record<string, unknown>;
};

export type AdminPayment = {
  id: string;
  reference: string;
  status: string;
  method: string;
  amount: string;
  createdAt: string;
  bookingId: string | null;
  bookingNumber: string | null;
  bookingStatus: string | null;
  title: string;
  customer?: { fullName: string; phone: string } | null;
};

export type AdminPayout = {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  processedAt?: string | null;
  reference?: string | null;
  failureReason?: string | null;
  user?: { fullName: string; phone: string; email: string } | null;
};

export type AdminTicket = {
  id: string;
  name: string;
  phone: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
  bookingRef: string | null;
  status: string;
  adminNote: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSender?: "USER" | "ADMIN";
  createdAt: string;
};

export type AdminListingField = {
  key: string;
  label: string;
  value: string;
};

export type VendorReport = {
  name: string;
  orders: { total: number; accepted: number; rejected: number; working: number };
  wallet: { available: string; pending: string };
  history: {
    id: string;
    type: string;
    reason: string;
    amount: string;
    balanceAfter: string;
    note: string | null;
    createdAt: string;
  }[];
};

export type AdminListing = {
  id: string;
  categoryId?: string;
  category: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  status: string;
  mobileNumber?: string | null;
  userId?: string;
  photoUrls?: string[];
  details?: AdminListingField[];
  description?: string;
  createdAt?: string;
  priceLabel?: string;
  ownerName?: string;
  orders?: OrderCounts;
};
