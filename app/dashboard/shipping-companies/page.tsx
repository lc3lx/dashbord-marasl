"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Truck, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, X, Percent, DollarSign } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { shippingCompaniesAPI } from "@/lib/api"

export default function ShippingCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    company: "",
    deliveryTime: "",
    email: "",
    phone: "",
    isActive: true,
    basePrice: 0,
    tax: { value: 0, type: "percentage" as "percentage" | "fixed" },
    fuel: { value: 0, type: "percentage" as "percentage" | "fixed" },
    profit: { value: 0, type: "percentage" as "percentage" | "fixed" },
  })
  const [editLoading, setEditLoading] = useState(false)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Shipping Companies - Fetching data from API...")
      const response = await shippingCompaniesAPI.getAll()

      let companiesData = []

      if (response?.result && Array.isArray(response.result)) {
        companiesData = response.result
      } else if (response?.success && response?.data) {
        companiesData = Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response?.data)) {
        companiesData = response.data
      } else if (Array.isArray(response)) {
        companiesData = response
      } else if (response && typeof response === "object" && response.name) {
        companiesData = [response]
      }

      setCompanies(companiesData)
    } catch (err: any) {
      console.error("[v0] Shipping Companies - Error fetching data:", err)
      console.error("[v0] Shipping Companies - Error details:", err.message, err.stack)
      setError(err.message || "فشل تحميل شركات الشحن")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleEditClick = (company: any) => {
    console.log("[v0] Shipping Companies - Opening edit modal for:", company)
    setSelectedCompany(company)
    setEditFormData({
      company: company.company || company.name || "",
      deliveryTime: company.deliveryTime || "",
      email: company.email || "",
      phone: company.phone || company.phoneNumber || "",
      isActive:
        company.isActive !== undefined ? company.isActive : company.active !== undefined ? company.active : true,
      basePrice: company.basePrice || 0,
      tax: company.tax || { value: 0, type: "percentage" },
      fuel: company.fuel || { value: 0, type: "percentage" },
      profit: company.profit || { value: 0, type: "percentage" },
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedCompany) return

    try {
      setEditLoading(true)
      console.log("[v0] Shipping Companies - Updating company:", selectedCompany._id, editFormData)

      await shippingCompaniesAPI.update(selectedCompany._id, editFormData)

      console.log("[v0] Shipping Companies - Update successful")

      // إعادة جلب البيانات بعد التحديث
      await fetchCompanies()

      // إغلاق المودال
      setEditModalOpen(false)
      setSelectedCompany(null)
    } catch (err: any) {
      console.error("[v0] Shipping Companies - Error updating company:", err)
      alert("فشل تحديث الشركة: " + err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const companyName = company.name || company.company || ""
    return companyName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة شركات الشحن</h1>
                  <p className="text-gray-500">إضافة وإدارة شركات الشحن</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة شركة
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الشركات</p>
                  <p className="text-3xl font-bold text-gray-900">{companies.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">نشطة</p>
                  <p className="text-3xl font-bold text-green-600">
                    {companies.filter((c) => c.isActive || c.active).length}
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
                  <p className="text-gray-500 mb-2">غير نشطة</p>
                  <p className="text-3xl font-bold text-red-600">
                    {companies.filter((c) => !c.isActive && !c.active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
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
                placeholder="البحث عن شركة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchCompanies}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد شركات شحن"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold">اسم الشركة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">البريد الإلكتروني</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">الهاتف</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">المناطق</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">الحالة</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCompanies.map((company) => {
                      const companyName = company.name || company.company || "شركة"
                      const companyEmail = company.email || "غير محدد"
                      const companyPhone = company.phone || company.phoneNumber || "غير محدد"
                      const regionsCount = company.regions?.length || company.regionsCount || 0
                      const isActive =
                        company.isActive !== undefined
                          ? company.isActive
                          : company.active !== undefined
                            ? company.active
                            : true

                      return (
                        <motion.tr
                          key={company._id || company.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-sky-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                {companyName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{companyEmail}</td>
                          <td className="px-6 py-4 text-gray-600">{companyPhone}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-sm font-medium">
                              {regionsCount} مناطق
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                                isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              {isActive ? "نشطة" : "غير نشطة"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditClick(company)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="تعديل الشركة"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="حذف الشركة"
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
            )}
          </div>
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !editLoading && setEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">تعديل شركة الشحن</h2>
                    <button
                      onClick={() => !editLoading && setEditModalOpen(false)}
                      disabled={editLoading}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
                    <input
                      type="text"
                      value={editFormData.company}
                      onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="أدخل اسم الشركة"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وقت التوصيل</label>
                    <input
                      type="text"
                      value={editFormData.deliveryTime}
                      onChange={(e) => setEditFormData({ ...editFormData, deliveryTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="مثال: 2-3 أيام عمل"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="example@company.com"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="05xxxxxxxx"
                      disabled={editLoading}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                      disabled={editLoading}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      تفعيل الشركة
                    </label>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الأسعار</h3>

                    {/* السعر الأساسي */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأساسي (ريال)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.basePrice}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, basePrice: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={editLoading}
                      />
                    </div>

                    {/* الضريبة */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">الضريبة (VAT)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.tax.value}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              tax: { ...editFormData.tax, value: Number.parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="0.00"
                          disabled={editLoading}
                        />
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                tax: { ...editFormData.tax, type: "percentage" },
                              })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.tax.type === "percentage"
                                ? "bg-white text-sky-600 shadow-sm"
                                : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <Percent className="w-4 h-4" />
                            نسبة
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({ ...editFormData, tax: { ...editFormData.tax, type: "fixed" } })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.tax.type === "fixed" ? "bg-white text-sky-600 shadow-sm" : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <DollarSign className="w-4 h-4" />
                            ثابت
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* الوقود */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">رسوم الوقود</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.fuel.value}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              fuel: { ...editFormData.fuel, value: Number.parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="0.00"
                          disabled={editLoading}
                        />
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                fuel: { ...editFormData.fuel, type: "percentage" },
                              })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.fuel.type === "percentage"
                                ? "bg-white text-sky-600 shadow-sm"
                                : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <Percent className="w-4 h-4" />
                            نسبة
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({ ...editFormData, fuel: { ...editFormData.fuel, type: "fixed" } })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.fuel.type === "fixed" ? "bg-white text-sky-600 shadow-sm" : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <DollarSign className="w-4 h-4" />
                            ثابت
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* هامش الربح */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">هامش الربح</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.profit.value}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              profit: { ...editFormData.profit, value: Number.parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                          placeholder="0.00"
                          disabled={editLoading}
                        />
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                profit: { ...editFormData.profit, type: "percentage" },
                              })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.profit.type === "percentage"
                                ? "bg-white text-sky-600 shadow-sm"
                                : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <Percent className="w-4 h-4" />
                            نسبة
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditFormData({ ...editFormData, profit: { ...editFormData.profit, type: "fixed" } })
                            }
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              editFormData.profit.type === "fixed" ? "bg-white text-sky-600 shadow-sm" : "text-gray-600"
                            }`}
                            disabled={editLoading}
                          >
                            <DollarSign className="w-4 h-4" />
                            ثابت
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* عرض السعر النهائي المحسوب */}
                    <div className="mt-6 p-4 bg-sky-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">السعر النهائي التقديري:</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {(() => {
                          let total = editFormData.basePrice
                          // حساب الضريبة
                          if (editFormData.tax.type === "percentage") {
                            total += (editFormData.basePrice * editFormData.tax.value) / 100
                          } else {
                            total += editFormData.tax.value
                          }
                          // حساب الوقود
                          if (editFormData.fuel.type === "percentage") {
                            total += (editFormData.basePrice * editFormData.fuel.value) / 100
                          } else {
                            total += editFormData.fuel.value
                          }
                          // حساب الربح
                          if (editFormData.profit.type === "percentage") {
                            total += (editFormData.basePrice * editFormData.profit.value) / 100
                          } else {
                            total += editFormData.profit.value
                          }
                          return total.toFixed(2)
                        })()} ريال
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                  <button
                    onClick={() => !editLoading && setEditModalOpen(false)}
                    disabled={editLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
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
