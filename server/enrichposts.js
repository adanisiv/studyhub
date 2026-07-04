require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');

// Replace short placeholder content with real study-material body text.
// Each entry matches on a substring of the old content and replaces the whole body.
const REPLACEMENTS = [
  // ── Computer Science ────────────────────────────────────────────────────
  {
    match: 'CRISPR lecture summary',
    content: `CRISPR-Cas9 Full Lecture Summary

How it works:
1. Guide RNA (gRNA) is designed to match the target DNA sequence (~20 bp).
2. The Cas9 protein binds to the gRNA and scans the genome for the matching sequence.
3. Cas9 requires a PAM sequence (NGG for SpCas9) immediately downstream of the target.
4. Cas9 creates a double-strand break (DSB) 3 bp upstream of the PAM.
5. The cell repairs the DSB via:
   - NHEJ (Non-Homologous End Joining) → introduces indels → gene knockout
   - HDR (Homology-Directed Repair) → precise edit using a donor template

Key applications:
• Gene knockout (disease models)
• Gene correction (sickle cell, Duchenne MD)
• CRISPRi / CRISPRa — regulate gene expression without cutting
• Base editing — C→T or A→G without DSB
• Prime editing — "search and replace" for the genome

Off-target effects:
- Minimised by: high-fidelity Cas9 variants (eSpCas9, HiFi Cas9), truncated gRNAs, paired nickases
- Detected by: GUIDE-seq, CIRCLE-seq

Ethical considerations: germline editing (He Jiankui case 2018), equity of access, consent.

Exam tip: know the difference between NHEJ vs HDR outcomes and when each is used.`
  },

  // ── Mathematics ──────────────────────────────────────────────────────────
  {
    match: 'chapters 11–14 of Stewart Calculus',
    content: `Calculus 2 — Chapters 11–14 Key Methods

Integration by Parts (Ch 11):
  ∫u dv = uv − ∫v du
  LIATE rule for choosing u: Logarithmic, Inverse trig, Algebraic, Trig, Exponential
  Classic example: ∫x·eˣ dx → u=x, dv=eˣdx → xeˣ − eˣ + C

Trigonometric Substitution (Ch 12):
  √(a²−x²)  → x = a sinθ
  √(a²+x²)  → x = a tanθ
  √(x²−a²)  → x = a secθ
  Remember to convert back using the original triangle!

Partial Fractions (Ch 13):
  Decompose rational functions before integrating.
  Distinct linear factors: A/(x−r₁) + B/(x−r₂)
  Repeated linear: A/(x−r) + B/(x−r)²
  Irreducible quadratic: (Ax+B)/(x²+bx+c)

Improper Integrals (Ch 14):
  Type 1: infinite limits — replace ∞ with t, take lim t→∞
  Type 2: discontinuity in [a,b] — split at the discontinuity
  Converges if the limit exists and is finite; diverges otherwise.
  p-test: ∫₁^∞ 1/xᵖ dx converges iff p > 1

Common mistakes:
• Forgetting +C on indefinite integrals
• Wrong sign after integration by parts (double-check ∫v du)
• Not checking if the integrand has a discontinuity before integrating`
  },

  {
    match: 'Graph theory cheat sheet',
    content: `Discrete Mathematics — Graph Theory Complete Summary

Basic Definitions:
  Graph G = (V, E) where V = vertices, E = edges
  Degree of vertex v: deg(v) = number of edges incident to v
  Handshaking Lemma: Σ deg(v) = 2|E|

Types of graphs:
  • Simple: no self-loops, no multiple edges
  • Complete Kₙ: every pair of vertices connected → |E| = n(n−1)/2
  • Bipartite: vertices split into two sets, edges only between sets
  • Tree: connected, acyclic → |E| = |V| − 1

Euler vs Hamiltonian:
  Euler circuit: visits every EDGE exactly once
    → exists iff graph is connected and every vertex has even degree
  Euler path: visits every edge exactly once (start ≠ end)
    → exists iff exactly 2 vertices have odd degree
  Hamiltonian circuit: visits every VERTEX exactly once
    → no simple necessary-and-sufficient condition (NP-complete!)

Planarity:
  Planar: can be drawn with no crossing edges
  Euler's formula for connected planar graphs: V − E + F = 2 (F = faces)
  Kuratowski's theorem: non-planar iff contains subdivision of K₅ or K₃,₃

Graph Colouring:
  Chromatic number χ(G) = minimum colours needed so no adjacent vertices share colour
  Four Colour Theorem: every planar graph has χ(G) ≤ 4
  Greedy colouring: not always optimal but O(V+E)

Exam tip: for Euler circuit questions, always check degree parity first.`
  },

  {
    match: 'Z-table, t-table and chi-squared',
    content: `Statistics — Key Tables & When to Use Each

Z-table (Standard Normal):
  Use when: population σ known OR n ≥ 30 (CLT applies)
  Z = (X̄ − μ) / (σ/√n)
  Common critical values: Z₀.₀₅ = 1.645, Z₀.₀₂₅ = 1.96, Z₀.₀₀₅ = 2.576

t-table (Student's t):
  Use when: population σ unknown AND n < 30
  t = (X̄ − μ) / (s/√n)   where s = sample standard deviation
  Degrees of freedom: df = n − 1
  As df → ∞, t-distribution → Z-distribution

Chi-squared (χ²) table:
  Use for: goodness-of-fit, test of independence (contingency tables)
  χ² = Σ (Observed − Expected)² / Expected
  df for independence test = (rows−1)(cols−1)
  Assumption: all expected frequencies ≥ 5

F-table:
  Use for: ANOVA (comparing means of 3+ groups), comparing two variances
  F = MSbetween / MSwithin
  Two sets of df: numerator (k−1) and denominator (N−k)

Type I vs Type II errors:
  Type I (α): reject H₀ when it's true — "false alarm" — controlled by significance level
  Type II (β): fail to reject H₀ when it's false — "miss" — related to power (1−β)

p-value interpretation:
  p < α → reject H₀ (result is statistically significant)
  p ≥ α → fail to reject H₀ (insufficient evidence)
  p-value is NOT the probability that H₀ is true!`
  },

  // ── Economics ────────────────────────────────────────────────────────────
  {
    match: 'CAPM and APT comparison',
    content: `Financial Economics — CAPM vs APT Cheat Sheet

CAPM (Capital Asset Pricing Model):
  E(Rᵢ) = Rƒ + βᵢ[E(Rₘ) − Rƒ]
  • Single-factor model (market risk only)
  • β = Cov(Rᵢ, Rₘ) / Var(Rₘ) → measures sensitivity to market
  • Security Market Line (SML): plots E(R) vs β
  • Assets above SML = underpriced (buy); below SML = overpriced (sell)
  • Assumptions: rational investors, mean-variance optimisation, no taxes/transaction costs

APT (Arbitrage Pricing Theory — Ross 1976):
  E(Rᵢ) = Rƒ + β₁λ₁ + β₂λ₂ + … + βₙλₙ
  • Multi-factor model — any number of systematic risk factors
  • λₖ = risk premium for factor k; βᵢₖ = sensitivity of asset i to factor k
  • Common factors: GDP growth, inflation, interest rates, credit spreads
  • No-arbitrage condition: well-diversified portfolios earn only factor risk premiums

Key differences:
  | | CAPM | APT |
  |---|---|---|
  | Factors | 1 (market) | Multiple |
  | Basis | Equilibrium | No-arbitrage |
  | Assumptions | Stronger | Weaker |
  | Testability | Easier | Harder (which factors?) |

The Greeks (options pricing):
  Δ (Delta): ∂V/∂S — change in option price per £1 change in underlying
  Γ (Gamma): ∂²V/∂S² — rate of change of delta
  Θ (Theta): ∂V/∂t — time decay (usually negative for long positions)
  ν (Vega): ∂V/∂σ — sensitivity to implied volatility
  ρ (Rho): ∂V/∂r — sensitivity to interest rate`
  },

  {
    match: 'R script for OLS regression',
    content: `Econometrics — OLS Regression in R with Robust Standard Errors

# Load required packages
library(sandwich)   # for robust standard errors
library(lmtest)     # for coeftest()
library(stargazer)  # for nice output tables

# Load the practice dataset (from Moodle)
data <- read.csv("practice_data.csv")

# Basic OLS regression
model <- lm(wage ~ education + experience + female, data = data)
summary(model)

# Heteroskedasticity test (Breusch-Pagan)
library(lmtest)
bptest(model)
# If p < 0.05 → heteroskedasticity present → use robust SEs

# Robust standard errors (HC3 — recommended for small samples)
coeftest(model, vcov = vcovHC(model, type = "HC3"))

# Nicer output comparing OLS vs Robust SEs
stargazer(model, se = list(sqrt(diag(vcovHC(model, "HC3")))),
          title = "Wage Regression Results", type = "text")

# Interpreting coefficients:
# education: each extra year of education → β₁ change in wage (ceteris paribus)
# female: dummy variable → wage gap between male and female, holding other vars constant
# experience: each extra year → β₂ change in wage

# Checking OLS assumptions:
# 1. Linearity: plot(model, 1) — residuals vs fitted
# 2. Normality: plot(model, 2) — Q-Q plot
# 3. Homoskedasticity: plot(model, 3) — scale-location
# 4. No influential observations: plot(model, 5) — Cook's distance

# Durbin-Watson test for autocorrelation
dwtest(model)
# DW ≈ 2 → no autocorrelation; DW → 0 → positive autocorrelation; DW → 4 → negative`
  },

  // ── Medicine ─────────────────────────────────────────────────────────────
  {
    match: 'OSCE checklist for the clinical skills',
    content: `OSCE Clinical Skills Checklist — History Taking Station (15 min)

INTRODUCTION (1 min):
  ☐ Wash hands / use gel
  ☐ Introduce yourself (name + role)
  ☐ Confirm patient name and DOB
  ☐ Explain what you're going to do and gain consent
  ☐ Offer a chaperone if appropriate

PRESENTING COMPLAINT (3 min):
  ☐ Open question: "What's brought you in today?"
  ☐ Let patient speak for 60 seconds without interrupting
  ☐ SOCRATES for pain:
    Site | Onset | Character | Radiation | Associated symptoms | Timing | Exacerbating/relieving factors | Severity (0–10)

SYSTEMS REVIEW (3 min):
  ☐ Cardiovascular: chest pain, palpitations, dyspnoea, orthopnoea, ankle swelling
  ☐ Respiratory: cough, sputum, haemoptysis, wheeze
  ☐ GI: nausea, vomiting, change in bowel habit, rectal bleeding, weight loss
  ☐ Neurological: headache, syncope, weakness, sensory changes, vision

PAST MEDICAL / SURGICAL HISTORY: ☐
DRUG HISTORY + ALLERGIES: ☐ (include OTC + herbal)
FAMILY HISTORY: ☐ (first-degree relatives, sudden cardiac death, malignancy)
SOCIAL HISTORY: ☐ MUST include:
  - Smoking (pack years), alcohol (units/week), recreational drugs
  - Occupation, living situation, who's at home, exercise tolerance

CLOSING (1 min):
  ☐ "Is there anything else you'd like to tell me?"
  ☐ Thank the patient
  ☐ Summarise findings to examiner

Common marks lost: not asking about allergies, forgetting SOCRATES, interrupting the patient early.`
  },

  {
    match: '80-slide histology summary',
    content: `Histology & Pathology — Key Tissue Types Summary

EPITHELIUM:
  Simple squamous: alveoli, blood vessels (endothelium), Bowman's capsule
  Simple cuboidal: kidney tubules, thyroid follicles, small ducts
  Simple columnar: GI tract (with goblet cells), uterine tubes (ciliated)
  Pseudostratified columnar: trachea/bronchi (respiratory epithelium, ciliated + goblet cells)
  Stratified squamous: skin (keratinised), oesophagus, vagina (non-keratinised)
  Transitional (urothelium): bladder, ureter, renal pelvis → cells change shape when stretched

CONNECTIVE TISSUE:
  Loose (areolar): surrounds organs; contains fibroblasts, collagen, elastin, ground substance
  Dense regular: tendons, ligaments — parallel collagen bundles
  Dense irregular: dermis, joint capsules — collagen in multiple directions
  Adipose: white fat (energy storage) vs brown fat (thermogenesis; lots of mitochondria)
  Cartilage: hyaline (articular surfaces, trachea), fibrocartilage (intervertebral discs), elastic (ear, epiglottis)
  Bone: compact (osteons/Haversian systems) vs spongy (trabeculae)

MUSCLE:
  Skeletal: voluntary, striated, multinucleate (peripheral nuclei), no intercalated discs
  Cardiac: involuntary, striated, ONE nucleus (central), branched, intercalated discs (desmosomes + gap junctions)
  Smooth: involuntary, non-striated, spindle-shaped, ONE central nucleus

NERVE TISSUE:
  Neurons: cell body (soma), dendrites (input), axon (output)
  Myelin: PNS = Schwann cells; CNS = oligodendrocytes
  Nodes of Ranvier: gaps in myelin → saltatory conduction

EXAM TIP: always identify the tissue by its epithelium first, then underlying connective tissue.`
  },

  // ── Law ──────────────────────────────────────────────────────────────────
  {
    match: 'my SWOT + PESTLE',
    content: `Marketing Strategy Frameworks — Worked Example (H&M Case)

SWOT ANALYSIS:
Strengths:
  • Global brand recognition (77 countries, 4,000+ stores)
  • Fast-fashion supply chain — 4-week design-to-shelf cycle
  • Price accessibility — broad demographic reach

Weaknesses:
  • Environmental criticism — "greenwashing" accusations
  • Over-reliance on Asian manufacturing (supply chain risk)
  • Quality perception gap vs premium competitors

Opportunities:
  • Secondhand/resale market growth (H&M's "Sellpy" investment)
  • Personalisation via AI-driven recommendations
  • Growing middle class in emerging markets (India, SE Asia)

Threats:
  • SHEIN's ultra-fast fashion at lower prices
  • Increasing ESG regulation (EU Green Deal, supply chain due diligence)
  • Consumer shift toward sustainability and slow fashion

PORTER'S FIVE FORCES (H&M):
  1. Threat of new entrants: LOW–MEDIUM (high capital for physical retail, but low for online-only)
  2. Bargaining power of suppliers: LOW (H&M sources from 900+ suppliers, easily switched)
  3. Bargaining power of buyers: HIGH (low switching cost, many alternatives)
  4. Threat of substitutes: HIGH (secondhand, rental fashion, premium basics)
  5. Competitive rivalry: HIGH (Zara, Primark, SHEIN, Uniqlo)

BCG MATRIX (H&M Group brands):
  Stars: COS, & Other Stories (high growth, high share in premium segment)
  Cash Cow: H&M mainline (high share, slower growth)
  Question Mark: ARKET, Afound (newer concepts, uncertain position)
  Dog: Monki (declining relevance in core markets)`
  },

  // ── Electrical Engineering ───────────────────────────────────────────────
  {
    match: 'solved problem set for Thevenin',
    content: `Circuits & Electronics — Complete Method Guide

THEVENIN'S THEOREM (step-by-step):
  Goal: replace a complex network with Vth in series with Rth at terminals A–B.
  1. Remove the load resistor (open-circuit terminals A–B).
  2. Find Voc = Vth (voltage across open terminals using KVL/KCL/node voltage).
  3. Deactivate independent sources (voltage sources → short; current sources → open).
  4. Find Rth = resistance seen from terminals A–B (often by inspection or Voc/Isc).
  5. Reconnect load: I_load = Vth / (Rth + R_load)

NORTON'S THEOREM:
  Norton equivalent = current source Isc in parallel with Rth
  Isc = Vth / Rth   (or find directly by short-circuiting terminals A–B)
  Convert Norton ↔ Thevenin freely: they are equivalent!

SUPERPOSITION (for linear circuits only):
  1. Kill all sources except one (V sources → short; I sources → open).
  2. Calculate the contribution of that source to the desired variable.
  3. Repeat for each source.
  4. Algebraically add all contributions (watch signs!).

MESH ANALYSIS:
  1. Assign mesh currents clockwise (I₁, I₂ … Iₙ).
  2. Write KVL for each mesh: Σ voltage drops = 0.
  3. For shared branches: current = I₁ − I₂ (direction matters).
  4. Solve the system of equations (matrix form: [R][I] = [V]).

NODE VOLTAGE METHOD:
  1. Choose a reference node (ground).
  2. Assign node voltages V₁, V₂ … Vₙ.
  3. Write KCL at each non-reference node: Σ currents leaving = 0.
  4. Solve for voltages, then find branch currents with Ohm's law.

Common mistake: forgetting to account for the direction of dependent sources in Rth calculation — must use Voc/Isc method if dependent sources are present.`
  },

  {
    match: 'Fourier series derivation',
    content: `Signals & Systems — Fourier Series & Transform Summary

FOURIER SERIES (periodic signals, period T):
  x(t) = a₀ + Σₙ [aₙcos(nω₀t) + bₙsin(nω₀t)]   where ω₀ = 2π/T

  Coefficients:
    a₀ = (1/T) ∫₀ᵀ x(t) dt              (DC component = average value)
    aₙ = (2/T) ∫₀ᵀ x(t)cos(nω₀t) dt
    bₙ = (2/T) ∫₀ᵀ x(t)sin(nω₀t) dt

  Complex exponential form:
    x(t) = Σₙ cₙ e^(jnω₀t)
    cₙ = (1/T) ∫₀ᵀ x(t)e^(−jnω₀t) dt

Standard waveforms:
  Square wave (duty 50%): cₙ = (2/(nπ)) for odd n, 0 for even n
  Sawtooth wave: cₙ = j/(nπ) for n≠0
  Triangle wave: decays as 1/n² → smoother spectrum

FOURIER TRANSFORM (aperiodic signals):
  X(jω) = ∫₋∞^∞ x(t)e^(−jωt) dt
  x(t) = (1/2π) ∫₋∞^∞ X(jω)e^(jωt) dω

Key pairs to memorise:
  δ(t) ↔ 1
  1 ↔ 2πδ(ω)
  e^(−at)u(t) ↔ 1/(a+jω)   for a>0
  rect(t/τ) ↔ τ sinc(ωτ/2)

Properties:
  Linearity: ax(t)+by(t) ↔ aX(jω)+bY(jω)
  Time shift: x(t−t₀) ↔ e^(−jωt₀)X(jω)
  Convolution: x(t)*y(t) ↔ X(jω)·Y(jω)   ← key for LTI systems!
  Parseval's theorem: ∫|x(t)|²dt = (1/2π)∫|X(jω)|²dω

LTI System Analysis:
  Output Y(jω) = H(jω)·X(jω)
  H(jω) = frequency response (Fourier transform of impulse response h(t))
  |H(jω)| = magnitude response; ∠H(jω) = phase response`
  },

  // ── Pharmacy ─────────────────────────────────────────────────────────────
  {
    match: 'Top 10 clinically significant drug-drug interactions',
    content: `Drug Interactions — Top 10 You MUST Know for the Exam

1. WARFARIN + NSAIDs (e.g. ibuprofen)
   Mechanism: DUAL — PK (NSAIDs inhibit CYP2C9 → ↑ warfarin) + PD (both impair haemostasis)
   Risk: major GI bleeding
   Management: avoid; if necessary, use paracetamol instead; monitor INR closely

2. WARFARIN + ANTIBIOTICS (e.g. metronidazole, fluconazole)
   Mechanism: inhibit CYP2C9/CYP3A4 → reduced warfarin metabolism → ↑ INR
   Management: reduce warfarin dose, monitor INR during and 1 week after course

3. METHOTREXATE + NSAIDs
   Mechanism: NSAIDs reduce renal clearance of MTX → toxic levels
   Risk: bone marrow suppression, mucositis, renal failure
   Management: AVOID combination; use paracetamol if analgesia needed

4. STATINS + CYP3A4 INHIBITORS (e.g. clarithromycin, diltiazem, grapefruit)
   Mechanism: inhibit statin metabolism → ↑ plasma levels
   Risk: myopathy, rhabdomyolysis (esp. simvastatin, lovastatin)
   Management: use pravastatin/rosuvastatin (not CYP3A4 metabolised)

5. SSRIs + MAOIs
   Mechanism: serotonin syndrome (excess 5-HT at synapses)
   Risk: hyperthermia, rigidity, seizures, death
   Management: 14-day washout period between MAOI and SSRI

6. ACE INHIBITORS + POTASSIUM-SPARING DIURETICS (spironolactone)
   Mechanism: both reduce aldosterone effect → hyperkalaemia
   Risk: cardiac arrhythmia, arrest
   Management: monitor K⁺; avoid combination in renal impairment

7. DIGOXIN + AMIODARONE
   Mechanism: amiodarone inhibits P-gp → ↑ digoxin levels
   Risk: digoxin toxicity (nausea, visual changes, bradycardia, arrhythmia)
   Management: reduce digoxin dose by 50%, monitor plasma levels + ECG

8. QUINOLONES / TETRACYCLINES + ANTACIDS (Al³⁺, Mg²⁺, Ca²⁺)
   Mechanism: chelation → reduced antibiotic absorption (PK — absorption)
   Management: separate by 2 hours (antibiotic first, antacid after)

9. LITHIUM + NSAIDs / THIAZIDES
   Mechanism: reduced renal Li⁺ clearance → toxicity
   Signs of toxicity: tremor, ataxia, confusion, seizures
   Management: avoid; if unavoidable, reduce Li dose and monitor levels

10. CARBAMAZEPINE + OCP (oral contraceptive pill)
    Mechanism: CYP3A4 inducer → ↑ oestrogen/progestogen metabolism → ↓ contraceptive effect
    Risk: unintended pregnancy
    Management: use additional contraception (barrier) or switch to DMPA injection`
  },

  {
    match: 'SAR (structure-activity relationship) notes for beta-lactam',
    content: `Pharmaceutical Chemistry — Beta-Lactam SAR & Resistance

CORE STRUCTURE:
  All beta-lactams share the 4-membered beta-lactam ring (azetidinone).
  The ring must remain intact for antibacterial activity.

  Penicillins: beta-lactam fused to 5-membered thiazolidine ring
  Cephalosporins: beta-lactam fused to 6-membered dihydrothiazine ring → more stable
  Carbapenems: beta-lactam fused to 5-membered ring with double bond → broadest spectrum
  Monobactams (aztreonam): beta-lactam ring alone → only Gram-negative coverage

STRUCTURE-ACTIVITY RELATIONSHIPS:

1. R₁ side chain (6-position in penicillins, 7-position in cephalosporins):
   • Bulky R₁ group → steric protection from beta-lactamases (e.g. methicillin, oxacillin)
   • Amino group (ampicillin, amoxicillin) → improves Gram-negative penetration
   • Carboxyl group → anti-pseudomonal activity (ticarcillin)

2. Beta-lactam ring strain:
   • Essential for high reactivity with PBPs (penicillin-binding proteins)
   • Beta-lactamases exploit this: hydrolysis of the C–N bond → inactive penicilloic acid

3. R₂ side chain (cephalosporins only — 3-position):
   • Can be modified to improve pharmacokinetics, oral bioavailability, or spectrum
   • Acetyl group → prodrug (absorbed orally, then hydrolysed)

RESISTANCE MECHANISMS:
  1. Beta-lactamase production: enzyme hydrolyses the ring (most common)
     → Overcome by: beta-lactamase inhibitors (clavulanate, tazobactam, sulbactam)
  2. Altered PBPs (target modification): e.g. MRSA produces PBP2a (low affinity)
  3. Porin loss: Gram-negatives reduce outer membrane permeability
  4. Efflux pumps: actively export beta-lactams

Exam tip: MRSA is resistant to ALL beta-lactams EXCEPT ceftaroline (5th-gen cephalosporin with PBP2a affinity).`
  },

  // ── Biology ──────────────────────────────────────────────────────────────
  {
    match: 'Signal transduction pathway summary',
    content: `Cell Biology — Signal Transduction Pathways

1. GPCR → cAMP → PKA PATHWAY
   Receptor: G-protein coupled receptor (7 transmembrane domains)
   Steps:
     Ligand binds → Gα-GTP activated → adenylyl cyclase activated
     → cAMP ↑ → PKA (protein kinase A) activated
     → Phosphorylates target proteins (CREB, glycogen phosphorylase, etc.)
   Termination: phosphodiesterase degrades cAMP → GDP replaces GTP on Gα
   Examples: β-adrenergic receptor (adrenaline), glucagon receptor

2. RTK → RAS → MAPK PATHWAY
   Receptor: Receptor Tyrosine Kinase (dimerises upon ligand binding)
   Steps:
     Growth factor binds → RTK dimerises → auto-phosphorylation of tyrosines
     → Grb2/SOS recruited → RAS-GDP → RAS-GTP
     → RAF → MEK → ERK (MAPK) phosphorylated
     → ERK enters nucleus → activates transcription factors (Myc, Fos)
   Role: cell proliferation, survival, differentiation
   Cancer relevance: RAS mutation in ~30% of human cancers (constitutively active)

3. PI3K → AKT → mTOR PATHWAY
   Steps:
     RTK activation → PI3K recruited → PIP₂ → PIP₃
     → PDK1 + AKT recruited to membrane → AKT phosphorylated
     → AKT activates mTORC1 → protein synthesis, cell growth
     → AKT inhibits apoptosis (phosphorylates BAD, MDM2)
   Tumour suppressor: PTEN reverses PI3K (dephosphorylates PIP₃ → PIP₂)

4. JAK-STAT PATHWAY
   Receptors: cytokine receptors (no intrinsic kinase activity)
   Steps: cytokine → receptor dimerises → JAK trans-phosphorylation
     → STAT recruited → STAT phosphorylated → STAT dimerises
     → enters nucleus → gene transcription
   Examples: interferon signalling, EPO, growth hormone

Key principles:
  • Signal amplification: one receptor → thousands of downstream molecules
  • Cross-talk: pathways interact (RAS activates PI3K)
  • Negative feedback: ERK phosphorylates SOS (inactivates it) → self-limiting`
  },

  // ── Architecture ─────────────────────────────────────────────────────────
  {
    match: 'Complete timeline from Egyptian to Deconstructivism',
    content: `History of Architecture — Complete Timeline & Key Concepts

ANCIENT (3000 BCE – 400 CE):
  Egyptian: post-and-lintel, massive stone, axis & symmetry (Karnak Temple, Great Pyramid)
  Greek: Orders (Doric → Ionic → Corinthian), proportion, trabeated system (Parthenon)
  Roman: arch, vault, dome, concrete (opus caementicium), engineering (Pantheon, Colosseum)

MEDIEVAL (400–1400 CE):
  Byzantine: central plan, pendentive dome, mosaic decoration (Hagia Sophia)
  Romanesque: thick walls, small windows, round arches, barrel vaults (Durham Cathedral)
  Gothic: pointed arch, flying buttress → thin walls, large stained glass (Notre Dame, Chartres)
    → height = heavenward aspiration; light = divine presence

RENAISSANCE & BAROQUE (1400–1750):
  Renaissance: revival of classical principles, symmetry, geometry (Brunelleschi, Palladio)
    Palladio's influence → Palladianism → Georgian architecture → US Capitol
  Baroque: drama, movement, light & shadow, curved forms, illusion (Borromini, Bernini)

INDUSTRIAL & 19th CENTURY (1750–1900):
  Neoclassicism: reaction to Baroque excess; rationalism (Ledoux, Soane)
  Victorian eclecticism: Gothic Revival, Renaissance Revival, Arts & Crafts
  Iron & Glass: Crystal Palace (Paxton, 1851) → prefabrication, modular construction

MODERNISM (1900–1970):
  Art Nouveau (1890–1910): organic forms, craft, Gaudi (Sagrada Família)
  Early Modernism: Loos "Ornament is crime"; Sullivan "form follows function"
  Bauhaus (1919–1933): art + technology + industry; Gropius, Mies, Breuer
  International Style: Mies ("less is more"), Le Corbusier (5 points), flat roofs, curtain walls
  Le Corbusier's 5 Points: pilotis / free plan / free façade / ribbon windows / roof garden
  Brutalism: exposed concrete, honest materials, social housing (Barbican, Trellick Tower)

LATE MODERNISM & POSTMODERNISM (1960–2000):
  Postmodernism: reaction to modernist austerity; irony, historical reference, colour
    Venturi: "Less is a bore"; AT&T Building (Johnson)
  High-Tech: exposed structure & services (Piano/Rogers — Pompidou Centre; Foster — Lloyds)
  Critical Regionalism: global modernism adapted to local climate/culture (Tadao Ando, Alvaro Siza)

CONTEMPORARY (2000–present):
  Deconstructivism: fragmented, non-Euclidean geometry, instability (Gehry, Zaha Hadid, Libeskind)
    Key works: Guggenheim Bilbao (Gehry), MAXXI Rome (Hadid), Jewish Museum Berlin (Libeskind)
  Parametric Design: algorithm-driven form (Hadid, SOM); fabrication via CNC/3D printing
  Sustainability: passive design, BREEAM/LEED, net-zero, biophilic design`
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    match: 'McLuhan summary',
    content: `Communication Theory — McLuhan Complete Summary

KEY CONCEPT: "The Medium is the Message"
  The medium itself (not the content) shapes how we perceive and think.
  TV watching changes cognition differently from reading — regardless of the TV show.
  The "content" of any medium is always another medium (content of TV = film; content of film = the novel).

HOT vs COOL MEDIA:
  Hot media: high definition (data-dense), low participation from audience
    Examples: radio, film, photography, lecture
    → Audiences receive passively; little need to "fill in" information

  Cool media: low definition, high participation/involvement required
    Examples: telephone, TV (1960s low-res), cartoons, seminars
    → Audience must actively engage to make sense of the message

  NB: McLuhan wrote in the 1960s — modern HD TV would be "hot" by his logic.

THE GLOBAL VILLAGE:
  Electronic media compress time and space → world becomes a "village"
  Tribal oral culture (acoustic space) → literacy fragmenting senses → electric media reunifying them
  McLuhan saw this as double-edged: community + loss of privacy/individuality

THE 4 LAWS OF MEDIA (Tetrad):
  Every medium simultaneously:
  1. ENHANCES something (what does it amplify?)
  2. OBSOLESCES something (what does it make redundant?)
  3. RETRIEVES something previously obsolesced (what older medium/value does it revive?)
  4. REVERSES into its opposite when pushed to its limit (what does it flip into?)

  Example — the Car:
  1. Enhances: individual mobility, speed
  2. Obsolesces: horse-drawn transport, walking culture
  3. Retrieves: knight-in-armour status, suburban village
  4. Reverses: at limit → traffic jams (immobility), road rage, urban sprawl

TRANSMISSION vs RITUAL MODEL (Carey):
  Transmission model: communication as sending information from A to B (Shannon-Weaver)
    Focus: efficiency, accuracy, noise reduction
  Ritual model: communication as shared participation in a culture
    Focus: how communication creates/maintains shared beliefs and social bonds
    Example: reading the newspaper = participating in a cultural ritual, not just receiving news

Exam tip: McLuhan is descriptive, not prescriptive — he analyses media effects, not condemns or praises them.`
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  let updated = 0;
  for (const { match, content } of REPLACEMENTS) {
    const result = await Post.updateMany(
      { content: { $regex: match, $options: 'i' } },
      { $set: { content } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✓ Updated ${result.modifiedCount} post(s) matching: "${match.slice(0, 50)}..."`);
      updated += result.modifiedCount;
    }
  }

  console.log(`\nDone — enriched ${updated} posts total.`);
  mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
