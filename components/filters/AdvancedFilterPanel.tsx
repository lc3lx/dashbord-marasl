"use client"

import { useState, useEffect } from "react"
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  MapPin,
  Package,
  Hash,
  Clock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FilterOption {
  label: string
  value: string
}

interface AdvancedFilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void
  filterOptions: {
    status?: FilterOption[]
    dateRange?: boolean
    priceRange?: boolean
    category?: FilterOption[]
    location?: FilterOption[]
    itemsRange?: boolean
    ordersRange?: boolean
    chargeStatus?: boolean
    customFilters?: {
      key: string
      label: string
      type: "select" | "text" | "number" | "date" | "multiselect"
      options?: FilterOption[]
      placeholder?: string
      icon?: any
    }[]
  }
}

export default function AdvancedFilterPanel({ onFilterChange, filterOptions }: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    date: true,
    timePeriod: true,
    price: true,
    category: true,
    location: true,
    items: true,
    orders: true,
    chargeStatus: true,
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    if (key === "timePeriod" && value !== "custom") {
      const dates = calculateDateRange(value)
      newFilters.dateFrom = dates.from
      newFilters.dateTo = dates.to
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const calculateDateRange = (period: string) => {
    const today = new Date()
    const from = new Date()

    switch (period) {
      case "today":
        from.setHours(0, 0, 0, 0)
        break
      case "thisWeek":
        const dayOfWeek = today.getDay()
        from.setDate(today.getDate() - dayOfWeek)
        from.setHours(0, 0, 0, 0)
        break
      case "thisMonth":
        from.setDate(1)
        from.setHours(0, 0, 0, 0)
        break
      case "thisYear":
        from.setMonth(0, 1)
        from.setHours(0, 0, 0, 0)
        break
      default:
        return { from: "", to: "" }
    }

    return {
      from: from.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    }
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const activeFiltersCount = Object.keys(filters).filter((key) => {
    const value = filters[key]
    return value !== "" && value !== null && value !== undefined
  }).length

  return (
    <div className="relative">
      

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[520px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Filter className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold">خيارات الفلترة المتقدمة</h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-white/90 text-sm mr-13">قم بتخصيص البحث حسب احتياجاتك بدقة</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Time Period Filter */}
                {filterOptions.dateRange && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("timePeriod")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">الفترة الزمنية</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.timePeriod ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.timePeriod && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 pr-7"
                        >
                          {["today", "thisWeek", "thisMonth", "thisYear", "custom"].map((period) => (
                            <label
                              key={period}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                              <input
                                type="radio"
                                name="timePeriod"
                                value={period}
                                checked={filters.timePeriod === period || (period === "custom" && !filters.timePeriod)}
                                onChange={(e) => handleFilterChange("timePeriod", e.target.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                                {period === "today" && "اليوم"}
                                {period === "thisWeek" && "هذا الأسبوع"}
                                {period === "thisMonth" && "هذا الشهر"}
                                {period === "thisYear" && "السنة الحالية"}
                                {period === "custom" && "تاريخ مخصص"}
                              </span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Custom Date Range */}
                {filterOptions.dateRange && (filters.timePeriod === "custom" || !filters.timePeriod) && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("date")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">نطاق التاريخ المخصص</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.date ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.date && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pr-7"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                            <input
                              type="date"
                              value={filters.dateFrom || ""}
                              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                            <input
                              type="date"
                              value={filters.dateTo || ""}
                              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Status Filter */}
                {filterOptions.status && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("status")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">الحالة</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.status ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.status && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 pr-7"
                        >
                          {filterOptions.status.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                              <input
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={filters.status === option.value}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Charge Status Filter */}
                {filterOptions.chargeStatus && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("chargeStatus")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">حالة الشحن</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.chargeStatus ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.chargeStatus && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 pr-7"
                        >
                          {[
                            { value: "all", label: "الكل", color: "blue" },
                            { value: "charged", label: "تم الشحن", color: "green" },
                            { value: "notCharged", label: "لم يتم الشحن", color: "red" },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={`flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-${option.color}-50 cursor-pointer transition-colors group`}
                            >
                              <input
                                type="radio"
                                name="chargeStatus"
                                value={option.value}
                                checked={!filters.chargeStatus || filters.chargeStatus === option.value}
                                onChange={(e) => handleFilterChange("chargeStatus", e.target.value)}
                                className={`w-4 h-4 text-${option.color}-600 focus:ring-2 focus:ring-${option.color}-500`}
                              />
                              <span className={`text-gray-700 group-hover:text-${option.color}-700 font-medium`}>
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Price Range Filter */}
                {filterOptions.priceRange && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("price")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">نطاق السعر / الإنفاق</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.price ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.price && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pr-7"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الأدنى (ر.س)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={filters.priceFrom || ""}
                              onChange={(e) => handleFilterChange("priceFrom", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الأقصى (ر.س)</label>
                            <input
                              type="number"
                              placeholder="100000"
                              value={filters.priceTo || ""}
                              onChange={(e) => handleFilterChange("priceTo", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Category Filter */}
                {filterOptions.category && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("category")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">الفئة / الدور</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.category ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.category && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 pr-7"
                        >
                          {filterOptions.category.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                              <input
                                type="radio"
                                name="category"
                                value={option.value}
                                checked={filters.category === option.value}
                                onChange={(e) => handleFilterChange("category", e.target.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Location Filter */}
                {filterOptions.location && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("location")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">الموقع</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.location ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.location && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pr-7"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">من مدينة</label>
                            <select
                              value={filters.locationFrom || ""}
                              onChange={(e) => handleFilterChange("locationFrom", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="">جميع المدن</option>
                              {filterOptions.location.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">إلى مدينة</label>
                            <select
                              value={filters.locationTo || ""}
                              onChange={(e) => handleFilterChange("locationTo", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="">جميع المدن</option>
                              {filterOptions.location.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Items Range Filter */}
                {filterOptions.itemsRange && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("items")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">عدد المنتجات</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.items ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.items && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pr-7"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={filters.itemsFrom || ""}
                              onChange={(e) => handleFilterChange("itemsFrom", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={filters.itemsTo || ""}
                              onChange={(e) => handleFilterChange("itemsTo", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Orders Range Filter */}
                {filterOptions.ordersRange && (
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection("orders")}
                      className="w-full flex items-center justify-between text-right group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Hash className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">عدد الطلبات</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.orders ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedSections.orders && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 pr-7"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={filters.ordersFrom || ""}
                              onChange={(e) => handleFilterChange("ordersFrom", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={filters.ordersTo || ""}
                              onChange={(e) => handleFilterChange("ordersTo", e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-3 relative z-10">
                {activeFiltersCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm"
                  >
                    <X className="w-5 h-5" />
                    مسح جميع الفلاتر ({activeFiltersCount})
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md"
                >
                  تطبيق الفلاتر
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
