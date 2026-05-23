import type { Worksheet } from '../types/worksheet'

// A fixed worksheet used to calibrate PDF ↔ preview layout.
// Each block is labelled with its expected rendered height so you can
// measure the PDF and see exactly where the discrepancy is.
export const LAYOUT_TEST_WORKSHEET: Worksheet = {
  id: 'layout-test-001',
  showLines: true,
  blocks: [
    {
      id: 'lt-header',
      type: 'header',
      title: 'PDF Layout Test',
      topic: 'Each block is labelled with its expected PDF height',
      examBoard: 'AQA',
      tier: 'higher',
      showName: false,
      showDate: false,
      showClass: false,
    },

    // ── Data table ──────────────────────────────────────────
    // Preview: heading ~13.5pt + header row ~16.5pt + 5 data rows ×15pt + margin 9pt = 113.5pt
    // PDF target: heading ~9.5pt + header ~15.6pt + 5 rows ×16.2pt + margin 9pt = 115.1pt
    {
      id: 'lt-table',
      type: 'data',
      heading: 'TABLE — 5 data rows. Each row ~15–16pt tall',
      columns: [
        { label: 'Row number', unit: '' },
        { label: 'Value A', unit: 'cm' },
        { label: 'Value B', unit: 's' },
      ],
      rows: [
        ['Row 1', '10.0', '2.5'],
        ['Row 2', '20.0', '5.0'],
        ['Row 3', '30.0', '7.5'],
        ['Row 4', '40.0', '10.0'],
        ['Row 5', '50.0', '12.5'],
      ],
      display: 'table',
      graph: {
        xCol: 0, yCol: 1,
        showXLabel: true, showYLabel: true,
        showXScale: true, showYScale: true,
        omitRows: [],
        fitType: 'none',
        showFitLine: true,
        linkedDataId: null,
      },
      hiddenCells: [],
    },

    // ── Graph ──────────────────────────────────────────────
    // Preview SVG: 440×300px inside 658px content (67% wide, 300px tall)
    // PDF SVG:     330×225pt inside 493pt content (67% wide, 225pt tall)
    // Total block: heading ~14.5pt + SVG 225pt + margin 9pt ≈ 248.5pt
    {
      id: 'lt-graph',
      type: 'data',
      heading: 'GRAPH — SVG should be 330pt wide × 225pt tall in PDF',
      columns: [
        { label: 'Force', unit: 'N' },
        { label: 'Extension', unit: 'cm' },
      ],
      rows: [
        ['0', '0'],
        ['1', '2.5'],
        ['2', '5.0'],
        ['3', '7.5'],
        ['4', '10.0'],
        ['5', '12.5'],
      ],
      display: 'graph',
      graph: {
        xCol: 0, yCol: 1,
        showXLabel: true, showYLabel: true,
        showXScale: true, showYScale: true,
        omitRows: [],
        fitType: 'linear',
        showFitLine: true,
        linkedDataId: null,
      },
      hiddenCells: [],
    },

    // ── Question with answer lines ─────────────────────────
    // Each answer line: 21pt in PDF / 28px in preview
    // 3 lines = 63pt. Stem ~16pt. Margin 15pt. Total ≈ 94pt
    {
      id: 'lt-question',
      type: 'question',
      stem: '<p>QUESTION — 3 answer lines. Each line is 21pt in PDF / 28px in preview.</p>',
      marks: 3,
      lines: 3,
      parts: [],
    },
  ],
}
