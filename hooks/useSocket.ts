"use client"

import { useEffect } from "react"
import { initializeSocket, disconnectSocket, onNotification, offNotification } from "@/lib/socket"

export const useSocket = (userId?: string) => {
  useEffect(() => {
    if (userId) {
      const socket = initializeSocket(userId)

      return () => {
        disconnectSocket()
      }
    }
  }, [userId])
}

export const useNotifications = (callback: (data: any) => void) => {
  useEffect(() => {
    onNotification(callback)

    return () => {
      offNotification()
    }
  }, [callback])
}
