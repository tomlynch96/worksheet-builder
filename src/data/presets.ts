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
  {
    label: 'V = IR — Ohm\'s Law Practice',
    description: 'AQA Foundation — graduated calculation practice with no answer lines',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header',
          title: 'V = IR — Ohm\'s Law',
          topic: 'Physics — Electricity',
          examBoard: 'AQA', tier: 'foundation',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions',
          items: [
            'Show all your working for each calculation.',
            'Give units with every answer.',
            'You may use a calculator.',
          ],
        },
        {
          id: id(), type: 'information',
          heading: 'Equation',
          content: '<p><strong>V = I × R</strong></p><p>V = voltage (volts, V) &nbsp; I = current (amperes, A) &nbsp; R = resistance (ohms, Ω)</p>',
        },
        {
          id: id(), type: 'worked_example',
          title: 'Worked example',
          steps: [
            '<p>A resistor has a resistance of 8 Ω. A current of 3 A flows through it. Calculate the voltage across it.</p>',
            '<p>Write the equation: <em>V = I × R</em></p>',
            '<p>Substitute: V = 3 × 8</p>',
            '<p>Answer: <strong>V = 24 V</strong></p>',
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A current of 2 A flows through a resistor of 5 Ω. Calculate the voltage across the resistor.</p>',
          marks: 2, lines: 0, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>The voltage across a component is 18 V. The resistance is 6 Ω. Calculate the current flowing through it.</p>',
          marks: 2, lines: 0, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A current of 0.5 A flows through a component. The voltage across it is 12 V. Calculate the resistance of the component.</p>',
          marks: 2, lines: 0, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A resistor has a resistance of 2.2 kΩ. A current of 5 mA flows through it. Calculate the voltage. Give your answer in volts.</p>',
          marks: 3, lines: 0, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>Two resistors are connected in series. Resistor A has a resistance of 4 Ω and resistor B has a resistance of 6 Ω. The supply voltage is 20 V.</p>',
          marks: 4, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Calculate the total resistance of the circuit.</p>', marks: 1, lines: 0 },
            { id: id(), label: 'b', stem: '<p>Calculate the current flowing through the circuit.</p>', marks: 2, lines: 0 },
            { id: id(), label: 'c', stem: '<p>Calculate the voltage across resistor A.</p>', marks: 1, lines: 0 },
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A circuit has a supply voltage of 9 V. Three resistors are connected in series: 1 Ω, 2 Ω, and an unknown resistor R. The current in the circuit is 1.5 A. Calculate the resistance of R.</p>',
          marks: 4, lines: 0, parts: [],
        },
        {
          id: id(), type: 'question',
          stem: '<p>At 20 °C, a filament lamp has a resistance of 5 Ω and draws a current of 0.4 A. When switched on fully, the resistance rises to 50 Ω.</p>',
          marks: 4, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Calculate the voltage across the lamp at 20 °C.</p>', marks: 2, lines: 0 },
            { id: id(), label: 'b', stem: '<p>Calculate the current through the lamp at full operating resistance, assuming the same voltage.</p>', marks: 2, lines: 0 },
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>Explain why the current through a filament lamp does not double when the voltage across it is doubled. Use the equation V = IR in your answer.</p>',
          marks: 3, lines: 0, parts: [],
        },
      ],
    },
  },
  ...(() => {
    const rateTableId = id()
    return [{
      label: 'Rates of Reaction',
      description: 'AQA Higher — full-skills worksheet with data table, bar chart, cloze, order steps, and exam questions',
      worksheet: {
        id: id(),
        blocks: [
          {
            id: id(), type: 'header',
            title: 'Rates of Reaction',
            topic: 'Chemistry — Chemical Changes',
            examBoard: 'AQA', tier: 'higher',
            showName: true, showDate: true, showClass: true,
          },
          {
            id: id(), type: 'instructions',
            items: [
              'Answer all questions.',
              'Show working for all calculations.',
              'The marks for each question are shown in brackets.',
            ],
          },
          {
            id: id(), type: 'information',
            heading: 'Key concept — collision theory',
            content: '<p>A chemical reaction occurs when reacting particles collide with <strong>sufficient energy</strong> (the activation energy). The rate of reaction increases when collisions are more <strong>frequent</strong> or more <strong>energetic</strong>.</p><p>Rate of reaction = <strong>quantity of product formed ÷ time</strong> (or quantity of reactant used ÷ time)</p>',
          },
          {
            id: id(), type: 'multiple_choice',
            stem: '<p>Which change would <strong>not</strong> increase the rate of a reaction between marble chips and hydrochloric acid?</p>',
            marks: 1,
            options: [
              '<p>Increasing the temperature</p>',
              '<p>Using powdered marble instead of chips</p>',
              '<p>Using a more concentrated acid</p>',
              '<p>Using a larger volume of acid at the same concentration</p>',
            ],
            correctIndex: 3,
          },
          {
            id: id(), type: 'cloze',
            heading: 'Fill in the blanks using the words in the box.',
            text: 'Increasing the [temperature] gives particles more [kinetic] energy, so more collisions exceed the [activation] energy. Increasing the [concentration] of a solution means there are more particles in the same volume, so collisions are more [frequent].',
            showWordBank: true,
          },
          {
            id: id(), type: 'worked_example',
            title: 'Worked example — calculating rate of reaction',
            steps: [
              '<p>In an experiment, 48 cm³ of gas was collected in 120 seconds. Calculate the mean rate of reaction.</p>',
              '<p>Rate = quantity of product ÷ time</p>',
              '<p>Rate = 48 ÷ 120</p>',
              '<p>Rate = <strong>0.4 cm³/s</strong></p>',
            ],
          },
          {
            id: rateTableId,
            type: 'data',
            heading: 'Table 1: Effect of temperature on rate of reaction (marble chips + HCl)',
            columns: [
              { label: 'Temperature', unit: '°C' },
              { label: 'Time to collect 50 cm³ gas', unit: 's' },
            ],
            rows: [
              ['20', '240'],
              ['30', '120'],
              ['40', '60'],
              ['50', '30'],
              ['60', '15'],
            ],
            display: 'table',
            graph: {
              xCol: 0, yCol: 1,
              showXLabel: true, showYLabel: true,
              showXScale: true, showYScale: true,
              omitRows: [], fitType: 'none', linkedDataId: null,
            },
          },
          {
            id: id(),
            type: 'data',
            heading: 'Fig. 1: Effect of temperature on time taken',
            columns: [
              { label: 'Temperature', unit: '°C' },
              { label: 'Time to collect 50 cm³ gas', unit: 's' },
            ],
            rows: [],
            display: 'bar',
            graph: {
              xCol: 0, yCol: 1,
              showXLabel: true, showYLabel: true,
              showXScale: true, showYScale: true,
              omitRows: [], fitType: 'none', linkedDataId: rateTableId,
            },
          },
          {
            id: id(), type: 'question',
            stem: '<p>Use Table 1 and Fig. 1 to answer the following questions.</p>',
            marks: 7, lines: 0,
            parts: [
              { id: id(), label: 'a', stem: '<p>Describe the relationship between temperature and the time taken to collect 50 cm³ of gas.</p>', marks: 2, lines: 3 },
              { id: id(), label: 'b', stem: '<p>Calculate the mean rate of reaction (in cm³/s) at 40 °C.</p>', marks: 2, lines: 3 },
              { id: id(), label: 'c', stem: '<p>Explain, using collision theory, why the rate of reaction increases as temperature rises.</p>', marks: 3, lines: 5 },
            ],
          },
          {
            id: id(), type: 'match_them_up',
            heading: 'Match each factor to how it increases the rate of reaction.',
            items: [
              { id: id(), left: 'Higher temperature', right: 'Particles have more energy; more collisions exceed activation energy' },
              { id: id(), left: 'Higher concentration', right: 'More particles per unit volume; collisions are more frequent' },
              { id: id(), left: 'Smaller particle size', right: 'Greater surface area exposed; more collisions per second' },
              { id: id(), left: 'Adding a catalyst', right: 'Provides an alternative reaction pathway with lower activation energy' },
            ],
          },
          {
            id: id(), type: 'order_steps',
            heading: 'Number these steps 1 to 5 to describe how to carry out a fair test of how temperature affects the rate of reaction between marble chips and dilute hydrochloric acid.',
            steps: [
              'Place the flask in a water bath and wait for the temperature to stabilise.',
              'Add a measured mass of marble chips and immediately start the stopwatch.',
              'Record the volume of gas collected every 10 seconds until no more gas is produced.',
              'Repeat the experiment at four other temperatures, keeping all other variables the same.',
              'Set up a gas syringe connected to a conical flask containing dilute hydrochloric acid.',
            ],
          },
        ],
      },
    }]
  })(),
]
