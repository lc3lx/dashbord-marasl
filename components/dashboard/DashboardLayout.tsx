"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardHeader from "@/components/dashboard/DashboardHeader"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex flex-row" dir="rtl">
      {/* Sidebar - على اليمين وثابت (في RTL أول عنصر يظهر يمين) */}
      <DashboardSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content - يأخذ المساحة المتبقية */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
