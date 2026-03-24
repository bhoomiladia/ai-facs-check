import jsPDF from 'jspdf'
import type { VerificationResult } from '@/types'

// ─── Color palette for statuses ───
const STATUS_COLORS: Record<string, [number, number, number]> = {
  'True':                [34, 197, 94],   // green
  'False':               [239, 68,  68],  // red
  'Partially True':      [234, 179, 8],   // yellow
  'Outdated':            [249, 115, 22],  // orange
  'Disputed':            [168, 85,  247], // purple
  'Insufficient Context':[148, 163, 184], // slate
}

function getStatusColor(status: string): [number, number, number] {
  return STATUS_COLORS[status] ?? [148, 163, 184]
}

// ─── Helpers ───
function addPageIfNeeded(doc: jsPDF, y: number, margin: number): number {
  const pageH = doc.internal.pageSize.getHeight()
  if (y > pageH - margin - 20) {
    doc.addPage()
    return margin
  }
  return y
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

// ═══════════════════════════════════════════════
//  Main Export Function
// ═══════════════════════════════════════════════
export function exportVerificationAsPDF(result: VerificationResult): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  // ─── Header ───
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageW, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('Fact Verification Report', margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 26)
  doc.text(`Request ID: ${result.request_id}`, margin, 31)
  doc.text(`Processing Time: ${result.processing_time.toFixed(1)}s`, pageW - margin - 45, 31)

  y = 48

  // ─── Overall Verdict Bar ───
  const accuracy = Math.round(result.overall_accuracy * 100)
  const { true_claims, false_claims, partially_true_claims, total_claims } = result.metadata

  let verdictLabel = 'Mixed Results'
  let verdictColor: [number, number, number] = [234, 179, 8]
  if (total_claims === 0) {
    verdictLabel = 'No Claims'
    verdictColor = [148, 163, 184]
  } else {
    const ratio = (true_claims + partially_true_claims * 0.5) / total_claims
    if (ratio >= 0.7) { verdictLabel = 'Mostly True'; verdictColor = [34, 197, 94] }
    else if (ratio <= 0.3) { verdictLabel = 'Mostly False'; verdictColor = [239, 68, 68] }
  }

  doc.setFillColor(30, 41, 59) // slate-800
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...verdictColor)
  doc.text(`${verdictLabel}  —  ${accuracy}% Accuracy`, margin + 5, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `${total_claims} claims  |  ${true_claims} True  |  ${false_claims} False  |  ${partially_true_claims} Partial`,
    margin + 5,
    y + 17
  )

  y += 30

  // ─── Image Analysis (if present) ───
  if (result.metadata.image_analysis) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(168, 85, 247)
    doc.text('Image Analysis', margin, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(203, 213, 225)
    const imgLines = wrapText(doc, result.metadata.image_analysis.description, contentW - 4)
    for (const line of imgLines.slice(0, 8)) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin + 2, y)
      y += 4
    }
    y += 4
  }

  // ─── Verified Claims ───
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  y = addPageIfNeeded(doc, y, margin)
  doc.text('Verified Claims', margin, y)
  y += 8

  for (const vc of result.verified_claims) {
    y = addPageIfNeeded(doc, y, margin)
    const color = getStatusColor(vc.status)

    // Status color bar
    doc.setFillColor(...color)
    doc.rect(margin, y - 3, 2, 0, 'F') // thin left bar placeholder

    // Claim card background
    doc.setFillColor(30, 41, 59)
    const cardStartY = y - 4
    // We'll draw the background after calculating height

    // Status badge
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...color)
    doc.text(vc.status.toUpperCase(), margin + 4, y)

    // Confidence
    const confStr = `${Math.round(vc.confidence * 100)}% confidence`
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(confStr, pageW - margin - doc.getTextWidth(confStr), y)
    y += 5

    // Claim text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(226, 232, 240)
    const claimLines = wrapText(doc, vc.claim.text, contentW - 8)
    for (const line of claimLines) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin + 4, y)
      y += 4
    }
    y += 2

    // Reasoning
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    const reasonLines = wrapText(doc, vc.reasoning, contentW - 8)
    for (const line of reasonLines.slice(0, 6)) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin + 4, y)
      y += 3.5
    }
    y += 2

    // Correct Answer
    if (vc.correct_answer) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(34, 197, 94)
      doc.text('Correct Answer:', margin + 4, y)
      y += 3.5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(74, 222, 128)
      const correctLines = wrapText(doc, vc.correct_answer, contentW - 8)
      for (const line of correctLines.slice(0, 3)) {
        y = addPageIfNeeded(doc, y, margin)
        doc.text(line, margin + 4, y)
        y += 3.5
      }
      y += 1
    }

    // Temporal Note
    if (vc.temporal_note) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(249, 115, 22)
      doc.text('Temporal Context:', margin + 4, y)
      y += 3.5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(251, 146, 60)
      const tempLines = wrapText(doc, vc.temporal_note, contentW - 8)
      for (const line of tempLines.slice(0, 3)) {
        y = addPageIfNeeded(doc, y, margin)
        doc.text(line, margin + 4, y)
        y += 3.5
      }
      y += 1
    }

    // Conflicting Sources
    if (vc.conflicting_sources && vc.conflicting_sources.length > 0) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(168, 85, 247)
      doc.text('Conflicting Sources:', margin + 4, y)
      y += 3.5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(192, 132, 252)
      for (const cs of vc.conflicting_sources) {
        y = addPageIfNeeded(doc, y, margin)
        const csLines = wrapText(doc, `• ${cs}`, contentW - 10)
        for (const line of csLines) {
          doc.text(line, margin + 6, y)
          y += 3.5
        }
      }
      y += 1
    }

    // Evidence sources
    if (vc.evidence.length > 0) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('Sources:', margin + 4, y)
      y += 3.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      for (const ev of vc.evidence.slice(0, 3)) {
        y = addPageIfNeeded(doc, y, margin)
        const srcText = `[${ev.source}] ${ev.title}`
        const srcLines = wrapText(doc, srcText, contentW - 10)
        doc.text(srcLines[0], margin + 6, y)
        y += 3.5
      }
    }

    // Draw left color bar for the card
    const cardH = y - cardStartY
    doc.setFillColor(...color)
    doc.rect(margin, cardStartY, 1.5, cardH, 'F')

    // Separator line
    y += 3
    doc.setDrawColor(51, 65, 85)
    doc.line(margin, y, pageW - margin, y)
    y += 6
  }

  // ─── Footer ───
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('AI Fact Verification System', margin, pageH - 6)
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin - 20, pageH - 6)
  }

  // ─── Save ───
  const timestamp = new Date().toISOString().split('T')[0]
  doc.save(`fact-check-report-${timestamp}.pdf`)
}
