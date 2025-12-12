"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Wallet,
  RefreshCw,
  Search,
  TrendingUp,
  DollarSign,
  History,
  Calendar,
  User,
  Mail,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import EnhancedPrintButton from "@/components/print/EnhancedPrintButton11";
import {
  adminWalletsAPI,
  walletsAPI,
  usersAPI,
  transactionsAPI,
} from "@/lib/api";

interface Transaction {
  _id?: string;
  id?: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
  balance?: number;
}

interface WalletWithCustomer {
  _id?: string;
  id?: string;
  customerId: string;
  balance: number;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerEmail?: string;
}

interface TransactionWithCustomer extends Transaction {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  walletId: string;
}

interface BankTransferRequest {
  _id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  status: string;
  createdAt: string;
  notes?: string;
  bankReceipt?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

interface TransferStats {
  pending: number;
  completed: number;
  rejected: number;
  approved: number;
  failed: number;
}

const DEFAULT_TRANSFER_STATS: TransferStats = {
  pending: 0,
  completed: 0,
  rejected: 0,
  approved: 0,
  failed: 0,
};

export default function WalletsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [wallets, setWallets] = useState<WalletWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<
    TransactionWithCustomer[]
  >([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [bankTransferRequests, setBankTransferRequests] = useState<
    BankTransferRequest[]
  >([]);
  const [bankTransfersLoading, setBankTransfersLoading] = useState(false);
  const [bankTransfersError, setBankTransfersError] = useState<string | null>(
    null
  );
  const [transferStats, setTransferStats] = useState<TransferStats>(
    DEFAULT_TRANSFER_STATS
  );
  const [transferStatusFilter, setTransferStatusFilter] = useState<
    "all" | "pending" | "completed" | "rejected" | "approved"
  >("pending");
  const [transferPage, setTransferPage] = useState(1);
  const [transferPerPage, setTransferPerPage] = useState(10);
  const [transfersPagination, setTransfersPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [transferActionLoading, setTransferActionLoading] = useState<
    string | null
  >(null);
  const [pendingPreview, setPendingPreview] = useState<BankTransferRequest[]>(
    []
  );
  const [pendingPreviewLoading, setPendingPreviewLoading] = useState(false);
  const [pendingPreviewError, setPendingPreviewError] = useState<string | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<BankTransferRequest | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [transactionsUserFilter, setTransactionsUserFilter] = useState<
    string | null
  >(null);
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);
  const [walletDetailsLoading, setWalletDetailsLoading] = useState(false);
  const [walletDetailsError, setWalletDetailsError] = useState<string | null>(
    null
  );
  const [selectedUserWallet, setSelectedUserWallet] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentTransactionsPage, setCurrentTransactionsPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);
  const transferStatusOptions = [
    { value: "pending", label: "معلقة" },
    { value: "completed", label: "مكتملة" },
    { value: "approved", label: "معتمدة" },
    { value: "rejected", label: "مرفوضة" },
    { value: "failed", label: "فاشلة" },
    { value: "all", label: "الكل" },
  ] as const;

  const normalizeTransfer = useCallback((item: any): BankTransferRequest => {
    const customer = item.customerId;
    const formattedName = `${customer?.firstName || ""}${
      customer?.lastName ? ` ${customer.lastName}` : ""
    }`.trim();

    return {
      _id: item._id,
      customerId: customer?._id || item.customerId,
      customerName:
        formattedName ||
        customer?.company_name_ar ||
        customer?.company_name_en ||
        customer?.email ||
        "عميل غير معروف",
      customerEmail: customer?.email || "غير متوفر",
      customerPhone: customer?.phone || customer?.phoneNumber || undefined,
      amount: Number(item.amount) || 0,
      status: item.status || "pending",
      createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
      notes: item.notes || item.description || "",
      bankReceipt: item.bankReceipt,
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      accountHolder: item.accountHolder,
    };
  }, []);

  const fetchBankTransfers = useCallback(async () => {
    try {
      setBankTransfersLoading(true);
      setBankTransfersError(null);

      const response = await adminWalletsAPI.getTransfers({
        status:
          transferStatusFilter === "all" ? undefined : transferStatusFilter,
        page: transferPage,
        limit: transferPerPage,
      });

      const rawItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

      const pagination = response?.pagination ||
        response?.data?.pagination || {
          total: rawItems.length,
          page: transferPage,
          pages: 1,
          limit: transferPerPage,
        };

      const stats =
        response?.statusCounts ||
        response?.data?.statusCounts ||
        DEFAULT_TRANSFER_STATS;

      const normalizedItems: BankTransferRequest[] =
        rawItems.map(normalizeTransfer);

      setBankTransferRequests(normalizedItems);
      setTransfersPagination({
        total: pagination.total || normalizedItems.length,
        page: pagination.page || transferPage,
        pages: pagination.pages || 1,
        limit: pagination.limit || transferPerPage,
      });
      setTransferStats(stats);
    } catch (err: any) {
      console.error("خطأ في جلب تحويلات البنوك:", err);
      setBankTransfersError(err.message || "فشل تحميل طلبات التحويل البنكي");
      setBankTransferRequests([]);
      setTransfersPagination({
        total: 0,
        page: 1,
        pages: 1,
        limit: transferPerPage,
      });
      setTransferStats(DEFAULT_TRANSFER_STATS);
    } finally {
      setBankTransfersLoading(false);
    }
  }, [transferStatusFilter, transferPage, transferPerPage, normalizeTransfer]);

  const fetchPendingPreview = useCallback(async () => {
    try {
      setPendingPreviewLoading(true);
      setPendingPreviewError(null);
      const response = await adminWalletsAPI.getPendingTransfers({
        page: 1,
        limit: 5,
      });
      const rawItems = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];
      setPendingPreview(rawItems.map(normalizeTransfer));
    } catch (err: any) {
      console.error("خطأ في جلب الطلبات المعلقة:", err);
      setPendingPreview([]);
      setPendingPreviewError(err.message || "فشل تحميل الطلبات المعلقة");
    } finally {
      setPendingPreviewLoading(false);
    }
  }, [normalizeTransfer]);

