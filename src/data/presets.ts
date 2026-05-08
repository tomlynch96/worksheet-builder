import type { Worksheet } from '../types/worksheet'

function id() { return crypto.randomUUID() }

const _rateTableId = id()
const _springTableId = id()
const _springGraphId = id()

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
]
