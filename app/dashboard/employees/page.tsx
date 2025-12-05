"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UserCog,
  Users,
  Shield,
  Activity,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Search,
  MapPin,
  CreditCard,
  Briefcase,
  Award as IdCard,
  TrendingUp,
  Building2,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Wallet,
  TrendingDown,
  FileText,
  Filter,
} from "lucide-react"
import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function EmployeesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("all")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    salary: "",
    address: "",
    nationalId: "",
    contractType: "",
    status: "نشط",
    emergencyContact: "",
    emergencyPhone: "",
    permissions: [] as string[],
    shift: "",
    startTime: "",
    endTime: "",
    workingDays: [] as string[],
    breakDuration: "",
  })

  const periods = [
    { value: "day", label: "يومي" },
    { value: "week", label: "أسبوعي" },
    { value: "month", label: "شهري" },
    { value: "year", label: "سنوي" },
  ]

  const reportTypes = [
    { value: "all", label: "الكل", icon: Users },
    { value: "attendance", label: "الحضور", icon: CalendarCheck },
    { value: "payroll", label: "الرواتب", icon: Wallet },
    { value: "performance", label: "الأداء", icon: TrendingUp },
  ]

  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "أحمد محمد العلي",
      email: "ahmed@example.com",
      phone: "+966 50 123 4567",
      role: "مدير النظام",
      department: "الإدارة",
      status: "نشط",
      joinDate: "2023-01-15",
      avatar: "👨‍💼",
      color: "#3b82f6",
      permissions: ["كل الصلاحيات"],
      salary: 15000,
      attendance: {
        present: 22,
        absent: 1,
        late: 2,
        onTime: 20,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 15000,
        bonuses: 2000,
        deductions: 500,
        netSalary: 16500,
        lastPayment: "2024-01-01",
        paymentStatus: "مدفوع",
      },
    },
    {
      id: 2,
      name: "فاطمة خالد السعيد",
      email: "fatima@example.com",
      phone: "+966 55 234 5678",
      role: "مدير الشحنات",
      department: "العمليات",
      status: "نشط",
      joinDate: "2023-03-20",
      avatar: "👩‍💼",
      color: "#10b981",
      permissions: ["إدارة الشحنات", "عرض التقارير"],
      salary: 12000,
      attendance: {
        present: 24,
        absent: 0,
        late: 1,
        onTime: 23,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 12000,
        bonuses: 1500,
        deductions: 300,
        netSalary: 13200,
        lastPayment: "2024-01-01",
        paymentStatus: "مدفوع",
      },
    },
    {
      id: 3,
      name: "محمد عبدالله الحربي",
      email: "mohammed@example.com",
      phone: "+966 54 345 6789",
      role: "مدير الطلبات",
      department: "العمليات",
      status: "نشط",
      joinDate: "2023-05-10",
      avatar: "👨‍💻",
      color: "#8b5cf6",
      permissions: ["إدارة الطلبات", "عرض التقارير"],
      salary: 11000,
      attendance: {
        present: 23,
        absent: 1,
        late: 3,
        onTime: 20,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 11000,
        bonuses: 1000,
        deductions: 400,
        netSalary: 11600,
        lastPayment: "2024-01-01",
        paymentStatus: "مدفوع",
      },
    },
    {
      id: 4,
      name: "نورة سعد القحطاني",
      email: "noura@example.com",
      phone: "+966 56 456 7890",
      role: "مدير المستخدمين",
      department: "الدعم الفني",
      status: "نشط",
      joinDate: "2023-07-05",
      avatar: "👩‍💻",
      color: "#f59e0b",
      permissions: ["إدارة المستخدمين", "عرض التقارير"],
      salary: 10000,
      attendance: {
        present: 25,
        absent: 0,
        late: 0,
        onTime: 25,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 10000,
        bonuses: 2000,
        deductions: 200,
        netSalary: 11800,
        lastPayment: "2024-01-01",
        paymentStatus: "مدفوع",
      },
    },
    {
      id: 5,
      name: "خالد عمر الدوسري",
      email: "khaled@example.com",
      phone: "+966 53 567 8901",
      role: "محاسب",
      department: "المحاسبة",
      status: "نشط",
      joinDate: "2023-09-12",
      avatar: "👨‍💼",
      color: "#06b6d4",
      permissions: ["عرض التقارير المالية"],
      salary: 9000,
      attendance: {
        present: 22,
        absent: 2,
        late: 1,
        onTime: 21,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 9000,
        bonuses: 800,
        deductions: 300,
        netSalary: 9500,
        lastPayment: "2024-01-01",
        paymentStatus: "مدفوع",
      },
    },
    {
      id: 6,
      name: "سارة أحمد المطيري",
      email: "sara@example.com",
      phone: "+966 58 678 9012",
      role: "دعم فني",
      department: "الدعم الفني",
      status: "إجازة",
      joinDate: "2023-11-20",
      avatar: "👩‍💼",
      color: "#ec4899",
      permissions: ["دعم العملاء"],
      salary: 7000,
      attendance: {
        present: 18,
        absent: 5,
        late: 2,
        onTime: 16,
        totalDays: 25,
      },
      payroll: {
        baseSalary: 7000,
        bonuses: 500,
        deductions: 800,
        netSalary: 6700,
        lastPayment: "2024-01-01",
        paymentStatus: "معلق",
      },
    },
  ])

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()

    const newEmployee = {
      id: employees.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      department: formData.department,
      status: formData.status,
      joinDate: new Date().toISOString().split("T")[0],
      avatar: "👤",
      color: "#6366f1",
      permissions: formData.permissions.length > 0 ? formData.permissions : ["عرض التقارير"],
      salary: Number(formData.salary) || 0,
      attendance: {
        present: 0,
        absent: 0,
        late: 0,
        onTime: 0,
        totalDays: 0,
      },
      payroll: {
        baseSalary: Number(formData.salary) || 0,
        bonuses: 0,
        deductions: 0,
        netSalary: Number(formData.salary) || 0,
        lastPayment: new Date().toISOString().split("T")[0],
        paymentStatus: "معلق",
      },
    }

    setEmployees([...employees, newEmployee])
    setIsDialogOpen(false)
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      salary: "",
      address: "",
      nationalId: "",
      contractType: "",
      status: "نشط",
      emergencyContact: "",
      emergencyPhone: "",
      permissions: [],
      shift: "",
      startTime: "",
      endTime: "",
      workingDays: [],
      breakDuration: "",
    })
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }))
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.includes(searchQuery) ||
      emp.email.includes(searchQuery) ||
      emp.role.includes(searchQuery) ||
      emp.phone.includes(searchQuery),
  )

  const periodFilteredEmployees = useMemo(() => {
    const now = new Date()

    return filteredEmployees.filter((emp) => {
      const joinDate = new Date(emp.joinDate)

      switch (selectedPeriod) {
        case "day":
          // Today
          return (
            joinDate.getDate() === now.getDate() &&
            joinDate.getMonth() === now.getMonth() &&
            joinDate.getFullYear() === now.getFullYear()
          )
        case "week":
          // This week
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          return joinDate >= weekAgo
        case "month":
          // This month
          return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
        case "year":
          // This year
          return joinDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }, [filteredEmployees, selectedPeriod])

  const totalEmployees = periodFilteredEmployees.length
  const activeEmployees = periodFilteredEmployees.filter((e) => e.status === "نشط").length
  const onLeaveEmployees = periodFilteredEmployees.filter((e) => e.status === "إجازة").length
  const roles = [...new Set(periodFilteredEmployees.map((e) => e.role))].length
  const departments = [...new Set(periodFilteredEmployees.map((e) => e.department))]
  const departmentCount = departments.length
  const averageSalary =
    periodFilteredEmployees.length > 0
      ? Math.round(periodFilteredEmployees.reduce((sum, e) => sum + e.salary, 0) / periodFilteredEmployees.length)
      : 0

  // Calculate average tenure in months
  const averageTenure =
    periodFilteredEmployees.length > 0
      ? Math.round(
          periodFilteredEmployees.reduce((sum, e) => {
            const joinDate = new Date(e.joinDate)
            const now = new Date()
            const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
            return sum + months
          }, 0) / periodFilteredEmployees.length,
        )
      : 0

  // Department breakdown
  const departmentBreakdown = departments.map((dept) => ({
    name: dept,
    count: periodFilteredEmployees.filter((e) => e.department === dept).length,
    percentage:
      totalEmployees > 0
        ? Math.round((periodFilteredEmployees.filter((e) => e.department === dept).length / totalEmployees) * 100)
        : 0,
  }))

  // Role breakdown
  const roleBreakdown = [...new Set(periodFilteredEmployees.map((e) => e.role))].map((role) => ({
    name: role,
    count: periodFilteredEmployees.filter((e) => e.role === role).length,
  }))

  // Recent hires (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentHires = periodFilteredEmployees.filter((e) => new Date(e.joinDate) >= threeMonthsAgo)

  const totalPresent = periodFilteredEmployees.reduce((sum, e) => sum + e.attendance.present, 0)
  const totalAbsent = periodFilteredEmployees.reduce((sum, e) => sum + e.attendance.absent, 0)
  const totalLate = periodFilteredEmployees.reduce((sum, e) => sum + e.attendance.late, 0)
  const averageAttendanceRate =
    periodFilteredEmployees.length > 0
      ? Math.round(
          periodFilteredEmployees.reduce((sum, e) => sum + (e.attendance.present / e.attendance.totalDays) * 100, 0) /
            periodFilteredEmployees.length || 0,
        )
      : 0

  const totalPayroll = periodFilteredEmployees.reduce((sum, e) => sum + e.payroll.netSalary, 0)
  const totalBonuses = periodFilteredEmployees.reduce((sum, e) => sum + e.payroll.bonuses, 0)
  const totalDeductions = periodFilteredEmployees.reduce((sum, e) => sum + e.payroll.deductions, 0)
  const pendingPayments = periodFilteredEmployees.filter((e) => e.payroll.paymentStatus === "معلق").length

  const showStats = selectedReport === "all" || selectedReport === "performance"
  const showAttendance = selectedReport === "all" || selectedReport === "attendance"
  const showPayroll = selectedReport === "all" || selectedReport === "payroll"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 text-white"
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
                  <UserCog className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">إدارة الموظفين</h1>
                  <p className="text-slate-300 mt-1">إدارة ومراقبة جميع الموظفين والصلاحيات</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-3 bg-white text-slate-800 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة موظف جديد
            </button>
          </div>
        </motion.div>

        {/* Filter Section for period and report type selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
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

        {showStats && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">إجمالي الموظفين</h3>
                    <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{recentHires.length} موظف جديد (3 أشهر)</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">موظفون نشطون</h3>
                    <p className="text-2xl font-bold text-gray-900">{activeEmployees}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">
                    {totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0}% من الإجمالي
                  </span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">في إجازة</h3>
                    <p className="text-2xl font-bold text-gray-900">{onLeaveEmployees}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-sm font-medium">
                    {totalEmployees > 0 ? Math.round((onLeaveEmployees / totalEmployees) * 100) : 0}% من الإجمالي
                  </span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">الأقسام</h3>
                    <p className="text-2xl font-bold text-gray-900">{departmentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="text-sm font-medium">{roles} دور وظيفي</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">متوسط الراتب الشهري</h3>
                    <p className="text-2xl font-bold text-gray-900">{averageSalary.toLocaleString()} ر.س</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  إجمالي الرواتب: {periodFilteredEmployees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()} ر.س
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">متوسط مدة الخدمة</h3>
                    <p className="text-2xl font-bold text-gray-900">{averageTenure} شهر</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.floor(averageTenure / 12)} سنة و {averageTenure % 12} شهر
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-600 text-sm">الأدوار الوظيفية</h3>
                    <p className="text-2xl font-bold text-gray-900">{roles}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">توزيع متنوع للمسؤوليات</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                توزيع الموظفين حسب الأقسام
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentBreakdown.map((dept, index) => (
                  <motion.div
                    key={dept.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <span className="text-2xl font-bold text-indigo-600">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{dept.percentage}% من إجمالي الموظفين</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-purple-600" />
                توزيع الأدوار الوظيفية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleBreakdown.map((role, index) => (
                  <motion.div
                    key={role.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {role.count}
                      </div>
                      <span className="font-medium text-gray-900">{role.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {totalEmployees > 0 ? Math.round((role.count / totalEmployees) * 100) : 0}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {showAttendance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-blue-600" />
              نظام الدوام والحضور
            </h2>

            {/* Attendance Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">إجمالي الحضور</p>
                    <p className="text-2xl font-bold text-green-900">{totalPresent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-700 font-medium">إجمالي الغياب</p>
                    <p className="text-2xl font-bold text-red-900">{totalAbsent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-700 font-medium">التأخيرات</p>
                    <p className="text-2xl font-bold text-amber-900">{totalLate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">معدل الحضور</p>
                    <p className="text-2xl font-bold text-blue-900">{averageAttendanceRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Employee Attendance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">سجل الحضور الفردي</h3>
              {periodFilteredEmployees.map((employee) => {
                const attendanceRate =
                  Math.round((employee.attendance.present / employee.attendance.totalDays) * 100) || 0
                return (
                  <div
                    key={employee.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${employee.color}20` }}
                        >
                          {employee.avatar}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">حاضر</p>
                          <p className="text-lg font-bold text-green-600">{employee.attendance.present}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">غائب</p>
                          <p className="text-lg font-bold text-red-600">{employee.attendance.absent}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">متأخر</p>
                          <p className="text-lg font-bold text-amber-600">{employee.attendance.late}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">في الوقت</p>
                          <p className="text-lg font-bold text-blue-600">{employee.attendance.onTime}</p>
                        </div>
                      </div>

                      <div className="min-w-[200px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">معدل الحضور</span>
                          <span className="text-sm font-bold text-gray-900">{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              attendanceRate >= 90
                                ? "bg-green-500"
                                : attendanceRate >= 75
                                  ? "bg-blue-500"
                                  : attendanceRate >= 60
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                            }`}
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {showPayroll && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-600" />
              نظام الرواتب والمدفوعات
            </h2>

            {/* Payroll Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">إجمالي الرواتب</p>
                    <p className="text-xl font-bold text-emerald-900">{totalPayroll.toLocaleString()} ر.س</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">إجمالي المكافآت</p>
                    <p className="text-xl font-bold text-blue-900">{totalBonuses.toLocaleString()} ر.س</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl p-4 border border-rose-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-rose-700 font-medium">إجمالي الخصومات</p>
                    <p className="text-xl font-bold text-rose-900">{totalDeductions.toLocaleString()} ر.س</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-700 font-medium">مدفوعات معلقة</p>
                    <p className="text-2xl font-bold text-amber-900">{pendingPayments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Employee Payroll */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">تفاصيل الرواتب الفردية</h3>
              {periodFilteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${employee.color}20` }}
                      >
                        {employee.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              employee.payroll.paymentStatus === "مدفوع"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {employee.payroll.paymentStatus}
                          </span>
                          <span className="text-xs text-gray-500">آخر دفعة: {employee.payroll.lastPayment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-1">الراتب الأساسي</p>
                        <p className="text-lg font-bold text-blue-900">
                          {employee.payroll.baseSalary.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600">ر.س</p>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium mb-1">المكافآت</p>
                        <p className="text-lg font-bold text-green-900">+{employee.payroll.bonuses.toLocaleString()}</p>
                        <p className="text-xs text-green-600">ر.س</p>
                      </div>

                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 font-medium mb-1">الخصومات</p>
                        <p className="text-lg font-bold text-red-900">
                          -{employee.payroll.deductions.toLocaleString()}
                        </p>
                        <p className="text-xs text-red-600">ر.س</p>
                      </div>

                      <div className="text-center p-3 bg-gradient-to-br from-emerald-100 to-green-200 rounded-lg border-2 border-emerald-300">
                        <p className="text-xs text-emerald-700 font-medium mb-1">الصافي</p>
                        <p className="text-xl font-bold text-emerald-900">
                          {employee.payroll.netSalary.toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-700">ر.س</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        كشف الراتب
                      </button>
                      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4" />
                        دفع الراتب
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن موظف بالاسم، البريد، الدور أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </motion.div>

        {/* Employees List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة الموظفين</h2>

          <div className="space-y-4">
            {periodFilteredEmployees.map((employee) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: employee.id * 0.05 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: `${employee.color}20` }}
                    >
                      {employee.avatar}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${employee.color}20`,
                            color: employee.color,
                          }}
                        >
                          {employee.role}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            employee.status === "نشط" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {employee.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {employee.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          تاريخ الانضمام: {employee.joinDate}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">الصلاحيات:</p>
                        <div className="flex flex-wrap gap-2">
                          {employee.permissions.map((permission, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                      <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
                      <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {periodFilteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد نتائج للبحث أو الفترة المحددة</p>
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">إضافة موظف جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموظف الجديد بشكل كامل في النموذج أدناه</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee}>
            <div className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">المعلومات الشخصية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      الاسم الكامل *
                    </label>
                    <Input
                      id="name"
                      placeholder="أدخل الاسم الكامل"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nationalId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      رقم الهوية الوطنية *
                    </label>
                    <Input
                      id="nationalId"
                      placeholder="1234567890"
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    العنوان
                  </label>
                  <Input
                    id="address"
                    placeholder="المدينة، الحي، الشارع"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">معلومات الاتصال</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف *
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+966 50 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="emergencyContact"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      جهة الاتصال في حالات الطوارئ
                    </label>
                    <Input
                      id="emergencyContact"
                      placeholder="اسم جهة الاتصال"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="emergencyPhone"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      رقم الطوارئ
                    </label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="+966 50 123 4567"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Job Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">المعلومات الوظيفية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      الدور الوظيفي *
                    </label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور الوظيفي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="مدير النظام">مدير النظام</SelectItem>
                        <SelectItem value="مدير الشحنات">مدير الشحنات</SelectItem>
                        <SelectItem value="مدير الطلبات">مدير الطلبات</SelectItem>
                        <SelectItem value="مدير المستخدمين">مدير المستخدمين</SelectItem>
                        <SelectItem value="محاسب">محاسب</SelectItem>
                        <SelectItem value="دعم فني">دعم فني</SelectItem>
                        <SelectItem value="مندوب مبيعات">مندوب مبيعات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="department" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      القسم *
                    </label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الإدارة">الإدارة</SelectItem>
                        <SelectItem value="العمليات">العمليات</SelectItem>
                        <SelectItem value="المبيعات">المبيعات</SelectItem>
                        <SelectItem value="المحاسبة">المحاسبة</SelectItem>
                        <SelectItem value="الدعم الفني">الدعم الفني</SelectItem>
                        <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="contractType" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      نوع العقد *
                    </label>
                    <Select
                      value={formData.contractType}
                      onValueChange={(value) => setFormData({ ...formData, contractType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العقد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="دوام كامل">دوام كامل</SelectItem>
                        <SelectItem value="دوام جزئي">دوام جزئي</SelectItem>
                        <SelectItem value="عقد مؤقت">عقد مؤقت</SelectItem>
                        <SelectItem value="مستقل">مستقل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      الحالة *
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="إجازة">إجازة</SelectItem>
                        <SelectItem value="معلق">معلق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="salary" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    الراتب الشهري (ريال سعودي)
                  </label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="5000"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  معلومات الدوام وساعات العمل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="shift" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      وردية العمل *
                    </label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value) => setFormData({ ...formData, shift: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وردية العمل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="صباحية">صباحية (8 ص - 4 م)</SelectItem>
                        <SelectItem value="مسائية">مسائية (4 م - 12 م)</SelectItem>
                        <SelectItem value="ليلية">ليلية (12 م - 8 ص)</SelectItem>
                        <SelectItem value="مرنة">مرنة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="breakDuration"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      مدة الاستراحة (دقيقة)
                    </label>
                    <Select
                      value={formData.breakDuration}
                      onValueChange={(value) => setFormData({ ...formData, breakDuration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مدة الاستراحة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 دقيقة</SelectItem>
                        <SelectItem value="45">45 دقيقة</SelectItem>
                        <SelectItem value="60">ساعة واحدة</SelectItem>
                        <SelectItem value="90">ساعة ونصف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="startTime" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      وقت البدء *
                    </label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="endTime" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      وقت الانتهاء *
                    </label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    أيام العمل *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((day) => (
                      <div key={day} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={day}
                          checked={formData.workingDays.includes(day)}
                          onCheckedChange={() => toggleWorkingDay(day)}
                        />
                        <label
                          htmlFor={day}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">ملخص ساعات العمل:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• الوردية: {formData.shift || "غير محدد"}</li>
                        <li>
                          • ساعات العمل: {formData.startTime || "--:--"} إلى {formData.endTime || "--:--"}
                        </li>
                        <li>
                          • مدة الاستراحة: {formData.breakDuration ? `${formData.breakDuration} دقيقة` : "غير محدد"}
                        </li>
                        <li>
                          • أيام العمل: {formData.workingDays.length > 0 ? formData.workingDays.join("، ") : "غير محدد"}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">الصلاحيات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "كل الصلاحيات",
                    "إدارة الشحنات",
                    "إدارة الطلبات",
                    "إدارة المستخدمين",
                    "عرض التقارير",
                    "عرض التقارير المالية",
                    "دعم العملاء",
                    "إدارة المنتجات",
                  ].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={permission}
                        checked={formData.permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      <label
                        htmlFor={permission}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg hover:from-slate-800 hover:to-black transition-colors"
              >
                إضافة الموظف
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
