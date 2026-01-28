"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Receipt, Plus, Search, Download, Eye, DollarSign, Calendar, Filter, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { testInvoices } from "@/data/test-customers"
import { adminInvoicesAPI } from "@/lib/api"

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  shipmentNumber: string
  shipmentType: string
  orderId: string
  senderAddress: string
  receiverAddress: string
  orderSource: string
  shippingCompany: string
  paymentMethod: string
  shipmentStatus: string
  trackingStatus: string
  shipmentDate: string
  lastUpdateDate: string
  orderValue: number
  weight: number
  basePolicyPrice: number
  totalPrice: number
  additionalWeightCost: number
  codFees: number
  codPaymentStatus: string
  pickupFees: number
  returnFees: number
  fuelFees: number
  vatAmount: number
  insuranceCost: number
  status: string
  createdAt: string
  dueDate: string
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchInvoices()
  }, [selectedPeriod, selectedReport, customDateFrom, customDateTo])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {
        period: selectedPeriod,
        reportType: selectedReport,
      }
      if (selectedPeriod === 'custom' && customDateFrom && customDateTo) {
        params.dateFrom = customDateFrom
        params.dateTo = customDateTo
      }

      const resp = await adminInvoicesAPI.getAll(params)
      setInvoices(resp?.invoices || resp?.data?.invoices || (Array.isArray(resp) ? resp : []) )
    } catch (err) {
      console.log('[v0] API endpoint not available, using test data')
      setInvoices(testInvoices)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { label: "يومي", value: "day" },
    { label: "أسبوعي", value: "week" },
    { label: "شهري", value: "month" },
    { label: "سنوي", value: "year" },
    { label: "مخصص", value: "custom" },
  ]

  const reportTypes = [
    { label: "الكل", value: "all", icon: Receipt },
    { label: "مدفوعة", value: "paid", icon: DollarSign },
    { label: "معلقة", value: "pending", icon: Eye },
    { label: "متأخرة", value: "overdue", icon: Calendar },
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "مدفوعة", color: "bg-green-100 text-green-700" }
      case "pending":
        return { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" }
      case "overdue":
        return { label: "متأخرة", color: "bg-red-100 text-red-700" }
      default:
        return { label: "غير معروف", color: "bg-gray-100 text-gray-700" }
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalPrice, 0)
  const paidAmount = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.totalPrice, 0)

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedPeriod, selectedReport])

  // دالة تصدير الفواتير إلى Excel
  const exportToExcel = async () => {
    try {
      // استيراد مكتبة xlsx ديناميكياً
      const XLSX = await import('xlsx')
      
      // إعداد البيانات للتصدير
      const exportData = filteredInvoices.map((invoice) => ({
        'رقم الفاتورة': invoice.invoiceNumber || '',
        'اسم العميل': invoice.customerName || '',
        'بريد العميل': invoice.customerEmail || '',
        'رقم الشحنة': invoice.shipmentNumber || '',
        'نوع الشحن': invoice.shipmentType || '',
        'معرف الطلب': invoice.orderId || '',
        'عنوان المرسل': invoice.senderAddress || '',
        'عنوان المستلم': invoice.receiverAddress || '',
        'مصدر الطلب': invoice.orderSource || '',
        'شركة الشحن': invoice.shippingCompany || '',
        'طريقة الدفع': invoice.paymentMethod || '',
        'حالة الشحنة': invoice.shipmentStatus || '',
        'حالة التتبع': invoice.trackingStatus || '',
        'تاريخ الشحن': invoice.shipmentDate || '',
        'تاريخ آخر تحديث': invoice.lastUpdateDate || '',
        'قيمة الطلب': invoice.orderValue || 0,
        'الوزن (كجم)': invoice.weight || 0,
        'السعر الأساسي': invoice.basePolicyPrice || 0,
        'السعر الإجمالي': invoice.totalPrice || 0,
        'تكلفة الوزن الإضافي': invoice.additionalWeightCost || 0,
        'رسوم الدفع عند الاستلام': invoice.codFees || 0,
        'حالة الدفع عند الاستلام': invoice.codPaymentStatus || '',
        'رسوم الاستلام': invoice.pickupFees || 0,
        'رسوم الرجيع': invoice.returnFees || 0,
        'رسوم الوقود': invoice.fuelFees || 0,
        'قيمة الضريبة المضافة': invoice.vatAmount || 0,
        'تكلفة التأمين': invoice.insuranceCost || 0,
        'حالة الفاتورة': invoice.status || '',
        'تاريخ الإنشاء': invoice.createdAt || '',
        'تاريخ الاستحقاق': invoice.dueDate || '',
      }))

      // إنشاء workbook جديد
      const wb = XLSX.utils.book_new()
      
      // إنشاء worksheet من البيانات
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // ضبط عرض الأعمدة
      const colWidths = [
        { wch: 15 }, // رقم الفاتورة
        { wch: 20 }, // اسم العميل
        { wch: 25 }, // بريد العميل
        { wch: 15 }, // رقم الشحنة
        { wch: 15 }, // نوع الشحن
        { wch: 15 }, // معرف الطلب
        { wch: 30 }, // عنوان المرسل
        { wch: 30 }, // عنوان المستلم
        { wch: 15 }, // مصدر الطلب
        { wch: 15 }, // شركة الشحن
        { wch: 18 }, // طريقة الدفع
        { wch: 15 }, // حالة الشحنة
        { wch: 15 }, // حالة التتبع
        { wch: 15 }, // تاريخ الشحن
        { wch: 15 }, // تاريخ آخر تحديث
        { wch: 12 }, // قيمة الطلب
        { wch: 12 }, // الوزن
        { wch: 12 }, // السعر الأساسي
        { wch: 12 }, // السعر الإجمالي
        { wch: 18 }, // تكلفة الوزن الإضافي
        { wch: 20 }, // رسوم الدفع عند الاستلام
        { wch: 20 }, // حالة الدفع عند الاستلام
        { wch: 15 }, // رسوم الاستلام
        { wch: 15 }, // رسوم الرجيع
        { wch: 15 }, // رسوم الوقود
        { wch: 18 }, // قيمة الضريبة المضافة
        { wch: 15 }, // تكلفة التأمين
        { wch: 15 }, // حالة الفاتورة
        { wch: 15 }, // تاريخ الإنشاء
        { wch: 15 }, // تاريخ الاستحقاق
      ]
      ws['!cols'] = colWidths

      // إضافة worksheet إلى workbook
      XLSX.utils.book_append_sheet(wb, ws, 'الفواتير')

      // إنشاء اسم الملف مع التاريخ
      const date = new Date().toISOString().split('T')[0]
      const fileName = `الفواتير_${date}.xlsx`

      // تصدير الملف
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('خطأ في تصدير الملف:', error)
      alert('حدث خطأ أثناء تصدير الملف. يرجى التأكد من تثبيت مكتبة xlsx')
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
                  <p className="text-gray-500">إدارة ومتابعة الفواتير</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToExcel}
                  disabled={filteredInvoices.length === 0 || loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  تصدير Excel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  إنشاء فاتورة
                </motion.button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الفواتير</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold text-fuchsia-600">{totalAmount.toLocaleString()} ر.س</p>
                </div>
                <div className="w-12 h-12 bg-fuchsia-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-fuchsia-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">المدفوع</p>
                  <p className="text-2xl font-bold text-green-600">{paidAmount.toLocaleString()} ر.س</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">المتبقي</p>
                  <p className="text-2xl font-bold text-red-600">{(totalAmount - paidAmount).toLocaleString()} ر.س</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

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
                      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      disabled={!customDateFrom || !customDateTo}
                      onClick={fetchInvoices}
                      className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن فاتورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">جاري تحميل الفواتير...</p>
                </div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">لا توجد فواتير متاحة</p>
                  <p className="text-gray-400 text-sm mt-2">سيتم عرض الفواتير هنا عند توفرها</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      عرض <span className="font-semibold text-gray-900">{startIndex + 1}</span> إلى{" "}
                      <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredInvoices.length)}</span> من{" "}
                      <span className="font-semibold text-gray-900">{filteredInvoices.length}</span> فاتورة
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">عدد الصفوف:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
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
                                      ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-lg"
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
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">اسم العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">بريد العميل</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رقم الشحنة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">نوع الشحن</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">معرف الطلب</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">عنوان المرسل</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">عنوان المستلم</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">مصدر الطلب</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">شركة الشحن</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">طريقة الدفع</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">حالة الشحنة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">حالة التتبع</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">تاريخ الشحن</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">تاريخ آخر تحديث</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">قيمة الطلب</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">الوزن</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">السعر الأساسي</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">السعر الإجمالي</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">تكلفة الوزن الإضافي</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رسوم الدفع عند الاستلام</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">حالة الدفع عند الاستلام</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رسوم الاستلام</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رسوم الرجيع</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">رسوم الوقود</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">قيمة الضريبة المضافة</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">تكلفة التأمين</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedInvoices.map((invoice) => {
                        const statusInfo = getStatusInfo(invoice.status)
                        return (
                          <motion.tr
                            key={invoice._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-fuchsia-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.customerEmail}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.shipmentNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.shipmentType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.orderId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 max-w-xs truncate" title={invoice.senderAddress}>{invoice.senderAddress}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 max-w-xs truncate" title={invoice.receiverAddress}>{invoice.receiverAddress}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.orderSource}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.shippingCompany}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.paymentMethod}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.shipmentStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.trackingStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.shipmentDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.lastUpdateDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">{invoice.orderValue?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.weight} كجم</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">{invoice.basePolicyPrice?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-bold text-fuchsia-600">{invoice.totalPrice?.toLocaleString()} ر.س</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.additionalWeightCost?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.codFees?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.codPaymentStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.pickupFees?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.returnFees?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.fuelFees?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.vatAmount?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{invoice.insuranceCost?.toLocaleString()} ر.س</td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
