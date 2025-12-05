"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { initializeSocket, disconnectSocket } from "@/lib/socket"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken")
        const savedUser = localStorage.getItem("user")

        if (!token || !savedUser) {
          setLoading(false)
          return
        }

        const userData = JSON.parse(savedUser)
        setUser(userData)
        initializeSocket(userData.id)
      } catch (error) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password)

      if (!data || !data.token) {
        throw new Error(data?.message || "فشل تسجيل الدخول")
      }

      const { token, data: userData } = data

      localStorage.setItem("authToken", token)

      const formattedUser: User = {
        id: userData._id || userData.id,
        firstName: userData.firstName || userData.name?.split(" ")[0] || "المستخدم",
        lastName: userData.lastName || userData.name?.split(" ").slice(1).join(" ") || "",
        email: userData.email,
        role: userData.role || "user",
      }

      localStorage.setItem("user", JSON.stringify(formattedUser))

      setUser(formattedUser)
      initializeSocket(formattedUser.id)
      router.push("/dashboard")
    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
    disconnectSocket()

    setUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
