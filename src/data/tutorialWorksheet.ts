import type { Worksheet } from '../types/worksheet'

const b = (s: string) => `tutorial-${s}`

export const TUTORIAL_WORKSHEET: Worksheet = {
  id: 'tutorial-placeholder',
  blocks: [
    {
      id: b('header'),
      type: 'header',
      title: 'Tutorial Sheet — explore the editor',
      topic: 'Forces and Motion',
      examBoard: 'AQA',
      tier: 'higher',
      showName: true,
      showDate: true,
      showClass: true,
    },
    {
      id: b('instructions'),
      type: 'instructions',
      items: [
        'This is an Instructions block — list anything students need to know before starting.',
        'Click any block in the left panel to edit its content.',
        'Drag blocks up or down in the left panel to reorder them.',
        'Use the + button at the bottom of the left panel to add new blocks.',
      ],
    },
    {
      id: b('information'),
      type: 'information',
      heading: 'Information block',
      content:
        'Use this block to display a key-facts box, a formula sheet, or any reference ' +
        'material students should read before attempting the questions. ' +
        'The heading and body are both editable — <b>bold</b> and <i>italic</i> HTML is supported.',
    },
    {
      id: b('worked-example'),
      type: 'worked_example',
      title: 'Worked Example block',
      steps: [
        'Use this block to show students a model answer before they attempt similar questions.',
        'Each line here is a separate step — add as many as you need.',
        'Steps are numbered automatically when the worksheet is printed.',
        'Click this block in the left panel to edit the title and steps.',
      ],
    },
    {
      id: b('q1'),
      type: 'question',
      stem: 'This is a Question block. Use it for a single written question with answer lines. Set the number of marks and optional mark scheme using the panel on the left. This example is worth 2 marks with 4 answer lines.',
      marks: 2,
      lines: 4,
      parts: [],
      markScheme: 'The mark scheme appears here — visible in Mark Scheme view and when printing.',
    },
    {
      id: b('q2'),
      type: 'question',
      stem: 'This Question block has multiple parts — useful for structured questions worth higher marks. Each part has its own stem, marks, and answer lines. This question is also linked to Graph 1 below: drag any data block onto a question in the editor to attach it.',
      marks: 6,
      lines: 0,
      attachedDataId: b('graph'),
      parts: [
        {
          id: b('q2a'),
          label: 'a',
          stem: 'Part (a) — add a short sub-question here. This part is worth 1 mark with 2 answer lines.',
          marks: 1,
          lines: 2,
          markScheme: 'Part mark scheme goes here.',
        },
        {
          id: b('q2b'),
          label: 'b',
          stem: 'Part (b) — longer sub-questions get more lines. Use this for calculation or extended writing questions.',
          marks: 3,
          lines: 5,
          markScheme: 'Award marks for each correct step shown.',
        },
        {
          id: b('q2c'),
          label: 'c',
          stem: 'Part (c) — add as many parts as you need. Labels (a, b, c…) are set automatically.',
          marks: 2,
          lines: 4,
          markScheme: 'Accept any two correct points.',
        },
      ],
    },
    {
      id: b('mcq'),
      type: 'multiple_choice',
      stem: 'This is a Multiple Choice block. Write the question stem here, then add up to four options below. Mark the correct answer using the editor — it shows in the mark scheme view but is hidden on the student worksheet.',
      marks: 1,
      options: [
        'Option A — click the left panel to edit these',
        'Option B — tick the correct answer in the editor',
        'Option C — up to four options are supported',
        'Option D — the correct answer is hidden from students',
      ],
      correctIndex: 1,
      markScheme: 'B (1)',
    },
    {
      id: b('cloze'),
      type: 'cloze',
      heading: 'Fill in the Blanks block — wrap any word in [square brackets] to turn it into a blank.',
      text:
        'Students see a [sentence] with key words removed and replaced by [blank] spaces. ' +
        'Toggle the [word bank] on or off using the editor — when on, all the missing words ' +
        'appear in a [shuffled] list beneath the passage.',
      showWordBank: true,
    },
    {
      id: b('match'),
      type: 'match_them_up',
      heading: 'Match Them Up block — students draw lines connecting each item on the left to its pair on the right.',
      items: [
        { id: b('m1'), left: 'Question block', right: 'Written question with answer lines' },
        { id: b('m2'), left: 'Information block', right: 'Key-facts reference box' },
        { id: b('m3'), left: 'Cloze block', right: 'Fill-in-the-blanks passage' },
        { id: b('m4'), left: 'Data block', right: 'Table or graph of results' },
      ],
    },
    {
      id: b('order'),
      type: 'order_steps',
      heading: 'Order Steps block — students arrange these shuffled steps into the correct sequence.',
      steps: [
        'Steps are displayed in a random order on the printed worksheet.',
        'Students number them or cut and rearrange them.',
        'Add as many steps as you need using the editor panel on the left.',
        'This block works well for experimental methods or calculation procedures.',
      ],
    },
    {
      id: b('figure'),
      type: 'figure',
      caption: 'Figure block — upload an image or paste a URL in the editor. This Oak diagram is shown as an example. Attach a figure to a question by dragging it onto the question block.',
      size: 'medium',
      imageUrl: 'https://placehold.co/600x280/eef2ff/4f46e5?text=Upload+an+image+or+paste+a+URL',
    },
    {
      id: b('spacer'),
      type: 'spacer',
      size: 'small',
    },
    {
      id: b('table'),
      type: 'data',
      heading: 'Data block (table view) — enter results in the table. Tick cells as "hidden" to create gaps students must fill in from an experiment.',
      columns: [
        { label: 'Force applied', unit: 'N' },
        { label: 'Acceleration', unit: 'm/s²' },
        { label: 'Mass of trolley', unit: 'kg' },
      ],
      rows: [
        ['2', '1.0', '2'],
        ['4', '2.0', '2'],
        ['6', '3.0', '2'],
        ['8', '4.0', '2'],
      ],
      display: 'table',
      graph: {
        xCol: 0,
        yCol: 1,
        showXLabel: true,
        showYLabel: true,
        showXScale: true,
        showYScale: true,
        omitRows: [],
        fitType: 'linear',
        showFitLine: true,
        linkedDataId: null,
      },
      hiddenCells: ['2,1', '3,1', '4,1'],
    },
    {
      id: b('graph'),
      type: 'data',
      heading: 'Data block (graph view) — switch a data block to graph mode to plot the results automatically. Link it to a table block to share the same data. This graph is attached to the multi-part question above.',
      columns: [],
      rows: [],
      display: 'graph',
      graph: {
        xCol: 0,
        yCol: 1,
        showXLabel: true,
        showYLabel: true,
        showXScale: true,
        showYScale: true,
        omitRows: [],
        fitType: 'linear',
        showFitLine: true,
        linkedDataId: b('table'),
      },
    },
    {
      id: b('numerical'),
      type: 'numerical_answers',
      heading: 'Numerical Answers block — lists all questions that have a numerical answer set, shown at the end of the worksheet for quick self-marking.',
    },
  ],
}
