"use client"

import { useState, useEffect } from "react"

// Base API URL - يمكن تغييره حسب البيئة
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Types
interface UserWalletResponse {
  data: {
    user: {
      _id: string
      firstName: string
      lastName?: string
      email: string
      phone?: string
      active: boolean
      createdAt: string
    }
    wallet: {
      balance: number
      currency: string
    }
    transactions: Array<{
      _id: string
      amount: number
      type: "deposit" | "withdrawal"
      date: string
      description: string
    }>
  }
}

interface UserActivityResponse {
  data: {
    activity: {
      orders: Array<{
        _id: string
        orderNumber: string
        createdAt: string
        status: string
      }>
      shipments: Array<{
        _id: string
        trackingId?: string
        companyshipmentid?: string
        shapmentCompany?: string
        ordervalue?: number
        totalprice?: number
        createdAt: string
      }>
    }
  }
}

// Custom hook for fetching user wallet data
export function useGetUserWalletQuery({ userId }: { userId: string }) {
  const [data, setData] = useState<UserWalletResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWallet = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/wallet`, {
        headers: {
          "Content-Type": "application/json",
          // يمكن إضافة token هنا إذا لزم الأمر
          // 'Authorization': `Bearer ${token}`
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch wallet data")
      }

      const raw = await response.json()
      const payload: any = (raw as any)?.data?.data || (raw as any)?.data || (raw as any)
      const normalized: UserWalletResponse = {
        data: {
          user: payload?.user,
          wallet: payload?.wallet,
          transactions: Array.isArray(payload?.transactions) ? payload.transactions : [],
        },
      }
      setData(normalized)
    } catch (err) {
      setError(err as Error)
      // في حالة الخطأ، نعيد بيانات تجريبية
      setData({
        data: {
          user: {
            _id: userId,
            firstName: "مستخدم",
            lastName: "تجريبي",
            email: "user@example.com",
            phone: "0501234567",
            active: true,
            createdAt: new Date().toISOString(),
          },
          wallet: {
            balance: 5000,
            currency: "SAR",
          },
          transactions: [
            {
              _id: "1",
              amount: 1000,
              type: "deposit",
              date: new Date().toISOString(),
              description: "إيداع",
            },
            {
              _id: "2",
              amount: 500,
              type: "withdrawal",
              date: new Date().toISOString(),
              description: "سحب",
            },
          ],
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchWallet()
    }
  }, [userId])

  return { data, isLoading, error, refetch: fetchWallet }
}

// Custom hook for fetching user activity data
export function useGetUserActivityQuery({ userId }: { userId: string }) {
  const [data, setData] = useState<UserActivityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activity`, {
          headers: {
            "Content-Type": "application/json",
            // يمكن إضافة token هنا إذا لزم الأمر
            // 'Authorization': `Bearer ${token}`
          },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch activity data")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
        // في حالة الخطأ، نعيد بيانات تجريبية
        setData({
          data: {
            activity: {
              orders: [
                {
                  _id: "1",
                  orderNumber: "ORD-001",
                  createdAt: new Date().toISOString(),
                  status: "completed",
                },
                {
                  _id: "2",
                  orderNumber: "ORD-002",
                  createdAt: new Date().toISOString(),
                  status: "pending",
                },
              ],
              shipments: [
                {
                  _id: "1",
                  trackingId: "TRK-001",
                  companyshipmentid: "SHIP-001",
                  shapmentCompany: "شركة الشحن السريع",
                  ordervalue: 1500,
                  totalprice: 1500,
                  createdAt: new Date().toISOString(),
                },
                {
                  _id: "2",
                  trackingId: "TRK-002",
                  companyshipmentid: "SHIP-002",
                  shapmentCompany: "التوصيل الممتاز",
                  ordervalue: 2800,
                  totalprice: 2800,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchActivity()
    }
  }, [userId])

  return { data, isLoading, error }
}

// Mutation hook: إضافة رصيد للمستخدم عبر مسارات الأدمن
export function useCreditUserWallet() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const credit = async ({ userId, amount, description }: { userId: string; amount: number; description?: string }) => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/admin/wallets/${userId}/add-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, description }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Failed to credit user wallet')
      }
      return await res.json().catch(() => ({}))
    } finally {
      setIsLoading(false)
    }
  }

  return { credit, isLoading, error }
}
