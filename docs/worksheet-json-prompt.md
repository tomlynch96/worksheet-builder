# Building worksheets for The Worksheet Project

You are helping a UK science teacher write a worksheet that they will **upload into The Worksheet Project** (Editor → **Open** → choose the `.json` file). Your output is a single JSON file in the site's native worksheet format. The site renders it for A4 printing, generates the mark scheme, numbers the questions, totals the marks, and files it in the teacher's library under the curriculum taxonomy given in the header.

Everything below is the exact contract the site expects. Follow it precisely: anything outside it is silently ignored or renders wrongly.

---

## 1. How to work with the teacher

1. **Pin down the taxonomy first.** Agree the course, exam board, tier and spec point using the taxonomy in the appendix. Offer the closest matching spec points by ref and title, and let the teacher confirm. **Never invent a ref**: if nothing fits, say so and use the nearest topic ref.
2. **Agree the shape.** Ask for the brief: knowledge recall, practical/data analysis, calculation practice, mixed/custom, roughly how many marks or pages, and any must-haves. Where the teacher is silent, use the defaults in section 9.
3. **Write the JSON** following sections 2–8.
4. **Run the checklist in section 10** before handing it over.
5. **Deliver it as a downloadable file** named after the topic, e.g. `wave-equation.json`, plus a one-paragraph summary: spec point, structure, total marks, and anything the teacher should check (e.g. diagrams).

When the teacher asks for changes, return the **whole** updated file with the **same worksheet `id`**. Uploading a file with an id they already have replaces that worksheet in their library. A new worksheet always gets a new id.

---

## 2. File format

```json
{
  "id": "3b0f1c2e-8d4a-4f6b-9c1e-5a7d2e9f0b13",
  "blocks": [ { "id": "hdr-001", "type": "header" }, "..." ]
}
```

- `id`: a **new random UUID v4** (8-4-4-4-12 lowercase hex) for every new worksheet. It is the worksheet's database key.
- `blocks`: the worksheet in printed order. The first block is always the `header`.
- Optional: `"showLines": false` prints the sheet without answer lines (rarely wanted).
- Strict JSON only: double quotes, no comments, no trailing commas.
- **Block ids** are short unique strings: `hdr-001`, `q-001`, `tbl-001`, `fig-001`. **Every** id must be unique across the whole file, including question `parts` and match `items`.

---

## 3. Writing rules that apply everywhere

- **No question numbers** in any text (`1.`, `Q1`, `Question 2`). The site numbers questions.
- **No marks in text** (`[2 marks]`, `(3)`). Marks go in the `marks` field and the site prints them.
- **No part labels in part stems** (`(a)`, `(ii)`). Put `"label": "a"` on the part instead.
- Mark schemes use **one `[1]` per marking point**: `"v = f λ [1]; v = 0.30 m/s [1]"`.
- Use the board's **command words** exactly: state, give, name, identify, describe, explain, calculate, determine, show that, suggest, evaluate, compare, sketch, plot.
- UK spelling. SI units with a space before the unit (`2.0 m/s`, `30 °C`; degrees of angle hug the number: `30°`).

### Rich text

These fields accept simple HTML: question and part **stems**, **mark schemes**, multiple-choice **options**, instruction **items**, worked-example **title and steps**, information **heading and content**, match **left/right**, order **steps**, and block **headings**.

- Allowed: `<p>`, `<strong>`, `<em>`, `<u>`, `<sub>`, `<sup>`, `<br>`. Plain text with no tags is also fine.
- Unicode is fine and usually simplest: `λ`, `Ω`, `θ`, `°`, `×`, `²`, `³`, `⁻¹`, `10⁸`, `→`, `⇌`, `±`.
- **Inline maths** (rendered with KaTeX): `<span data-type="math" data-latex="E_k = \tfrac{1}{2}mv^2"></span>`. Remember JSON escaping: in the file, a backslash is written `\\`.
- **Chemical formulae and equations** (mhchem): `<span data-type="chem" data-chem="2H2 + O2 -> 2H2O"></span>`.
- **Plain text only** (no HTML) in: cloze `text`, data table cells/column labels, `numericalAnswer`, figure `caption`.

---

## 4. Block reference

The site auto-computes marks for cloze (one per blank), match_them_up (one per pair) and order_steps (one per step).

### header (required, first)
```json
{ "id": "hdr-001", "type": "header",
  "title": "The wave equation", "topic": "Waves",
  "qualification": "gcse-physics", "examBoard": "AQA", "tier": "higher", "specPoint": "P6.2",
  "showName": true, "showDate": true, "showClass": true, "showTotalMarks": true }
```
- `qualification`: a **course id** from the taxonomy (e.g. `gcse-physics`, `alevel-physics`). It must be offered by that `examBoard`.
- `examBoard`: one of the boards listed for that course: `AQA`, `OCR`, `Edexcel`, `WJEC`, `Pearson` or `IB`.
- `specPoint`: a **point ref** copied exactly from that course and board's list in the taxonomy (e.g. `P6.2`, `4.2.1`, `3.6.1.1`). This is what files the sheet in the library.
- `tier`: `foundation` or `higher` for GCSE; `both` for KS3, A level and IB, or a GCSE sheet for both tiers.
- `title` is printed big; `topic` is a short subtitle.

### instructions
```json
{ "id": "ins-001", "type": "instructions",
  "items": ["Answer all questions.", "Show your working for all calculations.", "The marks for each question are shown in brackets."] }
```

### information: key facts or equations box
```json
{ "id": "inf-001", "type": "information", "heading": "Key facts",
  "content": "<p><strong>Wave equation:</strong> v = f λ, where v is wave speed (m/s), f is frequency (Hz) and λ is wavelength (m).</p><p><strong>Period:</strong> T = 1 / f</p>" }
```
Each fact gets its own `<p>`. Optional `"attachedFigureId"`.

### worked_example
```json
{ "id": "we-001", "type": "worked_example", "title": "Calculating wave speed",
  "steps": ["A wave has f = 4.0 Hz and λ = 0.50 m. Calculate v.", "Equation: v = f λ", "Substitute: v = 4.0 × 0.50", "Answer: v = 2.0 m/s"] }
```
Place it just before the practice it models. Optional `"attachedFigureId"`.

### question: single part
```json
{ "id": "q-001", "type": "question",
  "stem": "A water wave has a frequency of 2.0 Hz and a wavelength of 0.15 m. Calculate the speed of the wave.",
  "marks": 2, "lines": 3, "parts": [],
  "markScheme": "v = 2.0 × 0.15 [1]; v = 0.30 m/s [1]", "numericalAnswer": "0.3",
  "attachedDataId": null, "attachedDataIds": null }
```

### question: multi-part
```json
{ "id": "q-002", "type": "question",
  "stem": "A student investigated sound waves using a signal generator and a loudspeaker.",
  "marks": 0, "lines": 0, "markScheme": "", "numericalAnswer": "",
  "attachedDataId": null, "attachedDataIds": null,
  "parts": [
    { "id": "part-001", "label": "a", "stem": "State what is meant by the frequency of a wave.", "marks": 1, "lines": 2,
      "markScheme": "The number of waves passing a point each second [1]", "numericalAnswer": "",
      "attachedDataId": null, "attachedDataIds": null },
    { "id": "part-002", "label": "b", "stem": "Calculate the wavelength of a 680 Hz sound wave in air. The speed of sound in air is 340 m/s.", "marks": 3, "lines": 4,
      "markScheme": "λ = v / f [1]; λ = 340 / 680 [1]; λ = 0.50 m [1]", "numericalAnswer": "0.5",
      "attachedDataId": null, "attachedDataIds": null }
  ] }
```
- With parts: the parent has `marks: 0`, `lines: 0` and `markScheme: ""`, and each part carries its own marks, lines and mark scheme.
- Labels run `a`, `b`, `c`…
- `lines`: about 2 per mark for written answers, 3–5 for a calculation, 1–2 for a plotting part (the graph is the answer space). Use `0` only where no written answer is needed.
- `numericalAnswer`: the bare number as a string (`"0.5"`, `"200000"`, `"340"`), with no units, whenever the answer is a single number. Otherwise use `""`.
- Questions and parts can also take `"attachedFigureId"` and `"attachedDataId"` / `"attachedDataIds"` (section 5).

### multiple_choice
```json
{ "id": "mc-001", "type": "multiple_choice", "stem": "Which equation links wave speed, frequency and wavelength?",
  "marks": 1, "options": ["v = f / λ", "v = f λ", "v = λ / f", "v = f + λ"],
  "correctIndex": 1, "markScheme": "B — v = f λ [1]" }
```
- 4 options (up to 6 allowed), labelled A, B, C… by the site.
- `correctIndex` is zero-based. For more than one correct answer, also add `"correctIndices": [0, 2]` and set marks to match.
- Optional `"attachedFigureId"`.

### cloze: fill in the blanks
```json
{ "id": "clz-001", "type": "cloze", "heading": "Fill in the blanks using the words in the box.",
  "text": "The [frequency] of a wave is the number of waves passing a point each [second]. It is measured in [hertz].",
  "showWordBank": true }
```
Square brackets mark each blank. The word bank is shuffled automatically. Plain text only in `text`.

### match_them_up
```json
{ "id": "mtu-001", "type": "match_them_up", "heading": "Draw a line to match each quantity to its unit.",
  "items": [ { "id": "item-001", "left": "Frequency", "right": "hertz (Hz)" },
             { "id": "item-002", "left": "Wavelength", "right": "metre (m)" },
             { "id": "item-003", "left": "Wave speed", "right": "metre per second (m/s)" } ] }
```
Write each pair **correctly matched**; the site shuffles the right-hand column. 3–6 pairs.

### order_steps
```json
{ "id": "ord-001", "type": "order_steps", "heading": "Number these steps of the method in the correct order.",
  "steps": ["Set up the ripple tank", "Switch on the motor", "Measure the length of ten waves", "Divide by ten"] }
```
Write the steps **in the correct order**; the site shuffles them for pupils and shows the order on the mark scheme.

### data: results table, line graph or bar chart
See section 5 for the full rules. Every data block **must** be attached to a question.

### figure: image or diagram
See section 6. Usually attached to a question via `attachedFigureId`.

### spacer
```json
{ "id": "sp-001", "type": "spacer", "size": "medium" }
```
`small` / `medium` / `large` blank space, e.g. for working.

### numerical_answers
```json
{ "id": "na-001", "type": "numerical_answers", "heading": "Numerical answers" }
```
A scrambled answer box built automatically from every `numericalAnswer`, so pupils can self-check. Put it **last** whenever the sheet has calculations.

---

## 5. Data tables and graphs

```json
{ "id": "tbl-001", "type": "data", "heading": "Table 1: Frequency and wavelength of sound in air",
  "columns": [ { "label": "Frequency", "unit": "Hz" }, { "label": "Wavelength", "unit": "m" }, { "label": "Wave speed", "unit": "m/s" } ],
  "rows": [ ["200", "1.70", "340"], ["400", "0.85", "340"], ["500", "0.68", "340"], ["680", "0.50", "340"], ["850", "0.40", "340"] ],
  "display": "table",
  "hiddenCells": ["1,2", "2,2", "3,2", "4,2"],
  "graph": { "xCol": 0, "yCol": 1, "showXLabel": true, "showYLabel": true, "showXScale": true, "showYScale": true,
             "omitRows": [], "fitType": "none", "showFitLine": false, "linkedDataId": null } }
```

- `display`: `"table"`, `"graph"` (line-graph grid) or `"bar"` (bar chart). Every data block needs the full `graph` object, even tables.
- `rows`: strings, and **always the complete data**, including values pupils must work out.
- `hiddenCells`: `"row,col"` (zero-based) cells blanked on the worksheet and revealed on the mark scheme. Use this for "complete the table".
- Graph settings:
  - `xCol` / `yCol`: zero-based column indices to plot. Pick them from the graph's heading.
  - `omitRows`: rows **pupils must plot** (not pre-plotted). All rows = pupils plot everything; `[]` = every point pre-plotted (reference graph); a subset = "plot the remaining points".
  - `fitType`: `"linear"` for straight-line relationships, `"curve"` for non-linear (decay, cooling, inverse), `"none"` for no line.
  - `showFitLine`: `false` when pupils draw their own line (usual). The mark scheme always shows the line.
  - `showXScale` / `showYScale`: `false` gives pupils a blank axis to scale themselves (higher-demand task).
- Readings should look like real results: realistic significant figures, with ±5–10% scatter for practical data.

**Table + graph of the same data (required pattern for plotting tasks).** Make two blocks. The graph block has `"display": "graph"`, `"rows": []`, `"linkedDataId": "<table id>"`, and a `columns` array that is an **exact copy** of the table's (all columns, not just the two plotted):
```json
{ "id": "gph-001", "type": "data", "heading": "Graph 1: Wavelength against frequency",
  "columns": [ { "label": "Frequency", "unit": "Hz" }, { "label": "Wavelength", "unit": "m" }, { "label": "Wave speed", "unit": "m/s" } ],
  "rows": [], "display": "graph", "hiddenCells": [],
  "graph": { "xCol": 0, "yCol": 1, "showXLabel": true, "showYLabel": true, "showXScale": true, "showYScale": true,
             "omitRows": [2, 3, 4], "fitType": "curve", "showFitLine": false, "linkedDataId": "tbl-001" } }
```

**Attaching** (mandatory for every data block). Use `"attachedDataIds": ["tbl-001", "gph-001"]` on the question for both, or `"attachedDataId": "tbl-001"` for one. Put it on a single **part** if only that part uses the data. Attached blocks print inline with their question and are not printed again elsewhere. Place data blocks just before the question that uses them. Every id you reference must exist exactly.

A typical practical question has parts for: completing the table, plotting the remaining points [2], drawing the line/curve of best fit [1], reading a value from the graph [1–2], then conclusion and evaluation.

---

## 6. Figures and diagrams

A figure block is attached to a question (or part, multiple-choice, information, worked example, cloze, match or order block) with `"attachedFigureId": "fig-001"`. Put the figure block immediately **before** its question, and refer to it by caption in the text ("Figure 1 shows…"). Keep to **4 diagrams at most** per sheet.

Sizes: `small` (quarter page), `medium` (half page), `large` (three-quarter page).

You have two ways to supply a diagram.

### Option A: describe it, and the site draws it
```json
{ "id": "fig-001", "type": "figure", "caption": "Figure 1", "size": "medium",
  "diagramRequest": "A simple pendulum: string length 0.80 m from a fixed support, displaced 12° from the vertical, bob mass 0.20 kg. Label the length, angle and mass." }
```
The teacher opens the figure and the site's Diagram Studio draws it from your description. Put **every value and label the question relies on** into the request. Quantities pupils must calculate are labelled with a symbol or "?", not a value. This is the safer choice when you can't check your own drawing.

### Option B: draw it yourself as an SVG
```json
{ "id": "fig-001", "type": "figure", "caption": "Figure 1: A wave on the surface of water", "size": "large",
  "diagram": {
    "template": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"700\" height=\"300\" viewBox=\"0 0 700 300\">…<text x=\"240\" y=\"40\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"22\" text-anchor=\"middle\">λ = {{wavelength}}</text>…</svg>",
    "variables": [ { "key": "wavelength", "label": "Wavelength", "value": "0.40", "unit": "m" } ],
    "title": "Transverse wave with wavelength and amplitude marked",
    "description": "Two cycles of a transverse wave with wavelength and amplitude dimension lines and a direction-of-travel arrow.",
    "topics": ["Waves"],
    "prompts": ["Transverse water wave, two wavelengths, wavelength and amplitude labelled"]
  } }
```
- **Editable labelled values.** Every *number* shown in the drawing is a `{{key}}` placeholder (camelCase key) with an entry in `variables`, and each key appears exactly once in the list. The unit goes in the variable, not after the placeholder; the site renders "0.40 m" (and "30°" for degrees). Teachers can then change values without redrawing. Non-numeric labels (`r`, `θ`, `Sun`) are written directly.
- **Question text uses real values, not placeholders.** Write "0.40 m" in the stem and mark scheme, matching the variable's default value exactly.
- `title`, `description` and `topics` are used when the teacher shares the diagram to the site's diagram library, which is tagged with the sheet's spec point.
- **Exam-paper style:**
  - Black line art on white: `stroke="#000"`, main objects `stroke-width="2.5"`, construction and dimension lines `1.5`. No colour; light grey `#d9d9d9` only for genuinely shaded objects.
  - Dashed lines (`stroke-dasharray="6 4"`) for paths, equilibrium positions, normals, field equipotentials and construction lines.
  - Labels in `font-family="Arial, Helvetica, sans-serif"`, size 20–22. The diagram prints at roughly half size. Labels never overlap lines or each other (leave at least 6 px clearance).
  - Arrows: one `<marker id="arrow">` in `<defs>` (solid black triangle, `orient="auto-start-reverse"`), used via `marker-end` / `marker-start`.
  - Lengths are shown with dimension lines (double-headed, parallel to and offset from the object). Angles get an arc; right angles a small square.
  - Standard UK/IEC circuit symbols; rays carry mid-ray arrows; field lines carry direction arrows.
  - Add a small italic "Not drawn to scale" when the geometry doesn't match the numbers.
  - `viewBox="0 0 W H"` with matching `width`/`height`; W 400–700, H 250–500, with a 20 px margin and no large empty areas. No title or question text inside the SVG.
- **Forbidden in the SVG:** `<script>`, `<foreignObject>`, `<image>`, `<style>`, event attributes (`onclick`…), external fonts, and any `href` other than `#id` marker references. Use presentation attributes, not CSS.
- **Check before you hand it over.** If you can render the SVG, do it and look. The commonest faults are a label crossing a line, a dimension arrow cutting through the drawing, and text running off the edge. If you can't render it, tell the teacher to check the figure on upload.

Don't set `imageData` or `imageUrl` yourself. Those are for images the teacher uploads.

---

## 7. Marks, length and the printed page

- **Total marks:** the site adds up every `marks` (parts for multi-part questions), plus automatic marks for cloze, match and order blocks.
- **Page budget:** an A4 page holds about 990 px of content. Rough heights:
  - header 150
  - instructions 44 + 22 per item
  - information about 72 plus its text
  - question about 48 + (40 + 28 × lines) per part
  - multiple choice 48 + 26 per option
  - match 44 + 46 per pair
  - cloze about 120
  - table 62 + 22 per row
  - graph 340
  - figure 114 / 174 / 234 (small / medium / large)

  A typical homework sheet is 2 sides; a lesson sheet 2–4.
- Group a question with its table, graph or figure so they stay together, and avoid ending on a nearly empty page.

---

## 8. Optional: exam front page

For a mock-exam style paper, add `exam` to the header to print a full front cover (candidate boxes, instructions, information, total marks):
```json
"exam": { "paperName": "Paper 2 (Higher Tier)", "durationMinutes": 60,
          "instructions": ["Use black ink or black ball-point pen.", "Answer all questions in the spaces provided."],
          "information": ["The total number of marks for this paper is 50.", "The marks for each question are shown in brackets."],
          "targetMarks": 50 }
```
Only use this when the teacher asks for an exam paper.

---

## 9. Defaults when the teacher doesn't specify

Every sheet starts **header → instructions → information** (key facts, or the equations being practised with symbols and units).

- **Knowledge recall:**
  - an information block with all key terms
  - an easy section of match_them_up and cloze (at least 4 blocks)
  - medium questions: state, give, name, identify (1–2 marks each, at least 4)
  - hard questions: describe and explain (3–4 marks each, at least 3)
  - every key term appears in at least 3 different formats
- **Practical / data:**
  - an information block on the experiment
  - a results table with realistic scatter, plus a linked graph (pre-plot only the first 1–2 points)
  - questions to complete the table, plot, draw the best fit, read a value, conclude and evaluate
  - `fitType: "curve"` for non-linear relationships, `"linear"` for linear ones, with `showFitLine: false`
- **Calculation practice:**
  - information with the equation(s), symbols and units only
  - one worked example
  - single-part questions in order:
    - plain substitution
    - unit conversions (km → m, g → kg, min → s)
    - rearranging
    - multi-step problems that use a second equation
  - a numerical_answers block at the end
  - no other block types
- **Custom brief:** the teacher's brief wins. Choose freely from every block type to serve it, progressing from recall to application to an extended response.

---

## 10. Checklist before you deliver

- [ ] Valid strict JSON; `id` is a fresh UUID v4 (or the existing id when revising this worksheet).
- [ ] First block is the header, with `qualification`, `examBoard`, `tier` and `specPoint` copied **exactly** from the taxonomy, and the board is offered for that course.
- [ ] Every id is unique, including part and item ids.
- [ ] Every `attachedDataId(s)`, `attachedFigureId` and `linkedDataId` points at an id that exists.
- [ ] Every data block is attached to a question or part. Linked graphs have `rows: []` and a full copy of the table's columns.
- [ ] No question numbers, part labels or marks written inside any text.
- [ ] Every question and part has marks, lines and a `[1]`-style mark scheme. Multi-part parents have `marks: 0`, `lines: 0`.
- [ ] `numericalAnswer` is set (number only, no units) for every single-number answer, and the arithmetic is correct to sensible significant figures.
- [ ] Mark schemes, table values and diagram labels all agree with each other.
- [ ] SVG diagrams: every `{{key}}` has exactly one variable, no forbidden elements, labels clear of lines, and question text uses the same values.
- [ ] Command words, notation and units match the exam board and level.
- [ ] A numerical_answers block is last if the sheet has calculations.

