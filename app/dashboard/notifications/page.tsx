"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import { Bell, Search, Send, Users, CheckCircle2, Calendar, Filter, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const periods = [
    { label: "يومي", value: "day" },
    { label: "أسبوعي", value: "week" },
    { label: "شهري", value: "month" },
    { label: "سنوي", value: "year" },
    { label: "مخصص", value: "custom" },
  ]

  const reportTypes = [
    { label: "الكل", value: "all", icon: Bell },
    { label: "تم الإرسال", value: "sent", icon: CheckCircle2 },
    { label: "قيد الانتظار", value: "pending", icon: Send },
  ]

  const notifications = [
    {
      id: 1,
      title: "تحديث النظام",
      message: "تم تحديث النظام إلى الإصدار 2.0",
      recipients: 1247,
      sent: true,
      date: "2025-01-25",
    },
    { id: 2, title: "عرض خاص", message: "خصم 20% على جميع الشحنات", recipients: 856, sent: true, date: "2025-01-24" },
    {
      id: 3,
      title: "صيانة مجدولة",
      message: "صيانة النظام يوم الجمعة",
      recipients: 1247,
      sent: false,
      date: "2025-01-27",
    },
    {
      id: 4,
      title: "ميزة جديدة",
      message: "تم إضافة ميزة التتبع المباشر",
      recipients: 1247,
      sent: true,
      date: "2025-01-23",
    },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الإشعارات</h1>
                  <p className="text-gray-500">إرسال وإدارة الإشعارات للمستخدمين</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Settings className="w-5 h-5" />
                إعدادات الإشعارات
              </motion.button>
            </div>
          </div>

          {/* Settings Modal */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">إعدادات الإشعارات</h2>
                        <p className="text-gray-500">تخصيص إعدادات الإشعارات والتنبيهات</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-2xl text-gray-500">×</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-600" />
                      الإعدادات العامة
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">تفعيل الإشعارات</p>
                            <p className="text-sm text-gray-500">تلقي جميع الإشعارات والتنبيهات</p>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
                            <p className="text-sm text-gray-500">إرسال الإشعارات عبر البريد الإلكتروني</p>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">إشعارات الرسائل القصيرة</p>
                            <p className="text-sm text-gray-500">إرسال الإشعارات عبر الرسائل النصية</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Timing Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      إعدادات التوقيت
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وقت البدء</label>
                        <Input type="time" defaultValue="09:00" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">وقت الانتهاء</label>
                        <Input type="time" defaultValue="18:00" className="w-full" />
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-orange-600" />
                      أنواع الإشعارات
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">الطلبات الجديدة</p>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">تحديثات الشحنات</p>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
                          <div>
                            <p className="font-medium text-gray-900">العروض الترويجية</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false)
                      // يمكن إضافة منطق حفظ الإعدادات هنا
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الإشعارات</p>
                  <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">تم الإرسال</p>
                  <p className="text-3xl font-bold text-green-600">{notifications.filter((n) => n.sent).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">قيد الانتظار</p>
                  <p className="text-3xl font-bold text-orange-600">{notifications.filter((n) => !n.sent).length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
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
                placeholder="البحث عن إشعار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        notification.sent ? "bg-green-100" : "bg-orange-100"
                      }`}
                    >
                      {notification.sent ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Send className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.title}</h3>
                      <p className="text-gray-600 mb-4">{notification.message}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{notification.recipients.toLocaleString()} مستلم</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>{notification.date}</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg font-medium ${
                            notification.sent ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {notification.sent ? "تم الإرسال" : "قيد الانتظار"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!notification.sent && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      إرسال الآن
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
