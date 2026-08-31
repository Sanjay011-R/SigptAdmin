export type JobStatus = "Draft" | "Open" | "On Hold" | "Closed"
export type EmploymentType = "Full-time" | "Contract" | "Internship" | "Part-time"
export type JobDomain = "Physical Design (PD)" | "Static Timing Analysis (STA)" | "Design Verification (DV)" | "Embedded Systems" | "Analog & Mixed-Signal (AMS)"

export interface JobRequirement {
  id: string              // Internal ID (e.g., '1')
  reqId: string           // Unique Req ID (e.g., 'REQ-PD-2026-001')
  jobTitle: string        // Public Title
  domain: JobDomain       // Domain / Skill
  experienceMin: number   // Min Years
  experienceMax: number   // Max Years
  location: string[]      // Locations e.g. ["Bengaluru", "Hyderabad", "Remote"]
  employmentType: EmploymentType
  jobSummary: string      // Short description
  responsibilities: string[] // Editable bullet points
  mandatorySkills: string[]  // Mandatory skills bullet points
  preferredSkills: string[]  // Preferred optional skills
  qualification: string   // Education / Degree required
  openings: number        // Number of positions
  status: JobStatus       // Draft / Open / On Hold / Closed
  postingDate: string     // Automatic date
  closingDate?: string    // Optional closing date
  recruiterOwner: string  // TA owner
  whyJoinSI: string[]     // Why join SI-GPT / SI-Career culture points
}

export const MOCK_JOBS: JobRequirement[] = [
  {
    id: "1",
    reqId: "SIGPT-PD-2026-041",
    jobTitle: "Senior Physical Design (PD) Lead Engineer",
    domain: "Physical Design (PD)",
    experienceMin: 5,
    experienceMax: 10,
    location: ["Bengaluru", "Hyderabad"],
    employmentType: "Full-time",
    jobSummary: "We are looking for an experienced Physical Design Lead to drive top-level netlist-to-GDSII flow execution for sub-7nm FinFET SoCs.",
    responsibilities: [
      "Ownership of block and full-chip floorplanning, placement, CTS, and routing.",
      "Analyze and fix STA timing closure, IR drop, EM, and DRC/LVS violations.",
      "Work closely with synthesis, DFT, and CAD teams to optimize PPA metrics.",
      "Mentor junior physical design engineers and conduct design reviews."
    ],
    mandatorySkills: [
      "5+ years hands-on experience with Synopsys ICC2 / Cadence Innovus.",
      "Strong expertise in 7nm/5nm/3nm process nodes and timing closure.",
      "Proficiency in Tcl, Python, or Perl scripting for CAD automation.",
      "Deep understanding of electro-migration and power integrity (Innovus/Voltus/RedHawk)."
    ],
    preferredSkills: [
      "Experience with hierarchical floorplanning for large multi-million gate SoCs.",
      "Familiarity with Low Power design methodologies (UPF/CPF)."
    ],
    qualification: "B.Tech / M.Tech in Electronics & Communication Engineering (ECE) or Electrical Engineering.",
    openings: 4,
    status: "Open",
    postingDate: "2026-08-20",
    closingDate: "2026-09-30",
    recruiterOwner: "Sarah Jenkins (TA Specialist)",
    whyJoinSI: [
      "Work on cutting-edge sub-3nm semiconductor and AI accelerator architectures.",
      "Flexible hybrid working culture with competitive ESOP package.",
      "Accelerated career growth with top semiconductor industry leaders."
    ]
  },
  {
    id: "2",
    reqId: "SIGPT-STA-2026-042",
    jobTitle: "Static Timing Analysis (STA) Specialist",
    domain: "Static Timing Analysis (STA)",
    experienceMin: 4,
    experienceMax: 8,
    location: ["Bengaluru", "Remote"],
    employmentType: "Full-time",
    jobSummary: "Join our core timing team responsible for full-chip STA closure, SDC constraints validation, and multi-corner multi-mode timing signoff.",
    responsibilities: [
      "Perform full-chip and block-level STA timing signoff using PrimeTime.",
      "Develop and validate complex SDC constraints for multi-clock domain SoCs.",
      "Analyze crosstalk noise, SI delay, and POCV/OCV margins.",
      "Collaborate with RTL and Physical Design teams to resolve timing bottlenecks."
    ],
    mandatorySkills: [
      "4+ years experience with Synopsys PrimeTime.",
      "Expert knowledge of SDC constraints creation and debugging.",
      "Advanced Tcl scripting skills for timing report automation."
    ],
    preferredSkills: [
      "Experience with ECO generation (automated & manual ECO flows).",
      "Knowledge of glitch noise analysis."
    ],
    qualification: "B.E / B.Tech / M.Tech in Microelectronics or VLSI Design.",
    openings: 3,
    status: "Open",
    postingDate: "2026-08-22",
    recruiterOwner: "David Miller (TA Manager)",
    whyJoinSI: [
      "Direct exposure to world-class silicon engineering projects.",
      "Comprehensive health coverage and annual performance bonuses."
    ]
  },
  {
    id: "3",
    reqId: "SIGPT-DV-2026-043",
    jobTitle: "Design Verification (DV) Engineer - SystemVerilog/UVM",
    domain: "Design Verification (DV)",
    experienceMin: 3,
    experienceMax: 7,
    location: ["Hyderabad"],
    employmentType: "Full-time",
    jobSummary: "Looking for a dedicated Verification Engineer to build UVM testbenches and verify high-performance PCIe/NVMe controller IP blocks.",
    responsibilities: [
      "Develop constrained-random UVM testbenches, reference models, and assertions.",
      "Define verification plans based on functional specifications.",
      "Achieve 100% functional and code coverage closure.",
      "Debug RTL failures in close collaboration with digital design team."
    ],
    mandatorySkills: [
      "3+ years experience with SystemVerilog and UVM methodology.",
      "Hands-on experience with EDA simulators (VCS, Questa, Riviera).",
      "Strong debugging skills with Verdi and DVE tools."
    ],
    preferredSkills: [
      "Knowledge of PCIe Gen5/Gen6 protocols.",
      "Experience with Formal Verification tools (JasperGold)."
    ],
    qualification: "B.Tech/M.Tech in ECE / Computer Science.",
    openings: 5,
    status: "Draft",
    postingDate: "2026-08-25",
    recruiterOwner: "Sarah Jenkins (TA Specialist)",
    whyJoinSI: [
      "Industry-leading learning ecosystem and technical certification support."
    ]
  }
]
