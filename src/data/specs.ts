export interface SpecPoint {
  ref: string
  title: string
}

export interface SpecTopic {
  ref: string
  title: string
  points: SpecPoint[]
}

export interface Qualification {
  id: string
  label: string
  shortLabel: string
  topics: SpecTopic[]
}

// ── Edexcel GCSE Physics (9-1) — 1PH0 ────────────────────────────────────────

const gcsePhysicsTopics: SpecTopic[] = [
  {
    ref: 'T1', title: 'Key concepts of physics',
    points: [
      { ref: '1.1', title: 'SI units and standard form' },
      { ref: '1.2', title: 'Scalars and vectors' },
      { ref: '1.3', title: 'Significant figures and uncertainties' },
      { ref: '1.4', title: 'Equations, graphs and data analysis' },
    ],
  },
  {
    ref: 'T2', title: 'Motion and forces',
    points: [
      { ref: '2.1', title: 'Describing motion — distance, speed and velocity' },
      { ref: '2.2', title: 'Distance–time graphs' },
      { ref: '2.3', title: 'Velocity–time graphs and acceleration' },
      { ref: '2.4', title: 'Equations of motion (v = u + at, etc.)' },
      { ref: '2.5', title: 'Newton\'s First Law — balanced forces and inertia' },
      { ref: '2.6', title: 'Newton\'s Second Law — F = ma' },
      { ref: '2.7', title: 'Newton\'s Third Law — action and reaction pairs' },
      { ref: '2.8', title: 'Weight, mass and gravitational field strength' },
      { ref: '2.9', title: 'Stopping distances — thinking and braking distance' },
      { ref: '2.10', title: 'Momentum — p = mv' },
      { ref: '2.11', title: 'Conservation of momentum' },
      { ref: '2.12', title: 'Forces and elasticity — Hooke\'s Law' },
    ],
  },
  {
    ref: 'T3', title: 'Conservation of energy',
    points: [
      { ref: '3.1', title: 'Energy stores and transfers' },
      { ref: '3.2', title: 'Conservation of energy' },
      { ref: '3.3', title: 'Efficiency of energy transfers' },
      { ref: '3.4', title: 'Power — P = E/t and P = W/t' },
      { ref: '3.5', title: 'Reducing energy losses — insulation and lubrication' },
    ],
  },
  {
    ref: 'T4', title: 'Waves',
    points: [
      { ref: '4.1', title: 'Properties of waves — amplitude, wavelength, frequency, period' },
      { ref: '4.2', title: 'Wave equation — v = fλ' },
      { ref: '4.3', title: 'Transverse and longitudinal waves' },
      { ref: '4.4', title: 'Reflection of waves' },
      { ref: '4.5', title: 'Refraction of waves' },
      { ref: '4.6', title: 'Sound waves and hearing' },
      { ref: '4.7', title: 'Ultrasound and its uses' },
      { ref: '4.8', title: 'Seismic waves — P-waves and S-waves' },
    ],
  },
  {
    ref: 'T5', title: 'Light and the electromagnetic spectrum',
    points: [
      { ref: '5.1', title: 'The electromagnetic spectrum — properties and order' },
      { ref: '5.2', title: 'Speed, frequency and wavelength of EM waves' },
      { ref: '5.3', title: 'Uses of EM waves (radio, microwave, IR, visible, UV, X-ray, gamma)' },
      { ref: '5.4', title: 'Dangers of EM radiation' },
      { ref: '5.5', title: 'Refraction at boundaries and refractive index' },
      { ref: '5.6', title: 'Total internal reflection and critical angle' },
      { ref: '5.7', title: 'Lenses — converging and diverging, real and virtual images' },
      { ref: '5.8', title: 'Colour — absorption, transmission and reflection' },
    ],
  },
  {
    ref: 'T6', title: 'Radioactivity',
    points: [
      { ref: '6.1', title: 'Atomic structure — protons, neutrons, electrons' },
      { ref: '6.2', title: 'Isotopes and relative atomic mass' },
      { ref: '6.3', title: 'Alpha, beta and gamma radiation — nature and properties' },
      { ref: '6.4', title: 'Nuclear equations for decay' },
      { ref: '6.5', title: 'Half-life and radioactive decay graphs' },
      { ref: '6.6', title: 'Uses of radioactivity — medical and industrial' },
      { ref: '6.7', title: 'Dangers of ionising radiation and safety precautions' },
      { ref: '6.8', title: 'Background radiation and its sources' },
      { ref: '6.9', title: 'Nuclear fission and chain reactions' },
      { ref: '6.10', title: 'Nuclear fusion and stars' },
    ],
  },
  {
    ref: 'T7', title: 'Astronomy (separate Physics only)',
    points: [
      { ref: '7.1', title: 'The solar system — planets, moons, asteroids, comets' },
      { ref: '7.2', title: 'Orbital speed and gravitational force' },
      { ref: '7.3', title: 'Life cycle of stars' },
      { ref: '7.4', title: 'The expanding universe and red-shift' },
      { ref: '7.5', title: 'The Big Bang theory' },
      { ref: '7.6', title: 'Dark matter and dark energy' },
    ],
  },
  {
    ref: 'T8', title: 'Energy — forces doing work',
    points: [
      { ref: '8.1', title: 'Work done — W = Fs (work = force × distance)' },
      { ref: '8.2', title: 'Gravitational potential energy — GPE = mgh' },
      { ref: '8.3', title: 'Kinetic energy — KE = ½mv²' },
      { ref: '8.4', title: 'Energy conservation in mechanical systems' },
      { ref: '8.5', title: 'Power in mechanical systems' },
    ],
  },
  {
    ref: 'T9', title: 'Forces and their effects',
    points: [
      { ref: '9.1', title: 'Adding forces — resultant force' },
      { ref: '9.2', title: 'Centre of gravity' },
      { ref: '9.3', title: 'Moments, levers and torques — moment = Fd' },
      { ref: '9.4', title: 'Conditions for equilibrium' },
      { ref: '9.5', title: 'Pressure — P = F/A' },
      { ref: '9.6', title: 'Pressure in fluids — depth and atmospheric pressure' },
      { ref: '9.7', title: 'Upthrust and Archimedes\' principle' },
    ],
  },
  {
    ref: 'T10', title: 'Electricity and circuits',
    points: [
      { ref: '10.1', title: 'Electric charge and current — I = Q/t' },
      { ref: '10.2', title: 'Potential difference, resistance — V = IR' },
      { ref: '10.3', title: 'Series circuits — current, voltage and resistance rules' },
      { ref: '10.4', title: 'Parallel circuits — current, voltage and resistance rules' },
      { ref: '10.5', title: 'I–V characteristics — ohmic, filament lamp, diode' },
      { ref: '10.6', title: 'Electrical power — P = VI = I²R' },
      { ref: '10.7', title: 'Energy transfer — E = VIt' },
      { ref: '10.8', title: 'The National Grid and electricity transmission' },
    ],
  },
  {
    ref: 'T11', title: 'Static electricity',
    points: [
      { ref: '11.1', title: 'Charging by friction — electron transfer' },
      { ref: '11.2', title: 'Attraction and repulsion between charges' },
      { ref: '11.3', title: 'Electric fields — field lines and strength' },
      { ref: '11.4', title: 'Dangers and uses of static electricity' },
    ],
  },
  {
    ref: 'T12', title: 'Magnetism and the motor effect',
    points: [
      { ref: '12.1', title: 'Permanent magnets and magnetic fields' },
      { ref: '12.2', title: 'Electromagnets and solenoids' },
      { ref: '12.3', title: 'The motor effect — F = BIL' },
      { ref: '12.4', title: 'Fleming\'s Left-Hand Rule' },
      { ref: '12.5', title: 'DC electric motors' },
      { ref: '12.6', title: 'Loudspeakers and the motor effect' },
    ],
  },
  {
    ref: 'T13', title: 'Electromagnetic induction',
    points: [
      { ref: '13.1', title: 'Inducing a potential difference — Faraday\'s Law' },
      { ref: '13.2', title: 'Lenz\'s Law and direction of induced current' },
      { ref: '13.3', title: 'AC generators — structure and output' },
      { ref: '13.4', title: 'Transformers — step-up and step-down, Vs/Vp = Ns/Np' },
      { ref: '13.5', title: 'Microphones and electromagnetic induction' },
    ],
  },
  {
    ref: 'T14', title: 'Particle model',
    points: [
      { ref: '14.1', title: 'States of matter — particle model descriptions' },
      { ref: '14.2', title: 'Changes of state and latent heat' },
      { ref: '14.3', title: 'Specific heat capacity — Q = mcΔT' },
      { ref: '14.4', title: 'Specific latent heat — Q = mL' },
      { ref: '14.5', title: 'Gas pressure and temperature — particle explanation' },
      { ref: '14.6', title: 'Boyle\'s Law — pressure–volume relationship' },
    ],
  },
  {
    ref: 'T15', title: 'Forces and matter',
    points: [
      { ref: '15.1', title: 'Density — ρ = m/V' },
      { ref: '15.2', title: 'Measuring density of regular and irregular objects' },
      { ref: '15.3', title: 'Hooke\'s Law and the spring constant — F = ke' },
      { ref: '15.4', title: 'Elastic and plastic deformation, elastic limit' },
      { ref: '15.5', title: 'Pressure in fluids and at depth — P = hρg' },
    ],
  },
]

// ── Edexcel A Level Physics (9PH0) ───────────────────────────────────────────

