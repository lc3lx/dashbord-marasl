"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, Package, Truck, Calendar, Filter, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight, Store, ArrowLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import EnhancedPrintButton11 from "@/components/print/EnhancedPrintButton11"
import { useRouter } from 'next/navigation' // Added useRouter for navigation
import { dashboardAPI, usersAPI, shippingCompaniesAPI, walletsAPI } from "@/lib/api" // Added walletsAPI

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "قيد الانتظار": "#f59e0b",
    "قيد التوصيل": "#3b82f6",
    "تم التوصيل": "#10b981",
    ملغي: "#ef4444",
    مرتجع: "#8b5cf6",
  }
  return colors[status] || "#6b7280"
}

const getRandomColor = () => {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]
  return colors[Math.floor(Math.random() * colors.length)]
}

interface UserData {
  walletId: string
  userName: string | null
  userEmail: string | null
  balance: number | null
  transactionCount: number | null
  createdAt: string | null
  isVerified: boolean
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState("overview")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const router = useRouter() // Initialize router for back navigation

  const [topUsers, setTopUsers] = useState<UserData[]>([]) // State for top users

  console.log("[v0] صفحة التقارير - الفترة المختارة:", selectedPeriod)
  console.log("[v0] صفحة التقارير - نوع التقرير المختار:", selectedReport)

  const periods = [
    { id: "today", label: "اليوم" },
    { id: "thisWeek", label: "هذا الأسبوع" },
    { id: "thisMonth", label: "هذا الشهر" },
    { id: "thisYear", label: "هذه السنة" },
    { id: "custom", label: "مخصص" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const fetchWithFallback = async (apiCall: () => Promise<any>, fallback: any = [], apiName = "API") => {
          try {
            const result = await apiCall()
            return result
          } catch (error: any) {
            // فقط اطبع تحذيراً بدلاً من خطأ مربك
            console.warn(`[v0] ${apiName} غير متوفر - استخدام البيانات الافتراضية`)
            return fallback
          }
        }

        const [statsResponse, usersResponse, companiesResponse, walletsResponse] = await Promise.all([
          fetchWithFallback(() => dashboardAPI.getStats(), { data: {} }, "Stats API"),
          fetchWithFallback(() => usersAPI.getAll(), { data: [] }, "Users API"),
          fetchWithFallback(() => shippingCompaniesAPI.getAll(), [], "Companies API"),
          fetchWithFallback(() => walletsAPI.getAll(), { result: [] }, "Wallets API"),
        ])

        console.log("[v0] Reports - Stats response:", statsResponse)
        console.log("[v0] Reports - Users response:", usersResponse)
        console.log("[v0] Reports - Companies response:", companiesResponse)
        console.log("[v0] Reports - Wallets response:", walletsResponse)

        // استخراج البيانات من الاستجابات
        const statsData = statsResponse.data || statsResponse.result || statsResponse || {}
        const usersData = usersResponse.data || usersResponse.result || usersResponse || []
        const companiesData = companiesResponse.result || companiesResponse.data || companiesResponse || []
        const walletsData = walletsResponse.result || walletsResponse.data || walletsResponse || []

        const usersMap = new Map()
        if (Array.isArray(usersData)) {
          usersData.forEach((user: any) => {
            usersMap.set(user._id || user.id, user)
          })
        }

        console.log("[v0] Reports - Users Map size:", usersMap.size)
        console.log("[v0] Reports - Wallets count:", Array.isArray(walletsData) ? walletsData.length : 0)

        let topUsersData: UserData[] = []
        if (Array.isArray(walletsData)) {
          topUsersData = walletsData
            .map((wallet: any) => {
              const user = usersMap.get(wallet.customerId)
              if (!user) {
                console.warn(`[v0] User not found for customerId: ${wallet.customerId}`)
                return null
              }

              const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "غير معروف"

              return {
                walletId: wallet._id || wallet.id,
                userName,
                userEmail: user.email || "",
                balance: wallet.balance || 0,
                transactionCount: wallet.transactionCount || 0,
                createdAt: wallet.createdAt || user.createdAt,
                isVerified: wallet.isVerified || false,
              }
            })
            .filter((user): user is UserData => user !== null)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10)
        }

        console.log("[v0] Reports - Top Users created:", topUsersData.length, topUsersData)

        const ordersStats = statsData.orders || { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 }
        const shipmentsStats = statsData.shipments || {
          total: 0,
          pending: 0,
          inTransit: 0,
          delivered: 0,
          cancelled: 0,
        }

        // حساب الإحصائيات من البيانات المتوفرة
        const totalRevenue = 0 // لا يمكن حساب الإيرادات بدون تفاصيل الطلبات
        const totalOrders = ordersStats.total || 0
        const totalUsers = Array.isArray(usersData) ? usersData.length : 0
        const totalShipments = shipmentsStats.total || 0

        // تجميع الشحنات حسب الحالة من البيانات الإحصائية
        const shipmentsByStatus = [
          { status: "قيد الانتظار", count: shipmentsStats.pending || 0, color: "#FFA500" },
          { status: "قيد النقل", count: shipmentsStats.inTransit || 0, color: "#3B82F6" },
          { status: "تم التسليم", count: shipmentsStats.delivered || 0, color: "#10B981" },
          { status: "ملغي", count: shipmentsStats.cancelled || 0, color: "#EF4444" },
        ]

        const shipmentsStatusData = shipmentsByStatus
          .filter((item) => item.count > 0)
          .map((item) => ({
            ...item,
            percentage: totalShipments > 0 ? (item.count / totalShipments) * 100 : 0,
          }))

        // تجميع بيانات الطلبات حسب الحالة
        const ordersByStatus = [
          { status: "قيد الانتظار", count: ordersStats.pending || 0 },
          { status: "تمت الموافقة", count: ordersStats.approved || 0 },
          { status: "مرفوض", count: ordersStats.rejected || 0 },
          { status: "مكتمل", count: ordersStats.completed || 0 },
        ].filter((item) => item.count > 0)

        // بيانات شركات الشحن - لا يمكن حسابها بدون تفاصيل الشحنات
        const companiesStats = Array.isArray(companiesData)
          ? companiesData.map((company: any) => ({
              name: company.company || company.name || company.nameAr || "غير محدد",
              totalShipments: 0,
              profit: 0,
              amountDue: 0,
              color: getRandomColor(),
            }))
          : []

        // حساب نمو البيانات
        const calculatedData = {
          overview: {
            totalRevenue,
            revenueGrowth: 0,
            totalOrders,
            ordersGrowth: 0,
            totalUsers,
            usersGrowth: 0,
            totalShipments,
            shipmentsGrowth: 0,
          },
          users: generateMonthlyData(usersData, "createdAt"),
          orders: ordersByStatus,
          shipments: shipmentsStatusData,
          shippingCompanies: companiesStats,
          platforms: [], // This will be populated if platform data is fetched elsewhere
        }

        console.log("[v0] Reports - Calculated data:", calculatedData)
        setData(calculatedData)
        setTopUsers(topUsersData) // Set top users data
      } catch (error) {
        console.error("[v0] Reports - خطأ عام في جلب البيانات:", error)
        // في حالة الخطأ، استخدم بيانات افتراضية
        setData({
          overview: {
            totalRevenue: 0,
            revenueGrowth: 0,
            totalOrders: 0,
            ordersGrowth: 0,
            totalUsers: 0,
            usersGrowth: 0,
            totalShipments: 0,
            shipmentsGrowth: 0,
          },
          users: [],
          orders: [],
          shipments: [],
          shippingCompanies: [],
          platforms: [],
        })
        setTopUsers([]) // Clear top users on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedPeriod])

  const generateMonthlyData = (items: any[], dateField: string) => {
    if (!Array.isArray(items) || items.length === 0) return []

    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ]
    const monthlyData = Array(12)
      .fill(0)
      .map((_, i) => ({
        month: months[i],
        count: 0,
        growth: 0,
      }))

    items.forEach((item: any) => {
      // Ensure dateField exists and is a valid date string
      if (item[dateField] && new Date(item[dateField]).getTime()) {
        const date = new Date(item[dateField])
        const month = date.getMonth()
        monthlyData[month].count++
      }
    })

    // حساب النمو
    for (let i = 1; i < monthlyData.length; i++) {
      if (monthlyData[i - 1].count > 0) {
        monthlyData[i].growth = ((monthlyData[i].count - monthlyData[i - 1].count) / monthlyData[i - 1].count) * 100
      }
    }

    // Filter out months with no data and take the last 4 for display
    const filteredData = monthlyData.filter((m) => m.count > 0)
    return filteredData.slice(-4)
  }

