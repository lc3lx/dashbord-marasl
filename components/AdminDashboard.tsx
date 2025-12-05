"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/app/providers/AuthProvider"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import Link from "next/link"
import { dashboardAPI } from "@/lib/api"
import { useNotifications } from "@/hooks/useSocket"
import type { DashboardStats } from "@/types/api"
import { Users, Package, Truck, Wallet, TrendingUp, ArrowUpRight, CheckCircle2, AlertCircle, BarChart3, Shield, Star, Zap, Eye, Settings, Bell, Lock, Globe, Moon, Sun, Monitor, Mail, Smartphone } from 'lucide-react'
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsData, setSettingsData] = useState({
    theme: "system",
    language: "ar",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorAuth: false,
    sessionTimeout: "30",
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStatsLoading(true)
        setStatsError(false)
        setApiError(null)

        const statsResponse = await dashboardAPI.getStats()

        let apiData = null

        // The API client returns the parsed JSON directly
        // Server response: {"success": true, "data": {"users": {...}, "shipments": {...}, ...}}
        // So statsResponse IS that object
        if (statsResponse?.success && statsResponse?.data) {
          // Response has success wrapper with data inside
          apiData = statsResponse.data
        } else if (statsResponse?.data && (statsResponse.data.users || statsResponse.data.shipments)) {
          // Response has data wrapper directly
          apiData = statsResponse.data
        } else if (statsResponse?.users || statsResponse?.shipments) {
          // Data is at root level
          apiData = statsResponse
        }

        if (apiData && (apiData.users || apiData.shipments || apiData.orders)) {
          const transformedStats: DashboardStats = {
            totalUsers: apiData.users?.total || 0,
            activeUsers: apiData.users?.active || 0,
            totalOrders: apiData.orders?.total || 0,
            pendingOrders: apiData.orders?.pending || 0,
            totalShipments: apiData.shipments?.total || 0,
            deliveredShipments: apiData.shipments?.delivered || 0,
            totalRevenue: apiData.wallets?.totalBalance || 0,
            recentActivities: [],
          }

          setStats(transformedStats)
          setStatsError(false)
        } else {
          throw new Error("هيكل البيانات غير متوقع من الخادم")
        }
      } catch (error: any) {
        console.error("[v0] خطأ في جلب بيانات لوحة التحكم:", error)

        if (error.message?.includes("Load failed") || error.message?.includes("Failed to fetch")) {
          setApiError(
            "تعذر الاتصال بالخادم. يرجى التأكد من أن الخادم يعمل وأن عنوان API صحيح في متغيرات البيئة (NEXT_PUBLIC_API_URL).",
          )
        } else if (error.message?.includes("غير مصرح")) {
          setApiError("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        } else {
          setApiError(error.message || "حدث خطأ غير متوقع")
        }

        setStatsError(true)

        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalShipments: 0,
          deliveredShipments: 0,
          totalRevenue: 0,
          recentActivities: [],
        })
      } finally {
        setStatsLoading(false)
      }
    }

    if (isAuthenticated && user?.role === "admin") {
      fetchDashboardData()
    }
  }, [isAuthenticated, user, router])

  useNotifications((notification) => {})

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "admin") {
      router.push("/")
      return
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">يرجى تسجيل الدخول</h1>
          <p className="text-gray-600 mb-6">يجب تسجيل الدخول للوصول للداشبورد</p>
          <Link
            href="/login"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-block"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">غير مصرح لك بالوصول</h1>
          <p className="text-gray-600 mb-6">هذه الصفحة مخصصة للمديرين فقط</p>
          <p className="text-sm text-gray-500 mb-4">الدور الحالي: {user.role || "غير محدد"}</p>
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-block"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    )
  }

  const handleSaveSettings = () => {
    setSettingsOpen(false)
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div className="space-y-8 p-6" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl shadow-2xl"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative p-8">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">مرحباً، {user?.firstName || "المستخدم"}</h1>
                      <p className="text-blue-100 text-lg">لوحة التحكم الإدارية - إدارة شاملة للنظام</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-blue-100">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>متصل</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <Shield className="h-4 w-4 text-yellow-400" />
                      <span>مدير النظام</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <Star className="h-4 w-4 text-orange-400" />
                      <span>صلاحيات كاملة</span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSettingsOpen(true)}
                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20 mx-1.5"
                  >
                    <Settings className="w-5 h-5" />
                    الإعدادات
                  </motion.button>
                  <Link href="/dashboard/reports">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20"
                    >
                      <BarChart3 className="w-5 h-5" />
                      التقارير
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl ml-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : statsError ? (
              <div className="col-span-4 bg-red-50 border border-red-200 p-8 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">خطأ في تحميل الإحصائيات</h3>
                    <p className="text-red-700 mb-4">{apiError || "حدث خطأ غير متوقع"}</p>
                    <div className="bg-red-100 p-4 rounded-lg mb-4">
                      <p className="text-sm text-red-800 font-medium mb-2">معلومات تقنية:</p>
                      <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                        <li>عنوان API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}</li>
                        <li>نقطة النهاية: /api/dashboard/stats</li>
                        <li>تأكد من تشغيل الخادم وإعداد متغير البيئة NEXT_PUBLIC_API_URL بشكل صحيح</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-2">إجمالي المستخدمين</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
                    {(stats?.totalUsers || 0).toLocaleString('en-US')}
                  </p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-green-600 font-semibold tabular-nums">+12%</span>
                    </div>
                    <span className="text-gray-500">من الشهر الماضي</span>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Truck className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-2">إجمالي الشحنات</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
                    {(stats?.totalShipments || 0).toLocaleString('en-US')}
                  </p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-green-600 font-semibold tabular-nums">+8%</span>
                    </div>
                    <span className="text-gray-500">من الشهر الماضي</span>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Package className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-2">إجمالي الطلبات</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
                    {(stats?.totalOrders || 0).toLocaleString('en-US')}
                  </p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-green-600 font-semibold tabular-nums">+15%</span>
                    </div>
                    <span className="text-gray-500">من الشهر الماضي</span>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Wallet className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-2">رصيد المحافظ</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
                    {(stats?.totalRevenue || 0).toLocaleString('en-US')}
                  </p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-red-600 rotate-180 flex-shrink-0" />
                      <span className="text-red-600 font-semibold tabular-nums">-5%</span>
                    </div>
                    <span className="text-gray-500">من الشهر الماضي</span>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div className="lg:col-span-2" variants={itemVariants}>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">الأنشطة الأخيرة</h2>
                    </div>
                    <Link
                      href="/dashboard/activity"
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 hover:gap-3 transition-all"
                    >
                      عرض الكل
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">الأنشطة الأخيرة</h3>
                    <p className="text-gray-500">ستظهر الأنشطة الأخيرة هنا عند توفرها من الخادم</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-indigo-50/30"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">إجراءات سريعة</h2>
                  </div>

                  <div className="space-y-4">
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Link
                        href="/dashboard/users"
                        className="group flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white border border-gray-100 hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">إدارة المستخدمين</p>
                          <p className="text-sm text-gray-500">إضافة وإدارة المستخدمين والأدوار</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Link
                        href="/dashboard/shipments"
                        className="group flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white border border-gray-100 hover:border-emerald-200 transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">إدارة الشحنات</p>
                          <p className="text-sm text-gray-500">متابعة وإدارة الشحنات</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors duration-200" />
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Link
                        href="/dashboard/orders"
                        className="group flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white border border-gray-100 hover:border-purple-200 transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">إدارة الطلبات</p>
                          <p className="text-sm text-gray-500">متابعة ومراجعة الطلبات</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Link
                        href="/dashboard/wallets"
                        className="group flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white border border-gray-100 hover:border-amber-200 transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">إدارة المحافظ</p>
                          <p className="text-sm text-gray-500">إدارة المحافظ والمعاملات</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors duration-200" />
                      </Link>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Link
                        href="/dashboard/customers"
                        className="group flex items-center gap-4 p-4 bg-white/70 rounded-xl hover:bg-white border border-gray-100 hover:border-cyan-200 transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">إدارة العملاء</p>
                          <p className="text-sm text-gray-500">متابعة وإدارة العملاء</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 transition-colors duration-200" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              إعدادات النظام
            </DialogTitle>
            <DialogDescription>قم بتخصيص إعدادات النظام والتفضيلات الشخصية</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Monitor className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">المظهر</h3>
              </div>

              <div className="space-y-3">
                <Label htmlFor="theme">السمة</Label>
                <Select
                  value={settingsData.theme}
                  onValueChange={(value) => setSettingsData({ ...settingsData, theme: value })}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        فاتح
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        داكن
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        تلقائي (حسب النظام)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="language">اللغة</Label>
                <Select
                  value={settingsData.language}
                  onValueChange={(value) => setSettingsData({ ...settingsData, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        العربية
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        English
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">الإشعارات</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-gray-500">تلقي التحديثات عبر البريد</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settingsData.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettingsData({
                        ...settingsData,
                        emailNotifications: checked as boolean,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">الإشعارات الفورية</p>
                      <p className="text-sm text-gray-500">تلقي إشعارات في المتصفح</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settingsData.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettingsData({
                        ...settingsData,
                        pushNotifications: checked as boolean,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">إشعارات الرسائل النصية</p>
                      <p className="text-sm text-gray-500">تلقي تنبيهات عبر SMS</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settingsData.smsNotifications}
                    onCheckedChange={(checked) =>
                      setSettingsData({
                        ...settingsData,
                        smsNotifications: checked as boolean,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Lock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">الأمان</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">المصادقة الثنائية</p>
                      <p className="text-sm text-gray-500">حماية إضافية للحساب</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={settingsData.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setSettingsData({
                        ...settingsData,
                        twoFactorAuth: checked as boolean,
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="sessionTimeout">مهلة انتهاء الجلسة (بالدقائق)</Label>
                  <Select
                    value={settingsData.sessionTimeout}
                    onValueChange={(value) => setSettingsData({ ...settingsData, sessionTimeout: value })}
                  >
                    <SelectTrigger id="sessionTimeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 دقيقة</SelectItem>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="60">ساعة واحدة</SelectItem>
                      <SelectItem value="120">ساعتان</SelectItem>
                      <SelectItem value="never">بدون انتهاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setSettingsOpen(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
            >
              حفظ التغييرات
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
