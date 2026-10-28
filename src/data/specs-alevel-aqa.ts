import type { SpecTopic } from './specs'

// AQA AS and A-level Physics (7407/7408), version 1.2, for teaching from Sept 2015.
// Every numbered specification sub-section (3.1.1 … 3.13.6.4) has an entry, using
// AQA's own numbers as refs. AQA does not number the individual statements inside
// a sub-section, so each title lists all the statements it covers, including the
// required practicals. Titles are concise paraphrases, not verbatim spec text.
// Sections 3.6–3.13 are A-level only; 3.9–3.13 are the five options (a student
// takes one).

const topic = (ref: string, title: string, points: [string, string][]): SpecTopic => ({
  ref, title, points: points.map(([ref, title]) => ({ ref, title })),
})

export const aqaALevelPhysicsTopics: SpecTopic[] = [
  topic('3.1', 'Measurements and their errors', [
    ['3.1.1', 'Use of SI units and prefixes: base and derived units, prefixes T to f, unit conversions (J/eV, J/kW h)'],
    ['3.1.2', 'Limitations of measurements: random and systematic errors; precision, resolution, accuracy; absolute, fractional and percentage uncertainties; error bars; gradient uncertainty'],
    ['3.1.3', 'Estimation of physical quantities: orders of magnitude and approximate values'],
  ]),

  topic('3.2.1', 'Particles and radiation · Particles', [
    ['3.2.1.1', 'Constituents of the atom: proton, neutron, electron; charge and mass; specific charge; Z, A and nuclide notation; isotopes'],
    ['3.2.1.2', 'Stable and unstable nuclei: strong nuclear force and its range; alpha and beta-minus decay equations; the neutrino'],
    ['3.2.1.3', 'Particles, antiparticles and photons: antiparticles; photon model, E = hf = hc/λ; annihilation and pair production'],
    ['3.2.1.4', 'Particle interactions: four fundamental interactions; exchange particles; virtual photons; W⁺/W⁻ in weak interactions; Feynman-style diagrams'],
    ['3.2.1.5', 'Classification of particles: hadrons (baryons, mesons), baryon number; leptons and lepton number; strange particles and strangeness'],
    ['3.2.1.6', 'Quarks and antiquarks: u, d, s properties; quark combinations for baryons and mesons; neutron decay'],
    ['3.2.1.7', 'Applications of conservation laws: quark changes in β⁻ and β⁺ decay; charge, baryon, lepton and strangeness conservation in interactions'],
  ]),
  topic('3.2.2', 'Particles and radiation · Electromagnetic radiation and quantum phenomena', [
    ['3.2.2.1', 'The photoelectric effect: threshold frequency, work function, stopping potential; hf = φ + Ek(max)'],
    ['3.2.2.2', 'Collisions of electrons with atoms: ionisation and excitation (fluorescent tube); the electronvolt'],
    ['3.2.2.3', 'Energy levels and photon emission: line spectra and transitions; hf = E₁ − E₂'],
    ['3.2.2.4', 'Wave–particle duality: electron diffraction; de Broglie wavelength λ = h/mv'],
  ]),

  topic('3.3.1', 'Waves · Progressive and stationary waves', [
    ['3.3.1.1', 'Progressive waves: amplitude, frequency, wavelength, speed, phase, phase difference; c = fλ, f = 1/T'],
    ['3.3.1.2', 'Longitudinal and transverse waves: examples; polarisation and its applications'],
    ['3.3.1.3', 'Superposition and stationary waves: nodes and antinodes, harmonics, f = (1/2l)√(T/μ); Required practical 1: stationary waves on a string'],
  ]),
  topic('3.3.2', 'Waves · Refraction, diffraction and interference', [
    ['3.3.2.1', 'Interference: Young\'s double slits, fringe spacing w = λD/s, white-light fringes, laser safety; Required practical 2: interference and diffraction gratings'],
    ['3.3.2.2', 'Diffraction: single-slit pattern; diffraction grating d sinθ = nλ and its applications'],
    ['3.3.2.3', 'Refraction at a plane surface: refractive index, Snell\'s law, total internal reflection, optical fibres, pulse broadening and dispersion'],
  ]),

  topic('3.4.1', 'Mechanics and materials · Force, energy and momentum', [
    ['3.4.1.1', 'Scalars and vectors: addition and resolution; equilibrium of coplanar forces'],
    ['3.4.1.2', 'Moments: moment of a force, couples, principle of moments, centre of mass'],
    ['3.4.1.3', 'Motion along a straight line: v = Δs/Δt, a = Δv/Δt, graphs, equations of uniform acceleration, g; Required practical 3: g by free fall'],
    ['3.4.1.4', 'Projectile motion: independent horizontal and vertical motion; friction, lift and drag; terminal speed'],
    ['3.4.1.5', 'Newton\'s laws of motion: F = ma'],
    ['3.4.1.6', 'Momentum: conservation; F = Δ(mv)/Δt; impulse and force–time graphs; elastic and inelastic collisions; explosions'],
    ['3.4.1.7', 'Work, energy and power: W = Fs cosθ, P = ΔW/Δt = Fv; force–displacement graphs; efficiency'],
    ['3.4.1.8', 'Conservation of energy: ΔEp = mgΔh, Ek = ½mv²; work against resistive forces'],
  ]),
  topic('3.4.2', 'Mechanics and materials · Materials', [
    ['3.4.2.1', 'Bulk properties of solids: density; Hooke\'s law, elastic limit, k; stress and strain; elastic strain energy; plastic and brittle behaviour; stress–strain curves'],
    ['3.4.2.2', 'The Young modulus: E = stress/strain; Required practical 4: Young modulus by a simple method'],
  ]),

  topic('3.5.1', 'Electricity · Current electricity', [
    ['3.5.1.1', 'Basics of electricity: I = ΔQ/Δt, V = W/Q, R = V/I'],
    ['3.5.1.2', 'Current–voltage characteristics: ohmic conductor, diode, filament lamp; Ohm\'s law'],
    ['3.5.1.3', 'Resistivity: ρ = RA/L; NTC thermistors; superconductivity; Required practical 5: resistivity of a wire'],
    ['3.5.1.4', 'Circuits: resistors in series and parallel; E = IVt, P = IV = I²R = V²/R; conservation of charge and energy in dc circuits'],
    ['3.5.1.5', 'Potential divider: constant or variable p.d.; variable resistors, thermistors and LDRs'],
    ['3.5.1.6', 'Electromotive force and internal resistance: ε = I(R + r); Required practical 6: emf and internal resistance of cells'],
  ]),

  topic('3.6.1', 'Further mechanics and thermal physics · Periodic motion (A-level only)', [
    ['3.6.1.1', 'Circular motion: angular speed ω = v/r = 2πf, radian measure, centripetal acceleration a = v²/r = ω²r and force F = mv²/r = mω²r'],
    ['3.6.1.2', 'Simple harmonic motion: a ∝ −x, a = −ω²x, x = A cosωt, v = ±ω√(A² − x²); x, v, a graphs; maximum speed and acceleration'],
    ['3.6.1.3', 'Simple harmonic systems: mass–spring and simple pendulum periods; energy variation; damping; Required practical 7: SHM with a mass–spring and a pendulum'],
    ['3.6.1.4', 'Forced vibrations and resonance: free and forced vibrations; resonance and damping'],
  ]),
  topic('3.6.2', 'Further mechanics and thermal physics · Thermal physics (A-level only)', [
    ['3.6.2.1', 'Thermal energy transfer: internal energy; qualitative first law; Q = mcΔθ; Q = ml; continuous flow'],
    ['3.6.2.2', 'Ideal gases: gas laws; absolute zero; pV = nRT and pV = NkT; work done = pΔV; NA, R, k; Required practical 8: Boyle\'s and Charles\'s laws'],
    ['3.6.2.3', 'Molecular kinetic theory model: Brownian motion; pV = ⅓Nm⟨c²⟩ derivation; average kinetic energy ½m⟨c²⟩ = (3/2)kT = 3RT/2NA'],
  ]),

  topic('3.7.1', 'Fields and their consequences · Fields (A-level only)', [
    ['3.7.1', 'Force fields as regions of non-contact force; gravitational and electrostatic fields compared (similarities and differences)'],
  ]),
  topic('3.7.2', 'Fields and their consequences · Gravitational fields (A-level only)', [
    ['3.7.2.1', 'Newton\'s law: F = Gm₁m₂/r²'],
    ['3.7.2.2', 'Gravitational field strength: field lines; g = F/m; g = GM/r² in a radial field'],
    ['3.7.2.3', 'Gravitational potential: V = −GM/r; ΔW = mΔV; equipotentials; g = −ΔV/Δr; area under g–r graph'],
    ['3.7.2.4', 'Orbits of planets and satellites: T² ∝ r³; satellite energy; escape velocity; synchronous and geostationary orbits'],
  ]),
  topic('3.7.3', 'Fields and their consequences · Electric fields (A-level only)', [
    ['3.7.3.1', 'Coulomb\'s law: F = Q₁Q₂/4πε₀r²; permittivity of free space; compared with gravity for subatomic particles'],
    ['3.7.3.2', 'Electric field strength: field lines; E = F/Q; E = V/d (uniform); E = Q/4πε₀r² (radial); charged particle entering a uniform field'],
    ['3.7.3.3', 'Electric potential: V = Q/4πε₀r; ΔW = QΔV; equipotentials; E = −ΔV/Δr; area under E–r graph'],
  ]),
  topic('3.7.4', 'Fields and their consequences · Capacitance (A-level only)', [
    ['3.7.4.1', 'Capacitance: C = Q/V'],
    ['3.7.4.2', 'Parallel plate capacitor: C = ε₀εrA/d; dielectric action; relative permittivity; polar molecules'],
    ['3.7.4.3', 'Energy stored by a capacitor: area under Q–V graph; E = ½QV = ½CV² = ½Q²/C'],
    ['3.7.4.4', 'Capacitor charge and discharge: Q, V and I graphs; time constant RC; T½ = 0.69RC; exponential discharge and charge; Required practical 9: charge and discharge of capacitors'],
  ]),
  topic('3.7.5', 'Fields and their consequences · Magnetic fields (A-level only)', [
    ['3.7.5.1', 'Magnetic flux density: F = BIl; Fleming\'s left-hand rule; the tesla; Required practical 10: force on a wire against B, I and length'],
    ['3.7.5.2', 'Moving charges in a magnetic field: F = BQv; circular paths; the cyclotron'],
    ['3.7.5.3', 'Magnetic flux and flux linkage: Φ = BA; NΦ = BAN cosθ; Required practical 11: search coil and flux linkage against angle'],
    ['3.7.5.4', 'Electromagnetic induction: Faraday\'s and Lenz\'s laws; ε = N ΔΦ/Δt; conductor moving in a field; coil rotating in a field'],
    ['3.7.5.5', 'Alternating currents: rms, peak and peak-to-peak values; Irms = I₀/√2, Vrms = V₀/√2; mains voltage; oscilloscope as dc/ac voltmeter'],
    ['3.7.5.6', 'The operation of a transformer: Ns/Np = Vs/Vp; efficiency; eddy currents and inefficiencies; high-voltage power transmission and line losses'],
  ]),

  topic('3.8.1', 'Nuclear physics · Radioactivity (A-level only)', [
    ['3.8.1.1', 'Rutherford scattering: qualitative study; how understanding of the nucleus has changed'],
    ['3.8.1.2', 'α, β and γ radiation: properties, absorption experiments, hazards; inverse-square law for γ; background radiation; Required practical 12: inverse-square law for gamma radiation'],
    ['3.8.1.3', 'Radioactive decay: random nature; ΔN/Δt = −λN; N = N₀e^(−λt); A = λN; half-life T½ = ln2/λ; graphical decay data; dating and waste storage'],
    ['3.8.1.4', 'Nuclear instability: N–Z graph; decay modes incl. electron capture; decay equations; excited states and γ emission; technetium-99m'],
    ['3.8.1.5', 'Nuclear radius: closest approach and electron diffraction; R = R₀A^(1/3); constant nuclear density; nuclear density calculations'],
    ['3.8.1.6', 'Mass and energy: E = mc²; mass difference and binding energy; atomic mass unit; fission and fusion energy calculations; binding energy per nucleon graph'],
    ['3.8.1.7', 'Induced fission: thermal neutrons, chain reaction, critical mass; moderator, control rods and coolant; materials choices'],
    ['3.8.1.8', 'Safety aspects: fuel handling and shielding, emergency shut-down; radioactive waste; risks and benefits'],
  ]),

  // ── Option: Astrophysics ──────────────────────────────────────────────────
  topic('3.9.1', 'Astrophysics (option) · Telescopes (A-level only)', [
    ['3.9.1.1', 'Astronomical refracting telescope of two converging lenses: ray diagram in normal adjustment; angular magnification M = fo/fe'],
    ['3.9.1.2', 'Reflecting telescopes: Cassegrain arrangement; reflectors versus refractors; spherical and chromatic aberration'],
    ['3.9.1.3', 'Single-dish radio telescopes and I-R, U-V and X-ray telescopes compared with optical telescopes'],
    ['3.9.1.4', 'Advantages of large diameter telescopes: Rayleigh criterion, collecting power ∝ D²; eye and CCD compared'],
  ]),
  topic('3.9.2', 'Astrophysics (option) · Classification of stars (A-level only)', [
    ['3.9.2.1', 'Classification by luminosity: apparent magnitude, Hipparcos scale, brightness and intensity ratio'],
    ['3.9.2.2', 'Absolute magnitude M: parsec and light year; m − M = 5 log(d/10)'],
    ['3.9.2.3', 'Classification by temperature: black-body radiation, Stefan\'s law P = σAT⁴, Wien\'s law λmaxT = 2.9 × 10⁻³ m K, inverse square law'],
    ['3.9.2.4', 'Stellar spectral classes O B A F G K M; temperature and Balmer absorption lines'],
    ['3.9.2.5', 'The Hertzsprung–Russell diagram: main sequence, dwarfs, giants; position of the Sun; evolution of a Sun-like star'],
    ['3.9.2.6', 'Supernovae, neutron stars and black holes: type 1a standard candles, dark energy, gamma ray bursts, supermassive black holes, Schwarzschild radius'],
  ]),
  topic('3.9.3', 'Astrophysics (option) · Cosmology (A-level only)', [
    ['3.9.3.1', 'Doppler effect: Δf/f = v/c, z = Δλ/λ = −v/c; binary stars; galaxies and quasars'],
    ['3.9.3.2', 'Hubble\'s law: v = Hd; expansion and age of the universe; Big Bang evidence (CMB, hydrogen/helium abundance)'],
    ['3.9.3.3', 'Quasars: most distant measurable objects, radio sources, large red shifts, active supermassive black holes'],
    ['3.9.3.4', 'Detection of exoplanets: radial velocity and transit methods; light curves'],
  ]),

  // ── Option: Medical physics ───────────────────────────────────────────────
  topic('3.10.1', 'Medical physics (option) · Physics of the eye (A-level only)', [
    ['3.10.1.1', 'Physics of vision: the eye as a refracting system; sensitivity and spectral response; spatial resolution (rods and cones)'],
    ['3.10.1.2', 'Defects of vision and correction with lenses: power = 1/f, 1/u + 1/v = 1/f, m = v/u; myopia, hypermetropia, astigmatism; correcting-lens powers'],
  ]),
  topic('3.10.2', 'Medical physics (option) · Physics of the ear (A-level only)', [
    ['3.10.2.1', 'The ear as a sound detection system: structure and transmission processes'],
    ['3.10.2.2', 'Sensitivity and frequency response: equal loudness curves; intensity level = 10 log(I/I₀); dB and dBA'],
    ['3.10.2.3', 'Defects of hearing: effects on loudness curves; hearing loss from noise or age'],
  ]),
  topic('3.10.3', 'Medical physics (option) · Biological measurement (A-level only)', [
    ['3.10.3.1', 'Simple ECG machines and the normal ECG waveform'],
  ]),
  topic('3.10.4', 'Medical physics (option) · Non-ionising imaging (A-level only)', [
    ['3.10.4.1', 'Ultrasound imaging: acoustic impedance Z = ρc, reflection at boundaries, attenuation, piezoelectric devices, A- and B-scans, comparisons'],
    ['3.10.4.2', 'Fibre optics and endoscopy: total internal reflection at the core–cladding interface; flexible endoscope with coherent fibre bundles'],
    ['3.10.4.3', 'Magnetic resonance (MR) scanner: proton spins, precession, gradient coils, RF pulses and signals, image processing'],
  ]),
  topic('3.10.5', 'Medical physics (option) · X-ray imaging (A-level only)', [
    ['3.10.5.1', 'Physics of diagnostic X-rays: production, maximum photon energy, continuous and characteristic spectra; rotating-anode tube; controlling intensity, energy and dose'],
    ['3.10.5.2', 'Image detection and enhancement: flat panel detector versus photographic detection; contrast media (barium meal); intensifying screens and fluoroscopy'],
    ['3.10.5.3', 'Absorption of X-rays: exponential attenuation I = I₀e^(−μx); linear and mass attenuation coefficients; half-value thickness; differential tissue absorption'],
    ['3.10.5.4', 'CT scanner: moving X-ray tube, narrow monochromatic beam, detector array, computer image; advantages and disadvantages'],
  ]),
  topic('3.10.6', 'Medical physics (option) · Radionuclide imaging and therapy (A-level only)', [
    ['3.10.6.1', 'Imaging techniques: gamma-emitting tracers (technetium-99m, iodine-131, indium-111); Mo–Tc generator; PET scans'],
    ['3.10.6.2', 'Half-life: physical, biological and effective half-lives; 1/TE = 1/TB + 1/TP'],
    ['3.10.6.3', 'Gamma camera: photomultiplier tube and gamma camera structure and workings'],
    ['3.10.6.4', 'Use of high-energy X-rays: external treatment; limiting exposure to healthy tissue'],
    ['3.10.6.5', 'Use of radioactive implants: internal treatment with beta emitters'],
    ['3.10.6.6', 'Imaging comparisons: resolution, convenience and safety of imaging techniques'],
  ]),

  // ── Option: Engineering physics ───────────────────────────────────────────
  topic('3.11.1', 'Engineering physics (option) · Rotational dynamics (A-level only)', [
    ['3.11.1.1', 'Concept of moment of inertia: I = Σmr²; factors affecting it'],
    ['3.11.1.2', 'Rotational kinetic energy Ek = ½Iω²; flywheels for energy storage and smoothing torque and speed'],
    ['3.11.1.3', 'Rotational motion: angular displacement, speed, velocity and acceleration; equations for uniform angular acceleration; analogy with translational dynamics'],
    ['3.11.1.4', 'Torque and angular acceleration: T = Fr; T = Iα'],
    ['3.11.1.5', 'Angular momentum: L = Iω; conservation; angular impulse TΔt = Δ(Iω)'],
    ['3.11.1.6', 'Work and power: W = Tθ; P = Tω; frictional torque'],
  ]),
  topic('3.11.2', 'Engineering physics (option) · Thermodynamics and engines (A-level only)', [
    ['3.11.2.1', 'First law of thermodynamics: Q = ΔU + W and its applications'],
    ['3.11.2.2', 'Non-flow processes: isothermal, adiabatic (pV^γ = constant), constant pressure and constant volume'],
    ['3.11.2.3', 'The p–V diagram: processes on p–V diagrams; work done as area; cyclic processes'],
    ['3.11.2.4', 'Engine cycles: four-stroke petrol and diesel cycles; indicator diagrams; indicated and brake power; overall, thermal and mechanical efficiency'],
    ['3.11.2.5', 'Second law and engines: source and sink; efficiency = W/QH = (QH − QC)/QH; maximum theoretical efficiency (TH − TC)/TH; combined heat and power'],
    ['3.11.2.6', 'Reversed heat engines: heat pumps and refrigerators; coefficients of performance'],
  ]),

  // ── Option: Turning points in physics ─────────────────────────────────────
  topic('3.12.1', 'Turning points in physics (option) · The discovery of the electron (A-level only)', [
    ['3.12.1.1', 'Cathode rays: production in a discharge tube'],
    ['3.12.1.2', 'Thermionic emission of electrons: ½mv² = eV'],
    ['3.12.1.3', 'Specific charge of the electron e/m: determination, Thomson\'s significance, comparison with the hydrogen ion'],
    ['3.12.1.4', 'Millikan\'s determination of e: stationary oil droplet, terminal speed, Stokes\' law F = 6πηrv, quantisation of charge'],
  ]),
  topic('3.12.2', 'Turning points in physics (option) · Wave–particle duality (A-level only)', [
    ['3.12.2.1', 'Newton\'s corpuscular theory of light compared with Huygens\' wave theory'],
    ['3.12.2.2', 'Significance of Young\'s double slits experiment and delayed acceptance of the wave theory'],
    ['3.12.2.3', 'Electromagnetic waves: Maxwell\'s c = 1/√(μ₀ε₀); Hertz and radio waves; Fizeau\'s speed of light'],
    ['3.12.2.4', 'The discovery of photoelectricity: ultraviolet catastrophe, Planck\'s quanta, failure of classical wave theory, Einstein\'s explanation'],
    ['3.12.2.5', 'Wave–particle duality: de Broglie\'s hypothesis; low-energy electron diffraction'],
    ['3.12.2.6', 'Electron microscopes: anode voltage for atomic-scale wavelengths; TEM and scanning tunnelling microscope'],
  ]),
  topic('3.12.3', 'Turning points in physics (option) · Special relativity (A-level only)', [
    ['3.12.3.1', 'The Michelson–Morley experiment: interferometer; failure to detect absolute motion; invariance of the speed of light'],
    ['3.12.3.2', 'Einstein\'s theory of special relativity: inertial frames; the two postulates'],
    ['3.12.3.3', 'Time dilation: proper time; t = t₀/√(1 − v²/c²); muon decay evidence'],
    ['3.12.3.4', 'Length contraction: l = l₀√(1 − v²/c²)'],
    ['3.12.3.5', 'Mass and energy: E = mc²; E = m₀c²/√(1 − v²/c²); mass and kinetic energy against speed; Bertozzi\'s experiment'],
  ]),

  // ── Option: Electronics ───────────────────────────────────────────────────
  topic('3.13.1', 'Electronics (option) · Discrete semiconductor devices (A-level only)', [
    ['3.13.1.1', 'MOSFET: structure, drain/source/gate, VDS, VGS, IDSS, Vth; use as a switch and high-input-resistance device (N-channel enhancement)'],
    ['3.13.1.2', 'Zener diode: characteristic curve; constant voltage source with a resistor; reference voltage'],
    ['3.13.1.3', 'Photodiode: characteristic and spectral response curves; photoconductive mode; detecting particles with a scintillator'],
    ['3.13.1.4', 'Hall effect sensor: magnetic field sensor for attitude; tachometer'],
  ]),
  topic('3.13.2', 'Electronics (option) · Analogue and digital signals (A-level only)', [
    ['3.13.2.1', 'Analogue versus digital signals: bits and bytes; analogue-to-digital conversion, sampling rate, quantisation, noise; pulse code modulation; sensors'],
  ]),
  topic('3.13.3', 'Electronics (option) · Analogue signal processing (A-level only)', [
    ['3.13.3.1', 'LC resonance filters: f₀ = 1/2π√(LC); parallel resonance; LC and mass–spring analogy; response curve; Q factor and bandwidth'],
    ['3.13.3.2', 'The ideal operational amplifier: infinite open-loop gain and input resistance; open-loop transfer function; comparator'],
  ]),
  topic('3.13.4', 'Electronics (option) · Operational amplifier configurations (A-level only)', [
    ['3.13.4.1', 'Inverting amplifier: Vout/Vin = −Rf/R₁; virtual earth'],
    ['3.13.4.2', 'Non-inverting amplifier: Vout/Vin = 1 + Rf/R₁'],
    ['3.13.4.3', 'Summing and difference amplifiers'],
    ['3.13.4.4', 'Real operational amplifiers: limitations; frequency response; gain × bandwidth = constant'],
  ]),
  topic('3.13.5', 'Electronics (option) · Digital signal processing (A-level only)', [
    ['3.13.5.1', 'Combinational logic: Boolean algebra, truth tables, AND NAND OR NOR NOT EOR gates, designing circuits from truth tables'],
    ['3.13.5.2', 'Sequential logic: binary, BCD and Johnson counters; clock, reset, up/down; modulo-n counters'],
    ['3.13.5.3', 'Astables: oscillator as clock; frequency, pulse width, period, duty cycle, mark-to-space ratio; RC control of frequency'],
  ]),
  topic('3.13.6', 'Electronics (option) · Data communication systems (A-level only)', [
    ['3.13.6.1', 'Principles of communication systems: block diagram of a real-time system and the purpose of each stage'],
    ['3.13.6.2', 'Transmission media: metal wire, optic fibre, radio and microwave; ground and sky waves; satellite systems; advantages and disadvantages'],
    ['3.13.6.3', 'Time-division multiplexing: basic principles'],
    ['3.13.6.4', 'Amplitude (AM) and frequency modulation (FM): carrier and information signals; graphs; bandwidth = 2fM (AM), 2(Δf + fM) (FM); channel capacity'],
  ]),
]
