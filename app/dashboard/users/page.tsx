"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Users, Plus, Search, Edit, Trash2, Shield, UserCheck, UserX, Calendar, Filter, X, Phone, Wallet, Package, ShoppingCart, Send, CheckCircle, XCircle, RefreshCcw, Clock, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel"
import EnhancedPrintButton from "@/components/print/EnhancedPrintButton11"
import { Input } from "@/components/ui/input"
import { usersAPI, adminWalletsAPI } from "@/lib/api"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "user",
    isActive: true,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">("all")
  const [totalUsers, setTotalUsers] = useState(0)
  const [walletAmount, setWalletAmount] = useState("")
  const [walletDescription, setWalletDescription] = useState("")
  const [walletActionType, setWalletActionType] = useState<"add" | "deduct" | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [userWalletInfo, setUserWalletInfo] = useState<any>(null)
  const [userWalletLoading, setUserWalletLoading] = useState(false)

  const periods = [
    { label: "يومي", value: "day" },
    { label: "أسبوعي", value: "week" },
    { label: "شهري", value: "month" },
    { label: "سنوي", value: "year" },
    { label: "مخصص", value: "custom" },
  ]

  const reportTypes = [
    { label: "الكل", value: "all", icon: Users },
    { label: "النشطين", value: "active", icon: UserCheck },
    { label: "غير النشطين", value: "inactive", icon: UserX },
    { label: "المدراء", value: "admin", icon: Shield },
  ]

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        // Always fetch all users without pagination
        const response = await usersAPI.getAll({ limit: 1000 }) // Fetch a large number to get all users

        let usersData = []
        if (response?.success && response?.data) {
          usersData = Array.isArray(response.data) ? response.data : []
        } else if (Array.isArray(response?.data)) {
          usersData = response.data
        } else if (Array.isArray(response)) {
          usersData = response
        }

        setUsers(usersData)
        setTotalUsers(usersData.length)
      } catch (err: any) {
        console.error("Error fetching users:", err)
        setError(err.message || "فشل تحميل المستخدمين")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || ""
    const userEmail = user.email || ""
    const userRole = user.role || "user"
    const userStatus = user.isActive ? "active" : "inactive"
    const userJoinDate = user.createdAt || user.joinDate || ""

    const matchesSearch = userName.includes(searchTerm) || userEmail.includes(searchTerm)
    const matchesRole = !filters.category || userRole === filters.category
    const matchesStatus = !filters.status || userStatus === filters.status
    const matchesDateFrom = !filters.dateFrom || userJoinDate >= filters.dateFrom
    const matchesDateTo = !filters.dateTo || userJoinDate <= filters.dateTo
    const matchesReportType =
      selectedReport === "all" ||
      (selectedReport === "active" && userStatus === "active") ||
      (selectedReport === "inactive" && userStatus === "inactive") ||
      (selectedReport === "admin" && userRole === "admin")
    const matchesCustomDateFrom = selectedPeriod !== "custom" || !customDateFrom || userJoinDate >= customDateFrom
    const matchesCustomDateTo = selectedPeriod !== "custom" || !customDateTo || userJoinDate <= customDateTo
    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesReportType &&
      matchesCustomDateFrom &&
      matchesCustomDateTo
    )
  })

  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = itemsPerPage === "all" ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === "all" ? filteredUsers.length : startIndex + itemsPerPage
  const paginatedUsers = itemsPerPage === "all" ? filteredUsers : filteredUsers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, selectedReport, selectedPeriod, customDateFrom, customDateTo])

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

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
  }

  const handleEditUser = async (user: any) => {
    setSelectedUser(user)
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || user.phoneNumber || user.mobile || "",
      role: user.role || "user",
      isActive: user.isActive !== undefined ? user.isActive : true,
    })
    setWalletAmount("")
    setWalletDescription("")
    setWalletActionType(null)
    setIsEditModalOpen(true)

    try {
      setUserWalletLoading(true)
      setUserWalletInfo(null)
      const customerId = user._id || user.id
      const res = await adminWalletsAPI.getUserWallet(String(customerId))
      const payload = (res as any)?.data?.data || (res as any)?.data || (res as any)
      setUserWalletInfo(payload)
    } catch {
      setUserWalletInfo(null)
    } finally {
      setUserWalletLoading(false)
    }
  }

  const handleWalletAction = async () => {
    if (!walletActionType || !walletAmount || !selectedUser) return

    const amount = Number.parseFloat(walletAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح")
      return
    }

    try {
      setWalletLoading(true)
      const customerId = selectedUser._id || selectedUser.id

      if (walletActionType === "add") {
        await adminWalletsAPI.addBalanceToUser(String(customerId), {
          amount,
          description: walletDescription || "إضافة رصيد من لوحة التحكم",
        })
      } else {
        await adminWalletsAPI.subtractBalanceFromUser(String(customerId), {
          amount,
          description: walletDescription || "خصم رصيد من لوحة التحكم",
        })
      }

      try {
        const res = await adminWalletsAPI.getUserWallet(String(customerId))
        const payload = (res as any)?.data?.data || (res as any)?.data || (res as any)
        setUserWalletInfo(payload)
      } catch {}

      const usersResponse = await usersAPI.getAll()
      let usersData = []
      if (usersResponse?.success && usersResponse?.data) {
        usersData = Array.isArray(usersResponse.data) ? usersResponse.data : []
      } else if (Array.isArray(usersResponse?.data)) {
        usersData = usersResponse.data
      } else if (Array.isArray(usersResponse)) {
        usersData = usersResponse
      }
      setUsers(usersData)

      alert(
        `تم ${walletActionType === "add" ? "إضافة" : "خصم"} ${amount.toLocaleString()} ريال ${walletActionType === "add" ? "إلى" : "من"} محفظة المستخدم بنجاح`,
      )

      setWalletAmount("")
      setWalletDescription("")
      setWalletActionType(null)
    } catch (err: any) {
      console.error("خطأ في عملية المحفظة:", err)
      alert(err.message || "حدث خطأ أثناء تحديث المحفظة")
    } finally {
      setWalletLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      // await usersAPI.update(selectedUser._id || selectedUser.id, editFormData)

      setUsers(
        users.map((u) => ((u._id || u.id) === (selectedUser._id || selectedUser.id) ? { ...u, ...editFormData } : u)),
      )

      setIsEditModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      console.error("Error updating user:", err)
    }
  }

  const handleDeleteUser = async (user: any) => {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${user.firstName || user.name}؟`)) {
      try {
        // await usersAPI.delete(user._id || user.id)

        setUsers(users.filter((u) => (u._id || u.id) !== (user._id || user.id)))
      } catch (err) {
        console.error("Error deleting user:", err)
      }
    }
  }

  const printColumns = [
    { key: "name", label: "الاسم" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "رقم الجوال" },
    { key: "role", label: "الدور" },
    { key: "walletRecharges", label: "عدد مرات شحن المحفظة" },
    { key: "walletSpent", label: "مبلغ الإنفاق من المحفظة" },
    { key: "totalShipments", label: "عدد الشحنات" },
    { key: "totalOrders", label: "عدد الطلبات" },
    { key: "shipmentsSent", label: "الشحنات المرسلة" },
    { key: "shipmentsReceived", label: "الشحنات المستلمة" },
    { key: "shipmentsCancelled", label: "الشحنات الملغية" },
    { key: "shipmentsReturned", label: "الشحنات الرجيع" },
    { key: "lastTransaction", label: "تاريخ آخر معاملة" },
    { key: "status", label: "الحالة" },
  ]

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-"
    try {
      return new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "-"
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
                  <p className="text-gray-500">إدارة وتعديل حسابات المستخدمين</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة مستخدم
              </motion.button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">الفترة الزمنية:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPeriod === period.value
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPeriod === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 border border-indigo-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-indigo-900">اختيار فترة زمنية مخصصة</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {customDateFrom && customDateTo && (
                    <div className="bg-white border border-indigo-300 rounded-lg p-3 mb-4">
                      <p className="text-sm text-indigo-800">
                        <span className="font-semibold">الفترة المحددة:</span> من {customDateFrom} إلى {customDateTo}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setSelectedPeriod("month")
                        setCustomDateFrom("")
                        setCustomDateTo("")
                      }}
                      className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      disabled={!customDateFrom || !customDateTo}
                      className="flex-1 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      تطبيق
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">نوع التقرير:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedReport(type.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          selectedReport === type.value
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-4 mb-4">
              <AdvancedFilterPanel
                onFilterChange={setFilters}
                filterOptions={{
                  status: [
                    { label: "نشط", value: "active" },
                    { label: "غير نشط", value: "inactive" },
                  ],
                  category: [
                    { label: "مدير", value: "admin" },
                    { label: "مشرف", value: "moderator" },
                    { label: "مستخدم", value: "user" },
                  ],
                  dateRange: true,
                }}
              />
              <EnhancedPrintButton
                data={filteredUsers}
                title="قائمة المستخدمين"
                subtitle={`إجمالي ${filteredUsers.length} مستخدم`}
                columns={printColumns}
                showStats={true}
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                عرض <span className="font-bold text-blue-600">{filteredUsers.length}</span> من أصل{" "}
                <span className="font-bold">{users.length}</span> مستخدم
              </p>
            </div>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن مستخدم بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد مستخدمين</div>
            ) : (
              <>
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      {itemsPerPage === "all" ? (
                        <span>عرض <span className="font-semibold text-gray-900">جميع المستخدمين</span> - <span className="font-semibold text-gray-900">{filteredUsers.length}</span> مستخدم</span>
                      ) : (
                        <span>
                          عرض <span className="font-semibold text-gray-900">{filteredUsers.length === 0 ? 0 : startIndex + 1}</span> إلى{" "}
                          <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> من{" "}
                          <span className="font-semibold text-gray-900">{filteredUsers.length}</span> مستخدم
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">عدد الصفوف:</label>
                      <select
                        value={itemsPerPage === "all" ? "all" : itemsPerPage.toString()}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "all") {
                            setItemsPerPage("all")
                            setCurrentPage(1)
                          } else {
                            setItemsPerPage(Number(value))
                            setCurrentPage(1)
                          }
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">الكل ({totalUsers})</option>
                      </select>
                    </div>

                    {totalPages > 1 && (
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
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
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
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
                          disabled={currentPage === totalPages}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأخير
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الاسم</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          البريد الإلكتروني
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الدور</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رقم الجوال</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <Wallet className="w-4 h-4" />
                            <span>شحن المحفظة</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <Wallet className="w-4 h-4" />
                            <span>مبلغ الإنفاق</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <Package className="w-4 h-4" />
                            <span>عدد الشحنات</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <ShoppingCart className="w-4 h-4" />
                            <span>عدد الطلبات</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <Send className="w-4 h-4" />
                            <span>المرسلة</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <CheckCircle className="w-4 h-4" />
                            <span>المستلمة</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <XCircle className="w-4 h-4" />
                            <span>الملغية</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <RefreshCcw className="w-4 h-4" />
                            <span>الرجيع</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            <Clock className="w-4 h-4" />
                            <span>آخر معاملة</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الحالة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedUsers.map((user) => {
                        const userName =
                          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "مستخدم"
                        const userStatus = user.isActive ? "active" : "inactive"
                        const userRole = user.role || "user"
                        const userPhone = user.phone || user.phoneNumber || user.mobile || "-"

                        const walletRecharges = user.walletRecharges || user.wallet?.rechargeCount || 0
                        const walletSpent = user.walletSpent || user.wallet?.totalSpent || 0
                        const totalShipments = user.totalShipments || user.shipments?.total || 0
                        const totalOrders = user.totalOrders || user.orders?.total || 0
                        const shipmentsSent = user.shipmentsSent || user.shipments?.sent || 0
                        const shipmentsReceived = user.shipmentsReceived || user.shipments?.received || 0
                        const shipmentsCancelled = user.shipmentsCancelled || user.shipments?.cancelled || 0
                        const shipmentsReturned = user.shipmentsReturned || user.shipments?.returned || 0
                        const lastTransaction =
                          user.lastTransaction || user.lastPrintDate || user.lastShipmentDate || null

                        return (
                          <motion.tr
                            key={user._id || user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-indigo-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                  {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900">{userName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                                  userRole === "admin"
                                    ? "bg-red-100 text-red-700"
                                    : userRole === "moderator"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {userRole === "admin" && <Shield className="w-4 h-4" />}
                                {userRole === "admin" ? "مدير" : userRole === "moderator" ? "مشرف" : "مستخدم"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 text-indigo-500" />
                                <span>{userPhone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                                {walletRecharges}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-green-50 text-green-700 rounded-lg font-semibold">
                                {walletSpent.toLocaleString()}ريال
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold">
                                {totalShipments}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
                                {totalOrders}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-cyan-50 text-cyan-700 rounded-lg font-semibold">
                                {shipmentsSent}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">
                                {shipmentsReceived}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-700 rounded-lg font-semibold">
                                {shipmentsCancelled}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-3 py-1 bg-orange-50 text-orange-700 rounded-lg font-semibold">
                                {shipmentsReturned}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{formatDate(lastTransaction)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                                  userStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {userStatus === "active" ? (
                                  <UserCheck className="w-4 h-4" />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                                {userStatus === "active" ? "نشط" : "غير نشط"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      عرض <span className="font-semibold text-gray-900">{startIndex + 1}</span> إلى{" "}
                      <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> من{" "}
                      <span className="font-semibold text-gray-900">{filteredUsers.length}</span> مستخدم
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">عدد الصفوف:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {totalPages > 1 && (
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
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
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
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
                          disabled={currentPage === totalPages}
                          className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          الأخير
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isEditModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-50 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">تعديل المستخدم</h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      المعلومات الأساسية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأول</label>
                        <Input
                          value={editFormData.firstName}
                          onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                          placeholder="أدخل الاسم الأول"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الأخير</label>
                        <Input
                          value={editFormData.lastName}
                          onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                          placeholder="أدخل الاسم الأخير"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                        <Input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          placeholder="أدخل البريد الإلكتروني"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                        <Input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          placeholder="أدخل رقم الجوال"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                        <select
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="user">مستخدم</option>
                          <option value="moderator">مشرف</option>
                          <option value="admin">مدير</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={editFormData.isActive}
                          onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                          حساب نشط
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-amber-600" />
                      إدارة المحفظة
                    </h3>

                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Wallet className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">الرصيد الإجمالي</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {(
                                userWalletInfo?.wallet?.balance ??
                                selectedUser?.wallet?.balance ??
                                selectedUser?.walletBalance ??
                                0
                              ).toLocaleString()} {" "}
                              ريال
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">آخر تحديث</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {(() => {
                              const d =
                                userWalletInfo?.wallet?.updatedAt ||
                                userWalletInfo?.wallet?.lastUpdate ||
                                selectedUser?.wallet?.lastUpdate ||
                                selectedUser?.walletLastUpdate
                              return d ? formatDate(String(d)) : "لا يوجد"
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setWalletActionType("add")}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          walletActionType === "add"
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-green-50"
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                        إضافة رصيد
                      </button>
                      <button
                        onClick={() => setWalletActionType("deduct")}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          walletActionType === "deduct"
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-red-50"
                        }`}
                      >
                        <TrendingDown className="w-5 h-5" />
                        خصم رصيد
                      </button>
                    </div>

                    {walletActionType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              المبلغ (ريال سعودي)
                            </div>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            placeholder="أدخل المبلغ"
                            className="text-lg font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (اختياري)</label>
                          <textarea
                            value={walletDescription}
                            onChange={(e) => setWalletDescription(e.target.value)}
                            placeholder="سبب الإضافة/الخصم..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                          />
                        </div>

                        <button
                          onClick={handleWalletAction}
                          disabled={walletLoading || !walletAmount}
                          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            walletActionType === "add"
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg"
                              : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {walletLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              جاري المعالجة...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-5 h-5" />
                              {walletActionType === "add" ? "إضافة الرصيد" : "خصم الرصيد"}
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
