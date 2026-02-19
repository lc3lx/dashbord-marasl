"use client"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import {
  Truck,
  AlertCircle,
  AlertTriangle,
  Package,
  MapPin,
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  Printer,
  Edit,
  Trash2,
  RefreshCw,
  RotateCcw,
  Mail,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import useSWR from "swr"
import { adminShipmentsAPI } from "@/lib/api"

interface Shipment {
  _id: string
  trackingId?: string
  companyshipmentid?: string
  shapmentCompany?: string
  customerName?: string
  customerEmail?: string
  destination?: string
  status?: string
  shipmentstates?: string
  ordervalue?: number
  totalprice?: number
  createdAt?: string
  paymentMathod?: string
  boxNum?: number
  weight?: number
  orderSou?: string
  customerId?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  receiverAddress?: {
    city?: string
    location?: string
    country?: string
    governorate?: string
    street?: string
    district?: string
    buildingNumber?: string
    additionalNumber?: string
  }
  redboxResponse?: { label?: string; trackingNumber?: string }
  aramexResponse?: { labelURL?: string; trackingNumber?: string }
  omniclamaResponse?: { label?: string; trackingNumber?: string }
  smsaResponse?: { label?: string; trackingNumber?: string }
  pickupRequest?: {
    success?: boolean
    pickupId?: string
    pickupGUID?: string
    pickup_guid?: string
  }
}

const filterStatusOptions = [
  { value: "all", label: "جميع الحالات" },
  { value: "READY_FOR_PICKUP", label: "جاهز للاستلام" },
  { value: "IN_TRANSIT", label: "قيد التوصيل" },
  { value: "Delivered", label: "تم التسليم" },
  { value: "Canceled", label: "ملغي" },
  { value: "Returned", label: "راجع" },
]

const statusUpdateOptions = [
  { value: "READY_FOR_PICKUP", label: "جاهز للاستلام" },
  { value: "IN_TRANSIT", label: "قيد التوصيل" },
  { value: "Delivered", label: "تم التسليم" },
  { value: "Canceled", label: "ملغي" },
]

const statusMeta: Record<string, { color: string; icon: any; label: string }> = {
  READY_FOR_PICKUP: { color: "bg-cyan-100 text-cyan-700 border-cyan-200", icon: Package, label: "جاهز للاستلام" },
  IN_TRANSIT: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Truck, label: "قيد التوصيل" },
  OUT_FOR_DELIVERY: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Truck, label: "خارج للتسليم" },
  DELIVERED: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, label: "تم التسليم" },
  RETURNED: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: RotateCcw, label: "راجع" },
  FAILED_DELIVERY: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle, label: "فشل التسليم" },
  CANCELED: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "ملغي" },
  EXCEPTION: { color: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle, label: "استثناء" },
  PENDING: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "قيد المراجعة" },
  UNKNOWN: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: AlertCircle, label: "غير معروف" },
}

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCurrency = (value?: number) => currencyFormatter.format(Number(value ?? 0))

const formatDate = (value?: string, withTime = false) => {
  if (!value) return "غير متاح"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "غير متاح"
  return withTime
    ? date.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })
    : date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
}

const statusAliasMap: Record<string, string> = {
  CANCELLED: "CANCELED",
}

const resolveStatusValue = (shipment?: Shipment) => shipment?.shipmentstates || shipment?.status || "PENDING"
const resolveStatusKey = (status?: string) => {
  if (!status) return "PENDING"
  const normalized = status.replace(/\s+/g, "_").toUpperCase()
  return statusAliasMap[normalized] || normalized
}
const resolveTrackingNumber = (shipment: Shipment) =>
  shipment.trackingId || shipment.companyshipmentid || "غير متوفر"

function getLabelUrl(shipment: Shipment): string | null {
  const company = (shipment?.shapmentCompany || "").toLowerCase()
  if (company === "redbox" && shipment?.redboxResponse?.label) return shipment.redboxResponse.label
  if (company === "aramex" && shipment?.aramexResponse?.labelURL) return shipment.aramexResponse.labelURL
  if (company === "omniclama" && shipment?.omniclamaResponse?.label) return shipment.omniclamaResponse.label
  if (company === "smsa" && shipment?.smsaResponse?.label) return shipment.smsaResponse.label
  return null
}

