import { type NextRequest, NextResponse } from "next/server"

function normalizeUrl(url: string): string {
  if (!url) return "http://localhost:4000"

  let normalized = url.replace(/^Https:/i, "https:").replace(/^Http:/i, "http:")
  normalized = normalized.replace(/\/api\/?$/, "")

  return normalized
}

const API_BASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joinedPath = path.join("/")
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${API_BASE_URL}/${joinedPath}${searchParams ? `?${searchParams}` : ""}`

  try {
    const authToken =
      request.headers.get("x-auth-token") ||
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      ""

    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers["cookie"] = cookieHeader
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })

    const contentType = response.headers.get("content-type")

    if (!response.ok) {
      if (contentType?.includes("application/json")) {
        const errorData = await response.json()
        return NextResponse.json(errorData, { status: response.status })
      } else {
        const errorText = await response.text()
        return NextResponse.json(
          {
            error: "Request failed",
            message: errorText.includes("Cannot GET") ? "Endpoint not found" : errorText,
            status: response.status,
          },
          { status: response.status },
        )
      }
    }

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return NextResponse.json({ data: text }, { status: response.status })
    }
  } catch (error: any) {
    console.error("[v0] Proxy GET Error:", error.message)
    return NextResponse.json({ error: "Failed to fetch data", details: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joinedPath = path.join("/")
  const url = `${API_BASE_URL}/${joinedPath}`
  const body = await request.json()

  try {
    const authToken =
      request.headers.get("x-auth-token") ||
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      ""

    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers["cookie"] = cookieHeader
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return NextResponse.json({ data: text }, { status: response.status })
    }
  } catch (error: any) {
    console.error("[v0] Proxy POST Error:", error.message)
    return NextResponse.json({ error: "Failed to post data", details: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joinedPath = path.join("/")
  const url = `${API_BASE_URL}/${joinedPath}`
  const body = await request.json()

  try {
    const authToken =
      request.headers.get("x-auth-token") ||
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      ""

    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers["cookie"] = cookieHeader
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return NextResponse.json({ data: text }, { status: response.status })
    }
  } catch (error: any) {
    console.error("[v0] Proxy PUT Error:", error.message)
    return NextResponse.json({ error: "Failed to update data", details: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joinedPath = path.join("/")
  const url = `${API_BASE_URL}/${joinedPath}`
  const body = await request.json()

  try {
    const authToken =
      request.headers.get("x-auth-token") ||
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      ""

    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers["cookie"] = cookieHeader
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return NextResponse.json({ data: text }, { status: response.status })
    }
  } catch (error: any) {
    console.error("[v0] Proxy PATCH Error:", error.message)
    return NextResponse.json({ error: "Failed to patch data", details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joinedPath = path.join("/")
  const url = `${API_BASE_URL}/${joinedPath}`

  try {
    const authToken =
      request.headers.get("x-auth-token") ||
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      ""

    const cleanToken = authToken.replace("Bearer ", "").trim()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (cleanToken) {
      headers["authorization"] = `Bearer ${cleanToken}`
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      headers["cookie"] = cookieHeader
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return NextResponse.json({ data: text }, { status: response.status })
    }
  } catch (error: any) {
    console.error("[v0] Proxy DELETE Error:", error.message)
    return NextResponse.json({ error: "Failed to delete data", details: error.message }, { status: 500 })
  }
}
