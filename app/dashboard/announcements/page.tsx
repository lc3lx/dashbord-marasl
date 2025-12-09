"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Filter,
  X,
  Bold,
  Italic,
  Underline,
  Type,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { announcementsAPI, usersAPI, adminNotificationsAPI } from "@/lib/api"

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<any>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    active: true,
    startDate: "",
    endDate: "",
    noEndDate: false,
  })
  const [sendToAll, setSendToAll] = useState(false)
  const [recipientEmails, setRecipientEmails] = useState("")
  const [recipientSearch, setRecipientSearch] = useState("")
  const [recipientResults, setRecipientResults] = useState<any[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])

  const [textColor, setTextColor] = useState("#000000")
  const [bgColor, setBgColor] = useState("#ffffff")
  const [fontSize, setFontSize] = useState("16px")
  const [fontFamily, setFontFamily] = useState("Cairo")
  const contentEditableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [selectedPeriod, selectedReport, customDateFrom, customDateTo])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const resp = await announcementsAPI.getAll()
      const list = Array.isArray(resp) ? resp : Array.isArray((resp as any)?.data) ? (resp as any).data : []
      setItems(list)
    } catch (e: any) {
      setItems([])
      setError(e?.message || "فشل في تحميل الإعلانات")
    } finally {
      setLoading(false)
    }
  }

  const searchRecipients = async () => {
    try {
      const params: any = { page: "1", limit: "10" }
      if (recipientSearch) params.search = recipientSearch
      const resp = await usersAPI.getAll(params)
      const data = (resp as any)?.data || resp || []
      setRecipientResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setRecipientResults([])
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
    { label: "الكل", value: "all", icon: Megaphone },
    { label: "نشطة", value: "active", icon: Eye },
    { label: "غير نشطة", value: "inactive", icon: Megaphone },
  ]

  const announcements = useMemo(() => {
    const list = Array.isArray(items) ? items : []
    // Apply simple client filters
    const filtered = list.filter((a: any) => {
      const matchSearch = !searchTerm ||
        (String(a.title || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
        (String(a.content || "").toLowerCase().includes(searchTerm.toLowerCase()))
      const isActive = typeof a.active === 'boolean' ? a.active : Boolean(a.isActive)
      const matchReport = selectedReport === 'all' ||
        (selectedReport === 'active' && isActive) ||
        (selectedReport === 'inactive' && !isActive)
      // Period filter by createdAt
      let matchPeriod = true
      const createdAt = a.createdAt ? new Date(a.createdAt) : null
      if (selectedPeriod === 'custom' && customDateFrom && customDateTo && createdAt) {
        const from = new Date(customDateFrom)
        const to = new Date(customDateTo)
        matchPeriod = createdAt >= from && createdAt <= to
      }
      return matchSearch && matchReport && matchPeriod
    })
    return filtered
  }, [items, searchTerm, selectedReport, selectedPeriod, customDateFrom, customDateTo])

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getAnnouncementStatus = (announcement: any) => {
    const now = new Date()
    const start = announcement.startDate ? new Date(announcement.startDate) : null
    const end = announcement.endDate ? new Date(announcement.endDate) : null

    const isActive = typeof announcement.active === 'boolean' ? announcement.active : Boolean(announcement.isActive)
    if (!isActive) {
      return { text: "غير نشط", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-700" }
    }

    if (start && now < start) {
      return { text: "قريباً", color: "blue", bgColor: "bg-blue-100", textColor: "text-blue-700" }
    }

    if (end && now > end) {
      return { text: "منتهي", color: "red", bgColor: "bg-red-100", textColor: "text-red-700" }
    }

    if (end) {
      const daysLeft = getDaysRemaining(announcement.endDate)
      if (daysLeft !== null && daysLeft <= 3) {
        return { text: "ينتهي قريباً", color: "orange", bgColor: "bg-orange-100", textColor: "text-orange-700" }
      }
    }

    return { text: "نشط", color: "green", bgColor: "bg-green-100", textColor: "text-green-700" }
  }

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    contentEditableRef.current?.focus()
  }

  const handleEditClick = (announcement: any) => {
    setEditingAnnouncement({ ...announcement })
    setIsEditModalOpen(true)
    setTimeout(() => {
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = announcement.content
      }
    }, 100)
  }

  const handleDeleteClick = (announcement: any) => {
    setDeletingAnnouncement(announcement)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAnnouncement) return
    try {
      await announcementsAPI.delete(deletingAnnouncement._id || deletingAnnouncement.id)
      await fetchAnnouncements()
      setIsDeleteModalOpen(false)
      setDeletingAnnouncement(null)
      alert("تم حذف الإعلان بنجاح!")
    } catch (e: any) {
      alert(e?.message || "فشل حذف الإعلان")
    }
  }

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement.title || !editingAnnouncement.content) {
      alert("الرجاء ملء جميع الحقول المطلوبة")
      return
    }
    try {
      const payload: any = {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        isActive: typeof editingAnnouncement.active === 'boolean' ? editingAnnouncement.active : editingAnnouncement.isActive,
        backgroundColor: bgColor,
        textColor: textColor,
        // accept raw values; backend will validate
        startDate: editingAnnouncement.startDate || null,
        endDate: editingAnnouncement.noEndDate ? null : (editingAnnouncement.endDate || null),
      }
      await announcementsAPI.update(editingAnnouncement._id || editingAnnouncement.id, payload)
      await fetchAnnouncements()
      setIsEditModalOpen(false)
      setEditingAnnouncement(null)
      alert("تم تحديث الإعلان بنجاح!")
    } catch (e: any) {
      alert(e?.message || "فشل تحديث الإعلان")
    }
  }

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      if (isEditModalOpen) {
        setEditingAnnouncement({ ...editingAnnouncement, content: contentEditableRef.current.innerHTML })
      } else {
        setNewAnnouncement({ ...newAnnouncement, content: contentEditableRef.current.innerHTML })
      }
    }
  }

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert("الرجاء ملء جميع الحقول المطلوبة")
      return
    }
    try {
      const payload: any = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        isActive: newAnnouncement.active,
        backgroundColor: bgColor,
        textColor: textColor,
        startDate: newAnnouncement.startDate || null,
        endDate: newAnnouncement.noEndDate ? null : (newAnnouncement.endDate || null),
      }
      const created = await announcementsAPI.create(payload)
      const annId = (created && (created._id || created.id)) || null
      if (annId && (sendToAll || selectedRecipientIds.length)) {
        const text = String(newAnnouncement.content || "").replace(/<[^>]+>/g, " ").trim()
        if (sendToAll) {
          await adminNotificationsAPI.create({ type: "broadcast", title: newAnnouncement.title, message: text })
        }
        if (selectedRecipientIds.length) {
          await Promise.all(
            selectedRecipientIds.map((cid) =>
              adminNotificationsAPI.create({ type: "targeted", title: newAnnouncement.title, message: text, customerId: cid })
            ),
          )
        }
      }
      await fetchAnnouncements()
      setIsAddModalOpen(false)
      setNewAnnouncement({ title: "", content: "", active: true, startDate: "", endDate: "", noEndDate: false })
      setSendToAll(false)
      setRecipientEmails("")
      alert("تم إضافة الإعلان بنجاح!")
    } catch (e: any) {
      alert(e?.message || "فشل إضافة الإعلان")
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
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">إدارة الإعلانات</h1>
                  <p className="text-gray-500">نشر وإدارة الإعلانات العامة</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                إضافة إعلان
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي الإعلانات</p>
                  <p className="text-3xl font-bold text-gray-900">{announcements.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">نشطة</p>
                  <p className="text-3xl font-bold text-green-600">{announcements.filter((a: any) => (typeof a.active === 'boolean' ? a.active : Boolean(a.isActive))).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 mb-2">إجمالي المشاهدات</p>
                  <p className="text-3xl font-bold text-violet-600">{announcements.reduce((sum: number, a: any) => sum + (Number(a.views) || 0), 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-violet-600" />
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
                placeholder="البحث عن إعلان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {announcements.map((announcement: any) => {
              const status = getAnnouncementStatus(announcement)
              const daysRemaining = getDaysRemaining(announcement.endDate)

              return (
                <motion.div
                  key={announcement._id || announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Megaphone className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${status.bgColor} ${status.textColor}`}
                          >
                            {status.text}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{announcement.content}</p>

                        <div className="rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {announcement.startDate && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">تاريخ البدء</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(announcement.startDate).toLocaleDateString("ar-SA", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {announcement.endDate ? (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(announcement.endDate).toLocaleDateString("ar-SA", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">المدة</p>
                                  <p className="text-sm font-medium text-purple-700">إعلان دائم</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{(Number(announcement.views) || 0).toLocaleString()} مشاهدة</span>
                          </div>
                          <span>نُشر في {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('ar-SA') : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditClick(announcement)}
                        className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteClick(announcement)}
                        className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

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
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">إضافة إعلان جديد</h2>
                        <p className="text-violet-100 text-sm">قم بإنشاء إعلان جديد للمستخدمين</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="مثال: تحديث سياسة الشحن"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-violet-600" />
                      <h3 className="text-lg font-semibold text-gray-900">المدة الزمنية</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البدء</label>
                        <input
                          type="datetime-local"
                          value={newAnnouncement.startDate}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, startDate: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">اتركه فارغاً للبدء فوراً</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء</label>
                        <input
                          type="datetime-local"
                          value={newAnnouncement.endDate}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, endDate: e.target.value })}
                          disabled={newAnnouncement.noEndDate}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">متى سينتهي عرض الإعلان</p>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAnnouncement.noEndDate}
                          onChange={(e) =>
                            setNewAnnouncement({
                              ...newAnnouncement,
                              noEndDate: e.target.checked,
                              endDate: e.target.checked ? "" : newAnnouncement.endDate,
                            })
                          }
                          className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                        />
                        <span className="text-sm font-medium text-gray-700">بدون تاريخ انتهاء (إعلان دائم)</span>
                      </label>
                      <p className="text-xs text-gray-500 mr-8 mt-1">سيبقى الإعلان نشطاً حتى يتم إيقافه يدوياً</p>
                    </div>

                    {newAnnouncement.startDate && newAnnouncement.endDate && !newAnnouncement.noEndDate && (
                      <div className="bg-white border border-violet-300 rounded-lg p-3">
                        <p className="text-sm text-violet-800">
                          <span className="font-semibold">المدة:</span> من{" "}
                          {new Date(newAnnouncement.startDate).toLocaleString("ar-SA")} إلى{" "}
                          {new Date(newAnnouncement.endDate).toLocaleString("ar-SA")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      محتوى الإعلان <span className="text-red-500">*</span>
                    </label>

                    {/* شريط الأدوات */}
                    <div className="border border-gray-300 rounded-t-xl bg-gray-50 p-3 flex flex-wrap items-center gap-3">
                      {/* حجم الخط */}
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-gray-600" />
                        <select
                          value={fontSize}
                          onChange={(e) => {
                            setFontSize(e.target.value)
                            applyFormat("fontSize", "7")
                            if (contentEditableRef.current) {
                              const selection = window.getSelection()
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0)
                                const span = document.createElement("span")
                                span.style.fontSize = e.target.value
                                range.surroundContents(span)
                              }
                            }
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="12px">صغير</option>
                          <option value="16px">متوسط</option>
                          <option value="20px">كبير</option>
                          <option value="24px">كبير جداً</option>
                        </select>
                      </div>

                      {/* نوع الخط */}
                      <select
                        value={fontFamily}
                        onChange={(e) => {
                          setFontFamily(e.target.value)
                          applyFormat("fontName", e.target.value)
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="Cairo">Cairo</option>
                        <option value="Tajawal">Tajawal</option>
                        <option value="Almarai">Almarai</option>
                        <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                        <option value="Arial">Arial</option>
                      </select>

                      <div className="w-px h-6 bg-gray-300"></div>

                      {/* أزرار التنسيق */}
                      <button
                        type="button"
                        onClick={() => applyFormat("bold")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="عريض"
                      >
                        <Bold className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("italic")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="مائل"
                      >
                        <Italic className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("underline")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="تحته خط"
                      >
                        <Underline className="w-4 h-4 text-gray-700" />
                      </button>

                      <div className="w-px h-6 bg-gray-300"></div>

                      {/* لون النص */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">لون النص:</label>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value)
                            applyFormat("foreColor", e.target.value)
                          }}
                          className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      {/* لون الخلفية */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">لون الخلفية:</label>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            applyFormat("backColor", e.target.value)
                          }}
                          className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* منطقة الكتابة */}
                    <div
                      ref={contentEditableRef}
                      contentEditable
                      onInput={handleContentChange}
                      className="w-full min-h-[200px] px-4 py-3 border border-t-0 border-gray-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      style={{
                        fontFamily: fontFamily,
                      }}
                      suppressContentEditableWarning
                    >
                      {!newAnnouncement.content && <span className="text-gray-400">اكتب محتوى الإعلان هنا...</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      استخدم شريط الأدوات أعلاه لتنسيق النص وتغيير الألوان والخطوط
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAnnouncement.active}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, active: e.target.checked })}
                        className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm font-medium text-gray-700">تفعيل الإعلان فوراً</span>
                    </label>
                    <p className="text-sm text-gray-500 mr-8 mt-1">إذا تم التفعيل، سيظهر الإعلان للمستخدمين مباشرة</p>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-violet-600" />
                      <h3 className="text-sm font-semibold text-gray-900">المستلمون (اختياري لإرسال بريد)</h3>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToAll}
                        onChange={(e) => setSendToAll(e.target.checked)}
                        className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm font-medium text-gray-700">إرسال إلى جميع المستخدمين</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">عناوين بريد (مفصولة بفواصل)</label>
                      <input
                        type="text"
                        value={recipientEmails}
                        onChange={(e) => setRecipientEmails(e.target.value)}
                        placeholder="user1@example.com, user2@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">اترك الحقل فارغاً إذا لا ترغب بإرسال بريد الآن</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">بحث عن مستخدمين لإرسال بريد</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          placeholder="الاسم أو البريد"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                          type="button"
                          onClick={searchRecipients}
                          className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700"
                        >بحث</button>
                      </div>
                      {recipientResults.length > 0 && (
                        <div className="max-h-40 overflow-auto border border-violet-200 rounded-lg p-2 bg-white">
                          {recipientResults.map((u: any) => {
                            const id = u._id || u.id
                            const checked = selectedRecipientIds.includes(id)
                            return (
                              <label key={id} className="flex items-center justify-between py-1 px-2 hover:bg-violet-50 rounded">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      setSelectedRecipientIds((prev) => {
                                        if (e.target.checked) return Array.from(new Set([...prev, id]))
                                        return prev.filter((x) => x !== id)
                                      })
                                    }}
                                    className="w-4 h-4 text-violet-600"
                                  />
                                  <span className="text-sm text-gray-800">{u.firstName} {u.lastName}</span>
                                </div>
                                <span className="text-xs text-gray-500">{u.email}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      {selectedRecipientIds.length > 0 && (
                        <p className="text-xs text-gray-600">تم اختيار {selectedRecipientIds.length} مستخدم(ين)</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    حفظ الإعلان
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isEditModalOpen && editingAnnouncement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsEditModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Edit className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">تعديل الإعلان</h2>
                        <p className="text-blue-100 text-sm">قم بتحديث بيانات الإعلان</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عنوان الإعلان <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingAnnouncement.title}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                      placeholder="مثال: تحديث سياسة الشحن"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">المدة الزمنية</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البدء</label>
                        <input
                          type="datetime-local"
                          value={editingAnnouncement.startDate || ""}
                          onChange={(e) =>
                            setEditingAnnouncement({ ...editingAnnouncement, startDate: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">اتركه فارغاً للبدء فوراً</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء</label>
                        <input
                          type="datetime-local"
                          value={editingAnnouncement.endDate || ""}
                          onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, endDate: e.target.value })}
                          disabled={editingAnnouncement.noEndDate}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">متى سينتهي عرض الإعلان</p>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingAnnouncement.noEndDate || false}
                          onChange={(e) =>
                            setEditingAnnouncement({
                              ...editingAnnouncement,
                              noEndDate: e.target.checked,
                              endDate: e.target.checked ? "" : editingAnnouncement.endDate,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">بدون تاريخ انتهاء (إعلان دائم)</span>
                      </label>
                      <p className="text-xs text-gray-500 mr-8 mt-1">سيبقى الإعلان نشطاً حتى يتم إيقافه يدوياً</p>
                    </div>

                    {editingAnnouncement.startDate && editingAnnouncement.endDate && !editingAnnouncement.noEndDate && (
                      <div className="bg-white border border-blue-300 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">المدة:</span> من{" "}
                          {new Date(editingAnnouncement.startDate).toLocaleString("ar-SA")} إلى{" "}
                          {new Date(editingAnnouncement.endDate).toLocaleString("ar-SA")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      محتوى الإعلان <span className="text-red-500">*</span>
                    </label>

                    {/* شريط الأدوات */}
                    <div className="border border-gray-300 rounded-t-xl bg-gray-50 p-3 flex flex-wrap items-center gap-3">
                      {/* حجم الخط */}
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-gray-600" />
                        <select
                          value={fontSize}
                          onChange={(e) => {
                            setFontSize(e.target.value)
                            applyFormat("fontSize", "7")
                            if (contentEditableRef.current) {
                              const selection = window.getSelection()
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0)
                                const span = document.createElement("span")
                                span.style.fontSize = e.target.value
                                range.surroundContents(span)
                              }
                            }
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="12px">صغير</option>
                          <option value="16px">متوسط</option>
                          <option value="20px">كبير</option>
                          <option value="24px">كبير جداً</option>
                        </select>
                      </div>

                      {/* نوع الخط */}
                      <select
                        value={fontFamily}
                        onChange={(e) => {
                          setFontFamily(e.target.value)
                          applyFormat("fontName", e.target.value)
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cairo">Cairo</option>
                        <option value="Tajawal">Tajawal</option>
                        <option value="Almarai">Almarai</option>
                        <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                        <option value="Arial">Arial</option>
                      </select>

                      <div className="w-px h-6 bg-gray-300"></div>

                      {/* أزرار التنسيق */}
                      <button
                        type="button"
                        onClick={() => applyFormat("bold")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="عريض"
                      >
                        <Bold className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("italic")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="مائل"
                      >
                        <Italic className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("underline")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="تحته خط"
                      >
                        <Underline className="w-4 h-4 text-gray-700" />
                      </button>

                      <div className="w-px h-6 bg-gray-300"></div>

                      {/* لون النص */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">لون النص:</label>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value)
                            applyFormat("foreColor", e.target.value)
                          }}
                          className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      {/* لون الخلفية */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">لون الخلفية:</label>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => {
                            setBgColor(e.target.value)
                            applyFormat("backColor", e.target.value)
                          }}
                          className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* منطقة الكتابة */}
                    <div
                      ref={contentEditableRef}
                      contentEditable
                      onInput={handleContentChange}
                      className="w-full min-h-[200px] px-4 py-3 border border-t-0 border-gray-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        fontFamily: fontFamily,
                      }}
                      suppressContentEditableWarning
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      استخدم شريط الأدوات أعلاه لتنسيق النص وتغيير الألوان والخطوط
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAnnouncement.active}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, active: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">تفعيل الإعلان</span>
                    </label>
                    <p className="text-sm text-gray-500 mr-8 mt-1">إذا تم التفعيل، سيظهر الإعلان للمستخدمين مباشرة</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleUpdateAnnouncement}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isDeleteModalOpen && deletingAnnouncement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">تأكيد الحذف</h2>
                      <p className="text-red-100 text-sm">هذا الإجراء لا يمكن التراجع عنه</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-gray-700 mb-2">هل أنت متأكد من حذف هذا الإعلان؟</p>
                    <p className="text-lg font-bold text-gray-900">{deletingAnnouncement.title}</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 mb-1">تحذير</p>
                      <p className="text-sm text-yellow-800">
                        سيتم حذف الإعلان نهائياً ولن يتمكن المستخدمون من رؤيته بعد الآن
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    حذف الإعلان
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
