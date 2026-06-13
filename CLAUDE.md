# The Worksheet Project — Project Context

## The Problem

Teachers use AI daily to generate worksheets, but every session starts from zero. When a teacher improves an AI output — correcting a command word, adjusting difficulty, adding a worked example — that improvement disappears. The next teacher teaching the same topic repeats the same work independently. The collective professional wisdom of the teaching profession is being systematically wasted.

Existing platforms don't close the loop: TES is a static library, MagicSchool generates but doesn't learn, ChatGPT generates but forgets.

## The Core Philosophy

**This platform backs paper.** Students should work on paper, not screens. One-to-one devices in schools are not the right model; students being online at home creates cheating shortcuts (AI homework, copy-paste) that undermine genuine learning. The platform's job is to make systematic, paper-based teaching so low-friction that it becomes the path of least resistance.

Good teaching is systematic, not spontaneous:
- **Curriculum sequenced ahead of time** — what gets taught when is planned, not improvised
- **Retrieval built in at planned intervals** — spaced repetition is structural, not left to chance
- **Comprehension verified at regular checkpoints** — students are motivated to engage because they know checks are coming

AI is the cold-start mechanism. The destination is a corpus so good that AI generation becomes unnecessary — teachers just retrieve the best version of what they need, already validated by colleagues.

## The Three Pillars

### 1. Schemes of Work
Teachers plan their curriculum sequence ahead of time — which topics are taught in which weeks across the academic year. The scheme is the spine of the system. Everything else (recall timing, test generation, corpus quality) hangs off knowing what a class studied in week N.

### 2. Spaced Retrieval (Recall Check-ins)
The scheme drives automatic recall timing. When generating a recall check-in for week 18, the system knows exactly which worksheets were taught in prior weeks and applies spaced repetition logic — worksheets not recently recalled get priority, questions rotate so students don't see the same opener every time. Teachers don't have to remember to space things; the calendar makes it automatic.

### 3. Personalised MC Tests (future)
The verification layer. A test generated from the last N weeks of the scheme, with:
- Questions drawn from spec-aligned worksheet content
- Shuffled question order and shuffled options per student → different answer keys per student → structural cheating prevention
- Auto-markable because the system holds each student's key
This creates a low-effort checkpoint that motivates students to engage with paper work, because they know they'll be tested on it.

## The Confidence Scoring Model

Not all content in the corpus is equal. A confidence score per worksheet (and ultimately per question) is built from:

**Edit signal** — did the teacher edit the AI output before using it? Zero edits is a *negative* signal. A good teacher won't accept AI output uncritically. Edited worksheets score higher than untouched ones.

**Classroom verification** — when a teacher downloads or prints a worksheet, a prompt asks "when are you planning to use this?" with a 7-day date picker (or "not sure"). After that date, a deferred prompt fires: "how did this go with your class?" A positive response strengthens the score; a negative one (wrong content, errors found) dampens it. This is the strongest signal in the system because it's post-use, real-world feedback.

**Corpus visibility** — confidence scores must be visible to other teachers browsing the library. "Classroom verified by 4 teachers" vs "AI-generated, unedited, never used" is the difference between a confident choice and a gamble. The score has to drive browsing behaviour, not just sit in a database.

**Question-level confidence (long term)** — the same question appearing across multiple worksheets, consistently receiving positive classroom signals, rises independently of the worksheet it started in. The real corpus is a library of *questions* with confidence scores, not just documents.

## The Destination

Over time, generation becomes less important than retrieval. When a teacher requests a retrieval practice worksheet on electromagnetic waves for AQA higher tier Year 10, the system first searches the corpus for validated, teacher-refined resources on that exact topic. If a strong match exists — used, reflected on, improved by multiple teachers, rated highly — it returns that rather than generating fresh.

**AI generation is the cold-start mechanism. The destination is a self-improving resource bank where the best version of every worksheet rises to the surface through cumulative teacher judgement.**

## The Data Asset

Underneath the product sits something no publisher, exam board, or research institution currently has: a large-scale, naturalistic dataset of teacher pedagogical preferences, mapped to UK curriculum content, annotated with rationale, and validated through actual classroom efficacy signals.

The spec-alignment tagging is the interoperability layer. Every piece of content is tagged to the same curriculum taxonomy (e.g. AQA-P4.3.2). This makes the corpus queryable, rankable, and — critically — mergeable with external content.

## Partnership Vision (Long Term)

**Inbound — seeding the corpus**
Publishers (Kerboodle, Seneca, Tassomai, Isaac Physics, etc.) have years of high-quality, spec-aligned questions with worked examples. Data-sharing agreements or API integrations can ingest this content directly. Imported content from proven sources should initialise with a higher confidence baseline than freshly AI-generated content. The taxonomy alignment (both sides tagged to the same spec references) is what makes this tractable — it's just a JOIN.

**Outbound — paper-ifying online platforms**
Online learning platforms have content trapped on screens. "Export to The Worksheet Project" becomes a feature they can offer their paying customers — teachers who want to take Seneca content into a paper-based lesson. The platform provides formatting, print layout, and mark scheme structure. In the embedded form, our tools sit inside their platform as a service — making their product more appealing without them having to build any of it. This is the infrastructure play: become the paper layer that EdTech companies depend on rather than competing with them.

## Tech Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **Styling**: CSS with custom properties (no CSS-in-JS)
- **State**: React context/hooks; add Zustand if complexity warrants
- **Routing**: React Router
- **Backend**: Supabase (Postgres + Auth + RLS + Edge Functions)
- **PDF generation**: Browser print via CSS (print stylesheets)
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
The taxonomy that organises everything — the interoperability layer for both internal ranking and external partnerships.

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

1. **Paper first** — every design decision should serve print. Line lengths, font sizes, question spacing must work on A4. Screen layout is secondary.
2. **Edit signal matters** — unedited AI output is lower quality than teacher-touched output. Build systems that reward refinement.
3. **Capture signal passively** — edits captured automatically; classroom verification invited at the natural moment (download/print), not randomly.
4. **Low-friction tagging** — pre-populate from context, ask for confirmation. Never make teachers navigate a taxonomy.
5. **Spec fidelity** — command words, assessment objectives, and mark scheme formats must match the target exam board exactly.
6. **Systematic over spontaneous** — features should reinforce planned, sequenced teaching rather than one-off generation.

## Development Priorities

1. ~~Core generation flow~~ ✓
2. ~~Native editor with change capture~~ ✓
3. ~~Spec tagging~~ ✓
4. ~~Public library / corpus browsing~~ ✓
5. ~~Schemes of work with calendar~~ ✓ (in progress)
6. ~~Spaced recall check-ins~~ ✓ (in progress)
7. **Confidence scoring** — edit signal + classroom verification prompt + deferred post-use reflection
8. **Personalised MC test generator** — from scheme weeks, shuffled per student, auto-markable key
9. **Comparison UI** — side-by-side version comparison with preference capture
10. **Partnership API** — inbound content ingestion and outbound export/embed

## What We Are Not Building (Yet)

- Multi-subject support (science only to start)
- Student-facing features
- Mobile-first layout (teachers print at a desk)
- Gamification or engagement mechanics
- Personalised MC tests (designed, not yet built)
