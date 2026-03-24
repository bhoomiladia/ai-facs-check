import jsPDF from 'jspdf'
import type { VerificationResult, AITextDetectionResult } from '@/types'

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
  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(0, 0, 0)
  const title = 'THE DAILY VERIFIER'
  doc.text(title, pageW / 2, 22, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('times', 'italic')
  doc.text('Special Fact Verification Report', pageW / 2, 28, { align: 'center' })

  // Double line border below header
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, 32, pageW - margin, 32)
  doc.setLineWidth(1.5)
  doc.line(margin, 34, pageW - margin, 34)

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Vol. I — No. 1`, margin, 40)
  doc.text(today, pageW / 2, 40, { align: 'center' })
  doc.text(`Req: ${result.request_id.slice(0, 8)}`, pageW - margin, 40, { align: 'right' })

  doc.setLineWidth(0.5)
  doc.line(margin, 43, pageW - margin, 43)

  y = 52

  // ─── Overall Verdict Bar ───
  const accuracy = Math.round(result.overall_accuracy * 100)
  const { true_claims, false_claims, partially_true_claims, total_claims } = result.metadata

  let verdictLabel = 'Mixed Results'
  let verdictColor: [number, number, number] = [234, 179, 8]
  if (total_claims === 0) {
    verdictLabel = 'No Claims'
    verdictColor = [100, 100, 100]
  } else {
    const ratio = (true_claims + partially_true_claims * 0.5) / total_claims
    if (ratio >= 0.7) { verdictLabel = 'Mostly True'; verdictColor = [34, 197, 94] }
    else if (ratio <= 0.3) { verdictLabel = 'Mostly False'; verdictColor = [239, 68, 68] }
  }

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(margin, y, contentW, 22)

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...verdictColor)
  doc.text(`${verdictLabel.toUpperCase()}  —  ${accuracy}% ACCURACY`, margin + 5, y + 9)

  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `${total_claims} claims examined  |  ${true_claims} True  |  ${false_claims} False  |  ${partially_true_claims} Partial`,
    margin + 5,
    y + 17
  )

  y += 32

  // ─── Image Analysis (if present) ───
  if (result.metadata.image_analysis) {
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('I. MEDIA ANALYSIS', margin, y)
    y += 6

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    const imgLines = wrapText(doc, result.metadata.image_analysis.description, contentW)
    for (const line of imgLines.slice(0, 8)) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin, y)
      y += 4.5
    }
    y += 6
  }

  // ─── Verified Claims ───
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  y = addPageIfNeeded(doc, y, margin)
  doc.text('II. INVESTIGATION FINDINGS', margin, y)
  
  y += 2
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + doc.getTextWidth('II. INVESTIGATION FINDINGS'), y)
  y += 8

  for (const vc of result.verified_claims) {
    y = addPageIfNeeded(doc, y, margin)
    const color = getStatusColor(vc.status)

    // Status badge
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...color)
    doc.text(`[${vc.status.toUpperCase()}]`, margin, y)

    // Confidence
    const confStr = `${Math.round(vc.confidence * 100)}% confidence`
    doc.setFont('times', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(confStr, pageW - margin - doc.getTextWidth(confStr), y)
    y += 5

    // Claim text
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    const claimLines = wrapText(doc, vc.claim.text, contentW)
    for (const line of claimLines) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin, y)
      y += 5
    }
    y += 2

    // Reasoning
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    const reasonLines = wrapText(doc, vc.reasoning, contentW)
    for (const line of reasonLines.slice(0, 8)) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin, y)
      y += 4.5
    }
    y += 2

    // Correct Answer
    if (vc.correct_answer) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('times', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(34, 197, 94)
      doc.text('Correct Fact:', margin, y)
      y += 4
      doc.setFont('times', 'normal')
      doc.setTextColor(20, 83, 45) // dark green for print text
      const correctLines = wrapText(doc, vc.correct_answer, contentW)
      for (const line of correctLines.slice(0, 4)) {
        y = addPageIfNeeded(doc, y, margin)
        doc.text(line, margin, y)
        y += 4.5
      }
      y += 2
    }

    // Temporal Note
    if (vc.temporal_note) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('times', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(249, 115, 22)
      doc.text('Temporal Context:', margin, y)
      y += 4
      doc.setFont('times', 'italic')
      doc.setTextColor(154, 52, 18) // dark orange
      const tempLines = wrapText(doc, vc.temporal_note, contentW)
      for (const line of tempLines.slice(0, 3)) {
        y = addPageIfNeeded(doc, y, margin)
        doc.text(line, margin, y)
        y += 4.5
      }
      y += 2
    }

    // Conflicting Sources
    if (vc.conflicting_sources && vc.conflicting_sources.length > 0) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('times', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(168, 85, 247)
      doc.text('Conflicting Disputes:', margin, y)
      y += 4
      doc.setFont('times', 'italic')
      doc.setTextColor(88, 28, 135) // dark purple
      for (const cs of vc.conflicting_sources) {
        y = addPageIfNeeded(doc, y, margin)
        const csLines = wrapText(doc, `— ${cs}`, contentW - 5)
        for (const line of csLines) {
          doc.text(line, margin + 5, y)
          y += 4.5
        }
      }
      y += 2
    }

    // Evidence sources
    if (vc.evidence.length > 0) {
      y = addPageIfNeeded(doc, y, margin)
      doc.setFont('times', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.text('Cited Sources:', margin, y)
      y += 4
      doc.setFont('times', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      for (const ev of vc.evidence.slice(0, 4)) {
        y = addPageIfNeeded(doc, y, margin)
        const srcText = `• [${ev.source}] ${ev.title}`
        const srcLines = wrapText(doc, srcText, contentW - 4)
        doc.text(srcLines[0], margin + 4, y)
        y += 3.5
      }
    }

    // Separator line for next claim
    y += 6
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.2)
    doc.line(pageW / 2 - 15, y, pageW / 2 + 15, y)
    y += 10
  }

  // ─── Footer ───
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('THE DAILY VERIFIER — Truth through Technology', margin, pageH - 8)
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  // ─── Save ───
  const timestamp = new Date().toISOString().split('T')[0]
  doc.save(`daily-verifier-report-${timestamp}.pdf`)
}

export function exportAITextAsPDF(result: AITextDetectionResult): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  // ─── Header ───
  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(0, 0, 0)
  const title = 'THE DAILY VERIFIER'
  doc.text(title, pageW / 2, 22, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('times', 'italic')
  doc.text('AI Authorship Analysis Report', pageW / 2, 28, { align: 'center' })

  // Double line border below header
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, 32, pageW - margin, 32)
  doc.setLineWidth(1.5)
  doc.line(margin, 34, pageW - margin, 34)

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Vol. I — No. 1`, margin, 40)
  doc.text(today, pageW / 2, 40, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(margin, 43, pageW - margin, 43)

  y = 52

  // ─── Verdict Bar ───
  const score = Math.round(result.overallScore * 100)
  let verdictColor: [number, number, number] = [0, 0, 0]
  if (result.verdict.includes('Human')) verdictColor = [4, 120, 87]
  else if (result.verdict.includes('AI')) verdictColor = [185, 28, 28]
  else verdictColor = [202, 138, 4]

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(margin, y, contentW, 22)

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...verdictColor)
  doc.text(`${result.verdict.toUpperCase()}  —  ${score}% AI PROBABILITY`, margin + 5, y + 9)

  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Confidence: ${Math.round(result.confidence * 100)}% | Analysis Time: ${result.processingTime.toFixed(1)}s`, margin + 5, y + 17)

  y += 32

  // ─── Summary Analysis ───
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('I. LINGUISTIC ANALYSIS SUMMARY', margin, y)
  y += 6

  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  const analysisLines = wrapText(doc, result.analysis, contentW)
  for (const line of analysisLines) {
    y = addPageIfNeeded(doc, y, margin)
    doc.text(line, margin, y)
    y += 5
  }
  y += 6

  // ─── Signals ───
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('II. DETECTED SIGNALS', margin, y)
  y += 6

  for (const sig of result.signals) {
    y = addPageIfNeeded(doc, y, margin)
    
    doc.setFont('times', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(sig.direction === 'ai' ? 185 : 4, sig.direction === 'ai' ? 28 : 120, sig.direction === 'ai' ? 28 : 87)
    doc.text(`[${sig.direction.toUpperCase()}] ${sig.name} (${Math.round(sig.strength * 100)}%)`, margin, y)
    y += 5

    doc.setFont('times', 'normal')
    doc.setTextColor(50, 50, 50)
    const sigLines = wrapText(doc, sig.description, contentW - 5)
    for (const line of sigLines) {
      y = addPageIfNeeded(doc, y, margin)
      doc.text(line, margin + 5, y)
      y += 4.5
    }
    y += 3
  }

  y += 6

  // ─── Footer ───
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('THE DAILY VERIFIER — Truth through Technology', margin, pageH - 8)
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  // ─── Save ───
  const timestamp = new Date().toISOString().split('T')[0]
  doc.save(`ai-authorship-report-${timestamp}.pdf`)
}
