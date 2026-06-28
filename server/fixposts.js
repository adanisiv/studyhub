require('dotenv').config();
const mongoose = require('mongoose');
require('./models/User');
require('./models/Group');
const Post = require('./models/Post');

const fixes = [
  {
    id: '6a3faec69a96675200c4989a',
    content: `JWT Authentication with Express — Full Tutorial

What is JWT?
JWT (JSON Web Token) is a compact, self-contained token used to securely transmit user identity between client and server.

Structure: header.payload.signature
  Header:    { "alg": "HS256", "typ": "JWT" }
  Payload:   { "userId": "123", "role": "student", "iat": 1700000000, "exp": 1700086400 }
  Signature: HMACSHA256(base64(header) + '.' + base64(payload), SECRET_KEY)

Server-side (Express):

  const jwt = require('jsonwebtoken');

  // Login route — generate token
  app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  });

  // Auth middleware — protect routes
  const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
      next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
  };

  app.get('/profile', auth, async (req, res) => {
    const user = await User.findById(req.userId);
    res.json(user);
  });

Client-side (React):
  localStorage.setItem('token', data.token);

  const API = axios.create({ baseURL: '/api' });
  API.interceptors.request.use(cfg => {
    cfg.headers.Authorization = 'Bearer ' + localStorage.getItem('token');
    return cfg;
  });

Security tips:
  Store token in localStorage (simple) or httpOnly cookie (more secure)
  Never put passwords or secrets in the payload — it is base64, not encrypted!
  Use short expiry (1–24h) and refresh tokens in production.`
  },
  {
    id: '6a3faec69a96675200c498b1',
    content: `Linear Regression from Scratch in Python

import numpy as np
import matplotlib.pyplot as plt

# Generate sample data: y = 4 + 3x + noise
np.random.seed(42)
X = 2 * np.random.rand(100, 1)
y = 4 + 3 * X + np.random.randn(100, 1)

# 1) CLOSED-FORM SOLUTION — Normal Equation
# theta = (X^T X)^{-1} X^T y
X_b = np.c_[np.ones((100, 1)), X]   # bias column x0=1
theta_ne = np.linalg.inv(X_b.T @ X_b) @ X_b.T @ y
print("Normal equation theta:", theta_ne.ravel())   # ~[4, 3]

# 2) BATCH GRADIENT DESCENT
eta = 0.1
n_iter = 1000
theta_gd = np.random.randn(2, 1)

for _ in range(n_iter):
    grad = (2 / 100) * X_b.T @ (X_b @ theta_gd - y)
    theta_gd -= eta * grad

print("Gradient descent theta:", theta_gd.ravel())   # also ~[4, 3]

# 3) EVALUATION
y_hat = X_b @ theta_gd
mse = np.mean((y - y_hat) ** 2)
r2  = 1 - np.sum((y - y_hat) ** 2) / np.sum((y - y.mean()) ** 2)
print(f"MSE: {mse:.4f}  |  R2: {r2:.4f}")

# 4) PLOT
X_line = np.array([[0], [2]])
y_line = np.c_[np.ones((2, 1)), X_line] @ theta_gd
plt.scatter(X, y, alpha=0.5, label='Data')
plt.plot(X_line, y_line, 'r-', lw=2, label='Prediction')
plt.xlabel('X'); plt.ylabel('y')
plt.legend(); plt.title('Linear Regression'); plt.show()`
  },
  {
    id: '6a40e35e79323f16e2767c8a',
    content: `Nesher Case (ע"פ 559/77) — Criminal Law Summary

Facts:
  Nesher was convicted of manslaughter after causing the death of a pedestrian while driving.
  Central issue: what level of negligence is required for criminal liability?

Supreme Court ruling:
  Criminal negligence requires more than ordinary civil negligence.
  The defendant must have been AWARE of the risk and consciously disregarded it (recklessness),
  OR the risk was so glaringly obvious that any reasonable person would have foreseen it.

4 levels of mens rea in Israeli criminal law:
  1. Intent (כוונה): the defendant desired the result
  2. Purpose (מטרה): acted to achieve a specific goal
  3. Recklessness (פזיזות): aware of the risk, consciously took it anyway
  4. Negligence (רשלנות): should have been aware — objective reasonable person test

Criminal vs Civil Negligence:
  Civil: objective test only — would a reasonable person have foreseen harm?
  Criminal: stricter — requires awareness of risk (recklessness) OR gross departure
  from the reasonable person standard

Why Nesher matters:
  Sets the threshold for criminal liability in traffic and similar offences.
  Mere careless driving is NOT criminal manslaughter unless recklessness is present.

Exam tip: always identify which of the 4 mens rea levels the facts point to, and explain why.`
  },
  {
    id: '6a40e35e79323f16e2767c8d',
    content: `Contract Law — Consideration: Key Principles & Cases

What is consideration?
  What each party gives in exchange for the other's promise.
  Must be real, but courts do NOT ask whether it was a fair deal.

Key rules:

1. Consideration must move from the promisee
   Tweddle v Atkinson (1861): a third party cannot sue on a contract between others.

2. Past consideration is NO consideration
   Re McArdle (1951): work done BEFORE a promise cannot be consideration for it.
   Exception: if done at the promisor's request with payment always implied (Lampleigh v Brathwait)

3. Consideration need not be adequate — but must be sufficient
   Chappell v Nestle (1960): chocolate wrappers counted as consideration even if worthless.

4. Performing an existing public duty is NOT consideration
   Collins v Godefroy (1831): testifying when legally compelled = nothing extra given.

5. Performing an existing contractual duty is NOT consideration
   Stilk v Myrick (1809): sailors promised extra pay for same work — not enforceable.
   BUT doing MORE than obliged IS good consideration (Hartley v Ponsonby)

6. Part-payment of debt does NOT discharge the whole debt
   Foakes v Beer: paying half a debt does not release you from the rest.
   Exception: promissory estoppel (High Trees case — detrimental reliance)

Exam tip: for any problem question, identify WHICH rule applies and WHY the consideration fails or succeeds.`
  },
  {
    id: '6a40e35e79323f16e2767c8e',
    content: `Stroop Effect — Study Notes + Mini Flashcard Set

CORE CONCEPT:
  The Stroop effect = interference between automatic and controlled processing.
  Classic task: name the INK COLOR of color words (e.g. "RED" written in blue ink).
  People are consistently SLOWER when the word meaning conflicts with the ink color.

Why does it happen?
  Reading is AUTOMATIC — overlearned, happens without intentional effort.
  Color naming requires CONTROLLED attention — slower, more effortful.
  When automatic processing (reading) conflicts with controlled processing (color naming) → interference.

Conditions:
  Congruent  (RED in red ink):  fastest — word and color match
  Neutral    (XXX in red ink):  medium — no competing word meaning
  Incongruent (RED in blue ink): slowest — THIS is the Stroop effect

Theoretical explanations:
  Speed of processing: reading is simply faster than color naming
  Selective attention: hard to selectively ignore the word's meaning
  Automaticity (Logan): reading bypasses controlled attention entirely

Brain areas:
  Anterior Cingulate Cortex (ACC): detects the conflict, signals need for extra control
  Prefrontal Cortex (PFC): top-down inhibition of the automatic reading response

Clinical uses:
  Detecting frontal lobe damage (ACC / PFC lesions increase Stroop interference)
  ADHD assessment (impaired inhibitory control → larger Stroop effect)
  Emotion Stroop: emotionally charged words (e.g. "cancer" for anxious patients) also cause interference

Sample exam Q: Why does the Stroop effect decrease with practice, but never disappear completely?
  Because practice strengthens controlled processing (faster color naming) but reading remains automatic.`
  },
  {
    id: '6a40e35e79323f16e2767c96',
    content: `Linear Algebra — Chapters 1–4 Solved Exercises

CHAPTER 1 — Systems of Linear Equations

Ex 1.3: Solve by Gaussian elimination:
  2x + y  −  z = 8
 −3x − y + 2z = −11
   x + 2y +  z = 3

Augmented matrix → row-reduce:
  [ 2  1 -1 |  8 ]
  [-3 -1  2 |-11 ]  R2 = R2 + (3/2)R1  →  [0,  1/2,  1/2 |  1]
  [ 1  2  1 |  3 ]  R3 = R3 − (1/2)R1  →  [0,  3/2,  3/2 | -1]
                     R3 = R3 − 3·R2     →  [0,  0,   0   | -4]  ← contradiction
  Result: NO SOLUTION (inconsistent system)

CHAPTER 2 — Matrix Operations

Ex 2.7: Prove (AB)ᵀ = BᵀAᵀ
  [(AB)ᵀ]ᵢⱼ = [AB]ⱼᵢ = Σₖ AⱼₖBₖᵢ
  [BᵀAᵀ]ᵢⱼ  = Σₖ [Bᵀ]ᵢₖ[Aᵀ]ₖⱼ = Σₖ BₖᵢAⱼₖ = Σₖ AⱼₖBₖᵢ  ✓

CHAPTER 3 — Determinants

Ex 3.5: det([[1,2,3],[4,5,6],[7,8,9]])
  Cofactor expansion, row 1:
  = 1(5·9−6·8) − 2(4·9−6·7) + 3(4·8−5·7)
  = 1(−3) − 2(−6) + 3(−3)
  = −3 + 12 − 9 = 0
  det = 0 → singular matrix (rows are arithmetic progression → linearly dependent)

CHAPTER 4 — Vector Spaces

Ex 4.4: Is W = {(x,y,z) : x+y+z=0} a subspace of ℝ³?
  Zero vector: 0+0+0 = 0 ✓
  Closed under addition: (x₁+x₂)+(y₁+y₂)+(z₁+z₂) = 0+0 = 0 ✓
  Closed under scalar mult: c(x+y+z) = c·0 = 0 ✓
  YES — W is a subspace. dim(W) = 2.`
  },
  {
    id: '6a40e536fdb4aa46375e54c5',
    content: `Calculus 2 — Daily Problem #1: Integration by Parts

Problem: compute  ∫ x² eˣ dx

Technique: Integration by Parts — ∫u dv = uv − ∫v du
LIATE rule: choose u = x² (Algebraic), dv = eˣdx (Exponential)

Step 1:
  u = x²     →   du = 2x dx
  dv = eˣ dx →   v  = eˣ

  ∫ x²eˣ dx = x²eˣ − ∫ 2x eˣ dx

Step 2: apply IBP again to ∫ 2x eˣ dx:
  u = 2x     →   du = 2 dx
  dv = eˣ dx →   v  = eˣ

  ∫ 2x eˣ dx = 2x eˣ − ∫ 2eˣ dx = 2xeˣ − 2eˣ

Final answer:
  ∫ x²eˣ dx = x²eˣ − (2xeˣ − 2eˣ) + C
             = eˣ(x² − 2x + 2) + C

Verification — differentiate:
  d/dx[eˣ(x²−2x+2)] = eˣ(x²−2x+2) + eˣ(2x−2)
                     = eˣ(x²−2x+2+2x−2) = x²eˣ  ✓

Common mistake: forgetting to apply IBP the second time and stopping at x²eˣ − 2xeˣ.`
  },
  {
    id: '6a40e536fdb4aa46375e54ca',
    content: `Media Analysis: "The Daily" Podcast — Production Module Reflection

Podcast: "The Daily" by The New York Times
Episode analysed: "The Loneliness Epidemic"

Production techniques I identified:

1. Ambient sound as narrative opening
   The episode opens with café chatter before the host speaks — a classic technique to place
   the listener inside the story before any information is delivered.

2. Interviewer technique: minimal prompts
   Host Michael Barbaro uses short open-ended prompts ("Tell me about that", "Why?")
   rather than long structured questions. Keeps the guest talking, reduces host-driven narration.

3. Music for topic transitions
   Slow piano bridges signal section changes. The music tone (contemplative) matches the subject
   — it reinforces the emotion rather than contrasting it.

4. Intentional silence after emotional moments
   Pauses of 1–2 seconds are left after strong statements. In audio, silence = emphasis.
   It forces the listener to sit with the idea rather than moving on immediately.

5. Three-act structure
   Act 1 (hook): What is the loneliness epidemic costing us economically and medically?
   Act 2 (depth): Expert research on social disconnection trends since 1980s
   Act 3 (resolution): What policy and personal interventions are being tried?

Critical reflection:
   The episode relied heavily on one academic voice. A future episode I produce would
   interweave lived-experience interviews alongside expert analysis to balance credibility
   with relatability — a key principle from the McLuhan readings (medium shapes message as much as content).`
  },
  {
    id: '6a40e35e79323f16e2767c99',
    content: `Beta-Blockers — Complete Pharmacology Summary

MECHANISM:
  Competitive antagonists at β-adrenergic receptors.
  Block catecholamines (adrenaline, noradrenaline) from binding.
  β1 blockade: ↓heart rate, ↓contractility, ↓AV conduction velocity
  β2 blockade: bronchoconstriction (why non-selective agents are avoided in asthma)

CLASSIFICATION:
  Non-selective (β1+β2): propranolol, carvedilol (also α-blocker), labetalol (also α-blocker)
  Cardioselective (β1 only at normal doses): atenolol, bisoprolol, metoprolol, esmolol
  ISA (partial agonist activity): pindolol — less resting bradycardia, avoid post-MI

MNEMONIC for cardioselective agents — "BEAM MA":
  Bisoprolol, Esmolol, Atenolol, Metoprolol, Metoprolol succinate, Acebutolol

INDICATIONS:
  Hypertension (first-line, often combined with ACEI or thiazide)
  Angina (reduce O2 demand by lowering HR and contractility)
  Post-MI (reduce mortality, prevent remodelling — start within 24h if haemodynamically stable)
  Heart failure (bisoprolol, carvedilol — start LOW, titrate SLOWLY)
  Arrhythmias: AF rate control, SVT termination, long-QT syndrome
  Thyrotoxicosis (symptom control only — does not treat the cause)
  Migraine prophylaxis (propranolol)
  Anxiety/stage fright (propranolol 40mg PRN — short-acting)

CONTRAINDICATIONS:
  Asthma / reactive airway disease
  Second or third degree heart block
  Severe bradycardia (<50 bpm)
  Cardiogenic shock
  Uncontrolled heart failure (acute decompensation)

SIDE EFFECTS — ABCDE mnemonic:
  A — AV block, bradycardia
  B — Bronchospasm (especially non-selective)
  C — Cold extremities (peripheral vasoconstriction)
  D — Depression, fatigue, vivid dreams (propranolol crosses BBB)
  E — Erectile dysfunction, Exercise intolerance

NEVER stop abruptly — taper over 1–2 weeks.
  Sudden withdrawal → rebound tachycardia, hypertension, angina, even MI.`
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  let fixed = 0;
  for (const { id, content } of fixes) {
    const r = await Post.updateOne({ _id: id }, { $set: { content } });
    if (r.modifiedCount) { console.log('Fixed:', id); fixed++; }
    else console.log('Not found / unchanged:', id);
  }
  console.log(`\nDone — fixed ${fixed}/${fixes.length} posts`);
  mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
