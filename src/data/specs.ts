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

// ── Edexcel GCSE Combined Science: Physics (9-1) — 1SC0 ──────────────────────

const gcseCombinedPhysicsTopics: SpecTopic[] = gcsePhysicsTopics.filter(t => t.ref !== 'T7')

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

// ── Exported qualifications ───────────────────────────────────────────────────

export const QUALIFICATIONS: Qualification[] = [
  {
    id: 'edexcel-gcse-physics',
    label: 'Edexcel GCSE Physics (9-1)',
    shortLabel: 'GCSE Physics',
    topics: gcsePhysicsTopics,
  },
  {
    id: 'edexcel-gcse-combined',
    label: 'Edexcel GCSE Combined Science: Physics',
    shortLabel: 'GCSE Combined Sci.',
    topics: gcseCombinedPhysicsTopics,
  },
  {
    id: 'edexcel-alevel-physics',
    label: 'Edexcel A Level Physics (9PH0)',
    shortLabel: 'A Level Physics',
    topics: aLevelPhysicsTopics,
  },
]

export function getQualification(id: string): Qualification | undefined {
  return QUALIFICATIONS.find(q => q.id === id)
}

export function getAllPoints(qualId: string): Array<{ topic: SpecTopic; point: SpecPoint }> {
  const q = getQualification(qualId)
  if (!q) return []
  return q.topics.flatMap(topic => topic.points.map(point => ({ topic, point })))
}