const aLevelPhysicsTopics: SpecTopic[] = [
  {
    ref: 'T1', title: 'Working as a physicist',
    points: [
      { ref: '1.1', title: 'SI units, base and derived units' },
      { ref: '1.2', title: 'Significant figures, precision and accuracy' },
      { ref: '1.3', title: 'Uncertainties — absolute, fractional and percentage' },
      { ref: '1.4', title: 'Graphical analysis — gradients, intercepts, best-fit lines' },
      { ref: '1.5', title: 'Planning and evaluating experiments' },
    ],
  },
  {
    ref: 'T2', title: 'Mechanics',
    points: [
      { ref: '2.1', title: 'Scalars and vectors — addition, resolution into components' },
      { ref: '2.2', title: 'Kinematics — equations of motion (suvat)' },
      { ref: '2.3', title: 'Projectile motion' },
      { ref: '2.4', title: 'Newton\'s laws of motion' },
      { ref: '2.5', title: 'Momentum — p = mv, impulse = FΔt' },
      { ref: '2.6', title: 'Conservation of momentum in collisions' },
      { ref: '2.7', title: 'Work, energy and power — W = Fs, P = W/t' },
      { ref: '2.8', title: 'Conservation of energy, efficiency' },
      { ref: '2.9', title: 'Density and pressure' },
      { ref: '2.10', title: 'Upthrust and flotation' },
      { ref: '2.11', title: 'Viscosity and Stokes\' Law' },
    ],
  },
  {
    ref: 'T3', title: 'Electric circuits',
    points: [
      { ref: '3.1', title: 'Charge, current and Kirchhoff\'s First Law' },
      { ref: '3.2', title: 'Potential difference, EMF and energy — E = QV' },
      { ref: '3.3', title: 'Resistance, Ohm\'s Law — R = V/I' },
      { ref: '3.4', title: 'Resistivity — R = ρL/A' },
      { ref: '3.5', title: 'I–V characteristics — ohmic, filament, diode, NTC thermistor, LDR' },
      { ref: '3.6', title: 'Series and parallel circuits — Kirchhoff\'s Second Law' },
      { ref: '3.7', title: 'Electrical power — P = IV = I²R = V²/R' },
      { ref: '3.8', title: 'Potential dividers' },
      { ref: '3.9', title: 'EMF and internal resistance — ε = I(R + r)' },
    ],
  },
  {
    ref: 'T4', title: 'Materials',
    points: [
      { ref: '4.1', title: 'Hooke\'s Law and the spring constant' },
      { ref: '4.2', title: 'Stress and strain' },
      { ref: '4.3', title: 'Young modulus — E = stress/strain' },
      { ref: '4.4', title: 'Elastic strain energy — area under F–x graph' },
      { ref: '4.5', title: 'Elastic and plastic deformation, fracture and yield' },
      { ref: '4.6', title: 'Stress–strain curves for metals, polymers and ceramics' },
    ],
  },
  {
    ref: 'T5', title: 'Waves and the particle nature of light',
    points: [
      { ref: '5.1', title: 'Progressive waves — amplitude, wavelength, frequency, phase' },
      { ref: '5.2', title: 'Wave speed — v = fλ' },
      { ref: '5.3', title: 'Transverse and longitudinal waves' },
      { ref: '5.4', title: 'Polarisation of transverse waves' },
      { ref: '5.5', title: 'Superposition, interference and path difference' },
      { ref: '5.6', title: 'Stationary waves — nodes, antinodes, harmonics' },
      { ref: '5.7', title: 'Diffraction — single slit and diffraction gratings (nλ = d sinθ)' },
      { ref: '5.8', title: 'Refraction — Snell\'s Law and refractive index' },
      { ref: '5.9', title: 'Total internal reflection and critical angle' },
      { ref: '5.10', title: 'Photoelectric effect — threshold frequency, work function' },
      { ref: '5.11', title: 'Photon energy — E = hf' },
      { ref: '5.12', title: 'Wave–particle duality, de Broglie wavelength — λ = h/mv' },
      { ref: '5.13', title: 'Electron diffraction and evidence for wave–particle duality' },
    ],
  },
  {
    ref: 'T6', title: 'Further mechanics',
    points: [
      { ref: '6.1', title: 'Circular motion — angular velocity, centripetal acceleration' },
      { ref: '6.2', title: 'Centripetal force — F = mv²/r' },
      { ref: '6.3', title: 'Simple harmonic motion — a = −ω²x' },
      { ref: '6.4', title: 'SHM in springs and pendula — period equations' },
      { ref: '6.5', title: 'Energy in SHM — kinetic and potential energy changes' },
      { ref: '6.6', title: 'Resonance and damping' },
    ],
  },
  {
    ref: 'T7', title: 'Electric and magnetic fields',
    points: [
      { ref: '7.1', title: 'Electric fields — field strength E = F/Q = V/d' },
      { ref: '7.2', title: 'Coulomb\'s Law — F = kQ₁Q₂/r²' },
      { ref: '7.3', title: 'Capacitance — C = Q/V' },
      { ref: '7.4', title: 'Energy stored in a capacitor — E = ½CV²' },
      { ref: '7.5', title: 'Charging and discharging capacitors — time constant τ = RC' },
      { ref: '7.6', title: 'Magnetic flux density and force on a current — F = BIL' },
      { ref: '7.7', title: 'Force on a moving charge — F = BQv' },
      { ref: '7.8', title: 'Magnetic flux and Faraday\'s Law — ε = −dΦ/dt' },
      { ref: '7.9', title: 'Lenz\'s Law and induced EMF' },
      { ref: '7.10', title: 'Transformers and the National Grid' },
      { ref: '7.11', title: 'Alternating current — RMS values, peak voltage' },
    ],
  },
  {
    ref: 'T8', title: 'Nuclear and particle physics',
    points: [
      { ref: '8.1', title: 'Atomic structure — protons, neutrons, electrons' },
      { ref: '8.2', title: 'The standard model — quarks, leptons, hadrons' },
      { ref: '8.3', title: 'Alpha, beta-minus, beta-plus and gamma decay' },
      { ref: '8.4', title: 'Nuclear equations and conservation laws' },
      { ref: '8.5', title: 'Half-life and radioactive decay — A = λN' },
      { ref: '8.6', title: 'Binding energy and mass defect — E = mc²' },
      { ref: '8.7', title: 'Nuclear fission — chain reaction and critical mass' },
      { ref: '8.8', title: 'Nuclear fusion and conditions in stars' },
    ],
  },
  {
    ref: 'T9', title: 'Thermodynamics',
    points: [
      { ref: '9.1', title: 'Thermal energy transfer — conduction, convection, radiation' },
      { ref: '9.2', title: 'Specific heat capacity — Q = mcΔT' },
      { ref: '9.3', title: 'Specific latent heat — Q = mL' },
      { ref: '9.4', title: 'Ideal gas law — pV = nRT' },
      { ref: '9.5', title: 'Kinetic theory — mean kinetic energy = 3/2 kT' },
      { ref: '9.6', title: 'Internal energy and the first law of thermodynamics' },
    ],
  },
  {
    ref: 'T10', title: 'Space (optional topic)',
    points: [
      { ref: '10.1', title: 'Gravitational fields — g = GM/r²' },
      { ref: '10.2', title: 'Gravitational potential — V = −GM/r' },
      { ref: '10.3', title: 'Orbital motion and Kepler\'s Third Law — T² ∝ r³' },
      { ref: '10.4', title: 'Escape velocity' },
      { ref: '10.5', title: 'Stellar classification — HR diagram' },
      { ref: '10.6', title: 'Stellar evolution — main sequence to remnant' },
      { ref: '10.7', title: 'Hubble\'s Law and the expanding universe — v = Hd' },
      { ref: '10.8', title: 'Cosmic microwave background radiation and the Big Bang' },
    ],
  },
]

// ── Exploring Science Year 7 (Pearson/Hodder) ────────────────────────────────

const exploringScience7Topics: SpecTopic[] = [
  {
    ref: '7A', title: 'Cells',
    points: [
      { ref: '7A.1', title: 'Life processes and characteristics of living things' },
      { ref: '7A.2', title: 'Plant and animal cells — structure and function' },
      { ref: '7A.3', title: 'Specialised cells' },
      { ref: '7A.4', title: 'Diffusion' },
      { ref: '7A.5', title: 'Organisation: cells → tissues → organs → organ systems' },
    ],
  },
  {
    ref: '7B', title: 'Reproduction',
    points: [
      { ref: '7B.1', title: 'Asexual reproduction' },
      { ref: '7B.2', title: 'Sexual reproduction' },
      { ref: '7B.3', title: 'Adolescence and the menstrual cycle' },
      { ref: '7B.4', title: 'Fertilisation and development in humans' },
      { ref: '7B.5', title: 'Plant reproduction (pollination, fertilisation, seed dispersal)' },
    ],
  },
  {
    ref: '7C', title: 'Environment and ecology',
    points: [
      { ref: '7C.1', title: 'Habitats and adaptation' },
      { ref: '7C.2', title: 'Food chains and food webs' },
      { ref: '7C.3', title: 'Competition and predator–prey relationships' },
      { ref: '7C.4', title: 'Sampling techniques (quadrats, transects)' },
    ],
  },
  {
    ref: '7D', title: 'Variation and classification',
    points: [
      { ref: '7D.1', title: 'Variation within a species' },
      { ref: '7D.2', title: 'Inherited and environmental causes of variation' },
      { ref: '7D.3', title: 'Classification of vertebrates and invertebrates' },
      { ref: '7D.4', title: 'Classification keys (dichotomous keys)' },
    ],
  },
  {
    ref: '7E', title: 'Acids and alkalis',
    points: [
      { ref: '7E.1', title: 'Acids and alkalis in everyday life' },
      { ref: '7E.2', title: 'Indicators and the pH scale' },
      { ref: '7E.3', title: 'Neutralisation reactions' },
      { ref: '7E.4', title: 'Salts and their uses' },
    ],
  },
  {
    ref: '7F', title: 'Simple chemical reactions',
    points: [
      { ref: '7F.1', title: 'Chemical reactions — reactants and products' },
      { ref: '7F.2', title: 'Word equations' },
      { ref: '7F.3', title: 'Combustion' },
      { ref: '7F.4', title: 'Thermal decomposition and oxidation' },
    ],
  },
  {
    ref: '7G', title: 'Particle model',
    points: [
      { ref: '7G.1', title: 'States of matter' },
      { ref: '7G.2', title: 'Changes of state (melting, boiling, condensing, freezing)' },
      { ref: '7G.3', title: 'Particle model and physical properties' },
      { ref: '7G.4', title: 'Diffusion through gases and liquids' },
    ],
  },
  {
    ref: '7H', title: 'Solutions',
    points: [
      { ref: '7H.1', title: 'Dissolving — solutes, solvents and solutions' },
      { ref: '7H.2', title: 'Solubility and factors affecting it' },
      { ref: '7H.3', title: 'Chromatography' },
      { ref: '7H.4', title: 'Distillation' },
    ],
  },
  {
    ref: '7I', title: 'Energy',
    points: [
      { ref: '7I.1', title: 'Energy resources — renewable and non-renewable' },
      { ref: '7I.2', title: 'Energy stores and transfers' },
      { ref: '7I.3', title: 'Conservation of energy' },
      { ref: '7I.4', title: 'Energy efficiency' },
    ],
  },
  {
    ref: '7J', title: 'Electrical circuits',
    points: [
      { ref: '7J.1', title: 'Circuit components and symbols' },
      { ref: '7J.2', title: 'Series and parallel circuits' },
      { ref: '7J.3', title: 'Voltage and current' },
      { ref: '7J.4', title: 'Resistance' },
    ],
  },
  {
    ref: '7K', title: 'Forces',
    points: [
      { ref: '7K.1', title: 'Types of forces (contact and non-contact)' },
      { ref: '7K.2', title: 'Friction and air resistance' },
      { ref: '7K.3', title: 'Pressure' },
      { ref: '7K.4', title: 'Gravity and weight' },
    ],
  },
  {
    ref: '7L', title: 'The Solar System and beyond',
    points: [
      { ref: '7L.1', title: 'The Solar System — planets and structure' },
      { ref: '7L.2', title: 'Day, night and the seasons' },
      { ref: '7L.3', title: 'The Moon and eclipses' },
      { ref: '7L.4', title: 'Space exploration and the universe' },
    ],
  },
]

// ── Exploring Science Year 8 (Pearson/Hodder) ────────────────────────────────