  useEffect(() => {
    fetchBankTransfers();
  }, [fetchBankTransfers]);

  useEffect(() => {
    fetchPendingPreview();
  }, [fetchPendingPreview]);
  useEffect(() => {
    const fetchWalletsWithCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) جلب المحافظ
        const walletsResponse = await walletsAPI.getAll();
        let walletsData: any[] = [];
        if (walletsResponse?.result && Array.isArray(walletsResponse.result)) {
          walletsData = walletsResponse.result;
        } else if (walletsResponse?.success && walletsResponse?.data) {
          walletsData = Array.isArray(walletsResponse.data)
            ? walletsResponse.data
            : [];
        } else if (Array.isArray(walletsResponse?.data)) {
          walletsData = walletsResponse.data;
        } else if (Array.isArray(walletsResponse)) {
          walletsData = walletsResponse as any[];
        }

        // 2) جلب المستخدمين (بحد كبير لتغطية كل المحافظ)
        const usersResponse = await usersAPI.getAll({
          page: 1,
          limit: Math.max(1000, walletsData.length || 1000),
        });
        let usersData: any[] = [];
        if (usersResponse?.result && Array.isArray(usersResponse.result)) {
          usersData = usersResponse.result;
        } else if (Array.isArray(usersResponse?.data)) {
          usersData = usersResponse.data;
        } else if (Array.isArray(usersResponse)) {
          usersData = usersResponse as any[];
        }

        const usersMap = new Map<string, any>();
        usersData.forEach((u: any) => usersMap.set(String(u._id || u.id), u));

        // 3) ربط اسم وبريد العميل بكل محفظة
        const walletsWithCustomers = walletsData.map((wallet: any) => {
          const cid = String(wallet.customerId || "");
          const customer = usersMap.get(cid);
          const customerName =
            [customer?.firstName, customer?.lastName]
              .filter(Boolean)
              .join(" ") ||
            customer?.email ||
            "غير معروف";
          const customerEmail = customer?.email || "غير متوفر";
          return { ...wallet, customerName, customerEmail };
        });

        // 4) جلب كل المعاملات من الباك مباشرة
        const txRes = await transactionsAPI.getAll();
        let txItems: any[] = [];
        if (Array.isArray((txRes as any)?.data)) txItems = (txRes as any).data;
        else if (Array.isArray(txRes)) txItems = txRes as any[];

        const transactionsWithCustomers: TransactionWithCustomer[] =
          txItems.map((t: any) => {
            const cid = String(t.customerId || t.Customer || t.customer || "");
            const customer = usersMap.get(cid);
            const name =
              [customer?.firstName, customer?.lastName]
                .filter(Boolean)
                .join(" ") ||
              customer?.email ||
              cid;
            const email = customer?.email || "غير متوفر";
            return {
              ...t,
              customerId: cid,
              customerName: name,
              customerEmail: email,
              walletId: String(t.walletId || ""),
              createdAt: t.createdAt || new Date().toISOString(),
              amount: Number(t.amount) || 0,
              type: t.type || "credit",
            };
          });

        setWallets(walletsWithCustomers);
        setAllTransactions(
          transactionsWithCustomers.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err: any) {
        console.error("خطأ في جلب المحافظ/المعاملات:", err);
        setError(err.message || "فشل تحميل المحافظ");
        setAllTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletsWithCustomers();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (detailsOpen) {
          setDetailsOpen(false);
          setSelectedTransfer(null);
          setActionNote("");
        }
        if (walletDetailsOpen) {
          setWalletDetailsOpen(false);
          setSelectedUserWallet(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen, walletDetailsOpen]);

  const filteredWallets = wallets.filter((wallet) => {
    const customerId = wallet.customerId || "";
    const customerName = wallet.customerName || "";
    const customerEmail = wallet.customerEmail || "";
    const walletBalance = wallet.balance || 0;
    const walletDate = wallet.createdAt || "";

    const matchesSearch =
      customerId.includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriceFrom =
      !filters.priceFrom || walletBalance >= Number(filters.priceFrom);
    const matchesPriceTo =
      !filters.priceTo || walletBalance <= Number(filters.priceTo);
    const matchesDateFrom = !filters.dateFrom || walletDate >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || walletDate <= filters.dateTo;
    return (
      matchesSearch &&
      matchesPriceFrom &&
      matchesPriceTo &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const filteredTransactions = allTransactions.filter((transaction) => {
    const customerName = transaction.customerName || "";
    const customerEmail = transaction.customerEmail || "";
    const type = transaction.type || "";
    const description = transaction.description || "";

    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser =
      !transactionsUserFilter ||
      String(transaction.customerId || "") === String(transactionsUserFilter);
    return matchesSearch && matchesUser;
  });

  const txCountByCustomer = useMemo(() => {
    const m = new Map<string, number>();
    allTransactions.forEach((t: any) => {
      const cid = String(t.customerId || "");
      if (!cid) return;
      m.set(cid, (m.get(cid) || 0) + 1);
    });
    return m;
  }, [allTransactions]);

  const totalBalance = filteredWallets.reduce(
    (sum, wallet) => sum + (wallet.balance || 0),
    0
  );
  const totalTransactions = filteredWallets.reduce(
    (sum, wallet) =>
      sum + (txCountByCustomer.get(String(wallet.customerId)) || 0),
    0
  );

  const printColumns = [
    { key: "customerName", label: "اسم العميل" },
    { key: "customerEmail", label: "بريد العميل" },
    { key: "balance", label: "الرصيد" },
    { key: "transactionsCount", label: "عدد المعاملات" },
    { key: "createdAt", label: "تاريخ الإنشاء" },
  ];

  const handleApproveTransfer = async (requestId: string, note?: string) => {
    try {
      setTransferActionLoading(requestId);
      await adminWalletsAPI.approveBankTransfer(requestId, {
        approved: true,
        notes: note || "",
      });
      setBankTransferRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status: "completed" as const, notes: note || req.notes }
            : req
        )
      );
      if (selectedTransfer && selectedTransfer._id === requestId) {
        setSelectedTransfer({
          ...selectedTransfer,
          status: "completed",
          notes: note || selectedTransfer.notes,
        });
      }
      alert("تمت الموافقة على التحويل وإضافة الرصيد");
      fetchBankTransfers();
      fetchPendingPreview();
    } catch (e: any) {
      alert(e?.message || "فشل الموافقة على التحويل");
    } finally {
      setTransferActionLoading(null);
    }
  };

  const handleRejectTransfer = async (requestId: string, note?: string) => {
    try {
      setTransferActionLoading(requestId);
      await adminWalletsAPI.approveBankTransfer(requestId, {
        approved: false,
        notes: note || "",
      });
      setBankTransferRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status: "rejected" as const, notes: note || req.notes }
            : req
        )
      );
      if (selectedTransfer && selectedTransfer._id === requestId) {
        setSelectedTransfer({
          ...selectedTransfer,
          status: "rejected",
          notes: note || selectedTransfer.notes,
        });
      }
      alert("تم رفض التحويل");
      fetchBankTransfers();
      fetchPendingPreview();
    } catch (e: any) {
      alert(e?.message || "فشل رفض التحويل");
    } finally {
      setTransferActionLoading(null);
    }
  };

  const pendingTransfers = pendingPreview.length
    ? pendingPreview
    : bankTransferRequests.filter((req) => req.status === "pending");
  const totalPendingAmount = pendingTransfers.reduce(
    (sum, req) => sum + req.amount,
    0
  );
  const totalTransfersPages =
    Math.ceil(transfersPagination.total / transferPerPage) || 1;
  const transfersStartIndex = (transfersPagination.page - 1) * transferPerPage;
  const transfersEndIndex = transfersStartIndex + bankTransferRequests.length;

  const totalWalletsPages = Math.ceil(filteredWallets.length / itemsPerPage);
  const walletsStartIndex = (currentPage - 1) * itemsPerPage;
  const walletsEndIndex = walletsStartIndex + itemsPerPage;
  const paginatedWallets = filteredWallets.slice(
    walletsStartIndex,
    walletsEndIndex
  );

  const totalTransactionsPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );
  const transactionsStartIndex =
    (currentTransactionsPage - 1) * transactionsPerPage;
  const transactionsEndIndex = transactionsStartIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    transactionsStartIndex,
    transactionsEndIndex
  );

  const openUserWalletDetails = async (customerId: string) => {
    try {
      setWalletDetailsOpen(true);
      setWalletDetailsLoading(true);
      setWalletDetailsError(null);
      const res = await adminWalletsAPI.getUserWallet(customerId);
      const payload =
        (res as any)?.data?.data || (res as any)?.data || (res as any);
      setSelectedUserWallet(payload);
    } catch (e: any) {
      setWalletDetailsError(e?.message || "فشل تحميل تفاصيل المحفظة");
    } finally {
      setWalletDetailsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    إدارة المحافظ
                  </h1>
                  <p className="text-gray-500">
                    متابعة وإدارة محافظ المستخدمين
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTransactions(!showTransactions)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    showTransactions
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <History className="w-5 h-5" />
                  {showTransactions
                    ? "عرض المحافظ"
                    : `عرض المعاملات (${allTransactions.length})`}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  إضافة معاملة
                </motion.button>
              </div>
            </div>
          </div>

          {/* Wallets Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
              whileHover={{ y: -4 }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">
                    إجمالي الرصيد
                  </p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {totalBalance.toLocaleString("en-US")} ر.س
                  </h2>
                  <p className="text-gray-400 text-sm">
                    عدد المحافظ: {filteredWallets.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
              whileHover={{ y: -4 }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <History className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">
                    إجمالي المعاملات
                  </p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {totalTransactions.toLocaleString("en-US")}
                  </h2>
                  <p className="text-gray-400 text-sm">جميع المحافظ النشطة</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
              whileHover={{ y: -4 }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 text-sm font-medium">
                    متوسط الرصيد
                  </p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {filteredWallets.length > 0
                      ? (totalBalance / filteredWallets.length).toLocaleString(
                          "en-US",
                          {
                            maximumFractionDigits: 2,
                          }
                        )
                      : 0}{" "}
                    ر.س
                  </h2>
                  <p className="text-gray-400 text-sm">لكل محفظة</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 relative z-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <AdvancedFilterPanel
                  onFilterChange={setFilters}
                  filterOptions={{
                    priceRange: true,
                    dateRange: true,
                  }}
                />
                <EnhancedPrintButton
                  data={filteredWallets.map((w) => ({
                    customerName: w.customerName,
                    customerEmail: w.customerEmail,
                    balance: w.balance,
                    transactionsCount: w.transactions?.length || 0,
                    createdAt: new Date(w.createdAt).toLocaleDateString(
                      "ar-SA"
                    ),
                  }))}
                  title="قائمة المحافظ"
                  subtitle={`إجمالي ${
                    filteredWallets.length
                  } محفظة - الرصيد الكلي: ${totalBalance.toLocaleString()} ر.س`}
                  columns={printColumns}
                  showStats={true}
                />
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    showTransactions
                      ? "البحث في المعاملات..."
                      : "البحث بالاسم أو البريد الإلكتروني..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-500" />
                    إدارة طلبات التحويل البنكي
                  </h2>
                  <p className="text-gray-500 text-sm">
                    تحكم كامل بطلبات العملاء مع التصفية حسب الحالة
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={transferStatusFilter}
                    onChange={(e) => {
                      setTransferStatusFilter(
                        e.target.value as typeof transferStatusFilter
                      );
                      setTransferPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {transferStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={transferPerPage}
                    onChange={(e) => {
                      setTransferPerPage(Number(e.target.value));
                      setTransferPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size} صفوف
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchBankTransfers}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                    disabled={bankTransfersLoading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        bankTransfersLoading ? "animate-spin" : ""
                      }`}
                    />
                    تحديث
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(
                  [
                    {
                      label: "معلقة",
                      value: transferStats.pending,
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                    },
                    {
                      label: "مكتملة",
                      value: transferStats.completed,
                      color: "text-green-600",
                      bg: "bg-green-50",
                    },
                    {
                      label: "معتمدة",
                      value: transferStats.approved,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                    },
                    {
                      label: "مرفوضة",
                      value: transferStats.rejected,
                      color: "text-red-600",
                      bg: "bg-red-50",
                    },
                    {
                      label: "فاشلة",
                      value: transferStats.failed,
                      color: "text-gray-600",
                      bg: "bg-gray-100",
                    },
                  ] as const
                ).map((stat) => (
                  <div
                    key={stat.label}
                    className={`p-4 rounded-2xl border ${stat.bg}`}
                  >
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto border rounded-2xl">
                {bankTransfersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  </div>
                ) : bankTransfersError ? (
                  <div className="p-6 text-center text-red-600">
                    {bankTransfersError}
                  </div>
                ) : bankTransferRequests.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    لا توجد طلبات مطابقة للتصفية الحالية
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-50 text-right text-sm text-gray-600">
                        <tr>
                          <th className="px-4 py-3">العميل</th>
                          <th className="px-4 py-3">المبلغ</th>
                          <th className="px-4 py-3">الحالة</th>
                          <th className="px-4 py-3">تاريخ الطلب</th>
                          <th className="px-4 py-3">الملاحظات</th>
                          <th className="px-4 py-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bankTransferRequests.map((request) => (
                          <tr key={request._id} className="hover:bg-gray-50/80">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {request.customerName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {request.customerEmail}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-900">
                                {request.amount.toLocaleString()} ر.س
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                  request.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : request.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : request.status === "approved"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString(
                                "ar-SA",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {request.notes?.slice(0, 60) || "لا توجد ملاحظات"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    const note =
                                      prompt("أدخل ملاحظة (اختياري):") || "";
                                    handleApproveTransfer(request._id, note);
                                  }}
                                  disabled={
                                    transferActionLoading === request._id
                                  }
                                  className="px-3 py-1 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                                >
                                  موافقة
                                </button>
                                <button
                                  onClick={() => {
                                    const note =
                                      prompt("سبب الرفض (اختياري):") || "";
                                    handleRejectTransfer(request._id, note);
                                  }}
                                  disabled={
                                    transferActionLoading === request._id
                                  }
                                  className="px-3 py-1 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                >
                                  رفض
                                </button>
                                {request.bankReceipt && (
                                  <a
                                    href={request.bankReceipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  >
                                    عرض الإيصال
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="border-t px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
                      <div>
                        عرض{" "}
                        <span className="font-semibold text-gray-900">
                          {transfersStartIndex + 1} -{" "}
                          {Math.min(
                            transfersEndIndex,
                            transfersPagination.total
                          )}
                        </span>{" "}
                        من{" "}
                        <span className="font-semibold text-gray-900">
                          {transfersPagination.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTransferPage(1)}
                          disabled={transferPage === 1}
                          className="px-3 py-1 border rounded-lg disabled:opacity-50"
                        >
                          الأول
                        </button>
                        <button
                          onClick={() =>
                            setTransferPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={transferPage === 1}
                          className="p-2 border rounded-lg disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-900">
                          {transferPage} / {totalTransfersPages}
                        </span>
                        <button
                          onClick={() =>
                            setTransferPage((prev) =>
                              Math.min(prev + 1, totalTransfersPages)
                            )
                          }
                          disabled={transferPage === totalTransfersPages}
                          className="p-2 border rounded-lg disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTransferPage(totalTransfersPages)}
                          disabled={transferPage === totalTransfersPages}
                          className="px-3 py-1 border rounded-lg disabled:opacity-50"
                        >
                          الأخير
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {pendingTransfers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Building2 className="w-6 h-6" />
                      طلبات التحويل البنكي المعلقة
                    </h2>
                    <p className="text-purple-100 mt-2">
                      {pendingTransfers.length} طلب معلق بإجمالي{" "}
                      {totalPendingAmount.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-bold">
                      {pendingTransfers.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        معلومات العميل
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        المبلغ
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        معلومات البنك
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        اسم صاحب الحساب
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        تاريخ الطلب
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        الملاحظات
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingTransfers.map((request) => (
                      <motion.tr
                        key={request._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-purple-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {request.customerName}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {request.customerEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                            <span className="text-xl font-bold text-purple-600">
                              {request.amount.toLocaleString()} ر.س
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {request.bankName}
                              </p>
                              <p className="text-sm text-gray-500 font-mono">
                                {request.accountNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 font-medium">
                            {request.accountHolder}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString(
                                "ar-SA",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {request.notes || "لا توجد ملاحظات"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const note =
                                  prompt("أدخل ملاحظة (اختياري):") || "";
                                handleApproveTransfer(request._id, note);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              موافقة
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const note =
                                  prompt("سبب الرفض (اختياري):") || "";
                                handleRejectTransfer(request._id, note);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              <XCircle className="w-4 h-4" />
                              رفض
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedTransfer(request);
                                setDetailsOpen(true);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              تفاصيل
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Wallets Table - عرض اسم وبريد العميل */}
          {showTransactions ? (
            <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <History className="w-6 h-6" />
                  جميع المعاملات ({filteredTransactions.length})
                </h2>
                <p className="text-blue-100 mt-2">
                  عرض تفصيلي لجميع المعاملات من كافة المحافظ
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد معاملات
                </div>
              ) : (
                <>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        عرض{" "}
                        <span className="font-semibold text-gray-900">
                          {transactionsStartIndex + 1}
                        </span>{" "}
                        إلى{" "}
                        <span className="font-semibold text-gray-900">
                          {Math.min(
                            transactionsEndIndex,
                            filteredTransactions.length
                          )}
                        </span>{" "}
                        من{" "}
                        <span className="font-semibold text-gray-900">
                          {filteredTransactions.length}
                        </span>{" "}
                        معاملة
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">
                          عدد الصفوف:
                        </label>
                        <select
                          value={transactionsPerPage}
                          onChange={(e) => {
                            setTransactionsPerPage(Number(e.target.value));
                            setCurrentTransactionsPage(1);
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentTransactionsPage(1)}
                          disabled={currentTransactionsPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأول
                        </button>
                        <button
                          onClick={() =>
                            setCurrentTransactionsPage(
                              currentTransactionsPage - 1
                            )
                          }
                          disabled={currentTransactionsPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalTransactionsPages },
                            (_, i) => i + 1
                          )
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalTransactionsPages ||
                                (page >= currentTransactionsPage - 1 &&
                                  page <= currentTransactionsPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              const showEllipsis =
                                index > 0 && page - array[index - 1] > 1;
                              return (
                                <div
                                  key={page}
                                  className="flex items-center gap-1"
                                >
                                  {showEllipsis && (
                                    <span className="px-2 text-gray-500">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    onClick={() =>
                                      setCurrentTransactionsPage(page)
                                    }
                                    className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      currentTransactionsPage === page
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentTransactionsPage(
                              currentTransactionsPage + 1
                            )
                          }
                          disabled={
                            currentTransactionsPage === totalTransactionsPages
                          }
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentTransactionsPage(totalTransactionsPages)
                          }
                          disabled={
                            currentTransactionsPage === totalTransactionsPages
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأخير
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            اسم العميل
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            بريد العميل
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            نوع المعاملة
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            المبلغ
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            الوصف
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            الرصيد بعد المعاملة
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            التاريخ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedTransactions.map((transaction) => {
                          const transactionId =
                            transaction._id ||
                            transaction.id ||
                            Math.random().toString();
                          const isDeposit =
                            transaction.type?.toLowerCase() === "deposit" ||
                            transaction.type?.toLowerCase() === "credit" ||
                            transaction.type?.toLowerCase() === "add" ||
                            transaction.type === "إيداع" ||
                            transaction.amount > 0;

                          const transactionDate = transaction.createdAt
                            ? new Date(
                                transaction.createdAt
                              ).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "غير محدد";

                          return (
                            <motion.tr
                              key={transactionId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {transaction.customerName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm">
                                    {transaction.customerEmail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                    isDeposit
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {isDeposit ? (
                                    <>
                                      <ArrowUpCircle className="w-4 h-4" />
                                      إيداع
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDownCircle className="w-4 h-4" />
                                      خصم
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-lg font-bold ${
                                    isDeposit
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {isDeposit ? "+" : "-"}
                                  {Math.abs(
                                    transaction.amount || 0
                                  ).toLocaleString()}{" "}
                                  ر.س
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-600 text-sm">
                                  {transaction.description || "لا يوجد وصف"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-900 font-semibold">
                                  {transaction.balance !== undefined
                                    ? `${transaction.balance.toLocaleString()} ر.س`
                                    : "-"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    {transactionDate}
                                  </span>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            // عرض المحافظ
            <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : filteredWallets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد محافظ
                </div>
              ) : (
                <>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        عرض{" "}
                        <span className="font-semibold text-gray-900">
                          {walletsStartIndex + 1}
                        </span>{" "}
                        إلى{" "}
                        <span className="font-semibold text-gray-900">
                          {Math.min(walletsEndIndex, filteredWallets.length)}
                        </span>{" "}
                        من{" "}
                        <span className="font-semibold text-gray-900">
                          {filteredWallets.length}
                        </span>{" "}
                        محفظة
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">
                          عدد الصفوف:
                        </label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأول
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalWalletsPages },
                            (_, i) => i + 1
                          )
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalWalletsPages ||
                                (page >= currentPage - 1 &&
                                  page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              const showEllipsis =
                                index > 0 && page - array[index - 1] > 1;
                              return (
                                <div
                                  key={page}
                                  className="flex items-center gap-1"
                                >
                                  {showEllipsis && (
                                    <span className="px-2 text-gray-500">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      currentPage === page
                                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalWalletsPages}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalWalletsPages)}
                          disabled={currentPage === totalWalletsPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأخير
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            اسم العميل
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            بريد العميل
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            الرصيد
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            عدد المعاملات
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            تاريخ الإنشاء
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            آخر تحديث
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedWallets.map((wallet) => {
                          const walletId =
                            wallet._id || wallet.id || "غير محدد";
                          const customerName =
                            wallet.customerName || "غير معروف";
                          const customerEmail =
                            wallet.customerEmail || "غير متوفر";
                          const walletBalance = wallet.balance || 0;
                          const transactionsCount =
                            txCountByCustomer.get(String(wallet.customerId)) ||
                            0;
                          const createdAt = wallet.createdAt
                            ? new Date(wallet.createdAt).toLocaleDateString(
                                "ar-SA",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "غير محدد";
                          const updatedAt = wallet.updatedAt
                            ? new Date(wallet.updatedAt).toLocaleDateString(
                                "ar-SA",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "غير محدد";

                          return (
                            <motion.tr
                              key={walletId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-amber-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {customerName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm">
                                    {customerEmail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-lg font-bold text-gray-900">
                                  {walletBalance.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  ر.س
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <History className="w-4 h-4 text-blue-500" />
                                  <span className="text-blue-600 font-semibold">
                                    {transactionsCount}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">{createdAt}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">{updatedAt}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      openUserWalletDetails(
                                        String(wallet.customerId)
                                      )
                                    }
                                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-sm"
                                  >
                                    عرض التفاصيل
                                  </motion.button>
                                  {transactionsCount > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setTransactionsUserFilter(
                                          String(wallet.customerId)
                                        );
                                        setShowTransactions(true);
                                        setCurrentTransactionsPage(1);
                                      }}
                                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                                    >
                                      المعاملات ({transactionsCount})
                                    </motion.button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
        {detailsOpen && selectedTransfer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal
          >
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      تفاصيل التحويل البنكي
                    </h3>
                    <p className="text-purple-100 text-sm">
                      طلب رقم: {selectedTransfer._id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetailsOpen(false);
                    setSelectedTransfer(null);
                    setActionNote("");
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">العميل</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedTransfer.customerName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {selectedTransfer.customerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900">
                          {selectedTransfer.amount.toLocaleString()} ر.س
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(selectedTransfer.createdAt).toLocaleString(
                            "ar-SA"
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">الحالة:</span>{" "}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedTransfer.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : selectedTransfer.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {selectedTransfer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      ملاحظات الإجراء
                    </h4>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="اكتب ملاحظة للموافقة/الرفض (اختياري)"
                      className="w-full border rounded-lg p-2 h-24 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={
                          transferActionLoading === selectedTransfer._id
                        }
                        onClick={() =>
                          handleApproveTransfer(
                            selectedTransfer._id,
                            actionNote
                          )
                        }
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        موافقة
                      </button>
                      <button
                        disabled={
                          transferActionLoading === selectedTransfer._id
                        }
                        onClick={() =>
                          handleRejectTransfer(selectedTransfer._id, actionNote)
                        }
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      معلومات الحساب البنكي
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">البنك</p>
                        <p className="font-medium text-gray-900">
                          {selectedTransfer.bankName || "غير متوفر"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">رقم الحساب</p>
                        <p className="font-mono font-medium text-gray-900">
                          {selectedTransfer.accountNumber || "غير متوفر"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">اسم صاحب الحساب</p>
                        <p className="font-medium text-gray-900">
                          {selectedTransfer.accountHolder || "غير متوفر"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      إيصال التحويل
                    </h4>
                    {selectedTransfer.bankReceipt ? (
                      <div className="rounded-xl overflow-hidden border">
                        <img
                          src={selectedTransfer.bankReceipt}
                          alt="Bank Receipt"
                          className="w-full max-h-[520px] object-contain bg-gray-50"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        لا يوجد إيصال مرفق
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {walletDetailsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
            role="dialog"
            aria-modal
          >
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      تفاصيل محفظة المستخدم
                    </h3>
                    <p className="text-amber-100 text-sm">
                      عرض معلومات العميل وآخر المعاملات
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWalletDetailsOpen(false);
                    setSelectedUserWallet(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">العميل</h4>
                    {walletDetailsLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                      </div>
                    ) : walletDetailsError ? (
                      <div className="text-red-600 text-sm">
                        {walletDetailsError}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedUserWallet?.user?.name || "-"}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {selectedUserWallet?.user?.email || "غير متوفر"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-gray-900">
                              {Number(
                                selectedUserWallet?.wallet?.balance || 0
                              ).toLocaleString()}{" "}
                              ر.س
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>
                              الحالة:{" "}
                              {selectedUserWallet?.user?.active
                                ? "نشط"
                                : "غير نشط"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (selectedUserWallet?.user?.id) {
                                  setTransactionsUserFilter(
                                    String(selectedUserWallet.user.id)
                                  );
                                  setShowTransactions(true);
                                  setCurrentTransactionsPage(1);
                                  setWalletDetailsOpen(false);
                                }
                              }}
                              className="px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              عرض معاملات هذا المستخدم
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border rounded-xl p-4 h-full flex flex-col">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      آخر المعاملات
                    </h4>
                    {walletDetailsLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                      </div>
                    ) : walletDetailsError ? (
                      <div className="text-red-600 text-sm">
                        {walletDetailsError}
                      </div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full min-w-max">
                          <thead className="bg-gray-50 text-right text-sm text-gray-600">
                            <tr>
                              <th className="px-4 py-3">النوع</th>
                              <th className="px-4 py-3">المبلغ</th>
                              <th className="px-4 py-3">الوصف</th>
                              <th className="px-4 py-3">التاريخ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(selectedUserWallet?.transactions || []).map(
                              (t: any) => {
                                const isDeposit =
                                  String(t.type || "").toLowerCase() ===
                                    "credit" || Number(t.amount) > 0;
                                return (
                                  <tr
                                    key={String(t._id)}
                                    className="hover:bg-gray-50/80"
                                  >
                                    <td className="px-4 py-3">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          isDeposit
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        {isDeposit ? "إيداع" : "خصم"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`font-bold ${
                                          isDeposit
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }`}
                                      >
                                        {Number(t.amount || 0).toLocaleString()}{" "}
                                        ر.س
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {t.description || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {new Date(t.createdAt).toLocaleString(
                                        "ar-SA"
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                        {(!selectedUserWallet?.transactions ||
                          selectedUserWallet.transactions.length === 0) && (
                          <div className="p-6 text-center text-gray-500">
                            لا توجد معاملات
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
