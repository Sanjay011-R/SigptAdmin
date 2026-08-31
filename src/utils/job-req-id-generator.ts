export function getDomainCode(domain: string): string {
  const d = (domain || "").trim()
  if (d.includes("Physical Design") || d === "PD") return "PD"
  if (d.includes("Static Timing") || d === "STA") return "STA"
  if (d.includes("Design Verification") || d === "DV") return "DV"
  if (d.includes("DFT")) return "DFT"
  if (d.includes("Analog Custom") || d.includes("AMS") || d.includes("Analog")) return "AMS"
  if (d.includes("Embedded") || d === "EMB") return "EMB"
  if (d.includes("Software") || d.includes("Web") || d === "SW") return "SW"
  if (d.includes("AI") || d.includes("Machine Learning")) return "AI"

  const clean = d.replace(/[^a-zA-Z]/g, "")
  if (clean.length <= 3 && clean.length > 0) return clean.toUpperCase()
  return (clean.substring(0, 3) || "GEN").toUpperCase()
}

export function generateJobReqId(
  domain: string,
  sequenceNum: number = 41,
  year: number = 2026
): string {
  const code = getDomainCode(domain)
  const seqStr = String(sequenceNum).padStart(3, "0")
  return `SIGPT-${code}-${year}-${seqStr}`
}
