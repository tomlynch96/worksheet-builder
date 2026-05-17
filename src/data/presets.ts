import type { Worksheet } from '../types/worksheet'

function id() { return crypto.randomUUID() }

const _rateTableId = id()
const _springTableId = id()
const _springGraphId = id()
const _photoNAId = id()
const _waveDataId = id()
const _respNAId = id()

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
          markScheme: '<p>Award <strong>1 mark</strong> for each of any two from:</p><p>• They all travel at 3 × 10<sup>8</sup> m/s in a vacuum / the speed of light</p><p>• They are all transverse waves</p><p>• They all transfer energy without transferring matter</p><p>• They can all travel through a vacuum</p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>A radio wave has a frequency of 100 MHz. Calculate its wavelength. Use the equation <em>v = fλ</em>.</p>',
          marks: 3, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Write down the values you know.</p>', marks: 1, lines: 2, markScheme: '<p>v = 3 × 10<sup>8</sup> m/s; f = 100 MHz = 1 × 10<sup>8</sup> Hz <strong>[1]</strong></p>' },
            { id: id(), label: 'b', stem: '<p>Calculate the wavelength. Give your answer in metres.</p>', marks: 2, lines: 3, markScheme: '<p>Rearrange: λ = v ÷ f <strong>[1]</strong></p><p>λ = 3 × 10<sup>8</sup> ÷ 1 × 10<sup>8</sup> = <strong>3 m</strong> <strong>[1]</strong></p>' },
          ],
        },
        {
          id: id(), type: 'multiple_choice',
          stem: '<p>Which part of the electromagnetic spectrum has the <strong>highest frequency</strong>?</p>',
          marks: 1,
          options: ['<p>Radio waves</p>', '<p>Visible light</p>', '<p>X-rays</p>', '<p>Gamma rays</p>'],
          correctIndex: 3,
          markScheme: '<p><strong>D — Gamma rays</strong></p><p>The EM spectrum in order of increasing frequency: radio → microwave → infrared → visible → ultraviolet → X-rays → gamma rays. Gamma rays have the highest frequency (and shortest wavelength).</p>',
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
            { id: id(), label: 'a', stem: '<p>Number of protons</p>', marks: 1, lines: 2, markScheme: '<p>20 protons <strong>[1]</strong> — equal to the atomic number of calcium</p>' },
            { id: id(), label: 'b', stem: '<p>Number of neutrons</p>', marks: 1, lines: 2, markScheme: '<p>20 neutrons <strong>[1]</strong> — mass number (40) − atomic number (20) = 20</p>' },
            { id: id(), label: 'c', stem: '<p>Number of electrons</p>', marks: 1, lines: 2, markScheme: '<p>20 electrons <strong>[1]</strong> — equal to the number of protons in a neutral atom</p>' },
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
          markScheme: '<p>Award <strong>1 mark</strong> for each of four from:</p><p>• The plum pudding model predicted that alpha particles would pass through with little/no deflection</p><p>• Most alpha particles did pass straight through (consistent with atom being mostly empty space) <strong>[1]</strong></p><p>• Some particles were deflected at large angles and a small number bounced straight back <strong>[1]</strong></p><p>• This could not be explained by the plum pudding model / positive charge spread throughout <strong>[1]</strong></p><p>• The results showed that positive charge and mass are concentrated in a small, dense nucleus <strong>[1]</strong></p><p><em>(QWC: credit logical sequence of ideas)</em></p>',
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
            { id: id(), label: 'a', stem: '<p>Calculate the acceleration of the car.</p>', marks: 2, lines: 3, markScheme: '<p>a = (v − u) ÷ t <strong>[1]</strong></p><p>a = (20 − 0) ÷ 8 = <strong>2.5 m/s²</strong> <strong>[1]</strong></p>' },
            { id: id(), label: 'b', stem: '<p>Calculate the resultant force acting on the car.</p>', marks: 2, lines: 3, markScheme: '<p>F = ma = 1200 × 2.5 <strong>[1]</strong></p><p>F = <strong>3000 N</strong> <strong>[1]</strong></p>' },
            { id: id(), label: 'c', stem: '<p>State one assumption you made in part (b).</p>', marks: 1, lines: 2, markScheme: '<p>Any one from: no friction / no air resistance / the acceleration is uniform / road is flat <strong>[1]</strong></p>' },
          ],
        },
        {
          id: id(), type: 'multiple_choice',
          stem: '<p>A 5 kg object is dropped near the surface of the Earth (g = 10 N/kg). What is its weight?</p>',
          marks: 1,
          options: ['<p>5 N</p>', '<p>10 N</p>', '<p>50 N</p>', '<p>500 N</p>'],
          correctIndex: 2,
          markScheme: '<p><strong>C — 50 N</strong></p><p>W = mg = 5 × 10 = <strong>50 N</strong></p><p>Common error: confusing mass (5 kg) with weight, or using g = 9.8 N/kg (accept 49 N in extended questions).</p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>Describe the motion of an object when the resultant force acting on it is zero.</p>',
          marks: 2, lines: 4, parts: [],
          markScheme: '<p>Award <strong>1 mark</strong> for each of two from:</p><p>• The object remains stationary (if already at rest) <strong>[1]</strong></p><p>• OR continues to move at constant velocity / constant speed in a straight line (if already moving) <strong>[1]</strong></p><p>• There is no change in speed or direction <strong>[1]</strong></p><p><em>Accept reference to Newton\'s First Law.</em></p>',
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
          markScheme: '<p>V = I × R <strong>[1]</strong></p><p>V = 2 × 5 = <strong>10 V</strong> <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>The voltage across a component is 18 V. The resistance is 6 Ω. Calculate the current flowing through it.</p>',
          marks: 2, lines: 0, parts: [],
          markScheme: '<p>Rearrange: I = V ÷ R <strong>[1]</strong></p><p>I = 18 ÷ 6 = <strong>3 A</strong> <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>A current of 0.5 A flows through a component. The voltage across it is 12 V. Calculate the resistance of the component.</p>',
          marks: 2, lines: 0, parts: [],
          markScheme: '<p>Rearrange: R = V ÷ I <strong>[1]</strong></p><p>R = 12 ÷ 0.5 = <strong>24 Ω</strong> <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>A resistor has a resistance of 2.2 kΩ. A current of 5 mA flows through it. Calculate the voltage. Give your answer in volts.</p>',
          marks: 3, lines: 0, parts: [],
          markScheme: '<p>Convert units: R = 2.2 kΩ = 2200 Ω; I = 5 mA = 0.005 A <strong>[1]</strong></p><p>V = I × R = 0.005 × 2200 <strong>[1]</strong></p><p>V = <strong>11 V</strong> <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>Two resistors are connected in series. Resistor A has a resistance of 4 Ω and resistor B has a resistance of 6 Ω. The supply voltage is 20 V.</p>',
          marks: 4, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Calculate the total resistance of the circuit.</p>', marks: 1, lines: 0, markScheme: '<p>R<sub>total</sub> = 4 + 6 = <strong>10 Ω</strong> <strong>[1]</strong></p>' },
            { id: id(), label: 'b', stem: '<p>Calculate the current flowing through the circuit.</p>', marks: 2, lines: 0, markScheme: '<p>I = V ÷ R = 20 ÷ 10 <strong>[1]</strong> = <strong>2 A</strong> <strong>[1]</strong></p>' },
            { id: id(), label: 'c', stem: '<p>Calculate the voltage across resistor A.</p>', marks: 1, lines: 0, markScheme: '<p>V<sub>A</sub> = I × R<sub>A</sub> = 2 × 4 = <strong>8 V</strong> <strong>[1]</strong></p>' },
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>A circuit has a supply voltage of 9 V. Three resistors are connected in series: 1 Ω, 2 Ω, and an unknown resistor R. The current in the circuit is 1.5 A. Calculate the resistance of R.</p>',
          marks: 4, lines: 0, parts: [],
          markScheme: '<p>Total resistance = V ÷ I = 9 ÷ 1.5 = 6 Ω <strong>[1]</strong></p><p>Known resistance = 1 + 2 = 3 Ω <strong>[1]</strong></p><p>R = 6 − 3 <strong>[1]</strong> = <strong>3 Ω</strong> <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'question',
          stem: '<p>At 20 °C, a filament lamp has a resistance of 5 Ω and draws a current of 0.4 A. When switched on fully, the resistance rises to 50 Ω.</p>',
          marks: 4, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Calculate the voltage across the lamp at 20 °C.</p>', marks: 2, lines: 0, markScheme: '<p>V = I × R = 0.4 × 5 <strong>[1]</strong> = <strong>2 V</strong> <strong>[1]</strong></p>' },
            { id: id(), label: 'b', stem: '<p>Calculate the current through the lamp at full operating resistance, assuming the same voltage.</p>', marks: 2, lines: 0, markScheme: '<p>I = V ÷ R = 2 ÷ 50 <strong>[1]</strong> = <strong>0.04 A</strong> <strong>[1]</strong></p>' },
          ],
        },
        {
          id: id(), type: 'question',
          stem: '<p>Explain why the current through a filament lamp does not double when the voltage across it is doubled. Use the equation V = IR in your answer.</p>',
          marks: 3, lines: 0, parts: [],
          markScheme: '<p>As voltage increases, the current increases and the filament heats up <strong>[1]</strong></p><p>This causes the resistance of the filament to increase <strong>[1]</strong></p><p>From V = IR: since R increases as V increases, the current (I = V ÷ R) does not increase proportionally / does not double <strong>[1]</strong></p><p><em>Accept: the lamp is a non-ohmic component / resistance is not constant.</em></p>',
        },
      ],
    },
  },
  {
    label: 'Rates of Reaction',
    description: 'AQA Higher — full-skills worksheet with data table, bar chart, cloze, order steps, and exam questions',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Rates of Reaction',
          topic: 'Chemistry — Chemical Changes',
          examBoard: 'AQA' as const, tier: 'higher' as const,
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions.',
            'Show working for all calculations.',
            'The marks for each question are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information' as const,
          heading: 'Key concept — collision theory',
          content: '<p>A chemical reaction occurs when reacting particles collide with <strong>sufficient energy</strong> (the activation energy). The rate of reaction increases when collisions are more <strong>frequent</strong> or more <strong>energetic</strong>.</p><p>Rate of reaction = <strong>quantity of product formed ÷ time</strong> (or quantity of reactant used ÷ time)</p>',
        },
        {
          id: id(), type: 'multiple_choice' as const,
          stem: '<p>Which change would <strong>not</strong> increase the rate of a reaction between marble chips and hydrochloric acid?</p>',
          marks: 1,
          options: [
            '<p>Increasing the temperature</p>',
            '<p>Using powdered marble instead of chips</p>',
            '<p>Using a more concentrated acid</p>',
            '<p>Using a larger volume of acid at the same concentration</p>',
          ],
          correctIndex: 3,
          markScheme: '<p><strong>D — Using a larger volume of acid at the same concentration</strong></p><p>Increasing the volume does not change the concentration, so the number of acid particles per unit volume (and therefore collision frequency) is unchanged. Rate depends on concentration, not total volume.</p><p>A, B, and C all increase rate: higher temperature increases particle energy; smaller particle size increases surface area; higher concentration increases collision frequency.</p>',
        },
        {
          id: id(), type: 'cloze' as const,
          heading: 'Fill in the blanks using the words in the box.',
          text: 'Increasing the [temperature] gives particles more [kinetic] energy, so more collisions exceed the [activation] energy. Increasing the [concentration] of a solution means there are more particles in the same volume, so collisions are more [frequent].',
          showWordBank: true,
        },
        {
          id: id(), type: 'worked_example' as const,
          title: 'Worked example — calculating rate of reaction',
          steps: [
            '<p>In an experiment, 48 cm³ of gas was collected in 120 seconds. Calculate the mean rate of reaction.</p>',
            '<p>Rate = quantity of product ÷ time</p>',
            '<p>Rate = 48 ÷ 120</p>',
            '<p>Rate = <strong>0.4 cm³/s</strong></p>',
          ],
        },
        {
          id: _rateTableId,
          type: 'data' as const,
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
          display: 'table' as const,
          graph: {
            xCol: 0, yCol: 1,
            showXLabel: true, showYLabel: true,
            showXScale: true, showYScale: true,
            omitRows: [], fitType: 'none' as const, linkedDataId: null,
          },
        },
        {
          id: id(),
          type: 'data' as const,
          heading: 'Fig. 1: Effect of temperature on time taken',
          columns: [
            { label: 'Temperature', unit: '°C' },
            { label: 'Time to collect 50 cm³ gas', unit: 's' },
          ],
          rows: [],
          display: 'bar' as const,
          graph: {
            xCol: 0, yCol: 1,
            showXLabel: true, showYLabel: true,
            showXScale: true, showYScale: true,
            omitRows: [], fitType: 'none' as const, linkedDataId: _rateTableId,
          },
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Use Table 1 and Fig. 1 to answer the following questions.</p>',
          marks: 7, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Describe the relationship between temperature and the time taken to collect 50 cm³ of gas.</p>', marks: 2, lines: 3, markScheme: '<p>As temperature increases, the time taken decreases <strong>[1]</strong>; the relationship is inversely proportional / the time halves for every 10 °C rise in temperature <strong>[1]</strong></p>' },
            { id: id(), label: 'b', stem: '<p>Calculate the mean rate of reaction (in cm³/s) at 40 °C.</p>', marks: 2, lines: 3, markScheme: '<p>Rate = 50 ÷ 60 <strong>[1]</strong> = <strong>0.83 cm³/s</strong> (allow 0.8) <strong>[1]</strong></p>' },
            { id: id(), label: 'c', stem: '<p>Explain, using collision theory, why the rate of reaction increases as temperature rises.</p>', marks: 3, lines: 5, markScheme: '<p>Higher temperature gives particles more kinetic energy <strong>[1]</strong>; more particles have energy greater than or equal to the activation energy <strong>[1]</strong>; so a greater proportion of collisions are successful per unit time, increasing the rate of reaction <strong>[1]</strong></p>' },
          ],
        },
        {
          id: id(), type: 'match_them_up' as const,
          heading: 'Match each factor to how it increases the rate of reaction.',
          items: [
            { id: id(), left: 'Higher temperature', right: 'Particles have more energy; more collisions exceed activation energy' },
            { id: id(), left: 'Higher concentration', right: 'More particles per unit volume; collisions are more frequent' },
            { id: id(), left: 'Smaller particle size', right: 'Greater surface area exposed; more collisions per second' },
            { id: id(), left: 'Adding a catalyst', right: 'Provides an alternative reaction pathway with lower activation energy' },
          ],
        },
        {
          id: id(), type: 'order_steps' as const,
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
  },
  {
    label: 'Hooke\'s Law Investigation',
    description: 'AQA Higher — graph-in-question: students plot on empty axes, mark scheme reveals plotted points + best fit',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Investigating Extension of a Spring',
          topic: 'Physics — Forces',
          examBoard: 'AQA' as const, tier: 'higher' as const,
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions.',
            'Show your working where required.',
            'The marks for each question are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information' as const,
          heading: 'Key equation',
          content: '<p><strong>Hooke\'s Law: F = k e</strong></p><p>F = force applied (N) &nbsp; k = spring constant (N/m) &nbsp; e = extension (m)</p><p>This relationship holds only up to the <strong>elastic limit</strong>. Beyond this point the spring is permanently deformed and no longer obeys Hooke\'s Law.</p>',
        },
        {
          id: _springTableId,
          type: 'data' as const,
          heading: 'Table 1: Results from a spring extension experiment',
          columns: [
            { label: 'Force applied', unit: 'N' },
            { label: 'Extension', unit: 'cm' },
          ],
          rows: [
            ['0', '0.0'],
            ['2', '1.0'],
            ['4', '2.0'],
            ['6', '3.0'],
            ['8', '4.0'],
            ['10', '5.0'],
          ],
          display: 'table' as const,
          graph: {
            xCol: 0, yCol: 1,
            showXLabel: true, showYLabel: true,
            showXScale: true, showYScale: true,
            omitRows: [], fitType: 'none' as const, linkedDataId: null,
          },
        },
        // Graph block — attached to question part (a); not rendered standalone
        {
          id: _springGraphId,
          type: 'data' as const,
          heading: '',
          columns: [
            { label: 'Force applied', unit: 'N' },
            { label: 'Extension', unit: 'cm' },
          ],
          rows: [
            ['0', '0.0'],
            ['2', '1.0'],
            ['4', '2.0'],
            ['6', '3.0'],
            ['8', '4.0'],
            ['10', '5.0'],
          ],
          display: 'graph' as const,
          graph: {
            xCol: 0, yCol: 1,
            showXLabel: true, showYLabel: true,
            showXScale: true, showYScale: true,
            omitRows: [0, 1, 2, 3, 4, 5],
            fitType: 'linear' as const,
            linkedDataId: null,
          },
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>A student investigated how the extension of a spring depends on the applied force. The results are recorded in Table 1.</p>',
          marks: 9, lines: 0,
          parts: [
            {
              id: id(), label: 'a',
              stem: '<p>Plot the data from Table 1 on the axes below. Draw a line of best fit through your plotted points.</p>',
              marks: 4, lines: 0,
              attachedDataId: _springGraphId,
              markScheme: '<p>Award <strong>1 mark</strong> for each of:</p><p>• Axes correctly labelled with quantity and unit <strong>[1]</strong></p><p>• All five non-zero points plotted accurately (within half a small square) <strong>[2]</strong> — lose 1 mark for each incorrect point (min 0)</p><p>• Straight line of best fit drawn through the origin and the plotted points <strong>[1]</strong></p>',
            },
            {
              id: id(), label: 'b',
              stem: '<p>Use your graph to calculate the spring constant <em>k</em> of the spring. Give your answer in N/m.</p>',
              marks: 3, lines: 4,
              markScheme: '<p>Correct reading of gradient from graph, e.g. rise ÷ run = 10 ÷ 5 = 2 N/cm <strong>[1]</strong></p><p>Correct conversion: 2 N/cm = 200 N/m <strong>[1]</strong></p><p>k = <strong>200 N/m</strong> <strong>[1]</strong></p><p><em>Accept values in range 190–210 N/m if read from candidate\'s own line.</em></p>',
            },
            {
              id: id(), label: 'c',
              stem: '<p>Use your graph to predict the extension when a force of 12 N is applied. State one assumption you must make.</p>',
              marks: 2, lines: 3,
              markScheme: '<p>Extension = 6.0 cm (allow 5.8–6.2 cm) by extrapolating line of best fit <strong>[1]</strong></p><p>Assumption: the spring continues to obey Hooke\'s Law / has not reached its elastic limit / the relationship remains linear <strong>[1]</strong></p>',
            },
          ],
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Describe what happens to a spring when it is stretched beyond its elastic limit.</p>',
          marks: 2, lines: 4, parts: [],
          markScheme: '<p>Award <strong>1 mark</strong> for each of:</p><p>• The spring is permanently deformed / does not return to its original length when the force is removed <strong>[1]</strong></p><p>• The spring no longer obeys Hooke\'s Law / the extension is no longer proportional to the force <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'multiple_choice' as const,
          stem: '<p>A spring extends by 4 cm when a force of 8 N is applied. What is the spring constant in N/m?</p>',
          marks: 1,
          options: [
            '<p>0.5 N/m</p>',
            '<p>2 N/m</p>',
            '<p>200 N/m</p>',
            '<p>320 N/m</p>',
          ],
          correctIndex: 2,
          markScheme: '<p><strong>C — 200 N/m</strong></p><p>k = F ÷ e = 8 ÷ 0.04 m = <strong>200 N/m</strong></p><p>Common error: using cm instead of m → k = 8 ÷ 4 = 2 (wrong unit). Always convert extension to metres before calculating k in N/m.</p>',
        },
        {
          id: id(), type: 'worked_example' as const,
          title: 'Worked example — calculating spring constant from a graph',
          steps: [
            '<p>Identify two widely-spaced points on the line of best fit (not data points).</p>',
            '<p>Calculate the gradient: gradient = rise ÷ run = ΔF ÷ Δe</p>',
            '<p>Example: rise = 10 − 0 = 10 N, run = 5 − 0 = 5 cm = 0.05 m</p>',
            '<p>k = 10 ÷ 0.05 = <strong>200 N/m</strong></p>',
          ],
        },
      ],
    },
  },

  // ── Photosynthesis — OCR Gateway ────────────────────────────────────────────
  {
    label: 'Photosynthesis',
    description: 'OCR Gateway — Biology — figures, spacers, match activity, and numerical answers box',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Photosynthesis',
          topic: 'Biology — B4 — Photosynthesis',
          examBoard: 'OCR', tier: 'higher',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions in the spaces provided.',
            'Show all working for calculation questions.',
            'Marks available are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information' as const,
          heading: 'Key equation',
          content: '<p>The word equation for photosynthesis is:</p><p><strong>carbon dioxide + water → glucose + oxygen</strong></p><p>The balanced symbol equation is: <strong>6CO<sub>2</sub> + 6H<sub>2</sub>O → C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub></strong></p><p>Photosynthesis requires <strong>light energy</strong>, absorbed by the green pigment <strong>chlorophyll</strong> in the chloroplasts.</p>',
        },
        {
          id: id(), type: 'figure' as const,
          size: 'medium' as const,
          caption: 'Figure 1 — Cross-section of a leaf showing the main tissues involved in photosynthesis',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Use Figure 1. Name the layer of cells in a leaf that is <strong>most</strong> adapted for photosynthesis and explain why.</p>',
          marks: 3, lines: 6, parts: [],
          markScheme: '<p>• Palisade mesophyll / palisade layer <strong>[1]</strong></p><p>• Cells are tightly packed / columnar <strong>[1]</strong></p><p>• Contain many chloroplasts to absorb maximum light <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'spacer' as const, size: 'small' as const,
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>A plant absorbs 360 g of CO<sub>2</sub> during one hour of photosynthesis. Calculate the mass of glucose produced. (M<sub>r</sub>: CO<sub>2</sub> = 44, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> = 180)</p>',
          marks: 3, lines: 4, parts: [],
          markScheme: '<p>Moles CO<sub>2</sub> = 360 ÷ 44 = 8.18 mol <strong>[1]</strong></p><p>Moles glucose = 8.18 ÷ 6 = 1.36 mol <strong>[1]</strong></p><p>Mass glucose = 1.36 × 180 = <strong>245 g</strong> (accept 244–246) <strong>[1]</strong></p>',
          numericalAnswer: '245',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>A student measures the rate of photosynthesis of pondweed at three light intensities. At 2000 lux, 18 bubbles per minute were produced. At 4000 lux, 30 bubbles per minute. At 6000 lux, 30 bubbles per minute. Explain what limits the rate between 4000 and 6000 lux.</p>',
          marks: 3, lines: 6, parts: [],
          markScheme: '<p>• Rate does not increase beyond 4000 lux — graph levels off / plateau <strong>[1]</strong></p><p>• A factor other than light is now limiting <strong>[1]</strong></p><p>• CO<sub>2</sub> concentration / temperature is the limiting factor <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'match_them_up' as const,
          heading: 'Match each term to its correct definition.',
          items: [
            { id: id(), left: 'Chlorophyll', right: 'Green pigment that absorbs light energy for photosynthesis' },
            { id: id(), left: 'Chloroplast', right: 'Organelle in plant cells where photosynthesis occurs' },
            { id: id(), left: 'Limiting factor', right: 'A variable that prevents the rate of photosynthesis from increasing further' },
            { id: id(), left: 'Compensation point', right: 'Light intensity at which the rate of photosynthesis equals the rate of respiration' },
          ],
        },
        {
          id: id(), type: 'spacer' as const, size: 'medium' as const,
        },
        {
          id: _photoNAId, type: 'numerical_answers' as const,
          heading: 'Numerical answers',
        },
      ],
    },
  },

  // ── Waves and Sound — Edexcel ────────────────────────────────────────────────
  {
    label: 'Waves and Sound',
    description: 'Edexcel GCSE Physics — data table, cloze passage, and numerical answers box',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Waves and Sound',
          topic: 'Physics — Topic 6 — Waves in matter',
          examBoard: 'Edexcel', tier: 'higher',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions.',
            'Show full working for calculations — method marks are awarded.',
            'Use the data provided in Table 1 where instructed.',
          ],
        },
        {
          id: _waveDataId, type: 'data' as const,
          heading: 'Table 1 — Properties of selected waves',
          display: 'table' as const,
          columns: [
            { label: 'Wave type', unit: '' },
            { label: 'Frequency', unit: 'Hz' },
            { label: 'Wavelength', unit: 'm' },
            { label: 'Speed', unit: 'm/s' },
          ],
          rows: [
            ['Audible sound (low)', '20', '17', '340'],
            ['Audible sound (high)', '20 000', '0.017', '340'],
            ['Ultrasound', '2 000 000', '0.00017', '340'],
            ['Seismic P-wave (rock)', '1', '8 000', '8 000'],
          ],
          graph: {
            xCol: 0, yCol: 1,
            showXLabel: true, showYLabel: true,
            showXScale: true, showYScale: true,
            omitRows: [], fitType: 'none' as const, linkedDataId: null,
          },
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Use Table 1. Show that the wave speed equation is satisfied for audible sound at 20 Hz. Use the equation <em>v = fλ</em>.</p>',
          marks: 2, lines: 3, parts: [],
          markScheme: '<p>v = 20 × 17 = <strong>340 m/s</strong> <strong>[1]</strong>; matches value in table <strong>[1]</strong></p>',
          numericalAnswer: '340',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>An ultrasound pulse is emitted by a probe and reflects off an object. The pulse returns after 0.000 06 s. Calculate the distance to the object. (Speed of ultrasound in tissue = 1 500 m/s)</p>',
          marks: 3, lines: 4, parts: [],
          markScheme: '<p>Total distance = v × t = 1500 × 0.000 06 = 0.09 m <strong>[1]</strong></p><p>Distance to object = 0.09 ÷ 2 <strong>[1]</strong> = <strong>0.045 m</strong> (= 4.5 cm) <strong>[1]</strong></p>',
          numericalAnswer: '0.045',
        },
        {
          id: id(), type: 'worked_example' as const,
          title: 'Worked example — using v = fλ',
          steps: [
            '<p>Write the equation: v = f × λ</p>',
            '<p>Identify values: f = 400 Hz, v = 340 m/s, λ = ?</p>',
            '<p>Rearrange: λ = v ÷ f = 340 ÷ 400</p>',
            '<p>λ = <strong>0.85 m</strong></p>',
          ],
        },
        {
          id: id(), type: 'cloze' as const,
          heading: 'Complete the paragraph using the words in the box.',
          text: 'Sound waves are [longitudinal] waves — the particles vibrate [parallel] to the direction of wave travel. They require a [medium] to travel and cannot pass through a [vacuum]. The [frequency] of a sound wave determines its pitch, while the [amplitude] determines its loudness.',
          showWordBank: true,
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Explain why ultrasound is used in medicine rather than audible sound for internal imaging.</p>',
          marks: 3, lines: 6, parts: [],
          markScheme: '<p>• Very high frequency / very short wavelength <strong>[1]</strong></p><p>• Can pass through soft tissue and reflect off boundaries between tissues <strong>[1]</strong></p><p>• No ionising radiation / no damage to living cells / safe for use on pregnant women <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'spacer' as const, size: 'small' as const,
        },
        {
          id: id(), type: 'numerical_answers' as const,
          heading: 'Numerical answers',
        },
      ],
    },
  },

  // ── Aerobic Respiration — AQA Biology ───────────────────────────────────────
  {
    label: 'Aerobic Respiration',
    description: 'AQA Biology — order steps, cloze, calculations, and numerical answers box',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Aerobic Respiration',
          topic: 'Biology — B9 — Respiration',
          examBoard: 'AQA', tier: 'higher',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions in the spaces provided.',
            'Show all working for calculation questions.',
            'The marks for each question are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information' as const,
          heading: 'Key information',
          content: '<p>Aerobic respiration is the process by which cells release energy from glucose using oxygen. The overall equation is:</p><p><strong>glucose + oxygen → carbon dioxide + water (+ energy)</strong></p><p><strong>C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub> → 6CO<sub>2</sub> + 6H<sub>2</sub>O</strong></p><p>Energy released is used to make <strong>ATP</strong>, the cell\'s energy currency. Respiration occurs in the mitochondria.</p>',
        },
        {
          id: id(), type: 'order_steps' as const,
          heading: 'Put the following stages of aerobic respiration in the correct order.',
          steps: [
            'Glucose is split into pyruvate in the cytoplasm (glycolysis)',
            'Pyruvate is transported into the mitochondria',
            'Pyruvate is converted to acetyl-CoA, releasing CO₂',
            'Acetyl-CoA enters the Krebs cycle — more CO₂ and hydrogen released',
            'Hydrogen atoms are passed along the electron transport chain',
            'Oxygen accepts the hydrogen to form water; ATP is produced',
          ],
        },
        {
          id: id(), type: 'spacer' as const, size: 'small' as const,
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>A muscle cell uses 0.18 g of glucose during vigorous exercise. Calculate the mass of CO<sub>2</sub> produced. (M<sub>r</sub>: glucose = 180, CO<sub>2</sub> = 44)</p>',
          marks: 3, lines: 4, parts: [],
          markScheme: '<p>Moles glucose = 0.18 ÷ 180 = 0.001 mol <strong>[1]</strong></p><p>Moles CO<sub>2</sub> = 0.001 × 6 = 0.006 mol <strong>[1]</strong></p><p>Mass CO<sub>2</sub> = 0.006 × 44 = <strong>0.264 g</strong> <strong>[1]</strong></p>',
          numericalAnswer: '0.264',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>A student measures the rate of CO<sub>2</sub> production by yeast at 20 °C and 35 °C. At 20 °C, 12 cm<sup>3</sup> CO<sub>2</sub> is produced per minute. At 35 °C, 48 cm<sup>3</sup> per minute. Calculate the Q<sub>10</sub> value. (Q<sub>10</sub> = rate at higher temp ÷ rate at lower temp; temperature difference = 15 °C)</p>',
          marks: 2, lines: 3, parts: [],
          markScheme: '<p>Q<sub>10</sub> = 48 ÷ 12 = <strong>4</strong> (for a 15 °C rise) <strong>[2]</strong></p><p>Accept ecf from incorrect rate values.</p>',
          numericalAnswer: '4',
        },
        {
          id: id(), type: 'cloze' as const,
          heading: 'Complete the passage using the words in the box.',
          text: 'Aerobic respiration requires [oxygen] and releases much more [energy] per glucose molecule than [anaerobic] respiration. The products are [carbon dioxide] and [water]. The process takes place in the [mitochondria].',
          showWordBank: true,
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Explain why athletes have a higher density of mitochondria in their muscle cells than non-athletes.</p>',
          marks: 3, lines: 6, parts: [],
          markScheme: '<p>• Athletes require more energy / ATP for muscle contraction <strong>[1]</strong></p><p>• Aerobic respiration occurs in mitochondria <strong>[1]</strong></p><p>• More mitochondria = higher rate of aerobic respiration = more ATP produced <strong>[1]</strong></p>',
        },
        {
          id: id(), type: 'spacer' as const, size: 'medium' as const,
        },
        {
          id: _respNAId, type: 'numerical_answers' as const,
          heading: 'Numerical answers',
        },
      ],
    },
  },

  // ── Atomic Structure — WJEC ──────────────────────────────────────────────────
  {
    label: 'Atomic Structure',
    description: 'WJEC GCSE Chemistry — worked example, figure placeholder, multiple choice, and recall questions',
    worksheet: {
      id: id(),
      blocks: [
        {
          id: id(), type: 'header' as const,
          title: 'Atomic Structure',
          topic: 'Chemistry — C1 — The nature of substances and chemical reactions',
          examBoard: 'WJEC', tier: 'higher',
          showName: true, showDate: true, showClass: true,
        },
        {
          id: id(), type: 'instructions' as const,
          items: [
            'Answer all questions.',
            'For multiple choice questions, circle the letter of the correct answer.',
            'Marks are shown in brackets.',
          ],
        },
        {
          id: id(), type: 'information' as const,
          heading: 'Key facts',
          content: '<p>An atom consists of a central <strong>nucleus</strong> (containing protons and neutrons) surrounded by <strong>electrons</strong> in shells.</p><p><strong>Relative masses:</strong> proton = 1, neutron = 1, electron = negligible (1/1836)</p><p><strong>Relative charges:</strong> proton = +1, neutron = 0, electron = −1</p><p>The <strong>atomic number</strong> (Z) gives the number of protons. The <strong>mass number</strong> (A) gives the total number of protons + neutrons.</p>',
        },
        {
          id: id(), type: 'figure' as const,
          size: 'small' as const,
          caption: 'Figure 1 — Diagram of a lithium-7 atom showing its electron arrangement',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Use Figure 1 and your knowledge. Complete the table for a lithium-7 atom (<sup>7</sup><sub>3</sub>Li).</p>',
          marks: 3, lines: 0,
          parts: [
            { id: id(), label: 'a', stem: '<p>Number of protons</p>', marks: 1, lines: 2, markScheme: '<p>3 <strong>[1]</strong></p>', numericalAnswer: '3' },
            { id: id(), label: 'b', stem: '<p>Number of neutrons</p>', marks: 1, lines: 2, markScheme: '<p>4 (= 7 − 3) <strong>[1]</strong></p>', numericalAnswer: '4' },
            { id: id(), label: 'c', stem: '<p>Number of electrons</p>', marks: 1, lines: 2, markScheme: '<p>3 (same as protons in neutral atom) <strong>[1]</strong></p>', numericalAnswer: '3' },
          ],
          markScheme: '',
        },
        {
          id: id(), type: 'worked_example' as const,
          title: 'Worked example — writing electronic configurations',
          steps: [
            '<p>Identify the atomic number: for sodium (Na), Z = 11, so 11 electrons.</p>',
            '<p>Fill the first shell: max 2 electrons → 2</p>',
            '<p>Fill the second shell: max 8 electrons → 8</p>',
            '<p>Remaining electrons go in the third shell: 11 − 2 − 8 = <strong>1</strong></p>',
            '<p>Electronic configuration of Na: <strong>2, 8, 1</strong></p>',
          ],
        },
        {
          id: id(), type: 'multiple_choice' as const,
          stem: '<p>An element has the symbol <sup>23</sup><sub>11</sub>Na. How many neutrons does this atom contain?</p>',
          marks: 1,
          options: ['<p>11</p>', '<p>12</p>', '<p>23</p>', '<p>34</p>'],
          correctIndex: 1,
          markScheme: '<p><strong>B — 12</strong></p><p>Neutrons = mass number − atomic number = 23 − 11 = 12. Common error: confusing mass number with neutron number.</p>',
        },
        {
          id: id(), type: 'multiple_choice' as const,
          stem: '<p>Which statement correctly describes isotopes?</p>',
          marks: 1,
          options: [
            '<p>Atoms of different elements with the same number of neutrons</p>',
            '<p>Atoms of the same element with different numbers of electrons</p>',
            '<p>Atoms of the same element with different numbers of neutrons</p>',
            '<p>Atoms of different elements with the same mass number</p>',
          ],
          correctIndex: 2,
          markScheme: '<p><strong>C</strong> — Isotopes are atoms of the same element (same atomic number / proton number) with different mass numbers (different numbers of neutrons). They have identical chemical properties but different physical properties.</p>',
        },
        {
          id: id(), type: 'question' as const,
          stem: '<p>Chlorine has two naturally occurring isotopes: <sup>35</sup>Cl (75%) and <sup>37</sup>Cl (25%). Calculate the relative atomic mass of chlorine to one decimal place.</p>',
          marks: 2, lines: 4, parts: [],
          markScheme: '<p>A<sub>r</sub> = (35 × 75 + 37 × 25) ÷ 100 <strong>[1]</strong> = (2625 + 925) ÷ 100 = 3550 ÷ 100 = <strong>35.5</strong> <strong>[1]</strong></p>',
          numericalAnswer: '35.5',
        },
        {
          id: id(), type: 'spacer' as const, size: 'small' as const,
        },
        {
          id: id(), type: 'numerical_answers' as const,
          heading: 'Numerical answers',
        },
      ],
    },
  },
]
