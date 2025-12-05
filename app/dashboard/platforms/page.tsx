"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Layers, Store, TrendingUp, Activity, AlertCircle, CheckCircle, XCircle, Settings, RefreshCw, Plus, Key, Clock, Bell, Link2, Power, Save } from 'lucide-react'
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Platform = {
  id: number
  name: string
  status: string
  health: number
  orders: number
  revenue: number
  lastSync: string
  color: string
  icon: string
  image?: string // Added optional image field for custom platform logos
  apiKey?: string
  apiSecret?: string
  syncFrequency?: string
  notifications?: boolean
}

export default function PlatformsPage() {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 1,
      name: "منصة سلة",
      status: "متصل",
      health: 98,
      orders: 1250,
      revenue: 450000,
      lastSync: "منذ 5 دقائق",
      color: "#10b981",
      icon: "🛍️",
      apiKey: "sk_live_••••••••••••1234",
      apiSecret: "••••••••••••5678",
      syncFrequency: "5",
      notifications: true,
    },
    {
      id: 2,
      name: "منصة زد",
      status: "متصل",
      health: 95,
      orders: 980,
      revenue: 380000,
      lastSync: "منذ 10 دقائق",
      color: "#3b82f6",
      icon: "🏪",
      apiKey: "zd_live_••••••••••••9012",
      apiSecret: "••••••••••••3456",
      syncFrequency: "10",
      notifications: true,
    },
    {
      id: 3,
      name: "منصة ووكومرس",
      status: "متصل",
      health: 92,
      orders: 750,
      revenue: 290000,
      lastSync: "منذ 15 دقيقة",
      color: "#8b5cf6",
      icon: "🛒",
      apiKey: "wc_live_••••••••••••7890",
      apiSecret: "••••••••••••1234",
      syncFrequency: "15",
      notifications: false,
    },
    {
      id: 4,
      name: "منصة شوبيفاي",
      status: "تحذير",
      health: 75,
      orders: 620,
      revenue: 245000,
      lastSync: "منذ ساعة",
      color: "#f59e0b",
      icon: "🏬",
      apiKey: "shp_live_••••••••••••5678",
      apiSecret: "••••••••••••9012",
      syncFrequency: "30",
      notifications: true,
    },
    {
      id: 5,
      name: "منصة مستقل",
      status: "غير متصل",
      health: 0,
      orders: 0,
      revenue: 0,
      lastSync: "منذ 3 أيام",
      color: "#ef4444",
      icon: "🔌",
      apiKey: "",
      apiSecret: "",
      syncFrequency: "60",
      notifications: false,
    },
  ])

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    apiKey: "",
    apiSecret: "",
    syncFrequency: "15",
    notifications: true,
  })

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addPlatformForm, setAddPlatformForm] = useState({
    name: "",
    icon: "🛍️",
    color: "#10b981",
    image: "", // Added image field to form state
    apiKey: "",
    apiSecret: "",
    syncFrequency: "15",
    notifications: true,
  })

  const openSettings = (platform: Platform) => {
    setSelectedPlatform(platform)
    setSettingsForm({
      apiKey: platform.apiKey || "",
      apiSecret: platform.apiSecret || "",
      syncFrequency: platform.syncFrequency || "15",
      notifications: platform.notifications ?? true,
    })
    setSettingsDialogOpen(true)
  }

  const saveSettings = () => {
    if (!selectedPlatform) return

    setPlatforms(
      platforms.map((p) =>
        p.id === selectedPlatform.id
          ? {
              ...p,
              apiKey: settingsForm.apiKey,
              apiSecret: settingsForm.apiSecret,
              syncFrequency: settingsForm.syncFrequency,
              notifications: settingsForm.notifications,
            }
          : p,
      ),
    )
    setSettingsDialogOpen(false)
  }

  const testConnection = () => {
    alert("جاري اختبار الاتصال بالمنصة...")
  }

  const disconnectPlatform = () => {
    if (!selectedPlatform) return
    if (confirm(`هل أنت متأكد من فصل ${selectedPlatform.name}؟`)) {
      setPlatforms(
        platforms.map((p) =>
          p.id === selectedPlatform.id
            ? {
                ...p,
                status: "غير متصل",
                health: 0,
              }
            : p,
        ),
      )
      setSettingsDialogOpen(false)
    }
  }

  const handleAddPlatform = () => {
    if (!addPlatformForm.name.trim()) {
      alert("الرجاء إدخال اسم المنصة")
      return
    }

    const newPlatform: Platform = {
      id: platforms.length + 1,
      name: addPlatformForm.name,
      icon: addPlatformForm.icon,
      color: addPlatformForm.color,
      image: addPlatformForm.image, // Include image in new platform
      status: addPlatformForm.apiKey && addPlatformForm.apiSecret ? "متصل" : "غير متصل",
      health: addPlatformForm.apiKey && addPlatformForm.apiSecret ? 100 : 0,
      orders: 0,
      revenue: 0,
      lastSync: "لم يتم المزامنة بعد",
      apiKey: addPlatformForm.apiKey,
      apiSecret: addPlatformForm.apiSecret,
      syncFrequency: addPlatformForm.syncFrequency,
      notifications: addPlatformForm.notifications,
    }

    setPlatforms([...platforms, newPlatform])
    setAddDialogOpen(false)
    setAddPlatformForm({
      name: "",
      icon: "🛍️",
      color: "#10b981",
      image: "", // Reset image field
      apiKey: "",
      apiSecret: "",
      syncFrequency: "15",
      notifications: true,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAddPlatformForm({ ...addPlatformForm, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const totalOrders = platforms.reduce((sum, p) => sum + p.orders, 0)
  const totalRevenue = platforms.reduce((sum, p) => sum + p.revenue, 0)
  const connectedPlatforms = platforms.filter((p) => p.status === "متصل").length
  const avgHealth = Math.round(platforms.reduce((sum, p) => sum + p.health, 0) / platforms.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="رجوع للخلف"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">إدارة المنصات</h1>
                  <p className="text-green-100 mt-1">إدارة ومراقبة جميع المنصات المتصلة</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة منصة جديدة
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <Store className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-2">إجمالي المنصات</p>
            <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
              {platforms.length.toLocaleString('en-US')}
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-blue-600 font-medium">{connectedPlatforms} منصة متصلة</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-2">إجمالي الطلبات</p>
            <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
              {totalOrders.toLocaleString('en-US')}
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-green-600 font-medium">من جميع المنصات</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-2">إجمالي الإيرادات</p>
            <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
              {totalRevenue.toLocaleString('en-US')} ريال
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-purple-600 font-medium">من جميع المنصات</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                <Activity className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-2">متوسط الصحة</p>
            <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
              {avgHealth.toLocaleString('en-US')}%
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-amber-600 font-medium">حالة الاتصال</span>
            </div>
          </div>
        </motion.div>

        {/* Platforms List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">المنصات المتصلة</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث الكل
            </button>
          </div>

          <div className="space-y-4">
            {platforms.map((platform) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: platform.id * 0.05 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl overflow-hidden"
                      style={{ backgroundColor: platform.image ? "transparent" : `${platform.color}20` }}
                    >
                      {platform.image ? (
                        <img
                          src={platform.image || "/placeholder.svg"}
                          alt={platform.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        platform.icon
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{platform.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          {platform.status === "متصل" && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {platform.status === "تحذير" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                          {platform.status === "غير متصل" && <XCircle className="w-4 h-4 text-red-600" />}
                          <span
                            className={`text-sm font-medium ${
                              platform.status === "متصل"
                                ? "text-green-600"
                                : platform.status === "تحذير"
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {platform.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">آخر مزامنة: {platform.lastSync}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الطلبات</p>
                      <p className="text-xl font-bold text-gray-900">{platform.orders.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الإيرادات</p>
                      <p className="text-xl font-bold text-gray-900">{platform.revenue.toLocaleString()} ريال</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الصحة</p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${platform.health}%`,
                              backgroundColor: platform.color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold" style={{ color: platform.color }}>
                          {platform.health}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openSettings(platform)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${selectedPlatform?.color}20` }}
              >
                {selectedPlatform?.icon}
              </div>
              إعدادات {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>قم بتعديل إعدادات الاتصال والمزامنة للمنصة</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* API Credentials Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Key className="w-5 h-5" />
                <h3>بيانات الاتصال</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">مفتاح API</label>
                  <Input
                    value={settingsForm.apiKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
                    placeholder="أدخل مفتاح API"
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">المفتاح السري</label>
                  <Input
                    type="password"
                    value={settingsForm.apiSecret}
                    onChange={(e) => setSettingsForm({ ...settingsForm, apiSecret: e.target.value })}
                    placeholder="أدخل المفتاح السري"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Sync Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Clock className="w-5 h-5" />
                <h3>إعدادات المزامنة</h3>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">تكرار المزامنة (بالدقائق)</label>
                <Select
                  value={settingsForm.syncFrequency}
                  onValueChange={(value) => setSettingsForm({ ...settingsForm, syncFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">كل 5 دقائق</SelectItem>
                    <SelectItem value="10">كل 10 دقائق</SelectItem>
                    <SelectItem value="15">كل 15 دقيقة</SelectItem>
                    <SelectItem value="30">كل 30 دقيقة</SelectItem>
                    <SelectItem value="60">كل ساعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Bell className="w-5 h-5" />
                <h3>الإشعارات</h3>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.notifications}
                  onChange={(e) => setSettingsForm({ ...settingsForm, notifications: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">تفعيل الإشعارات عند حدوث مشاكل في الاتصال</span>
              </label>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">حالة الاتصال:</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlatform?.status === "متصل" && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {selectedPlatform?.status === "تحذير" && <AlertCircle className="w-5 h-5 text-amber-600" />}
                  {selectedPlatform?.status === "غير متصل" && <XCircle className="w-5 h-5 text-red-600" />}
                  <span
                    className={`text-sm font-medium ${
                      selectedPlatform?.status === "متصل"
                        ? "text-green-600"
                        : selectedPlatform?.status === "تحذير"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {selectedPlatform?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <button
              onClick={disconnectPlatform}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              فصل المنصة
            </button>
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              اختبار الاتصال
            </button>
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              إضافة منصة جديدة
            </DialogTitle>
            <DialogDescription>أدخل بيانات المنصة الجديدة للبدء في الاتصال والمزامنة</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Platform Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Store className="w-5 h-5" />
                <h3>معلومات المنصة</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    اسم المنصة <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={addPlatformForm.name}
                    onChange={(e) => setAddPlatformForm({ ...addPlatformForm, name: e.target.value })}
                    placeholder="مثال: منصة سلة، منصة زد، ووكومرس"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">صورة المنصة (اختياري)</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              {addPlatformForm.image ? (
                                <img
                                  src={addPlatformForm.image || "/placeholder.svg"}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Plus className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700">
                                {addPlatformForm.image ? "تغيير الصورة" : "رفع صورة"}
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, SVG (حتى 2MB)</p>
                            </div>
                          </div>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>

                      {addPlatformForm.image && (
                        <button
                          onClick={() => setAddPlatformForm({ ...addPlatformForm, image: "" })}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          حذف
                        </button>
                      )}
                    </div>

                    {addPlatformForm.image && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">✓ تم رفع الصورة بنجاح</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      أيقونة المنصة {addPlatformForm.image && "(بديل)"}
                    </label>
                    <Select
                      value={addPlatformForm.icon}
                      onValueChange={(value) => setAddPlatformForm({ ...addPlatformForm, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="🛍️">🛍️ حقيبة تسوق</SelectItem>
                        <SelectItem value="🏪">🏪 متجر</SelectItem>
                        <SelectItem value="🛒">🛒 عربة تسوق</SelectItem>
                        <SelectItem value="🏬">🏬 مركز تسوق</SelectItem>
                        <SelectItem value="📦">📦 صندوق</SelectItem>
                        <SelectItem value="🔌">🔌 قابس</SelectItem>
                        <SelectItem value="💼">💼 حقيبة عمل</SelectItem>
                        <SelectItem value="🌐">🌐 كرة أرضية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">لون المنصة</label>
                    <Select
                      value={addPlatformForm.color}
                      onValueChange={(value) => setAddPlatformForm({ ...addPlatformForm, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#10b981">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-500" />
                            أخضر
                          </div>
                        </SelectItem>
                        <SelectItem value="#3b82f6">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500" />
                            أزرق
                          </div>
                        </SelectItem>
                        <SelectItem value="#8b5cf6">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-violet-500" />
                            بنفسجي
                          </div>
                        </SelectItem>
                        <SelectItem value="#f59e0b">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-500" />
                            برتقالي
                          </div>
                        </SelectItem>
                        <SelectItem value="#ef4444">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-500" />
                            أحمر
                          </div>
                        </SelectItem>
                        <SelectItem value="#ec4899">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-pink-500" />
                            وردي
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* API Credentials Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Key className="w-5 h-5" />
                <h3>بيانات الاتصال</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">مفتاح API</label>
                  <Input
                    value={addPlatformForm.apiKey}
                    onChange={(e) => setAddPlatformForm({ ...addPlatformForm, apiKey: e.target.value })}
                    placeholder="أدخل مفتاح API"
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">المفتاح السري</label>
                  <Input
                    type="password"
                    value={addPlatformForm.apiSecret}
                    onChange={(e) => setAddPlatformForm({ ...addPlatformForm, apiSecret: e.target.value })}
                    placeholder="أدخل المفتاح السري"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">💡 يمكنك إضافة بيانات الاتصال لاحقاً من إعدادات المنصة</p>
              </div>
            </div>

            {/* Sync Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Clock className="w-5 h-5" />
                <h3>إعدادات المزامنة</h3>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">تكرار المزامنة (بالدقائق)</label>
                <Select
                  value={addPlatformForm.syncFrequency}
                  onValueChange={(value) => setAddPlatformForm({ ...addPlatformForm, syncFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">كل 5 دقائق</SelectItem>
                    <SelectItem value="10">كل 10 دقائق</SelectItem>
                    <SelectItem value="15">كل 15 دقيقة</SelectItem>
                    <SelectItem value="30">كل 30 دقيقة</SelectItem>
                    <SelectItem value="60">كل ساعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Bell className="w-5 h-5" />
                <h3>الإشعارات</h3>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addPlatformForm.notifications}
                  onChange={(e) => setAddPlatformForm({ ...addPlatformForm, notifications: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">تفعيل الإشعارات عند حدوث مشاكل في الاتصال</span>
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setAddDialogOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleAddPlatform}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة المنصة
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
