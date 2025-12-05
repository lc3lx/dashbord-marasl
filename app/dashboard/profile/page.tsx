"use client"

import { motion } from "framer-motion"
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, Edit, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../providers/AuthProvider"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "+966 50 123 4567",
    address: "الرياض، المملكة العربية السعودية",
    joinDate: "2024-01-15",
  })

  const handleSave = () => {
    // TODO: Save to backend
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">الملف الشخصي</h1>
                <p className="text-blue-100 mt-1">إدارة معلوماتك الشخصية</p>
              </div>
            </div>
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل الملف
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Profile Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20"
        >
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4" />
                {user?.role === "admin" ? "مدير النظام" : "مستخدم"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم الأول
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم الأخير
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="text-right"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                العنوان
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تاريخ الانضمام
              </label>
              <Input value={formData.joinDate} disabled className="text-right bg-gray-50" />
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            الأمان وكلمة المرور
          </h3>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              تغيير كلمة المرور
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              تفعيل المصادقة الثنائية
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent">
              حذف الحساب
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
