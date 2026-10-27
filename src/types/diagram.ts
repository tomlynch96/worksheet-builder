// A labelled quantity in a parametric diagram. The SVG template contains
// {{key}} wherever the value appears, so the same drawing can be reused
// with different numbers (e.g. r = 2 m on one sheet, r = 3 m on another).
export interface DiagramVariable {
  key: string
  label: string        // teacher-facing name, e.g. "Radius"
  value: string        // e.g. "2.0"
  unit?: string        // e.g. "m", "°", "N"
}

// Stored on a FigureBlock when the figure is an AI/library SVG diagram.
export interface FigureDiagram {
  template: string               // sanitised SVG with {{key}} placeholders
  variables: DiagramVariable[]
  libraryId?: string             // row in the shared `diagrams` table
  prompts?: string[]             // generation + refinement history
}

// Row in the shared diagram library.
export interface LibraryDiagram {
  id: string
  profile_id: string
  title: string
  description: string
  svg_template: string
  variables: DiagramVariable[]
  spec_points: string[]
  topics: string[]
  exam_board: string | null
  qualification: string | null
  prompts: string[]
  parent_id: string | null
  use_count: number
  created_at: string
}
