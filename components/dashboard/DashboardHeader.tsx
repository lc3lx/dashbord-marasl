"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Search, User, ChevronDown, Menu, Package, Users, ShoppingCart, X } from 'lucide-react'
import { useAuth } from "../../app/providers/AuthProvider"
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export default function DashboardHeader({ isMobileOpen, setIsMobileOpen }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [openNotif, setOpenNotif] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)

    try {
      const [shipmentsRes, ordersRes, usersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipments?search=${query}`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?search=${query}`).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?search=${query}`).catch(() => null),
      ])

      const results = []

      if (shipmentsRes?.ok) {
        const shipments = await shipmentsRes.json()
        results.push(
          ...shipments.data.slice(0, 3).map((s: any) => ({
            type: 'shipment',
            id: s._id,
            title: `شحنة ${s.trackingNumber}`,
            subtitle: s.customerName,
            icon: Package,
          }))
        )
      }

      if (ordersRes?.ok) {
        const orders = await ordersRes.json()
        results.push(
          ...orders.data.slice(0, 3).map((o: any) => ({
            type: 'order',
            id: o._id,
            title: `طلب #${o.orderNumber || o._id.slice(-6)}`,
            subtitle: o.customerName,
            icon: ShoppingCart,
          }))
        )
      }

      if (usersRes?.ok) {
        const users = await usersRes.json()
        results.push(
          ...users.data.slice(0, 3).map((u: any) => ({
            type: 'user',
            id: u._id,
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.email,
            icon: Users,
          }))
        )
      }

      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error('[v0] Search error:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: any) => {
    setShowSearchResults(false)
    setSearchQuery("")
    
    switch (result.type) {
      case 'shipment':
        router.push(`/dashboard/shipments`)
        break
      case 'order':
        router.push(`/dashboard/orders`)
        break
      case 'user':
        router.push(`/dashboard/users/${result.id}`)
        break
    }
  }

  const handleProfileClick = () => {
    setOpenProfile(false)
    router.push("/dashboard/profile")
  }

  const handleSettingsClick = () => {
    setOpenProfile(false)
    router.push("/dashboard/settings")
  }

  const handleLogoutClick = () => {
    setOpenProfile(false)
    logout()
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            console.log("[v0] Header - Menu button clicked, isMobileOpen:", isMobileOpen)
            setIsMobileOpen(!isMobileOpen)
          }}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all shadow-lg hover:shadow-xl border border-gray-200"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl" ref={searchRef}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث في الشحنات، الطلبات، المستخدمين..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              className="py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 pb-2 pr-10 pl-10 w-[450px] mx-1.5"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto z-50">
                <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b bg-gray-50">
                  {isSearching ? "جاري البحث..." : `نتائج البحث (${searchResults.length})`}
                </div>
                {isSearching ? (
                  <div className="px-3 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm">جاري البحث...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul>
                    {searchResults.map((result, index) => {
                      const Icon = result.icon
                      return (
                        <li key={index}>
                          <button
                            onClick={() => handleResultClick(result)}
                            className="w-full text-right px-3 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{result.title}</p>
                              <p className="text-xs text-gray-500">{result.subtitle}</p>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-8 text-center text-gray-500">
                    <Search size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد نتائج للبحث عن "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="relative flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setOpenNotif(!openNotif)
                setOpenProfile(false)
              }}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>
            {openNotif && (
              <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">إشعارات</div>
                <ul className="max-h-64 overflow-auto text-sm">
                  <li className="px-3 py-2 hover:bg-gray-50">تم إنشاء شحنة جديدة</li>
                  <li className="px-3 py-2 hover:bg-gray-50">طلب جديد قيد المراجعة</li>
                  <li className="px-3 py-2 hover:bg-gray-50">إضافة رصيد لمحفظة عميل</li>
                </ul>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setOpenProfile(!openProfile)
                setOpenNotif(false)
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">مدير النظام</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            {openProfile && (
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden text-sm">
                <button onClick={handleProfileClick} className="w-full text-right px-3 py-2 hover:bg-gray-50">
                  الملف الشخصي
                </button>
                <button onClick={handleSettingsClick} className="w-full text-right px-3 py-2 hover:bg-gray-50">
                  الإعدادات
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-right px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
