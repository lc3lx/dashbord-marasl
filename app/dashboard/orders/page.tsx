"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Package, Plus, Search, Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel"
import EnhancedPrintButton from "@/components/print/EnhancedPrintButton11"
import { adminOrdersAPI } from "@/lib/api"

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: Record<string, string> = {}
        if (filters.status) params.status = filters.status
        if (filters.dateFrom) params.startDate = new Date(filters.dateFrom).toISOString()
        if (filters.dateTo) params.endDate = new Date(filters.dateTo).toISOString()
        const response = await adminOrdersAPI.getAll(params)

        // Handle backend { success, data, pagination }
        let ordersData: any[] = []
        if (response?.success && Array.isArray(response?.data)) {
          ordersData = response.data
        } else if (Array.isArray(response?.data)) {
          ordersData = response.data
        } else if (Array.isArray(response)) {
          ordersData = response
        }

        setOrders(ordersData)
      } catch (err: any) {
        console.error("[v0] Error fetching orders:", err)
        setError(err.message || "فشل تحميل الطلبات")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [filters.status, filters.dateFrom, filters.dateTo])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return { label: "مكتمل", color: "bg-green-100 text-green-700", icon: CheckCircle2 }
      case "processing":
      case "in-progress":
        return { label: "قيد المعالجة", color: "bg-blue-100 text-blue-700", icon: Package }
      case "pending":
        return { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700", icon: Clock }
      case "cancelled":
      case "canceled":
        return { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle }
      default:
        return { label: "غير معروف", color: "bg-gray-100 text-gray-700", icon: Package }
    }
  }

  const filteredOrders = orders.filter((order) => {
    const orderId = order.orderNumber || order._id || order.id || ""
    const customerName = order.customerName || order.customer?.name || ""
    const orderStatus = order.status || "pending"
    const orderDate = order.createdAt || order.date || ""
    const orderTotal = order.totalAmount || order.total || 0
    const orderItems = order.items?.length || order.itemsCount || 0

    const matchesSearch = orderId.toString().includes(searchTerm) || customerName.includes(searchTerm)
    const matchesStatus = !filters.status || orderStatus === filters.status
    const matchesDateFrom = !filters.dateFrom || orderDate >= filters.dateFrom
    const matchesDateTo = !filters.dateTo || orderDate <= filters.dateTo
    const matchesPriceFrom = !filters.priceFrom || orderTotal >= Number(filters.priceFrom)
    const matchesPriceTo = !filters.priceTo || orderTotal <= Number(filters.priceTo)
    const matchesItemsFrom = !filters.itemsFrom || orderItems >= Number(filters.itemsFrom)
    const matchesItemsTo = !filters.itemsTo || orderItems <= Number(filters.itemsTo)
    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesPriceFrom &&
      matchesPriceTo &&
      matchesItemsFrom &&
      matchesItemsTo
    )
  })

  const totalRevenue = filteredOrders
    .filter((o) => o.status === "completed" || o.status === "delivered")
    .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0)

  const printColumns = [
    { key: "id", label: "رقم الطلب" },
    { key: "customer", label: "العميل" },
    { key: "items", label: "عدد المنتجات" },
    { key: "total", label: "المبلغ الإجمالي" },
    { key: "status", label: "الحالة" },
    { key: "date", label: "التاريخ" },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
                  <p className="text-gray-500">متابعة ومراجعة الطلبات</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة طلب
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">مكتملة</p>
                  <p className="text-3xl font-bold text-green-600">
                    {filteredOrders.filter((o) => o.status === "completed" || o.status === "delivered").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">قيد المعالجة</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredOrders.filter((o) => o.status === "processing" || o.status === "in-progress").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">الإيرادات</p>
                  <p className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString()} ر.س</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
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
                    status: [
                      { label: "مكتمل", value: "completed" },
                      { label: "قيد المعالجة", value: "processing" },
                      { label: "قيد الانتظار", value: "pending" },
                      { label: "ملغي", value: "cancelled" },
                    ],
                    dateRange: true,
                    priceRange: true,
                    itemsRange: true,
                  }}
                />
                <EnhancedPrintButton
                  data={filteredOrders}
                  title="قائمة الطلبات"
                  subtitle={`إجمالي ${filteredOrders.length} طلب - الإيرادات: ${totalRevenue.toLocaleString()} ر.س`}
                  columns={printColumns}
                  showStats={true}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  عرض <span className="font-bold text-purple-600">{filteredOrders.length}</span> من أصل{" "}
                  <span className="font-bold">{orders.length}</span> طلب
                </p>
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث عن طلب برقم الطلب أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </motion.div>
          </div>

          {/* Orders Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد طلبات</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold">رقم الطلب</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">العميل</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">عدد المنتجات</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">المبلغ الإجمالي</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const statusInfo = getStatusInfo(order.status)
                      const StatusIcon = statusInfo.icon
                      const orderId = order.orderNumber || order._id || order.id
                      const customerName = order.customerName || order.customer?.name || "عميل"
                      const itemsCount = order.items?.length || order.itemsCount || 0
                      const totalAmount = order.totalAmount || order.total || 0
                      const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-SA") : ""

                      return (
                        <motion.tr
                          key={orderId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-purple-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{orderId}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{customerName}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                              <Package className="w-4 h-4" />
                              {itemsCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString()} ر.س</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{orderDate}</td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
