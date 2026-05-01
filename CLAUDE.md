# Worksheet Builder — Project Context

## The Problem

Teachers use AI daily to generate worksheets, but every session starts from zero. When a teacher improves an AI output — correcting a command word, adjusting difficulty, adding a worked example — that improvement disappears. The next teacher teaching the same topic repeats the same work independently. The collective professional wisdom of the teaching profession is being systematically wasted.

Existing platforms don't close the loop: TES is a static library, MagicSchool generates but doesn't learn, ChatGPT generates but forgets.

## The Product

A **free AI worksheet generation platform for secondary science teachers**, built around a native editing workspace. Teachers generate resources, refine them within the platform, and download print-ready PDFs. Output quality — spec-aligned, correctly formatted for paper, with mark schemes — must be demonstrably better than any existing tool from day one.

The critical difference is what happens inside the platform:
- Every **edit** a teacher makes is captured
- Every **comparison judgement** (which version would you actually print?) is recorded
- Every **post-use reflection** (how did it land with your class?) is stored
- Every **rationale** a teacher volunteers for a decision becomes part of a growing body of annotated professional knowledge

Teachers **tag resources against exam board specifications** as the price of free access. Tagging is low-friction: the system pre-populates from the prompt and asks for confirmation, not navigation.

## The Destination

Over time, generation becomes less important than retrieval. When a teacher requests a retrieval practice worksheet on electromagnetic waves for AQA higher tier Year 10, the system first searches the corpus for validated, teacher-refined resources on that exact topic. If a strong match exists — used, reflected on, improved by multiple teachers, rated highly — it returns that rather than generating fresh.

**AI generation is the cold-start mechanism. The destination is a self-improving resource bank where the best version of every worksheet rises to the surface through cumulative teacher judgement.**

## The Data Asset

Underneath the product sits something no publisher, exam board, or research institution currently has: a large-scale, naturalistic dataset of teacher pedagogical preferences, mapped to UK curriculum content, annotated with rationale, and validated through actual classroom efficacy signals.

## Tech Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **Styling**: CSS with custom properties (no CSS-in-JS)
- **State**: Start with React context/hooks; add Zustand if complexity warrants
- **Routing**: React Router
- **Backend**: To be determined — likely a Node/Express or serverless API
- **Database**: To be determined — PostgreSQL likely given relational data needs (resources, users, edits, tags, judgements)
- **PDF generation**: To be determined (Puppeteer, react-pdf, or similar)
- **AI**: Anthropic Claude API for worksheet generation

## Core Data Models

### Resource
The central entity. A worksheet or resource in a specific state.

```typescript
interface Resource {
  id: string
  title: string
  topicId: string           // curriculum node
  examBoard: ExamBoard      // AQA | OCR | Edexcel | WJEC
  tier: 'foundation' | 'higher'
  yearGroup: number         // 7-13
  resourceType: ResourceType // worksheet | mark_scheme | retrieval_practice | ...
  content: ResourceContent  // structured content blocks
  generationPrompt: string  // original prompt used to generate
  status: 'draft' | 'published' | 'archived'
  qualityScore: number      // computed from teacher judgements
  useCount: number
  createdAt: Date
  updatedAt: Date
  authorId: string
}
```

### Edit
Every change a teacher makes to a resource.

```typescript
interface Edit {
  id: string
  resourceId: string
  userId: string
  diff: ContentDiff          // before/after at block level
  rationale?: string         // optional teacher-volunteered reason
  createdAt: Date
}
```

### ComparisonJudgement
Pairwise comparisons between resource versions — the core signal for quality ranking.

```typescript
interface ComparisonJudgement {
  id: string
  userId: string
  resourceAId: string
  resourceBId: string
  winnerId: string           // which they would actually print
  context?: string           // teacher's class context
  createdAt: Date
}
```

### PostUseReflection
Classroom efficacy signal — the most valuable data point.

```typescript
interface PostUseReflection {
  id: string
  resourceId: string
  userId: string
  usedWith: { yearGroup: number; ability: string }
  rating: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: Date
}
```

### CurriculumNode
The taxonomy that organises everything.

```typescript
interface CurriculumNode {
  id: string
  subject: 'biology' | 'chemistry' | 'physics' | 'combined_science'
  topic: string              // e.g. "Electromagnetic waves"
  subtopic?: string
  examBoard: ExamBoard
  tier: 'foundation' | 'higher' | 'both'
  specReference: string      // e.g. "AQA-P4.3.2"
}
```

## Key Product Principles

1. **Quality over quantity** — one excellent output beats ten mediocre ones. Every design decision should serve output quality first.
2. **Capture signal passively where possible** — don't ask teachers for data they wouldn't naturally provide. Edits are captured automatically; rationale is invited, never required.
3. **Low-friction tagging** — pre-populate from context, ask for confirmation. Never make teachers navigate a taxonomy.
4. **Print-first formatting** — all generated content must be designed for A4 paper, not a screen. Line lengths, font sizes, and question spacing must work when printed.
5. **Spec fidelity** — command words, assessment objectives, and mark scheme formats must match the target exam board exactly.

## Development Priorities

1. **Core generation flow** — prompt → AI output → display in editor → PDF download
2. **Native editor** — in-platform editing with change capture (not export-then-edit)
3. **Spec tagging** — exam board / topic / tier confirmation after generation
4. **Comparison UI** — side-by-side version comparison with preference capture
5. **Search/retrieval** — before generation, check the corpus for existing validated resources
6. **Post-use reflection** — lightweight prompt after a teacher has used a resource

## What We Are Not Building (Yet)

- Multi-subject support (science only to start)
- Student-facing features
- Collaboration/sharing between teachers beyond the corpus
- Mobile-first layout (teachers print at a desk)
- Gamification or engagement mechanics
