import { type NextRequest, NextResponse } from "next/server"

function normalizeUrl(url: string): string {
  if (!url) return "http://localhost:4000"
  let normalized = url.replace(/^Https:/i, "https:").replace(/^Http:/i, "http:")
  normalized = normalized.replace(/\/api\/?$/, "")
  return normalized
}

const API_BASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")

const POSSIBLE_ENDPOINTS = [
  "/api/admin/shipments", // Try admin endpoint first since it works
  "/api/shipments",
  "/api/admin/shipment",
  "/api/customer/shipments",
  "/shipments",
  "/shipment",
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString()

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

  const attemptErrors: string[] = []

  for (const endpoint of POSSIBLE_ENDPOINTS) {
    const url = `${API_BASE_URL}${endpoint}${searchParams ? `?${searchParams}` : ""}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include",
      })

      const contentType = response.headers.get("content-type")

      if (response.ok && contentType?.includes("application/json")) {
        const data = await response.json()
        console.log(`[v0] ✓ Successfully loaded ${Array.isArray(data) ? data.length : "shipments"} from ${endpoint}`)

        let shipments = data

        // If data is an object with nested array, extract it
        if (!Array.isArray(data)) {
          shipments = data.data || data.shipments || data.results || []
        }

        // Ensure we always return an array
        if (!Array.isArray(shipments)) {
          console.log(`[v0] Warning: Could not extract array from response. Returning empty array.`)
          shipments = []
        }

        return NextResponse.json(shipments, { status: 200 })
      }

      if (response.status === 404) {
        attemptErrors.push(`${endpoint}: 404 Not Found`)
        continue
      }

      if (!response.ok && contentType?.includes("application/json")) {
        const errorData = await response.json()
        // If it's an auth error or other non-404 error, return it immediately
        if (response.status === 401 || response.status === 403) {
          console.log(`[v0] Authentication error from ${endpoint}`)
          return NextResponse.json(errorData, { status: response.status })
        }
        attemptErrors.push(`${endpoint}: ${response.status} ${errorData.message || "Error"}`)
        continue
      }
    } catch (error: any) {
      attemptErrors.push(`${endpoint}: ${error.message}`)
      continue
    }
  }

  console.log("[v0] ✗ All shipment endpoints failed:")
  attemptErrors.forEach((err) => console.log(`  - ${err}`))

  return NextResponse.json(
    {
      error: "Shipments endpoint not found",
      message: "لم يتم العثور على endpoint الشحنات على الخادم. يرجى التحقق من إعدادات API.",
      attemptedEndpoints: POSSIBLE_ENDPOINTS,
      suggestion: "تأكد من أن الخادم الخلفي يحتوي على endpoint للشحنات وأنه يعمل بشكل صحيح.",
    },
    { status: 404 },
  )
}