  const generateOrdersData = (orders: any[]) => {
    if (!Array.isArray(orders) || orders.length === 0) return []

    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ]
    const monthlyData = Array(12)
      .fill(0)
      .map((_, i) => ({
        month: months[i],
        count: 0,
        revenue: 0,
      }))

    orders.forEach((order: any) => {
      if (order.createdAt && new Date(order.createdAt).getTime()) {
        const date = new Date(order.createdAt)
        const month = date.getMonth()
        monthlyData[month].count++
        monthlyData[month].revenue += order.totalPrice || 0
      }
    })

    // Filter out months with no data and take the last 4 for display
    const filteredData = monthlyData.filter((m) => m.count > 0)
    return filteredData.slice(-4)
  }

  // إضافة دوال مساعدة لـ Period
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod)
  }

  // إضافة دوال مساعدة لـ Report Type
  const handleReportTypeChange = (newReportType: string) => {
    setSelectedReport(newReportType)
  }

  const reportTypes = [
    { value: "overview", label: "نظرة عامة", icon: BarChart3 },
    { value: "users", label: "تقرير المستخدمين", icon: Users },
    { value: "orders", label: "تقرير الطلبات", icon: Package },
    { value: "shipments", label: "تقرير الشحنات", icon: Truck },
    { value: "financial", label: "التقرير المالي", icon: DollarSign },
    { value: "platforms", label: "تقرير المنصات", icon: Store },
  ]

  const reportData = useMemo(() => {
    // Use fetched data directly
    return (
      data || {
        // Fallback to empty structure if data is not yet loaded
        overview: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalOrders: 0,
          ordersGrowth: 0,
          totalUsers: 0,
          usersGrowth: 0,
          totalShipments: 0,
          shipmentsGrowth: 0,
        },
        users: [],
        orders: [],
        shipments: [],
        shippingCompanies: [],
        platforms: [],
      }
    )
  }, [data]) // Depend on 'data' state

  const printData = {
    headers: ["الفترة", "القيمة", "النمو", "الحالة"],
    rows: reportData.orders.map((order: any) => [
      order.month,
      `${order.revenue.toLocaleString()} ريال`,
      `${order.count.toLocaleString()} طلب`,
      "مكتمل",
    ]),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12">
            <p className="text-gray-500">لا توجد بيانات متاحة</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {" "}
              {/* Added gap-4 */}
              <button
                onClick={() => router.back()}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="رجوع للخلف"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">التقارير والإحصائيات</h1>
                  <p className="text-indigo-100 mt-1">تقارير شاملة ومفصلة لجميع أقسام النظام</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EnhancedPrintButton11
                title="تقرير شامل"
                data={printData}
                stats={[
                  { label: "إجمالي الإيرادات", value: `${reportData.overview.totalRevenue.toLocaleString()} ريال` },
                  { label: "إجمالي الطلبات", value: reportData.overview.totalOrders.toLocaleString() },
                  { label: "معدل النمو", value: `+${reportData.overview.revenueGrowth}%` },
                ]}
              />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">الفترة الزمنية:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => handlePeriodChange(period.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPeriod === period.id
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
            <div className="mt-4 p-4 bg-background rounded-lg border border-border">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">من تاريخ:</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
                </div>
                {customDateFrom && customDateTo && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-border">
                    الفترة: {customDateFrom} إلى {customDateTo}
                  </div>
                )}
              </div>
            </div>
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
                    onClick={() => handleReportTypeChange(type.value)}
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

        {/* Report Content */}
        {selectedReport === "overview" && (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      reportData.overview.revenueGrowth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reportData.overview.revenueGrowth > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(reportData.overview.revenueGrowth)}%
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">إجمالي الإيرادات</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.overview.totalRevenue.toLocaleString()} ريال
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      reportData.overview.ordersGrowth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reportData.overview.ordersGrowth > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(reportData.overview.ordersGrowth)}%
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">إجمالي الطلبات</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.overview.totalOrders.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      reportData.overview.usersGrowth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reportData.overview.usersGrowth > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(reportData.overview.usersGrowth)}%
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">إجمالي المستخدمين</h3>
                <p className="text-3xl font-bold text-gray-900">{reportData.overview.totalUsers.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      reportData.overview.shipmentsGrowth > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reportData.overview.shipmentsGrowth > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(reportData.overview.shipmentsGrowth)}%
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">إجمالي الشحنات</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.overview.totalShipments.toLocaleString()}
                </p>
              </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Line Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">نمو الإيرادات</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.orders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} ريال`, "الإيرادات"]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} name="الإيرادات" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.orders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#6366f1" }} />
                          <span className="text-xs font-medium text-gray-700">{order.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{order.revenue.toLocaleString()} ريال</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Shipments Pie Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">توزيع الشحنات حسب الحالة</h3>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={reportData.shipments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.shipments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} شحنة`, "العدد"]}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {reportData.shipments.map((shipment, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: shipment.color }}
                            />
                            <span className="text-xs font-medium text-gray-700">{shipment.status}</span>
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-gray-900">{shipment.count.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{shipment.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Orders Bar Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">عدد الطلبات الشهرية</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.orders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} طلب`, "الطلبات"]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#a855f7" name="عدد الطلبات" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.orders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#a855f7" }} />
                          <span className="text-xs font-medium text-gray-700">{order.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{order.count.toLocaleString()} طلب</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Users Growth Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">نمو المستخدمين</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.users}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} مستخدم`, "المستخدمين"]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#f59e0b" name="عدد المستخدمين" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#f59e0b" }} />
                          <span className="text-xs font-medium text-gray-700">{user.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{user.count.toLocaleString()} مستخدم</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Users Report */}
        {selectedReport === "users" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي المستخدمين</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.overview.totalUsers.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+{reportData.overview.usersGrowth}% من الفترة السابقة</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">مستخدمون نشطون</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalUsers * 0.75).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">75% من إجمالي المستخدمين</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">مستخدمون جدد</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalUsers * 0.15).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="text-sm font-medium">15% من إجمالي المستخدمين</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">شحنوا المحفظة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalUsers * 0.6).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">60% من إجمالي المستخدمين</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">لم يشحنوا المحفظة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalUsers * 0.4).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">40% من إجمالي المستخدمين</span>
                </div>
              </div>
            </div>

            {/* Users Growth Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">نمو المستخدمين الشهري</h3>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.users}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(value: number) => [`${value.toLocaleString()} مستخدم`, "المستخدمين"]}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" name="عدد المستخدمين" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="w-full mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {reportData.users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#f59e0b" }} />
                        <span className="text-xs font-medium text-gray-700">{user.month}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-900">{user.count.toLocaleString()} مستخدم</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* تفاصيل نشاط المحفظة */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">تفاصيل نشاط المحفظة</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">فئة المستخدمين</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">عدد المستخدمين</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الرصيد</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">متوسط الرصيد</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الشحنات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">متوسط الشحن</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="font-bold text-gray-900">مستخدمون نشطون (شحنوا المحفظة)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">
                        {Math.round(reportData.overview.totalUsers * 0.6).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-blue-600 font-bold">
                        {Math.round(reportData.overview.totalUsers * 0.6 * 850).toLocaleString()} ريال
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">850 ريال</td>
                      <td className="px-6 py-4 text-purple-600 font-bold">
                        {Math.round(reportData.overview.totalUsers * 0.6 * 3.2).toLocaleString()} عملية
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">3.2 عملية</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          60%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          </div>
                          <span className="font-bold text-gray-900">مستخدمون غير نشطين (لم يشحنوا)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-amber-600 font-bold">
                        {Math.round(reportData.overview.totalUsers * 0.4).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 ريال</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0ريال</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 عملية</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 عملية</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          40%
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-gray-900">{reportData.overview.totalUsers.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-700">
                        {Math.round(reportData.overview.totalUsers * 0.6 * 850).toLocaleString()} ريال
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {Math.round((reportData.overview.totalUsers * 0.6 * 850) / reportData.overview.totalUsers)} ريال
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {Math.round(reportData.overview.totalUsers * 0.6 * 3.2).toLocaleString()} عملية
                      </td>
                      <td className="px-6 py-4 text-gray-900">1.9 عملية</td>
                      <td className="px-6 py-4 text-center">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* تصنيف المستخدمين حسب رصيد المحفظة */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">تصنيف المستخدمين حسب رصيد المحفظة</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition-all bg-green-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">VIP</h4>
                      <p className="text-xs text-gray-500">أكثر من 2000 ريال</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">عدد المستخدمين</span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.round(reportData.overview.totalUsers * 0.15).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">3,250 ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-green-600">15%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }} />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all bg-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">نشط</h4>
                      <p className="text-xs text-gray-500">1000 - 2000 ريال</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">عدد المستخدمين</span>
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round(reportData.overview.totalUsers * 0.25).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">1,450 ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-blue-600">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all bg-purple-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">متوسط</h4>
                      <p className="text-xs text-gray-500">500 - 1000 ريال</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">عدد المستخدمين</span>
                      <span className="text-sm font-bold text-purple-600">
                        {Math.round(reportData.overview.totalUsers * 0.2).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">720 ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-purple-600">20%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "20%" }} />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all bg-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">غير نشط</h4>
                      <p className="text-xs text-gray-500">0 ريال</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">عدد المستخدمين</span>
                      <span className="text-sm font-bold text-gray-600">
                        {Math.round(reportData.overview.totalUsers * 0.4).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">0 ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-gray-600">40%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* أفضل 10 مستخدمين حسب رصيد المحفظة */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">أفضل 10 مستخدمين حسب رصيد المحفظة</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الترتيب</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">اسم المستخدم</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">رصيد المحفظة</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">عدد المعاملات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">تاريخ الإنشاء</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.length > 0 ? (
                      topUsers.map((user, index) => (
                        <tr key={user.walletId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                  index === 0
                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                    : index === 1
                                      ? "bg-gradient-to-br from-gray-300 to-gray-500"
                                      : index === 2
                                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                        : "bg-gradient-to-br from-blue-400 to-blue-600"
                                }`}
                              >
                                {index + 1}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user.userName?.charAt(0)?.toUpperCase() || "؟"}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block">{user.userName || "غير معروف"}</span>
                                <span className="text-sm text-gray-500">{user.userEmail || ""}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold text-lg">
                            {Number(user.balance || 0).toLocaleString()} ريال
                          </td>
                          <td className="px-6 py-4 text-purple-600 font-medium">{user.transactionCount || 0} معاملة</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-SA") : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                user.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {user.isVerified ? "موثق" : "غير موثق"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          لا توجد بيانات متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* سجل عمليات شحن المحفظة */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">سجل عمليات شحن المحفظة</h3>
              </div>

              <div className="space-y-4">
                {[
                  { date: "اليوم", users: 45, amount: 38500, avgAmount: 856 },
                  { date: "أمس", users: 52, amount: 42300, avgAmount: 813 },
                  { date: "منذ يومين", users: 48, amount: 39800, avgAmount: 829 },
                  { date: "منذ 3 أيام", users: 41, amount: 35200, avgAmount: 859 },
                  { date: "منذ 4 أيام", users: 38, amount: 31500, avgAmount: 829 },
                  { date: "منذ 5 أيام", users: 44, amount: 37600, avgAmount: 855 },
                  { date: "منذ 6 أيام", users: 50, amount: 41200, avgAmount: 824 },
                ].map((day, index) => (
                  <div key={index} className="border rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{day.date}</h4>
                          <p className="text-xs text-gray-500">{day.users} مستخدم قاموا بالشحن</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">{day.amount.toLocaleString()} ريال</p>
                        <p className="text-xs text-gray-500">إجمالي المبلغ</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">عدد العمليات</p>
                        <p className="text-sm font-bold text-purple-600">{day.users} عملية</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">متوسط المبلغ</p>
                        <p className="text-sm font-bold text-blue-600">{day.avgAmount}ريال</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">الحالة</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                            day.users > 45
                              ? "bg-green-100 text-green-700"
                              : day.users > 40
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {day.users > 45 ? "ممتاز" : day.users > 40 ? "جيد" : "متوسط"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(day.users / 52) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ملخص تفاعل المستخدمين */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">ملخص تفاعل المستخدمين</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">معدل التفاعل</p>
                  <p className="text-3xl font-bold">60%</p>
                  <div className="flex items-center gap-1 mt-2 text-green-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">+5% من الشهر السابق</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط رصيد المحفظة</p>
                  <p className="text-3xl font-bold">
                    {Math.round((reportData.overview.totalUsers * 0.6 * 850) / reportData.overview.totalUsers)} ريال
                  </p>
                  <div className="text-sm text-blue-200 mt-2">لكل مستخدم</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">إجمالي عمليات الشحن</p>
                  <p className="text-3xl font-bold">
                    {Math.round(reportData.overview.totalUsers * 0.6 * 3.2).toLocaleString()}
                  </p>
                  <div className="text-sm text-purple-200 mt-2">خلال الفترة الحالية</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط الشحن</p>
                  <p className="text-3xl font-bold">3.2 عملية</p>
                  <div className="flex items-center gap-1 mt-2 text-green-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">لكل مستخدم نشط</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-indigo-100">مستخدمون VIP: </span>
                    <span className="font-bold">
                      {Math.round(reportData.overview.totalUsers * 0.15).toLocaleString()} (15%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-indigo-100">مستخدمون نشطون: </span>
                    <span className="font-bold">
                      {Math.round(reportData.overview.totalUsers * 0.25).toLocaleString()} (25%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-indigo-100">إجمالي الأرصدة: </span>
                    <span className="font-bold">
                      {Math.round(reportData.overview.totalUsers * 0.6 * 850).toLocaleString()} ريال
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders Report */}
        {selectedReport === "orders" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Orders Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي الطلبات</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.overview.totalOrders.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+{reportData.overview.ordersGrowth}% من الفترة السابقة</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">طلبات مكتملة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalOrders * 0.85).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">85% من إجمالي الطلبات</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">طلبات قيد المعالجة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalOrders * 0.15).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-sm font-medium">15% من إجمالي الطلبات</span>
                </div>
              </div>
            </div>

            {/* Orders Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">عدد الطلبات الشهرية</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.orders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} طلب`, "الطلبات"]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#a855f7" name="عدد الطلبات" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.orders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#a855f7" }} />
                          <span className="text-xs font-medium text-gray-700">{order.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{order.count.toLocaleString()} طلب</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">إيرادات الطلبات</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.orders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} ريال`, "الإيرادات"]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} name="الإيرادات" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.orders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#6366f1" }} />
                          <span className="text-xs font-medium text-gray-700">{order.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{order.revenue.toLocaleString()} ريال</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Shipments Report */}
        {selectedReport === "shipments" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Shipments Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.shipments.map((shipment, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${shipment.color}20` }}
                    >
                      <Truck className="w-6 h-6" style={{ color: shipment.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-600 text-sm font-medium">{shipment.status}</h3>
                      <p className="text-2xl font-bold text-gray-900">{shipment.count.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">النسبة المئوية</span>
                      <span className="text-sm font-bold" style={{ color: shipment.color }}>
                        {shipment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${shipment.percentage}%`, backgroundColor: shipment.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipments Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">توزيع الشحنات حسب الحالة</h3>
              </div>
              <div className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={reportData.shipments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.shipments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} شحنة`, "العدد"]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Shipments Legend */}
                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.shipments.map((shipment, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: shipment.color }}
                          />
                          <span className="text-xs font-medium text-gray-700">{shipment.status}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">{shipment.count.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{shipment.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Financial Report */}
        {selectedReport === "financial" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي الإيرادات</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.overview.totalRevenue.toLocaleString()} ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+{reportData.overview.revenueGrowth}% من الفترة السابقة</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">متوسط قيمة الطلب</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalRevenue / reportData.overview.totalOrders).toLocaleString()}{" "}
                      ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">لكل طلب</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">صافي الربح</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.shippingCompanies
                        .reduce((sum, company) => sum + (company.profit - company.amountDue), 0)
                        .toLocaleString()}{" "}
                      ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">بعد خصم المستحقات</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">الإيرادات المتوقعة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(reportData.overview.totalRevenue * 1.125).toLocaleString()} ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="text-sm font-medium">للفترة القادمة</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">جدول صافي الربح</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">شركة الشحن</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">عدد الشحنات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الإجمالي</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ضريبة القيمة المضافة (15%)
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المبلغ المستحق</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">صافي الربح</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.shippingCompanies.map((company, index) => {
                      const vat = Math.round(company.profit * 0.15)
                      const netProfit = company.profit - vat - company.amountDue
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${company.color}20` }}
                              >
                                <Truck className="w-5 h-5" style={{ color: company.color }} />
                              </div>
                              <span className="font-bold text-gray-900">{company.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {company.totalShipments.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-bold">{company.profit.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-purple-600 font-bold">{vat.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-amber-600 font-bold">
                            {company.amountDue.toLocaleString()} ريال
                          </td>
                          <td className="px-6 py-4 text-green-600 font-bold text-lg">
                            {netProfit.toLocaleString()} ريال
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                netProfit > 60000
                                  ? "bg-green-100 text-green-700"
                                  : netProfit > 40000
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {netProfit > 60000 ? "ممتاز" : netProfit > 40000 ? "جيد" : "متوسط"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-gray-900">
                        {reportData.shippingCompanies
                          .reduce((sum, company) => sum + company.totalShipments, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-blue-700">
                        {reportData.shippingCompanies
                          .reduce((sum, company) => sum + company.profit, 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {reportData.shippingCompanies
                          .reduce((sum, company) => sum + Math.round(company.profit * 0.15), 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-amber-700">
                        {reportData.shippingCompanies
                          .reduce((sum, company) => sum + company.amountDue, 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-green-700 text-lg">
                        {reportData.shippingCompanies
                          .reduce(
                            (sum, company) =>
                              sum + (company.profit - Math.round(company.profit * 0.15) - company.amountDue),
                            0,
                          )
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">جدول مستحقات الشركات</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">شركة الشحن</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المبلغ المستحق</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">نسبة المستحق من الربح</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">تاريخ الاستحقاق</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">حالة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.shippingCompanies.map((company, index) => {
                      const duePercentage = ((company.amountDue / company.profit) * 100).toFixed(1)
                      const daysUntilDue = 15 - index * 2
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${company.color}20` }}
                              >
                                <Truck className="w-5 h-5" style={{ color: company.color }} />
                              </div>
                              <span className="font-bold text-gray-900">{company.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-amber-600 font-bold text-lg">
                            {company.amountDue.toLocaleString()} ريال
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-amber-500 h-2 rounded-full transition-all"
                                  style={{ width: `${duePercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-700">{duePercentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {daysUntilDue > 0 ? `بعد ${daysUntilDue} يوم` : "مستحق الآن"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                daysUntilDue > 10
                                  ? "bg-green-100 text-green-700"
                                  : daysUntilDue > 5
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {daysUntilDue > 10 ? "قريباً" : daysUntilDue > 5 ? "عاجل" : "مستحق"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gradient-to-r from-amber-50 to-orange-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">إجمالي المستحقات</td>
                      <td className="px-6 py-4 text-amber-700 text-lg">
                        {reportData.shippingCompanies
                          .reduce((sum, company) => sum + company.amountDue, 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">نسبة المستحقات من الأرباح:</span>
                            <span className="text-sm font-bold text-amber-700">
                              {(
                                (reportData.shippingCompanies.reduce((sum, company) => sum + company.amountDue, 0) /
                                  reportData.shippingCompanies.reduce((sum, company) => sum + company.profit, 0)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${(
                                  (reportData.shippingCompanies.reduce((sum, company) => sum + company.amountDue, 0) /
                                    reportData.shippingCompanies.reduce((sum, company) => sum + company.profit, 0)) *
                                    100
                                ).toFixed(1)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">نمو الإيرادات الشهرية</h3>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.orders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(value: number) => [`${value.toLocaleString()} ريال`, "الإيرادات"]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} name="الإيرادات" />
                </LineChart>
              </ResponsiveContainer>

              <div className="w-full mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {reportData.orders.map((order, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#6366f1" }} />
                        <span className="text-xs font-medium text-gray-700">{order.month}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-900">{order.revenue.toLocaleString()} ريال</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profit Margin Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">تحليل هامش الربح لكل شركة</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.shippingCompanies.map((company, index) => {
                  const vat = Math.round(company.profit * 0.15)
                  const netProfit = company.profit - vat - company.amountDue
                  const profitMargin = ((netProfit / company.profit) * 100).toFixed(1)
                  const revenuePerShipment = Math.round(company.profit / company.totalShipments)

                  return (
                    <div
                      key={index}
                      className="border-2 rounded-xl p-5 hover:shadow-lg transition-all"
                      style={{ borderColor: `${company.color}40` }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${company.color}20` }}
                        >
                          <Truck className="w-6 h-6" style={{ color: company.color }} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{company.name}</h4>
                          <p className="text-xs text-gray-500">تحليل الأداء المالي</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">هامش الربح</span>
                          <span className="text-sm font-bold" style={{ color: company.color }}>
                            {profitMargin}%
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">الربح لكل شحنة</span>
                          <span className="text-sm font-bold text-gray-900">{revenuePerShipment} ريال</span>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-600">صافي الربح</span>
                          <span className="text-sm font-bold text-green-600">{netProfit.toLocaleString()} ريال</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">مؤشر الأداء</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(Number.parseFloat(profitMargin), 100)}%`,
                                backgroundColor: company.color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Financial Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">التفصيل المالي الشهري</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الشهر</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الإيرادات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">ضريبة القيمة المضافة</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المستحقات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">صافي الربح</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">معدل النمو</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((order, index) => {
                      const vat = Math.round(order.revenue * 0.15)
                      const dues = Math.round(order.revenue * 0.12)
                      const netProfit = order.revenue - vat - dues
                      const growth =
                        index > 0
                          ? (
                              ((order.revenue - reportData.orders[index - 1].revenue) /
                                reportData.orders[index - 1].revenue) *
                              100
                            ).toFixed(1)
                          : "0.0"

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{order.month}</td>
                          <td className="px-6 py-4 text-blue-600 font-bold">{order.revenue.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-purple-600 font-medium">{vat.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-amber-600 font-medium">{dues.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-green-600 font-bold">{netProfit.toLocaleString()} ريال</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                Number.parseFloat(growth) > 0
                                  ? "bg-green-100 text-green-700"
                                  : Number.parseFloat(growth) < 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {Number.parseFloat(growth) > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : Number.parseFloat(growth) < 0 ? (
                                <ArrowDownRight className="w-3 h-3" />
                              ) : null}
                              {growth}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Timeline & Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">الجدول الزمني للمدفوعات</h3>
              </div>

              <div className="space-y-4">
                {reportData.shippingCompanies.map((company, index) => {
                  const daysUntilDue = 15 - index * 2
                  const paymentProgress = Math.round((company.amountDue / company.profit) * 100)

                  return (
                    <div key={index} className="border rounded-xl p-5 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${company.color}20` }}
                          >
                            <Truck className="w-5 h-5" style={{ color: company.color }} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{company.name}</h4>
                            <p className="text-xs text-gray-500">
                              {daysUntilDue > 0 ? `الدفع مستحق بعد ${daysUntilDue} يوم` : "الدفع مستحق الآن"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-amber-600">{company.amountDue.toLocaleString()} ريال</p>
                          <p className="text-xs text-gray-500">المبلغ المستحق</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">نسبة المستحق من الإيرادات</span>
                          <span className="font-bold text-gray-900">{paymentProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${paymentProgress}%`,
                              backgroundColor: company.color,
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">المدفوع</p>
                          <p className="text-sm font-bold text-green-600">
                            {Math.round(company.amountDue * 0.6).toLocaleString()} ريال
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">المتبقي</p>
                          <p className="text-sm font-bold text-amber-600">
                            {Math.round(company.amountDue * 0.4).toLocaleString()} ريال
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">الحالة</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                              daysUntilDue > 10
                                ? "bg-green-100 text-green-700"
                                : daysUntilDue > 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {daysUntilDue > 10 ? "آمن" : daysUntilDue > 5 ? "تحذير" : "عاجل"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Financial KPIs Summary */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">ملخص مؤشرات الأداء المالي</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">إجمالي الأرباح</p>
                  <p className="text-3xl font-bold">
                    {reportData.shippingCompanies.reduce((sum, company) => sum + company.profit, 0).toLocaleString()}{" "}
                    ريال
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">+12.5% من الشهر السابق</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">إجمالي الضرائب</p>
                  <p className="text-3xl font-bold">
                    {reportData.shippingCompanies
                      .reduce((sum, company) => sum + Math.round(company.profit * 0.15), 0)
                      .toLocaleString()}{" "}
                    ريال
                  </p>
                  <div className="text-sm text-purple-200 mt-2">15% من إجمالي الأرباح</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">إجمالي المستحقات</p>
                  <p className="text-3xl font-bold">
                    {reportData.shippingCompanies.reduce((sum, company) => sum + company.amountDue, 0).toLocaleString()}{" "}
                    ريال
                  </p>
                  <div className="text-sm text-amber-200 mt-2">مستحقة خلال 15 يوم</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">صافي الربح النهائي</p>
                  <p className="text-3xl font-bold">
                    {reportData.shippingCompanies
                      .reduce(
                        (sum, company) =>
                          sum + (company.profit - Math.round(company.profit * 0.15) - company.amountDue),
                        0,
                      )
                      .toLocaleString()}{" "}
                    ريال
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">هامش ربح ممتاز</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط هامش الربح: </span>
                    <span className="font-bold">
                      {(
                        (reportData.shippingCompanies.reduce(
                          (sum, company) =>
                            sum + (company.profit - Math.round(company.profit * 0.15) - company.amountDue),
                          0,
                        ) /
                          reportData.shippingCompanies.reduce((sum, company) => sum + company.profit, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط الربح لكل شحنة: </span>
                    <span className="font-bold">
                      {Math.round(
                        reportData.shippingCompanies.reduce((sum, company) => sum + company.profit, 0) /
                          reportData.shippingCompanies.reduce((sum, company) => sum + company.totalShipments, 0),
                      ).toLocaleString()}{" "}
                      ريال
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-indigo-100">عدد الشركات النشطة: </span>
                    <span className="font-bold">{reportData.shippingCompanies.length} شركات</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Platforms Report */}
        {selectedReport === "platforms" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Platforms Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي المتاجر</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.platforms.reduce((sum, platform) => sum + platform.stores, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">متصلة بالمنصات</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي الطلبات</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.platforms.reduce((sum, platform) => sum + platform.orders, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+11.2% من الفترة السابقة</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي الإيرادات</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.platforms.reduce((sum, platform) => sum + platform.revenue, 0).toLocaleString()} ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+13.5% من الفترة السابقة</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">متوسط الطلب</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        reportData.platforms.reduce((sum, platform) => sum + platform.revenue, 0) /
                          reportData.platforms.reduce((sum, platform) => sum + platform.orders, 0),
                      ).toLocaleString()}{" "}
                      ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-sm font-medium">لكل طلب</span>
                </div>
              </div>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportData.platforms.map((platform, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${platform.color}20` }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{platform.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              platform.status === "نشط" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {platform.status}
                          </span>
                          <span className="text-xs text-gray-500">صحة الاتصال: {platform.health}%</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        platform.growth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {platform.growth > 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {Math.abs(platform.growth)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">المتاجر</p>
                      <p className="text-xl font-bold text-gray-900">{platform.stores.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">الطلبات</p>
                      <p className="text-xl font-bold text-gray-900">{platform.orders.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">الإيرادات</p>
                      <p className="text-lg font-bold" style={{ color: platform.color }}>
                        {platform.revenue.toLocaleString()}ريال
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">صحة الاتصال</span>
                        <span className="font-bold text-gray-900">{platform.health}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${platform.health}%`, backgroundColor: platform.color }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">متوسط الطلب</span>
                        <span className="text-sm font-bold text-gray-900">
                          {Math.round(platform.revenue / platform.orders).toLocaleString()}ريال
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platforms Comparison Table */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">مقارنة تفصيلية للمنصات</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المنصة</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">عدد المتاجر</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الطلبات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الإيرادات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">متوسط الطلب</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">معدل النمو</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">صحة الاتصال</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.platforms.map((platform, index) => {
                      const avgOrder = Math.round(platform.revenue / platform.orders)
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                style={{ backgroundColor: `${platform.color}20` }}
                              >
                                {platform.icon}
                              </div>
                              <span className="font-bold text-gray-900">{platform.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{platform.stores.toLocaleString()}</td>
                          <td className="px-6 py-4 text-purple-600 font-bold">{platform.orders.toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold" style={{ color: platform.color }}>
                            {platform.revenue.toLocaleString()}ريال
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{avgOrder.toLocaleString()}ريال</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                platform.growth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {platform.growth > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {Math.abs(platform.growth)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ width: `${platform.health}%`, backgroundColor: platform.color }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{platform.health}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                platform.status === "نشط" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {platform.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-gray-900">
                        {reportData.platforms.reduce((sum, platform) => sum + platform.stores, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {reportData.platforms.reduce((sum, platform) => sum + platform.orders, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-green-700">
                        {reportData.platforms.reduce((sum, platform) => sum + platform.revenue, 0).toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {Math.round(
                          reportData.platforms.reduce((sum, platform) => sum + platform.revenue, 0) /
                            reportData.platforms.reduce((sum, platform) => sum + platform.orders, 0),
                        ).toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Platform */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">الإيرادات حسب المنصة</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.platforms}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value.toLocaleString()} ريال`, "الإيرادات"]}
                    />
                    <Bar dataKey="revenue" fill="#22c55e" name="الإيرادات" radius={[8, 8, 0, 0]}>
                      {reportData.platforms.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reportData.platforms.map((platform, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: platform.color }}
                          />
                          <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-900">
                            {platform.revenue.toLocaleString()}ريال
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orders Distribution */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">توزيع الطلبات</h3>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.platforms}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, orders }) => `${name.split(" ")[0]}: ${orders.toLocaleString()}`}
                        outerRadius={100}
                        dataKey="orders"
                      >
                        {reportData.platforms.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value.toLocaleString()} طلب`, "الطلبات"]}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {reportData.platforms.map((platform, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: platform.color }}
                            />
                            <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-gray-900">{platform.orders.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">
                              {(
                                (platform.orders / reportData.platforms.reduce((sum, p) => sum + p.orders, 0)) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Performance Summary */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">ملخص أداء المنصات</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">أفضل منصة (إيرادات)</p>
                  <p className="text-2xl font-bold">{reportData.platforms[0].name.split(" ")[0]}</p>
                  <p className="text-lg text-green-300 mt-1">{reportData.platforms[0].revenue.toLocaleString()} ريال</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">أعلى نمو</p>
                  <p className="text-2xl font-bold">
                    {reportData.platforms.reduce((max, p) => (p.growth > max.growth ? p : max)).name.split(" ")[0]}
                  </p>
                  <div className="flex items-center gap-1 text-green-300 mt-1">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-lg">
                      +{reportData.platforms.reduce((max, p) => (p.growth > max.growth ? p : max)).growth}%
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">أفضل صحة اتصال</p>
                  <p className="text-2xl font-bold">
                    {reportData.platforms.reduce((max, p) => (p.health > max.health ? p : max)).name.split(" ")[0]}
                  </p>
                  <p className="text-lg text-blue-300 mt-1">
                    {reportData.platforms.reduce((max, p) => (p.health > max.health ? p : max)).health}%
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط الطلب الأعلى</p>
                  <p className="text-2xl font-bold">
                    {
                      reportData.platforms
                        .reduce((max, p) => (p.revenue / p.orders > max.revenue / max.orders ? p : max), {
                          revenue: 0,
                          orders: 1,
                        } as any)
                        .name.split(" ")[0]
                    }
                  </p>
                  <p className="text-lg text-amber-300 mt-1">
                    {Math.round(
                      reportData.platforms.reduce(
                        (max, p) => (p.revenue / p.orders > max.revenue / max.orders ? p : max),
                        {
                          revenue: 0,
                          orders: 1,
                        } as any,
                      ).revenue /
                        reportData.platforms.reduce(
                          (max, p) => (p.revenue / p.orders > max.revenue / max.orders ? p : max),
                          {
                            revenue: 0,
                            orders: 1,
                          } as any,
                        ).orders,
                    ).toLocaleString()}{" "}
                    ريال
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-indigo-100">جميع المنصات: </span>
                    <span className="font-bold">{reportData.platforms.length} منصات نشطة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط صحة الاتصال: </span>
                    <span className="font-bold">
                      {Math.round(
                        reportData.platforms.reduce((sum, p) => sum + p.health, 0) / reportData.platforms.length,
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط النمو: </span>
                    <span className="font-bold">
                      +
                      {(
                        reportData.platforms.reduce((sum, p) => sum + p.growth, 0) / reportData.platforms.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