---

## Appendix: curriculum taxonomy

Use these values **exactly**: `qualification` = the course id, `examBoard` = one of that course's boards, `specPoint` = a point ref from that course and board's list. Refs are specific to the board: the same topic has different refs on different boards.

### Courses

| Course id (`qualification`) | Course | Exam boards (`examBoard`) |
|---|---|---|
| `gcse-physics` | GCSE Physics | AQA, OCR, Edexcel, WJEC |
| `gcse-biology` | GCSE Biology | AQA, OCR, Edexcel, WJEC |
| `gcse-chemistry` | GCSE Chemistry | AQA, OCR, Edexcel, WJEC |
| `alevel-physics` | A Level Physics | AQA, OCR, Edexcel, WJEC |
| `exploring-science-y7` | Pearson Exploring Science Year 7 | Pearson |
| `exploring-science-y8` | Pearson Exploring Science Year 8 | Pearson |
| `exploring-science-y9` | Pearson Exploring Science Year 9 | Pearson |
| `ib-physics` | IB Physics | IB |
| `ib-chemistry` | IB Chemistry | IB |
| `ib-biology` | IB Biology | IB |

### GCSE Physics — AQA

`"qualification": "gcse-physics", "examBoard": "AQA"`


**P1 Energy**
- `P1.1` Energy stores and transfers
- `P1.2` Conservation and dissipation of energy
- `P1.3` National and global energy resources
- `P1.4` Calculating energy changes — kinetic, gravitational, elastic
- `P1.5` Power — P = E/t
- `P1.6` Efficiency of energy transfer

**P2 Electricity**
- `P2.1` Standard circuit symbols and diagrams
- `P2.2` Electric charge, current and potential difference
- `P2.3` Resistance — V = IR
- `P2.4` Series and parallel circuits
- `P2.5` I–V characteristics — resistor, filament lamp, diode
- `P2.6` Electrical power — P = VI
- `P2.7` Mains electricity — AC, frequency, UK plug wiring
- `P2.8` Static electricity and electric fields

**P3 Particle model of matter**
- `P3.1` Density — ρ = m/V
- `P3.2` Changes of state and latent heat — Q = mL
- `P3.3` Specific heat capacity — Q = mcΔT
- `P3.4` Particle model and pressure in gases

**P4 Atomic structure**
- `P4.1` Atomic structure — protons, neutrons, electrons, isotopes
- `P4.2` Development of the atomic model — plum pudding to nuclear
- `P4.3` Radioactive decay — alpha, beta, gamma, half-life
- `P4.4` Nuclear equations for alpha and beta decay
- `P4.5` Hazards and uses of radioactivity
- `P4.6` Nuclear fission and fusion

**P5 Forces**
- `P5.1` Scalar and vector quantities; resultant forces
- `P5.2` Contact and non-contact forces
- `P5.3` Newton's First Law — inertia and balanced forces
- `P5.4` Newton's Second Law — F = ma
- `P5.5` Newton's Third Law — action–reaction pairs
- `P5.6` Stopping distance — thinking and braking distance
- `P5.7` Momentum — p = mv and conservation of momentum
- `P5.8` Work done and energy transfer — W = Fs
- `P5.9` Elasticity — Hooke's Law and spring constant
- `P5.10` Moments, levers and gears
- `P5.11` Pressure — fluids, upthrust and Archimedes' principle

**P6 Waves**
- `P6.1` Transverse and longitudinal waves — properties and examples
- `P6.2` Wave equation — v = fλ
- `P6.3` Reflection, refraction and sound
- `P6.4` The electromagnetic spectrum — properties and uses
- `P6.5` Lenses — ray diagrams, focal length, real and virtual images
- `P6.6` Colour, filters and absorption of light
- `P6.7` Infrared radiation and temperature

**P7 Magnetism and electromagnetism**
- `P7.1` Permanent and induced magnetism; field patterns
- `P7.2` The motor effect — F = BIL, Fleming's Left-Hand Rule
- `P7.3` The electric motor and loudspeaker
- `P7.4` Electromagnetic induction — Faraday's Law
- `P7.5` Alternators, generators and microphones
- `P7.6` Transformers — step-up, step-down, the National Grid

**P8 Space physics (separate science only)**
- `P8.1` The Solar System — structure and scale
- `P8.2` The life cycle of stars
- `P8.3` Orbital motion — speed, radius and gravitational force
- `P8.4` Red-shift and the expanding universe
- `P8.5` The Big Bang theory and evidence

### GCSE Physics — OCR

`"qualification": "gcse-physics", "examBoard": "OCR"`


**P1 Matter**
- `P1a` The particle model — states of matter and changes of state
- `P1b` Pressure — in gases and fluids
- `P1c` Density and upthrust

**P2 Forces**
- `P2a` Motion — distance, speed, velocity and acceleration
- `P2b` Newton's Laws and resultant forces
- `P2c` Work, energy and power
- `P2d` Momentum and its conservation
- `P2e` Stopping distances and reaction time

**P3 Electricity**
- `P3a` Circuits — current, voltage and resistance
- `P3b` Series and parallel circuits
- `P3c` Electrical power and energy
- `P3d` Static electricity and electric fields
- `P3e` Mains electricity — hazards and safety

**P4 Magnetism and magnetic effects of current**
- `P4a` Magnetic fields — permanent magnets and field patterns
- `P4b` The motor effect — F = BIL
- `P4c` Electromagnetic induction and transformers

**P5 Waves in matter**
- `P5a` Wave properties — amplitude, frequency, wavelength, speed
- `P5b` The electromagnetic spectrum — properties and uses
- `P5c` Reflection, refraction and total internal reflection
- `P5d` Sound — transmission, echo and ultrasound

**P6 Radioactive emissions**
- `P6a` Atomic structure — the nucleus and electrons
- `P6b` Radioactive decay — alpha, beta, gamma; half-life
- `P6c` Uses and hazards of ionising radiation
- `P6d` Nuclear fission and fusion

**P7 Energy**
- `P7a` Energy stores, transfers and dissipation
- `P7b` Efficiency and reducing energy losses
- `P7c` Renewable and non-renewable energy resources
- `P7d` The National Grid — transmission and transformers

**P8 Global challenges (separate physics only)**
- `P8a` Astronomy — the Solar System, stars and galaxies
- `P8b` Life cycle of stars
- `P8c` Space exploration and communication technologies

### GCSE Physics — Edexcel

`"qualification": "gcse-physics", "examBoard": "Edexcel"`


**T1 Key concepts of physics**
- `1.1` SI units and standard form
- `1.2` Scalars and vectors
- `1.3` Significant figures and uncertainties
- `1.4` Equations, graphs and data analysis

**T2 Motion and forces**
- `2.1` Describing motion — distance, speed and velocity
- `2.2` Distance–time graphs
- `2.3` Velocity–time graphs and acceleration
- `2.4` Equations of motion (v = u + at, etc.)
- `2.5` Newton's First Law — balanced forces and inertia
- `2.6` Newton's Second Law — F = ma
- `2.7` Newton's Third Law — action and reaction pairs
- `2.8` Weight, mass and gravitational field strength
- `2.9` Stopping distances — thinking and braking distance
- `2.10` Momentum — p = mv
- `2.11` Conservation of momentum
- `2.12` Forces and elasticity — Hooke's Law

**T3 Conservation of energy**
- `3.1` Energy stores and transfers
- `3.2` Conservation of energy
- `3.3` Efficiency of energy transfers
- `3.4` Power — P = E/t and P = W/t
- `3.5` Reducing energy losses — insulation and lubrication

**T4 Waves**
- `4.1` Properties of waves — amplitude, wavelength, frequency, period
- `4.2` Wave equation — v = fλ
- `4.3` Transverse and longitudinal waves
- `4.4` Reflection of waves
- `4.5` Refraction of waves
- `4.6` Sound waves and hearing
- `4.7` Ultrasound and its uses
- `4.8` Seismic waves — P-waves and S-waves

**T5 Light and the electromagnetic spectrum**
- `5.1` The electromagnetic spectrum — properties and order
- `5.2` Speed, frequency and wavelength of EM waves
- `5.3` Uses of EM waves (radio, microwave, IR, visible, UV, X-ray, gamma)
- `5.4` Dangers of EM radiation
- `5.5` Refraction at boundaries and refractive index
- `5.6` Total internal reflection and critical angle
- `5.7` Lenses — converging and diverging, real and virtual images
- `5.8` Colour — absorption, transmission and reflection

**T6 Radioactivity**
- `6.1` Atomic structure — protons, neutrons, electrons
- `6.2` Isotopes and relative atomic mass
- `6.3` Alpha, beta and gamma radiation — nature and properties
- `6.4` Nuclear equations for decay
- `6.5` Half-life and radioactive decay graphs
- `6.6` Uses of radioactivity — medical and industrial
- `6.7` Dangers of ionising radiation and safety precautions
- `6.8` Background radiation and its sources
- `6.9` Nuclear fission and chain reactions
- `6.10` Nuclear fusion and stars

**T7 Astronomy (separate Physics only)**
- `7.1` The solar system — planets, moons, asteroids, comets
- `7.2` Orbital speed and gravitational force
- `7.3` Life cycle of stars
- `7.4` The expanding universe and red-shift
- `7.5` The Big Bang theory
- `7.6` Dark matter and dark energy

**T8 Energy — forces doing work**
- `8.1` Work done — W = Fs (work = force × distance)
- `8.2` Gravitational potential energy — GPE = mgh
- `8.3` Kinetic energy — KE = ½mv²
- `8.4` Energy conservation in mechanical systems
- `8.5` Power in mechanical systems

**T9 Forces and their effects**
- `9.1` Adding forces — resultant force
- `9.2` Centre of gravity
- `9.3` Moments, levers and torques — moment = Fd
- `9.4` Conditions for equilibrium
- `9.5` Pressure — P = F/A
- `9.6` Pressure in fluids — depth and atmospheric pressure
- `9.7` Upthrust and Archimedes' principle

**T10 Electricity and circuits**
- `10.1` Electric charge and current — I = Q/t
- `10.2` Potential difference, resistance — V = IR
- `10.3` Series circuits — current, voltage and resistance rules
- `10.4` Parallel circuits — current, voltage and resistance rules
- `10.5` I–V characteristics — ohmic, filament lamp, diode
- `10.6` Electrical power — P = VI = I²R
- `10.7` Energy transfer — E = VIt
- `10.8` The National Grid and electricity transmission

**T11 Static electricity**
- `11.1` Charging by friction — electron transfer
- `11.2` Attraction and repulsion between charges
- `11.3` Electric fields — field lines and strength
- `11.4` Dangers and uses of static electricity

**T12 Magnetism and the motor effect**
- `12.1` Permanent magnets and magnetic fields
- `12.2` Electromagnets and solenoids
- `12.3` The motor effect — F = BIL
- `12.4` Fleming's Left-Hand Rule
- `12.5` DC electric motors
- `12.6` Loudspeakers and the motor effect

**T13 Electromagnetic induction**
- `13.1` Inducing a potential difference — Faraday's Law
- `13.2` Lenz's Law and direction of induced current
- `13.3` AC generators — structure and output
- `13.4` Transformers — step-up and step-down, Vs/Vp = Ns/Np
- `13.5` Microphones and electromagnetic induction

**T14 Particle model**
- `14.1` States of matter — particle model descriptions
- `14.2` Changes of state and latent heat
- `14.3` Specific heat capacity — Q = mcΔT
- `14.4` Specific latent heat — Q = mL
- `14.5` Gas pressure and temperature — particle explanation
- `14.6` Boyle's Law — pressure–volume relationship

**T15 Forces and matter**
- `15.1` Density — ρ = m/V
- `15.2` Measuring density of regular and irregular objects
- `15.3` Hooke's Law and the spring constant — F = ke
- `15.4` Elastic and plastic deformation, elastic limit
- `15.5` Pressure in fluids and at depth — P = hρg

### GCSE Physics — WJEC

`"qualification": "gcse-physics", "examBoard": "WJEC"`


**U1 Motion, forces and energy**
- `1.1` Speed, velocity and acceleration — equations and graphs
- `1.2` Newton's Laws of Motion
- `1.3` Momentum and its conservation
- `1.4` Work, power and energy — W = Fs, P = W/t
- `1.5` Energy resources — fossil fuels, renewable and non-renewable
- `1.6` Thermal physics — specific heat capacity and latent heat

**U2 Waves**
- `2.1` Properties of waves — speed, frequency, wavelength and amplitude
- `2.2` Reflection, refraction and diffraction
- `2.3` The electromagnetic spectrum — properties and uses
- `2.4` Sound and ultrasound
- `2.5` Seismic waves and the structure of the Earth

**U3 Electricity**
- `3.1` Current, voltage and resistance — V = IR
- `3.2` Series and parallel circuits
- `3.3` Electrical power and energy — P = VI
- `3.4` Mains electricity — AC/DC, the UK plug, safety
- `3.5` Static electricity and electric fields

**U4 Electromagnetism**
- `4.1` Magnetic fields — permanent magnets and field patterns
- `4.2` Electromagnetic induction — Faraday's Law
- `4.3` Transformers — step-up and step-down, the National Grid
- `4.4` The motor effect and electric motors

**U5 Radioactivity**
- `5.1` Structure of the atom — protons, neutrons and electrons
- `5.2` Alpha, beta and gamma radiation — properties and penetration
- `5.3` Half-life and radioactive decay calculations
- `5.4` Uses and hazards of ionising radiation
- `5.5` Nuclear fission and fusion

**U6 Particles and the Universe (separate physics only)**
- `6.1` The Solar System — planets, moons and orbits
- `6.2` Stellar evolution — life cycle of stars
- `6.3` The expanding universe — red-shift and the Big Bang
- `6.4` The particle model revisited — gas pressure and temperature

### GCSE Biology — AQA

`"qualification": "gcse-biology", "examBoard": "AQA"`


**B1 Cell biology**
- `B1.1` Eukaryotic and prokaryotic cells — structure and function
- `B1.2` Animal and plant cell structures and their functions
- `B1.3` Cell specialisation and differentiation
- `B1.4` Microscopy — light microscope, magnification calculations
- `B1.5` Mitosis and the cell cycle
- `B1.6` Stem cells — therapeutic uses and ethical issues
- `B1.7` Transport — diffusion, osmosis and active transport

**B2 Organisation**
- `B2.1` Tissues, organs and organ systems
- `B2.2` The digestive system — enzymes and digestion
- `B2.3` The heart and blood vessels — structure and function
- `B2.4` Blood components and their functions
- `B2.5` Non-communicable diseases — risk factors and correlation
- `B2.6` Cancer — tumour types, risk factors, treatment
- `B2.7` Plant organisation — roots, stems, leaves; transpiration

**B3 Infection and response**
- `B3.1` Communicable diseases — bacteria, viruses, fungi, protists
- `B3.2` Viral diseases — measles, HIV, TMV
- `B3.3` Bacterial diseases — Salmonella, Gonorrhoea
- `B3.4` The human immune system — phagocytosis, antibodies, memory cells
- `B3.5` Vaccination — herd immunity, pros and cons
- `B3.6` Antibiotics and antibiotic resistance
- `B3.7` Drug discovery and clinical trials

**B4 Bioenergetics**
- `B4.1` Photosynthesis — equation and limiting factors
- `B4.2` Uses of glucose in plants
- `B4.3` Factors affecting rate of photosynthesis — light, CO₂, temperature
- `B4.4` Aerobic respiration — equation and uses of energy
- `B4.5` Anaerobic respiration — fermentation and lactic acid
- `B4.6` Response to exercise — heart rate, breathing rate, oxygen debt

**B5 Homeostasis and response**
- `B5.1` Homeostasis — the principle of negative feedback
- `B5.2` The nervous system — receptors, CNS, effectors, reflex arc
- `B5.3` Hormones and the endocrine system — glands and hormones
- `B5.4` Control of blood glucose — insulin, glucagon, diabetes
- `B5.5` Controlling body temperature — vasodilation, shivering
- `B5.6` Reproduction — the menstrual cycle, FSH, LH, oestrogen
- `B5.7` Contraception — hormonal and non-hormonal methods
- `B5.8` The kidney — filtration, reabsorption, urine production

**B6 Inheritance, variation and evolution**
- `B6.1` Sexual and asexual reproduction — advantages and disadvantages
- `B6.2` DNA, genes and chromosomes
- `B6.3` Mitosis and meiosis compared
- `B6.4` Inheritance — dominant, recessive; Punnett squares
- `B6.5` Inherited disorders — cystic fibrosis, polydactyly
- `B6.6` Natural selection and evolution
- `B6.7` Genetic engineering — pros, cons, applications
- `B6.8` Classification — kingdoms, species concept, evolutionary trees

**B7 Ecology**
- `B7.1` Ecosystems — abiotic and biotic factors
- `B7.2` Sampling techniques — quadrats and transects
- `B7.3` Food chains, food webs and energy transfer
- `B7.4` The carbon cycle
- `B7.5` The water cycle and nitrogen cycle
- `B7.6` Biodiversity — threats and conservation
- `B7.7` Global warming — causes, effects and solutions
- `B7.8` Decomposition — factors affecting decay rates

### GCSE Biology — OCR

`"qualification": "gcse-biology", "examBoard": "OCR"`


**B1 Cell-level systems**
- `B1a` Cell structures — animal, plant, bacterial and eukaryotic cells
- `B1b` What do cells do? — cell activities and specialisation
- `B1c` Cell division — mitosis, meiosis, stem cells
- `B1d` Microscopy — magnification and resolution

**B2 Scaling up**
- `B2a` Supplying the cell — diffusion, osmosis and active transport
- `B2b` The circulatory system — heart, blood and blood vessels
- `B2c` Breathing — gas exchange in the lungs
- `B2d` Digestion — enzymes and absorption

**B3 Organism-level systems**
- `B3a` Coordination and control — nervous and hormonal systems
- `B3b` Homeostasis — thermoregulation, blood glucose control
- `B3c` The kidney — filtration, reabsorption and dialysis
- `B3d` Reproduction — hormones, IVF and contraception
- `B3e` Plant hormones — auxins and tropisms

**B4 Community-level systems**
- `B4a` Ecosystems — biotic and abiotic factors
- `B4b` Food production — energy transfers and farming practices
- `B4c` Nutrient cycles — carbon and nitrogen cycles
- `B4d` Biodiversity and conservation

**B5 Genetics and evolution**
- `B5a` DNA — structure, genes and the genetic code
- `B5b` Inheritance — alleles, dominance, Punnett squares
- `B5c` Natural selection and evolution — Darwin's theory
- `B5d` Classification — taxonomy, phylogenetic trees
- `B5e` Genetic engineering and selective breeding

**B6 Global challenges**
- `B6a` Infectious diseases — bacteria, viruses, fungi and protists
- `B6b` Immunity — vaccines, antibodies and antibiotics
- `B6c` Photosynthesis — rate factors and the plant's use of glucose
- `B6d` Respiration — aerobic and anaerobic
- `B6e` Human impact on ecosystems and climate change

### GCSE Biology — Edexcel

`"qualification": "gcse-biology", "examBoard": "Edexcel"`


**T1 Key concepts in biology**
- `1.1` Plant and animal cell structures and functions
- `1.2` Biological molecules — carbohydrates, lipids, proteins, DNA
- `1.3` Enzymes — structure, activity, factors affecting rate
- `1.4` Transport — diffusion, osmosis and active transport
- `1.5` Microscopy — magnification, resolution and calculations

**T2 Cells and control**
- `2.1` Mitosis — stages, purpose and chromosomes
- `2.2` Growth and differentiation — stem cells
- `2.3` The nervous system — receptors, neurones, reflex arcs
- `2.4` Neurotransmitters and synapses

**T3 Genetics**
- `3.1` Meiosis — halving chromosome number for gametes
- `3.2` DNA structure — base pairing, the double helix
- `3.3` Protein synthesis — transcription and translation
- `3.4` Mutations — causes, types and consequences
- `3.5` Inheritance — alleles, genotypes, phenotypes, Punnett squares
- `3.6` Genetic disorders — cystic fibrosis, sickle-cell disease

**T4 Natural selection and genetic modification**
- `4.1` Variation — genetic, environmental and random mutation
- `4.2` Evolution — natural selection and evidence
- `4.3` Classification — Linnaeus and phylogenetic trees
- `4.4` Selective breeding and genetic modification (GMOs)
- `4.5` Cloning — natural and artificial, advantages and risks

**T5 Health, disease and medicine**
- `5.1` Health — physical, mental and social dimensions
- `5.2` Communicable diseases — bacteria, viruses, fungi, protists
- `5.3` STIs and spread of disease — HIV/AIDS
- `5.4` The immune system — phagocytes, antibodies, memory cells
- `5.5` Vaccines and immunisation
- `5.6` Medicines — development, clinical trials, antibiotics and resistance
- `5.7` Non-communicable diseases — cancer, cardiovascular disease

