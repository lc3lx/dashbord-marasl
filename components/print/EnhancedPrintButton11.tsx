"use client"

import { Printer, Download, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

interface EnhancedPrintButtonProps {
  data: any[]
  title: string
  columns: { key: string; label: string }[]
  subtitle?: string
  showStats?: boolean
}

export default function EnhancedPrintButton({
  data,
  title,
  columns,
  subtitle,
  showStats = false,
}: EnhancedPrintButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const tableRows = data
      .map(
        (item, index) => `
      <tr style="${index % 2 === 0 ? "background-color: #f9fafb;" : ""}">
        ${columns
          .map(
            (col) => `
          <td style="padding: 14px 16px; border: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
            ${item[col.key] || "-"}
          </td>
        `,
          )
          .join("")}
      </tr>
    `,
      )
      .join("")

    const statsSection = showStats
      ? `
      <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 2px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin-bottom: 15px; font-size: 18px;">إحصائيات سريعة</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div style="text-align: center;">
            <p style="color: #64748b; font-size: 13px; margin-bottom: 5px;">إجمالي السجلات</p>
            <p style="color: #0c4a6e; font-size: 28px; font-weight: bold;">${data.length}</p>
          </div>
        </div>
      </div>
    `
      : ""

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طباعة ${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: white;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 16px;
            color: white;
          }
          .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 800;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .subtitle {
            text-align: center;
            color: #6b7280;
            font-size: 15px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
          }
          thead {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
          }
          th {
            padding: 18px 16px;
            text-align: right;
            font-weight: 700;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tbody tr:hover {
            background-color: #f3f4f6 !important;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            padding: 25px;
            background: #f9fafb;
            border-radius: 12px;
            border: 2px dashed #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .footer .date {
            color: #4f46e5;
            font-weight: 600;
            font-size: 15px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>تقرير شامل ومفصل</p>
        </div>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
        ${statsSection}
        <table>
          <thead>
            <tr>
              ${columns.map((col) => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام الإدارة المتقدم</p>
          <p class="date">تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setIsOpen(false)
  }

  const handleExportCSV = () => {
    const headers = columns.map((col) => col.label).join(",")
    const rows = data.map((item) => columns.map((col) => item[col.key] || "").join(",")).join("\n")
    const csv = `${headers}\n${rows}`
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${title}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    setIsOpen(false)
  }

  const handleExportPDF = async () => {
    try {
      console.log("[v0] بدء تصدير PDF...")

      const { default: jsPDF } = await import("jspdf")
      console.log("[v0] تم تحميل مكتبة jsPDF بنجاح")

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // إضافة العنوان الرئيسي
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, 297, 40, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.text(title, 148.5, 20, { align: "center" })

      doc.setFontSize(12)
      doc.text("تقرير شامل ومفصل", 148.5, 30, { align: "center" })

      let currentY = 50

      // إضافة العنوان الفرعي
      if (subtitle) {
        doc.setTextColor(107, 114, 128)
        doc.setFontSize(11)
        doc.text(subtitle, 148.5, currentY, { align: "center" })
        currentY += 10
      }

      // إضافة الإحصائيات
      if (showStats) {
        doc.setFillColor(240, 249, 255)
        doc.roundedRect(10, currentY, 277, 25, 3, 3, "F")

        doc.setTextColor(12, 74, 110)
        doc.setFontSize(14)
        doc.text("إحصائيات سريعة", 148.5, currentY + 10, { align: "center" })

        doc.setFontSize(18)
        doc.text(`إجمالي السجلات: ${data.length}`, 148.5, currentY + 20, { align: "center" })

        currentY += 35
      }

      console.log("[v0] بدء رسم الجدول...")

      // رسم الجدول يدوياً
      const colWidth = 270 / columns.length
      const rowHeight = 10
      const startX = 13.5

      // رسم رأس الجدول
      doc.setFillColor(79, 70, 229)
      doc.rect(startX, currentY, 270, rowHeight, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")

      columns.forEach((col, index) => {
        const x = startX + colWidth * (columns.length - 1 - index) + colWidth / 2
        doc.text(col.label, x, currentY + 7, { align: "center" })
      })

      currentY += rowHeight

      // رسم صفوف البيانات
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      data.forEach((item, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(startX, currentY, 270, rowHeight, "F")
        }

        doc.setDrawColor(229, 231, 235)
        columns.forEach((col, colIndex) => {
          const x = startX + colWidth * (columns.length - 1 - colIndex)
          doc.rect(x, currentY, colWidth, rowHeight, "S")
        })

        doc.setTextColor(55, 65, 81)
        columns.forEach((col, colIndex) => {
          const x = startX + colWidth * (columns.length - 1 - colIndex) + colWidth / 2
          const value = String(item[col.key] || "-")
          const truncatedValue = value.length > 20 ? value.substring(0, 17) + "..." : value
          doc.text(truncatedValue, x, currentY + 7, { align: "center" })
        })

        currentY += rowHeight

        if (currentY > 180 && rowIndex < data.length - 1) {
          doc.addPage()
          currentY = 20

          doc.setFillColor(79, 70, 229)
          doc.rect(startX, currentY, 270, rowHeight, "F")

          doc.setTextColor(255, 255, 255)
          doc.setFontSize(11)
          doc.setFont("helvetica", "bold")

          columns.forEach((col, index) => {
            const x = startX + colWidth * (columns.length - 1 - index) + colWidth / 2
            doc.text(col.label, x, currentY + 7, { align: "center" })
          })

          currentY += rowHeight
          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
        }
      })

      console.log("[v0] تم رسم الجدول بنجاح، إضافة التذييل...")

      // إضافة التذييل
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        doc.setFillColor(249, 250, 251)
        doc.rect(0, 190, 297, 20, "F")

        doc.setTextColor(107, 114, 128)
        doc.setFontSize(9)
        doc.text("تم إنشاء هذا التقرير بواسطة نظام الإدارة المتقدم", 148.5, 197, { align: "center" })

        doc.setTextColor(79, 70, 229)
        doc.setFontSize(10)
        const dateStr = new Date().toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        doc.text(`تاريخ الإنشاء: ${dateStr}`, 148.5, 203, { align: "center" })

        doc.setTextColor(107, 114, 128)
        doc.setFontSize(8)
        doc.text(`صفحة ${i} من ${pageCount}`, 148.5, 208, { align: "center" })
      }

      console.log("[v0] حفظ ملف PDF...")
      doc.save(`${title}_${new Date().toISOString().split("T")[0]}.pdf`)
      console.log("[v0] تم تصدير PDF بنجاح!")

      setIsOpen(false)
    } catch (error) {
      console.error("[v0] خطأ في تصدير PDF:", error)
      alert("حدث خطأ أثناء تصدير PDF. يرجى المحاولة مرة أخرى.")
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md"
      >
        <Printer className="w-5 h-5 text-gray-600" />
        <span className="font-semibold text-gray-700">طباعة وتصدير</span>
      </motion.button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-indigo-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Printer className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">طباعة</p>
                  <p className="text-xs text-gray-500">طباعة التقرير مباشرة</p>
                </div>
              </button>

              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-red-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">تصدير PDF</p>
                  <p className="text-xs text-gray-500">حفظ كملف PDF</p>
                </div>
              </button>

              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-green-50 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">تصدير CSV</p>
                  <p className="text-xs text-gray-500">حفظ كملف إكسل</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