const exploringScience8Topics: SpecTopic[] = [
  {
    ref: '8A', title: 'Food and digestion',
    points: [
      { ref: '8A.1', title: 'Nutrients and a balanced diet' },
      { ref: '8A.2', title: 'The digestive system' },
      { ref: '8A.3', title: 'Enzymes and chemical digestion' },
      { ref: '8A.4', title: 'Absorption and the villi' },
    ],
  },
  {
    ref: '8B', title: 'Respiration',
    points: [
      { ref: '8B.1', title: 'Aerobic respiration' },
      { ref: '8B.2', title: 'Anaerobic respiration' },
      { ref: '8B.3', title: 'The respiratory system' },
      { ref: '8B.4', title: 'Gas exchange in the lungs' },
    ],
  },
  {
    ref: '8C', title: 'Microbes and disease',
    points: [
      { ref: '8C.1', title: 'Types of microorganism (bacteria, viruses, fungi)' },
      { ref: '8C.2', title: 'How diseases spread' },
      { ref: '8C.3', title: 'The body\'s defences and the immune system' },
      { ref: '8C.4', title: 'Medicines and vaccination' },
    ],
  },
  {
    ref: '8D', title: 'Ecological relationships',
    points: [
      { ref: '8D.1', title: 'Ecosystems and biomes' },
      { ref: '8D.2', title: 'Population size and factors affecting it' },
      { ref: '8D.3', title: 'Interdependence and the carbon cycle' },
      { ref: '8D.4', title: 'Human impact and pollution' },
    ],
  },
  {
    ref: '8E', title: 'Atoms and elements',
    points: [
      { ref: '8E.1', title: 'Atomic structure — protons, neutrons and electrons' },
      { ref: '8E.2', title: 'Elements and the periodic table' },
      { ref: '8E.3', title: 'Electronic structure and valency' },
      { ref: '8E.4', title: 'Isotopes and relative atomic mass' },
    ],
  },
  {
    ref: '8F', title: 'Compounds and mixtures',
    points: [
      { ref: '8F.1', title: 'Compounds and chemical formulae' },
      { ref: '8F.2', title: 'Mixtures and methods of separation' },
      { ref: '8F.3', title: 'Filtration and evaporation to dryness' },
      { ref: '8F.4', title: 'Chromatography and distillation' },
    ],
  },
  {
    ref: '8G', title: 'Rocks and weathering',
    points: [
      { ref: '8G.1', title: 'Types of rock — igneous, sedimentary and metamorphic' },
      { ref: '8G.2', title: 'The rock cycle' },
      { ref: '8G.3', title: 'Weathering — physical, chemical and biological' },
      { ref: '8G.4', title: 'Erosion, transport and deposition' },
    ],
  },
  {
    ref: '8H', title: 'Heating and cooling',
    points: [
      { ref: '8H.1', title: 'Temperature and thermometers' },
      { ref: '8H.2', title: 'Conduction' },
      { ref: '8H.3', title: 'Convection' },
      { ref: '8H.4', title: 'Radiation and the factors affecting it' },
    ],
  },
  {
    ref: '8I', title: 'Magnets and electromagnets',
    points: [
      { ref: '8I.1', title: 'Magnetic fields and poles' },
      { ref: '8I.2', title: 'Making and using electromagnets' },
      { ref: '8I.3', title: 'The motor effect' },
      { ref: '8I.4', title: 'Generators and electromagnetic induction' },
    ],
  },
  {
    ref: '8J', title: 'Light',
    points: [
      { ref: '8J.1', title: 'Reflection and the law of reflection' },
      { ref: '8J.2', title: 'Refraction of light' },
      { ref: '8J.3', title: 'Colour and the visible spectrum' },
      { ref: '8J.4', title: 'The eye and seeing' },
    ],
  },
  {
    ref: '8K', title: 'Sound and hearing',
    points: [
      { ref: '8K.1', title: 'How sound is produced and travels' },
      { ref: '8K.2', title: 'Properties of sound waves (amplitude, frequency, pitch)' },
      { ref: '8K.3', title: 'The ear and how we hear' },
      { ref: '8K.4', title: 'Ultrasound and its uses' },
    ],
  },
  {
    ref: '8L', title: 'Space and Earth',
    points: [
      { ref: '8L.1', title: 'The Earth\'s structure (crust, mantle, core)' },
      { ref: '8L.2', title: 'Plate tectonics and continental drift' },
      { ref: '8L.3', title: 'Earthquakes and volcanoes' },
      { ref: '8L.4', title: 'Gravity, tides and the Moon' },
    ],
  },
]

// ── Edexcel GCSE Chemistry (1CH0) ─────────────────────────────────────────────

const edexcelGCSEChemTopics: SpecTopic[] = [
  {
    ref: 'T1', title: 'Key concepts in chemistry',
    points: [
      { ref: '1.1', title: 'Atomic structure (protons, neutrons, electrons)' },
      { ref: '1.2', title: 'The periodic table — groups, periods and properties' },
      { ref: '1.3', title: 'Relative atomic mass and isotopes' },
      { ref: '1.4', title: 'Electronic structure' },
      { ref: '1.5', title: 'Ionic bonding — electron transfer and ionic lattices' },
      { ref: '1.6', title: 'Covalent bonding — electron sharing and molecular structures' },
      { ref: '1.7', title: 'Metallic bonding and properties of metals' },
      { ref: '1.8', title: 'Giant covalent structures (diamond, graphite, graphene)' },
      { ref: '1.9', title: 'States of matter and changes of state' },
      { ref: '1.10', title: 'Pure substances and mixtures — Rf values and melting points' },
    ],
  },
  {
    ref: 'T2', title: 'States of matter and mixtures',
    points: [
      { ref: '2.1', title: 'The particle model — solids, liquids and gases' },
      { ref: '2.2', title: 'Heating and cooling curves' },
      { ref: '2.3', title: 'Filtration, crystallisation and evaporation' },
      { ref: '2.4', title: 'Simple and fractional distillation' },
      { ref: '2.5', title: 'Paper and thin layer chromatography' },
      { ref: '2.6', title: 'Formulations and their uses' },
    ],
  },
  {
    ref: 'T3', title: 'Chemical changes',
    points: [
      { ref: '3.1', title: 'The reactivity series of metals' },
      { ref: '3.2', title: 'Reactions of metals with water and dilute acids' },
      { ref: '3.3', title: 'Displacement reactions' },
      { ref: '3.4', title: 'Oxidation and reduction (redox)' },
      { ref: '3.5', title: 'Acids and alkalis — pH scale and indicators' },
      { ref: '3.6', title: 'Neutralisation and the preparation of salts' },
      { ref: '3.7', title: 'Reactions of acids with metals, bases and carbonates' },
      { ref: '3.8', title: 'Electrolysis — principles and half equations' },
      { ref: '3.9', title: 'Electrolysis of solutions (copper sulfate, brine)' },
    ],
  },
  {
    ref: 'T4', title: 'Extracting metals and equilibria',
    points: [
      { ref: '4.1', title: 'Extraction of iron in the blast furnace' },
      { ref: '4.2', title: 'Extraction of aluminium by electrolysis' },
      { ref: '4.3', title: 'Rusting of iron and methods of prevention' },
      { ref: '4.4', title: 'Alloys and their uses (steel, brass, bronze)' },
      { ref: '4.5', title: 'Life cycle assessment and recycling of materials' },
      { ref: '4.6', title: 'Dynamic equilibrium and Le Chatelier\'s principle (Higher)' },
    ],
  },
  {
    ref: 'T5', title: 'Separate chemistry 1 (Higher tier)',
    points: [
      { ref: '5.1', title: 'Moles and the mole concept (Avogadro\'s number)' },
      { ref: '5.2', title: 'Calculations from equations — reacting quantities' },
      { ref: '5.3', title: 'Percentage yield' },
      { ref: '5.4', title: 'Atom economy' },
      { ref: '5.5', title: 'Concentration of solutions (mol/dm³)' },
      { ref: '5.6', title: 'Acid–base titrations and calculations' },
    ],
  },
  {
    ref: 'T6', title: 'Groups in the periodic table',
    points: [
      { ref: '6.1', title: 'The noble gases (Group 0) — properties and uses' },
      { ref: '6.2', title: 'The alkali metals (Group 1) — reactions and trends' },
      { ref: '6.3', title: 'The halogens (Group 7) — reactions and trends' },
      { ref: '6.4', title: 'Displacement reactions of halogens' },
      { ref: '6.5', title: 'Transition metals — properties and catalysts' },
    ],
  },
  {
    ref: 'T7', title: 'Rates of reaction and energy changes',
    points: [
      { ref: '7.1', title: 'Rates of reaction — measuring and calculating' },
      { ref: '7.2', title: 'Collision theory' },
      { ref: '7.3', title: 'Effect of temperature on rate of reaction' },
      { ref: '7.4', title: 'Effect of concentration and pressure on rate' },
      { ref: '7.5', title: 'Effect of surface area and catalysts' },
      { ref: '7.6', title: 'Exothermic and endothermic reactions' },
      { ref: '7.7', title: 'Energy profile diagrams and activation energy' },
      { ref: '7.8', title: 'Bond energies — calculating energy changes' },
    ],
  },
  {
    ref: 'T8', title: 'Fuels and Earth science',
    points: [
      { ref: '8.1', title: 'Fossil fuels and crude oil' },
      { ref: '8.2', title: 'Fractional distillation of crude oil' },
      { ref: '8.3', title: 'Alkanes — naming, formulae and combustion' },
      { ref: '8.4', title: 'Incomplete combustion and atmospheric pollutants' },
      { ref: '8.5', title: 'Cracking of hydrocarbons (thermal and catalytic)' },
      { ref: '8.6', title: 'The greenhouse effect and climate change' },
      { ref: '8.7', title: 'The carbon cycle' },
      { ref: '8.8', title: 'Potable water — treatment and purification' },
    ],
  },
  {
    ref: 'T9', title: 'Separate chemistry 2 (Higher tier)',
    points: [
      { ref: '9.1', title: 'Alcohols — properties, reactions and uses' },
      { ref: '9.2', title: 'Carboxylic acids — properties and reactions' },
      { ref: '9.3', title: 'Esters — formation and uses' },
      { ref: '9.4', title: 'Addition polymerisation' },
      { ref: '9.5', title: 'Condensation polymerisation' },
      { ref: '9.6', title: 'Natural polymers — proteins, starch and DNA' },
      { ref: '9.7', title: 'Nanoparticles — properties and uses' },
    ],
  },
]

// ── AQA GCSE Physics (8463) ──────────────────────────────────────────────────

