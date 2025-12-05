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
  const url = `${API_BASE_URL}/admin/carriers?${searchParams.toString()}`

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
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch carriers" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Carriers API Error:", error.message)
    return NextResponse.json({ error: "Failed to fetch carriers", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const url = `${API_BASE_URL}/admin/carriers`

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
      const errorData = await response.json().catch(() => ({ message: "Failed to create carrier" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Create Carrier Error:", error.message)
    return NextResponse.json({ error: "Failed to create carrier", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updateData } = body
  const url = `${API_BASE_URL}/admin/carriers/${id}`

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
      const errorData = await response.json().catch(() => ({ message: "Failed to update carrier" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Update Carrier Error:", error.message)
    return NextResponse.json({ error: "Failed to update carrier", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const url = `${API_BASE_URL}/admin/carriers/${id}`

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
      const errorData = await response.json().catch(() => ({ message: "Failed to delete carrier" }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error("[v0] Delete Carrier Error:", error.message)
    return NextResponse.json({ error: "Failed to delete carrier", details: error.message }, { status: 500 })
  }
}
