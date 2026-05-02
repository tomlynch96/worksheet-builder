import type { Worksheet } from '../types/worksheet'

function id() { return crypto.randomUUID() }

export interface Preset {
  label: string
  description: string
  worksheet: Worksheet
}

export const PRESETS: Preset[] = [
  {
    label: 'Electromagnetic Waves',
    description: 'AQA Higher — retrieval practice with questions, cloze, and match activity',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header',
          title: 'Electromagnetic Waves',
          topic: 'Physics — Waves',
          examBoard: 'AQA', tier: 'higher',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions',
          items: [
            'Answer all questions.',
            'Write your answers in the spaces provided.',
            'The marks for each question are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information',
          heading: 'Key facts',
          content: '<p>All electromagnetic waves travel at <strong>3 × 10<sup>8</sup> m/s</strong> in a vacuum. They are transverse waves and transfer energy without transferring matter.</p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>State <strong>two</strong> properties shared by all electromagnetic waves.</p>',
          marks: 2, lines: 4, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A radio wave has a frequency of 100 MHz. Calculate its wavelength. Use the equation <em>v = fλ</em>.</p>',
          marks: 3, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Write down the values you know.</p>', marks: 1, lines: 2 },
            { id: id(), label: 'b', stem: '<p>Calculate the wavelength. Give your answer in metres.</p>', marks: 2, lines: 3 },
          ],
        },
        {
          id: id(), type: 'multiple_choice',
          stem: '<p>Which part of the electromagnetic spectrum has the <strong>highest frequency</strong>?</p>',
          marks: 1,
          options: ['<p>Radio waves</p>', '<p>Visible light</p>', '<p>X-rays</p>', '<p>Gamma rays</p>'],
          correctIndex: 3,
        },
        {
          id: id(), type: 'cloze',
          heading: 'Fill in the blanks using the words in the box.',
          text: 'The [wavelength] of a wave is the distance between two peaks. The [frequency] is the number of waves passing a point per second. Waves with a higher frequency have a [shorter] wavelength.',
          showWordBank: true,
        },
        {
          id: id(), type: 'match_them_up',
          heading: 'Match each type of electromagnetic wave to one of its uses.',
          items: [
            { id: id(), left: 'Radio waves', right: 'Broadcasting and communication' },
            { id: id(), left: 'Microwaves', right: 'Satellite communication and cooking' },
            { id: id(), left: 'Infrared', right: 'Thermal imaging cameras' },
            { id: id(), left: 'Ultraviolet', right: 'Sterilising medical equipment' },
            { id: id(), left: 'X-rays', right: 'Medical imaging of bones' },
            { id: id(), left: 'Gamma rays', right: 'Treating cancer' },
          ],
        },
      ],
    },
  },
  {
    label: 'Atomic Structure',
    description: 'AQA Higher — worked example, order the steps, and exam questions',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header',
          title: 'Atomic Structure',
          topic: 'Chemistry — Atomic Structure and the Periodic Table',
          examBoard: 'AQA', tier: 'higher',
          showName: true, showDate: true, showClass: false,
        },
        {
          id: id(), type: 'instructions',
          items: ['Answer all questions.', 'Show your working where required.'],
        },
        {
          id: id(), type: 'information',
          heading: 'Key information',
          content: '<p>An atom contains <strong>protons</strong> and <strong>neutrons</strong> in the nucleus, and <strong>electrons</strong> in shells around the nucleus. The atomic number equals the number of protons. The mass number equals protons + neutrons.</p>',
        },
        {
          id: id(), type: 'worked_example',
          title: 'Worked example — finding the number of neutrons',
          steps: [
            '<p>Identify the <strong>mass number</strong> (top number) and <strong>atomic number</strong> (bottom number) from the periodic table.</p>',
            '<p>Use the equation: <em>neutrons = mass number − atomic number</em></p>',
            '<p>For sodium (<strong>Na</strong>): mass number = 23, atomic number = 11</p>',
            '<p>Neutrons = 23 − 11 = <strong>12</strong></p>',
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>An atom of calcium has the symbol <sup>40</sup>Ca. State the number of protons, neutrons, and electrons.</p>',
          marks: 3, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Number of protons</p>', marks: 1, lines: 2 },
            { id: id(), label: 'b', stem: '<p>Number of neutrons</p>', marks: 1, lines: 2 },
            { id: id(), label: 'c', stem: '<p>Number of electrons</p>', marks: 1, lines: 2 },
          ],
        },
        {
          id: id(), type: 'order_steps',
          heading: 'Number these steps 1 to 5 to show the correct order of the development of the atomic model.',
          steps: [
            'Thomson discovers the electron and proposes the plum pudding model.',
            'Dalton proposes that all matter is made of indivisible atoms.',
            'Bohr refines the model by placing electrons in fixed energy levels.',
            'Rutherford discovers the nucleus using the gold foil experiment.',
            'Chadwick discovers the neutron.',
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>Explain why Rutherford\'s gold foil experiment led to the nuclear model replacing the plum pudding model.</p>',
          marks: 4, lines: 6, parts: [],
        },
      ],
    },
  },
  {
    label: 'Forces and Motion',
    description: 'AQA Foundation — calculation questions with mark scheme structure',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header',
          title: 'Forces and Motion',
          topic: 'Physics — Forces',
          examBoard: 'AQA', tier: 'foundation',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions',
          items: [
            'Answer all questions.',
            'You may use a calculator.',
            'Equations are given where needed.',
          ],
        },
        {
          id: id(), type: 'information',
          heading: 'Equations you will need',
          content: '<p><strong>Force:</strong> F = ma (force = mass × acceleration)<br/><strong>Weight:</strong> W = mg (weight = mass × gravitational field strength)<br/><strong>Acceleration:</strong> a = (v − u) / t</p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds.</p>',
          marks: 5, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Calculate the acceleration of the car.</p>', marks: 2, lines: 3 },
            { id: id(), label: 'b', stem: '<p>Calculate the resultant force acting on the car.</p>', marks: 2, lines: 3 },
            { id: id(), label: 'c', stem: '<p>State one assumption you made in part (b).</p>', marks: 1, lines: 2 },
          ],
        },
        {
          id: id(), type: 'multiple_choice',
          stem: '<p>A 5 kg object is dropped near the surface of the Earth (g = 10 N/kg). What is its weight?</p>',
          marks: 1,
          options: ['<p>5 N</p>', '<p>10 N</p>', '<p>50 N</p>', '<p>500 N</p>'],
          correctIndex: 2,
        },
        {
          id: id(), type: 'question',
          stem: '<p>Describe the motion of an object when the resultant force acting on it is zero.</p>',
          marks: 2, lines: 4, parts: [],
        },
        {
          id: id(), type: 'worked_example',
          title: 'Worked example — calculating acceleration',
          steps: [
            '<p>Write down the equation: <em>a = (v − u) / t</em></p>',
            '<p>Substitute values: a = (20 − 0) / 8</p>',
            '<p>Calculate: a = 20 / 8 = <strong>2.5 m/s²</strong></p>',
          ],
        },
        {
          id: id(), type: 'match_them_up',
          heading: 'Match each term to its correct definition.',
          items: [
            { id: id(), left: 'Mass', right: 'The amount of matter in an object (kg)' },
            { id: id(), left: 'Weight', right: 'The gravitational force on an object (N)' },
            { id: id(), left: 'Acceleration', right: 'The rate of change of velocity (m/s²)' },
            { id: id(), left: 'Resultant force', right: 'The single force that replaces all forces acting' },
          ],
        },
      ],
    },
  },
]