const aqaGCSEPhysicsTopics: SpecTopic[] = [
  {
    ref: 'P1', title: 'Energy',
    points: [
      { ref: 'P1.1', title: 'Energy stores and transfers' },
      { ref: 'P1.2', title: 'Conservation and dissipation of energy' },
      { ref: 'P1.3', title: 'National and global energy resources' },
      { ref: 'P1.4', title: 'Calculating energy changes — kinetic, gravitational, elastic' },
      { ref: 'P1.5', title: 'Power — P = E/t' },
      { ref: 'P1.6', title: 'Efficiency of energy transfer' },
    ],
  },
  {
    ref: 'P2', title: 'Electricity',
    points: [
      { ref: 'P2.1', title: 'Standard circuit symbols and diagrams' },
      { ref: 'P2.2', title: 'Electric charge, current and potential difference' },
      { ref: 'P2.3', title: 'Resistance — V = IR' },
      { ref: 'P2.4', title: 'Series and parallel circuits' },
      { ref: 'P2.5', title: 'I–V characteristics — resistor, filament lamp, diode' },
      { ref: 'P2.6', title: 'Electrical power — P = VI' },
      { ref: 'P2.7', title: 'Mains electricity — AC, frequency, UK plug wiring' },
      { ref: 'P2.8', title: 'Static electricity and electric fields' },
    ],
  },
  {
    ref: 'P3', title: 'Particle model of matter',
    points: [
      { ref: 'P3.1', title: 'Density — ρ = m/V' },
      { ref: 'P3.2', title: 'Changes of state and latent heat — Q = mL' },
      { ref: 'P3.3', title: 'Specific heat capacity — Q = mcΔT' },
      { ref: 'P3.4', title: 'Particle model and pressure in gases' },
    ],
  },
  {
    ref: 'P4', title: 'Atomic structure',
    points: [
      { ref: 'P4.1', title: 'Atomic structure — protons, neutrons, electrons, isotopes' },
      { ref: 'P4.2', title: 'Development of the atomic model — plum pudding to nuclear' },
      { ref: 'P4.3', title: 'Radioactive decay — alpha, beta, gamma, half-life' },
      { ref: 'P4.4', title: 'Nuclear equations for alpha and beta decay' },
      { ref: 'P4.5', title: 'Hazards and uses of radioactivity' },
      { ref: 'P4.6', title: 'Nuclear fission and fusion' },
    ],
  },
  {
    ref: 'P5', title: 'Forces',
    points: [
      { ref: 'P5.1', title: 'Scalar and vector quantities; resultant forces' },
      { ref: 'P5.2', title: 'Contact and non-contact forces' },
      { ref: 'P5.3', title: 'Newton\'s First Law — inertia and balanced forces' },
      { ref: 'P5.4', title: 'Newton\'s Second Law — F = ma' },
      { ref: 'P5.5', title: 'Newton\'s Third Law — action–reaction pairs' },
      { ref: 'P5.6', title: 'Stopping distance — thinking and braking distance' },
      { ref: 'P5.7', title: 'Momentum — p = mv and conservation of momentum' },
      { ref: 'P5.8', title: 'Work done and energy transfer — W = Fs' },
      { ref: 'P5.9', title: 'Elasticity — Hooke\'s Law and spring constant' },
      { ref: 'P5.10', title: 'Moments, levers and gears' },
      { ref: 'P5.11', title: 'Pressure — fluids, upthrust and Archimedes\' principle' },
    ],
  },
  {
    ref: 'P6', title: 'Waves',
    points: [
      { ref: 'P6.1', title: 'Transverse and longitudinal waves — properties and examples' },
      { ref: 'P6.2', title: 'Wave equation — v = fλ' },
      { ref: 'P6.3', title: 'Reflection, refraction and sound' },
      { ref: 'P6.4', title: 'The electromagnetic spectrum — properties and uses' },
      { ref: 'P6.5', title: 'Lenses — ray diagrams, focal length, real and virtual images' },
      { ref: 'P6.6', title: 'Colour, filters and absorption of light' },
      { ref: 'P6.7', title: 'Infrared radiation and temperature' },
    ],
  },
  {
    ref: 'P7', title: 'Magnetism and electromagnetism',
    points: [
      { ref: 'P7.1', title: 'Permanent and induced magnetism; field patterns' },
      { ref: 'P7.2', title: 'The motor effect — F = BIL, Fleming\'s Left-Hand Rule' },
      { ref: 'P7.3', title: 'The electric motor and loudspeaker' },
      { ref: 'P7.4', title: 'Electromagnetic induction — Faraday\'s Law' },
      { ref: 'P7.5', title: 'Alternators, generators and microphones' },
      { ref: 'P7.6', title: 'Transformers — step-up, step-down, the National Grid' },
    ],
  },
  {
    ref: 'P8', title: 'Space physics (separate science only)',
    points: [
      { ref: 'P8.1', title: 'The Solar System — structure and scale' },
      { ref: 'P8.2', title: 'The life cycle of stars' },
      { ref: 'P8.3', title: 'Orbital motion — speed, radius and gravitational force' },
      { ref: 'P8.4', title: 'Red-shift and the expanding universe' },
      { ref: 'P8.5', title: 'The Big Bang theory and evidence' },
    ],
  },
]

// ── AQA GCSE Biology (8461) ──────────────────────────────────────────────────

const aqaGCSEBiologyTopics: SpecTopic[] = [
  {
    ref: 'B1', title: 'Cell biology',
    points: [
      { ref: 'B1.1', title: 'Eukaryotic and prokaryotic cells — structure and function' },
      { ref: 'B1.2', title: 'Animal and plant cell structures and their functions' },
      { ref: 'B1.3', title: 'Cell specialisation and differentiation' },
      { ref: 'B1.4', title: 'Microscopy — light microscope, magnification calculations' },
      { ref: 'B1.5', title: 'Mitosis and the cell cycle' },
      { ref: 'B1.6', title: 'Stem cells — therapeutic uses and ethical issues' },
      { ref: 'B1.7', title: 'Transport — diffusion, osmosis and active transport' },
    ],
  },
  {
    ref: 'B2', title: 'Organisation',
    points: [
      { ref: 'B2.1', title: 'Tissues, organs and organ systems' },
      { ref: 'B2.2', title: 'The digestive system — enzymes and digestion' },
      { ref: 'B2.3', title: 'The heart and blood vessels — structure and function' },
      { ref: 'B2.4', title: 'Blood components and their functions' },
      { ref: 'B2.5', title: 'Non-communicable diseases — risk factors and correlation' },
      { ref: 'B2.6', title: 'Cancer — tumour types, risk factors, treatment' },
      { ref: 'B2.7', title: 'Plant organisation — roots, stems, leaves; transpiration' },
    ],
  },
  {
    ref: 'B3', title: 'Infection and response',
    points: [
      { ref: 'B3.1', title: 'Communicable diseases — bacteria, viruses, fungi, protists' },
      { ref: 'B3.2', title: 'Viral diseases — measles, HIV, TMV' },
      { ref: 'B3.3', title: 'Bacterial diseases — Salmonella, Gonorrhoea' },
      { ref: 'B3.4', title: 'The human immune system — phagocytosis, antibodies, memory cells' },
      { ref: 'B3.5', title: 'Vaccination — herd immunity, pros and cons' },
      { ref: 'B3.6', title: 'Antibiotics and antibiotic resistance' },
      { ref: 'B3.7', title: 'Drug discovery and clinical trials' },
    ],
  },
  {
    ref: 'B4', title: 'Bioenergetics',
    points: [
      { ref: 'B4.1', title: 'Photosynthesis — equation and limiting factors' },
      { ref: 'B4.2', title: 'Uses of glucose in plants' },
      { ref: 'B4.3', title: 'Factors affecting rate of photosynthesis — light, CO₂, temperature' },
      { ref: 'B4.4', title: 'Aerobic respiration — equation and uses of energy' },
      { ref: 'B4.5', title: 'Anaerobic respiration — fermentation and lactic acid' },
      { ref: 'B4.6', title: 'Response to exercise — heart rate, breathing rate, oxygen debt' },
    ],
  },
  {
    ref: 'B5', title: 'Homeostasis and response',
    points: [
      { ref: 'B5.1', title: 'Homeostasis — the principle of negative feedback' },
      { ref: 'B5.2', title: 'The nervous system — receptors, CNS, effectors, reflex arc' },
      { ref: 'B5.3', title: 'Hormones and the endocrine system — glands and hormones' },
      { ref: 'B5.4', title: 'Control of blood glucose — insulin, glucagon, diabetes' },
      { ref: 'B5.5', title: 'Controlling body temperature — vasodilation, shivering' },
      { ref: 'B5.6', title: 'Reproduction — the menstrual cycle, FSH, LH, oestrogen' },
      { ref: 'B5.7', title: 'Contraception — hormonal and non-hormonal methods' },
      { ref: 'B5.8', title: 'The kidney — filtration, reabsorption, urine production' },
    ],
  },
  {
    ref: 'B6', title: 'Inheritance, variation and evolution',
    points: [
      { ref: 'B6.1', title: 'Sexual and asexual reproduction — advantages and disadvantages' },
      { ref: 'B6.2', title: 'DNA, genes and chromosomes' },
      { ref: 'B6.3', title: 'Mitosis and meiosis compared' },
      { ref: 'B6.4', title: 'Inheritance — dominant, recessive; Punnett squares' },
      { ref: 'B6.5', title: 'Inherited disorders — cystic fibrosis, polydactyly' },
      { ref: 'B6.6', title: 'Natural selection and evolution' },
      { ref: 'B6.7', title: 'Genetic engineering — pros, cons, applications' },
      { ref: 'B6.8', title: 'Classification — kingdoms, species concept, evolutionary trees' },
    ],
  },
  {
    ref: 'B7', title: 'Ecology',
    points: [
      { ref: 'B7.1', title: 'Ecosystems — abiotic and biotic factors' },
      { ref: 'B7.2', title: 'Sampling techniques — quadrats and transects' },
      { ref: 'B7.3', title: 'Food chains, food webs and energy transfer' },
      { ref: 'B7.4', title: 'The carbon cycle' },
      { ref: 'B7.5', title: 'The water cycle and nitrogen cycle' },
      { ref: 'B7.6', title: 'Biodiversity — threats and conservation' },
      { ref: 'B7.7', title: 'Global warming — causes, effects and solutions' },
      { ref: 'B7.8', title: 'Decomposition — factors affecting decay rates' },
    ],
  },
]

// ── AQA GCSE Chemistry (8462) ────────────────────────────────────────────────