**T6 Plant structures and their functions**
- `6.1` Photosynthesis — equation, limiting factors and investigations
- `6.2` Plant tissues — xylem, phloem and meristems
- `6.3` Water and mineral transport — transpiration and factors affecting it
- `6.4` Plant hormones — auxins, gibberellins and abscisic acid

**T7 Animal coordination, control and homeostasis**
- `7.1` Hormones — glands, blood transport and target organs
- `7.2` Blood glucose control — insulin, glucagon and diabetes
- `7.3` Thermoregulation — vasodilation, sweating and shivering
- `7.4` Reproductive hormones — menstrual cycle, contraception and IVF
- `7.5` Excretion — the kidney, filtration, reabsorption and ADH

**T8 Exchange and transport in animals**
- `8.1` The circulatory system — heart structure and function
- `8.2` Blood — plasma, red and white blood cells, platelets
- `8.3` Gas exchange — alveoli structure and the lungs
- `8.4` Aerobic and anaerobic respiration — equations and applications

**T9 Ecosystems and material cycles**
- `9.1` Ecosystems — biotic and abiotic factors, carrying capacity
- `9.2` Biodiversity — importance and threats
- `9.3` Food chains and energy transfer — biomass pyramids
- `9.4` The carbon cycle and global warming
- `9.5` The nitrogen cycle — decomposers, nitrification and denitrification
- `9.6` Decomposition — decay rates and the role of microorganisms

### GCSE Biology — WJEC

`"qualification": "gcse-biology", "examBoard": "WJEC"`


**B1 Cell biology and organisation**
- `B1.1` Animal, plant and bacterial cell structures
- `B1.2` Cell specialisation and differentiation
- `B1.3` Transport — diffusion, osmosis and active transport
- `B1.4` Mitosis and meiosis
- `B1.5` Tissues, organs and organ systems

**B2 Biodiversity and classification**
- `B2.1` Classification systems — kingdoms and phylogenetic trees
- `B2.2` Adaptations and natural selection
- `B2.3` Biodiversity — importance, threats and conservation
- `B2.4` Sampling techniques — quadrats and transects

**B3 Genetics and evolution**
- `B3.1` DNA structure and the genetic code
- `B3.2` Protein synthesis — transcription and translation
- `B3.3` Inheritance — dominant and recessive alleles, Punnett squares
- `B3.4` Variation — genetic, environmental and mutation
- `B3.5` Evolution — evidence and mechanisms

**B4 Health, disease and medicine**
- `B4.1` Communicable diseases — bacteria, viruses, fungi and protists
- `B4.2` The immune system — phagocytosis, antibodies, vaccines
- `B4.3` Non-communicable diseases — cancer, cardiovascular disease
- `B4.4` Drugs — development, trials, antibiotics and resistance

**B5 Ecosystems and environmental biology**
- `B5.1` Food chains, food webs and energy transfer
- `B5.2` The carbon and nitrogen cycles
- `B5.3` Human impact — deforestation, pollution and global warming
- `B5.4` Conservation strategies and endangered species

**B6 Homeostasis and the nervous system**
- `B6.1` The nervous system — CNS, peripheral nervous system, reflex arc
- `B6.2` Hormones — glands, blood transport and target organs
- `B6.3` Blood glucose control — insulin, glucagon, diabetes
- `B6.4` Thermoregulation and water balance
- `B6.5` Photosynthesis and respiration — equations and energy flow

### GCSE Chemistry — AQA

`"qualification": "gcse-chemistry", "examBoard": "AQA"`


**C1 Atomic structure and the periodic table**
- `C1.1` Atomic structure — protons, neutrons, electrons
- `C1.2` Atoms, elements and compounds
- `C1.3` Isotopes and relative atomic mass
- `C1.4` Electronic structure — shells and sub-shells
- `C1.5` The periodic table — groups, periods and properties
- `C1.6` Metals and non-metals — properties and reactivity
- `C1.7` Group 1 — alkali metals; Group 7 — halogens; Group 0 — noble gases

**C2 Bonding, structure and properties**
- `C2.1` Ionic bonding — electron transfer, ionic lattices
- `C2.2` Covalent bonding — electron sharing, molecular and giant structures
- `C2.3` Metallic bonding and properties of metals
- `C2.4` Giant covalent structures — diamond, graphite, graphene
- `C2.5` Nanoparticles — properties and uses

**C3 Quantitative chemistry**
- `C3.1` Conservation of mass and balancing equations
- `C3.2` Relative formula mass (Mr) calculations
- `C3.3` The mole — Avogadro's number, molar mass
- `C3.4` Reacting masses and limiting reactants
- `C3.5` Percentage yield and atom economy
- `C3.6` Concentrations of solutions (g/dm³ and mol/dm³)

**C4 Chemical changes**
- `C4.1` Reactivity series and metal extraction
- `C4.2` Oxidation and reduction in terms of oxygen and electrons
- `C4.3` Acids and alkalis — pH, indicators, neutralisation
- `C4.4` Preparation of salts — from acids and bases/carbonates
- `C4.5` Electrolysis — principles, products and half-equations
- `C4.6` Electrolysis of solutions — chlorine, hydrogen, oxygen

**C5 Energy changes**
- `C5.1` Exothermic and endothermic reactions
- `C5.2` Energy profile diagrams — activation energy
- `C5.3` Bond energies — calculating ΔH
- `C5.4` Cells and fuel cells — energy from electrochemical reactions

**C6 Rate of reaction and equilibrium**
- `C6.1` Measuring rate of reaction — mass, volume, colour
- `C6.2` Collision theory — concentration, temperature, surface area, catalysts
- `C6.3` Reversible reactions and dynamic equilibrium
- `C6.4` Le Chatelier's principle — shifting equilibrium

**C7 Organic chemistry**
- `C7.1` Crude oil, hydrocarbons and fractional distillation
- `C7.2` Alkanes — structure, naming, combustion
- `C7.3` Cracking and alkenes
- `C7.4` Alcohols — structure, properties, fermentation
- `C7.5` Carboxylic acids — properties and reactions
- `C7.6` Addition and condensation polymerisation

**C8 Chemical analysis**
- `C8.1` Pure substances and formulations — melting point tests
- `C8.2` Chromatography — Rf values and interpretation
- `C8.3` Flame tests — identifying metal ions
- `C8.4` Chemical tests for ions — hydroxide precipitates, carbonates, halides

**C9 Chemistry of the atmosphere**
- `C9.1` Earth's early atmosphere — composition and change over time
- `C9.2` The carbon cycle and greenhouse gases
- `C9.3` Climate change — evidence and consequences
- `C9.4` Atmospheric pollutants — NOₓ, SO₂, CO, particulates

**C10 Using resources**
- `C10.1` Finite and renewable resources; sustainability
- `C10.2` Potable water — treatment methods
- `C10.3` Waste water treatment
- `C10.4` Corrosion — rusting, prevention methods
- `C10.5` Alloys — properties and uses
- `C10.6` Life cycle assessment and recycling

### GCSE Chemistry — OCR

`"qualification": "gcse-chemistry", "examBoard": "OCR"`


**C1 Particles**
- `C1a` The particle model — solids, liquids and gases
- `C1b` Atomic structure — protons, neutrons, electrons and isotopes
- `C1c` Elements, compounds and mixtures — formulas and equations
- `C1d` Electronic structure and the periodic table

**C2 Elements, compounds and mixtures**
- `C2a` Purity and separation — filtration, distillation, chromatography
- `C2b` Ionic bonding — electron transfer and properties
- `C2c` Covalent bonding — molecular and giant structures
- `C2d` Metallic bonding and alloys
- `C2e` Nanoparticles and their properties

**C3 Chemical reactions**
- `C3a` Balancing equations and conservation of mass
- `C3b` Reactions with acids — neutralisation and salt preparation
- `C3c` Oxidation and reduction — redox reactions
- `C3d` Reactivity series and metal extraction
- `C3e` Electrolysis — principles and products

**C4 Predicting and identifying reactions and products**
- `C4a` Group 1, 7 and 0 — properties and trends
- `C4b` Tests for ions — flame tests, precipitates
- `C4c` Exothermic and endothermic reactions; energy profiles
- `C4d` Bond energies — calculating energy changes

**C5 Monitoring and controlling chemical reactions**
- `C5a` Rate of reaction — collision theory and factors affecting rate
- `C5b` Calculations — moles, reacting masses, percentage yield and atom economy
- `C5c` Reversible reactions and dynamic equilibrium

**C6 Global challenges**
- `C6a` Organic chemistry — alkanes, alkenes, alcohols and cracking
- `C6b` Crude oil and sustainable development
- `C6c` The Earth's atmosphere — past, present and future
- `C6d` Water — treatment and sustainability
- `C6e` Life cycle assessment and using resources sustainably

### GCSE Chemistry — Edexcel

`"qualification": "gcse-chemistry", "examBoard": "Edexcel"`


**T1 Key concepts in chemistry**
- `1.1` Atomic structure (protons, neutrons, electrons)
- `1.2` The periodic table — groups, periods and properties
- `1.3` Relative atomic mass and isotopes
- `1.4` Electronic structure
- `1.5` Ionic bonding — electron transfer and ionic lattices
- `1.6` Covalent bonding — electron sharing and molecular structures
- `1.7` Metallic bonding and properties of metals
- `1.8` Giant covalent structures (diamond, graphite, graphene)
- `1.9` States of matter and changes of state
- `1.10` Pure substances and mixtures — Rf values and melting points

**T2 States of matter and mixtures**
- `2.1` The particle model — solids, liquids and gases
- `2.2` Heating and cooling curves
- `2.3` Filtration, crystallisation and evaporation
- `2.4` Simple and fractional distillation
- `2.5` Paper and thin layer chromatography
- `2.6` Formulations and their uses

**T3 Chemical changes**
- `3.1` The reactivity series of metals
- `3.2` Reactions of metals with water and dilute acids
- `3.3` Displacement reactions
- `3.4` Oxidation and reduction (redox)
- `3.5` Acids and alkalis — pH scale and indicators
- `3.6` Neutralisation and the preparation of salts
- `3.7` Reactions of acids with metals, bases and carbonates
- `3.8` Electrolysis — principles and half equations
- `3.9` Electrolysis of solutions (copper sulfate, brine)

**T4 Extracting metals and equilibria**
- `4.1` Extraction of iron in the blast furnace
- `4.2` Extraction of aluminium by electrolysis
- `4.3` Rusting of iron and methods of prevention
- `4.4` Alloys and their uses (steel, brass, bronze)
- `4.5` Life cycle assessment and recycling of materials
- `4.6` Dynamic equilibrium and Le Chatelier's principle (Higher)

