require('dotenv').config();
const mongoose = require('mongoose');
const User  = require('./models/User');
const Group = require('./models/Group');
const Post  = require('./models/Post');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Fetch existing seeded users to use as group admins / post authors
  const get = email => User.findOne({ email }).lean();
  const [
    neta, dor, maya, itamar, lihi, ben, yarden, ofek,
    shaked, stav, naomi, eden, linor, yuval,
    miriam, roni, avital, gal, tal, roi,
    amit, oren, rotem, noam,            // electrical engineering
    tomer, yael, itay,                  // business
    dana, yoni, noa, eyal, sapir, lior  // cs
  ] = await Promise.all([
    get('neta@test.com'), get('dor@test.com'),
    get('maya@test.com'), get('itamar@test.com'),
    get('lihi@test.com'), get('ben@test.com'),
    get('yarden@test.com'), get('ofek@test.com'),
    get('shaked@test.com'), get('stav@test.com'),
    get('naomi@test.com'), get('eden@test.com'),
    get('linor@test.com'), get('yuval2@test.com'),
    get('miriam@test.com'), get('roni@test.com'),
    get('avital@test.com'), get('gal@test.com'),
    get('tal@test.com'), get('roi@test.com'),
    get('amit@test.com'), get('oren@test.com'),
    get('rotem@test.com'), get('noam@test.com'),
    get('tomer@test.com'), get('yael@test.com'), get('itay@test.com'),
    get('dana@test.com'), get('yoni@test.com'), get('noa@test.com'),
    get('eyal@test.com'), get('sapir@test.com'), get('lior@test.com'),
  ]);

  const now = new Date();
  const ago = d => new Date(now - d * 86400000);

  // ── Clean up any previously added groups from this script ──────────────
  const prevNames = [
    'Clinical Medicine — Year 3','Pathology Study Group','Internal Medicine Cases',
    'Structural Design Workshop','Urban Planning & Theory','Architectural History',
    'Microeconomics — Exam Bank','Econometrics Help','Financial Economics',
    'Cell Biology & Biochemistry','Ecology & Evolution','Microbiology Lab Prep',
    'Calculus 2 — Problem Solving','Discrete Mathematics','Statistics for Scientists',
    'Digital Media Production','Journalism & Reporting','Communication Theory',
    'Drug Interactions & Safety','Clinical Pharmacy Practice','Pharmaceutical Chemistry',
    'Circuits & Electronics','Digital Systems Design','Signals & Systems',
    'Marketing Strategy','Financial Accounting','Organisational Behaviour',
  ];
  await Group.deleteMany({ name: { $in: prevNames } });
  console.log('Cleaned old groups from this script');

  // ── Medicine ────────────────────────────────────────────────────────────
  const [medG1, medG2, medG3] = await Group.insertMany([
    { name: 'Clinical Medicine — Year 3', description: 'Case-based learning, clinical skills and hospital rotation tips for 3rd-year med students.', subject: 'Clinical Medicine', department: 'Medicine', year: 3, semester: 'B', isPrivate: false, tags: ['medicine','clinical','cases'], admin: neta._id, members: [neta._id, dor._id] },
    { name: 'Pathology Study Group', description: 'Histology slides, pathology summaries and past exam questions. Open to all years.', subject: 'Pathology', department: 'Medicine', year: 2, semester: 'A', isPrivate: false, tags: ['medicine','pathology','histology'], admin: dor._id, members: [dor._id, neta._id] },
    { name: 'Internal Medicine Cases', description: 'Weekly clinical case discussions — differentials, investigations, management.', subject: 'Internal Medicine', department: 'Medicine', year: 4, semester: 'B', isPrivate: true, tags: ['medicine','internalmedicine'], admin: neta._id, members: [neta._id, dor._id] },
  ]);

  // ── Architecture ────────────────────────────────────────────────────────
  const [archG1, archG2, archG3] = await Group.insertMany([
    { name: 'Structural Design Workshop', description: 'Load calculations, structural systems and material choices for studio projects.', subject: 'Structural Design', department: 'Architecture', year: 3, semester: 'A', isPrivate: false, tags: ['architecture','structures','engineering'], admin: maya._id, members: [maya._id, itamar._id] },
    { name: 'Urban Planning & Theory', description: 'Readings on urban theory, city planning projects and critiques.', subject: 'Urban Planning', department: 'Architecture', year: 4, semester: 'B', isPrivate: false, tags: ['architecture','urban','planning'], admin: itamar._id, members: [itamar._id, maya._id] },
    { name: 'Architectural History', description: 'Timeline from ancient to contemporary — summaries, timelines and past questions.', subject: 'History of Architecture', department: 'Architecture', year: 2, semester: 'A', isPrivate: false, tags: ['architecture','history','theory'], admin: maya._id, members: [maya._id, itamar._id] },
  ]);

  // ── Economics ───────────────────────────────────────────────────────────
  const [ecoG1, ecoG2, ecoG3] = await Group.insertMany([
    { name: 'Microeconomics — Exam Bank', description: 'Solved problem sets, supply/demand graphs and past midterms.', subject: 'Microeconomics', department: 'Economics', year: 1, semester: 'A', isPrivate: false, tags: ['economics','micro','examprep'], admin: lihi._id, members: [lihi._id, ben._id] },
    { name: 'Econometrics Help', description: 'R and SPSS help, regression models, practice datasets and homework support.', subject: 'Econometrics', department: 'Economics', year: 3, semester: 'B', isPrivate: false, tags: ['economics','econometrics','R','statistics'], admin: ben._id, members: [ben._id, lihi._id] },
    { name: 'Financial Economics', description: 'Asset pricing, portfolio theory and derivatives. Sharing notes and problem sets.', subject: 'Financial Economics', department: 'Economics', year: 4, semester: 'A', isPrivate: false, tags: ['economics','finance','markets'], admin: lihi._id, members: [lihi._id, ben._id] },
  ]);

  // ── Biology ─────────────────────────────────────────────────────────────
  const [bioG1, bioG2, bioG3] = await Group.insertMany([
    { name: 'Cell Biology & Biochemistry', description: 'Cell signalling, metabolism, enzyme kinetics and exam summaries.', subject: 'Cell Biology', department: 'Biology', year: 2, semester: 'A', isPrivate: false, tags: ['biology','cells','biochemistry'], admin: yarden._id, members: [yarden._id, ofek._id] },
    { name: 'Ecology & Evolution', description: 'Field notes, ecological models and past exam discussions.', subject: 'Ecology', department: 'Biology', year: 3, semester: 'B', isPrivate: false, tags: ['biology','ecology','evolution'], admin: ofek._id, members: [ofek._id, yarden._id] },
    { name: 'Microbiology Lab Prep', description: 'Pre-lab summaries, lab reports and tips for microbiology practicals.', subject: 'Microbiology', department: 'Biology', year: 2, semester: 'B', isPrivate: false, tags: ['biology','microbiology','lab'], admin: yarden._id, members: [yarden._id, ofek._id] },
  ]);

  // ── Mathematics ─────────────────────────────────────────────────────────
  const [mathG1, mathG2, mathG3] = await Group.insertMany([
    { name: 'Calculus 2 — Problem Solving', description: 'Series, integrals, multivariable calculus. Solved examples and weekly challenges.', subject: 'Calculus 2', department: 'Mathematics', year: 1, semester: 'B', isPrivate: false, tags: ['math','calculus','integrals'], admin: shaked._id, members: [shaked._id, stav._id] },
    { name: 'Discrete Mathematics', description: 'Proofs, graph theory, combinatorics and logic. All problem sets solved.', subject: 'Discrete Mathematics', department: 'Mathematics', year: 2, semester: 'A', isPrivate: false, tags: ['math','discrete','proofs','graphs'], admin: stav._id, members: [stav._id, shaked._id] },
    { name: 'Statistics for Scientists', description: 'Probability, hypothesis testing, confidence intervals. Excel and R examples.', subject: 'Statistics', department: 'Mathematics', year: 2, semester: 'B', isPrivate: false, tags: ['math','statistics','probability'], admin: shaked._id, members: [shaked._id, stav._id] },
  ]);

  // ── Communication ───────────────────────────────────────────────────────
  const [comG1, comG2, comG3] = await Group.insertMany([
    { name: 'Digital Media Production', description: 'Video editing, podcasting and social media projects. Share your work and get feedback.', subject: 'Digital Media', department: 'Communication', year: 2, semester: 'A', isPrivate: false, tags: ['communication','media','video','podcast'], admin: naomi._id, members: [naomi._id, eden._id] },
    { name: 'Journalism & Reporting', description: 'Story pitches, writing feedback and news industry discussions.', subject: 'Journalism', department: 'Communication', year: 3, semester: 'B', isPrivate: false, tags: ['journalism','writing','news'], admin: eden._id, members: [eden._id, naomi._id, roi._id] },
    { name: 'Communication Theory', description: 'Summaries of key theorists (McLuhan, Habermas, Hall) and exam prep.', subject: 'Communication Theory', department: 'Communication', year: 1, semester: 'A', isPrivate: false, tags: ['communication','theory','media'], admin: naomi._id, members: [naomi._id, eden._id] },
  ]);

  // ── Pharmacy ────────────────────────────────────────────────────────────
  const [pharG1, pharG2, pharG3] = await Group.insertMany([
    { name: 'Drug Interactions & Safety', description: 'Clinically significant drug interactions, contraindications and patient safety cases.', subject: 'Drug Interactions', department: 'Pharmacy', year: 3, semester: 'A', isPrivate: false, tags: ['pharmacy','druginteractions','safety'], admin: linor._id, members: [linor._id, yuval._id] },
    { name: 'Clinical Pharmacy Practice', description: 'Case studies, counselling skills and dispensing simulations.', subject: 'Clinical Pharmacy', department: 'Pharmacy', year: 4, semester: 'B', isPrivate: false, tags: ['pharmacy','clinical','practice'], admin: yuval._id, members: [yuval._id, linor._id] },
    { name: 'Pharmaceutical Chemistry', description: 'Organic synthesis, drug design and structure-activity relationships.', subject: 'Pharmaceutical Chemistry', department: 'Pharmacy', year: 2, semester: 'A', isPrivate: false, tags: ['pharmacy','chemistry','synthesis'], admin: linor._id, members: [linor._id, yuval._id] },
  ]);

  // ── Electrical Engineering ──────────────────────────────────────────────
  const [eeG1, eeG2] = await Group.insertMany([
    { name: 'Circuits & Electronics', description: 'KVL/KCL problems, op-amp circuits, Thevenin/Norton — full problem sets solved.', subject: 'Circuits', department: 'Electrical Engineering', year: 2, semester: 'A', isPrivate: false, tags: ['ee','circuits','electronics'], admin: amit._id, members: [amit._id, oren._id, rotem._id, noam._id] },
    { name: 'Signals & Systems', description: 'Fourier transforms, Laplace, convolution and Z-transform. Notes and solved exams.', subject: 'Signals & Systems', department: 'Electrical Engineering', year: 3, semester: 'B', isPrivate: false, tags: ['ee','signals','fourier'], admin: oren._id, members: [oren._id, amit._id, rotem._id] },
  ]);

  // ── Business Administration ─────────────────────────────────────────────
  const [baG1, baG2] = await Group.insertMany([
    { name: 'Marketing Strategy', description: 'Case studies, 4P analysis, branding and digital marketing discussions.', subject: 'Marketing', department: 'Business Administration', year: 2, semester: 'A', isPrivate: false, tags: ['business','marketing','strategy'], admin: tomer._id, members: [tomer._id, yael._id, itay._id] },
    { name: 'Financial Accounting', description: 'Balance sheets, income statements, cash flow and IFRS standards.', subject: 'Financial Accounting', department: 'Business Administration', year: 1, semester: 'B', isPrivate: false, tags: ['business','accounting','finance'], admin: yael._id, members: [yael._id, tomer._id, itay._id] },
  ]);

  console.log('All groups created');

  // ── Posts for every new group ───────────────────────────────────────────
  await Post.insertMany([
    // Medicine
    { author: neta._id,   group: medG1._id,  content: 'Posting my OSCE checklist for the clinical skills station — covers history taking, physical exam and communication marks.', type: 'material',      tags: ['medicine','OSCE'],        createdAt: ago(1) },
    { author: dor._id,    group: medG1._id,  content: 'What is the best way to approach a patient with chest pain differentially? Going through it now for our rotation exam.', type: 'question',     tags: ['medicine','clinical'],    createdAt: ago(2) },
    { author: neta._id,   group: medG1._id,  content: 'Rotation schedule for the next 4 weeks has changed — check the department noticeboard.', type: 'announcement', tags: ['medicine'],               createdAt: ago(3) },
    { author: dor._id,    group: medG2._id,  content: 'Uploading my 80-slide histology summary — every tissue type with labelled images.', type: 'material',      tags: ['pathology','histology'],   createdAt: ago(2) },
    { author: neta._id,   group: medG2._id,  content: 'Does anyone have last year\'s pathology past paper? I can\'t find it on the portal.', type: 'question',     tags: ['pathology','exam'],       createdAt: ago(1) },
    { author: dor._id,    group: medG3._id,  content: 'Case: 65M with dyspnoea + bilateral crackles + raised JVP. What is your differential and first-line management?', type: 'question',     tags: ['medicine','cases'],       createdAt: ago(1) },
    { author: neta._id,   group: medG3._id,  content: 'Summary of all common cardiac cases from the last 3 years of exams with full management plans.', type: 'material',      tags: ['medicine','cardiology'],  createdAt: ago(4) },

    // Architecture
    { author: maya._id,   group: archG1._id, content: 'Anyone using ETABS or SAP2000 for their structural assignment? Happy to help if you\'re stuck on load combinations.', type: 'question',     tags: ['architecture','structures'], createdAt: ago(2) },
    { author: itamar._id, group: archG1._id, content: 'My structural analysis report for the studio project — steel frame with moment connections. Comments welcome.', type: 'material',      tags: ['architecture','steel'],   createdAt: ago(3) },
    { author: itamar._id, group: archG2._id, content: 'Summary of Jane Jacobs\' "Death and Life of Great American Cities" — 4 pages covering the key planning principles.', type: 'material',      tags: ['urban','planning'],       createdAt: ago(5) },
    { author: maya._id,   group: archG2._id, content: 'Urban planning presentation is next Tuesday at 10am. Everyone should have their site analysis slides ready.', type: 'announcement', tags: ['architecture','planning'], createdAt: ago(1) },
    { author: maya._id,   group: archG3._id, content: 'Complete timeline from Egyptian to Deconstructivism — visual summary with key buildings and architects.', type: 'material',      tags: ['architecture','history'], createdAt: ago(6) },
    { author: itamar._id, group: archG3._id, content: 'What is the difference between the International Style and Modernism? My notes say they\'re the same but the lecturer seems to disagree.', type: 'question',     tags: ['architecture','theory'],  createdAt: ago(2) },

    // Economics
    { author: lihi._id,   group: ecoG1._id,  content: 'Complete solved problem set for consumer theory — utility maximisation, indifference curves, budget constraints.', type: 'material',      tags: ['economics','micro'],      createdAt: ago(3) },
    { author: ben._id,    group: ecoG1._id,  content: 'Can someone explain the difference between a shift in demand vs a movement along the demand curve? I keep confusing them in exam questions.', type: 'question',     tags: ['economics','demand'],     createdAt: ago(1) },
    { author: lihi._id,   group: ecoG1._id,  content: 'Micro midterm is in 2 weeks — let\'s organise a study session. Who\'s free Thursday evening?', type: 'announcement', tags: ['economics','exam'],        createdAt: ago(2) },
    { author: ben._id,    group: ecoG2._id,  content: 'R script for OLS regression with heteroskedasticity-robust standard errors — includes the practice dataset from class.', type: 'material',      tags: ['econometrics','R'],       createdAt: ago(4) },
    { author: lihi._id,   group: ecoG2._id,  content: 'What does it mean when the Durbin-Watson statistic is close to 0 vs close to 4? The textbook explanation is really unclear.', type: 'question',     tags: ['econometrics','stats'],   createdAt: ago(2) },
    { author: ben._id,    group: ecoG3._id,  content: 'CAPM and APT comparison — one-page cheat sheet with formulas and when to use each.', type: 'material',      tags: ['finance','CAPM'],         createdAt: ago(5) },
    { author: lihi._id,   group: ecoG3._id,  content: 'Black-Scholes question from last year\'s exam — does anyone know how to derive the Greeks from it?', type: 'question',     tags: ['finance','derivatives'],  createdAt: ago(1) },

    // Biology
    { author: yarden._id, group: bioG1._id,  content: 'Signal transduction pathway summary — from receptor binding all the way to gene expression. Colour-coded diagram included.', type: 'material',      tags: ['biology','signalling'],   createdAt: ago(2) },
    { author: ofek._id,   group: bioG1._id,  content: 'What is the difference between competitive and non-competitive enzyme inhibition? I get confused on which affects Vmax vs Km.', type: 'question',     tags: ['biology','enzymes'],      createdAt: ago(1) },
    { author: yarden._id, group: bioG1._id,  content: 'Biochem practical next Monday — bring your lab coat and make sure you\'ve read the enzyme kinetics pre-lab.', type: 'announcement', tags: ['biology','lab'],          createdAt: ago(3) },
    { author: ofek._id,   group: bioG2._id,  content: 'Population ecology cheat sheet — logistic growth, carrying capacity, species interactions (competition, predation, mutualism).', type: 'material',      tags: ['ecology','evolution'],    createdAt: ago(4) },
    { author: yarden._id, group: bioG2._id,  content: 'How does natural selection differ from genetic drift? Is genetic drift random? Preparing for the evolution section of the exam.', type: 'question',     tags: ['biology','evolution'],    createdAt: ago(2) },
    { author: yarden._id, group: bioG3._id,  content: 'Lab report template for the gram staining practical — includes results table, discussion questions and marking rubric.', type: 'material',      tags: ['microbiology','lab'],     createdAt: ago(3) },
    { author: ofek._id,   group: bioG3._id,  content: 'Microbiology practical 3 is cancelled this week — replaced by an online quiz on Moodle. Check your email.', type: 'announcement', tags: ['microbiology'],           createdAt: ago(1) },

    // Mathematics
    { author: shaked._id, group: mathG1._id, content: 'Full solutions for chapters 11–14 of Stewart Calculus — integration by parts, trig substitution, partial fractions and improper integrals.', type: 'material',      tags: ['calculus','integrals'],   createdAt: ago(3) },
    { author: stav._id,   group: mathG1._id, content: 'I\'m stuck on the limit comparison test for series. When do you choose it over the direct comparison test?', type: 'question',     tags: ['calculus','series'],      createdAt: ago(1) },
    { author: shaked._id, group: mathG1._id, content: 'Calculus 2 exam is in 3 weeks. I\'ll be posting one solved problem per day until then.', type: 'announcement', tags: ['math','calculus'],        createdAt: ago(2) },
    { author: stav._id,   group: mathG2._id, content: 'Graph theory cheat sheet — Euler circuits, Hamiltonian paths, planarity, graph colouring. With worked examples.', type: 'material',      tags: ['discrete','graphs'],      createdAt: ago(5) },
    { author: shaked._id, group: mathG2._id, content: 'How do you prove that a function is bijective? I keep getting confused about whether I need to prove injection and surjection separately.', type: 'question',     tags: ['math','proofs'],          createdAt: ago(2) },
    { author: shaked._id, group: mathG3._id, content: 'Z-table, t-table and chi-squared table all in one PDF — formatted for exam use.', type: 'material',      tags: ['statistics','tables'],    createdAt: ago(4) },
    { author: stav._id,   group: mathG3._id, content: 'What is the difference between a Type I and Type II error? And how does the significance level α relate to them?', type: 'question',     tags: ['statistics','hypothesis'], createdAt: ago(1) },

    // Communication
    { author: naomi._id,  group: comG1._id,  content: 'Sharing my podcast episode from the production module — feedback very welcome, especially on audio quality and pacing.', type: 'material',      tags: ['media','podcast'],        createdAt: ago(2) },
    { author: eden._id,   group: comG1._id,  content: 'What software are you all using for video editing? I\'ve been on Premiere but considering switching to DaVinci Resolve.', type: 'question',     tags: ['media','video'],          createdAt: ago(1) },
    { author: naomi._id,  group: comG1._id,  content: 'Digital media portfolio submissions are due end of semester — make sure your best 3 pieces are uploaded to the class folder.', type: 'announcement', tags: ['media','portfolio'],      createdAt: ago(3) },
    { author: eden._id,   group: comG2._id,  content: 'Inverted pyramid structure cheat sheet — with examples from Ha\'aretz, NYT and BBC News.', type: 'material',      tags: ['journalism','writing'],   createdAt: ago(4) },
    { author: roi._id,    group: comG2._id,  content: 'Is there a difference between news reporting and feature writing in terms of objectivity? Having an argument with my study partner about this.', type: 'question',     tags: ['journalism','theory'],    createdAt: ago(2) },
    { author: naomi._id,  group: comG3._id,  content: 'McLuhan summary: Understanding Media + The Medium is the Message. 5 pages covering hot/cool media and all 4 laws.', type: 'material',      tags: ['theory','McLuhan'],       createdAt: ago(5) },
    { author: eden._id,   group: comG3._id,  content: 'What is the main difference between the transmission model and the ritual model of communication?', type: 'question',     tags: ['communication','theory'], createdAt: ago(1) },

    // Pharmacy
    { author: linor._id,  group: pharG1._id, content: 'Top 10 clinically significant drug-drug interactions you must know for the exam — with mechanism and management.', type: 'material',      tags: ['pharmacy','interactions'], createdAt: ago(2) },
    { author: yuval._id,  group: pharG1._id, content: 'Is the interaction between warfarin and NSAIDs pharmacokinetic or pharmacodynamic? I said both but the mark scheme says only one.', type: 'question',     tags: ['pharmacy','warfarin'],    createdAt: ago(1) },
    { author: linor._id,  group: pharG1._id, content: 'Drug interaction OSCE station practice session this Friday at 2pm in the simulation lab. Optional but highly recommended.', type: 'announcement', tags: ['pharmacy','OSCE'],        createdAt: ago(3) },
    { author: yuval._id,  group: pharG2._id, content: 'Patient counselling script for starting a statin — covers indication, side effects, monitoring and lifestyle advice.', type: 'material',      tags: ['pharmacy','counselling'], createdAt: ago(4) },
    { author: linor._id,  group: pharG2._id, content: 'How do you handle a patient who refuses to take their medication? Discussing it in the context of our ethics module.', type: 'question',     tags: ['pharmacy','ethics'],      createdAt: ago(2) },
    { author: linor._id,  group: pharG3._id, content: 'SAR (structure-activity relationship) notes for beta-lactam antibiotics — how changes to the ring affect potency and resistance.', type: 'material',      tags: ['chemistry','SAR'],        createdAt: ago(5) },
    { author: yuval._id,  group: pharG3._id, content: 'What determines whether a drug is a prodrug vs an active drug? Struggling with the pharmaceutical chemistry exam question types.', type: 'question',     tags: ['chemistry','prodrug'],    createdAt: ago(1) },

    // Electrical Engineering
    { author: amit._id,   group: eeG1._id,   content: 'Full solved problem set for Thevenin/Norton equivalents, superposition and mesh analysis — 30 problems with step-by-step solutions.', type: 'material',      tags: ['ee','circuits'],          createdAt: ago(3) },
    { author: oren._id,   group: eeG1._id,   content: 'For the op-amp inverting amplifier, why does the gain formula have a negative sign? My simulation gives positive output though.', type: 'question',     tags: ['ee','opamp'],             createdAt: ago(1) },
    { author: rotem._id,  group: eeG1._id,   content: 'Circuits midterm is confirmed for Week 8 — covers everything up to and including AC analysis and phasors.', type: 'announcement', tags: ['ee','exam'],              createdAt: ago(2) },
    { author: oren._id,   group: eeG2._id,   content: 'Fourier series derivation and all standard waveforms (square, triangle, sawtooth) — with coefficients calculated.', type: 'material',      tags: ['ee','fourier'],           createdAt: ago(4) },
    { author: amit._id,   group: eeG2._id,   content: 'What is the relationship between the ROC (region of convergence) and system stability in Laplace transforms?', type: 'question',     tags: ['ee','Laplace'],           createdAt: ago(2) },
    { author: rotem._id,  group: eeG2._id,   content: 'Signals exam paper from 2 years ago — with detailed solutions for every question. This one is very representative of the current format.', type: 'material',      tags: ['ee','signals','exam'],    createdAt: ago(6) },

    // Business Administration
    { author: tomer._id,  group: baG1._id,   content: 'SWOT + PESTLE + Porter\'s Five Forces — one-page template with a worked example for the H&M case study.', type: 'material',      tags: ['business','marketing'],   createdAt: ago(3) },
    { author: yael._id,   group: baG1._id,   content: 'How do you calculate market share and why does it matter in the BCG matrix? Our assignment requires both and I\'m not sure how to present it.', type: 'question',     tags: ['marketing','strategy'],   createdAt: ago(1) },
    { author: itay._id,   group: baG1._id,   content: 'Group marketing project presentations are Week 11 — 12 minutes per group plus 3 minutes Q&A. Confirm your slot with the lecturer.', type: 'announcement', tags: ['business','marketing'],   createdAt: ago(2) },
    { author: yael._id,   group: baG2._id,   content: 'T-account cheat sheet covering all journal entries for assets, liabilities, equity, revenue and expenses — with practice trial balance.', type: 'material',      tags: ['accounting','finance'],   createdAt: ago(4) },
    { author: tomer._id,  group: baG2._id,   content: 'What is the difference between gross profit and operating profit? And where exactly does EBITDA fit in the income statement?', type: 'question',     tags: ['accounting','profit'],    createdAt: ago(1) },
    { author: itay._id,   group: baG2._id,   content: 'Accounting assignment 2 grades are out — class average was 71. The lecturer said deferred tax and depreciation were the most common mistakes.', type: 'announcement', tags: ['accounting','grades'],    createdAt: ago(3) },
  ]);

  console.log('All posts created');

  const totalU = await User.countDocuments();
  const totalG = await Group.countDocuments();
  const totalP = await Post.countDocuments();
  console.log(`Done! DB: ${totalU} users | ${totalG} groups | ${totalP} posts`);
  mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
