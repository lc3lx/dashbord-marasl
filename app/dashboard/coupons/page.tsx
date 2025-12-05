"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { TicketPercent, Plus, Search, Copy, CheckCircle2, XCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { couponsAPI, shippingCompaniesAPI } from "@/lib/api"

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [shippingCompanies, setShippingCompanies] = useState<any[]>([])
  const [loadingShippingCompanies, setLoadingShippingCompanies] = useState(false)
  const [newCouponData, setNewCouponData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderValue: 0,
    maxUses: 100,
    usesPerUser: 1,
    startDate: "",
    expiryDate: "",
    targetProducts: "",
    targetCategories: "",
    shippingCompanies: [] as string[], // تغيير من shippingCompany إلى shippingCompanies array
    notes: "",
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await couponsAPI.getAll()

        let couponsData = []
        if (response?.success && response?.data) {
          couponsData = Array.isArray(response.data) ? response.data : []
        } else if (Array.isArray(response?.data)) {
          couponsData = response.data
        } else if (Array.isArray(response)) {
          couponsData = response
        }

        setCoupons(couponsData)
      } catch (err: any) {
        console.error("[v0] Error fetching coupons:", err)
        setError(err.message || "فشل تحميل الكوبونات")
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [])

  useEffect(() => {
    const fetchShippingCompanies = async () => {
      if (isAddModalOpen && shippingCompanies.length === 0) {
        try {
          setLoadingShippingCompanies(true)
          const response = await shippingCompaniesAPI.getAll()

          let companiesData = []
          if (response?.success && response?.data) {
            companiesData = Array.isArray(response.data) ? response.data : []
          } else if (Array.isArray(response?.data)) {
            companiesData = response.data
          } else if (Array.isArray(response)) {
            companiesData = response
          }

          setShippingCompanies(companiesData)
        } catch (err: any) {
          console.error("[v0] Error fetching shipping companies:", err)
        } finally {
          setLoadingShippingCompanies(false)
        }
      }
    }

    fetchShippingCompanies()
  }, [isAddModalOpen])

  const handleAddCoupon = async () => {
    try {
      setSaving(true)
      await couponsAPI.create(newCouponData)

      const response = await couponsAPI.getAll()
      let couponsData = []
      if (response?.success && response?.data) {
        couponsData = Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response?.data)) {
        couponsData = response.data
      } else if (Array.isArray(response)) {
        couponsData = response
      }
      setCoupons(couponsData)

      setIsAddModalOpen(false)
      setNewCouponData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minOrderValue: 0,
        maxUses: 100,
        usesPerUser: 1,
        startDate: "",
        expiryDate: "",
        targetProducts: "",
        targetCategories: "",
        shippingCompanies: [],
        notes: "",
        isActive: true,
      })
    } catch (err: any) {
      console.error("[v0] Error adding coupon:", err)
      alert("فشل إضافة الكوبون: " + (err.message || "حدث خطأ"))
    } finally {
      setSaving(false)
    }
  }

  const filteredCoupons = coupons.filter((coupon) => {
    const couponCode = coupon.code || ""
    return couponCode.includes(searchTerm.toUpperCase())
  })

  const handleToggleAllShippingCompanies = (checked: boolean) => {
    if (checked) {
      const allCompanyIds = shippingCompanies.map((c) => c._id || c.id)
      setNewCouponData({ ...newCouponData, shippingCompanies: allCompanyIds })
    } else {
      setNewCouponData({ ...newCouponData, shippingCompanies: [] })
    }
  }

  const handleToggleShippingCompany = (companyId: string) => {
    const currentCompanies = newCouponData.shippingCompanies
    if (currentCompanies.includes(companyId)) {
      setNewCouponData({
        ...newCouponData,
        shippingCompanies: currentCompanies.filter((id) => id !== companyId),
      })
    } else {
      setNewCouponData({
        ...newCouponData,
        shippingCompanies: [...currentCompanies, companyId],
      })
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
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <TicketPercent className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الكوبونات</h1>
                  <p className="text-gray-500">إنشاء وإدارة كوبونات الخصم</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة كوبون
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الكوبونات</p>
                  <p className="text-3xl font-bold text-gray-900">{coupons.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <TicketPercent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">نشطة</p>
                  <p className="text-3xl font-bold text-green-600">
                    {coupons.filter((c) => c.isActive || c.active).length}
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
                  <p className="text-gray-500 mb-2">منتهية</p>
                  <p className="text-3xl font-bold text-red-600">
                    {coupons.filter((c) => !c.isActive && !c.active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الاستخدامات</p>
                  <p className="text-3xl font-bold text-rose-600">
                    {coupons.reduce((sum, c) => sum + (c.usedCount || c.uses || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                  <TicketPercent className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن كوبون..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Coupons Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>
          ) : error ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 text-center text-gray-500">
              لا توجد كوبونات
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon) => {
                const couponCode = coupon.code || ""
                const discountValue = coupon.discountValue || coupon.discount || 0
                const discountType = coupon.discountType || coupon.type || "percentage"
                const usedCount = coupon.usedCount || coupon.uses || 0
                const maxUses = coupon.maxUses || coupon.maxUsage || 100
                const isActive =
                  coupon.isActive !== undefined ? coupon.isActive : coupon.active !== undefined ? coupon.active : true
                const expiryDate =
                  coupon.expiryDate || coupon.expiry || coupon.validUntil
                    ? new Date(coupon.expiryDate || coupon.expiry || coupon.validUntil).toLocaleDateString("ar-SA")
                    : "غير محدد"

                return (
                  <motion.div
                    key={coupon._id || coupon.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <TicketPercent className="w-6 h-6 text-white" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isActive ? "نشط" : "منتهي"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-2xl font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                          {couponCode}
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigator.clipboard.writeText(couponCode)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </motion.button>
                      </div>
                      <p className="text-3xl font-bold text-rose-600">
                        {discountType === "percentage" ? `${discountValue}%` : `${discountValue} ر.س`}
                      </p>
                      <p className="text-sm text-gray-500">{discountType === "percentage" ? "خصم نسبي" : "خصم ثابت"}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">الاستخدامات</span>
                        <span className="font-medium text-gray-900">
                          {usedCount} / {maxUses}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((usedCount / maxUses) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">تاريخ الانتهاء</span>
                        <span className="font-medium text-gray-900">{expiryDate}</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      تعديل الكوبون
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Modal for Adding New Coupon */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsAddModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">إضافة كوبون جديد</h2>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* القسم الأساسي */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">المعلومات الأساسية</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          كود الكوبون <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCouponData.code}
                          onChange={(e) => setNewCouponData({ ...newCouponData, code: e.target.value.toUpperCase() })}
                          placeholder="مثال: SUMMER2024"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخصم</label>
                        <select
                          value={newCouponData.discountType}
                          onChange={(e) => setNewCouponData({ ...newCouponData, discountType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="percentage">نسبة مئوية (%)</option>
                          <option value="fixed">مبلغ ثابت (ر.س)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">وصف الكوبون</label>
                      <textarea
                        value={newCouponData.description}
                        onChange={(e) => setNewCouponData({ ...newCouponData, description: e.target.value })}
                        placeholder="وصف مختصر عن الكوبون وشروط استخدامه"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* قسم قيمة الخصم */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">تفاصيل الخصم</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          قيمة الخصم <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={newCouponData.discountValue}
                          onChange={(e) =>
                            setNewCouponData({ ...newCouponData, discountValue: Number(e.target.value) })
                          }
                          placeholder={newCouponData.discountType === "percentage" ? "مثال: 20" : "مثال: 50"}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {newCouponData.discountType === "percentage"
                            ? "النسبة المئوية للخصم"
                            : "المبلغ الثابت بالريال السعودي"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الحد الأدنى لقيمة الطلب (ر.س)
                        </label>
                        <input
                          type="number"
                          value={newCouponData.minOrderValue}
                          onChange={(e) =>
                            setNewCouponData({ ...newCouponData, minOrderValue: Number(e.target.value) })
                          }
                          placeholder="مثال: 100"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          الحد الأدنى لقيمة الطلب لتطبيق الكوبون (0 = بدون حد أدنى)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* قسم حدود الاستخدام */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">حدود الاستخدام</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى للاستخدامات</label>
                        <input
                          type="number"
                          value={newCouponData.maxUses}
                          onChange={(e) => setNewCouponData({ ...newCouponData, maxUses: Number(e.target.value) })}
                          placeholder="مثال: 100"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">إجمالي عدد مرات استخدام الكوبون</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الاستخدامات لكل مستخدم</label>
                        <input
                          type="number"
                          value={newCouponData.usesPerUser}
                          onChange={(e) => setNewCouponData({ ...newCouponData, usesPerUser: Number(e.target.value) })}
                          placeholder="مثال: 1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          عدد المرات التي يمكن للمستخدم الواحد استخدام الكوبون
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* قسم الفترة الزمنية */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">الفترة الزمنية</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البدء</label>
                        <input
                          type="date"
                          value={newCouponData.startDate}
                          onChange={(e) => setNewCouponData({ ...newCouponData, startDate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">تاريخ بدء صلاحية الكوبون (اختياري)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء</label>
                        <input
                          type="date"
                          value={newCouponData.expiryDate}
                          onChange={(e) => setNewCouponData({ ...newCouponData, expiryDate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">تاريخ انتهاء صلاحية الكوبون (اختياري)</p>
                      </div>
                    </div>
                  </div>

                  {/* قسم الاستهداف */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">الاستهداف (اختياري)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">المنتجات المستهدفة</label>
                        <input
                          type="text"
                          value={newCouponData.targetProducts}
                          onChange={(e) => setNewCouponData({ ...newCouponData, targetProducts: e.target.value })}
                          placeholder="معرفات المنتجات مفصولة بفاصلة"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">اترك فارغاً لتطبيق الكوبون على جميع المنتجات</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الفئات المستهدفة</label>
                        <input
                          type="text"
                          value={newCouponData.targetCategories}
                          onChange={(e) => setNewCouponData({ ...newCouponData, targetCategories: e.target.value })}
                          placeholder="معرفات الفئات مفصولة بفاصلة"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">اترك فارغاً لتطبيق الكوبون على جميع الفئات</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">شركات الشحن (اختياري)</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">اختر شركات الشحن</label>
                      {loadingShippingCompanies ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* خيار جميع الشركات */}
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border-2 border-rose-200 hover:border-rose-300 transition-colors">
                            <input
                              type="checkbox"
                              id="all-companies"
                              checked={
                                newCouponData.shippingCompanies.length === shippingCompanies.length &&
                                shippingCompanies.length > 0
                              }
                              onChange={(e) => handleToggleAllShippingCompanies(e.target.checked)}
                              className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                            />
                            <label htmlFor="all-companies" className="flex-1 text-sm font-semibold text-rose-900">
                              جميع شركات الشحن
                            </label>
                            <span className="text-xs text-rose-600 font-medium">
                              {newCouponData.shippingCompanies.length === shippingCompanies.length &&
                              shippingCompanies.length > 0
                                ? "محدد"
                                : "غير محدد"}
                            </span>
                          </div>

                          {/* قائمة الشركات */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                            {shippingCompanies.map((company) => {
                              const companyId = company._id || company.id
                              const companyName = company.name || company.companyName || "شركة شحن"
                              const isSelected = newCouponData.shippingCompanies.includes(companyId)

                              return (
                                <div
                                  key={companyId}
                                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-rose-50 border-rose-300 shadow-sm"
                                      : "bg-white border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() => handleToggleShippingCompany(companyId)}
                                >
                                  <input
                                    type="checkbox"
                                    id={`company-${companyId}`}
                                    checked={isSelected}
                                    onChange={() => handleToggleShippingCompany(companyId)}
                                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`company-${companyId}`}
                                    className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    {companyName}
                                  </label>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                                </div>
                              )
                            })}
                          </div>

                          {/* عداد الشركات المختارة */}
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-600">الشركات المختارة:</span>
                            <span className="text-sm font-bold text-rose-600">
                              {newCouponData.shippingCompanies.length === 0
                                ? "جميع الشركات"
                                : `${newCouponData.shippingCompanies.length} من ${shippingCompanies.length}`}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        اختر شركات شحن محددة أو اترك الكل غير محدد لتطبيق الكوبون على جميع الشركات
                      </p>
                    </div>
                  </div>

                  {/* قسم الملاحظات */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">ملاحظات إضافية</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات داخلية</label>
                      <textarea
                        value={newCouponData.notes}
                        onChange={(e) => setNewCouponData({ ...newCouponData, notes: e.target.value })}
                        placeholder="ملاحظات للاستخدام الداخلي فقط"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">هذه الملاحظات لن تظهر للعملاء</p>
                    </div>
                  </div>

                  {/* حالة التفعيل */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newCouponData.isActive}
                      onChange={(e) => setNewCouponData({ ...newCouponData, isActive: e.target.checked })}
                      className="w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      تفعيل الكوبون فوراً
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddCoupon}
                    disabled={saving || !newCouponData.code || !newCouponData.discountValue}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "جاري الحفظ..." : "حفظ الكوبون"}
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