const aqaGCSEChemistryTopics: SpecTopic[] = [
  {
    ref: 'C1', title: 'Atomic structure and the periodic table',
    points: [
      { ref: 'C1.1', title: 'Atomic structure — protons, neutrons, electrons' },
      { ref: 'C1.2', title: 'Atoms, elements and compounds' },
      { ref: 'C1.3', title: 'Isotopes and relative atomic mass' },
      { ref: 'C1.4', title: 'Electronic structure — shells and sub-shells' },
      { ref: 'C1.5', title: 'The periodic table — groups, periods and properties' },
      { ref: 'C1.6', title: 'Metals and non-metals — properties and reactivity' },
      { ref: 'C1.7', title: 'Group 1 — alkali metals; Group 7 — halogens; Group 0 — noble gases' },
    ],
  },
  {
    ref: 'C2', title: 'Bonding, structure and properties',
    points: [
      { ref: 'C2.1', title: 'Ionic bonding — electron transfer, ionic lattices' },
      { ref: 'C2.2', title: 'Covalent bonding — electron sharing, molecular and giant structures' },
      { ref: 'C2.3', title: 'Metallic bonding and properties of metals' },
      { ref: 'C2.4', title: 'Giant covalent structures — diamond, graphite, graphene' },
      { ref: 'C2.5', title: 'Nanoparticles — properties and uses' },
    ],
  },
  {
    ref: 'C3', title: 'Quantitative chemistry',
    points: [
      { ref: 'C3.1', title: 'Conservation of mass and balancing equations' },
      { ref: 'C3.2', title: 'Relative formula mass (Mr) calculations' },
      { ref: 'C3.3', title: 'The mole — Avogadro\'s number, molar mass' },
      { ref: 'C3.4', title: 'Reacting masses and limiting reactants' },
      { ref: 'C3.5', title: 'Percentage yield and atom economy' },
      { ref: 'C3.6', title: 'Concentrations of solutions (g/dm³ and mol/dm³)' },
    ],
  },
  {
    ref: 'C4', title: 'Chemical changes',
    points: [
      { ref: 'C4.1', title: 'Reactivity series and metal extraction' },
      { ref: 'C4.2', title: 'Oxidation and reduction in terms of oxygen and electrons' },
      { ref: 'C4.3', title: 'Acids and alkalis — pH, indicators, neutralisation' },
      { ref: 'C4.4', title: 'Preparation of salts — from acids and bases/carbonates' },
      { ref: 'C4.5', title: 'Electrolysis — principles, products and half-equations' },
      { ref: 'C4.6', title: 'Electrolysis of solutions — chlorine, hydrogen, oxygen' },
    ],
  },
  {
    ref: 'C5', title: 'Energy changes',
    points: [
      { ref: 'C5.1', title: 'Exothermic and endothermic reactions' },
      { ref: 'C5.2', title: 'Energy profile diagrams — activation energy' },
      { ref: 'C5.3', title: 'Bond energies — calculating ΔH' },
      { ref: 'C5.4', title: 'Cells and fuel cells — energy from electrochemical reactions' },
    ],
  },
  {
    ref: 'C6', title: 'Rate of reaction and equilibrium',
    points: [
      { ref: 'C6.1', title: 'Measuring rate of reaction — mass, volume, colour' },
      { ref: 'C6.2', title: 'Collision theory — concentration, temperature, surface area, catalysts' },
      { ref: 'C6.3', title: 'Reversible reactions and dynamic equilibrium' },
      { ref: 'C6.4', title: 'Le Chatelier\'s principle — shifting equilibrium' },
    ],
  },
  {
    ref: 'C7', title: 'Organic chemistry',
    points: [
      { ref: 'C7.1', title: 'Crude oil, hydrocarbons and fractional distillation' },
      { ref: 'C7.2', title: 'Alkanes — structure, naming, combustion' },
      { ref: 'C7.3', title: 'Cracking and alkenes' },
      { ref: 'C7.4', title: 'Alcohols — structure, properties, fermentation' },
      { ref: 'C7.5', title: 'Carboxylic acids — properties and reactions' },
      { ref: 'C7.6', title: 'Addition and condensation polymerisation' },
    ],
  },
  {
    ref: 'C8', title: 'Chemical analysis',
    points: [
      { ref: 'C8.1', title: 'Pure substances and formulations — melting point tests' },
      { ref: 'C8.2', title: 'Chromatography — Rf values and interpretation' },
      { ref: 'C8.3', title: 'Flame tests — identifying metal ions' },
      { ref: 'C8.4', title: 'Chemical tests for ions — hydroxide precipitates, carbonates, halides' },
    ],
  },
  {
    ref: 'C9', title: 'Chemistry of the atmosphere',
    points: [
      { ref: 'C9.1', title: 'Earth\'s early atmosphere — composition and change over time' },
      { ref: 'C9.2', title: 'The carbon cycle and greenhouse gases' },
      { ref: 'C9.3', title: 'Climate change — evidence and consequences' },
      { ref: 'C9.4', title: 'Atmospheric pollutants — NOₓ, SO₂, CO, particulates' },
    ],
  },
  {
    ref: 'C10', title: 'Using resources',
    points: [
      { ref: 'C10.1', title: 'Finite and renewable resources; sustainability' },
      { ref: 'C10.2', title: 'Potable water — treatment methods' },
      { ref: 'C10.3', title: 'Waste water treatment' },
      { ref: 'C10.4', title: 'Corrosion — rusting, prevention methods' },
      { ref: 'C10.5', title: 'Alloys — properties and uses' },
      { ref: 'C10.6', title: 'Life cycle assessment and recycling' },
    ],
  },
]

// ── OCR Gateway GCSE Physics (J249) ──────────────────────────────────────────

const ocrGatewayGCSEPhysicsTopics: SpecTopic[] = [
  {
    ref: 'P1', title: 'Matter',
    points: [
      { ref: 'P1a', title: 'The particle model — states of matter and changes of state' },
      { ref: 'P1b', title: 'Pressure — in gases and fluids' },
      { ref: 'P1c', title: 'Density and upthrust' },
    ],
  },
  {
    ref: 'P2', title: 'Forces',
    points: [
      { ref: 'P2a', title: 'Motion — distance, speed, velocity and acceleration' },
      { ref: 'P2b', title: 'Newton\'s Laws and resultant forces' },
      { ref: 'P2c', title: 'Work, energy and power' },
      { ref: 'P2d', title: 'Momentum and its conservation' },
      { ref: 'P2e', title: 'Stopping distances and reaction time' },
    ],
  },
  {
    ref: 'P3', title: 'Electricity',
    points: [
      { ref: 'P3a', title: 'Circuits — current, voltage and resistance' },
      { ref: 'P3b', title: 'Series and parallel circuits' },
      { ref: 'P3c', title: 'Electrical power and energy' },
      { ref: 'P3d', title: 'Static electricity and electric fields' },
      { ref: 'P3e', title: 'Mains electricity — hazards and safety' },
    ],
  },
  {
    ref: 'P4', title: 'Magnetism and magnetic effects of current',
    points: [
      { ref: 'P4a', title: 'Magnetic fields — permanent magnets and field patterns' },
      { ref: 'P4b', title: 'The motor effect — F = BIL' },
      { ref: 'P4c', title: 'Electromagnetic induction and transformers' },
    ],
  },
  {
    ref: 'P5', title: 'Waves in matter',
    points: [
      { ref: 'P5a', title: 'Wave properties — amplitude, frequency, wavelength, speed' },
      { ref: 'P5b', title: 'The electromagnetic spectrum — properties and uses' },
      { ref: 'P5c', title: 'Reflection, refraction and total internal reflection' },
      { ref: 'P5d', title: 'Sound — transmission, echo and ultrasound' },
    ],
  },
  {
    ref: 'P6', title: 'Radioactive emissions',
    points: [
      { ref: 'P6a', title: 'Atomic structure — the nucleus and electrons' },
      { ref: 'P6b', title: 'Radioactive decay — alpha, beta, gamma; half-life' },
      { ref: 'P6c', title: 'Uses and hazards of ionising radiation' },
      { ref: 'P6d', title: 'Nuclear fission and fusion' },
    ],
  },
  {
    ref: 'P7', title: 'Energy',
    points: [
      { ref: 'P7a', title: 'Energy stores, transfers and dissipation' },
      { ref: 'P7b', title: 'Efficiency and reducing energy losses' },
      { ref: 'P7c', title: 'Renewable and non-renewable energy resources' },
      { ref: 'P7d', title: 'The National Grid — transmission and transformers' },
    ],
  },
  {
    ref: 'P8', title: 'Global challenges (separate physics only)',
    points: [
      { ref: 'P8a', title: 'Astronomy — the Solar System, stars and galaxies' },
      { ref: 'P8b', title: 'Life cycle of stars' },
      { ref: 'P8c', title: 'Space exploration and communication technologies' },
    ],
  },
]

// ── OCR Gateway GCSE Biology (J247) ──────────────────────────────────────────

const ocrGatewayGCSEBiologyTopics: SpecTopic[] = [
  {
    ref: 'B1', title: 'Cell-level systems',
    points: [
      { ref: 'B1a', title: 'Cell structures — animal, plant, bacterial and eukaryotic cells' },
      { ref: 'B1b', title: 'What do cells do? — cell activities and specialisation' },
      { ref: 'B1c', title: 'Cell division — mitosis, meiosis, stem cells' },
      { ref: 'B1d', title: 'Microscopy — magnification and resolution' },
    ],
  },
  {
    ref: 'B2', title: 'Scaling up',
    points: [
      { ref: 'B2a', title: 'Supplying the cell — diffusion, osmosis and active transport' },
      { ref: 'B2b', title: 'The circulatory system — heart, blood and blood vessels' },
      { ref: 'B2c', title: 'Breathing — gas exchange in the lungs' },
      { ref: 'B2d', title: 'Digestion — enzymes and absorption' },
    ],
  },
  {
    ref: 'B3', title: 'Organism-level systems',
    points: [
      { ref: 'B3a', title: 'Coordination and control — nervous and hormonal systems' },
      { ref: 'B3b', title: 'Homeostasis — thermoregulation, blood glucose control' },
      { ref: 'B3c', title: 'The kidney — filtration, reabsorption and dialysis' },
      { ref: 'B3d', title: 'Reproduction — hormones, IVF and contraception' },
      { ref: 'B3e', title: 'Plant hormones — auxins and tropisms' },
    ],
  },
  {
    ref: 'B4', title: 'Community-level systems',
    points: [
      { ref: 'B4a', title: 'Ecosystems — biotic and abiotic factors' },
      { ref: 'B4b', title: 'Food production — energy transfers and farming practices' },
      { ref: 'B4c', title: 'Nutrient cycles — carbon and nitrogen cycles' },
      { ref: 'B4d', title: 'Biodiversity and conservation' },
    ],
  },
  {
    ref: 'B5', title: 'Genetics and evolution',
    points: [
      { ref: 'B5a', title: 'DNA — structure, genes and the genetic code' },
      { ref: 'B5b', title: 'Inheritance — alleles, dominance, Punnett squares' },
      { ref: 'B5c', title: 'Natural selection and evolution — Darwin\'s theory' },
      { ref: 'B5d', title: 'Classification — taxonomy, phylogenetic trees' },
      { ref: 'B5e', title: 'Genetic engineering and selective breeding' },
    ],
  },
  {
    ref: 'B6', title: 'Global challenges',
    points: [
      { ref: 'B6a', title: 'Infectious diseases — bacteria, viruses, fungi and protists' },
      { ref: 'B6b', title: 'Immunity — vaccines, antibodies and antibiotics' },
      { ref: 'B6c', title: 'Photosynthesis — rate factors and the plant\'s use of glucose' },
      { ref: 'B6d', title: 'Respiration — aerobic and anaerobic' },
      { ref: 'B6e', title: 'Human impact on ecosystems and climate change' },
    ],
  },
]

// ── OCR Gateway GCSE Chemistry (J248) ────────────────────────────────────────

