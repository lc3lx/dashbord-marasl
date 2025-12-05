import { io, type Socket } from "socket.io-client"

function normalizeUrl(url: string): string {
  if (!url) return "http://localhost:4000"
  return url.replace(/^Https:/i, "https:").replace(/^Http:/i, "http:")
}

const SOCKET_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000",
)

let socket: Socket | null = null

export const initializeSocket = (userId: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      timeout: 5000, // 5 seconds timeout
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    })

    socket.on("connect", () => {
      console.log("[v0] Socket connected:", socket?.id)
      socket?.emit("authenticate", userId)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected - هذا طبيعي عند إغلاق الصفحة")
    })

    socket.on("connect_error", (error) => {
      console.warn("[v0] Socket connection error - ميزة اختيارية، لا تؤثر على التطبيق:", error.message)
    })

    socket.on("connect_timeout", () => {
      console.warn("[v0] Socket connection timeout (optional feature)")
    })
  }

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event listeners
export const onNotification = (callback: (data: any) => void) => {
  socket?.on("notification", callback)
}

export const onOrderUpdate = (callback: (data: any) => void) => {
  socket?.on("orderUpdate", callback)
}

export const onShipmentUpdate = (callback: (data: any) => void) => {
  socket?.on("shipmentUpdate", callback)
}

export const onWalletUpdate = (callback: (data: any) => void) => {
  socket?.on("walletUpdate", callback)
}

// Remove listeners
export const offNotification = () => {
  socket?.off("notification")
}

export const offOrderUpdate = () => {
  socket?.off("orderUpdate")
}

export const offShipmentUpdate = () => {
  socket?.off("shipmentUpdate")
}

export const offWalletUpdate = () => {
  socket?.off("walletUpdate")
}
