"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Globe,
  ImageIcon,
  FileText,
  Settings,
  Eye,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function HomePageSettings() {
  const router = useRouter()
  const [saveDialog, setSaveDialog] = useState(false)

  // Contact Information State
  const [contactInfo, setContactInfo] = useState({
    email: "info@company.com",
    phone: "+966 50 123 4567",
    address: "الرياض، المملكة العربية السعودية",
    facebook: "https://facebook.com/company",
    twitter: "https://twitter.com/company",
    instagram: "https://instagram.com/company",
    linkedin: "https://linkedin.com/company/company",
    website: "https://www.company.com",
  })

  // Hero Section State
  const [heroSection, setHeroSection] = useState({
    title: "مرحباً بك في منصتنا",
    subtitle: "نقدم أفضل الحلول لإدارة أعمالك بكفاءة واحترافية",
    buttonText: "ابدأ الآن",
    buttonLink: "/dashboard",
    backgroundImage: "/hero-bg.jpg",
  })

  // About Section State
  const [aboutSection, setAboutSection] = useState({
    title: "من نحن",
    description:
      "نحن شركة رائدة في مجال تقديم الحلول التقنية المتكاملة. نسعى لتقديم أفضل الخدمات لعملائنا من خلال فريق عمل محترف ومتخصص.",
    image: "/about-image.jpg",
  })

  // Features State
  const [features, setFeatures] = useState([
    { id: 1, title: "سهولة الاستخدام", description: "واجهة بسيطة وسهلة الاستخدام", icon: "⚡" },
    { id: 2, title: "أمان عالي", description: "حماية متقدمة لبياناتك", icon: "🔒" },
    { id: 3, title: "دعم فني", description: "دعم فني متاح على مدار الساعة", icon: "💬" },
  ])

  const handleSaveSettings = () => {
    // Here you would typically save to a database or API
    console.log("[v0] Saving homepage settings:", {
      contactInfo,
      heroSection,
      aboutSection,
      features,
    })
    setSaveDialog(true)
    setTimeout(() => setSaveDialog(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-pink-600 via-rose-600 to-red-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-4xl font-bold mb-2">إعدادات الصفحة الرئيسية</h1>
                <p className="text-pink-100">تحكم في محتوى وإعدادات الصفحة الرئيسية</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.open("/", "_blank")}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Eye className="w-5 h-5 mr-2" />
                معاينة
              </Button>
              <Button onClick={handleSaveSettings} className="bg-white text-pink-600 hover:bg-pink-50">
                <Save className="w-5 h-5 mr-2" />
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Contact Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">بيانات التواصل</h2>
              <p className="text-gray-600">معلومات الاتصال والتواصل الاجتماعي</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 text-blue-600" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="info@company.com"
                className="border-gray-300"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4 text-green-600" />
                رقم الهاتف
              </label>
              <Input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+966 50 123 4567"
                className="border-gray-300"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4 text-red-600" />
                العنوان
              </label>
              <Input
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="الرياض، المملكة العربية السعودية"
                className="border-gray-300"
              />
            </div>

            {/* Social Media Links */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Facebook className="w-4 h-4 text-blue-600" />
                فيسبوك
              </label>
              <Input
                value={contactInfo.facebook}
                onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })}
                placeholder="https://facebook.com/company"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Twitter className="w-4 h-4 text-sky-600" />
                تويتر
              </label>
              <Input
                value={contactInfo.twitter}
                onChange={(e) => setContactInfo({ ...contactInfo, twitter: e.target.value })}
                placeholder="https://twitter.com/company"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Instagram className="w-4 h-4 text-pink-600" />
                انستغرام
              </label>
              <Input
                value={contactInfo.instagram}
                onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                placeholder="https://instagram.com/company"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Linkedin className="w-4 h-4 text-blue-700" />
                لينكد إن
              </label>
              <Input
                value={contactInfo.linkedin}
                onChange={(e) => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/company"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Globe className="w-4 h-4 text-purple-600" />
                الموقع الإلكتروني
              </label>
              <Input
                value={contactInfo.website}
                onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                placeholder="https://www.company.com"
                className="border-gray-300"
              />
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">قسم البطل (Hero Section)</h2>
              <p className="text-gray-600">القسم الرئيسي في أعلى الصفحة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">العنوان الرئيسي</label>
              <Input
                value={heroSection.title}
                onChange={(e) => setHeroSection({ ...heroSection, title: e.target.value })}
                placeholder="مرحباً بك في منصتنا"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">العنوان الفرعي</label>
              <Textarea
                value={heroSection.subtitle}
                onChange={(e) => setHeroSection({ ...heroSection, subtitle: e.target.value })}
                placeholder="نقدم أفضل الحلول..."
                className="border-gray-300"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">نص الزر</label>
              <Input
                value={heroSection.buttonText}
                onChange={(e) => setHeroSection({ ...heroSection, buttonText: e.target.value })}
                placeholder="ابدأ الآن"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">رابط الزر</label>
              <Input
                value={heroSection.buttonLink}
                onChange={(e) => setHeroSection({ ...heroSection, buttonLink: e.target.value })}
                placeholder="/dashboard"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">صورة الخلفية (URL)</label>
              <Input
                value={heroSection.backgroundImage}
                onChange={(e) => setHeroSection({ ...heroSection, backgroundImage: e.target.value })}
                placeholder="/hero-bg.jpg"
                className="border-gray-300"
              />
            </div>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">قسم من نحن</h2>
              <p className="text-gray-600">معلومات عن الشركة</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">العنوان</label>
              <Input
                value={aboutSection.title}
                onChange={(e) => setAboutSection({ ...aboutSection, title: e.target.value })}
                placeholder="من نحن"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الوصف</label>
              <Textarea
                value={aboutSection.description}
                onChange={(e) => setAboutSection({ ...aboutSection, description: e.target.value })}
                placeholder="نحن شركة رائدة..."
                className="border-gray-300"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">صورة القسم (URL)</label>
              <Input
                value={aboutSection.image}
                onChange={(e) => setAboutSection({ ...aboutSection, image: e.target.value })}
                placeholder="/about-image.jpg"
                className="border-gray-300"
              />
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">المميزات</h2>
              <p className="text-gray-600">مميزات المنصة الرئيسية</p>
            </div>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={feature.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">الأيقونة (Emoji)</label>
                    <Input
                      value={feature.icon}
                      onChange={(e) => {
                        const newFeatures = [...features]
                        newFeatures[index].icon = e.target.value
                        setFeatures(newFeatures)
                      }}
                      placeholder="⚡"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">العنوان</label>
                    <Input
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...features]
                        newFeatures[index].title = e.target.value
                        setFeatures(newFeatures)
                      }}
                      placeholder="سهولة الاستخدام"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">الوصف</label>
                    <Input
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...features]
                        newFeatures[index].description = e.target.value
                        setFeatures(newFeatures)
                      }}
                      placeholder="واجهة بسيطة وسهلة"
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Save Success Dialog */}
      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">تم الحفظ بنجاح!</DialogTitle>
            <DialogDescription className="text-center">تم حفظ إعدادات الصفحة الرئيسية بنجاح</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Save className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