const ocrGatewayGCSEChemistryTopics: SpecTopic[] = [
  {
    ref: 'C1', title: 'Particles',
    points: [
      { ref: 'C1a', title: 'The particle model — solids, liquids and gases' },
      { ref: 'C1b', title: 'Atomic structure — protons, neutrons, electrons and isotopes' },
      { ref: 'C1c', title: 'Elements, compounds and mixtures — formulas and equations' },
      { ref: 'C1d', title: 'Electronic structure and the periodic table' },
    ],
  },
  {
    ref: 'C2', title: 'Elements, compounds and mixtures',
    points: [
      { ref: 'C2a', title: 'Purity and separation — filtration, distillation, chromatography' },
      { ref: 'C2b', title: 'Ionic bonding — electron transfer and properties' },
      { ref: 'C2c', title: 'Covalent bonding — molecular and giant structures' },
      { ref: 'C2d', title: 'Metallic bonding and alloys' },
      { ref: 'C2e', title: 'Nanoparticles and their properties' },
    ],
  },
  {
    ref: 'C3', title: 'Chemical reactions',
    points: [
      { ref: 'C3a', title: 'Balancing equations and conservation of mass' },
      { ref: 'C3b', title: 'Reactions with acids — neutralisation and salt preparation' },
      { ref: 'C3c', title: 'Oxidation and reduction — redox reactions' },
      { ref: 'C3d', title: 'Reactivity series and metal extraction' },
      { ref: 'C3e', title: 'Electrolysis — principles and products' },
    ],
  },
  {
    ref: 'C4', title: 'Predicting and identifying reactions and products',
    points: [
      { ref: 'C4a', title: 'Group 1, 7 and 0 — properties and trends' },
      { ref: 'C4b', title: 'Tests for ions — flame tests, precipitates' },
      { ref: 'C4c', title: 'Exothermic and endothermic reactions; energy profiles' },
      { ref: 'C4d', title: 'Bond energies — calculating energy changes' },
    ],
  },
  {
    ref: 'C5', title: 'Monitoring and controlling chemical reactions',
    points: [
      { ref: 'C5a', title: 'Rate of reaction — collision theory and factors affecting rate' },
      { ref: 'C5b', title: 'Calculations — moles, reacting masses, percentage yield and atom economy' },
      { ref: 'C5c', title: 'Reversible reactions and dynamic equilibrium' },
    ],
  },
  {
    ref: 'C6', title: 'Global challenges',
    points: [
      { ref: 'C6a', title: 'Organic chemistry — alkanes, alkenes, alcohols and cracking' },
      { ref: 'C6b', title: 'Crude oil and sustainable development' },
      { ref: 'C6c', title: 'The Earth\'s atmosphere — past, present and future' },
      { ref: 'C6d', title: 'Water — treatment and sustainability' },
      { ref: 'C6e', title: 'Life cycle assessment and using resources sustainably' },
    ],
  },
]

// ── Edexcel GCSE Biology (1BI0) ──────────────────────────────────────────────

const edexcelGCSEBiologyTopics: SpecTopic[] = [
  {
    ref: 'T1', title: 'Key concepts in biology',
    points: [
      { ref: '1.1', title: 'Plant and animal cell structures and functions' },
      { ref: '1.2', title: 'Biological molecules — carbohydrates, lipids, proteins, DNA' },
      { ref: '1.3', title: 'Enzymes — structure, activity, factors affecting rate' },
      { ref: '1.4', title: 'Transport — diffusion, osmosis and active transport' },
      { ref: '1.5', title: 'Microscopy — magnification, resolution and calculations' },
    ],
  },
  {
    ref: 'T2', title: 'Cells and control',
    points: [
      { ref: '2.1', title: 'Mitosis — stages, purpose and chromosomes' },
      { ref: '2.2', title: 'Growth and differentiation — stem cells' },
      { ref: '2.3', title: 'The nervous system — receptors, neurones, reflex arcs' },
      { ref: '2.4', title: 'Neurotransmitters and synapses' },
    ],
  },
  {
    ref: 'T3', title: 'Genetics',
    points: [
      { ref: '3.1', title: 'Meiosis — halving chromosome number for gametes' },
      { ref: '3.2', title: 'DNA structure — base pairing, the double helix' },
      { ref: '3.3', title: 'Protein synthesis — transcription and translation' },
      { ref: '3.4', title: 'Mutations — causes, types and consequences' },
      { ref: '3.5', title: 'Inheritance — alleles, genotypes, phenotypes, Punnett squares' },
      { ref: '3.6', title: 'Genetic disorders — cystic fibrosis, sickle-cell disease' },
    ],
  },
  {
    ref: 'T4', title: 'Natural selection and genetic modification',
    points: [
      { ref: '4.1', title: 'Variation — genetic, environmental and random mutation' },
      { ref: '4.2', title: 'Evolution — natural selection and evidence' },
      { ref: '4.3', title: 'Classification — Linnaeus and phylogenetic trees' },
      { ref: '4.4', title: 'Selective breeding and genetic modification (GMOs)' },
      { ref: '4.5', title: 'Cloning — natural and artificial, advantages and risks' },
    ],
  },
  {
    ref: 'T5', title: 'Health, disease and medicine',
    points: [
      { ref: '5.1', title: 'Health — physical, mental and social dimensions' },
      { ref: '5.2', title: 'Communicable diseases — bacteria, viruses, fungi, protists' },
      { ref: '5.3', title: 'STIs and spread of disease — HIV/AIDS' },
      { ref: '5.4', title: 'The immune system — phagocytes, antibodies, memory cells' },
      { ref: '5.5', title: 'Vaccines and immunisation' },
      { ref: '5.6', title: 'Medicines — development, clinical trials, antibiotics and resistance' },
      { ref: '5.7', title: 'Non-communicable diseases — cancer, cardiovascular disease' },
    ],
  },
  {
    ref: 'T6', title: 'Plant structures and their functions',
    points: [
      { ref: '6.1', title: 'Photosynthesis — equation, limiting factors and investigations' },
      { ref: '6.2', title: 'Plant tissues — xylem, phloem and meristems' },
      { ref: '6.3', title: 'Water and mineral transport — transpiration and factors affecting it' },
      { ref: '6.4', title: 'Plant hormones — auxins, gibberellins and abscisic acid' },
    ],
  },
  {
    ref: 'T7', title: 'Animal coordination, control and homeostasis',
    points: [
      { ref: '7.1', title: 'Hormones — glands, blood transport and target organs' },
      { ref: '7.2', title: 'Blood glucose control — insulin, glucagon and diabetes' },
      { ref: '7.3', title: 'Thermoregulation — vasodilation, sweating and shivering' },
      { ref: '7.4', title: 'Reproductive hormones — menstrual cycle, contraception and IVF' },
      { ref: '7.5', title: 'Excretion — the kidney, filtration, reabsorption and ADH' },
    ],
  },
  {
    ref: 'T8', title: 'Exchange and transport in animals',
    points: [
      { ref: '8.1', title: 'The circulatory system — heart structure and function' },
      { ref: '8.2', title: 'Blood — plasma, red and white blood cells, platelets' },
      { ref: '8.3', title: 'Gas exchange — alveoli structure and the lungs' },
      { ref: '8.4', title: 'Aerobic and anaerobic respiration — equations and applications' },
    ],
  },
  {
    ref: 'T9', title: 'Ecosystems and material cycles',
    points: [
      { ref: '9.1', title: 'Ecosystems — biotic and abiotic factors, carrying capacity' },
      { ref: '9.2', title: 'Biodiversity — importance and threats' },
      { ref: '9.3', title: 'Food chains and energy transfer — biomass pyramids' },
      { ref: '9.4', title: 'The carbon cycle and global warming' },
      { ref: '9.5', title: 'The nitrogen cycle — decomposers, nitrification and denitrification' },
      { ref: '9.6', title: 'Decomposition — decay rates and the role of microorganisms' },
    ],
  },
]

// ── WJEC GCSE Physics ─────────────────────────────────────────────────────────

const wjecGCSEPhysicsTopics: SpecTopic[] = [
  {
    ref: 'U1', title: 'Motion, forces and energy',
    points: [
      { ref: '1.1', title: 'Speed, velocity and acceleration — equations and graphs' },
      { ref: '1.2', title: 'Newton\'s Laws of Motion' },
      { ref: '1.3', title: 'Momentum and its conservation' },
      { ref: '1.4', title: 'Work, power and energy — W = Fs, P = W/t' },
      { ref: '1.5', title: 'Energy resources — fossil fuels, renewable and non-renewable' },
      { ref: '1.6', title: 'Thermal physics — specific heat capacity and latent heat' },
    ],
  },
  {
    ref: 'U2', title: 'Waves',
    points: [
      { ref: '2.1', title: 'Properties of waves — speed, frequency, wavelength and amplitude' },
      { ref: '2.2', title: 'Reflection, refraction and diffraction' },
      { ref: '2.3', title: 'The electromagnetic spectrum — properties and uses' },
      { ref: '2.4', title: 'Sound and ultrasound' },
      { ref: '2.5', title: 'Seismic waves and the structure of the Earth' },
    ],
  },
  {
    ref: 'U3', title: 'Electricity',
    points: [
      { ref: '3.1', title: 'Current, voltage and resistance — V = IR' },
      { ref: '3.2', title: 'Series and parallel circuits' },
      { ref: '3.3', title: 'Electrical power and energy — P = VI' },
      { ref: '3.4', title: 'Mains electricity — AC/DC, the UK plug, safety' },
      { ref: '3.5', title: 'Static electricity and electric fields' },
    ],
  },
  {
    ref: 'U4', title: 'Electromagnetism',
    points: [
      { ref: '4.1', title: 'Magnetic fields — permanent magnets and field patterns' },
      { ref: '4.2', title: 'Electromagnetic induction — Faraday\'s Law' },
      { ref: '4.3', title: 'Transformers — step-up and step-down, the National Grid' },
      { ref: '4.4', title: 'The motor effect and electric motors' },
    ],
  },
  {
    ref: 'U5', title: 'Radioactivity',
    points: [
      { ref: '5.1', title: 'Structure of the atom — protons, neutrons and electrons' },
      { ref: '5.2', title: 'Alpha, beta and gamma radiation — properties and penetration' },
      { ref: '5.3', title: 'Half-life and radioactive decay calculations' },
      { ref: '5.4', title: 'Uses and hazards of ionising radiation' },
      { ref: '5.5', title: 'Nuclear fission and fusion' },
    ],
  },
  {
    ref: 'U6', title: 'Particles and the Universe (separate physics only)',
    points: [
      { ref: '6.1', title: 'The Solar System — planets, moons and orbits' },
      { ref: '6.2', title: 'Stellar evolution — life cycle of stars' },
      { ref: '6.3', title: 'The expanding universe — red-shift and the Big Bang' },
      { ref: '6.4', title: 'The particle model revisited — gas pressure and temperature' },
    ],
  },
]

// ── WJEC GCSE Biology ─────────────────────────────────────────────────────────

