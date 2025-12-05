import { type NextRequest, NextResponse } from "next/server"

function normalizeUrl(url: string): string {
  if (!url) return "http://localhost:4000"
  let normalized = url.replace(/^Https:/i, "https:").replace(/^Http:/i, "http:")
  normalized = normalized.replace(/\/api\/?$/, "")
  return normalized
}

const API_BASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = `${API_BASE_URL}/admin/orders?${searchParams.toString()}`

  try {
    const authToken = request.headers.get("authorization") || request.headers.get("x-auth-token") || ""
    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch orders" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Orders API Error:", error.message)
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const url = `${API_BASE_URL}/admin/orders`

  try {
    const authToken = request.headers.get("authorization") || request.headers.get("x-auth-token") || ""
    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create order" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Create Order Error:", error.message)
    return NextResponse.json({ error: "Failed to create order", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updateData } = body
  const url = `${API_BASE_URL}/admin/orders/${id}`

  try {
    const authToken = request.headers.get("authorization") || request.headers.get("x-auth-token") || ""
    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to update order" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Update Order Error:", error.message)
    return NextResponse.json({ error: "Failed to update order", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const url = `${API_BASE_URL}/admin/orders/${id}`

  try {
    const authToken = request.headers.get("authorization") || request.headers.get("x-auth-token") || ""
    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to delete order" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Delete Order Error:", error.message)
    return NextResponse.json({ error: "Failed to delete order", details: error.message }, { status: 500 })
  }
}
