/**
 * Utility to auto-generate relevant social media hashtags for LinkedIn/X
 * based on job domain, skills, or project details.
 */

export function generateJobHashtags(job: {
  domain?: string
  jobTitle?: string
  mandatorySkills?: string[]
  location?: string[]
}): string {
  const tags = new Set<string>()

  // Core brand & recruitment tags
  tags.add("#Hiring")
  tags.add("#JobOpening")
  tags.add("#TechCareers")
  tags.add("#SIGPT")

  const domain = (job.domain || "").toLowerCase()
  const title = (job.jobTitle || "").toLowerCase()

  // Semiconductor & Hardware domain tags
  if (domain.includes("physical design") || domain.includes("pd") || title.includes("physical design")) {
    tags.add("#PhysicalDesign")
    tags.add("#VLSI")
    tags.add("#Semiconductor")
    tags.add("#ASIC")
    tags.add("#TimingClosure")
  } else if (domain.includes("timing") || domain.includes("sta") || title.includes("sta")) {
    tags.add("#StaticTimingAnalysis")
    tags.add("#STA")
    tags.add("#PrimeTime")
    tags.add("#VLSI")
    tags.add("#Semiconductor")
  } else if (domain.includes("verification") || domain.includes("dv") || title.includes("verification")) {
    tags.add("#DesignVerification")
    tags.add("#UVM")
    tags.add("#SystemVerilog")
    tags.add("#ASIC")
    tags.add("#VLSI")
  } else if (domain.includes("embedded") || title.includes("embedded") || title.includes("firmware")) {
    tags.add("#EmbeddedSystems")
    tags.add("#Firmware")
    tags.add("#IoT")
    tags.add("#Microcontrollers")
  } else if (domain.includes("analog") || domain.includes("ams") || title.includes("analog")) {
    tags.add("#AnalogDesign")
    tags.add("#MixedSignal")
    tags.add("#CircuitDesign")
    tags.add("#Semiconductor")
  } else {
    tags.add("#VLSI")
    tags.add("#Semiconductor")
    tags.add("#Engineering")
  }

  // Extract keywords from mandatory skills
  if (Array.isArray(job.mandatorySkills)) {
    const skillText = job.mandatorySkills.join(" ").toLowerCase()
    if (skillText.includes("innovus")) tags.add("#CadenceInnovus")
    if (skillText.includes("icc2")) tags.add("#SynopsysICC2")
    if (skillText.includes("primetime")) tags.add("#PrimeTime")
    if (skillText.includes("finfet") || skillText.includes("3nm") || skillText.includes("5nm")) tags.add("#AdvancedNodes")
    if (skillText.includes("python") || skillText.includes("tcl")) tags.add("#Scripting")
  }

  // Convert set to formatted hashtag string
  return Array.from(tags).join(" ")
}

export function generateProjectHashtags(project: {
  name?: string
  department?: string
  summary?: string
}): string {
  const tags = new Set<string>()

  // Core brand & project tags
  tags.add("#SIGPT")
  tags.add("#ProjectOpportunity")
  tags.add("#Innovation")

  const dept = (project.department || "").toLowerCase()
  const name = (project.name || "").toLowerCase()

  if (dept.includes("engineering") || name.includes("tapeout") || name.includes("silicon")) {
    tags.add("#EngineeringProjects")
    tags.add("#VLSI")
    tags.add("#Semiconductor")
    tags.add("#SiliconEngineering")
  } else if (dept.includes("university") || dept.includes("campus") || name.includes("campus")) {
    tags.add("#CampusHiring")
    tags.add("#UniversityRelations")
    tags.add("#GraduateEngineering")
  } else {
    tags.add("#Engineering")
    tags.add("#TechInnovation")
  }

  return Array.from(tags).join(" ")
}
