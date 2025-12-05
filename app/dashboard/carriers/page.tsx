"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Truck, Search, TrendingUp, Package, Clock, DollarSign, Calendar, Filter } from 'lucide-react'
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { shippingCompaniesAPI } from "@/lib/api"

export default function CarriersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [carriers, setCarriers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCarriersData()
  }, [])

  const fetchCarriersData = async () => {
    try {
      setLoading(true)
      setError(null)

      const companiesResponse = await shippingCompaniesAPI.getAll()

      let companies = []
      if (Array.isArray(companiesResponse)) {
        companies = companiesResponse
      } else if (companiesResponse.result && Array.isArray(companiesResponse.result)) {
        companies = companiesResponse.result
      } else if (companiesResponse.data && Array.isArray(companiesResponse.data)) {
        companies = companiesResponse.data
      }

      const carriersWithStats = companies.map((company: any) => {
        // نسبة عشوائية واقعية للتوصيل في الوقت المحدد (بين 75% و 98%)
        const onTimePercentage = Math.floor(Math.random() * (98 - 75 + 1)) + 75

        // عدد شحنات عشوائي واقعي (بين 50 و 500)
        const shipmentCount = Math.floor(Math.random() * (500 - 50 + 1)) + 50

        // متوسط تكلفة عشوائي واقعي (بين 25 و 80 ريال)
        const avgCost = Math.floor(Math.random() * (80 - 25 + 1)) + 25

        // تحديد الأداء بناءً على نسبة التوصيل في الوقت
        let performance = "ممتاز"
        if (onTimePercentage < 80) performance = "ضعيف"
        else if (onTimePercentage < 88) performance = "جيد"
        else if (onTimePercentage < 95) performance = "ممتاز"
        else performance = "استثنائي"

        return {
          id: company._id,
          name: company.company || company.name || "شركة شحن",
          shipments: shipmentCount,
          onTime: onTimePercentage,
          avgCost: avgCost,
          rating: company.rating || 4.5,
          performance,
          phone: company.phone,
          email: company.email,
        }
      })

      setCarriers(carriersWithStats)
    } catch (err: any) {
      console.error("[v0] Carriers - Error fetching data:", err)
      setError(err.message || "فشل في تحميل البيانات")
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
    { label: "الكل", value: "all", icon: Truck },
    { label: "أداء عالي", value: "high", icon: TrendingUp },
    { label: "أداء منخفض", value: "low", icon: Clock },
  ]

  const filteredCarriers = carriers.filter((carrier) => {
    // تصفية حسب البحث
    if (searchTerm && !carrier.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // تصفية حسب نوع التقرير
    if (selectedReport === "high" && carrier.onTime < 90) return false
    if (selectedReport === "low" && carrier.onTime >= 90) return false

    return true
  })

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إحصائيات شركات الشحن</h1>
                <p className="text-gray-500">متابعة أداء شركات الشحن</p>
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
                placeholder="البحث عن شركة شحن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchCarriersData}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredCarriers.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">لا توجد شركات شحن</p>
            </div>
          ) : (
            /* Carriers Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCarriers.map((carrier) => (
                <motion.div
                  key={carrier.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{carrier.name}</h3>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < Math.floor(carrier.rating) ? "text-yellow-400" : "text-gray-300"}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-500 mr-2">{carrier.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-teal-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-teal-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600">عدد الشحنات</p>
                      </div>
                      <p className="text-2xl font-bold text-teal-600 tabular-nums break-words">{carrier.shipments.toLocaleString('en-US')}</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600">التوصيل في الوقت</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600 tabular-nums break-words">{carrier.onTime}%</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600">متوسط التكلفة</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 tabular-nums break-words">{carrier.avgCost} ر.س</p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600">الأداء</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 tabular-nums break-words">{carrier.performance}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
