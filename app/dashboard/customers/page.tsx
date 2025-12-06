"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { UserCheck, Plus, Search, Eye, Mail, Phone, Wallet, CheckCircle, XCircle, Loader2, AlertCircle, X, ShoppingBag, DollarSign, Calendar, Edit, Package, MapPin, FileText, User, Shield, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel"
import EnhancedPrintButton from "@/components/print/EnhancedPrintButton11"
import { usersAPI } from "@/lib/api"
import { ordersAPI } from "@/lib/api"

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    customerType: "individual",
    notes: "",
    isWalletCharged: false,
    birthDate: "",
    isAccountActive: true,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">("all")
  const [totalCustomers, setTotalCustomers] = useState(0)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const enrichCustomer = (customer: any) => {
    const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
    const walletRecharges = customer.walletRecharges ?? customer.wallet?.rechargeCount ?? 0
    const walletSpent = Number(
      customer.walletSpent ?? customer.wallet?.totalSpent ?? customer.totalSpent ?? customer.totalAmount ?? 0,
    )
    const totalOrders =
      customer.totalOrders ??
      customer.orders?.total ??
      customer.ordersCount ??
      customer.orders ??
      0
    const totalShipments = customer.totalShipments ?? customer.shipments?.total ?? 0

    return {
      id: customer._id || customer.id,
      name: customer.name || fullName || "غير محدد",
      email: customer.email || "غير محدد",
      phone: customer.phone || customer.phoneNumber || customer.mobile || "غير محدد",
      city: customer.city || customer.address?.city || "غير محدد",
      address:
        customer.address ||
        customer.addressLine ||
        customer.address?.street ||
        "غير محدد",
      postalCode: customer.postalCode || customer.address?.postalCode || "",
      customerType: customer.customerType || customer.role || "individual",
      notes: customer.notes || "",
      birthDate: customer.birthDate || "",
      isAccountActive: customer.isActive ?? customer.isAccountActive ?? true,
      walletRecharges,
      walletSpent,
      totalOrders,
      totalShipments,
      orders: totalOrders,
      totalSpent: walletSpent,
      shipmentsSent: customer.shipmentsSent ?? customer.shipments?.sent ?? totalShipments,
      shipmentsReceived: customer.shipmentsReceived ?? customer.shipments?.delivered ?? 0,
      shipmentsCancelled: customer.shipmentsCancelled ?? customer.shipments?.canceled ?? 0,
      shipmentsReturned: customer.shipmentsReturned ?? customer.shipments?.returns ?? 0,
      isWalletCharged:
        customer.isWalletCharged ??
        (walletSpent > 0 || (customer.balance ?? 0) > 0),
      balance: customer.balance ?? 0,
      lastTransaction:
        customer.lastTransaction ??
        customer.lastShipmentDate ??
        customer.updatedAt ??
        customer.createdAt ??
        null,
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersAPI.getAll({ limit: 1000 })

      let customersData = []
      if (response?.success && Array.isArray(response.data)) {
        customersData = response.data
      } else if (Array.isArray(response?.data)) {
        customersData = response.data
      } else if (Array.isArray(response)) {
        customersData = response
      }

      const formattedCustomers = customersData.map(enrichCustomer)

      setCustomers(formattedCustomers)
      setTotalCustomers(formattedCustomers.length)
    } catch (err: any) {
      console.error("[v0] خطأ في جلب بيانات العملاء:", err)
      setError(err.message || "فشل في جلب بيانات العملاء")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const response = await ordersAPI.getByCustomerId(customerId)
      // Assuming the response is an array of orders
      return response.data || response || []
    } catch (err: any) {
      console.error(`[v0] خطأ في جلب شحنات العميل ${customerId}:`, err)
      setError(err.message || "فشل في جلب بيانات الشحنات")
      return []
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.includes(searchTerm) || customer.email.includes(searchTerm) || customer.phone.includes(searchTerm)
    const matchesPriceFrom = !filters.priceFrom || customer.totalSpent >= Number(filters.priceFrom)
    const matchesPriceTo = !filters.priceTo || customer.totalSpent <= Number(filters.priceTo)
    const matchesOrdersFrom = !filters.ordersFrom || customer.orders >= Number(filters.ordersFrom)
    const matchesOrdersTo = !filters.ordersTo || customer.orders <= Number(filters.ordersTo)
    const matchesChargeStatus =
      !filters.chargeStatus ||
      filters.chargeStatus === "all" ||
      (filters.chargeStatus === "charged" && customer.isWalletCharged) ||
      (filters.chargeStatus === "notCharged" && !customer.isWalletCharged)
    const matchesAccountStatus =
      !filters.accountStatus ||
      filters.accountStatus === "all" ||
      (filters.accountStatus === "active" && customer.isAccountActive) ||
      (filters.accountStatus === "inactive" && !customer.isAccountActive)
    return (
      matchesSearch &&
      matchesPriceFrom &&
      matchesPriceTo &&
      matchesOrdersFrom &&
      matchesOrdersTo &&
      matchesChargeStatus &&
      matchesAccountStatus
    )
  })

  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === "all" ? filteredCustomers.length : startIndex + itemsPerPage
  const paginatedCustomers = itemsPerPage === "all" ? filteredCustomers : filteredCustomers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }


  const printColumns = [
    { key: "name", label: "الاسم" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "الهاتف" },
    { key: "orders", label: "عدد الطلبات" },
    { key: "totalSpent", label: "إجمالي الإنفاق" },
    { key: "isWalletCharged", label: "حالة المحفظة" },
    { key: "isAccountActive", label: "حالة الحساب" },
  ]

  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0)
  const chargedCount = filteredCustomers.filter((c) => c.isWalletCharged).length
  const notChargedCount = filteredCustomers.filter((c) => !c.isWalletCharged).length
  const activeCount = filteredCustomers.filter((c) => c.isAccountActive).length
  const inactiveCount = filteredCustomers.filter((c) => !c.isAccountActive).length

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer)
    setShowDetailsModal(true)
  }

  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    setTimeout(() => setSelectedCustomer(null), 300)
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditFormData({
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address || "",
        city: selectedCustomer.city || "",
        postalCode: selectedCustomer.postalCode || "",
        customerType: selectedCustomer.customerType || "individual",
        notes: selectedCustomer.notes || "",
        isWalletCharged: selectedCustomer.isWalletCharged,
        birthDate: selectedCustomer.birthDate || "",
        isAccountActive: selectedCustomer.isAccountActive !== false,
      })
      setShowEditModal(true)
    }
  }

  const handleSaveEdit = async () => {
    try {
      console.log("[v0] حفظ التعديلات:", editFormData)

      setCustomers(customers.map((c) => (c.id === selectedCustomer.id ? { ...c, ...editFormData } : c)))

      setSelectedCustomer({ ...selectedCustomer, ...editFormData })
      setShowEditModal(false)
    } catch (err) {
      console.error("[v0] خطأ في حفظ التعديلات:", err)
    }
  }

  const handleViewOrders = async () => {
    if (selectedCustomer) {
      const orders = await fetchCustomerOrders(selectedCustomer.id)
      setSelectedCustomer({ ...selectedCustomer, orders: orders }) // Assuming orders is an array of orders
      setShowOrdersModal(true)
    }
  }

  // سيتم استبدال البيانات الوهمية ببيانات حقيقية من API
  const customerOrders = selectedCustomer?.orders || []

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
                  <p className="text-gray-500">متابعة وإدارة بيانات العملاء</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة عميل
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">إجمالي العملاء</p>
                  <p className="text-xl font-bold text-gray-900">{filteredCustomers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">محفظة مشحونة</p>
                  <p className="text-xl font-bold text-green-600">{chargedCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">محافظ غير مشحونة</p>
                  <p className="text-xl font-bold text-red-600">{notChargedCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
                  <p className="text-xl font-bold text-blue-600">{totalRevenue.toLocaleString()} ر.س</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">العملاء النشطين</p>
                  <p className="text-xl font-bold text-green-600">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">العملاء غير النشطين</p>
                  <p className="text-xl font-bold text-red-600">{inactiveCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 relative z-0">
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
                    ordersRange: true,
                    chargeStatus: true,
                    accountStatus: true,
                  }}
                />
                <EnhancedPrintButton
                  data={filteredCustomers}
                  title="قائمة العملاء"
                  subtitle={`إجمالي ${filteredCustomers.length} عميل - الإيرادات: ${totalRevenue.toLocaleString()} ر.س`}
                  columns={printColumns}
                  showStats={true}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  عرض <span className="font-bold text-cyan-600">{filteredCustomers.length}</span> من أصل{" "}
                  <span className="font-bold">{customers.length}</span> عميل
                </p>
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث عن عميل بالاسم، البريد الإلكتروني أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل بيانات العملاء...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">حدث خطأ</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchCustomers}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </motion.button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عملاء</h3>
              <p className="text-gray-600">لم يتم العثور على أي عملاء مطابقين للبحث أو الفلاتر</p>
            </div>
          ) : (
            <>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      عرض <span className="font-semibold text-cyan-600">{startIndex + 1}</span> إلى{" "}
                      <span className="font-semibold text-cyan-600">{Math.min(endIndex, filteredCustomers.length)}</span>{" "}
                      من أصل <span className="font-semibold">{filteredCustomers.length}</span> عميل
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                      >
                        <option value={5}>5 / صفحة</option>
                        <option value={10}>10 / صفحة</option>
                        <option value={20}>20 / صفحة</option>
                        <option value={50}>50 / صفحة</option>
                        <option value={100}>100 / صفحة</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) =>
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                              ...
                            </span>
                          ) : (
                            <motion.button
                              key={page}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(page as number)}
                              className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                                  : "bg-white border border-gray-300 text-gray-700 hover:bg-cyan-50"
                              }`}
                            >
                              {page}
                            </motion.button>
                          ),
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الاسم</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">البريد الإلكتروني</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رقم الهاتف</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">المدينة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">العنوان</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">نوع العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">عدد الطلبات</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">إجمالي الإنفاق</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">حالة المحفظة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">حالة الحساب</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedCustomers.map((customer, index) => (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-cyan-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-500">#{customer.id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-cyan-500" />
                              <span className="text-gray-600">{customer.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-cyan-500" />
                              <span className="text-gray-600">{customer.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.city}</td>
                          <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{customer.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                              {customer.customerType === "individual" ? "فرد" : "شركة"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-cyan-500" />
                              <span className="font-semibold text-gray-900">{customer.orders}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-blue-500" />
                              <span className="font-semibold text-blue-600">{customer.totalSpent.toLocaleString()} ر.س</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.isWalletCharged ? (
                              <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-lg w-fit">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">مشحون</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-lg w-fit">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-xs font-medium text-red-700">غير مشحون</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.isAccountActive ? (
                              <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-lg w-fit">
                                <Shield className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">نشط</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-lg w-fit">
                                <Shield className="w-4 h-4 text-red-600" />
                                <span className="text-xs font-medium text-red-700">موقوف</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewDetails(customer)}
                              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">عرض</span>
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {showDetailsModal && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseDetails}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {selectedCustomer.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                        <p className="text-cyan-100">عميل #{selectedCustomer.id.slice(-6)}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseDetails}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-center">
                    {selectedCustomer.isWalletCharged ? (
                      <div className="flex items-center gap-2 bg-green-100 px-6 py-3 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-lg font-semibold text-green-700">المحفظة مشحونة</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-100 px-6 py-3 rounded-xl">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="text-lg font-semibold text-red-700">المحفظة غير مشحونة</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">معلومات الاتصال</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">رقم الهاتف</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm text-gray-600">عدد الطلبات</p>
                      </div>
                      <p className="text-3xl font-bold text-cyan-600">{selectedCustomer.orders}</p>
                      <p className="text-xs text-gray-500 mt-1">طلب إجمالي</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{selectedCustomer.totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">معلومات إضافية</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">تاريخ التسجيل</p>
                        <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString("ar-SA")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">رصيد المحفظة</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedCustomer.isWalletCharged ? "متوفر" : "غير متوفر"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">حالة الحساب</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedCustomer.isAccountActive ? "نشط" : "غير نشط"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditCustomer}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل البيانات
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleViewOrders}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      عرض الشحنات
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showEditModal && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-t-2xl sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Edit className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">تعديل بيانات العميل</h2>
                        <p className="text-cyan-100 text-sm">{selectedCustomer.name}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowEditModal(false)}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-cyan-600" />
                      <h3 className="font-bold text-gray-900">المعلومات الشخصية</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع العميل</label>
                        <select
                          value={editFormData.customerType}
                          onChange={(e) => setEditFormData({ ...editFormData, customerType: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        >
                          <option value="individual">فرد</option>
                          <option value="company">شركة</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">معلومات الاتصال</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          placeholder="example@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف *</label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          placeholder="05xxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">العنوان</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الكامل</label>
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                          placeholder="الشارع، الحي، رقم المبنى"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                          <input
                            type="text"
                            value={editFormData.city}
                            onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="الرياض، جدة، الدمام..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الرمز البريدي</label>
                          <input
                            type="text"
                            value={editFormData.postalCode}
                            onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-gray-900">ملاحظات إضافية</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الملاحظات</label>
                      <textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                        placeholder="أضف أي ملاحظات أو معلومات إضافية عن العميل..."
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-gray-900">إدارة الحساب</h3>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">حالة الحساب</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {editFormData.isAccountActive
                                  ? "الحساب نشط حالياً ويمكن للعميل تسجيل الدخول والقيام بالطلبات"
                                  : "الحساب موقوف ولا يمكن للعميل تسجيل الدخول أو القيام بأي عمليات"}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                setEditFormData({ ...editFormData, isAccountActive: !editFormData.isAccountActive })
                              }
                              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                                editFormData.isAccountActive ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              <motion.span
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ${
                                  editFormData.isAccountActive ? "translate-x-9" : "translate-x-1"
                                }`}
                              />
                            </motion.button>
                          </div>

                          <div
                            className={`mt-3 p-3 rounded-lg ${
                              editFormData.isAccountActive
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {editFormData.isAccountActive ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-700">الحساب نشط</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-700">الحساب موقوف</span>
                                </>
                              )}
                            </div>
                          </div>

                          {!editFormData.isAccountActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg"
                            >
                              <p className="text-xs text-red-800 font-medium">
                                ⚠️ تحذير: عند إيقاف الحساب، لن يتمكن العميل من:
                              </p>
                              <ul className="text-xs text-red-700 mt-2 space-y-1 mr-4">
                                <li>• تسجيل الدخول إلى حسابه</li>
                                <li>• إنشاء طلبات جديدة</li>
                                <li>• الوصول إلى بياناته الشخصية</li>
                                <li>• استخدام المحفظة الإلكترونية</li>
                              </ul>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveEdit}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      حفظ جميع التعديلات
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      إلغاء
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showOrdersModal && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setShowOrdersModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">شحنات العميل</h2>
                        <p className="text-cyan-100 text-sm">{selectedCustomer.name}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowOrdersModal(false)}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">لا توجد شحنات لهذا العميل</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">طلب #{order.id}</h3>
                                <p className="text-sm text-gray-500">{order.date}</p>
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                order.status === "مكتمل"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "قيد التوصيل"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.status}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{order.items} منتجات</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">{order.total} ر.س</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 mt-6">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">إجمالي الشحنات</span>
                          <span className="text-2xl font-bold text-cyan-600">{customerOrders.length}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-700 font-medium">إجمالي المبلغ</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {customerOrders.reduce((sum, order) => sum + order.total, 0)} ر.س
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