function downloadBase64File(base64: string, fileName: string) {
  const arr = base64.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf"
  const bstr = atob(arr[arr.length - 1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  const blob = new Blob([u8arr], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
const resolveCustomerName = (shipment: Shipment) =>
  shipment.customerName ||
  `${shipment.customerId?.firstName || ""} ${shipment.customerId?.lastName || ""}`.trim() ||
  "عميل"
const resolveCustomerEmail = (shipment: Shipment) => shipment.customerEmail || shipment.customerId?.email || "غير متوفر"
const resolveDestination = (shipment: Shipment) =>
  shipment.destination ||
  shipment.receiverAddress?.city ||
  shipment.receiverAddress?.location ||
  shipment.receiverAddress?.district ||
  shipment.receiverAddress?.country ||
  "غير محدد"

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [cancelNotes, setCancelNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, paymentFilter, dateFrom, dateTo])

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    ["admin-shipments", currentPage, itemsPerPage, debouncedSearch, statusFilter, paymentFilter, dateFrom, dateTo],
    async ([, page, limit, search, status, payment, from, to]) => {
      const params: Record<string, any> = { page, limit }
      if (search) params.search = search
      if (status !== "all") params.status = status
      if (payment !== "all") params.paymentMethod = payment
      if (from) {
        params.startDate = from
        params.dateFrom = from // دعم كلا الاسمين
      }
      if (to) {
        params.endDate = to
        params.dateTo = to // دعم كلا الاسمين
      }
      console.log("[Shipments] Filter params:", params)
      return adminShipmentsAPI.getAll(params)
    },
    {
      keepPreviousData: true,
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  )

  const shipments: Shipment[] = data?.data || data?.shipments || []
  const pagination = data?.pagination || {
    currentPage,
    totalPages: 1,
    totalItems: shipments.length,
    itemsPerPage,
  }

  const resolvedCurrentPage = pagination.currentPage || currentPage
  const resolvedItemsPerPage = pagination.itemsPerPage || itemsPerPage
  const totalPages = pagination.totalPages || 1
  const totalItems = pagination.totalItems ?? shipments.length
  const startIndex =
    shipments.length === 0 ? 0 : (resolvedCurrentPage - 1) * resolvedItemsPerPage + 1
  const endIndex = shipments.length === 0 ? 0 : startIndex + shipments.length - 1

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    console.log("[v0] Manually refreshing shipments data...")
    await mutate()
    setIsRefreshing(false)
  }

  const handlePrintLabel = (shipment: Shipment) => {
    const labelUrl = getLabelUrl(shipment)
    const company = (shipment?.shapmentCompany || "").toLowerCase()
    if (company === "smsa" && shipment?.smsaResponse?.label) {
      downloadBase64File(
        shipment.smsaResponse.label,
        `smsa-label-${shipment._id || "label"}.pdf`
      )
      return
    }
    if (labelUrl) {
      if (labelUrl.startsWith("data:") || labelUrl.startsWith("blob:")) return
      window.open(labelUrl, "_blank", "noopener,noreferrer")
      return
    }
    alert("البوليصة غير متوفرة لهذه الشحنة")
  }

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setShowDetailsModal(true)
  }

  const handleEditStatus = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setEditStatus(resolveStatusValue(shipment))
    setShowEditModal(true)
  }

  const handleDeleteShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setCancelNotes("")
    setShowDeleteModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedShipment) return

    setIsSubmitting(true)
    try {
      if (!editStatus) {
        alert("يرجى اختيار الحالة الجديدة")
        return
      }
      await adminShipmentsAPI.updateStatus(selectedShipment._id, editStatus)
      await mutate()
      setShowEditModal(false)
      setSelectedShipment(null)
    } catch (error) {
      console.error("Error updating status:", error)
      alert("حدث خطأ أثناء تحديث الحالة")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedShipment) return

    setIsSubmitting(true)
    try {
      await adminShipmentsAPI.updateStatus(selectedShipment._id, "Canceled", cancelNotes.trim() || undefined)
      await mutate()
      setShowDeleteModal(false)
      setSelectedShipment(null)
      setCancelNotes("")
    } catch (error) {
      console.error("Error canceling shipment:", error)
      alert("حدث خطأ أثناء إلغاء الشحنة")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    const normalized = resolveStatusKey(status)
    const config = statusMeta[normalized] || statusMeta["UNKNOWN"]
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الشحنات</h1>
                  <p className="text-gray-500">متابعة وإدارة الشحنات والتوصيل</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-5 h-5 text-emerald-600 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="text-sm font-medium text-gray-700">تحديث</span>
                </motion.button>
                {!isLoading && !error && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg">
                    <div className="text-sm font-medium">إجمالي الشحنات</div>
                    <div className="text-2xl font-bold">{shipments.length}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="البحث برقم التتبع، اسم العميل، أو الوجهة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-5 h-5" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {filterStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-gray-400 w-5 h-5" />
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="all">كل طرق الدفع</option>
                      <option value="Prepaid">مدفوع مسبقًا</option>
                      <option value="COD">دفع عند الاستلام</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Date Filters */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400 w-5 h-5" />
                  <span className="text-sm font-medium text-gray-700">من تاريخ:</span>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400 w-5 h-5" />
                  <span className="text-sm font-medium text-gray-700">إلى تاريخ:</span>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom("")
                      setDateTo("")
                    }}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    مسح التاريخ
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <p className="text-gray-600">جاري تحميل جميع الشحنات من الخادم...</p>
                <p className="text-sm text-gray-400">يتم جلب البيانات من API</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">حدث خطأ في تحميل البيانات</h2>
                <p className="text-gray-600 max-w-md">
                  {error?.message || "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && shipments.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Package className="w-16 h-16 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900">لا توجد شحنات</h2>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "لم يتم العثور على أي شحنات تطابق معايير البحث"
                    : "لا توجد شحنات في النظام حالياً"}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && shipments.length > 0 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  <strong>تم جلب {totalItems} شحنة من API</strong>
                  {shipments.length !== totalItems && <span> • عرض {shipments.length} في هذه الصفحة</span>}
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Pagination Header */}
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      {shipments.length === 0 ? (
                        <span>لا توجد بيانات</span>
                      ) : (
                        <>
                          عرض{" "}
                          <span className="font-semibold text-gray-900">{startIndex}</span> إلى{" "}
                          <span className="font-semibold text-gray-900">{endIndex}</span> من{" "}
                          <span className="font-semibold text-gray-900">{totalItems}</span> شحنة
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">عدد الصفوف:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                        onClick={() => handlePageChange(1)}
                        disabled={resolvedCurrentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        الأول
                      </button>
                      <button
                        onClick={() => handlePageChange(resolvedCurrentPage - 1)}
                        disabled={resolvedCurrentPage === 1}
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
                              (page >= resolvedCurrentPage - 1 && page <= resolvedCurrentPage + 1)
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
                                  onClick={() => handlePageChange(page)}
                                  className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    resolvedCurrentPage === page
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
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
                        onClick={() => handlePageChange(resolvedCurrentPage + 1)}
                        disabled={resolvedCurrentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={resolvedCurrentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        الأخير
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">رقم التتبع</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">اسم العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">الوجهة</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">شركة الشحن</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">بريد العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">الحالة</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">قيمة الطلب</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">الإجمالي</th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-white">التاريخ</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shipments.map((shipment, index) => {
                        const customerName =
                          shipment.customerName ||
                          `${shipment.customerId?.firstName || ""} ${shipment.customerId?.lastName || ""}`.trim() ||
                          "عميل"
                        const customerEmail = shipment.customerEmail || shipment.customerId?.email || "غير متوفر"
                        const destination =
                          shipment.destination ||
                          shipment.receiverAddress?.city ||
                          shipment.receiverAddress?.location ||
                          shipment.receiverAddress?.country ||
                          "غير محدد"
                        const tracking = shipment.trackingId || shipment.companyshipmentid || "غير متوفر"
                        const orderValue = Number(shipment.ordervalue ?? shipment.totalprice ?? 0)
                        const totalPrice = Number(shipment.totalprice ?? shipment.ordervalue ?? 0)
                        return (
                        <motion.tr
                          key={shipment._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-emerald-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-bold text-gray-900">{tracking}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-900 font-medium">{customerName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-sm">{destination}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm">{shipment.shapmentCompany || "غير محدد"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="text-sm">{customerEmail}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(resolveStatusValue(shipment))}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-700">
                              {orderValue.toFixed(2)} ر.س
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-base font-bold text-emerald-600">
                              {totalPrice.toFixed(2)} ر.س
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm">
                                {shipment.createdAt
                                  ? new Date(shipment.createdAt).toLocaleDateString("ar-SA")
                                  : "غير متاح"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleViewDetails(shipment)}
                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePrintLabel(shipment)}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                title="طباعة البوليصة"
                              >
                                <Printer className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditStatus(shipment)}
                                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                title="تحديث الحالة"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteShipment(shipment)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="حذف الشحنة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {showDetailsModal && selectedShipment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">تفاصيل الشحنة</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">رقم التتبع</p>
                      <p className="font-bold text-gray-900">{selectedShipment.trackingId}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">اسم العميل</p>
                      <p className="font-bold text-gray-900">{selectedShipment.customerName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                      <p className="text-sm text-gray-500 mb-1">بريد العميل</p>
                      <p className="font-bold text-gray-900">{selectedShipment.customerEmail || 'غير متوفر'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">شركة الشحن</p>
                      <p className="font-bold text-gray-900">{selectedShipment.shapmentCompany}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">رقم الشحنة</p>
                      <p className="font-bold text-gray-900">{selectedShipment.companyshipmentid}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">الوجهة</p>
                      <p className="font-bold text-gray-900">{selectedShipment.destination}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">الحالة</p>
                      <div className="mt-2">{getStatusBadge(resolveStatusValue(selectedShipment))}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">قيمة الطلب</p>
                      <p className="font-bold text-emerald-600">{selectedShipment.ordervalue.toFixed(2)} ر.س</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">السعر الإجمالي</p>
                      <p className="font-bold text-emerald-600">{selectedShipment.totalprice.toFixed(2)} ر.س</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">تاريخ الإنشاء</p>
                      <p className="font-bold text-gray-900">
                        {new Date(selectedShipment.createdAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {/* أرامكس: رقم طلب الاستلام و GUID */}
                    {selectedShipment.shapmentCompany?.toLowerCase() === "aramex" &&
                      selectedShipment.pickupRequest?.success && (
                        <>
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">رقم طلب الاستلام</p>
                            <p className="font-bold text-gray-900">
                              {selectedShipment.pickupRequest.pickupId ?? "—"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                            <p className="text-sm text-gray-500 mb-1">GUID</p>
                            <p
                              className="font-medium text-gray-900 text-xs break-all"
                              title={selectedShipment.pickupRequest.pickupGUID ?? selectedShipment.pickupRequest.pickup_guid ?? ""}
                            >
                              {selectedShipment.pickupRequest.pickupGUID ??
                                selectedShipment.pickupRequest.pickup_guid ??
                                "—"}
                            </p>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEditModal && selectedShipment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">تحديث حالة الشحنة</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم التتبع</label>
                    <p className="text-gray-900 font-bold">{selectedShipment.trackingId}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الجديدة</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {statusUpdateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري التحديث...</span>
                        </>
                      ) : (
                        "تحديث"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteModal && selectedShipment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">تأكيد الحذف</h2>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800">
                      هل أنت متأكد من إلغاء الشحنة <strong>{selectedShipment.trackingId}</strong>؟
                    </p>
                    <p className="text-red-600 text-sm mt-2">
                      سيتم تحديث حالة الشحنة إلى "ملغي" واسترجاع المبالغ المستحقة تلقائياً.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإلغاء (اختياري)</label>
                    <textarea
                      value={cancelNotes}
                      onChange={(e) => setCancelNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="أدخل سبب الإلغاء ليظهر في سجل العميل..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري الحذف...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
