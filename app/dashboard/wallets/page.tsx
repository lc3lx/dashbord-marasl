"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
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
} from "lucide-react"
import { motion } from "framer-motion"
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel"
import EnhancedPrintButton from "@/components/print/EnhancedPrintButton11"
import { adminWalletsAPI, usersAPI, transactionsAPI } from "@/lib/api"

interface Transaction {
  _id?: string
  id?: string
  type: string
  amount: number
  description?: string
  createdAt: string
  balance?: number
}

interface WalletWithCustomer {
  _id?: string
  id?: string
  customerId: string
  balance: number
  transactions: Transaction[]
  createdAt: string
  updatedAt: string
  customerName?: string
  customerEmail?: string
}

interface TransactionWithCustomer extends Transaction {
  customerName: string
  customerEmail: string
  walletId: string
}

interface BankTransferRequest {
  _id: string
  customerId: string
  customerName: string
  customerEmail: string
  amount: number
  bankName: string
  accountNumber: string
  accountHolder: string
  status: "pending" | "approved" | "rejected"
  requestDate: string
  notes?: string
}

export default function WalletsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [wallets, setWallets] = useState<WalletWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allTransactions, setAllTransactions] = useState<TransactionWithCustomer[]>([])
  const [showTransactions, setShowTransactions] = useState(false)
  const [bankTransferRequests, setBankTransferRequests] = useState<BankTransferRequest[]>([
    {
      _id: "1",
      customerId: "user1",
      customerName: "محمد أحمد",
      customerEmail: "mohammed@example.com",
      amount: 5000,
      bankName: "البنك الأهلي السعودي",
      accountNumber: "1234567890",
      accountHolder: "محمد أحمد علي",
      status: "pending",
      requestDate: new Date().toISOString(),
      notes: "طلب تحويل للرصيد",
    },
    {
      _id: "2",
      customerId: "user2",
      customerName: "فاطمة خالد",
      customerEmail: "fatima@example.com",
      amount: 3500,
      bankName: "بنك الراجحي",
      accountNumber: "9876543210",
      accountHolder: "فاطمة خالد محمد",
      status: "pending",
      requestDate: new Date(Date.now() - 86400000).toISOString(),
      notes: "سحب من المحفظة",
    },
    {
      _id: "3",
      customerId: "user3",
      customerName: "عبدالله سالم",
      customerEmail: "abdullah@example.com",
      amount: 7500,
      bankName: "بنك الرياض",
      accountNumber: "5555666677",
      accountHolder: "عبدالله سالم أحمد",
      status: "pending",
      requestDate: new Date(Date.now() - 172800000).toISOString(),
      notes: "تحويل عاجل",
    },
  ])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentTransactionsPage, setCurrentTransactionsPage] = useState(1)
  const [transactionsPerPage, setTransactionsPerPage] = useState(10)


  useEffect(() => {
    const fetchWalletsWithCustomers = async () => {
      try {
        setLoading(true)
        setError(null)

        const walletsResponse = await walletsAPI.getAll()

        let walletsData = []
        if (walletsResponse?.result && Array.isArray(walletsResponse.result)) {
          walletsData = walletsResponse.result
        } else if (walletsResponse?.success && walletsResponse?.data) {
          walletsData = Array.isArray(walletsResponse.data) ? walletsResponse.data : []
        } else if (Array.isArray(walletsResponse?.data)) {
          walletsData = walletsResponse.data
        } else if (Array.isArray(walletsResponse)) {
          walletsData = walletsResponse
        }

        const usersResponse = await usersAPI.getAll()

        let usersData = []
        if (usersResponse?.result && Array.isArray(usersResponse.result)) {
          usersData = usersResponse.result
        } else if (Array.isArray(usersResponse?.data)) {
          usersData = usersResponse.data
        } else if (Array.isArray(usersResponse)) {
          usersData = usersResponse
        }

        const transactionsWithCustomers: TransactionWithCustomer[] = []

        const walletsWithCustomers = walletsData.map((wallet: any) => {
          const customerId = wallet.customerId

          const customer = usersData.find((user: any) => {
            const userId = user._id || user.id
            return userId === customerId
          })

          const customerName = customer?.name || customer?.username || customer?.fullName || "غير معروف"
          const customerEmail = customer?.email || "غير متوفر"

          if (wallet.transactions && Array.isArray(wallet.transactions)) {
            wallet.transactions.forEach((transaction: Transaction) => {
              transactionsWithCustomers.push({
                ...transaction,
                customerName,
                customerEmail,
                walletId: wallet._id || wallet.id,
              })
            })
          }

          return {
            ...wallet,
            customerName,
            customerEmail,
          }
        })

        setWallets(walletsWithCustomers)
        setAllTransactions(
          transactionsWithCustomers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        )
      } catch (err: any) {
        console.error("خطأ في جلب المحافظ:", err)
        setError(err.message || "فشل تحميل المحافظ")
      } finally {
        setLoading(false)
      }
    }

    fetchWalletsWithCustomers()
  }, [])

  const filteredWallets = wallets.filter((wallet) => {
    const customerId = wallet.customerId || ""
    const customerName = wallet.customerName || ""
    const customerEmail = wallet.customerEmail || ""
    const walletBalance = wallet.balance || 0
    const walletDate = wallet.createdAt || wallet.date || ""

    const matchesSearch =
      customerId.includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriceFrom = !filters.priceFrom || walletBalance >= Number(filters.priceFrom)
    const matchesPriceTo = !filters.priceTo || walletBalance <= Number(filters.priceTo)
    const matchesDateFrom = !filters.dateFrom || walletDate >= filters.dateFrom
    const matchesDateTo = !filters.dateTo || walletDate <= filters.dateTo
    return matchesSearch && matchesPriceFrom && matchesPriceTo && matchesDateFrom && matchesDateTo
  })

  const filteredTransactions = allTransactions.filter((transaction) => {
    const customerName = transaction.customerName || ""
    const customerEmail = transaction.customerEmail || ""
    const type = transaction.type || ""
    const description = transaction.description || ""

    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const totalBalance = filteredWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0)
  const totalTransactions = filteredWallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0)

  const printColumns = [
    { key: "customerName", label: "اسم العميل" },
    { key: "customerEmail", label: "بريد العميل" },
    { key: "balance", label: "الرصيد" },
    { key: "transactionsCount", label: "عدد المعاملات" },
    { key: "createdAt", label: "تاريخ الإنشاء" },
  ]

  const handleApproveTransfer = (requestId: string) => {
    setBankTransferRequests((prev) =>
      prev.map((req) => (req._id === requestId ? { ...req, status: "approved" as const } : req)),
    )
  }

  const handleRejectTransfer = (requestId: string) => {
    setBankTransferRequests((prev) =>
      prev.map((req) => (req._id === requestId ? { ...req, status: "rejected" as const } : req)),
    )
  }

  const pendingTransfers = bankTransferRequests.filter((req) => req.status === "pending")
  const totalPendingAmount = pendingTransfers.reduce((sum, req) => sum + req.amount, 0)

  const totalWalletsPages = Math.ceil(filteredWallets.length / itemsPerPage)
  const walletsStartIndex = (currentPage - 1) * itemsPerPage
  const walletsEndIndex = walletsStartIndex + itemsPerPage
  const paginatedWallets = filteredWallets.slice(walletsStartIndex, walletsEndIndex)

  const totalTransactionsPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
  const transactionsStartIndex = (currentTransactionsPage - 1) * transactionsPerPage
  const transactionsEndIndex = transactionsStartIndex + transactionsPerPage
  const paginatedTransactions = filteredTransactions.slice(transactionsStartIndex, transactionsEndIndex)

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة المحافظ</h1>
                  <p className="text-gray-500">متابعة وإدارة محافظ المستخدمين</p>
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
                  {showTransactions ? "عرض المحافظ" : `عرض المعاملات (${allTransactions.length})`}
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
                  <p className="text-gray-500 text-sm font-medium">إجمالي الرصيد</p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {totalBalance.toLocaleString('en-US')} ر.س
                  </h2>
                  <p className="text-gray-400 text-sm">عدد المحافظ: {filteredWallets.length}</p>
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
                  <p className="text-gray-500 text-sm font-medium">إجمالي المعاملات</p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {totalTransactions.toLocaleString('en-US')}
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
                  <p className="text-gray-500 text-sm font-medium">متوسط الرصيد</p>
                  <h2 className="text-4xl font-bold text-gray-900 tabular-nums break-words max-w-full">
                    {filteredWallets.length > 0
                      ? (totalBalance / filteredWallets.length).toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })
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
                    createdAt: new Date(w.createdAt).toLocaleDateString("ar-SA"),
                  }))}
                  title="قائمة المحافظ"
                  subtitle={`إجمالي ${filteredWallets.length} محفظة - الرصيد الكلي: ${totalBalance.toLocaleString()} ر.س`}
                  columns={printColumns}
                  showStats={true}
                />
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={showTransactions ? "البحث في المعاملات..." : "البحث بالاسم أو البريد الإلكتروني..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </motion.div>
          </div>

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
                      {pendingTransfers.length} طلب معلق بإجمالي {totalPendingAmount.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-bold">{pendingTransfers.length}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">معلومات العميل</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">المبلغ</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">معلومات البنك</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">اسم صاحب الحساب</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">تاريخ الطلب</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">الملاحظات</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-purple-900">الإجراءات</th>
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
                              <p className="font-medium text-gray-900">{request.customerName}</p>
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
                              <p className="font-medium text-gray-900">{request.bankName}</p>
                              <p className="text-sm text-gray-500 font-mono">{request.accountNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 font-medium">{request.accountHolder}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(request.requestDate).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{request.notes || "لا توجد ملاحظات"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleApproveTransfer(request._id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              موافقة
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRejectTransfer(request._id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              <XCircle className="w-4 h-4" />
                              رفض
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
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
                <p className="text-blue-100 mt-2">عرض تفصيلي لجميع المعاملات من كافة المحافظ</p>
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
                <div className="p-8 text-center text-gray-500">لا توجد معاملات</div>
              ) : (
                <>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        عرض <span className="font-semibold text-gray-900">{transactionsStartIndex + 1}</span> إلى{" "}
                        <span className="font-semibold text-gray-900">{Math.min(transactionsEndIndex, filteredTransactions.length)}</span> من{" "}
                        <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> معاملة
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">عدد الصفوف:</label>
                        <select
                          value={transactionsPerPage}
                          onChange={(e) => {
                            setTransactionsPerPage(Number(e.target.value))
                            setCurrentTransactionsPage(1)
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
                          onClick={() => setCurrentTransactionsPage(currentTransactionsPage - 1)}
                          disabled={currentTransactionsPage === 1}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalTransactionsPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalTransactionsPages ||
                                (page >= currentTransactionsPage - 1 && page <= currentTransactionsPage + 1)
                              )
                            })
                            .map((page, index, array) => {
                              const showEllipsis = index > 0 && page - array[index - 1] > 1
                              return (
                                <div key={page} className="flex items-center gap-1">
                                  {showEllipsis && (
                                    <span className="px-2 text-gray-500">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentTransactionsPage(page)}
                                    className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      currentTransactionsPage === page
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              )
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentTransactionsPage(currentTransactionsPage + 1)}
                          disabled={currentTransactionsPage === totalTransactionsPages}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentTransactionsPage(totalTransactionsPages)}
                          disabled={currentTransactionsPage === totalTransactionsPages}
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
                          <th className="px-6 py-4 text-right text-sm font-semibold">اسم العميل</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">بريد العميل</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">نوع المعاملة</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">المبلغ</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">الوصف</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">الرصيد بعد المعاملة</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedTransactions.map((transaction) => {
                          const transactionId = transaction._id || transaction.id || Math.random().toString()
                          const isDeposit =
                            transaction.type?.toLowerCase() === "deposit" ||
                            transaction.type?.toLowerCase() === "credit" ||
                            transaction.type?.toLowerCase() === "add" ||
                            transaction.type === "إيداع" ||
                            transaction.amount > 0

                          const transactionDate = transaction.createdAt
                            ? new Date(transaction.createdAt).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "غير محدد"

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
                                  <span className="font-medium text-gray-900">{transaction.customerName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm">{transaction.customerEmail}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                    isDeposit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                                <span className={`text-lg font-bold ${isDeposit ? "text-green-600" : "text-red-600"}`}>
                                  {isDeposit ? "+" : "-"}
                                  {Math.abs(transaction.amount || 0).toLocaleString()} ر.س
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-600 text-sm">{transaction.description || "لا يوجد وصف"}</span>
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
                                  <span className="text-sm">{transactionDate}</span>
                                </div>
                              </td>
                            </motion.tr>
                          )
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
                <div className="p-8 text-center text-gray-500">لا توجد محافظ</div>
              ) : (
                <>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        عرض <span className="font-semibold text-gray-900">{walletsStartIndex + 1}</span> إلى{" "}
                        <span className="font-semibold text-gray-900">{Math.min(walletsEndIndex, filteredWallets.length)}</span> من{" "}
                        <span className="font-semibold text-gray-900">{filteredWallets.length}</span> محفظة
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">عدد الصفوف:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
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
                          {Array.from({ length: totalWalletsPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalWalletsPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              )
                            })
                            .map((page, index, array) => {
                              const showEllipsis = index > 0 && page - array[index - 1] > 1
                              return (
                                <div key={page} className="flex items-center gap-1">
                                  {showEllipsis && (
                                    <span className="px-2 text-gray-500">...</span>
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
                              )
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
                          <th className="px-6 py-4 text-right text-sm font-semibold">اسم العميل</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">بريد العميل</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">الرصيد</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">عدد المعاملات</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">تاريخ الإنشاء</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">آخر تحديث</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedWallets.map((wallet) => {
                          const walletId = wallet._id || wallet.id || "غير محدد"
                          const customerName = wallet.customerName || "غير معروف"
                          const customerEmail = wallet.customerEmail || "غير متوفر"
                          const walletBalance = wallet.balance || 0
                          const transactionsCount = wallet.transactions?.length || 0
                          const createdAt = wallet.createdAt
                            ? new Date(wallet.createdAt).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "غير محدد"
                          const updatedAt = wallet.updatedAt
                            ? new Date(wallet.updatedAt).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "غير محدد"

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
                                  <span className="font-medium text-gray-900">{customerName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span className="text-sm">{customerEmail}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-lg font-bold text-gray-900">
                                  {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ر.س
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <History className="w-4 h-4 text-blue-500" />
                                  <span className="text-blue-600 font-semibold">{transactionsCount}</span>
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
                                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-sm"
                                  >
                                    عرض التفاصيل
                                  </motion.button>
                                  {transactionsCount > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                                    >
                                      المعاملات ({transactionsCount})
                                    </motion.button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