const wjecGCSEBiologyTopics: SpecTopic[] = [
  {
    ref: 'B1', title: 'Cell biology and organisation',
    points: [
      { ref: 'B1.1', title: 'Animal, plant and bacterial cell structures' },
      { ref: 'B1.2', title: 'Cell specialisation and differentiation' },
      { ref: 'B1.3', title: 'Transport — diffusion, osmosis and active transport' },
      { ref: 'B1.4', title: 'Mitosis and meiosis' },
      { ref: 'B1.5', title: 'Tissues, organs and organ systems' },
    ],
  },
  {
    ref: 'B2', title: 'Biodiversity and classification',
    points: [
      { ref: 'B2.1', title: 'Classification systems — kingdoms and phylogenetic trees' },
      { ref: 'B2.2', title: 'Adaptations and natural selection' },
      { ref: 'B2.3', title: 'Biodiversity — importance, threats and conservation' },
      { ref: 'B2.4', title: 'Sampling techniques — quadrats and transects' },
    ],
  },
  {
    ref: 'B3', title: 'Genetics and evolution',
    points: [
      { ref: 'B3.1', title: 'DNA structure and the genetic code' },
      { ref: 'B3.2', title: 'Protein synthesis — transcription and translation' },
      { ref: 'B3.3', title: 'Inheritance — dominant and recessive alleles, Punnett squares' },
      { ref: 'B3.4', title: 'Variation — genetic, environmental and mutation' },
      { ref: 'B3.5', title: 'Evolution — evidence and mechanisms' },
    ],
  },
  {
    ref: 'B4', title: 'Health, disease and medicine',
    points: [
      { ref: 'B4.1', title: 'Communicable diseases — bacteria, viruses, fungi and protists' },
      { ref: 'B4.2', title: 'The immune system — phagocytosis, antibodies, vaccines' },
      { ref: 'B4.3', title: 'Non-communicable diseases — cancer, cardiovascular disease' },
      { ref: 'B4.4', title: 'Drugs — development, trials, antibiotics and resistance' },
    ],
  },
  {
    ref: 'B5', title: 'Ecosystems and environmental biology',
    points: [
      { ref: 'B5.1', title: 'Food chains, food webs and energy transfer' },
      { ref: 'B5.2', title: 'The carbon and nitrogen cycles' },
      { ref: 'B5.3', title: 'Human impact — deforestation, pollution and global warming' },
      { ref: 'B5.4', title: 'Conservation strategies and endangered species' },
    ],
  },
  {
    ref: 'B6', title: 'Homeostasis and the nervous system',
    points: [
      { ref: 'B6.1', title: 'The nervous system — CNS, peripheral nervous system, reflex arc' },
      { ref: 'B6.2', title: 'Hormones — glands, blood transport and target organs' },
      { ref: 'B6.3', title: 'Blood glucose control — insulin, glucagon, diabetes' },
      { ref: 'B6.4', title: 'Thermoregulation and water balance' },
      { ref: 'B6.5', title: 'Photosynthesis and respiration — equations and energy flow' },
    ],
  },
]

// ── WJEC GCSE Chemistry ──────────────────────────────────────────────────────

const wjecGCSEChemistryTopics: SpecTopic[] = [
  {
    ref: 'C1', title: 'Atomic structure and the periodic table',
    points: [
      { ref: 'C1.1', title: 'Structure of the atom — protons, neutrons, electrons' },
      { ref: 'C1.2', title: 'Isotopes and relative atomic mass' },
      { ref: 'C1.3', title: 'Electronic structure and the periodic table — groups and periods' },
      { ref: 'C1.4', title: 'Metals and non-metals; Group 1, 7 and 0 trends' },
    ],
  },
  {
    ref: 'C2', title: 'Chemical bonding and structure',
    points: [
      { ref: 'C2.1', title: 'Ionic bonding — electron transfer and ionic lattices' },
      { ref: 'C2.2', title: 'Covalent bonding — molecular and giant covalent structures' },
      { ref: 'C2.3', title: 'Metallic bonding — sea of electrons model' },
      { ref: 'C2.4', title: 'Properties of materials linked to bonding type' },
    ],
  },
  {
    ref: 'C3', title: 'Chemical calculations',
    points: [
      { ref: 'C3.1', title: 'Relative formula mass and conservation of mass' },
      { ref: 'C3.2', title: 'The mole — molar mass and Avogadro\'s number' },
      { ref: 'C3.3', title: 'Percentage yield and atom economy' },
      { ref: 'C3.4', title: 'Concentration — mol/dm³ calculations' },
    ],
  },
  {
    ref: 'C4', title: 'Chemical reactions',
    points: [
      { ref: 'C4.1', title: 'Rate of reaction — collision theory and factors' },
      { ref: 'C4.2', title: 'Reversible reactions and equilibrium' },
      { ref: 'C4.3', title: 'Exothermic and endothermic reactions — bond energies' },
      { ref: 'C4.4', title: 'Electrolysis — principles, products and half-equations' },
    ],
  },
  {
    ref: 'C5', title: 'Acids, bases and salts',
    points: [
      { ref: 'C5.1', title: 'Acids and alkalis — pH scale and indicators' },
      { ref: 'C5.2', title: 'Neutralisation and preparation of salts' },
      { ref: 'C5.3', title: 'Reactivity series and metal reactions with acids' },
      { ref: 'C5.4', title: 'Tests for ions — flame tests and precipitates' },
    ],
  },
  {
    ref: 'C6', title: 'Organic chemistry',
    points: [
      { ref: 'C6.1', title: 'Crude oil — fractional distillation and fractions' },
      { ref: 'C6.2', title: 'Alkanes and alkenes — naming, structures, reactions' },
      { ref: 'C6.3', title: 'Combustion and atmospheric pollution' },
      { ref: 'C6.4', title: 'Polymerisation — addition and condensation polymers' },
    ],
  },
  {
    ref: 'C7', title: 'Water and the atmosphere',
    points: [
      { ref: 'C7.1', title: 'Earth\'s early atmosphere — evolution and composition' },
      { ref: 'C7.2', title: 'The greenhouse effect and climate change' },
      { ref: 'C7.3', title: 'Potable water — treatment methods' },
      { ref: 'C7.4', title: 'Atmospheric pollutants — causes and effects' },
    ],
  },
  {
    ref: 'C8', title: 'Using and choosing materials',
    points: [
      { ref: 'C8.1', title: 'Metals — extraction, alloys and corrosion prevention' },
      { ref: 'C8.2', title: 'Life cycle assessment and recycling' },
      { ref: 'C8.3', title: 'Nanoparticles and smart materials' },
      { ref: 'C8.4', title: 'Sustainable chemistry and green principles' },
    ],
  },
]

// ── AQA A Level Physics (7408) ────────────────────────────────────────────────

const aqaALevelPhysicsTopics: SpecTopic[] = [
  {
    ref: '1', title: 'Measurements and their errors',
    points: [
      { ref: '1.1', title: 'SI units — base and derived units, prefixes' },
      { ref: '1.2', title: 'Limitations of physical measurements — systematic and random errors' },
      { ref: '1.3', title: 'Uncertainties — absolute, percentage; propagating through calculations' },
      { ref: '1.4', title: 'Significant figures, accuracy and precision' },
    ],
  },
  {
    ref: '2', title: 'Particles and radiation',
    points: [
      { ref: '2.1', title: 'Constituents of the atom — protons, neutrons, electrons' },
      { ref: '2.2', title: 'Stable and unstable nuclei — radioactive decay' },
      { ref: '2.3', title: 'Particles, antiparticles and photons' },
      { ref: '2.4', title: 'Particle interactions — four fundamental forces and exchange particles' },
      { ref: '2.5', title: 'Classification of particles — leptons, hadrons, quarks, mesons, baryons' },
      { ref: '2.6', title: 'The photoelectric effect — threshold frequency, work function, stopping potential' },
      { ref: '2.7', title: 'Wave–particle duality — de Broglie wavelength λ = h/mv' },
      { ref: '2.8', title: 'Energy levels in atoms — emission and absorption spectra' },
    ],
  },
  {
    ref: '3', title: 'Waves',
    points: [
      { ref: '3.1', title: 'Progressive waves — displacement, amplitude, wavelength, frequency, phase' },
      { ref: '3.2', title: 'Transverse and longitudinal waves; polarisation' },
      { ref: '3.3', title: 'Superposition — path difference, interference and coherence' },
      { ref: '3.4', title: 'Stationary waves — formation, nodes, antinodes and harmonics' },
      { ref: '3.5', title: 'Diffraction — single slit and diffraction gratings (nλ = d sinθ)' },
      { ref: '3.6', title: 'Refraction — Snell\'s Law, total internal reflection, critical angle' },
    ],
  },
  {
    ref: '4', title: 'Mechanics and materials',
    points: [
      { ref: '4.1', title: 'Scalars and vectors — addition, resolution into components' },
      { ref: '4.2', title: 'Moments — couples, torques and equilibrium conditions' },
      { ref: '4.3', title: 'Linear motion — suvat equations and projectile motion' },
      { ref: '4.4', title: 'Newton\'s Laws and momentum — impulse = FΔt' },
      { ref: '4.5', title: 'Work, energy and power — conservation of energy' },
      { ref: '4.6', title: 'Bulk properties of solids — stress, strain, Young modulus' },
      { ref: '4.7', title: 'The Young modulus — measuring it, stress–strain graphs' },
    ],
  },
  {
    ref: '5', title: 'Electricity',
    points: [
      { ref: '5.1', title: 'Charge, current and Kirchhoff\'s First Law' },
      { ref: '5.2', title: 'Potential difference and EMF' },
      { ref: '5.3', title: 'Resistance — Ohm\'s Law, resistivity ρ = RA/L' },
      { ref: '5.4', title: 'I–V characteristics — ohmic, filament, NTC thermistor, diode' },
      { ref: '5.5', title: 'Series and parallel circuits — Kirchhoff\'s Laws' },
      { ref: '5.6', title: 'EMF and internal resistance — ε = I(R + r)' },
      { ref: '5.7', title: 'Potential dividers — circuit calculations' },
    ],
  },
  {
    ref: '6', title: 'Further mechanics and thermal physics',
    points: [
      { ref: '6.1', title: 'Circular motion — angular velocity, centripetal acceleration and force' },
      { ref: '6.2', title: 'Simple harmonic motion — a = −ω²x; energy in SHM' },
      { ref: '6.3', title: 'Resonance and damping' },
      { ref: '6.4', title: 'Thermal energy transfer — conduction, convection, radiation' },
      { ref: '6.5', title: 'Specific heat capacity and specific latent heat' },
      { ref: '6.6', title: 'Ideal gas law — pV = nRT; gas laws' },
      { ref: '6.7', title: 'Kinetic theory — mean kinetic energy = 3/2 kT' },
    ],
  },
  {
    ref: '7', title: 'Fields and their consequences',
    points: [
      { ref: '7.1', title: 'Gravitational fields — g = GM/r²; gravitational potential' },
      { ref: '7.2', title: 'Orbits — Kepler\'s Third Law T² ∝ r³; escape velocity' },
      { ref: '7.3', title: 'Electric fields — E = F/Q = V/d; Coulomb\'s Law' },
      { ref: '7.4', title: 'Capacitance — C = Q/V; energy stored = ½CV²; charging and discharging' },
      { ref: '7.5', title: 'Magnetic fields — flux density, force on a wire F = BIL' },
      { ref: '7.6', title: 'Electromagnetic induction — Faraday\'s and Lenz\'s Laws' },
      { ref: '7.7', title: 'Transformers and alternating current — RMS values' },
    ],
  },
  {
    ref: '8', title: 'Nuclear physics',
    points: [
      { ref: '8.1', title: 'Rutherford scattering and nuclear radius' },
      { ref: '8.2', title: 'Radioactive decay — activity, decay constant A = λN' },
      { ref: '8.3', title: 'Half-life calculations — N = N₀e^(−λt)' },
      { ref: '8.4', title: 'Binding energy and mass defect — E = mc²' },
      { ref: '8.5', title: 'Nuclear fission — chain reaction and reactor design' },
      { ref: '8.6', title: 'Nuclear fusion — conditions and energy release' },
    ],
  },
  {
    ref: '9', title: 'Astrophysics (option)',
    points: [
      { ref: '9.1', title: 'Telescopes — refracting, reflecting, radio and space-based' },
      { ref: '9.2', title: 'Classification of stars — luminosity, temperature, HR diagram' },
      { ref: '9.3', title: 'Stellar evolution — from nebula to white dwarf, neutron star or black hole' },
      { ref: '9.4', title: 'Cosmology — Hubble\'s Law, redshift and the Big Bang' },
      { ref: '9.5', title: 'Dark matter and dark energy — evidence and implications' },
    ],
  },
]