**T5 Separate chemistry 1 (Higher tier)**
- `5.1` Moles and the mole concept (Avogadro's number)
- `5.2` Calculations from equations — reacting quantities
- `5.3` Percentage yield
- `5.4` Atom economy
- `5.5` Concentration of solutions (mol/dm³)
- `5.6` Acid–base titrations and calculations

**T6 Groups in the periodic table**
- `6.1` The noble gases (Group 0) — properties and uses
- `6.2` The alkali metals (Group 1) — reactions and trends
- `6.3` The halogens (Group 7) — reactions and trends
- `6.4` Displacement reactions of halogens
- `6.5` Transition metals — properties and catalysts

**T7 Rates of reaction and energy changes**
- `7.1` Rates of reaction — measuring and calculating
- `7.2` Collision theory
- `7.3` Effect of temperature on rate of reaction
- `7.4` Effect of concentration and pressure on rate
- `7.5` Effect of surface area and catalysts
- `7.6` Exothermic and endothermic reactions
- `7.7` Energy profile diagrams and activation energy
- `7.8` Bond energies — calculating energy changes

**T8 Fuels and Earth science**
- `8.1` Fossil fuels and crude oil
- `8.2` Fractional distillation of crude oil
- `8.3` Alkanes — naming, formulae and combustion
- `8.4` Incomplete combustion and atmospheric pollutants
- `8.5` Cracking of hydrocarbons (thermal and catalytic)
- `8.6` The greenhouse effect and climate change
- `8.7` The carbon cycle
- `8.8` Potable water — treatment and purification

**T9 Separate chemistry 2 (Higher tier)**
- `9.1` Alcohols — properties, reactions and uses
- `9.2` Carboxylic acids — properties and reactions
- `9.3` Esters — formation and uses
- `9.4` Addition polymerisation
- `9.5` Condensation polymerisation
- `9.6` Natural polymers — proteins, starch and DNA
- `9.7` Nanoparticles — properties and uses

### GCSE Chemistry — WJEC

`"qualification": "gcse-chemistry", "examBoard": "WJEC"`


**C1 Atomic structure and the periodic table**
- `C1.1` Structure of the atom — protons, neutrons, electrons
- `C1.2` Isotopes and relative atomic mass
- `C1.3` Electronic structure and the periodic table — groups and periods
- `C1.4` Metals and non-metals; Group 1, 7 and 0 trends

**C2 Chemical bonding and structure**
- `C2.1` Ionic bonding — electron transfer and ionic lattices
- `C2.2` Covalent bonding — molecular and giant covalent structures
- `C2.3` Metallic bonding — sea of electrons model
- `C2.4` Properties of materials linked to bonding type

**C3 Chemical calculations**
- `C3.1` Relative formula mass and conservation of mass
- `C3.2` The mole — molar mass and Avogadro's number
- `C3.3` Percentage yield and atom economy
- `C3.4` Concentration — mol/dm³ calculations

**C4 Chemical reactions**
- `C4.1` Rate of reaction — collision theory and factors
- `C4.2` Reversible reactions and equilibrium
- `C4.3` Exothermic and endothermic reactions — bond energies
- `C4.4` Electrolysis — principles, products and half-equations

**C5 Acids, bases and salts**
- `C5.1` Acids and alkalis — pH scale and indicators
- `C5.2` Neutralisation and preparation of salts
- `C5.3` Reactivity series and metal reactions with acids
- `C5.4` Tests for ions — flame tests and precipitates

**C6 Organic chemistry**
- `C6.1` Crude oil — fractional distillation and fractions
- `C6.2` Alkanes and alkenes — naming, structures, reactions
- `C6.3` Combustion and atmospheric pollution
- `C6.4` Polymerisation — addition and condensation polymers

**C7 Water and the atmosphere**
- `C7.1` Earth's early atmosphere — evolution and composition
- `C7.2` The greenhouse effect and climate change
- `C7.3` Potable water — treatment methods
- `C7.4` Atmospheric pollutants — causes and effects

**C8 Using and choosing materials**
- `C8.1` Metals — extraction, alloys and corrosion prevention
- `C8.2` Life cycle assessment and recycling
- `C8.3` Nanoparticles and smart materials
- `C8.4` Sustainable chemistry and green principles

### A Level Physics — AQA

`"qualification": "alevel-physics", "examBoard": "AQA"`


**3.1 Measurements and their errors**
- `3.1.1` Use of SI units and prefixes: base and derived units, prefixes T to f, unit conversions (J/eV, J/kW h)
- `3.1.2` Limitations of measurements: random and systematic errors; precision, resolution, accuracy; absolute, fractional and percentage uncertainties; error bars; gradient uncertainty
- `3.1.3` Estimation of physical quantities: orders of magnitude and approximate values

**3.2.1 Particles and radiation · Particles**
- `3.2.1.1` Constituents of the atom: proton, neutron, electron; charge and mass; specific charge; Z, A and nuclide notation; isotopes
- `3.2.1.2` Stable and unstable nuclei: strong nuclear force and its range; alpha and beta-minus decay equations; the neutrino
- `3.2.1.3` Particles, antiparticles and photons: antiparticles; photon model, E = hf = hc/λ; annihilation and pair production
- `3.2.1.4` Particle interactions: four fundamental interactions; exchange particles; virtual photons; W⁺/W⁻ in weak interactions; Feynman-style diagrams
- `3.2.1.5` Classification of particles: hadrons (baryons, mesons), baryon number; leptons and lepton number; strange particles and strangeness
- `3.2.1.6` Quarks and antiquarks: u, d, s properties; quark combinations for baryons and mesons; neutron decay
- `3.2.1.7` Applications of conservation laws: quark changes in β⁻ and β⁺ decay; charge, baryon, lepton and strangeness conservation in interactions

**3.2.2 Particles and radiation · Electromagnetic radiation and quantum phenomena**
- `3.2.2.1` The photoelectric effect: threshold frequency, work function, stopping potential; hf = φ + Ek(max)
- `3.2.2.2` Collisions of electrons with atoms: ionisation and excitation (fluorescent tube); the electronvolt
- `3.2.2.3` Energy levels and photon emission: line spectra and transitions; hf = E₁ − E₂
- `3.2.2.4` Wave–particle duality: electron diffraction; de Broglie wavelength λ = h/mv

**3.3.1 Waves · Progressive and stationary waves**
- `3.3.1.1` Progressive waves: amplitude, frequency, wavelength, speed, phase, phase difference; c = fλ, f = 1/T
- `3.3.1.2` Longitudinal and transverse waves: examples; polarisation and its applications
- `3.3.1.3` Superposition and stationary waves: nodes and antinodes, harmonics, f = (1/2l)√(T/μ); Required practical 1: stationary waves on a string

**3.3.2 Waves · Refraction, diffraction and interference**
- `3.3.2.1` Interference: Young's double slits, fringe spacing w = λD/s, white-light fringes, laser safety; Required practical 2: interference and diffraction gratings
- `3.3.2.2` Diffraction: single-slit pattern; diffraction grating d sinθ = nλ and its applications
- `3.3.2.3` Refraction at a plane surface: refractive index, Snell's law, total internal reflection, optical fibres, pulse broadening and dispersion

**3.4.1 Mechanics and materials · Force, energy and momentum**
- `3.4.1.1` Scalars and vectors: addition and resolution; equilibrium of coplanar forces
- `3.4.1.2` Moments: moment of a force, couples, principle of moments, centre of mass
- `3.4.1.3` Motion along a straight line: v = Δs/Δt, a = Δv/Δt, graphs, equations of uniform acceleration, g; Required practical 3: g by free fall
- `3.4.1.4` Projectile motion: independent horizontal and vertical motion; friction, lift and drag; terminal speed
- `3.4.1.5` Newton's laws of motion: F = ma
- `3.4.1.6` Momentum: conservation; F = Δ(mv)/Δt; impulse and force–time graphs; elastic and inelastic collisions; explosions
- `3.4.1.7` Work, energy and power: W = Fs cosθ, P = ΔW/Δt = Fv; force–displacement graphs; efficiency
- `3.4.1.8` Conservation of energy: ΔEp = mgΔh, Ek = ½mv²; work against resistive forces

**3.4.2 Mechanics and materials · Materials**
- `3.4.2.1` Bulk properties of solids: density; Hooke's law, elastic limit, k; stress and strain; elastic strain energy; plastic and brittle behaviour; stress–strain curves
- `3.4.2.2` The Young modulus: E = stress/strain; Required practical 4: Young modulus by a simple method

**3.5.1 Electricity · Current electricity**
- `3.5.1.1` Basics of electricity: I = ΔQ/Δt, V = W/Q, R = V/I
- `3.5.1.2` Current–voltage characteristics: ohmic conductor, diode, filament lamp; Ohm's law
- `3.5.1.3` Resistivity: ρ = RA/L; NTC thermistors; superconductivity; Required practical 5: resistivity of a wire
- `3.5.1.4` Circuits: resistors in series and parallel; E = IVt, P = IV = I²R = V²/R; conservation of charge and energy in dc circuits
- `3.5.1.5` Potential divider: constant or variable p.d.; variable resistors, thermistors and LDRs
- `3.5.1.6` Electromotive force and internal resistance: ε = I(R + r); Required practical 6: emf and internal resistance of cells

**3.6.1 Further mechanics and thermal physics · Periodic motion (A-level only)**
- `3.6.1.1` Circular motion: angular speed ω = v/r = 2πf, radian measure, centripetal acceleration a = v²/r = ω²r and force F = mv²/r = mω²r
- `3.6.1.2` Simple harmonic motion: a ∝ −x, a = −ω²x, x = A cosωt, v = ±ω√(A² − x²); x, v, a graphs; maximum speed and acceleration
- `3.6.1.3` Simple harmonic systems: mass–spring and simple pendulum periods; energy variation; damping; Required practical 7: SHM with a mass–spring and a pendulum
- `3.6.1.4` Forced vibrations and resonance: free and forced vibrations; resonance and damping

**3.6.2 Further mechanics and thermal physics · Thermal physics (A-level only)**
- `3.6.2.1` Thermal energy transfer: internal energy; qualitative first law; Q = mcΔθ; Q = ml; continuous flow
- `3.6.2.2` Ideal gases: gas laws; absolute zero; pV = nRT and pV = NkT; work done = pΔV; NA, R, k; Required practical 8: Boyle's and Charles's laws
- `3.6.2.3` Molecular kinetic theory model: Brownian motion; pV = ⅓Nm⟨c²⟩ derivation; average kinetic energy ½m⟨c²⟩ = (3/2)kT = 3RT/2NA

**3.7.1 Fields and their consequences · Fields (A-level only)**
- `3.7.1` Force fields as regions of non-contact force; gravitational and electrostatic fields compared (similarities and differences)

**3.7.2 Fields and their consequences · Gravitational fields (A-level only)**
- `3.7.2.1` Newton's law: F = Gm₁m₂/r²
- `3.7.2.2` Gravitational field strength: field lines; g = F/m; g = GM/r² in a radial field
- `3.7.2.3` Gravitational potential: V = −GM/r; ΔW = mΔV; equipotentials; g = −ΔV/Δr; area under g–r graph
- `3.7.2.4` Orbits of planets and satellites: T² ∝ r³; satellite energy; escape velocity; synchronous and geostationary orbits

**3.7.3 Fields and their consequences · Electric fields (A-level only)**
- `3.7.3.1` Coulomb's law: F = Q₁Q₂/4πε₀r²; permittivity of free space; compared with gravity for subatomic particles
- `3.7.3.2` Electric field strength: field lines; E = F/Q; E = V/d (uniform); E = Q/4πε₀r² (radial); charged particle entering a uniform field
- `3.7.3.3` Electric potential: V = Q/4πε₀r; ΔW = QΔV; equipotentials; E = −ΔV/Δr; area under E–r graph

**3.7.4 Fields and their consequences · Capacitance (A-level only)**
- `3.7.4.1` Capacitance: C = Q/V
- `3.7.4.2` Parallel plate capacitor: C = ε₀εrA/d; dielectric action; relative permittivity; polar molecules
- `3.7.4.3` Energy stored by a capacitor: area under Q–V graph; E = ½QV = ½CV² = ½Q²/C
- `3.7.4.4` Capacitor charge and discharge: Q, V and I graphs; time constant RC; T½ = 0.69RC; exponential discharge and charge; Required practical 9: charge and discharge of capacitors

**3.7.5 Fields and their consequences · Magnetic fields (A-level only)**
- `3.7.5.1` Magnetic flux density: F = BIl; Fleming's left-hand rule; the tesla; Required practical 10: force on a wire against B, I and length
- `3.7.5.2` Moving charges in a magnetic field: F = BQv; circular paths; the cyclotron
- `3.7.5.3` Magnetic flux and flux linkage: Φ = BA; NΦ = BAN cosθ; Required practical 11: search coil and flux linkage against angle
- `3.7.5.4` Electromagnetic induction: Faraday's and Lenz's laws; ε = N ΔΦ/Δt; conductor moving in a field; coil rotating in a field
- `3.7.5.5` Alternating currents: rms, peak and peak-to-peak values; Irms = I₀/√2, Vrms = V₀/√2; mains voltage; oscilloscope as dc/ac voltmeter
- `3.7.5.6` The operation of a transformer: Ns/Np = Vs/Vp; efficiency; eddy currents and inefficiencies; high-voltage power transmission and line losses

**3.8.1 Nuclear physics · Radioactivity (A-level only)**
- `3.8.1.1` Rutherford scattering: qualitative study; how understanding of the nucleus has changed
- `3.8.1.2` α, β and γ radiation: properties, absorption experiments, hazards; inverse-square law for γ; background radiation; Required practical 12: inverse-square law for gamma radiation
- `3.8.1.3` Radioactive decay: random nature; ΔN/Δt = −λN; N = N₀e^(−λt); A = λN; half-life T½ = ln2/λ; graphical decay data; dating and waste storage
- `3.8.1.4` Nuclear instability: N–Z graph; decay modes incl. electron capture; decay equations; excited states and γ emission; technetium-99m
- `3.8.1.5` Nuclear radius: closest approach and electron diffraction; R = R₀A^(1/3); constant nuclear density; nuclear density calculations
- `3.8.1.6` Mass and energy: E = mc²; mass difference and binding energy; atomic mass unit; fission and fusion energy calculations; binding energy per nucleon graph
- `3.8.1.7` Induced fission: thermal neutrons, chain reaction, critical mass; moderator, control rods and coolant; materials choices
- `3.8.1.8` Safety aspects: fuel handling and shielding, emergency shut-down; radioactive waste; risks and benefits

**3.9.1 Astrophysics (option) · Telescopes (A-level only)**
- `3.9.1.1` Astronomical refracting telescope of two converging lenses: ray diagram in normal adjustment; angular magnification M = fo/fe
- `3.9.1.2` Reflecting telescopes: Cassegrain arrangement; reflectors versus refractors; spherical and chromatic aberration
- `3.9.1.3` Single-dish radio telescopes and I-R, U-V and X-ray telescopes compared with optical telescopes
- `3.9.1.4` Advantages of large diameter telescopes: Rayleigh criterion, collecting power ∝ D²; eye and CCD compared

**3.9.2 Astrophysics (option) · Classification of stars (A-level only)**
- `3.9.2.1` Classification by luminosity: apparent magnitude, Hipparcos scale, brightness and intensity ratio
- `3.9.2.2` Absolute magnitude M: parsec and light year; m − M = 5 log(d/10)
- `3.9.2.3` Classification by temperature: black-body radiation, Stefan's law P = σAT⁴, Wien's law λmaxT = 2.9 × 10⁻³ m K, inverse square law
- `3.9.2.4` Stellar spectral classes O B A F G K M; temperature and Balmer absorption lines
- `3.9.2.5` The Hertzsprung–Russell diagram: main sequence, dwarfs, giants; position of the Sun; evolution of a Sun-like star
- `3.9.2.6` Supernovae, neutron stars and black holes: type 1a standard candles, dark energy, gamma ray bursts, supermassive black holes, Schwarzschild radius

**3.9.3 Astrophysics (option) · Cosmology (A-level only)**
- `3.9.3.1` Doppler effect: Δf/f = v/c, z = Δλ/λ = −v/c; binary stars; galaxies and quasars
- `3.9.3.2` Hubble's law: v = Hd; expansion and age of the universe; Big Bang evidence (CMB, hydrogen/helium abundance)
- `3.9.3.3` Quasars: most distant measurable objects, radio sources, large red shifts, active supermassive black holes
- `3.9.3.4` Detection of exoplanets: radial velocity and transit methods; light curves

**3.10.1 Medical physics (option) · Physics of the eye (A-level only)**
- `3.10.1.1` Physics of vision: the eye as a refracting system; sensitivity and spectral response; spatial resolution (rods and cones)
- `3.10.1.2` Defects of vision and correction with lenses: power = 1/f, 1/u + 1/v = 1/f, m = v/u; myopia, hypermetropia, astigmatism; correcting-lens powers

**3.10.2 Medical physics (option) · Physics of the ear (A-level only)**
- `3.10.2.1` The ear as a sound detection system: structure and transmission processes
- `3.10.2.2` Sensitivity and frequency response: equal loudness curves; intensity level = 10 log(I/I₀); dB and dBA
- `3.10.2.3` Defects of hearing: effects on loudness curves; hearing loss from noise or age

**3.10.3 Medical physics (option) · Biological measurement (A-level only)**
- `3.10.3.1` Simple ECG machines and the normal ECG waveform

**3.10.4 Medical physics (option) · Non-ionising imaging (A-level only)**
- `3.10.4.1` Ultrasound imaging: acoustic impedance Z = ρc, reflection at boundaries, attenuation, piezoelectric devices, A- and B-scans, comparisons
- `3.10.4.2` Fibre optics and endoscopy: total internal reflection at the core–cladding interface; flexible endoscope with coherent fibre bundles
- `3.10.4.3` Magnetic resonance (MR) scanner: proton spins, precession, gradient coils, RF pulses and signals, image processing

**3.10.5 Medical physics (option) · X-ray imaging (A-level only)**
- `3.10.5.1` Physics of diagnostic X-rays: production, maximum photon energy, continuous and characteristic spectra; rotating-anode tube; controlling intensity, energy and dose
- `3.10.5.2` Image detection and enhancement: flat panel detector versus photographic detection; contrast media (barium meal); intensifying screens and fluoroscopy
- `3.10.5.3` Absorption of X-rays: exponential attenuation I = I₀e^(−μx); linear and mass attenuation coefficients; half-value thickness; differential tissue absorption
- `3.10.5.4` CT scanner: moving X-ray tube, narrow monochromatic beam, detector array, computer image; advantages and disadvantages

**3.10.6 Medical physics (option) · Radionuclide imaging and therapy (A-level only)**
- `3.10.6.1` Imaging techniques: gamma-emitting tracers (technetium-99m, iodine-131, indium-111); Mo–Tc generator; PET scans
- `3.10.6.2` Half-life: physical, biological and effective half-lives; 1/TE = 1/TB + 1/TP
- `3.10.6.3` Gamma camera: photomultiplier tube and gamma camera structure and workings
- `3.10.6.4` Use of high-energy X-rays: external treatment; limiting exposure to healthy tissue
- `3.10.6.5` Use of radioactive implants: internal treatment with beta emitters
- `3.10.6.6` Imaging comparisons: resolution, convenience and safety of imaging techniques

**3.11.1 Engineering physics (option) · Rotational dynamics (A-level only)**
- `3.11.1.1` Concept of moment of inertia: I = Σmr²; factors affecting it
- `3.11.1.2` Rotational kinetic energy Ek = ½Iω²; flywheels for energy storage and smoothing torque and speed
- `3.11.1.3` Rotational motion: angular displacement, speed, velocity and acceleration; equations for uniform angular acceleration; analogy with translational dynamics
- `3.11.1.4` Torque and angular acceleration: T = Fr; T = Iα
- `3.11.1.5` Angular momentum: L = Iω; conservation; angular impulse TΔt = Δ(Iω)
- `3.11.1.6` Work and power: W = Tθ; P = Tω; frictional torque

**3.11.2 Engineering physics (option) · Thermodynamics and engines (A-level only)**
- `3.11.2.1` First law of thermodynamics: Q = ΔU + W and its applications
- `3.11.2.2` Non-flow processes: isothermal, adiabatic (pV^γ = constant), constant pressure and constant volume
- `3.11.2.3` The p–V diagram: processes on p–V diagrams; work done as area; cyclic processes
- `3.11.2.4` Engine cycles: four-stroke petrol and diesel cycles; indicator diagrams; indicated and brake power; overall, thermal and mechanical efficiency
- `3.11.2.5` Second law and engines: source and sink; efficiency = W/QH = (QH − QC)/QH; maximum theoretical efficiency (TH − TC)/TH; combined heat and power
- `3.11.2.6` Reversed heat engines: heat pumps and refrigerators; coefficients of performance

**3.12.1 Turning points in physics (option) · The discovery of the electron (A-level only)**
- `3.12.1.1` Cathode rays: production in a discharge tube
- `3.12.1.2` Thermionic emission of electrons: ½mv² = eV
- `3.12.1.3` Specific charge of the electron e/m: determination, Thomson's significance, comparison with the hydrogen ion
- `3.12.1.4` Millikan's determination of e: stationary oil droplet, terminal speed, Stokes' law F = 6πηrv, quantisation of charge

**3.12.2 Turning points in physics (option) · Wave–particle duality (A-level only)**
- `3.12.2.1` Newton's corpuscular theory of light compared with Huygens' wave theory
- `3.12.2.2` Significance of Young's double slits experiment and delayed acceptance of the wave theory
- `3.12.2.3` Electromagnetic waves: Maxwell's c = 1/√(μ₀ε₀); Hertz and radio waves; Fizeau's speed of light
- `3.12.2.4` The discovery of photoelectricity: ultraviolet catastrophe, Planck's quanta, failure of classical wave theory, Einstein's explanation
- `3.12.2.5` Wave–particle duality: de Broglie's hypothesis; low-energy electron diffraction
- `3.12.2.6` Electron microscopes: anode voltage for atomic-scale wavelengths; TEM and scanning tunnelling microscope

**3.12.3 Turning points in physics (option) · Special relativity (A-level only)**
- `3.12.3.1` The Michelson–Morley experiment: interferometer; failure to detect absolute motion; invariance of the speed of light
- `3.12.3.2` Einstein's theory of special relativity: inertial frames; the two postulates
- `3.12.3.3` Time dilation: proper time; t = t₀/√(1 − v²/c²); muon decay evidence
- `3.12.3.4` Length contraction: l = l₀√(1 − v²/c²)
- `3.12.3.5` Mass and energy: E = mc²; E = m₀c²/√(1 − v²/c²); mass and kinetic energy against speed; Bertozzi's experiment

**3.13.1 Electronics (option) · Discrete semiconductor devices (A-level only)**
- `3.13.1.1` MOSFET: structure, drain/source/gate, VDS, VGS, IDSS, Vth; use as a switch and high-input-resistance device (N-channel enhancement)
- `3.13.1.2` Zener diode: characteristic curve; constant voltage source with a resistor; reference voltage
- `3.13.1.3` Photodiode: characteristic and spectral response curves; photoconductive mode; detecting particles with a scintillator
- `3.13.1.4` Hall effect sensor: magnetic field sensor for attitude; tachometer

**3.13.2 Electronics (option) · Analogue and digital signals (A-level only)**
- `3.13.2.1` Analogue versus digital signals: bits and bytes; analogue-to-digital conversion, sampling rate, quantisation, noise; pulse code modulation; sensors

**3.13.3 Electronics (option) · Analogue signal processing (A-level only)**
- `3.13.3.1` LC resonance filters: f₀ = 1/2π√(LC); parallel resonance; LC and mass–spring analogy; response curve; Q factor and bandwidth
- `3.13.3.2` The ideal operational amplifier: infinite open-loop gain and input resistance; open-loop transfer function; comparator

**3.13.4 Electronics (option) · Operational amplifier configurations (A-level only)**
- `3.13.4.1` Inverting amplifier: Vout/Vin = −Rf/R₁; virtual earth
- `3.13.4.2` Non-inverting amplifier: Vout/Vin = 1 + Rf/R₁
- `3.13.4.3` Summing and difference amplifiers
- `3.13.4.4` Real operational amplifiers: limitations; frequency response; gain × bandwidth = constant

**3.13.5 Electronics (option) · Digital signal processing (A-level only)**
- `3.13.5.1` Combinational logic: Boolean algebra, truth tables, AND NAND OR NOR NOT EOR gates, designing circuits from truth tables
- `3.13.5.2` Sequential logic: binary, BCD and Johnson counters; clock, reset, up/down; modulo-n counters
- `3.13.5.3` Astables: oscillator as clock; frequency, pulse width, period, duty cycle, mark-to-space ratio; RC control of frequency

**3.13.6 Electronics (option) · Data communication systems (A-level only)**
- `3.13.6.1` Principles of communication systems: block diagram of a real-time system and the purpose of each stage
- `3.13.6.2` Transmission media: metal wire, optic fibre, radio and microwave; ground and sky waves; satellite systems; advantages and disadvantages
- `3.13.6.3` Time-division multiplexing: basic principles
- `3.13.6.4` Amplitude (AM) and frequency modulation (FM): carrier and information signals; graphs; bandwidth = 2fM (AM), 2(Δf + fM) (FM); channel capacity

### A Level Physics — OCR

`"qualification": "alevel-physics", "examBoard": "OCR"`


**1.1.1 Practical skills in writing · Planning**
- `1.1.1(a)` Experimental design, incl. choosing apparatus and techniques in a practical context
- `1.1.1(b)` Identifying variables that must be controlled
- `1.1.1(c)` Evaluating whether a method is appropriate for the expected outcomes

**1.1.2 Practical skills in writing · Implementing**
- `1.1.2(a)` Using a wide range of practical apparatus and techniques correctly
- `1.1.2(b)` Appropriate units for measurements
- `1.1.2(c)` Presenting observations and data in an appropriate format

**1.1.3 Practical skills in writing · Analysis**
- `1.1.3(a)` Processing, analysing and interpreting qualitative and quantitative results
- `1.1.3(b)` Mathematical skills for analysing quantitative data
- `1.1.3(c)` Appropriate use of significant figures
- `1.1.3(d)` Plotting and interpreting graphs: axes, scales, units, gradients and intercepts

**1.1.4 Practical skills in writing · Evaluation**
- `1.1.4(a)` Evaluating results and drawing conclusions; validating knowledge
- `1.1.4(b)` Identifying anomalies in measurements
- `1.1.4(c)` Limitations in experimental procedures
- `1.1.4(d)` Precision and accuracy; margins of error, percentage errors, apparatus uncertainties
- `1.1.4(e)` Refining experimental design by suggesting improvements

**1.2.1 Practical endorsement · Practical skills**
- `1.2.1(a)` Applying investigative approaches and methods to practical work
- `1.2.1(b)` Safely and correctly using a range of equipment and materials
- `1.2.1(c)` Following written instructions
- `1.2.1(d)` Making and recording observations and measurements
- `1.2.1(e)` Keeping appropriate records of experimental activities
- `1.2.1(f)` Presenting information and data in a scientific way
- `1.2.1(g)` Using software and tools to process data, research and report findings
- `1.2.1(h)` Online and offline research skills
- `1.2.1(i)` Correctly citing sources of information
- `1.2.1(j)` Using a wide range of instruments, equipment and techniques

**1.2.2 Practical endorsement · Use of apparatus and techniques**
- `1.2.2(a)` Analogue apparatus: length, temperature, pressure, force, angles, volume; interpolating scales
- `1.2.2(b)` Digital instruments incl. multimeters: time, current, voltage, resistance, mass
- `1.2.2(c)` Methods to increase accuracy: timing multiple oscillations, fiducial marker, set square, plumb line
- `1.2.2(d)` Stopwatch or light gates for timing
- `1.2.2(e)` Callipers and micrometers, digital or vernier
- `1.2.2(f)` Constructing circuits from diagrams (DC supplies, cells, polarity-sensitive components)
- `1.2.2(g)` Designing, constructing and checking circuits
- `1.2.2(h)` Signal generator and oscilloscope: volts/division and time-base
- `1.2.2(i)` Generating and measuring waves: microphone and loudspeaker, ripple tank, vibration transducer, microwaves
- `1.2.2(j)` Laser or light source to investigate interference and diffraction
- `1.2.2(k)` ICT: computer modelling, data loggers and sensors, data-processing software
- `1.2.2(l)` Ionising radiation, including detectors

**2.1.1 Physical quantities and units · Physical quantities**
- `2.1.1(a)` Physical quantities have a numerical value and a unit
- `2.1.1(b)` Making estimates of physical quantities

**2.1.2 Physical quantities and units · S.I. units**
- `2.1.2(a)` SI base quantities and units: kg, m, s, A, K, mol
- `2.1.2(b)` Derived units of SI base units
- `2.1.2(c)` Units listed in the specification
- `2.1.2(d)` Checking homogeneity of physical equations using SI base units
- `2.1.2(e)` Prefixes and symbols: pico to tera
- `2.1.2(f)` Conventions for labelling graph axes and table columns

**2.2.1 Making measurements and analysing data · Measurements and uncertainties**
- `2.2.1(a)` Systematic (incl. zero) and random errors
- `2.2.1(b)` Precision and accuracy
- `2.2.1(c)` Absolute and percentage uncertainties when data are combined (add, subtract, multiply, divide, powers)
- `2.2.1(d)` Graphical treatment of errors: line of best fit, worst line, percentage difference

**2.3.1 Nature of quantities · Scalars and vectors**
- `2.3.1(a)` Scalar and vector quantities, with examples
- `2.3.1(b)` Vector addition and subtraction
- `2.3.1(c)` Vector triangle for the resultant of two coplanar vectors
- `2.3.1(d)` Resolving a vector into perpendicular components: Fx = F cosθ, Fy = F sinθ

**3.1.1 Motion · Kinematics**
- `3.1.1(a)` Displacement, instantaneous and average speed, velocity and acceleration
- `3.1.1(b)` Graphical representations of displacement, speed, velocity and acceleration
- `3.1.1(c)` Displacement–time graphs: velocity is the gradient
- `3.1.1(d)` Velocity–time graphs: acceleration is the gradient, displacement is the area

**3.1.2 Motion · Linear motion**
- `3.1.2(a)` Equations of motion for constant acceleration (suvat), incl. free fall; investigating motion and collisions
- `3.1.2(b)` Acceleration of free fall g; determining g (trapdoor and electromagnet, light gates and timer)
- `3.1.2(c)` Reaction time, thinking distance, braking distance and stopping distance

**3.1.3 Motion · Projectile motion**
- `3.1.3(a)` Independence of vertical and horizontal motion of a projectile
- `3.1.3(b)` Two-dimensional projectile motion: constant velocity in one direction, constant acceleration in the other

**3.2.1 Forces in action · Dynamics**
- `3.2.1(a)` Net force = mass × acceleration: F = ma
- `3.2.1(b)` The newton as the unit of force
- `3.2.1(c)` Weight of an object W = mg
- `3.2.1(d)` Tension, normal contact force, upthrust and friction
- `3.2.1(e)` Free-body diagrams
- `3.2.1(f)` One- and two-dimensional motion under constant force

**3.2.2 Forces in action · Motion with non-uniform acceleration**
- `3.2.2(a)` Drag as the frictional force on an object moving through a fluid
- `3.2.2(b)` Factors affecting drag for an object moving through air
- `3.2.2(c)` Objects falling in a uniform gravitational field with drag
- `3.2.2(d)` Terminal velocity; techniques for determining it in fluids

**3.2.3 Forces in action · Equilibrium**
- `3.2.3(a)` Moment of a force: moment = Fx
- `3.2.3(b)` Couple; torque of a couple = Fd
- `3.2.3(c)` The principle of moments
- `3.2.3(d)` Centre of mass and centre of gravity; experimental determination
- `3.2.3(e)` Equilibrium of an object under forces and torques
- `3.2.3(f)` Equilibrium of three coplanar forces; triangle of forces

**3.2.4 Forces in action · Density and pressure**
- `3.2.4(a)` Density ρ = m/V
- `3.2.4(b)` Pressure p = F/A for solids, liquids and gases
- `3.2.4(c)` p = hρg; upthrust on an object in a fluid; Archimedes' principle

**3.3.1 Work, energy and power · Work and conservation of energy**
- `3.3.1(a)` Work done by a force; the joule
- `3.3.1(b)` W = Fx cosθ for work done by a force
- `3.3.1(c)` The principle of conservation of energy
- `3.3.1(d)` Energy in different forms; transfer and conservation
- `3.3.1(e)` Energy transferred equals work done

**3.3.2 Work, energy and power · Kinetic and potential energies**
- `3.3.2(a)` Kinetic energy Ek = ½mv²
- `3.3.2(b)` Gravitational potential energy in a uniform field Ep = mgh
- `3.3.2(c)` Exchange between gravitational potential energy and kinetic energy

**3.3.3 Work, energy and power · Power**
- `3.3.3(a)` Power P = W/t; the watt
- `3.3.3(b)` P = Fv
- `3.3.3(c)` Efficiency of a mechanical system = useful output energy / total input energy × 100%

**3.4.1 Materials · Springs**
- `3.4.1(a)` Tensile and compressive deformation; extension and compression
- `3.4.1(b)` Hooke's law
- `3.4.1(c)` Force constant k of a spring or wire: F = kx
- `3.4.1(d)` Force–extension (compression) graphs for springs and wires; investigating springs, rubber bands, polythene

**3.4.2 Materials · Mechanical properties of matter**
- `3.4.2(a)` Force–extension graph: work done is the area under the graph
- `3.4.2(b)` Elastic potential energy E = ½Fx = ½kx²
- `3.4.2(c)` Stress, strain and ultimate tensile strength
- `3.4.2(d)` Young modulus = tensile stress / tensile strain; determining it for a metal
- `3.4.2(e)` Stress–strain graphs for ductile, brittle and polymeric materials
- `3.4.2(f)` Elastic and plastic deformation of materials

**3.5.1 Newton's laws of motion and momentum · Newton's laws of motion**
- `3.5.1(a)` Newton's three laws of motion
- `3.5.1(b)` Linear momentum p = mv; vector nature of momentum
- `3.5.1(c)` Net force = rate of change of momentum: F = Δp/Δt
- `3.5.1(d)` Impulse of a force = FΔt
- `3.5.1(e)` Impulse equals the area under a force–time graph

**3.5.2 Newton's laws of motion and momentum · Collisions**
- `3.5.2(a)` The principle of conservation of momentum
- `3.5.2(b)` Collisions and interactions of bodies in one and two dimensions
- `3.5.2(c)` Perfectly elastic and inelastic collisions

**4.1.1 Charge and current · Charge**
- `4.1.1(a)` Electric current as rate of flow of charge I = ΔQ/Δt
- `4.1.1(b)` The coulomb as the unit of charge
- `4.1.1(c)` Elementary charge e = 1.6 × 10⁻¹⁹ C
- `4.1.1(d)` Net charge is quantised: a multiple of e
- `4.1.1(e)` Current as movement of electrons in metals and ions in electrolytes
- `4.1.1(f)` Conventional current and electron flow
- `4.1.1(g)` Kirchhoff's first law; conservation of charge

**4.1.2 Charge and current · Mean drift velocity**
- `4.1.2(a)` Mean drift velocity of charge carriers
- `4.1.2(b)` I = Anev, where n is the number density of charge carriers
- `4.1.2(c)` Conductors, semiconductors and insulators in terms of n

**4.2.1 Energy, power and resistance · Circuit symbols**
- `4.2.1(a)` Circuit symbols
- `4.2.1(b)` Circuit diagrams using these symbols

**4.2.2 Energy, power and resistance · E.m.f. and p.d.**
- `4.2.2(a)` Potential difference; the volt
- `4.2.2(b)` Electromotive force of a source such as a cell or power supply
- `4.2.2(c)` Distinction between e.m.f. and p.d. in terms of energy transfer
- `4.2.2(d)` Energy transfer W = VQ and W = EQ
- `4.2.2(e)` Energy transfer eV = ½mv² for electrons and other charged particles

**4.2.3 Energy, power and resistance · Resistance**
- `4.2.3(a)` Resistance R = V/I; the ohm
- `4.2.3(b)` Ohm's law
- `4.2.3(c)` I–V characteristics of resistor, filament lamp, thermistor, diode and LED; investigating them
- `4.2.3(d)` Light-dependent resistor: variation of resistance with light intensity

**4.2.4 Energy, power and resistance · Resistivity**
- `4.2.4(a)` Resistivity R = ρL/A; determining the resistivity of a metal
- `4.2.4(b)` Variation of resistivity of metals and semiconductors with temperature
- `4.2.4(c)` NTC thermistor: variation of resistance with temperature

**4.2.5 Energy, power and resistance · Power**
- `4.2.5(a)` Power P = VI, P = I²R and P = V²/R
- `4.2.5(b)` Energy transfer W = VIt
- `4.2.5(c)` The kilowatt-hour; calculating the cost of energy

**4.3.1 Electrical circuits · Series and parallel circuits**
- `4.3.1(a)` Kirchhoff's second law; conservation of energy
- `4.3.1(b)` Kirchhoff's first and second laws applied to circuits
- `4.3.1(c)` Total resistance in series R = R₁ + R₂ + …
- `4.3.1(d)` Total resistance in parallel 1/R = 1/R₁ + 1/R₂ + …
- `4.3.1(e)` Analysis of circuits with series and parallel components
- `4.3.1(f)` Analysis of circuits with more than one source of e.m.f.

**4.3.2 Electrical circuits · Internal resistance**
- `4.3.2(a)` Source of e.m.f.; internal resistance
- `4.3.2(b)` Terminal p.d.; "lost volts"
- `4.3.2(c)` E = I(R + r) and E = V + Ir; determining the internal resistance of a cell

**4.3.3 Electrical circuits · Potential dividers**
- `4.3.3(a)` Potential divider circuit with components
- `4.3.3(b)` Potential dividers with variable components, e.g. LDR and thermistor
- `4.3.3(c)` Potential divider equations Vout = R₂/(R₁+R₂) × Vin and V₁/V₂ = R₁/R₂; investigating with sensors

**4.4.1 Waves · Wave motion**
- `4.4.1(a)` Progressive waves; longitudinal and transverse waves
- `4.4.1(b)` Displacement, amplitude, wavelength, period, phase difference, frequency, speed; using an oscilloscope to find frequency
- `4.4.1(c)` f = 1/T
- `4.4.1(d)` The wave equation v = fλ
- `4.4.1(e)` Graphical representations of transverse and longitudinal waves
- `4.4.1(f)` Reflection, refraction, polarisation and diffraction of all waves; ripple tank and polarisation investigations
- `4.4.1(g)` Intensity of a progressive wave I = P/A; intensity ∝ amplitude²

**4.4.2 Waves · Electromagnetic waves**
- `4.4.2(a)` The electromagnetic spectrum; properties of electromagnetic waves
- `4.4.2(b)` Orders of magnitude of wavelengths from radio waves to gamma rays
- `4.4.2(c)` Plane polarised waves; polarisation of electromagnetic waves
- `4.4.2(d)` Refraction of light; refractive index n = c/v; n sin i = constant; investigating refraction and TIR
- `4.4.2(e)` Critical angle sinC = 1/n; total internal reflection

**4.4.3 Waves · Superposition**
- `4.4.3(a)` The principle of superposition of waves; techniques for light and microwaves
- `4.4.3(b)` Graphical methods to illustrate superposition
- `4.4.3(c)` Interference, coherence, path difference and phase difference
- `4.4.3(d)` Constructive and destructive interference in terms of path and phase difference
- `4.4.3(e)` Two-source interference with sound and microwaves
- `4.4.3(f)` Young double-slit experiment using visible light
- `4.4.3(g)` λ = ax/D for all waves where a ≪ D; wavelength of light with a double slit and a diffraction grating

**4.4.4 Waves · Stationary waves**
- `4.4.4(a)` Stationary waves using microwaves, stretched strings and air columns
- `4.4.4(b)` Graphical representations of a stationary wave
- `4.4.4(c)` Similarities and differences between stationary and progressive waves
- `4.4.4(d)` Nodes and antinodes
- `4.4.4(e)` Stationary wave patterns for strings and open and closed air columns; speed of sound in a resonance tube
- `4.4.4(f)` Separation of adjacent nodes (or antinodes) is λ/2
- `4.4.4(g)` Fundamental mode (1st harmonic) and harmonics

**4.5.1 Quantum physics · Photons**
- `4.5.1(a)` Particulate (photon) model of electromagnetic radiation
- `4.5.1(b)` Photon as a quantum of energy
- `4.5.1(c)` Photon energy E = hf and E = hc/λ
- `4.5.1(d)` The electronvolt as a unit of energy
- `4.5.1(e)` Estimating the Planck constant using LEDs and eV = hc/λ

**4.5.2 Quantum physics · The photoelectric effect**
- `4.5.2(a)` The photoelectric effect, incl. a simple demonstration (e.g. gold-leaf electroscope and zinc plate)
- `4.5.2(b)` One-to-one interaction between a photon and a surface electron
- `4.5.2(c)` Einstein's photoelectric equation hf = φ + KEmax
- `4.5.2(d)` Work function and threshold frequency
- `4.5.2(e)` Maximum kinetic energy of photoelectrons is independent of intensity
- `4.5.2(f)` Rate of emission above threshold frequency is proportional to intensity

**4.5.3 Quantum physics · Wave–particle duality**
- `4.5.3(a)` Electron diffraction and its experimental evidence
- `4.5.3(b)` Electrons diffracted through thin polycrystalline graphite; atomic spacing
- `4.5.3(c)` The de Broglie equation λ = h/p

**5.1.1 Thermal physics · Temperature**
- `5.1.1(a)` Thermal equilibrium
- `5.1.1(b)` Absolute (thermodynamic) temperature scale independent of any substance
- `5.1.1(c)` Temperature in degrees Celsius and kelvin
- `5.1.1(d)` T(K) ≈ θ(°C) + 273

**5.1.2 Thermal physics · Solid, liquid and gas**
- `5.1.2(a)` Solids, liquids and gases in terms of spacing, ordering and motion of particles
- `5.1.2(b)` Simple kinetic model for solids, liquids and gases
- `5.1.2(c)` Brownian motion and a smoke-particle demonstration
- `5.1.2(d)` Internal energy as the sum of random kinetic and potential energies of molecules
- `5.1.2(e)` Absolute zero as the lowest temperature limit; minimum internal energy
- `5.1.2(f)` Internal energy increases as temperature rises
- `5.1.2(g)` Internal energy changes and constant temperature during a change of phase

**5.1.3 Thermal physics · Thermal properties of materials**
- `5.1.3(a)` Specific heat capacity E = mcΔθ
- `5.1.3(b)` Electrical experiment to determine specific heat capacity of a metal or liquid
- `5.1.3(c)` Specific latent heat of fusion and vaporisation E = mL
- `5.1.3(d)` Electrical experiment to determine specific latent heat of a solid and a liquid

**5.1.4 Thermal physics · Ideal gases**
- `5.1.4(a)` Amount of substance in moles; Avogadro constant NA = 6.02 × 10²³ mol⁻¹
- `5.1.4(b)` Kinetic theory model of gases and its assumptions
- `5.1.4(c)` Pressure in terms of the kinetic model
- `5.1.4(d)` Ideal gas equation pV = nRT; Boyle's law; estimating absolute zero
- `5.1.4(e)` pV = ⅓Nm⟨c²⟩ with N particles and mean square speed
- `5.1.4(f)` Root mean square speed and mean square speed
- `5.1.4(g)` The Boltzmann constant k = R/NA
- `5.1.4(h)` pV = NkT and ½m⟨c²⟩ = (3/2)kT
- `5.1.4(i)` Internal energy of an ideal gas

**5.2.1 Circular motion · Kinematics of circular motion**
- `5.2.1(a)` The radian as a measure of angle
- `5.2.1(b)` Period and frequency of an object in circular motion
- `5.2.1(c)` Angular velocity ω = 2π/T = 2πf

**5.2.2 Circular motion · Centripetal force**
- `5.2.2(a)` A constant net force perpendicular to velocity gives circular motion
- `5.2.2(b)` Constant speed in a circle v = ωr
- `5.2.2(c)` Centripetal acceleration a = v²/r = ω²r
- `5.2.2(d)` Centripetal force F = mv²/r = mω²r; investigating with a whirling bung

**5.3.1 Oscillations · Simple harmonic oscillations**
- `5.3.1(a)` Displacement, amplitude, period, frequency, angular frequency and phase difference
- `5.3.1(b)` Angular frequency ω = 2π/T = 2πf
- `5.3.1(c)` Simple harmonic motion: a = −ω²x; determining period or frequency
- `5.3.1(d)` Solutions x = A cosωt or x = A sinωt
- `5.3.1(e)` Velocity v = ±ω√(A² − x²); vmax = ωA
- `5.3.1(f)` Period independent of amplitude (isochronous)
- `5.3.1(g)` Graphs of displacement, velocity and acceleration in SHM

**5.3.2 Oscillations · Energy of a simple harmonic oscillator**
- `5.3.2(a)` Interchange between kinetic and potential energy in SHM
- `5.3.2(b)` Energy–displacement graphs for a simple harmonic oscillator

**5.3.3 Oscillations · Damping**
- `5.3.3(a)` Free and forced oscillations
- `5.3.3(b)` Effects of damping on an oscillating system; observing forced and damped oscillations
- `5.3.3(c)` Resonance and natural frequency
- `5.3.3(d)` Amplitude–driving frequency graphs for forced oscillators
- `5.3.3(e)` Practical examples of forced oscillations and resonance

**5.4.1 Gravitational fields · Point and spherical masses**
- `5.4.1(a)` Gravitational fields are due to objects having mass
- `5.4.1(b)` Modelling a spherical mass as a point mass at its centre
- `5.4.1(c)` Gravitational field lines to map gravitational fields
- `5.4.1(d)` Gravitational field strength g = F/m
- `5.4.1(e)` Gravitational fields as one of several forms of field giving rise to a force

**5.4.2 Gravitational fields · Newton's law of gravitation**
- `5.4.2(a)` Newton's law of gravitation F = −GMm/r²
- `5.4.2(b)` Field strength of a point mass g = −GM/r²
- `5.4.2(c)` Field strength uniform near the Earth's surface, equal to acceleration of free fall

**5.4.3 Gravitational fields · Planetary motion**
- `5.4.3(a)` Kepler's three laws of planetary motion
- `5.4.3(b)` Centripetal force on a planet provided by gravitational force from the Sun
- `5.4.3(c)` T² = (4π²/GM)r³
- `5.4.3(d)` Kepler's third law T² ∝ r³ applied to systems other than the Solar System
- `5.4.3(e)` Geostationary orbit; uses of geostationary satellites

**5.4.4 Gravitational fields · Gravitational potential and energy**
- `5.4.4(a)` Gravitational potential as work done bringing unit mass from infinity; zero at infinity
- `5.4.4(b)` Gravitational potential Vg = −GM/r; changes in potential
- `5.4.4(c)` Force–distance graph: work done is the area under the graph
- `5.4.4(d)` Gravitational potential energy E = mVg = −GMm/r
- `5.4.4(e)` Escape velocity

**5.5.1 Astrophysics and cosmology · Stars**
- `5.5.1(a)` Planets, planetary satellites, comets, solar systems, galaxies and the universe
- `5.5.1(b)` Formation of a star: gravitational collapse, hydrogen fusion, radiation and gas pressure
- `5.5.1(c)` Evolution of a low-mass star to red giant and white dwarf; planetary nebula
- `5.5.1(d)` White dwarfs: electron degeneracy pressure; Chandrasekhar limit
- `5.5.1(e)` Evolution of a massive star: red super giant, supernova, neutron star or black hole
- `5.5.1(f)` Characteristics of a neutron star and a black hole
- `5.5.1(g)` Hertzsprung–Russell diagram: main sequence, red giants, super red giants, white dwarfs

**5.5.2 Astrophysics and cosmology · Electromagnetic radiation from stars**
- `5.5.2(a)` Energy levels of electrons in isolated gas atoms
- `5.5.2(b)` Energy levels have negative values
- `5.5.2(c)` Emission lines from hot gases: photon emission and electron transitions
- `5.5.2(d)` hf = ΔE and hc/λ = ΔE
- `5.5.2(e)` Different atoms have different spectral lines, identifying elements in stars
- `5.5.2(f)` Continuous, emission line and absorption line spectra
- `5.5.2(g)` Transmission diffraction grating to determine the wavelength of light
- `5.5.2(h)` Grating maxima d sinθ = nλ
- `5.5.2(i)` Wien's displacement law λmax ∝ 1/T to estimate a star's surface temperature
- `5.5.2(j)` Luminosity and Stefan's law L = 4πr²σT⁴
- `5.5.2(k)` Wien's law and Stefan's law to estimate the radius of a star

**5.5.3 Astrophysics and cosmology · Cosmology**
- `5.5.3(a)` Astronomical unit, light-year and parsec
- `5.5.3(b)` Stellar parallax
- `5.5.3(c)` p = 1/d, with parallax p in arcseconds and distance d in parsec
- `5.5.3(d)` The cosmological principle: homogeneous, isotropic, universal laws
- `5.5.3(e)` Doppler effect and Doppler shift of electromagnetic radiation
- `5.5.3(f)` Doppler equation Δλ/λ ≈ Δf/f ≈ v/c
- `5.5.3(g)` Hubble's law v ≈ H₀d for receding galaxies
- `5.5.3(h)` Expanding universe supported by galactic red shift
- `5.5.3(i)` Hubble constant in km s⁻¹ Mpc⁻¹ and s⁻¹
- `5.5.3(j)` The Big Bang theory
- `5.5.3(k)` Evidence for the Big Bang: microwave background radiation at 2.7 K
- `5.5.3(l)` The Big Bang gave rise to the expansion of space-time
- `5.5.3(m)` Age of the universe t ≈ 1/H₀
- `5.5.3(n)` Evolution of the universe after the Big Bang to the present
- `5.5.3(o)` Current ideas: dark energy, dark matter and a small percentage of ordinary matter

**6.1.1 Capacitors · Capacitors**
- `6.1.1(a)` Capacitance C = Q/V; the farad
- `6.1.1(b)` Charging and discharging in terms of electron flow
- `6.1.1(c)` Total capacitance in series 1/C = 1/C₁ + 1/C₂ + …
- `6.1.1(d)` Total capacitance in parallel C = C₁ + C₂ + …
- `6.1.1(e)` Analysing circuits with capacitors and resistors; series and parallel investigations

**6.1.2 Capacitors · Energy**
- `6.1.2(a)` p.d.–charge graph: energy stored is the area under the graph
- `6.1.2(b)` Energy stored W = ½QV = ½Q²/C = ½V²C
- `6.1.2(c)` Uses of capacitors to store energy

**6.1.3 Capacitors · Charging and discharging capacitors**
- `6.1.3(a)` Charging and discharging through a resistor; investigating with meters and data loggers
- `6.1.3(b)` Time constant τ = CR
- `6.1.3(c)` x = x₀e^(−t/CR) and x = x₀(1 − e^(−t/CR))
- `6.1.3(d)` Graphical and spreadsheet modelling of ΔQ/Δt = −Q/CR
- `6.1.3(e)` Exponential decay graphs; constant-ratio property

**6.2.1 Electric fields · Point and spherical charges**
- `6.2.1(a)` Electric fields are due to charges
- `6.2.1(b)` Modelling a uniformly charged sphere as a point charge
- `6.2.1(c)` Electric field lines to map electric fields
- `6.2.1(d)` Electric field strength E = F/q

**6.2.2 Electric fields · Coulomb's law**
- `6.2.2(a)` Coulomb's law F = Qq/4πε₀r²
- `6.2.2(b)` Field strength of a point charge E = Q/4πε₀r²
- `6.2.2(c)` Similarities and differences between gravitational and electric fields
- `6.2.2(d)` Electric fields as one of several forms of field giving rise to a force

**6.2.3 Electric fields · Uniform electric field**
- `6.2.3(a)` Uniform field strength E = V/d
- `6.2.3(b)` Parallel plate capacitor; permittivity: C = ε₀A/d, C = εA/d, ε = εrε₀
- `6.2.3(c)` Motion of charged particles in a uniform electric field

**6.2.4 Electric fields · Electric potential and energy**
- `6.2.4(a)` Electric potential as work done bringing unit positive charge from infinity
- `6.2.4(b)` Electric potential V = Q/4πε₀r; changes in potential
- `6.2.4(c)` Capacitance of an isolated sphere C = 4πε₀R
- `6.2.4(d)` Force–distance graph: work done is the area under the graph
- `6.2.4(e)` Electric potential energy = Vq = Qq/4πε₀r

**6.3.1 Electromagnetism · Magnetic fields**
- `6.3.1(a)` Magnetic fields are due to moving charges or permanent magnets
- `6.3.1(b)` Magnetic field lines to map magnetic fields
- `6.3.1(c)` Field patterns: long straight conductor, flat coil and long solenoid
- `6.3.1(d)` Fleming's left-hand rule
- `6.3.1(e)` Force on a current-carrying conductor F = BIL sinθ; measuring flux density with a current balance
- `6.3.1(f)` Magnetic flux density; the tesla

**6.3.2 Electromagnetism · Motion of charged particles**
- `6.3.2(a)` Force on a charged particle at right angles to a uniform field F = BQv
- `6.3.2(b)` Circular orbits of charged particles in a uniform magnetic field
- `6.3.2(c)` Charged particles in electric and magnetic fields; velocity selector

**6.3.3 Electromagnetism · Electromagnetic induction**
- `6.3.3(a)` Magnetic flux Φ; the weber; Φ = BA cosθ
- `6.3.3(b)` Magnetic flux linkage
- `6.3.3(c)` Faraday's law of electromagnetic induction and Lenz's law
- `6.3.3(d)` e.m.f. = −rate of change of flux linkage ε = −Δ(NΦ)/Δt; investigating with search coils
- `6.3.3(e)` Simple a.c. generator
- `6.3.3(f)` Simple laminated iron-cored transformer; Ns/Np = Vs/Vp = Ip/Is; investigating transformers

**6.4.1 Nuclear and particle physics · The nuclear atom**
- `6.4.1(a)` Alpha-particle scattering experiment; evidence of a small charged nucleus
- `6.4.1(b)` Simple nuclear model of the atom: protons, neutrons, electrons
- `6.4.1(c)` Relative sizes of atom and nucleus
- `6.4.1(d)` Proton number, nucleon number, isotopes; notation for nuclei
- `6.4.1(e)` Strong nuclear force: short range, attractive to ~3 fm, repulsive below ~0.5 fm
- `6.4.1(f)` Nuclear radius R = r₀A^(1/3)
- `6.4.1(g)` Mean densities of atoms and nuclei

**6.4.2 Nuclear and particle physics · Fundamental particles**
- `6.4.2(a)` Particles and antiparticles (electron–positron, proton–antiproton, neutron–antineutron, neutrino–antineutrino)
- `6.4.2(b)` A particle and its antiparticle have the same mass and opposite charge
- `6.4.2(c)` Hadrons: proton and neutron; subject to the strong and weak forces
- `6.4.2(d)` Leptons: electron and neutrino; subject to the weak force only
- `6.4.2(e)` Simple quark model of hadrons: up, down, strange and antiquarks
- `6.4.2(f)` Quark model of the proton (uud) and neutron (udd)
- `6.4.2(g)` Charges of the up, down, strange quarks and antiquarks as fractions of e
- `6.4.2(h)` Beta-minus and beta-plus decay
- `6.4.2(i)` β⁻ decay in the quark model: d → u + e⁻ + ν̄
- `6.4.2(j)` β⁺ decay in the quark model: u → d + e⁺ + ν
- `6.4.2(k)` Balancing quark transformation equations for charge
- `6.4.2(l)` Decay of particles in terms of the quark model

**6.4.3 Nuclear and particle physics · Radioactivity**
- `6.4.3(a)` Radioactive decay: spontaneous and random
- `6.4.3(b)` Alpha, beta and gamma: nature, penetration and range; investigating absorption
- `6.4.3(c)` Nuclear decay equations for alpha, beta-minus and beta-plus decay
- `6.4.3(d)` Activity and decay constant λ: A = λN
- `6.4.3(e)` Half-life λt½ = ln2; determining the half-life of an isotope
- `6.4.3(f)` A = A₀e^(−λt) and N = N₀e^(−λt); simulating decay with dice
- `6.4.3(g)` Graphical and spreadsheet modelling of ΔN/Δt = −λN
- `6.4.3(h)` Radioactive dating, e.g. carbon dating

**6.4.4 Nuclear and particle physics · Nuclear fission and fusion**
- `6.4.4(a)` Einstein's mass–energy equation ΔE = Δmc²
- `6.4.4(b)` Energy released or absorbed in simple nuclear reactions
- `6.4.4(c)` Creation and annihilation of particle–antiparticle pairs
- `6.4.4(d)` Mass defect, binding energy and binding energy per nucleon
- `6.4.4(e)` Binding energy per nucleon against nucleon number curve; energy changes in reactions
- `6.4.4(f)` Binding energy of nuclei using ΔE = Δmc² and nuclear masses
- `6.4.4(g)` Induced nuclear fission; chain reaction
- `6.4.4(h)` Structure of a fission reactor: fuel rods, control rods, moderator
- `6.4.4(i)` Environmental impact of nuclear waste
- `6.4.4(j)` Nuclear fusion; fusion reactions and temperature
- `6.4.4(k)` Balancing nuclear transformation equations

**6.5.1 Medical imaging · Using X-rays**
- `6.5.1(a)` Structure of an X-ray tube: heater (cathode), anode, target metal, high voltage supply
- `6.5.1(b)` Production of X-ray photons from an X-ray tube
- `6.5.1(c)` X-ray attenuation: simple scatter, photoelectric effect, Compton effect, pair production
- `6.5.1(d)` Attenuation of X-rays I = I₀e^(−μx)
- `6.5.1(e)` X-ray imaging with contrast media: barium and iodine
- `6.5.1(f)` CAT scanning and its components
- `6.5.1(g)` Advantages of a CAT scan over an X-ray image

**6.5.2 Medical imaging · Diagnostic methods in medicine**
- `6.5.2(a)` Medical tracers: technetium-99m and fluorine-18
- `6.5.2(b)` Gamma camera: collimator, scintillator, photomultiplier tubes, computer, display; image formation
- `6.5.2(c)` Diagnosis using a gamma camera
- `6.5.2(d)` PET scanner: positron–electron annihilation and image formation
- `6.5.2(e)` Diagnosis using PET scanning

**6.5.3 Medical imaging · Using ultrasound**
- `6.5.3(a)` Ultrasound: longitudinal wave above 20 kHz
- `6.5.3(b)` Piezoelectric effect; ultrasound transducer as emitter and receiver
- `6.5.3(c)` Ultrasound A-scan and B-scan
- `6.5.3(d)` Acoustic impedance Z = ρc
- `6.5.3(e)` Reflection at a boundary Ir/I₀ = (Z₂ − Z₁)²/(Z₂ + Z₁)²
- `6.5.3(f)` Acoustic impedance matching; gel in ultrasound scanning
- `6.5.3(g)` Doppler effect in ultrasound; speed of blood Δf/f = 2v cosθ/c

### A Level Physics — Edexcel

`"qualification": "alevel-physics", "examBoard": "Edexcel"`


**T1 Working as a Physicist**
- `1` Base and derived quantities and their SI units
- `2` Practical skills and techniques for familiar and unfamiliar experiments
- `3` Estimating physical quantities and using estimates to solve problems
- `4` Limitations of physical measurement in practical situations
- `5` Communicating information and ideas with appropriate terminology
- `6` Applications and implications of science; benefits and risks
- `7` Role of the scientific community in validating new knowledge
- `8` How society uses science to inform decision making

**T2 Mechanics**
- `9` Equations for uniformly accelerated motion (suvat) in one dimension
- `10` Displacement–time, velocity–time and acceleration–time graphs
- `11` Quantities from slopes and areas of motion graphs, incl. non-uniform acceleration
- `12` Scalar and vector quantities; vector notation
- `13` Resolving a vector into perpendicular components
- `14` Resultant of two coplanar vectors (drawing; calculation at right angles)
- `15` Projectile motion — independence of vertical and horizontal motion
- `16` Free-body force diagrams for a particle or rigid body
- `17` ΣF = ma — Newton's first and second laws; terminal velocity
- `18` Gravitational field strength g = F/m and weight W = mg
- `19` Core practical 1: acceleration of a freely-falling object
- `20` Newton's third law and properties of interaction force pairs
- `21` Momentum p = mv
- `22` Conservation of linear momentum in one dimension
- `23` Moment of a force = Fx
- `24` Centre of gravity and the principle of moments for equilibrium
- `25` Work done ΔW = FΔs, incl. force not along the line of motion
- `26` Kinetic energy Ek = ½mv²
- `27` Gravitational potential energy change ΔEgrav = mgΔh
- `28` Conservation of energy — work done, GPE and kinetic energy
- `29` Power: P = E/t and P = W/t
- `30` Efficiency from useful energy (or power) output over total input

**T3 Electric Circuits**
- `31` Electric current as rate of flow of charge, I = ΔQ/Δt
- `32` Potential difference V = W/Q
- `33` Resistance R = V/I; Ohm's law as the special case I ∝ V at constant temperature
- `34` Distribution of current as a consequence of charge conservation
- `35` Distribution of p.d. as a consequence of energy conservation
- `36` Deriving and using resistances in series and parallel
- `37` Electrical power and energy: P = VI, W = VIt, P = I²R, P = V²/R
- `38` I–V graphs for ohmic conductors, filament bulbs, thermistors and diodes
- `39` Resistivity R = ρl/A
- `40` Core practical 2: electrical resistivity of a material
- `41` I = nqvA and the large range of resistivities of materials
- `42` Variation of potential along a uniform current-carrying wire
- `43` Potential divider circuits — principles and calculations
- `44` Potential dividers with variable resistance: thermistors and LDRs
- `45` e.m.f., internal resistance and terminal p.d.
- `46` Core practical 3: e.m.f. and internal resistance of a cell
- `47` Resistance–temperature model (lattice vibrations, conduction electrons) for metals and NTC thermistors
- `48` Resistance–illumination model for LDRs

**T4 Materials**
- `49` Density ρ = m/V
- `50` Upthrust = weight of fluid displaced
- `51` Viscous drag (Stokes' law) F = 6πηrv; conditions; temperature dependence of viscosity
- `52` Core practical 4: viscosity of a liquid by the falling-ball method
- `53` Hooke's law ΔF = kΔx and stiffness k
- `54` Stress, strain and the Young modulus
- `55` Force–extension graphs; limit of proportionality, elastic limit, yield point, elastic and plastic deformation
- `56` Stress–strain graphs and breaking stress
- `57` Core practical 5: Young modulus of a material
- `58` Elastic strain energy ΔEel = ½FΔx and area under a force–extension graph

**T5 Waves and Particle Nature of Light**
- `59` Amplitude, frequency, period, speed and wavelength
- `60` The wave equation v = fλ
- `61` Longitudinal waves as pressure variation and molecular displacement
- `62` Transverse waves
- `63` Graphs of transverse, longitudinal and stationary waves
- `64` Core practical 6: speed of sound in air using a 2-beam oscilloscope
- `65` Wavefront, coherence, path difference, superposition, interference and phase
- `66` Phase difference and path difference
- `67` Stationary waves — formation, nodes and antinodes
- `68` Speed of a transverse wave on a string v = √(T/μ)
- `69` Core practical 7: length, tension and mass per unit length on a vibrating string
- `70` Intensity of radiation I = P/A
- `71` Refraction at an interface: n₁sinθ₁ = n₂sinθ₂ and refractive index
- `72` Critical angle sinC = 1/n
- `73` Predicting total internal reflection at an interface
- `74` Measuring the refractive index of a solid
- `75` Focal length of converging and diverging lenses
- `76` Ray diagrams through a lens to locate an image
- `77` Power of a lens P = 1/f
- `78` Thin lenses in combination: P = P₁ + P₂ + P₃ + …
- `79` Real and virtual images
- `80` Thin lens equation 1/u + 1/v = 1/f (real is positive)
- `81` Magnification = image height / object height = v/u
- `82` Plane polarisation
- `83` Diffraction and Huygens' construction at a slit or obstacle
- `84` Diffraction grating nλ = d sinθ
- `85` Core practical 8: wavelength of light using a diffraction grating
- `86` Electron diffraction as evidence for the wave nature of electrons
- `87` de Broglie equation λ = h/p
- `88` Transmission and reflection of waves at an interface
- `89` Pulse-echo technique and its limits (wavelength, pulse duration)
- `90` Wave model and photon model of electromagnetic radiation
- `91` Photon energy E = hf
- `92` Photon absorption and photoelectron emission
- `93` Threshold frequency, work function: hf = φ + ½mv²max
- `94` The electronvolt (eV)
- `95` Photoelectric effect as evidence for the particle nature of radiation
- `96` Line spectra and energy-level transitions; frequency emitted or absorbed

**T6 Further Mechanics**
- `97` Impulse = FΔt = Δp (Newton's second law)
- `98` Core practical 9: force on an object and its change of momentum
- `99` Conservation of linear momentum in two dimensions
- `100` Core practical 10: analysing collisions between small spheres using ICT
- `101` Elastic and inelastic collisions
- `102` Kinetic energy of a non-relativistic particle Ek = p²/2m
- `103` Angular displacement in radians and degrees
- `104` Angular velocity ω: v = ωr and T = 2π/ω
- `105` Centripetal acceleration a = v²/r = rω²
- `106` Resultant (centripetal) force needed for circular motion
- `107` Centripetal force F = ma = mv²/r = mrω²

**T7 Electric and Magnetic Fields**
- `108` Electric field as a region where a charge experiences a force
- `109` Electric field strength E = F/Q
- `110` Force between two charges (Coulomb's law) F = Q₁Q₂/4πε₀r²
- `111` Field due to a point charge E = Q/4πε₀r²
- `112` Relation between electric field and electric potential
- `113` Field between parallel plates E = V/d
- `114` Potential in a radial field V = Q/4πε₀r
- `115` Field lines and equipotentials for radial and uniform fields
- `116` Capacitance C = Q/V
- `117` Energy stored in a capacitor W = ½QV = ½CV² = ½Q²/C (derived from area under V–Q graph)
- `118` Charge and discharge curves for RC circuits; the time constant RC
- `119` Core practical 11: p.d. across a capacitor charging and discharging
- `120` Exponential discharge: Q = Q₀e^(−t/RC), I and V equivalents, log forms
- `121` Magnetic flux density B, flux φ and flux linkage Nφ
- `122` Force on a moving charge F = Bqv sinθ; Fleming's left-hand rule
- `123` Force on a current-carrying conductor F = BIl sinθ
- `124` E.m.f. induced by relative motion of a coil and a magnet
- `125` E.m.f. induced by a changing current in a linked coil
- `126` Lenz's law and energy conservation
- `127` Faraday's and Lenz's laws combined: ε = −d(Nφ)/dt
- `128` Alternating currents — frequency, period, peak and root-mean-square values
- `129` Vrms = V₀/√2 and Irms = I₀/√2

**T8 Nuclear and Particle Physics**
- `130` Nucleon number (mass number) and proton number (atomic number)
- `131` Large-angle alpha scattering and the nuclear model of the atom
- `132` Thermionic emission and accelerating electrons with electric and magnetic fields
- `133` Particle accelerators (linac, cyclotron) and detectors
- `134` Radius of a charged particle's path in a magnetic field r = p/BQ
- `135` Conservation of charge, energy and momentum in particle interactions; particle tracks
- `136` Why high energies are needed to probe the structure of nucleons
- `137` ΔE = c²Δm for creation and annihilation of matter and antimatter
- `138` MeV, GeV, MeV/c², GeV/c² and conversion to SI units
- `139` Relativistic increase in particle lifetime
- `140` Standard quark–lepton model: baryons, mesons, leptons, photons
- `141` Antiparticles and deducing their properties
- `142` Conservation of charge, baryon number and lepton number in interactions
- `143` Writing and interpreting particle equations

**T9 Thermodynamics**
- `144` Specific heat capacity and specific latent heat: ΔE = mcΔθ, ΔE = LΔm
- `145` Core practical 12: calibrating a thermistor in a potential divider as a thermostat
- `146` Core practical 13: specific latent heat of a phase change
- `147` Internal energy — random distribution of potential and kinetic energy
- `148` Absolute zero; average kinetic energy and absolute temperature
- `149` pV = ⅓Nm⟨c²⟩ from the kinetic theory model
- `150` Ideal gas equation pV = NkT
- `151` Core practical 14: pressure and volume of a gas at fixed temperature
- `152` ½m⟨c²⟩ = (3/2)kT
- `153` Black body radiators and radiation curves
- `154` Stefan–Boltzmann law L = σAT⁴
- `155` Wien's law λmaxT = 2.898 × 10⁻³ m K

**T10 Space**
- `156` Intensity I = L/4πd² (luminosity and distance)
- `157` Astronomical distances by trigonometric parallax
- `158` Astronomical distances using standard candles
- `159` Hertzsprung–Russell diagram: luminosity against surface temperature
- `160` HR diagram and the life cycle of stars
- `161` Doppler effect — frequency shift from relative motion
- `162` Redshift z = Δλ/λ ≈ Δf/f ≈ v/c and v = H₀d
- `163` Age and fate of the universe: Hubble constant and dark matter

**T11 Nuclear Radiation**
- `164` Nuclear binding energy and mass deficit: ΔE = c²Δm
- `165` Atomic mass unit (u) and conversion to SI
- `166` Fusion and fission and the binding energy per nucleon curve
- `167` Mechanism of fusion — very high density and temperature
- `168` Background radiation and correcting for it
- `169` Alpha, beta and gamma: nature, penetration, ionising ability and range
- `170` Writing and interpreting nuclear equations
- `171` Core practical 15: absorption of gamma radiation by lead
- `172` Spontaneous and random nature of nuclear decay
- `173` Half-life, activity A = λN, N = N₀e^(−λt), A = A₀e^(−λt), λ = ln2/t½

**T12 Gravitational Fields**
- `174` Gravitational field as a region where a mass experiences a force
- `175` Gravitational field strength g = F/m
- `176` Newton's law of universal gravitation F = Gm₁m₂/r²
- `177` Field of a point mass g = Gm/r²
- `178` Gravitational potential in a radial field Vgrav = −Gm/r
- `179` Comparing electric and gravitational fields
- `180` Newton's laws and universal gravitation applied to orbital motion

**T13 Oscillations**
- `181` Condition for simple harmonic motion F = −kx
- `182` SHM equations: a = −ω²x, x = A cosωt, v = −Aω sinωt, T = 1/f = 2π/ω
- `183` Periods of a mass–spring system T = 2π√(m/k) and a simple pendulum T = 2π√(l/g)
- `184` Displacement–time graphs for oscillations; gradient gives velocity
- `185` Velocity–time graphs for oscillations; gradient gives acceleration
- `186` Resonance
- `187` Core practical 16: unknown mass from resonant frequencies of known masses
- `188` Conservation of energy in damped and undamped oscillators
- `189` Free and forced oscillations
- `190` Amplitude of forced oscillations near the natural frequency; effect of damping
- `191` Damping and plastic deformation of ductile materials reducing amplitude

### A Level Physics — WJEC

`"qualification": "alevel-physics", "examBoard": "WJEC"`


**1.1 AS Unit 1 · Basic physics**
- `1.1(a)` The 6 essential base SI units (kg, m, s, A, mol, K)
- `1.1(b)` Representing units in terms of the base SI units and prefixes
- `1.1(c)` Checking equations for homogeneity using units
- `1.1(d)` Scalar and vector quantities, with examples
- `1.1(e)` Adding and subtracting coplanar vectors (two perpendicular vectors in calculations)
- `1.1(f)` Resolving a vector into two perpendicular components
- `1.1(g)` Density ρ = m/V
- `1.1(h)` The turning effect of a force
- `1.1(i)` The principle of moments
- `1.1(j)` Centre of gravity and stability (cylinder, sphere, uniform cuboid beam)
- `1.1(k)` Equilibrium: zero resultant force and zero net moment
- `1.1(P)` Specified practical work: density of solids; unknown masses using the principle of moments

**1.2 AS Unit 1 · Kinematics**
- `1.2(a)` Displacement, mean and instantaneous speed, velocity and acceleration
- `1.2(b)` Graphical representation of displacement, speed, velocity and acceleration
- `1.2(c)` Displacement–time and velocity–time graphs, incl. non-uniform acceleration
- `1.2(d)` Deriving and using equations for uniformly accelerated motion
- `1.2(e)` Bodies falling in a gravitational field with and without air resistance; terminal velocity
- `1.2(f)` Independence of vertical and horizontal motion under gravity
- `1.2(g)` Uniform velocity in one direction with uniform acceleration at right angles
- `1.2(P)` Specified practical work: measurement of g by free fall

**1.3 AS Unit 1 · Dynamics**
- `1.3(a)` The concept of force; Newton's third law
- `1.3(b)` Free body diagrams for forces on a particle or body
- `1.3(c)` F = ma for constant mass
- `1.3(d)` Linear momentum as mass × velocity
- `1.3(e)` Force as the rate of change of momentum (constant mass)
- `1.3(f)` Conservation of momentum in one dimension: elastic and inelastic collisions
- `1.3(P)` Specified practical work: investigation of Newton's second law

**1.4 AS Unit 1 · Energy concepts**
- `1.4(a)` Work as force × distance moved in the direction of a constant force
- `1.4(b)` Work done by a constant force not along the line of motion: Fx cosθ
- `1.4(c)` Conservation of energy: mgh, ½kx² and ½mv²
- `1.4(d)` The work–energy relationship Fx = ½mv² − ½mu²
- `1.4(e)` Power as the rate of energy transfer
- `1.4(f)` Dissipative forces (friction, drag) and reduced efficiency
- `1.4(g)` Efficiency = useful energy transfer / total energy input × 100%

**1.5 AS Unit 1 · Solids under stress**
- `1.5(a)` Hooke's law F = kx; spring constant as force per unit extension
- `1.5(b)` Tensile stress, tensile strain and the Young modulus
- `1.5(c)` Work done in deforming a solid = area under force–extension graph (½Fx if Hooke's law obeyed)
- `1.5(d)` Classification of solids: crystalline, amorphous (glasses, ceramics) and polymeric
- `1.5(e)` Force–extension (stress–strain) graph for a metal such as copper: elastic and plastic strain, dislocations and strengthening
- `1.5(f)` Graph for a brittle material such as glass: elastic strain to fracture, crack propagation, surface imperfections
- `1.5(g)` Graph for rubber: approximate Hooke's law, low Young modulus, chain straightening, hysteresis
- `1.5(P)` Specified practical work: Young modulus of a metal wire; force–extension of rubber

**1.6 AS Unit 1 · Using radiation to investigate stars**
- `1.6(a)` Stellar spectrum: continuous emission spectrum plus line absorption spectrum from the star's atmosphere
- `1.6(b)` Black bodies; stars as good approximations
- `1.6(c)` Black body spectrum shape; peak wavelength inversely proportional to absolute temperature
- `1.6(d)` Wien's displacement law, Stefan's law and the inverse square law for luminosity, size, temperature and distance
- `1.6(e)` Multiwavelength astronomy

**1.7 AS Unit 1 · Particles and nuclear structure**
- `1.7(a)` Matter composed of quarks and leptons; three generations (first generation in detail)
- `1.7(b)` Antiparticles: identical properties apart from opposite charge; annihilation
- `1.7(c)` Symbols for the positron and for antiparticles of quarks and hadrons
- `1.7(d)` Quarks never observed in isolation: hadrons, baryons, antibaryons, mesons
- `1.7(e)` Quark compositions of the neutron and proton
- `1.7(f)` Using data to suggest the quark make-up of other first-generation baryons and charged pions
- `1.7(g)` Properties of the four forces or interactions
- `1.7(h)` Conservation of charge, lepton number and baryon (quark) number in simple reactions
- `1.7(i)` Neutrino involvement and quark flavour changes occur only in weak interactions

**2.1 AS Unit 2 · Conduction of electricity**
- `2.1(a)` The coulomb; an electron's charge e as a small fraction of a coulomb
- `2.1(b)` Charge flowing through conductors
- `2.1(c)` Electric current as rate of flow of charge
- `2.1(d)` I = Q/t
- `2.1(e)` The ampere: A = C s⁻¹
- `2.1(f)` Conduction in metals as drift of free electrons
- `2.1(g)` Deriving and using I = nAve

**2.2 AS Unit 2 · Resistance**
- `2.2(a)` Definition of potential difference
- `2.2(b)` The volt: V = J C⁻¹
- `2.2(c)` I–V characteristics of a lamp filament and a metal wire at constant temperature
- `2.2(d)` Ohm's law, V = IR and the definition of resistance
- `2.2(e)` The ohm: Ω = V A⁻¹
- `2.2(f)` Power P = IV = I²R = V²/R
- `2.2(g)` Collisions between free electrons and ions cause resistance, which rises with temperature
- `2.2(h)` Resistivity R = ρl/A
- `2.2(i)` Resistance of metals varies almost linearly with temperature
- `2.2(j)` Collisions increase ion vibration energy, so metal temperature rises
- `2.2(k)` Superconductivity and transition temperature
- `2.2(l)` Most metals superconduct a few degrees above absolute zero
- `2.2(m)` High-temperature superconductors (above the boiling point of nitrogen)
- `2.2(n)` Uses of superconductors, e.g. MRI scanners and particle accelerators
- `2.2(P)` Specified practical work: I–V of a lamp filament and metal wire; resistivity of a metal; resistance against temperature for a wire

**2.3 AS Unit 2 · D.C. circuits**
- `2.3(a)` Current in parallel branches sums to the source current (conservation of charge)
- `2.3(b)` P.d.s in series sum to the supply p.d. (conservation of energy)
- `2.3(c)` P.d.s across parallel components are equal
- `2.3(d)` Combined resistance of resistors in series and parallel
- `2.3(e)` Potential dividers, incl. LDRs and thermistors
- `2.3(f)` The emf of a source
- `2.3(g)` The unit of emf is the volt
- `2.3(h)` Internal resistance: V = E − Ir
- `2.3(i)` Current and p.d. in circuits with one cell or cells in series
- `2.3(P)` Specified practical work: internal resistance of a cell

**2.4 AS Unit 2 · The nature of waves**
- `2.4(a)` A progressive wave transfers energy without transferring matter
- `2.4(b)` Transverse and longitudinal waves
- `2.4(c)` Polarisation
- `2.4(d)` In phase and in antiphase
- `2.4(e)` Displacement, amplitude, wavelength, frequency, period and velocity of a wave
- `2.4(f)` Graphs of displacement against time and position (transverse waves)
- `2.4(g)` The wave equation c = fλ
- `2.4(h)` Wavefronts oscillate in phase; rays at right angles to wavefronts
- `2.4(P)` Specified practical work: intensity variations for polarisation

**2.5 AS Unit 2 · Wave properties**
- `2.5(a)` Diffraction at slits and obstacles
- `2.5(b)` Little diffraction when λ is much smaller than the slit or obstacle
- `2.5(c)` Spreading of waves when λ is equal to or greater than the slit width
- `2.5(d)` Two-source interference
- `2.5(e)` The historical importance of Young's experiment
- `2.5(f)` The principle of superposition, with sketch graphs
- `2.5(g)` Path difference rules for constructive and destructive interference (in-phase sources)
- `2.5(h)` Young's double-slit fringe spacing y = λD/s
- `2.5(i)` Deriving and using d sinθ = nλ for a diffraction grating
- `2.5(j)` Gratings: small d gives widely spaced orders; many slits give sharp beams
- `2.5(k)` Coherent sources: monochromatic, continuous wavefronts, constant phase relationship
- `2.5(l)` Examples of coherent and incoherent sources
- `2.5(m)` Conditions for observing two-source interference
- `2.5(n)` Differences between stationary and progressive waves
- `2.5(o)` A stationary wave as superposition of two opposite progressive waves; internodal distance λ/2
- `2.5(P)` Specified practical work: wavelength with double slits and with a grating; speed of sound using stationary waves

**2.6 AS Unit 2 · Refraction of light**
- `2.6(a)` Refractive index n = c/v
- `2.6(b)` n₁v₁ = n₂v₂ and n₁sinθ₁ = n₂sinθ₂ (Snell's law)
- `2.6(c)` Snell's law and the wave model; plane waves refracting at a boundary
- `2.6(d)` Conditions for total internal reflection
- `2.6(e)` Critical angle sinC = n₂/n₁
- `2.6(f)` Total internal reflection in multimode optical fibres
- `2.6(g)` Multimode dispersion limiting data rate and distance
- `2.6(h)` Monomode fibres allowing greater transmission rates and distances
- `2.6(P)` Specified practical work: refractive index of a material

**2.7 AS Unit 2 · Photons**
- `2.7(a)` Light as discrete packets of energy (photons)
- `2.7(b)` Demonstrating the photoelectric effect
- `2.7(c)` Vacuum photocell to measure the maximum kinetic energy of emitted electrons
- `2.7(d)` Graph of Ek max against frequency
- `2.7(e)` Einstein's equation Ek max = hf − φ and its match with the graph
- `2.7(f)` The visible spectrum (700 nm to 400 nm) and wavelengths of other EM regions
- `2.7(g)` Typical photon energies for these radiations
- `2.7(h)` Producing line emission and line absorption spectra from atoms
- `2.7(i)` Appearance of such spectra in a diffraction grating
- `2.7(j)` Atomic energy level diagrams, the photon hypothesis and line spectra
- `2.7(k)` Determining ionisation energies from an energy level diagram
- `2.7(l)` Electron diffraction; particles have a wave-like aspect
- `2.7(m)` λ = h/p for particles of matter and photons
- `2.7(n)` Radiation pressure on a surface absorbing or reflecting photons
- `2.7(P)` Specified practical work: determination of h using LEDs

**2.8 AS Unit 2 · Lasers**
- `2.8(a)` Stimulated emission and coherent light
- `2.8(b)` Population inversion (N₂ > N₁) needed for a laser
- `2.8(c)` Population inversion not usually possible with a 2-level system
- `2.8(d)` Attaining population inversion in 3- and 4-level systems
- `2.8(e)` Pumping and its purpose
- `2.8(f)` Structure of a typical laser: amplifying medium between two mirrors
- `2.8(g)` Advantages and uses of semiconductor lasers (CDs, DVDs, telecommunications)

**3.1 A2 Unit 3 · Circular motion**
- `3.1(a)` Period of rotation and frequency
- `3.1(b)` The radian as a unit of angle
- `3.1(c)` Using the radian as a measure of angle
- `3.1(d)` Angular velocity ω for circular motion and SHM
- `3.1(e)` Centripetal force as the resultant force on a body in uniform circular motion
- `3.1(f)` Centripetal force and acceleration directed towards the centre
- `3.1(g)` Circular motion equations: v = ωr, a = ω²r, a = v²/r, F = mv²/r, F = mω²r

**3.2 A2 Unit 3 · Vibrations**
- `3.2(a)` Simple harmonic motion defined in words
- `3.2(b)` a = −ω²x as the defining equation of SHM
- `3.2(c)` Graph of acceleration against displacement in SHM
- `3.2(d)` x = A cos(ωt + φ) as a solution to a = −ω²x
- `3.2(e)` Frequency, period, amplitude and phase
- `3.2(f)` Period T = 1/f = 2π/ω
- `3.2(g)` v = −Aω sin(ωt + φ) for the velocity in SHM
- `3.2(h)` Graphs of displacement and velocity against time in SHM
- `3.2(i)` T = 2π√(m/k) for a mass–spring system
- `3.2(j)` T = 2π√(l/g) for a simple pendulum
- `3.2(k)` Interchange of kinetic and potential energy in undamped SHM; energy calculations
- `3.2(l)` Free oscillations and the effect of damping in real systems
- `3.2(m)` Practical examples of damped oscillations
- `3.2(n)` Critical damping, e.g. vehicle suspensions
- `3.2(o)` Forced oscillations and resonance, with practical examples
- `3.2(p)` Amplitude of a forced oscillation against driving frequency; damping broadens the resonance curve
- `3.2(q)` When resonance is useful (tuning, microwave cooking) or should be avoided (bridge design)
- `3.2(P)` Specified practical work: g with a pendulum; damping of a spring

**3.3 A2 Unit 3 · Kinetic theory**
- `3.3(a)` Ideal gas equations pV = nRT and pV = NkT
- `3.3(b)` Assumptions of the kinetic theory of gases
- `3.3(c)` Pressure from molecular movement: pV = ⅓Nm⟨c²⟩
- `3.3(d)` The Avogadro constant and the mole
- `3.3(e)` Molar mass, relative molecular mass and number of moles
- `3.3(f)` Combining pV = ⅓Nm⟨c²⟩ with pV = nRT: kinetic energy of a mole is (3/2)RT and of a molecule (3/2)kT

**3.4 A2 Unit 3 · Thermal physics**
- `3.4(a)` Internal energy as the sum of molecular potential and kinetic energies
- `3.4(b)` Absolute zero as the temperature of minimum internal energy
- `3.4(c)` Internal energy of an ideal monatomic gas is wholly kinetic: U = (3/2)nRT
- `3.4(d)` Heat as energy in transit across a boundary
- `3.4(e)` Thermal equilibrium: no heat flow, same temperature
- `3.4(f)` Work as energy in transit
- `3.4(g)` Work done by a gas at constant pressure W = pΔV
- `3.4(h)` Work as area under a p–V graph when p changes
- `3.4(i)` First law of thermodynamics ΔU = Q − W; interpreting negative values
- `3.4(j)` For a solid or liquid W is negligible so Q = ΔU
- `3.4(k)` Q = mcΔθ and the definition of specific heat capacity
- `3.4(P)` Specified practical work: estimating absolute zero using gas laws; specific heat capacity of a solid

**3.5 A2 Unit 3 · Nuclear decay**
- `3.5(a)` Spontaneous nuclear decay; nature of α, β and γ; transformation equations in AZX notation
- `3.5(b)` Distinguishing α, β and γ; nature, penetration and range
- `3.5(c)` Allowing for background radiation
- `3.5(d)` Half-life T½
- `3.5(e)` Activity and the becquerel
- `3.5(f)` Decay constant λ and A = λN
- `3.5(g)` Exponential decay law: N = N₀e^(−λt), A = A₀e^(−λt) or N = N₀/2ˣ
- `3.5(h)` Deriving and using T½ = ln2/λ
- `3.5(P)` Specified practical work: radioactive decay (dice analogy); gamma intensity against distance

**3.6 A2 Unit 3 · Nuclear energy**
- `3.6(a)` Mass–energy equivalence E = mc²
- `3.6(b)` Binding energy and binding energy per nucleon; the unified atomic mass unit
- `3.6(c)` Calculating binding energy and binding energy per nucleon from nuclear masses
- `3.6(d)` Conservation of mass/energy in particle interactions, e.g. fission and fusion
- `3.6(e)` Binding energy per nucleon against nucleon number in fission and fusion

**4.1 A2 Unit 4 · Capacitance**
- `4.1(a)` A parallel plate capacitor: two equal metal plates separated by vacuum or air
- `4.1(b)` Storing energy by transferring charge between plates (equal and opposite charges)
- `4.1(c)` Capacitance C = Q/V
- `4.1(d)` C = ε₀A/d for a parallel plate capacitor with no dielectric
- `4.1(e)` A dielectric increases capacitance
- `4.1(f)` Uniform field inside a parallel plate capacitor: E = V/d
- `4.1(g)` Energy stored U = ½QV
- `4.1(h)` Capacitors in series and parallel
- `4.1(i)` Charging and discharging a capacitor through a resistor
- `4.1(j)` Q = Q₀(1 − e^(−t/RC)) and Q = Q₀e^(−t/RC); time constant RC
- `4.1(P)` Specified practical work: charging and discharging to find the time constant; energy stored in a capacitor

**4.2 A2 Unit 4 · Electrostatic and gravitational fields of force**
- `4.2(a)` Features of electric and gravitational fields (comparison table in the spec)
- `4.2(b)` Gravitational field outside a sphere equals that of a point mass at its centre
- `4.2(c)` Field lines giving field direction; radial for a positive point charge
- `4.2(d)` Equipotential surfaces; spherical for a point charge
- `4.2(e)` Net potential and resultant field strength for several point charges or masses
- `4.2(f)` ΔUP = mgΔh where the variation of g is negligible

**4.3 A2 Unit 4 · Orbits and the wider universe**
- `4.3(a)` Kepler's three laws of planetary motion
- `4.3(b)` Newton's law of gravitation F = GM₁M₂/r² for planets and satellites
- `4.3(c)` Deriving Kepler's third law for circular orbits
- `4.3(d)` Using orbital period or speed to find the mass of the central object
- `4.3(e)` Orbital speeds in spiral galaxies imply dark matter
- `4.3(f)` The Higgs boson and its possible link to dark matter
- `4.3(g)` Centre of mass of two spherical objects and their mutual orbital period
- `4.3(h)` The Doppler relationship Δλ/λ = v/c
- `4.3(i)` A star's radial velocity from Doppler shift of spectral lines
- `4.3(j)` Masses in a double system (star and exoplanet) from radial velocity data and period
- `4.3(k)` The Hubble constant: v = H₀D
- `4.3(l)` Why 1/H₀ approximates the age of the universe
- `4.3(m)` Critical density of a flat universe ρ₀ = 3H₀²/8πG from conservation of energy

**4.4 A2 Unit 4 · Magnetic fields**
- `4.4(a)` Direction of the force on a current-carrying conductor in a magnetic field
- `4.4(b)` Calculating B from the force on a conductor: F = BIl sinθ
- `4.4(c)` F = Bqv sinθ for a moving charge
- `4.4(d)` Hall voltage production; VH ∝ B for constant I
- `4.4(e)` Field shapes for a long straight wire and a long solenoid
- `4.4(f)` B = μ₀I/2πa and B = μ₀nI
- `4.4(g)` An iron core increases the field in a solenoid
- `4.4(h)` Forces between current-carrying conductors
- `4.4(i)` Ion beams deflected in uniform electric and magnetic fields
- `4.4(j)` Charged particles in linear accelerators, cyclotrons and synchrotrons
- `4.4(P)` Specified practical work: force on a current in a magnetic field; flux density with a Hall probe

**4.5 A2 Unit 4 · Electromagnetic induction**
- `4.5(a)` Magnetic flux Φ = BA cosθ and flux linkage NΦ
- `4.5(b)` The laws of Faraday and Lenz
- `4.5(c)` Applying the laws: emf = −rate of change of flux linkage
- `4.5(d)` Emf induced in a linear conductor moving at right angles to a uniform field
- `4.5(e)` Emf in a coil rotating in a magnetic field, qualitatively

**4A A2 Unit 4 Option A · Alternating currents**
- `4A(a)` Faraday's law applied to a rotating coil in a magnetic field
- `4A(b)` Flux linkage of a rotating flat coil is BAN cosωt
- `4A(c)` Induced emf in a rotating flat coil V = ωBAN sinωt
- `4A(d)` Frequency, period, peak and rms values for alternating p.d. and current
- `4A(e)` rms value related to energy dissipated per cycle; Irms = I₀/√2, Vrms = V₀/√2
- `4A(f)` Mean power in a resistor P = IV = I²R = V²/R (rms values)
- `4A(g)` Oscilloscope for a.c. and d.c. voltages and currents and frequencies
- `4A(h)` 90° phase lag of current behind p.d. for an inductor
- `4A(i)` Inductor reactance XL = Vrms/Irms = ωL
- `4A(j)` 90° phase lead of current for a capacitor; reactance XC = 1/ωC
- `4A(k)` Zero mean power dissipation in an inductor or capacitor
- `4A(l)` Adding p.d.s across series RC, RL and RCL combinations using phasors
- `4A(m)` Phase angle and impedance Z = Vrms/Irms
- `4A(n)` Resonance frequency of a series RCL circuit
- `4A(o)` Q factor of an RCL circuit at resonance
- `4A(p)` Sharpness of the resonance curve and the Q factor

**4B A2 Unit 4 Option B · Medical physics**
- `4B(a)` Nature and properties of X-rays
- `4B(b)` Production of X-ray spectra; controlling beam intensity and photon energy
- `4B(c)` High-energy X-rays for therapy; low-energy X-rays for diagnosis
- `4B(d)` Attenuation of X-rays I = I₀exp(−μx)
- `4B(e)` X-ray imaging of soft tissue; fluoroscopy and image intensifiers
- `4B(f)` Radiography techniques incl. digital image receptors
- `4B(g)` Rotating-beam X-ray computed tomography (CT) scanner
- `4B(h)` Generating and detecting ultrasound with piezoelectric transducers
- `4B(i)` Ultrasound scanning: A-scans and B-scans, examples and applications
- `4B(j)` Acoustic impedance Z = ρc; reflection and transmission at tissue boundaries; coupling medium
- `4B(k)` Doppler equation Δf/f = 2v cosθ/c for blood flow with an ultrasound probe
- `4B(l)` Principles of magnetic resonance: precession, resonance, relaxation time; Larmor frequency f = 42.6 × 10⁶ B
- `4B(m)` Using MRI to obtain diagnostic information about internal structures
- `4B(n)` Advantages and disadvantages of ultrasound, X-ray imaging and MRI
- `4B(o-1)` Effects of α, β and γ radiation on living matter
- `4B(o-2)` The gray (Gy) and sievert (Sv); absorbed, equivalent and effective dose
- `4B(p)` Equivalent dose = absorbed dose × radiation weighting factor; effective dose = equivalent dose × tissue weighting factor
- `4B(q)` Radionuclide tracers, especially technetium-99m
- `4B(r)` The gamma camera: collimator, scintillation counter, photomultiplier / CCD
- `4B(s)` Positron emission tomography (PET) scanning and detecting tumours

**4C A2 Unit 4 Option C · The physics of sports**
- `4C(a)` Centre of gravity, stability and toppling in sporting contexts
- `4C(b)` Principle of moments for forces in muscle systems and sport (e.g. sailing)
- `4C(c)` Newton's second law in the form Ft = mv − mu in sport
- `4C(d)` Coefficient of restitution e = relative speed after / before collision; e = √(h/H)
- `4C(e)` Moment of inertia of a body
- `4C(f)` Moment of inertia of a solid sphere and a thin spherical shell
- `4C(g)` Angular acceleration α = (ω₂ − ω₁)/t
- `4C(h)` Torque τ = Iα
- `4C(i)` Angular momentum L = Iω
- `4C(j)` Conservation of angular momentum in sporting contexts
- `4C(k)` Rotational kinetic energy ½Iω²
- `4C(l)` Conservation of energy with linear and rotational kinetic energy and potential energy in sport
- `4C(m)` Projectile motion in sporting contexts
- `4C(n)` Bernoulli's equation in sporting contexts
- `4C(o)` Drag force FD = ½ρv²ACD with drag coefficient CD

**4D A2 Unit 4 Option D · Energy and the environment**
- `4D(a(i))` Thermal equilibrium of Earth: energy in from the Sun balanced by energy re-radiated; global energy demand and CO₂
- `4D(a(ii))` Origin and transmission of solar energy; the Sun's power spectrum; conversion to near infrared in the atmosphere
- `4D(a(iii))` Wien's law and the Stefan–Boltzmann T⁴ law applied to solar power
- `4D(a(iv))` Density and Archimedes' principle: sea-level rise from melting ice caps and land ice, but not floating icebergs
- `4D(b(i))` Solar power: proton–proton chain in the Sun; intensity I = P/A and inverse square law; photovoltaic cells and efficiency
- `4D(b(ii))` Wind power: power available from a flowing fluid P = ½ρAv³; factors affecting turbine efficiency
- `4D(b(iii))` Tidal barrages, hydroelectric and pumped storage: Ep to Ek conversions, energy and power calculations, comparison with wind
- `4D(b(iv))` Nuclear fission and fusion: breeding and enrichment; difficulties of sustained fusion (triple product)
- `4D(c)` Principles of fuel cell operation and benefits for greenhouse gas emissions
- `4D(d)` Thermal conduction equation ΔQ/Δt = −AK Δθ/Δx
- `4D(e)` Insulation and thermal energy loss; rate of energy transfer = UAΔθ for parallel surfaces, incl. different materials in contact

### Pearson Exploring Science Year 7 — Pearson

`"qualification": "exploring-science-y7", "examBoard": "Pearson"`


**7A Cells, tissues, organs and systems**
- `7Aa` Life processes
- `7Ab` Organs
- `7Ac` Tissues
- `7Ad` Cells
- `7Ae` Organ systems

**7B Sexual reproduction in animals**
- `7Ba` Animal sexual reproduction
- `7Bb` Reproductive organs
- `7Bc` Becoming pregnant
- `7Bd` Gestation and birth
- `7Be` Growing up

**7C Muscles and bones**
- `7Ca` Muscles and breathing
- `7Cb` Muscles and blood
- `7Cc` The skeleton
- `7Cd` Muscles and moving
- `7Ce` Drugs

**7D Ecosystems**
- `7Da` Variation
- `7Db` Adaptations
- `7Dc` Effects of the environment
- `7Dd` Effects on the environment
- `7De` Transfers in food chains

**7E Mixtures and separation**
- `7Ea` Mixtures
- `7Eb` Solutions
- `7Ec` Evaporation
- `7Ed` Chromatography
- `7Ee` Distillation

**7F Acids and alkalis**
- `7Fa` Hazards
- `7Fb` Indicators
- `7Fc` Acidity and alkalinity
- `7Fd` Neutralisation
- `7Fe` Neutralisation in daily life

**7G The particle model**
- `7Ga` Solids, liquids and gases
- `7Gb` Particles
- `7Gc` Brownian motion
- `7Gd` Diffusion
- `7Ge` Air pressure

**7H Atoms, elements and molecules**
- `7Ha` The air we breathe
- `7Hb` Earth's elements
- `7Hc` Metals and non-metals
- `7Hd` Making compounds
- `7He` Chemical reactions

**7I Energy**
- `7Ia` Energy and changes
- `7Ib` Energy transfers and stores
- `7Ic` Fuels
- `7Id` Other energy resources
- `7Ie` Using resources

**7J Current electricity**
- `7Ja` Switches and current
- `7Jb` Models for circuits
- `7Jc` Series and parallel circuits
- `7Jd` Changing the current
- `7Je` Using electricity

**7K Forces**
- `7Ka` Forces
- `7Kb` Springs
- `7Kc` Friction
- `7Kd` Pressure
- `7Ke` Balanced and unbalanced forces

**7L Sound**
- `7La` Making sounds
- `7Lb` Moving sounds
- `7Lc` Detecting sounds
- `7Ld` Using sound
- `7Le` Comparing waves

### Pearson Exploring Science Year 8 — Pearson

`"qualification": "exploring-science-y8", "examBoard": "Pearson"`


**8A Food and nutrition**
- `8Aa` Nutrients
- `8Ab` Uses of nutrients
- `8Ac` Balanced diets
- `8Ad` Digestion
- `8Ae` Absorption

**8B Plants and their reproduction**
- `8Ba` Classification and biodiversity
- `8Bb` Types of reproduction
- `8Bc` Pollination
- `8Bd` Fertilisation and dispersal
- `8Be` Germination and growth

**8C Breathing and respiration**
- `8Ca` Aerobic respiration
- `8Cb` Gas exchange system
- `8Cc` Getting oxygen
- `8Cd` Comparing gas exchange
- `8Ce` Anaerobic respiration

**8D Unicellular organisms**
- `8Da` Unicellular or multicellular
- `8Db` Microscopic fungi
- `8Dc` Bacteria
- `8Dd` Protoctists
- `8De` Decomposers and carbon

**8E Combustion**
- `8Ea` Burning fuels
- `8Eb` Oxidation
- `8Ec` Fire safety
- `8Ed` Air pollution
- `8Ee` Global warming

**8F The periodic table**
- `8Fa` Dalton's atomic model
- `8Fb` Chemical properties
- `8Fc` Mendeleev's table
- `8Fd` Physical trends
- `8Fe` Chemical trends

**8G Metals and their uses**
- `8Ga` Metal properties
- `8Gb` Corrosion
- `8Gc` Metals and water
- `8Gd` Metals and acids
- `8Ge` Pure metals and alloys

**8H Rocks**
- `8Ha` Rocks and their uses
- `8Hb` Igneous and metamorphic rocks
- `8Hc` Weathering and erosion
- `8Hd` Sedimentary rocks
- `8He` Materials in the Earth

**8I Fluids**
- `8Ia` The particle model
- `8Ib` Changing state
- `8Ic` Pressure in fluids
- `8Id` Floating and sinking
- `8Ie` Drag

**8J Light**
- `8Ja` Light on the move
- `8Jb` Reflection
- `8Jc` Refraction
- `8Jd` Cameras and eyes
- `8Je` Colour

**8K Energy transfers**
- `8Ka` Temperature changes
- `8Kb` Transferring energy
- `8Kc` Controlling transfers
- `8Kd` Power and efficiency
- `8Ke` Paying for energy

**8L Earth and space**
- `8La` Gathering the evidence
- `8Lb` Seasons
- `8Lc` Magnetic Earth
- `8Ld` Gravity in space
- `8Le` Beyond the Solar System

### Pearson Exploring Science Year 9 — Pearson

`"qualification": "exploring-science-y9", "examBoard": "Pearson"`


**9A Genetics and evolution**
- `9Aa` Environmental variation
- `9Ab` Inherited variation
- `9Ac` DNA
- `9Ad` Genes and extinction
- `9Ae` Natural selection

**9B Plant growth**
- `9Ba` Reactions in plants
- `9Bb` Plant adaptations
- `9Bc` Plant products
- `9Bd` Growing crops
- `9Be` Farming problems

**9C Biology transition to further study**
- `9Ca` Diseases
- `9Cb` Control systems
- `9Cc` Testing medicines
- `9Cd` Ecology
- `9Ce` In and out

**9E Making materials**
- `9Ea` About ceramics
- `9Eb` Polymers
- `9Ec` Composite materials
- `9Ed` Problems with materials
- `9Ee` Recycling materials

**9F Reactivity**
- `9Fa` Types of explosion
- `9Fb` Reactivity
- `9Fc` Energy and reactions
- `9Fd` Displacement
- `9Fe` Extracting metals

**9G Chemistry transition to further study**
- `9Ga` Ions
- `9Gb` Energy transfers
- `9Gc` Rates of reaction
- `9Gd` Chemical equations
- `9Ge` Equilibria

**9I Forces and motion**
- `9Ia` Forces and movement
- `9Ic` Speed
- `9Id` Turning forces
- `9Ie` More machines

**9J Force fields and electromagnets**
- `9Ja` Force fields
- `9Jb` Static electricity
- `9Jc` Current electricity
- `9Jd` Resistance
- `9Je` Electromagnets

**9K Physics transition to further study**
- `9Ka` Differences
- `9Kb` Fields
- `9Kc` Cause and effect
- `9Kd` Links between variables
- `9Ke` Models

### IB Physics — IB

`"qualification": "ib-physics", "examBoard": "IB"`


**T1 Measurements and uncertainties**
- `1.1` Measurements in physics — SI units, significant figures, scientific notation
- `1.2` Uncertainties and errors — absolute, fractional and percentage uncertainty
- `1.3` Vectors and scalars — addition, subtraction and resolving components

**T2 Mechanics**
- `2.1` Motion — displacement, velocity, acceleration and kinematics equations
- `2.2` Forces — Newton's laws, free-body diagrams, friction
- `2.3` Work, energy and power — kinetic, gravitational, elastic potential energy
- `2.4` Momentum and impulse — conservation of momentum, collisions

**T3 Thermal physics**
- `3.1` Thermal concepts — temperature, internal energy, specific heat capacity
- `3.2` Modelling a gas — ideal gas law, Boltzmann model, pressure-volume relationships

**T4 Waves**
- `4.1` Oscillations — simple harmonic motion, period, amplitude, phase
- `4.2` Travelling waves — transverse, longitudinal, wave speed equation
- `4.3` Wave characteristics — intensity, superposition, polarisation
- `4.4` Wave behaviour — reflection, refraction, diffraction, Snell's law
- `4.5` Standing waves — nodes, antinodes, harmonics, resonance

**T5 Electricity and magnetism**
- `5.1` Electric fields — Coulomb's law, field lines, potential difference
- `5.2` Heating effect of electric currents — resistance, Ohm's law, power dissipation
- `5.3` Electric cells — EMF, internal resistance, terminal voltage
- `5.4` Magnetic effects — force on moving charges, motor effect, magnetic flux density

**T6 Circular motion and gravitation**
- `6.1` Circular motion — centripetal force and acceleration, angular velocity
- `6.2` Newton's law of gravitation — gravitational field strength, orbital mechanics

**T7 Atomic, nuclear and particle physics**
- `7.1` Discrete energy and radioactivity — alpha, beta, gamma, half-life, decay equations
- `7.2` Nuclear reactions — fission, fusion, mass defect, binding energy
- `7.3` The structure of matter — quarks, leptons, hadrons, the Standard Model

**T8 Energy production**
- `8.1` Energy sources — fossil fuels, nuclear, solar, wind, hydroelectric
- `8.2` Thermal energy transfer — conduction, convection, radiation, black-body radiation

**T9 Wave phenomena (HL)**
- `9.1` Simple harmonic motion — graphical and mathematical analysis
- `9.2` Single-slit diffraction — intensity patterns, minima positions
- `9.3` Interference — double-slit, thin films, path difference
- `9.4` Resolution — Rayleigh criterion, resolving power
- `9.5` Doppler effect — moving source and observer, applications

**T10 Fields (HL)**
- `10.1` Describing fields — gravitational, electric and magnetic field comparisons
- `10.2` Fields at work — potential, orbital energy, escape velocity, potential wells

**T11 Electromagnetic induction (HL)**
- `11.1` Electromagnetic induction — Faraday's and Lenz's law, induced EMF
- `11.2` Power generation and transmission — AC generators, transformers, RMS values
- `11.3` Capacitance — charge, voltage, energy stored, capacitors in circuits

**T12 Quantum and nuclear physics (HL)**
- `12.1` Interaction of matter with radiation — photoelectric effect, de Broglie, uncertainty principle
- `12.2` Nuclear physics — radioactive decay law, nuclear energy levels, fission and fusion calculations

### IB Chemistry — IB

`"qualification": "ib-chemistry", "examBoard": "IB"`


**T1 Stoichiometric relationships**
- `1.1` Introduction to the particulate nature of matter and chemical change
- `1.2` The mole concept — Avogadro's number, molar mass, mole calculations
- `1.3` Reacting masses and volumes — limiting reagents, yield, concentration

**T2 Atomic structure**
- `2.1` The nuclear atom — protons, neutrons, electrons, isotopes, mass spectrometry
- `2.2` Electron configuration — energy levels, sub-levels, orbitals, ionisation energy

**T3 Periodicity**
- `3.1` Periodic table — periods, groups, blocks, electron configuration trends
- `3.2` Periodic trends — atomic radius, ionisation energy, electronegativity, electron affinity

**T4 Chemical bonding and structure**
- `4.1` Ionic bonding and structure — lattice energy, properties of ionic compounds
- `4.2` Covalent bonding — Lewis structures, VSEPR, bond polarity
- `4.3` Covalent structures — giant covalent, allotropes of carbon, fullerenes
- `4.4` Intermolecular forces — London dispersion, dipole-dipole, hydrogen bonding
- `4.5` Metallic bonding — sea of electrons model, properties of metals

**T5 Energetics and thermochemistry**
- `5.1` Measuring energy changes — enthalpy, calorimetry, Hess's law
- `5.2` Hess's law and energy cycles — Born-Haber cycles (HL)
- `5.3` Bond enthalpies — bond breaking and forming, mean bond enthalpies

**T6 Chemical kinetics**
- `6.1` Collision theory — activation energy, Maxwell-Boltzmann distribution, factors affecting rate

**T7 Equilibrium**
- `7.1` Dynamic equilibrium — Le Chatelier's principle, Kc expression, equilibrium calculations

**T8 Acids and bases**
- `8.1` Theories of acids and bases — Brønsted-Lowry, conjugate pairs
- `8.2` Properties of acids and bases — reactions with metals, carbonates, bases
- `8.3` The pH scale — pOH, Kw, strong and weak acids/bases
- `8.4` Strong and weak acids/bases — Ka, Kb, degree of dissociation
- `8.5` Acid deposition — causes, consequences, solutions

**T9 Redox processes**
- `9.1` Oxidation and reduction — oxidation numbers, half-equations, balancing redox
- `9.2` Electrochemical cells — standard electrode potentials, electrolysis, Faraday's laws

**T10 Organic chemistry**
- `10.1` Fundamentals — homologous series, naming (IUPAC), structural isomers
- `10.2` Functional group chemistry — alkanes, alkenes, alcohols, halogenoalkanes, aldehydes, ketones, carboxylic acids, esters

**T11 Measurement and data processing**
- `11.1` Uncertainties and errors — systematic vs random, propagation of uncertainty
- `11.2` Graphical techniques — drawing, interpreting and linearising graphs
- `11.3` Spectroscopic identification — IR, mass spectrometry, NMR

**T12 Atomic structure (HL)**
- `12.1` Electrons in atoms — quantum numbers, Aufbau principle, exceptions to electron configuration

**T14 Chemical bonding and structure (HL)**
- `14.1` Further covalent bonding — formal charge, resonance, expanded octets, molecular orbital theory
- `14.2` Hybridisation — sp, sp², sp³ and bond angles

**T15 Energetics and thermochemistry (HL)**
- `15.1` Energy cycles — Born-Haber cycles, lattice enthalpies, electron affinity
- `15.2` Entropy and spontaneity — Gibbs free energy, ΔG = ΔH – TΔS

**T16 Chemical kinetics (HL)**
- `16.1` Rate expression and reaction mechanism — rate laws, order of reaction, rate-determining step
- `16.2` Activation energy — Arrhenius equation, graphical determination of Ea

**T17 Equilibrium (HL)**
- `17.1` Equilibrium law — Kc and Kp expressions, relationship between Kc and Kp

**T18 Acids and bases (HL)**
- `18.1` Lewis acids and bases — definition, examples, applications
- `18.2` Calculations involving acids and bases — buffer solutions, hydrolysis of salts
- `18.3` pH curves — titration curves, equivalence point, indicators

**T20 Organic chemistry (HL)**
- `20.1` Types of organic reactions — mechanisms: SN1, SN2, electrophilic addition
- `20.2` Synthetic routes — multi-step synthesis, retrosynthesis
- `20.3` Stereoisomerism — optical isomers, enantiomers, racemic mixtures

### IB Biology — IB

`"qualification": "ib-biology", "examBoard": "IB"`


**T1 Cell biology**
- `1.1` Introduction to cells — cell theory, prokaryotic vs eukaryotic, surface area to volume ratio
- `1.2` Ultrastructure of cells — organelles: nucleus, mitochondria, chloroplast, ER, Golgi
- `1.3` Membrane structure — fluid mosaic model, phospholipid bilayer
- `1.4` Membrane transport — diffusion, osmosis, active transport, endocytosis, exocytosis
- `1.5` The origin of cells — spontaneous generation debate, endosymbiotic theory
- `1.6` Cell division — mitosis, cytokinesis, cell cycle, cancer

**T2 Molecular biology**
- `2.1` Molecules to metabolism — anabolism, catabolism, metabolic reactions
- `2.2` Water — properties and significance (cohesion, solvent, thermal properties)
- `2.3` Carbohydrates and lipids — monosaccharides, polysaccharides, triglycerides, phospholipids
- `2.4` Proteins — amino acids, peptide bonds, primary–quaternary structure, fibrous vs globular
- `2.5` Enzymes — active site, induced fit, denaturation, inhibition, cofactors
- `2.6` Structure of DNA and RNA — nucleotides, double helix, antiparallel strands, base pairing
- `2.7` DNA replication, transcription and translation — semi-conservative replication, codons, ribosomes
- `2.8` Cell respiration — glycolysis, Krebs cycle, oxidative phosphorylation, ATP yield
- `2.9` Photosynthesis — light-dependent and light-independent reactions, limiting factors

**T3 Genetics**
- `3.1` Genes — alleles, genotype, phenotype, dominant and recessive
- `3.2` Chromosomes — karyotype, homologous chromosomes, sex determination
- `3.3` Meiosis — stages, crossing over, independent assortment, genetic variation
- `3.4` Inheritance — monohybrid, dihybrid, sex-linked, codominance, incomplete dominance
- `3.5` Genetic modification and biotechnology — PCR, gel electrophoresis, GMOs, CRISPR

**T4 Ecology**
- `4.1` Species, communities and ecosystems — abiotic and biotic factors, niches, succession
- `4.2` Energy flow — food chains, trophic levels, efficiency of energy transfer, pyramids
- `4.3` Carbon cycling — photosynthesis, respiration, decomposition, combustion, carbon sinks
- `4.4` Climate change — greenhouse gases, global warming, impact on biodiversity

**T5 Evolution and biodiversity**
- `5.1` Evidence for evolution — fossil record, comparative anatomy, molecular evidence
- `5.2` Natural selection — variation, selection pressure, adaptation, speciation
- `5.3` Classification of biodiversity — taxonomy, binomial nomenclature, domains, kingdoms
- `5.4` Cladistics — cladograms, derived characteristics, molecular phylogenetics

**T6 Human physiology**
- `6.1` Digestion and absorption — alimentary canal, enzymes, villi and microvilli, absorption
- `6.2` The blood system — heart, blood vessels, cardiac cycle, double circulation, clotting
- `6.3` Defence against infectious disease — skin, phagocytosis, lymphocytes, antibodies, vaccination
- `6.4` Gas exchange — alveoli, ventilation, haemoglobin, oxygen dissociation curve
- `6.5` Neurons and synapses — resting and action potential, synaptic transmission, drugs
- `6.6` Hormones, homeostasis and reproduction — insulin, glucagon, ADH, menstrual cycle, IVF

**T7 Nucleic acids (HL)**
- `7.1` DNA structure and replication — Meselson-Stahl experiment, DNA polymerase, Okazaki fragments
- `7.2` Transcription and gene expression — promoters, RNA polymerase, post-transcriptional modification
- `7.3` Translation — ribosomes, tRNA, polysomes, post-translational modification

**T8 Metabolism, cell respiration and photosynthesis (HL)**
- `8.1` Metabolism — enzyme inhibition, allosteric regulation, metabolic pathways
- `8.2` Cell respiration — detailed glycolysis, link reaction, Krebs cycle, chemiosmosis
- `8.3` Photosynthesis — light reactions, Calvin cycle, carbon fixation, C4 and CAM plants

**T9 Plant biology (HL)**
- `9.1` Transport in xylem — transpiration stream, cohesion-tension, factors affecting transpiration
- `9.2` Transport in phloem — source to sink, mass flow hypothesis
- `9.3` Growth in plants — auxins, phototropism, gravitropism, gibberellins
- `9.4` Reproduction in plants — flowers, pollination, fertilisation, seed and fruit development

**T10 Genetics and evolution (HL)**
- `10.1` Meiosis — chiasmata, non-disjunction, aneuploidy, chromosome mutations
- `10.2` Inheritance — chi-squared test, linkage, epistasis, polygenic inheritance
- `10.3` Gene pools and speciation — allele frequency, Hardy-Weinberg, isolation, allopatric speciation

**T11 Animal physiology (HL)**
- `11.1` Antibody production and vaccination — clonal selection, monoclonal antibodies, immunological memory
- `11.2` Movement — bones, joints, sarcomere, sliding filament theory, fast vs slow twitch muscle
- `11.3` The kidney and osmoregulation — nephron, filtration, reabsorption, loop of Henle, ADH
- `11.4` Sexual reproduction — gametogenesis, menstrual cycle, fertilisation, pregnancy, birth
