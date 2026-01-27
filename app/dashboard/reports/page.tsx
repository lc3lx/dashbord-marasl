"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, Package, Truck, Calendar, Filter, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight, Store, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
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
import { dashboardAPI, usersAPI, adminPlatformsAPI, adminOrdersAPI, transactionsAPI } from "@/lib/api"

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
  userName: string
  userEmail: string
  balance: number
  transactionCount: number
  createdAt?: string
  isVerified: boolean
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState("overview")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const router = useRouter() // Initialize router for back navigation

  const [topUsers, setTopUsers] = useState<UserData[]>([]) // State for top users
  const [walletDaily, setWalletDaily] = useState<any[]>([])

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

        // Build date range params for carrier stats based on selectedPeriod/custom
        const getRange = () => {
          const now = new Date()
          const start = new Date(now)
          let startDate: Date | null = null
          let endDate: Date | null = now
          switch (selectedPeriod) {
            case "today":
              start.setHours(0, 0, 0, 0)
              startDate = start
              break
            case "thisWeek": {
              const day = now.getDay() // 0..6
              const diff = day === 0 ? 6 : day - 1 // week starts Monday
              start.setDate(now.getDate() - diff)
              start.setHours(0, 0, 0, 0)
              startDate = start
              break
            }
            case "thisMonth":
              // استخدام الشهر المحدد أو الشهر الحالي
              const monthToUse = selectedMonth !== null ? selectedMonth : now.getMonth()
              const yearToUse = selectedMonth !== null ? selectedYear : now.getFullYear()
              start.setFullYear(yearToUse, monthToUse, 1)
              start.setHours(0, 0, 0, 0)
              startDate = start
              // حساب آخر يوم في الشهر
              const lastDay = new Date(yearToUse, monthToUse + 1, 0)
              endDate = new Date(lastDay)
              endDate.setHours(23, 59, 59, 999)
              break
            case "thisYear":
              start.setMonth(0, 1)
              start.setHours(0, 0, 0, 0)
              startDate = start
              break
            case "custom":
              if (customDateFrom) startDate = new Date(customDateFrom + "T00:00:00")
              if (customDateTo) endDate = new Date(customDateTo + "T23:59:59")
              break
            default:
              startDate = null
          }
          return { startDate, endDate }
        }

        const { startDate, endDate } = getRange()
        const carriersParams: any = {}
        if (startDate) carriersParams.startDate = startDate.toISOString()
        if (endDate) carriersParams.endDate = endDate.toISOString()

        const [statsResponse, usersResponse, carriersResponse, platformsResponse, ordersResponse, transactionsResponse] = await Promise.all([
          fetchWithFallback(() => dashboardAPI.getStats(), { data: {} }, "Stats API"),
          fetchWithFallback(() => usersAPI.getAll({ limit: 1000 }), { data: [] }, "Users API"),
          fetchWithFallback(() => dashboardAPI.getCarrierStats(carriersParams), { data: { byCarrier: [], overall: {} } }, "Carrier Stats API"),
          fetchWithFallback(() => adminPlatformsAPI.getAll(), { data: [] }, "Platforms API"),
          fetchWithFallback(() => adminOrdersAPI.getAll({ ...carriersParams, limit: 1000 }), { data: [], pagination: { totalItems: 0 } }, "Orders API"),
          fetchWithFallback(() => transactionsAPI.getAll({ ...carriersParams, limit: 1000 }), { data: [] }, "Transactions API"),
        ])

        console.log("[v0] Reports - Stats response:", statsResponse)
        console.log("[v0] Reports - Users response:", usersResponse)
        console.log("[v0] Reports - Carriers response:", carriersResponse)
        console.log("[v0] Reports - Platforms response:", platformsResponse)
        console.log("[v0] Reports - Orders response:", ordersResponse)
        console.log("[v0] Reports - Transactions response:", transactionsResponse)

        // استخراج البيانات من الاستجابات
        const statsData = statsResponse.data || statsResponse.result || statsResponse || {}
        const usersData = usersResponse.data || usersResponse.result || usersResponse || []
        const carriersData = (carriersResponse?.data?.byCarrier || carriersResponse?.byCarrier || []) as any[]
        const carriersByTypeData = (carriersResponse?.data?.byCarrierAndType || carriersResponse?.byCarrierAndType || []) as any[]
        const carriersOverall = carriersResponse?.data?.overall || carriersResponse?.overall || null
        const platformsData = platformsResponse?.data || platformsResponse || []
        const ordersData = ordersResponse?.data || []
        const ordersPagination = ordersResponse?.pagination || { totalItems: Array.isArray(ordersData) ? ordersData.length : 0 }
        const transactionsData = transactionsResponse?.data || []

        // Top Users by balance from admin users (server-enriched with balance)
        let topUsersData: UserData[] = []
        if (Array.isArray(usersData)) {
          topUsersData = (usersData as any[])
            .map((user: any) => {
              const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "غير معروف"
              return {
                walletId: user._id || user.id,
                userName,
                userEmail: user.email || "",
                balance: Number(user.balance || 0),
                transactionCount: Number(user.walletRecharges || 0),
                createdAt: user.createdAt,
                isVerified: Boolean(user.active),
              }
            })
            .sort((a, b) => Number((b as UserData).balance || 0) - Number((a as UserData).balance || 0))
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
        // فلترة الطلبات حسب الفترة المحددة
        const filteredOrdersData = Array.isArray(ordersData) 
          ? ordersData.filter((o: any) => {
              if (!o.createdAt) return false
              const orderDate = new Date(o.createdAt)
              if (startDate && orderDate < startDate) return false
              if (endDate && orderDate > endDate) return false
              return true
            })
          : []
        
        // إجمالي الإيرادات من إحصائيات شركات الشحن أو من الطلبات المفلترة
        const carriersTotalRevenue = Number(carriersOverall?.financials?.totalRevenue || 0)
        const totalRevenue = carriersTotalRevenue > 0
          ? carriersTotalRevenue
          : filteredOrdersData.reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.totalPrice || 0), 0)

        // إجمالي الطلبات من الطلبات المفلترة (أو من pagination إذا كانت البيانات مفلترة من الخادم)
        const totalOrders = filteredOrdersData.length > 0 
          ? filteredOrdersData.length 
          : Number(ordersPagination?.totalItems || 0)
        // إجمالي المستخدمين من إحصائيات الباك
        const totalUsers = Number(statsData?.users?.total || (Array.isArray(usersData) ? usersData.length : 0))
        // إجمالي الشحنات من إجمالي شركات الشحن (وفق الفترة)
        const totalShipments = Number(carriersOverall?.totals?.total || shipmentsStats.total || 0)

        // تجميع الشحنات حسب الحالة من البيانات الإحصائية
        const overallTotals = (carriersOverall && carriersOverall.totals) || {}
        const shipmentsByStatus = [
          { status: "قيد الانتظار", count: Number(overallTotals.readyForPickup || 0), color: "#FFA500" },
          { status: "قيد النقل", count: Number(overallTotals.inTransit || 0), color: "#3B82F6" },
          { status: "تم التسليم", count: Number(overallTotals.delivered || 0), color: "#10B981" },
          { status: "ملغي", count: Number(overallTotals.canceled || 0), color: "#EF4444" },
          { status: "مرتجع", count: Number(overallTotals.returns || 0), color: "#8b5cf6" },
        ]

        const shipmentsStatusData = shipmentsByStatus
          .filter((item) => item.count > 0)
          .map((item) => ({
            ...item,
            percentage: totalShipments > 0 ? (item.count / totalShipments) * 100 : 0,
          }))

        // بيانات الطلبات الشهرية من قائمة الطلبات (مع فلترة حسب الفترة)
        const ordersMonthly = Array.isArray(ordersData) ? generateOrdersData(ordersData, startDate, endDate) : []

        // بيانات شركات الشحن من باك: /api/admin/carriers/stats
        // الربح يُحسب فقط للشحنات المسلمة (Delivered)
        const companiesStats = Array.isArray(carriersData)
          ? carriersData.map((c: any) => {
              const totals = c?.totals || {}
              const deliveredCount = Number(totals.delivered || 0)
              const totalCount = Number(totals.total || 0)
              const inTransitCount = Number(totals.inTransit || 0)
              const readyForPickupCount = Number(totals.readyForPickup || 0)
              const canceledCount = Number(totals.canceled || 0)
              const returnsCount = Number(totals.returns || 0)
              const ourProfit = Number(c?.financials?.ourProfit || 0) // الربح (فقط للشحنات المسلمة)
              const payableToCarrier = Number(c?.financials?.payableToCarrier || 0) // المبلغ المستحق للشركة
              const totalRevenue = Number(c?.financials?.totalRevenue || 0) // إجمالي الإيرادات
              
              // تجميع أنواع الشحن لهذه الشركة
              const shipmentTypes = Array.isArray(carriersByTypeData)
                ? carriersByTypeData
                    .filter((ct: any) => ct.company === c.company)
                    .map((ct: any) => {
                      const typeTotals = ct?.totals || {}
                      return {
                        type: ct.shipmentType || "غير محدد",
                        totalShipments: Number(typeTotals.total || 0),
                        deliveredShipments: Number(typeTotals.delivered || 0),
                        inTransitShipments: Number(typeTotals.inTransit || 0),
                        readyForPickupShipments: Number(typeTotals.readyForPickup || 0),
                        canceledShipments: Number(typeTotals.canceled || 0),
                        returnsShipments: Number(typeTotals.returns || 0),
                        profit: Number(ct?.financials?.ourProfit || 0),
                        amountDue: Number(ct?.financials?.payableToCarrier || 0),
                        totalRevenue: Number(ct?.financials?.totalRevenue || 0),
                      }
                    })
                : []
              
              return {
                name: c.company || "غير محدد",
                totalShipments: totalCount,
                deliveredShipments: deliveredCount,
                inTransitShipments: inTransitCount,
                readyForPickupShipments: readyForPickupCount,
                canceledShipments: canceledCount,
                returnsShipments: returnsCount,
                profit: ourProfit, // الربح الصافي (فقط للشحنات المسلمة)
                amountDue: payableToCarrier, // المبلغ المستحق للشركة
                totalRevenue: totalRevenue, // إجمالي الإيرادات
                shipmentTypes: shipmentTypes, // أنواع الشحن لهذه الشركة
                color: getRandomColor(),
              }
            })
          : []

        // بيانات المنصات من باك: /api/admin/platforms
        const platformsStats = Array.isArray(platformsData)
          ? platformsData.map((p: any) => ({
              name: p.name || (p.platform ? String(p.platform).toUpperCase() : "منصة"),
              totalOrders: Number(p.orders || 0),
              revenue: Number(p.revenue || 0),
              color: p.color || getRandomColor(),
            }))
          : []

        // حساب نمو البيانات
        const getGrowth = (arr: any[], key: string) => {
          if (!Array.isArray(arr) || arr.length < 2) return 0
          const prev = Number(arr[arr.length - 2]?.[key] || 0)
          const curr = Number(arr[arr.length - 1]?.[key] || 0)
          if (prev <= 0) return 0
          return ((curr - prev) / prev) * 100
        }

        // بناء سجل شحن المحفظة اليومي من المعاملات
        const dailyMap = new Map<string, { amount: number; count: number; users: Set<string> }>()
        if (Array.isArray(transactionsData)) {
          (transactionsData as any[]).forEach((t: any) => {
            const type = String(t.type || '').toUpperCase()
            const isCredit = type === 'CREDIT' || type === 'DEPOSIT' || type === 'APPROVED' || type === 'PAYMENT_RECEIVED'
            if (!isCredit) return
            const d = t.createdAt ? new Date(t.createdAt) : null
            if (!d || isNaN(d.getTime())) return
            if ((startDate && d < startDate) || (endDate && d > endDate)) return
            const key = d.toISOString().slice(0, 10)
            if (!dailyMap.has(key)) dailyMap.set(key, { amount: 0, count: 0, users: new Set<string>() })
            const rec = dailyMap.get(key)!
            rec.amount += Number(t.amount || 0)
            rec.count += 1
            const uid = String(t.customerId || t.userId || '')
            if (uid) rec.users.add(uid)
          })
        }
        const dailyRecords = Array.from(dailyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, v]) => ({
            date: new Date(key).toLocaleDateString('ar-SA'),
            users: v.users.size || v.count,
            amount: Math.round(v.amount),
            avgAmount: v.count ? Math.round(v.amount / v.count) : 0,
            count: v.count,
          }))

        const walletChargesCount = dailyRecords.reduce((sum: number, r: any) => sum + Number(r.count || 0), 0)

        // إحصائيات حالات الطلبات من القائمة المفلترة
        const ordersStatus = Array.isArray(filteredOrdersData)
          ? (filteredOrdersData as any[]).reduce(
              (acc, o: any) => {
                const s = String(o.status || '').toLowerCase()
                if (s === 'completed') acc.completed += 1
                else if (s === 'processing') acc.processing += 1
                else if (s === 'cancelled') acc.cancelled += 1
                else acc.pending += 1
                acc.total += 1
                return acc
              },
              { total: 0, completed: 0, processing: 0, cancelled: 0, pending: 0 },
            )
          : { total: 0, completed: 0, processing: 0, cancelled: 0, pending: 0 }

        // تقسيم المستخدمين حسب رصيد المحفظة
        const segBase = {
          vip: { count: 0, sum: 0 },
          active: { count: 0, sum: 0 },
          medium: { count: 0, sum: 0 },
          inactive: { count: 0, sum: 0 },
        }
        if (Array.isArray(usersData)) {
          (usersData as any[]).forEach((u: any) => {
            const bal = Number(u.balance || 0)
            if (bal > 2000) { segBase.vip.count++; segBase.vip.sum += bal }
            else if (bal >= 1000) { segBase.active.count++; segBase.active.sum += bal }
            else if (bal >= 500) { segBase.medium.count++; segBase.medium.sum += bal }
            else if (bal <= 0) { segBase.inactive.count++; /* sum stays 0 */ }
          })
        }
        const safeDiv = (a: number, b: number) => (b > 0 ? Math.round(a / b) : 0)
        const walletSegments = {
          vip: {
            count: segBase.vip.count,
            avgBalance: safeDiv(segBase.vip.sum, segBase.vip.count),
            percent: totalUsers ? (segBase.vip.count / totalUsers) * 100 : 0,
          },
          active: {
            count: segBase.active.count,
            avgBalance: safeDiv(segBase.active.sum, segBase.active.count),
            percent: totalUsers ? (segBase.active.count / totalUsers) * 100 : 0,
          },
          medium: {
            count: segBase.medium.count,
            avgBalance: safeDiv(segBase.medium.sum, segBase.medium.count),
            percent: totalUsers ? (segBase.medium.count / totalUsers) * 100 : 0,
          },
          inactive: {
            count: segBase.inactive.count,
            avgBalance: 0,
            percent: totalUsers ? (segBase.inactive.count / totalUsers) * 100 : 0,
          },
        }
        const calculatedData = {
          overview: {
            totalRevenue,
            revenueGrowth: getGrowth(ordersMonthly, 'revenue'),
            totalOrders,
            ordersGrowth: getGrowth(ordersMonthly, 'count'),
            totalUsers,
            usersGrowth: getGrowth(generateMonthlyData(usersData, 'createdAt'), 'count'),
            totalShipments,
            shipmentsGrowth: 0,
            activeUsers: Number(statsData?.users?.active || 0),
            activeWallets: Number(statsData?.wallets?.activeWallets || 0),
            totalTransactions: Number(statsData?.wallets?.totalTransactions || 0),
            totalDeposits: Number(statsData?.wallets?.totalDeposits || 0),
            totalBalance: Number(statsData?.wallets?.totalBalance || 0),
            newCustomersThisMonth: Number(statsData?.customers?.newThisMonth || 0),
            walletChargesCount,
          },
          users: generateMonthlyData(usersData, "createdAt"),
          orders: ordersMonthly,
          shipments: shipmentsStatusData,
          shippingCompanies: companiesStats,
          platforms: platformsStats,
          ordersStatus,
          walletSegments,
        }

        console.log("[v0] Reports - Calculated data:", calculatedData)
        setData(calculatedData)
        setTopUsers(topUsersData) // Set top users data
        setWalletDaily(dailyRecords)
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
  }, [selectedPeriod, customDateFrom, customDateTo, selectedMonth, selectedYear])

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

  const generateOrdersData = (orders: any[], startDate?: Date | null, endDate?: Date | null) => {
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
        
        // فلترة حسب الفترة المحددة
        if (startDate && date < startDate) return
        if (endDate && date > endDate) return
        
        const month = date.getMonth()
        monthlyData[month].count++
        monthlyData[month].revenue += Number(order.totalPrice || order.totalAmount || 0)
      }
    })

    // Filter out months with no data and take the last 4 for display
    const filteredData = monthlyData.filter((m) => m.count > 0)
    return filteredData.slice(-4)
  }

  // إضافة دوال مساعدة لـ Period
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod)
    // إذا تم اختيار فترة غير "thisMonth"، امسح اختيار الشهر
    if (newPeriod !== "thisMonth") {
      setSelectedMonth(null)
    }
  }

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
    setSelectedPeriod("thisMonth") // تأكد من أن الفترة هي "thisMonth"
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

  const printColumns = [
    { key: "metric", label: "المؤشر" },
    { key: "value", label: "القيمة" },
    { key: "growth", label: "النمو" },
  ]
  const printRows = [
    {
      metric: "إجمالي الإيرادات",
      value: `${reportData.overview.totalRevenue.toLocaleString()} ريال`,
      growth: `${Math.abs(reportData.overview.revenueGrowth)}%`,
    },
    {
      metric: "إجمالي الطلبات",
      value: reportData.overview.totalOrders.toLocaleString(),
      growth: `${Math.abs(reportData.overview.ordersGrowth)}%`,
    },
    {
      metric: "إجمالي الشحنات",
      value: reportData.overview.totalShipments.toLocaleString(),
      growth: `${Math.abs(reportData.overview.shipmentsGrowth)}%`,
    },
  ]

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
                subtitle={`نظرة عامة على المؤشرات الرئيسية`}
                data={printRows}
                columns={printColumns}
                showStats={true}
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

          {selectedPeriod === "thisMonth" && (
            <div className="mt-4 p-4 bg-background rounded-lg border border-border">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">اختر الشهر:</label>
                  <select
                    value={selectedMonth !== null ? selectedMonth : new Date().getMonth()}
                    onChange={(e) => handleMonthChange(Number(e.target.value))}
                    className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  >
                    <option value={0}>يناير</option>
                    <option value={1}>فبراير</option>
                    <option value={2}>مارس</option>
                    <option value={3}>أبريل</option>
                    <option value={4}>مايو</option>
                    <option value={5}>يونيو</option>
                    <option value={6}>يوليو</option>
                    <option value={7}>أغسطس</option>
                    <option value={8}>سبتمبر</option>
                    <option value={9}>أكتوبر</option>
                    <option value={10}>نوفمبر</option>
                    <option value={11}>ديسمبر</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">اختر السنة:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
                {selectedMonth !== null && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg border border-border">
                    {["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"][selectedMonth]} {selectedYear}
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <span className="text-sm font-medium">+{Math.round(Math.abs(reportData.overview.usersGrowth))}% من الفترة السابقة</span>
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
                      {Number(reportData.overview.activeUsers || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-medium">
                    {reportData.overview.totalUsers > 0
                      ? `${Math.round((Number(reportData.overview.activeUsers || 0) / reportData.overview.totalUsers) * 100)}% من إجمالي المستخدمين`
                      : "0% من إجمالي المستخدمين"}
                  </span>
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
                      {Number(reportData.overview.newCustomersThisMonth || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="text-sm font-medium">
                    {reportData.overview.totalUsers > 0
                      ? `${Math.round((Number(reportData.overview.newCustomersThisMonth || 0) / reportData.overview.totalUsers) * 100)}% من إجمالي المستخدمين`
                      : "0% من إجمالي المستخدمين"}
                  </span>
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
                      {Number(reportData.overview.activeWallets || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {reportData.overview.totalUsers > 0
                      ? `${Math.round((Number(reportData.overview.activeWallets || 0) / reportData.overview.totalUsers) * 100)}% من إجمالي المستخدمين`
                      : "0% من إجمالي المستخدمين"}
                  </span>
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
                      {(Math.max(0, Number(reportData.overview.totalUsers || 0) - Number(reportData.overview.activeWallets || 0))).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {reportData.overview.totalUsers > 0
                      ? `${Math.round(((Math.max(0, Number(reportData.overview.totalUsers || 0) - Number(reportData.overview.activeWallets || 0))) / reportData.overview.totalUsers) * 100)}% من إجمالي المستخدمين`
                      : "0% من إجمالي المستخدمين"}
                  </span>
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
                        {Number(reportData.overview.activeWallets || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-blue-600 font-bold">
                        {Number(reportData.overview.totalBalance || 0).toLocaleString()} ريال
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {Number(reportData.overview.activeWallets || 0) > 0
                          ? `${Math.round(Number(reportData.overview.totalBalance || 0) / Number(reportData.overview.activeWallets || 1)).toLocaleString()} ريال`
                          : `0 ريال`}
                      </td>
                      <td className="px-6 py-4 text-purple-600 font-bold">
                        {Number(reportData.overview.walletChargesCount || 0).toLocaleString()} عملية
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {(() => {
                          const active = Number(reportData.overview.activeWallets || 0)
                          const cnt = Number(reportData.overview.walletChargesCount || 0)
                          return active > 0 ? `${Math.round((cnt / active) * 10) / 10} عملية` : `0 عملية`
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          {reportData.overview.totalUsers > 0
                            ? `${Math.round((Number(reportData.overview.activeWallets || 0) / reportData.overview.totalUsers) * 100)}%`
                            : `0%`}
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
                        {Math.max(0, Number(reportData.overview.totalUsers || 0) - Number(reportData.overview.activeWallets || 0)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 ريال</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0ريال</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 عملية</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">0 عملية</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          {reportData.overview.totalUsers > 0
                            ? `${Math.round(((Math.max(0, Number(reportData.overview.totalUsers || 0) - Number(reportData.overview.activeWallets || 0))) / reportData.overview.totalUsers) * 100)}%`
                            : `0%`}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-gray-900">{reportData.overview.totalUsers.toLocaleString()}</td>
                      <td className="px-6 py-4 text-blue-700">
                        {Number(reportData.overview.totalBalance || 0).toLocaleString()} ريال
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {reportData.overview.totalUsers > 0
                          ? `${Math.round(Number(reportData.overview.totalBalance || 0) / reportData.overview.totalUsers).toLocaleString()} ريال`
                          : `0 ريال`}
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {Number(reportData.overview.walletChargesCount || 0).toLocaleString()} عملية
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {(() => {
                          const active = Number(reportData.overview.activeWallets || 0)
                          const cnt = Number(reportData.overview.walletChargesCount || 0)
                          return active > 0 ? `${Math.round((cnt / active) * 10) / 10} عملية` : `0 عملية`
                        })()}
                      </td>
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
                        {Number(reportData.walletSegments?.vip?.count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">{Number(reportData.walletSegments?.vip?.avgBalance || 0).toLocaleString()} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-green-600">{Math.round(reportData.walletSegments?.vip?.percent || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.round(reportData.walletSegments?.vip?.percent || 0)}%` }} />
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
                        {Number(reportData.walletSegments?.active?.count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">{Number(reportData.walletSegments?.active?.avgBalance || 0).toLocaleString()} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-blue-600">{Math.round(reportData.walletSegments?.active?.percent || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.round(reportData.walletSegments?.active?.percent || 0)}%` }} />
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
                        {Number(reportData.walletSegments?.medium?.count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">{Number(reportData.walletSegments?.medium?.avgBalance || 0).toLocaleString()} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-purple-600">{Math.round(reportData.walletSegments?.medium?.percent || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.round(reportData.walletSegments?.medium?.percent || 0)}%` }} />
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
                        {Number(reportData.walletSegments?.inactive?.count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">متوسط الرصيد</span>
                      <span className="text-sm font-bold text-gray-900">0 ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">النسبة</span>
                      <span className="text-sm font-bold text-gray-600">{Math.round(reportData.walletSegments?.inactive?.percent || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${Math.round(reportData.walletSegments?.inactive?.percent || 0)}%` }} />
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
                {(walletDaily && walletDaily.length ? walletDaily : []).slice(-7).map((day, index) => (
                  <div key={index} className="border rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{day.date}</h4>
                          <p className="text-xs text-gray-500">{Number(day.users || 0)} مستخدم قاموا بالشحن</p>
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
                        <p className="text-sm font-bold text-purple-600">{Number(day.count ?? day.users ?? 0)} عملية</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">متوسط المبلغ</p>
                        <p className="text-sm font-bold text-blue-600">{day.avgAmount}ريال</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">الحالة</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                            (Number(day.count ?? day.users ?? 0)) > 45
                              ? "bg-green-100 text-green-700"
                              : (Number(day.count ?? day.users ?? 0)) > 40
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {(Number(day.count ?? day.users ?? 0)) > 45 ? "ممتاز" : (Number(day.count ?? day.users ?? 0)) > 40 ? "جيد" : "متوسط"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (((Number(day.count ?? day.users ?? 0)) / 50) * 100))}%` }}
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
                  <p className="text-3xl font-bold">
                    {reportData.overview.totalUsers > 0
                      ? `${Math.round((Number(reportData.overview.activeUsers || 0) / reportData.overview.totalUsers) * 100)}%`
                      : "0%"}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">
                      +{Math.round(Math.abs(Number(reportData.overview.usersGrowth || 0)))}% من الشهر السابق
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط رصيد المحفظة</p>
                  <p className="text-3xl font-bold">
                    {reportData.overview.totalUsers > 0
                      ? Math.round(Number(reportData.overview.totalBalance || 0) / reportData.overview.totalUsers).toLocaleString()
                      : 0} ريال
                  </p>
                  <div className="text-sm text-blue-200 mt-2">لكل مستخدم</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">إجمالي عمليات الشحن</p>
                  <p className="text-3xl font-bold">
                    {Number(reportData.overview.walletChargesCount || 0).toLocaleString()}
                  </p>
                  <div className="text-sm text-purple-200 mt-2">خلال الفترة الحالية</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط الشحن</p>
                  <p className="text-3xl font-bold">
                    {(() => {
                      const a = Number(reportData.overview.activeWallets || 0)
                      const c = Number(reportData.overview.walletChargesCount || 0)
                      return a > 0 ? Math.round((c / a) * 10) / 10 : 0
                    })()} عملية
                  </p>
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
                      {Number(reportData.walletSegments?.vip?.count || 0).toLocaleString()} ({Math.round(reportData.walletSegments?.vip?.percent || 0)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-indigo-100">مستخدمون نشطون: </span>
                    <span className="font-bold">
                      {Number(reportData.walletSegments?.active?.count || 0).toLocaleString()} ({Math.round(reportData.walletSegments?.active?.percent || 0)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-indigo-100">إجمالي الأرصدة: </span>
                    <span className="font-bold">
                      {Number(reportData.overview.totalBalance || 0).toLocaleString()} ريال
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
                      {Number(reportData.ordersStatus?.completed || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">
                    {Number(reportData.ordersStatus?.total || 0) > 0
                      ? `${Math.round((Number(reportData.ordersStatus?.completed || 0) / Number(reportData.ordersStatus?.total || 1)) * 100)}% من إجمالي الطلبات`
                      : "0% من إجمالي الطلبات"}
                  </span>
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
                      {Number(reportData.ordersStatus?.processing || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-sm font-medium">
                    {Number(reportData.ordersStatus?.total || 0) > 0
                      ? `${Math.round((Number(reportData.ordersStatus?.processing || 0) / Number(reportData.ordersStatus?.total || 1)) * 100)}% من إجمالي الطلبات`
                      : "0% من إجمالي الطلبات"}
                  </span>
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
            {/* Shipments Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">إجمالي الشحنات</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.overview.totalShipments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">الشحنات المسلمة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.shipments.find((s: any) => s.status === "تم التسليم")?.count || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-600 font-medium">
                  {reportData.overview.totalShipments > 0
                    ? `${((reportData.shipments.find((s: any) => s.status === "تم التسليم")?.count || 0) / reportData.overview.totalShipments * 100).toFixed(1)}%`
                    : "0%"}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">قيد النقل</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.shipments.find((s: any) => s.status === "قيد النقل")?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm font-medium">الشحنات الملغاة</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.shipments.find((s: any) => s.status === "ملغي")?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipments Stats by Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.shipments.map((shipment: any, index: number) => (
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">النسبة المئوية</span>
                      <span className="text-sm font-bold" style={{ color: shipment.color }}>
                        {shipment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(shipment.percentage, 100)}%`, backgroundColor: shipment.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipments by Company Table */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">تفصيل الشحنات حسب شركة الشحن ونوع الشحن</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">شركة الشحن</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">نوع الشحن</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الشحنات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">تم التسليم</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">قيد النقل</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">قيد الانتظار</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">ملغي</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">مرتجع</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">نسبة التسليم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.shippingCompanies.map((company: any, companyIndex: number) => {
                      const companyDeliveryRate = company.totalShipments > 0
                        ? ((company.deliveredShipments || 0) / company.totalShipments * 100).toFixed(1)
                        : "0.0"
                      
                      // عرض بيانات الشركة الإجمالية
                      const companyRow = (
                        <tr key={`company-${companyIndex}`} className="border-b-2 border-indigo-200 bg-indigo-50/50">
                          <td className="px-6 py-4" colSpan={1}>
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
                          <td className="px-6 py-4">
                            <span className="font-bold text-indigo-700">الإجمالي</span>
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-bold text-center">
                            {company.totalShipments.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-green-700 font-bold text-center">
                            {(company.deliveredShipments || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-blue-700 font-bold text-center">
                            {(company.inTransitShipments || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-amber-700 font-bold text-center">
                            {(company.readyForPickupShipments || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-red-700 font-bold text-center">
                            {(company.canceledShipments || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-purple-700 font-bold text-center">
                            {(company.returnsShipments || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                Number.parseFloat(companyDeliveryRate) >= 80
                                  ? "bg-green-100 text-green-700"
                                  : Number.parseFloat(companyDeliveryRate) >= 60
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {companyDeliveryRate}%
                            </span>
                          </td>
                        </tr>
                      )

                      // عرض أنواع الشحن لهذه الشركة
                      const typeRows = (company.shipmentTypes || []).map((type: any, typeIndex: number) => {
                        const typeDeliveryRate = type.totalShipments > 0
                          ? ((type.deliveredShipments || 0) / type.totalShipments * 100).toFixed(1)
                          : "0.0"
                        
                        return (
                          <tr key={`type-${companyIndex}-${typeIndex}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 pl-8">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <span className="text-sm text-gray-600">{company.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-700">{type.type}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-medium text-center">
                              {type.totalShipments.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-green-700 font-medium text-center">
                              {(type.deliveredShipments || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-blue-700 font-medium text-center">
                              {(type.inTransitShipments || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-amber-700 font-medium text-center">
                              {(type.readyForPickupShipments || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-red-700 font-medium text-center">
                              {(type.canceledShipments || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-purple-700 font-medium text-center">
                              {(type.returnsShipments || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  Number.parseFloat(typeDeliveryRate) >= 80
                                    ? "bg-green-100 text-green-700"
                                    : Number.parseFloat(typeDeliveryRate) >= 60
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {typeDeliveryRate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })

                      return [companyRow, ...typeRows]
                    }).flat()}
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 font-bold">
                      <td className="px-6 py-4 text-gray-900">الإجمالي</td>
                      <td className="px-6 py-4 text-gray-900 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + company.totalShipments, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-green-700 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.deliveredShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-blue-700 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.inTransitShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-amber-700 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.readyForPickupShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-red-700 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.canceledShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-purple-700 text-center">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.returnsShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900">
                          {reportData.shippingCompanies.reduce((sum: number, company: any) => sum + company.totalShipments, 0) > 0
                            ? `${((reportData.shippingCompanies.reduce((sum: number, company: any) => sum + (company.deliveredShipments || 0), 0) / reportData.shippingCompanies.reduce((sum: number, company: any) => sum + company.totalShipments, 0)) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={reportData.shipments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.status}: ${entry.percentage.toFixed(1)}%`}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.shipments.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toLocaleString()} شحنة`,
                        props.payload.status || "العدد"
                      ]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                    />
                    <Legend
                      formatter={(value: string, entry: any) => (
                        <span style={{ color: entry.color }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Shipments Legend */}
                <div className="w-full mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {reportData.shipments.map((shipment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: shipment.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">{shipment.status}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-gray-900">{shipment.count.toLocaleString()}</div>
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
                      {reportData.overview.totalOrders > 0
                        ? Math.round(reportData.overview.totalRevenue / reportData.overview.totalOrders).toLocaleString()
                        : 0}{" "}
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
                        .reduce((sum: number, company: any) => {
                          const vat = Math.round(company.profit * 0.15)
                          return sum + (company.profit - vat - company.amountDue)
                        }, 0)
                        .toLocaleString()}{" "}
                      ريال
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">بعد خصم الضريبة والمستحقات (شحنات مسلمة فقط)</span>
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
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الشحنات</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">الشحنات المسلمة</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">إجمالي الربح</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ضريبة القيمة المضافة (15%)
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">المبلغ المستحق للشركة</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">صافي الربح</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.shippingCompanies.map((company: any, index: number) => {
                      const vat = Math.round(company.profit * 0.15)
                      const netProfit = company.profit - vat - company.amountDue
                      const deliveryRate = company.totalShipments > 0 
                        ? ((company.deliveredShipments || 0) / company.totalShipments * 100).toFixed(1)
                        : "0.0"
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
                          <td className="px-6 py-4 text-green-700 font-medium">
                            {(company.deliveredShipments || 0).toLocaleString()}
                            <span className="text-xs text-gray-500 block">({deliveryRate}%)</span>
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
                          .reduce((sum: number, company: any) => sum + company.totalShipments, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-green-700">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + (company.deliveredShipments || 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-blue-700">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + company.profit, 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + Math.round(company.profit * 0.15), 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-amber-700">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + company.amountDue, 0)
                          .toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-green-700 text-lg">
                        {reportData.shippingCompanies
                          .reduce(
                            (sum: number, company: any) =>
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
                    {reportData.orders.map((order: any, index: number) => {
                      const vat = Math.round(order.revenue * 0.15)
                      // حساب المستحقات من البيانات الفعلية لشركات الشحن
                      // تقدير المستحقات بناءً على نسبة المستحقات الإجمالية من الإيرادات الإجمالية
                      const totalDues = reportData.shippingCompanies.reduce((sum: number, company: any) => sum + (company.amountDue || 0), 0)
                      const totalRevenue = reportData.shippingCompanies.reduce((sum: number, company: any) => sum + (company.profit || 0), 0) || reportData.overview.totalRevenue
                      const duesRatio = totalRevenue > 0 ? totalDues / totalRevenue : 0.12
                      const dues = Math.round(order.revenue * duesRatio)
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">الجدول الزمني للمدفوعات</h3>
                    <p className="text-sm text-gray-500 mt-1">متابعة مستحقات شركات الشحن والمدفوعات</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportData.shippingCompanies.map((company: any, index: number) => {
                  const daysUntilDue = 15 - index * 2
                  const paymentProgress = company.profit > 0 
                    ? Math.min(100, Math.round((company.amountDue / company.profit) * 100))
                    : 0
                  const paidAmount = Math.round(company.amountDue * 0.6)
                  const remainingAmount = company.amountDue - paidAmount

                  return (
                    <div 
                      key={index} 
                      className="relative border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                      style={{ 
                        borderColor: daysUntilDue > 10 
                          ? "#10b981" 
                          : daysUntilDue > 5 
                            ? "#f59e0b" 
                            : "#ef4444",
                        borderOpacity: 0.3
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                            style={{ 
                              backgroundColor: `${company.color}20`,
                              border: `2px solid ${company.color}40`
                            }}
                          >
                            <Truck className="w-7 h-7" style={{ color: company.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h4>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {daysUntilDue > 0 
                                  ? `مستحق بعد ${daysUntilDue} ${daysUntilDue === 1 ? 'يوم' : 'أيام'}` 
                                  : "مستحق الآن"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-left bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
                          <p className="text-2xl font-bold text-amber-700">{company.amountDue.toLocaleString()}</p>
                          <p className="text-xs text-amber-600 font-medium">ريال مستحق</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">نسبة المستحق من الربح</span>
                          <span className="text-sm font-bold text-gray-900">{paymentProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className="h-3 rounded-full transition-all duration-500 relative"
                            style={{
                              width: `${paymentProgress}%`,
                              background: `linear-gradient(90deg, ${company.color} 0%, ${company.color}dd 100%)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-xs font-medium text-green-700">المدفوع</p>
                          </div>
                          <p className="text-xl font-bold text-green-700">{paidAmount.toLocaleString()}</p>
                          <p className="text-xs text-green-600 mt-1">60% من المستحق</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-amber-600" />
                            <p className="text-xs font-medium text-amber-700">المتبقي</p>
                          </div>
                          <p className="text-xl font-bold text-amber-700">{remainingAmount.toLocaleString()}</p>
                          <p className="text-xs text-amber-600 mt-1">40% من المستحق</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${
                              daysUntilDue > 10
                                ? "bg-green-500"
                                : daysUntilDue > 5
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm text-gray-600">حالة الدفع</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                            daysUntilDue > 10
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : daysUntilDue > 5
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          {daysUntilDue > 10 ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              آمن
                            </>
                          ) : daysUntilDue > 5 ? (
                            <>
                              <Package className="w-4 h-4" />
                              تحذير
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              عاجل
                            </>
                          )}
                        </span>
                      </div>

                      {/* Timeline Indicator */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>تاريخ الاستحقاق</span>
                          <span className="font-medium text-gray-700">
                            {new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary Card */}
              {reportData.shippingCompanies.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">ملخص المستحقات</h4>
                      <p className="text-sm text-gray-600">إجمالي المبالغ المستحقة لجميع الشركات</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-700">
                        {reportData.shippingCompanies
                          .reduce((sum: number, company: any) => sum + company.amountDue, 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-sm text-indigo-600 font-medium">ريال</p>
                    </div>
                  </div>
                </div>
              )}
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
                      {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.stores || 0), 0).toLocaleString()}
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
                      {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.orders || 0), 0).toLocaleString()}
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
                      {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.revenue || 0), 0).toLocaleString()} ريال
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
                      {(() => {
                        const platforms = reportData.platforms || []
                        const totalRevenue = platforms.reduce((sum, platform) => sum + (platform.revenue || 0), 0)
                        const totalOrders = platforms.reduce((sum, platform) => sum + (platform.orders || 0), 0)
                        return totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : "0"
                      })()}{" "}
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
              {(reportData.platforms || []).map((platform, index) => (
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
                    {(reportData.platforms || []).map((platform, index) => {
                      const avgOrder = platform.orders > 0 ? Math.round((platform.revenue || 0) / platform.orders) : 0
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
                        {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.stores || 0), 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-purple-700">
                        {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.orders || 0), 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-green-700">
                        {(reportData.platforms || []).reduce((sum, platform) => sum + (platform.revenue || 0), 0).toLocaleString()}{" "}
                        ريال
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {(() => {
                          const platforms = reportData.platforms || []
                          const totalRevenue = platforms.reduce((sum, platform) => sum + (platform.revenue || 0), 0)
                          const totalOrders = platforms.reduce((sum, platform) => sum + (platform.orders || 0), 0)
                          return totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : "0"
                        })()}{" "}
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
                      {(reportData.platforms || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="w-full mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(reportData.platforms || []).map((platform, index) => (
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
                        {(reportData.platforms || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} stroke="#fff" strokeWidth={2} />
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
                      {(reportData.platforms || []).map((platform, index) => (
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
                              {(() => {
                                const platforms = reportData.platforms || []
                                const totalOrders = platforms.reduce((sum, p) => sum + (p.orders || 0), 0)
                                return totalOrders > 0 ? ((platform.orders / totalOrders) * 100).toFixed(1) : "0.0"
                              })()}
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
                  {reportData.platforms && reportData.platforms.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">{reportData.platforms[0]?.name?.split(" ")[0] || "غير متاح"}</p>
                      <p className="text-lg text-green-300 mt-1">{reportData.platforms[0]?.revenue?.toLocaleString() || 0} ريال</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">لا توجد بيانات</p>
                      <p className="text-lg text-green-300 mt-1">0 ريال</p>
                    </>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">أعلى نمو</p>
                  {reportData.platforms && reportData.platforms.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">
                        {reportData.platforms.reduce((max, p) => (p.growth > max.growth ? p : max), reportData.platforms[0])?.name?.split(" ")[0] || "غير متاح"}
                      </p>
                      <div className="flex items-center gap-1 text-green-300 mt-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-lg">
                          +{reportData.platforms.reduce((max, p) => (p.growth > max.growth ? p : max), reportData.platforms[0])?.growth || 0}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">لا توجد بيانات</p>
                      <div className="flex items-center gap-1 text-green-300 mt-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-lg">+0%</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">أفضل صحة اتصال</p>
                  {reportData.platforms && reportData.platforms.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold">
                        {reportData.platforms.reduce((max, p) => (p.health > max.health ? p : max), reportData.platforms[0])?.name?.split(" ")[0] || "غير متاح"}
                      </p>
                      <p className="text-lg text-blue-300 mt-1">
                        {reportData.platforms.reduce((max, p) => (p.health > max.health ? p : max), reportData.platforms[0])?.health || 0}%
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">لا توجد بيانات</p>
                      <p className="text-lg text-blue-300 mt-1">0%</p>
                    </>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <p className="text-indigo-100 text-sm mb-2">متوسط الطلب الأعلى</p>
                  {reportData.platforms && reportData.platforms.length > 0 ? (
                    <>
                      {reportData.platforms && reportData.platforms.length > 0 ? (
                        <>
                          <p className="text-2xl font-bold">
                            {
                              reportData.platforms
                                .reduce((max, p) => (p.revenue / (p.orders || 1) > max.revenue / (max.orders || 1) ? p : max), reportData.platforms[0])
                                ?.name?.split(" ")[0] || "غير متاح"
                            }
                          </p>
                          <p className="text-lg text-amber-300 mt-1">
                            {Math.round(
                              (reportData.platforms.reduce(
                                (max, p) => (p.revenue / (p.orders || 1) > max.revenue / (max.orders || 1) ? p : max),
                                reportData.platforms[0],
                              ).revenue || 0) /
                                (reportData.platforms.reduce(
                                  (max, p) => (p.revenue / (p.orders || 1) > max.revenue / (max.orders || 1) ? p : max),
                                  reportData.platforms[0],
                                ).orders || 1),
                            ).toLocaleString()}{" "}
                            ريال
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">لا توجد بيانات</p>
                          <p className="text-lg text-amber-300 mt-1">0 ريال</p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold">لا توجد بيانات</p>
                      <p className="text-lg text-amber-300 mt-1">0 ريال</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-indigo-100">جميع المنصات: </span>
                    <span className="font-bold">{reportData.platforms?.length || 0} منصات نشطة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط صحة الاتصال: </span>
                    <span className="font-bold">
                      {reportData.platforms && reportData.platforms.length > 0
                        ? Math.round(
                            reportData.platforms.reduce((sum, p) => sum + (p.health || 0), 0) / reportData.platforms.length,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-indigo-100">متوسط النمو: </span>
                    <span className="font-bold">
                      {reportData.platforms && reportData.platforms.length > 0
                        ? `+${(
                            reportData.platforms.reduce((sum, p) => sum + (p.growth || 0), 0) / reportData.platforms.length
                          ).toFixed(1)}`
                        : "+0.0"}
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