// ── OCR A Level Physics A (H557) ─────────────────────────────────────────────

const ocrALevelPhysicsTopics: SpecTopic[] = [
  {
    ref: 'M1', title: 'Development of practical skills',
    points: [
      { ref: 'M1.1', title: 'Planning experiments — variables, control, hypothesis' },
      { ref: 'M1.2', title: 'Implementing — measurements, apparatus and techniques' },
      { ref: 'M1.3', title: 'Analysis — processing data, graphs and uncertainties' },
      { ref: 'M1.4', title: 'Evaluation — reliability, validity and improvements' },
    ],
  },
  {
    ref: 'M2', title: 'Foundations of physics',
    points: [
      { ref: 'M2.1', title: 'Physical quantities and units — SI base units' },
      { ref: 'M2.2', title: 'Scalars and vectors — components and resultants' },
      { ref: 'M2.3', title: 'Significant figures, orders of magnitude and estimation' },
    ],
  },
  {
    ref: 'M3', title: 'Forces and motion',
    points: [
      { ref: 'M3.1', title: 'Motion — displacement, velocity, acceleration; suvat equations' },
      { ref: 'M3.2', title: 'Forces in action — equilibrium, moments and free-body diagrams' },
      { ref: 'M3.3', title: 'Work, energy and power — conservation of energy' },
      { ref: 'M3.4', title: 'Materials — stress, strain, Young modulus, elastic energy' },
      { ref: 'M3.5', title: 'Newton\'s Laws, momentum and impulse' },
      { ref: 'M3.6', title: 'Circular motion — centripetal force and angular velocity' },
      { ref: 'M3.7', title: 'Oscillations — SHM, energy and resonance' },
    ],
  },
  {
    ref: 'M4', title: 'Electrons, waves and photons',
    points: [
      { ref: 'M4.1', title: 'Charge, current and Kirchhoff\'s Laws' },
      { ref: 'M4.2', title: 'Energy, power and resistance — Ohm\'s Law, resistivity' },
      { ref: 'M4.3', title: 'Series and parallel circuits — potential dividers' },
      { ref: 'M4.4', title: 'Waves — wave equation, superposition, stationary waves' },
      { ref: 'M4.5', title: 'Quantum behaviour — photons, the photoelectric effect, E = hf' },
      { ref: 'M4.6', title: 'Wave–particle duality — electron diffraction and de Broglie' },
      { ref: 'M4.7', title: 'The electromagnetic spectrum — properties and applications' },
    ],
  },
  {
    ref: 'M5', title: 'The Newtonian world and astrophysics',
    points: [
      { ref: 'M5.1', title: 'Thermal physics — kinetic model, gas laws, ideal gas equation' },
      { ref: 'M5.2', title: 'Gravitational fields — field strength, potential, orbits' },
      { ref: 'M5.3', title: 'Stars and stellar evolution — HR diagram, star types' },
      { ref: 'M5.4', title: 'Cosmology — Hubble\'s Law, CMB and the Big Bang' },
    ],
  },
  {
    ref: 'M6', title: 'Particles and medical physics',
    points: [
      { ref: 'M6.1', title: 'Capacitors — charge, energy, exponential decay' },
      { ref: 'M6.2', title: 'Electric fields — Coulomb\'s Law, field lines, potential' },
      { ref: 'M6.3', title: 'Magnetic fields — force on a wire and a charge, induction' },
      { ref: 'M6.4', title: 'Nuclear and particle physics — quark model, radioactive decay' },
      { ref: 'M6.5', title: 'Medical imaging — X-rays, PET scans, ultrasound' },
    ],
  },
]

// ── WJEC A Level Physics ──────────────────────────────────────────────────────

const wjecALevelPhysicsTopics: SpecTopic[] = [
  {
    ref: 'U1', title: 'Motion, energy and matter',
    points: [
      { ref: '1.1', title: 'Basic physics — SI units, scalars, vectors, uncertainties' },
      { ref: '1.2', title: 'Kinematics — equations of motion, displacement–time and velocity–time graphs' },
      { ref: '1.3', title: 'Dynamics — Newton\'s Laws, momentum, impulse' },
      { ref: '1.4', title: 'Energy concepts — work, power, efficiency, conservation of energy' },
      { ref: '1.5', title: 'Circular motion — angular velocity, centripetal force' },
      { ref: '1.6', title: 'Vibrations — SHM, resonance and damping' },
      { ref: '1.7', title: 'Solids under stress — Hooke\'s Law, Young modulus, stress–strain graphs' },
      { ref: '1.8', title: 'Using radiation to investigate stars — Wien\'s Law, Stefan\'s Law' },
    ],
  },
  {
    ref: 'U2', title: 'Electricity and light',
    points: [
      { ref: '2.1', title: 'Conduction of electricity — charge carriers, drift velocity' },
      { ref: '2.2', title: 'Resistance — Ohm\'s Law, resistivity, I–V characteristics' },
      { ref: '2.3', title: 'D.C. circuits — Kirchhoff\'s Laws, EMF and internal resistance' },
      { ref: '2.4', title: 'The nature of waves — transverse, longitudinal, wave equation' },
      { ref: '2.5', title: 'Wave properties — superposition, interference, diffraction, polarisation' },
      { ref: '2.6', title: 'Refraction of light — Snell\'s Law, total internal reflection' },
      { ref: '2.7', title: 'Photons — E = hf, photoelectric effect, work function' },
      { ref: '2.8', title: 'Lasers — stimulated emission, population inversion' },
    ],
  },
  {
    ref: 'U3', title: 'Oscillations and nuclei',
    points: [
      { ref: '3.1', title: 'Capacitance — C = Q/V, energy stored, charge/discharge' },
      { ref: '3.2', title: 'Electrostatic and gravitational fields — field strength and potential' },
      { ref: '3.3', title: 'Orbits and the wider universe — Kepler\'s Third Law, escape velocity' },
      { ref: '3.4', title: 'Magnetic fields — force on a wire, F = BIL, electromagnetic induction' },
      { ref: '3.5', title: 'Nuclear decay — alpha, beta, gamma; activity; half-life' },
      { ref: '3.6', title: 'Nuclear energy — binding energy, fission and fusion' },
    ],
  },
  {
    ref: 'U4', title: 'Fields and options',
    points: [
      { ref: '4.1', title: 'Alternating currents — peak and RMS values, transformers' },
      { ref: '4.2', title: 'Particles and nuclear structure — quarks, leptons, standard model' },
      { ref: '4.3', title: 'Optional topic: Medical physics' },
      { ref: '4.4', title: 'Optional topic: Energy and the environment' },
      { ref: '4.5', title: 'Optional topic: Astrophysics and cosmology' },
    ],
  },
]

// ── Exported qualifications ───────────────────────────────────────────────────

export const QUALIFICATIONS: Qualification[] = [
  // ── Edexcel ──
  { id: 'edexcel-gcse-physics',   label: 'Edexcel GCSE Physics (9-1)',   shortLabel: 'GCSE Physics',   topics: gcsePhysicsTopics },
  { id: 'edexcel-gcse-biology',   label: 'Edexcel GCSE Biology (1BI0)',   shortLabel: 'GCSE Biology',   topics: edexcelGCSEBiologyTopics },
  { id: 'edexcel-gcse-chemistry', label: 'Edexcel GCSE Chemistry (1CH0)', shortLabel: 'GCSE Chemistry', topics: edexcelGCSEChemTopics },
  { id: 'edexcel-alevel-physics', label: 'Edexcel A Level Physics (9PH0)', shortLabel: 'A Level Physics', topics: aLevelPhysicsTopics },
  // ── AQA ──
  { id: 'aqa-gcse-physics',       label: 'AQA GCSE Physics (8463)',       shortLabel: 'GCSE Physics',   topics: aqaGCSEPhysicsTopics },
  { id: 'aqa-gcse-biology',       label: 'AQA GCSE Biology (8461)',       shortLabel: 'GCSE Biology',   topics: aqaGCSEBiologyTopics },
  { id: 'aqa-gcse-chemistry',     label: 'AQA GCSE Chemistry (8462)',     shortLabel: 'GCSE Chemistry', topics: aqaGCSEChemistryTopics },
  { id: 'aqa-alevel-physics',     label: 'AQA A Level Physics (7408)',    shortLabel: 'A Level Physics', topics: aqaALevelPhysicsTopics },
  // ── OCR Gateway ──
  { id: 'ocr-gateway-gcse-physics',   label: 'OCR Gateway GCSE Physics (J249)',   shortLabel: 'GCSE Physics',   topics: ocrGatewayGCSEPhysicsTopics },
  { id: 'ocr-gateway-gcse-biology',   label: 'OCR Gateway GCSE Biology (J247)',   shortLabel: 'GCSE Biology',   topics: ocrGatewayGCSEBiologyTopics },
  { id: 'ocr-gateway-gcse-chemistry', label: 'OCR Gateway GCSE Chemistry (J248)', shortLabel: 'GCSE Chemistry', topics: ocrGatewayGCSEChemistryTopics },
  { id: 'ocr-alevel-physics',         label: 'OCR A Level Physics A (H557)',      shortLabel: 'A Level Physics', topics: ocrALevelPhysicsTopics },
  // ── WJEC ──
  { id: 'wjec-gcse-physics',   label: 'WJEC GCSE Physics',   shortLabel: 'GCSE Physics',   topics: wjecGCSEPhysicsTopics },
  { id: 'wjec-gcse-biology',   label: 'WJEC GCSE Biology',   shortLabel: 'GCSE Biology',   topics: wjecGCSEBiologyTopics },
  { id: 'wjec-gcse-chemistry', label: 'WJEC GCSE Chemistry', shortLabel: 'GCSE Chemistry', topics: wjecGCSEChemistryTopics },
  { id: 'wjec-alevel-physics', label: 'WJEC A Level Physics', shortLabel: 'A Level Physics', topics: wjecALevelPhysicsTopics },
  // ── KS3 ──
  { id: 'exploring-science-y7', label: 'Exploring Science Year 7', shortLabel: 'Exp. Sci Y7', topics: exploringScience7Topics },
  { id: 'exploring-science-y8', label: 'Exploring Science Year 8', shortLabel: 'Exp. Sci Y8', topics: exploringScience8Topics },
]

export function getQualification(id: string): Qualification | undefined {
  return QUALIFICATIONS.find(q => q.id === id)
}

export function getAllPoints(qualId: string): Array<{ topic: SpecTopic; point: SpecPoint }> {
  const q = getQualification(qualId)
  if (!q) return []
  return q.topics.flatMap(topic => topic.points.map(point => ({ topic, point })))
}
