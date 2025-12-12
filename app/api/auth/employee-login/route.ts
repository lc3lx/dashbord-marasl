import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^Https:/i, "https:").replace(/^Http:/i, "http:") ||
  "https://www.marasil.site/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Employee login attempt for:", body.email)

    const response = await fetch(`${BACKEND_URL}/admin/employees/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.log("[v0] Employee login failed:", data)
      return NextResponse.json({ error: data.message || "فشل تسجيل الدخول" }, { status: response.status })
    }

    console.log("[v0] Employee login successful, token received:", {
      hasToken: !!data.token,
      tokenLength: data.token?.length,
      tokenPreview: data.token?.substring(0, 20) + "...",
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Employee API Route - خطأ:", error)
    return NextResponse.json({ error: error.message || "خطأ في الاتصال بالسيرفر" }, { status: 500 })
  }
}
