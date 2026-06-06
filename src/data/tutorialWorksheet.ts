import type { Worksheet } from '../types/worksheet'

const b = (s: string) => `tutorial-${s}`

export const TUTORIAL_WORKSHEET: Worksheet = {
  id: 'tutorial-placeholder',
  blocks: [
    {
      id: b('header'),
      type: 'header',
      title: 'Example Worksheet — explore every block type',
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
        'Answer all questions.',
        'Write your answers in the spaces provided.',
        'The marks for each question are shown in brackets.',
        'Use of a calculator is allowed.',
      ],
    },
    {
      id: b('information'),
      type: 'information',
      heading: 'Key Facts — Forces and Motion',
      content:
        '<b>Newton\'s Second Law:</b> F = ma &nbsp;|&nbsp; ' +
        '<b>Momentum:</b> p = mv &nbsp;|&nbsp; ' +
        '<b>Weight:</b> W = mg (g = 9.8 m/s²)',
    },
    {
      id: b('worked-example'),
      type: 'worked_example',
      title: 'Worked Example — Calculating acceleration',
      steps: [
        'Identify the known quantities: F = 500 N, m = 250 kg',
        'Write the equation: a = F ÷ m',
        'Substitute values: a = 500 ÷ 250',
        'Calculate and state units: a = 2 m/s²',
      ],
    },
    {
      id: b('q1'),
      type: 'question',
      stem: 'A car of mass 1 200 kg accelerates from rest to 18 m/s in 9 s. Calculate the resultant force acting on the car.',
      marks: 2,
      lines: 4,
      parts: [],
      markScheme: 'a = 18 ÷ 9 = 2 m/s² (1) ; F = 1 200 × 2 = 2 400 N (1)',
    },
    {
      id: b('q2'),
      type: 'question',
      stem: 'A ball is thrown vertically upward.',
      marks: 6,
      lines: 0,
      parts: [
        {
          id: b('q2a'),
          label: 'a',
          stem: 'State the value of the acceleration of the ball at its highest point.',
          marks: 1,
          lines: 2,
          markScheme: '9.8 (or 10) m/s² downward (1)',
        },
        {
          id: b('q2b'),
          label: 'b',
          stem: 'The ball is thrown with an initial speed of 15 m/s. Calculate the maximum height reached. (g = 10 m/s²)',
          marks: 3,
          lines: 5,
          markScheme:
            'v² = u² + 2as → 0 = 225 − 20s (1) ; s = 225 ÷ 20 (1) ; s = 11.25 m (1)',
        },
        {
          id: b('q2c'),
          label: 'c',
          stem: 'Calculate the time taken for the ball to reach its maximum height.',
          marks: 2,
          lines: 4,
          markScheme: 'v = u + at → 0 = 15 − 10t (1) ; t = 1.5 s (1)',
        },
      ],
    },
    {
      id: b('mcq'),
      type: 'multiple_choice',
      stem: 'A resultant force of 20 N acts on a stationary object of mass 4 kg. What is its acceleration?',
      marks: 1,
      options: ['2 m/s²', '5 m/s²', '16 m/s²', '80 m/s²'],
      correctIndex: 1,
      markScheme: 'B — 5 m/s²: a = F ÷ m = 20 ÷ 4',
    },
    {
      id: b('cloze'),
      type: 'cloze',
      heading: 'Fill in the blanks using words from the word bank.',
      text:
        'When the forces acting on an object are [balanced], the object moves at [constant] ' +
        '[velocity] or remains [stationary]. A [resultant] force causes an object to [accelerate].',
      showWordBank: true,
    },
    {
      id: b('match'),
      type: 'match_them_up',
      heading: 'Match each quantity to its SI unit.',
      items: [
        { id: b('m1'), left: 'Force', right: 'Newton (N)' },
        { id: b('m2'), left: 'Momentum', right: 'kg m/s' },
        { id: b('m3'), left: 'Acceleration', right: 'm/s²' },
        { id: b('m4'), left: 'Mass', right: 'kilogram (kg)' },
      ],
    },
    {
      id: b('order'),
      type: 'order_steps',
      heading: 'Put these steps in the correct order to calculate stopping distance.',
      steps: [
        'Identify initial speed and reaction time.',
        'Calculate thinking distance: d = u × t_reaction.',
        'Calculate braking distance using v² = u² + 2as with v = 0.',
        'Add thinking distance and braking distance to find stopping distance.',
      ],
    },
    {
      id: b('figure'),
      type: 'figure',
      caption:
        'Figure 1: A velocity–time graph for a car journey. Use the graph to answer the questions that follow.',
      size: 'medium',
    },
    {
      id: b('spacer'),
      type: 'spacer',
      size: 'small',
    },
    {
      id: b('table'),
      type: 'data',
      heading: 'Table 1 — Results from a trolley experiment',
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
      hiddenCells: ['1,1', '2,1', '3,1', '4,1'],
    },
    {
      id: b('graph'),
      type: 'data',
      heading: 'Graph 1 — Force vs Acceleration (data from Table 1)',
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
      heading: 'Numerical Answers',
    },
  ],
}
