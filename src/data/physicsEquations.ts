export interface PhysicsEquation {
  name: string
  latex: string
  topic: string
  level: 'GCSE' | 'A-Level' | 'Both'
}

export const PHYSICS_EQUATIONS: PhysicsEquation[] = [
  // Forces
  { name: 'Newton\'s second law', latex: 'F = ma', topic: 'Forces', level: 'GCSE' },
  { name: 'Weight', latex: 'W = mg', topic: 'Forces', level: 'GCSE' },
  { name: 'Momentum', latex: 'p = mv', topic: 'Forces', level: 'GCSE' },
  { name: 'Hooke\'s law', latex: 'F = ke', topic: 'Forces', level: 'GCSE' },
  { name: 'Pressure', latex: 'P = \\frac{F}{A}', topic: 'Forces', level: 'GCSE' },
  { name: 'Moment', latex: 'M = Fd', topic: 'Forces', level: 'GCSE' },
  { name: 'Density', latex: '\\rho = \\frac{m}{V}', topic: 'Forces', level: 'GCSE' },
  { name: 'Gravitational force', latex: 'F = \\frac{Gm_1 m_2}{r^2}', topic: 'Gravity', level: 'A-Level' },
  { name: 'Centripetal force', latex: 'F = \\frac{mv^2}{r}', topic: 'Circular motion', level: 'A-Level' },
  { name: 'Centripetal acceleration', latex: 'a = \\frac{v^2}{r} = \\omega^2 r', topic: 'Circular motion', level: 'A-Level' },
  { name: 'Impulse', latex: 'F \\Delta t = \\Delta p', topic: 'Forces', level: 'GCSE' },
  // Energy
  { name: 'Kinetic energy', latex: 'E_k = \\frac{1}{2}mv^2', topic: 'Energy', level: 'GCSE' },
  { name: 'Gravitational potential energy', latex: 'E_p = mgh', topic: 'Energy', level: 'GCSE' },
  { name: 'Elastic potential energy', latex: 'E_e = \\frac{1}{2}ke^2', topic: 'Energy', level: 'GCSE' },
  { name: 'Work done', latex: 'W = Fd\\cos\\theta', topic: 'Energy', level: 'GCSE' },
  { name: 'Power', latex: 'P = \\frac{W}{t} = Fv', topic: 'Energy', level: 'GCSE' },
  { name: 'Efficiency', latex: '\\eta = \\frac{P_{out}}{P_{in}} \\times 100\\%', topic: 'Energy', level: 'GCSE' },
  // Waves
  { name: 'Wave speed', latex: 'v = f\\lambda', topic: 'Waves', level: 'GCSE' },
  { name: 'Period and frequency', latex: 'T = \\frac{1}{f}', topic: 'Waves', level: 'GCSE' },
  { name: 'Snell\'s law', latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2', topic: 'Waves', level: 'GCSE' },
  { name: 'Refractive index', latex: 'n = \\frac{\\sin i}{\\sin r}', topic: 'Waves', level: 'GCSE' },
  { name: 'Diffraction grating', latex: 'd\\sin\\theta = n\\lambda', topic: 'Waves', level: 'A-Level' },
  { name: 'Young\'s double slit', latex: '\\lambda = \\frac{ax}{D}', topic: 'Waves', level: 'A-Level' },
  // Electricity
  { name: 'Ohm\'s law', latex: 'V = IR', topic: 'Electricity', level: 'GCSE' },
  { name: 'Electrical power', latex: 'P = IV = I^2 R = \\frac{V^2}{R}', topic: 'Electricity', level: 'GCSE' },
  { name: 'Charge flow', latex: 'Q = It', topic: 'Electricity', level: 'GCSE' },
  { name: 'Energy transferred', latex: 'E = QV = IVt', topic: 'Electricity', level: 'GCSE' },
  { name: 'Resistors in series', latex: 'R_T = R_1 + R_2 + ...', topic: 'Electricity', level: 'GCSE' },
  { name: 'Resistors in parallel', latex: '\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2} + ...', topic: 'Electricity', level: 'GCSE' },
  { name: 'Resistivity', latex: 'R = \\frac{\\rho L}{A}', topic: 'Electricity', level: 'A-Level' },
  { name: 'EMF', latex: '\\varepsilon = I(R + r)', topic: 'Electricity', level: 'A-Level' },
  { name: 'Capacitance', latex: 'C = \\frac{Q}{V}', topic: 'Capacitors', level: 'A-Level' },
  { name: 'Energy stored in capacitor', latex: 'E = \\frac{1}{2}CV^2 = \\frac{Q^2}{2C}', topic: 'Capacitors', level: 'A-Level' },
  { name: 'Capacitors in series', latex: '\\frac{1}{C_T} = \\frac{1}{C_1} + \\frac{1}{C_2}', topic: 'Capacitors', level: 'A-Level' },
  { name: 'Capacitors in parallel', latex: 'C_T = C_1 + C_2', topic: 'Capacitors', level: 'A-Level' },
  // Thermal
  { name: 'Specific heat capacity', latex: 'Q = mc\\Delta T', topic: 'Thermal', level: 'GCSE' },
  { name: 'Specific latent heat', latex: 'Q = mL', topic: 'Thermal', level: 'GCSE' },
  { name: 'Ideal gas law', latex: 'pV = nRT', topic: 'Thermal', level: 'A-Level' },
  { name: 'Boyle\'s law', latex: 'p_1 V_1 = p_2 V_2', topic: 'Thermal', level: 'GCSE' },
  { name: 'Charles\'s law', latex: '\\frac{V_1}{T_1} = \\frac{V_2}{T_2}', topic: 'Thermal', level: 'GCSE' },
  { name: 'Pressure law', latex: '\\frac{p_1}{T_1} = \\frac{p_2}{T_2}', topic: 'Thermal', level: 'GCSE' },
  // Nuclear
  { name: 'Mass-energy equivalence', latex: 'E = mc^2', topic: 'Nuclear', level: 'GCSE' },
  { name: 'Radioactive decay', latex: 'N = N_0 e^{-\\lambda t}', topic: 'Nuclear', level: 'A-Level' },
  { name: 'Half-life', latex: 't_{1/2} = \\frac{\\ln 2}{\\lambda}', topic: 'Nuclear', level: 'A-Level' },
  { name: 'Binding energy', latex: 'E_B = \\Delta m c^2', topic: 'Nuclear', level: 'A-Level' },
  // Fields
  { name: 'Electric field strength', latex: 'E = \\frac{F}{Q} = \\frac{V}{d}', topic: 'Electric fields', level: 'A-Level' },
  { name: 'Coulomb\'s law', latex: 'F = \\frac{kQ_1 Q_2}{r^2}', topic: 'Electric fields', level: 'A-Level' },
  { name: 'Electric potential', latex: 'V = \\frac{kQ}{r}', topic: 'Electric fields', level: 'A-Level' },
  { name: 'Gravitational field strength', latex: 'g = \\frac{F}{m} = \\frac{GM}{r^2}', topic: 'Gravity', level: 'A-Level' },
  { name: 'Gravitational potential', latex: 'V_g = -\\frac{GM}{r}', topic: 'Gravity', level: 'A-Level' },
  // Quantum
  { name: 'Photon energy', latex: 'E = hf = \\frac{hc}{\\lambda}', topic: 'Quantum', level: 'A-Level' },
  { name: 'de Broglie wavelength', latex: '\\lambda = \\frac{h}{mv} = \\frac{h}{p}', topic: 'Quantum', level: 'A-Level' },
  { name: 'Photoelectric work function', latex: 'hf = \\phi + \\frac{1}{2}mv^2_{max}', topic: 'Quantum', level: 'A-Level' },
  // Motion
  { name: 'SUVAT: v = u + at', latex: 'v = u + at', topic: 'Motion', level: 'GCSE' },
  { name: 'SUVAT: s = ut + ½at²', latex: 's = ut + \\frac{1}{2}at^2', topic: 'Motion', level: 'GCSE' },
  { name: 'SUVAT: v² = u² + 2as', latex: 'v^2 = u^2 + 2as', topic: 'Motion', level: 'GCSE' },
  { name: 'SUVAT: s = ½(u+v)t', latex: 's = \\frac{1}{2}(u+v)t', topic: 'Motion', level: 'GCSE' },
  // Magnetism
  { name: 'Force on a wire', latex: 'F = BIL\\sin\\theta', topic: 'Magnetism', level: 'A-Level' },
  { name: 'Force on a charge', latex: 'F = Bqv\\sin\\theta', topic: 'Magnetism', level: 'A-Level' },
  { name: 'Faraday\'s law', latex: '\\varepsilon = -\\frac{d\\Phi}{dt}', topic: 'Magnetism', level: 'A-Level' },
  { name: 'Magnetic flux', latex: '\\Phi = BA\\cos\\theta', topic: 'Magnetism', level: 'A-Level' },
  { name: 'Transformer equation', latex: '\\frac{V_s}{V_p} = \\frac{N_s}{N_p}', topic: 'Magnetism', level: 'GCSE' },
]
