require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User  = require('./models/User');
const Group = require('./models/Group');
const Post  = require('./models/Post');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const hash = await bcrypt.hash('123456', 10);

  // --- 20 new students (10 departments) ---
  // Delete any previously inserted users/groups from this script so we start clean
  const existingEmails = ['tal@test.com','miriam@test.com','roni@test.com','avital@test.com',
    'gal@test.com','neta@test.com','dor@test.com','maya@test.com','itamar@test.com',
    'lihi@test.com','ben@test.com','yarden@test.com','ofek@test.com','shaked@test.com',
    'stav@test.com','naomi@test.com','eden@test.com','roi@test.com','linor@test.com','yuval2@test.com'];
  const oldUsers = await User.find({ email: { $in: existingEmails } }, '_id');
  if (oldUsers.length) {
    const ids = oldUsers.map(u => u._id);
    await Post.deleteMany({ author: { $in: ids } });
    await Group.deleteMany({ admin: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`Cleaned up ${oldUsers.length} previously seeded users`);
  }

  const newUsers = await User.insertMany([
    // Law
    { name: 'Tal Ben-David',     email: 'tal@test.com',      password: hash, department: 'Law',                  year: 2 },
    { name: 'Miriam Peled',      email: 'miriam@test.com',   password: hash, department: 'Law',                  year: 3 },
    { name: 'Roni Blum',         email: 'roni@test.com',     password: hash, department: 'Law',                  year: 1 },
    // Psychology
    { name: 'Avital Sharon',     email: 'avital@test.com',   password: hash, department: 'Psychology',           year: 2 },
    { name: 'Gal Weiss',         email: 'gal@test.com',      password: hash, department: 'Psychology',           year: 3 },
    // Medicine
    { name: 'Neta Koren',        email: 'neta@test.com',     password: hash, department: 'Medicine',             year: 4 },
    { name: 'Dor Shalev',        email: 'dor@test.com',      password: hash, department: 'Medicine',             year: 3 },
    // Architecture
    { name: 'Maya Tzur',         email: 'maya@test.com',     password: hash, department: 'Architecture',         year: 2 },
    { name: 'Itamar Gold',       email: 'itamar@test.com',   password: hash, department: 'Architecture',         year: 4 },
    // Economics
    { name: 'Lihi Peretz',       email: 'lihi@test.com',     password: hash, department: 'Economics',            year: 1 },
    { name: 'Ben Ohana',         email: 'ben@test.com',      password: hash, department: 'Economics',            year: 2 },
    // Biology
    { name: 'Yarden Sasi',       email: 'yarden@test.com',   password: hash, department: 'Biology',              year: 3 },
    { name: 'Ofek Tzadok',       email: 'ofek@test.com',     password: hash, department: 'Biology',              year: 2 },
    // Mathematics
    { name: 'Shaked Biton',      email: 'shaked@test.com',   password: hash, department: 'Mathematics',          year: 4 },
    { name: 'Stav Alter',        email: 'stav@test.com',     password: hash, department: 'Mathematics',          year: 1 },
    // Communication
    { name: 'Naomi Harel',       email: 'naomi@test.com',    password: hash, department: 'Communication',        year: 2 },
    { name: 'Eden Frank',        email: 'eden@test.com',     password: hash, department: 'Communication',        year: 3 },
    // Political Science
    { name: 'Roi Saban',         email: 'roi@test.com',      password: hash, department: 'Political Science',    year: 2 },
    // Pharmacy
    { name: 'Linor Amar',        email: 'linor@test.com',    password: hash, department: 'Pharmacy',             year: 3 },
    { name: 'Yuval Ben-Ami',     email: 'yuval2@test.com',   password: hash, department: 'Pharmacy',             year: 2 },
  ]);
  console.log(`Added ${newUsers.length} users`);

  const [tal, miriam, roni, avital, gal, neta, dor, maya, itamar,
         lihi, ben, yarden, ofek, shaked, stav, naomi, eden, roi, linor, yuval] = newUsers;

  // --- 10 new groups ---
  const newGroups = await Group.insertMany([
    {
      name: 'Criminal Law Study Group',
      description: 'Preparing for the Criminal Law final — case summaries, past exams, group discussion.',
      subject: 'Criminal Law',
      department: 'Law',
      year: 2, semester: 'B',
      isPrivate: false,
      tags: ['law', 'criminal', 'finals'],
      admin: tal._id,
      members: [tal._id, miriam._id, roni._id],
    },
    {
      name: 'Contract Law — Moed B',
      description: 'Last-minute prep for Contract Law resit. Share notes and questions.',
      subject: 'Contract Law',
      department: 'Law',
      year: 3, semester: 'A',
      isPrivate: false,
      tags: ['law', 'contracts', 'moedB'],
      admin: miriam._id,
      members: [miriam._id, roni._id, tal._id],
    },
    {
      name: 'Cognitive Psychology 101',
      description: 'Flashcards, lecture notes and weekly quizzes for Cognitive Psych.',
      subject: 'Cognitive Psychology',
      department: 'Psychology',
      year: 2, semester: 'A',
      isPrivate: false,
      tags: ['psychology', 'cognition', 'notes'],
      admin: avital._id,
      members: [avital._id, gal._id],
    },
    {
      name: 'Anatomy Study Circle',
      description: 'Med students cramming anatomy together. Diagrams, mnemonics, practice questions.',
      subject: 'Anatomy',
      department: 'Medicine',
      year: 3, semester: 'B',
      isPrivate: true,
      tags: ['medicine', 'anatomy', 'medschool'],
      admin: neta._id,
      members: [neta._id, dor._id],
    },
    {
      name: 'Architecture Studio Help',
      description: 'Share designs, get feedback, and discuss studio assignments.',
      subject: 'Design Studio',
      department: 'Architecture',
      year: 2, semester: 'A',
      isPrivate: false,
      tags: ['architecture', 'design', 'studio'],
      admin: maya._id,
      members: [maya._id, itamar._id],
    },
    {
      name: 'Macroeconomics — Exam Prep',
      description: 'Past papers, formulas, and group explanations for Macro.',
      subject: 'Macroeconomics',
      department: 'Economics',
      year: 1, semester: 'B',
      isPrivate: false,
      tags: ['economics', 'macro', 'exam'],
      admin: lihi._id,
      members: [lihi._id, ben._id],
    },
    {
      name: 'Genetics & Molecular Bio',
      description: 'Deep dive into genetics, DNA replication and protein synthesis.',
      subject: 'Genetics',
      department: 'Biology',
      year: 3, semester: 'A',
      isPrivate: false,
      tags: ['biology', 'genetics', 'DNA'],
      admin: yarden._id,
      members: [yarden._id, ofek._id],
    },
    {
      name: 'Linear Algebra — Semester A',
      description: 'Matrices, vector spaces, eigenvalues. All exercises from the textbook.',
      subject: 'Linear Algebra',
      department: 'Mathematics',
      year: 1, semester: 'A',
      isPrivate: false,
      tags: ['math', 'linearAlgebra', 'matrices'],
      admin: shaked._id,
      members: [shaked._id, stav._id],
    },
    {
      name: 'Media & Society',
      description: 'Readings, reflections and discussions on media theory.',
      subject: 'Media Studies',
      department: 'Communication',
      year: 2, semester: 'B',
      isPrivate: false,
      tags: ['media', 'communication', 'theory'],
      admin: naomi._id,
      members: [naomi._id, eden._id, roi._id],
    },
    {
      name: 'Pharmacology Flashcards',
      description: 'Drug classes, mechanisms and side effects — flashcard sets and mnemonics.',
      subject: 'Pharmacology',
      department: 'Pharmacy',
      year: 3, semester: 'A',
      isPrivate: false,
      tags: ['pharmacy', 'pharma', 'flashcards'],
      admin: linor._id,
      members: [linor._id, yuval._id],
    },
  ]);
  console.log(`Added ${newGroups.length} groups`);

  // --- Sample posts in each new group ---
  const now = new Date();
  const daysAgo = d => new Date(now - d * 86400000);

  await Post.insertMany([
    { author: tal._id,    group: newGroups[0]._id, content: 'Anyone have the summary for the Nesher case? Posting mine below.', type: 'material',      tags: ['law'],        createdAt: daysAgo(2) },
    { author: miriam._id, group: newGroups[0]._id, content: 'The exam always has a question on criminal intent (mens rea) — make sure you know all 4 levels.', type: 'announcement', tags: ['law', 'finals'], createdAt: daysAgo(1) },
    { author: roni._id,   group: newGroups[1]._id, content: 'Does anyone understand clause 14 in the formation of contract? I keep getting confused.', type: 'question',     tags: ['contracts'],  createdAt: daysAgo(3) },
    { author: miriam._id, group: newGroups[1]._id, content: 'Great video explanation of consideration — sharing it here for everyone.', type: 'material',      tags: ['law'],        createdAt: daysAgo(1) },
    { author: avital._id, group: newGroups[2]._id, content: 'Posting my Stroop Effect flashcard deck — 60 cards covering all the lecture topics.', type: 'material',      tags: ['psychology'], createdAt: daysAgo(4) },
    { author: gal._id,    group: newGroups[2]._id, content: 'What is the difference between bottom-up and top-down processing? I keep mixing them up.', type: 'question',     tags: ['cognition'],  createdAt: daysAgo(2) },
    { author: neta._id,   group: newGroups[3]._id, content: 'Reminder: anatomy lab is this Thursday at 8am. Bring your atlas.', type: 'announcement', tags: ['anatomy'],    createdAt: daysAgo(1) },
    { author: dor._id,    group: newGroups[3]._id, content: 'I made mnemonics for all 12 cranial nerves — anyone want them?', type: 'material',      tags: ['medicine'],   createdAt: daysAgo(3) },
    { author: maya._id,   group: newGroups[4]._id, content: 'Studio critique is next week. Share your progress renders here so we can give each other feedback.', type: 'announcement', tags: ['design'],     createdAt: daysAgo(2) },
    { author: lihi._id,   group: newGroups[5]._id, content: 'Formula sheet for the Macro exam — GDP, inflation, IS-LM model.', type: 'material',      tags: ['economics'],  createdAt: daysAgo(5) },
    { author: ben._id,    group: newGroups[5]._id, content: 'Can someone explain the difference between fiscal and monetary policy in simple terms?', type: 'question',     tags: ['macro'],      createdAt: daysAgo(1) },
    { author: yarden._id, group: newGroups[6]._id, content: 'Sharing the full CRISPR lecture summary — 8 pages, covers everything from the exam guide.', type: 'material',      tags: ['genetics'],   createdAt: daysAgo(6) },
    { author: shaked._id, group: newGroups[7]._id, content: 'All exercises from chapters 1–4 solved with full working. Uploading now.', type: 'material',      tags: ['math'],       createdAt: daysAgo(3) },
    { author: stav._id,   group: newGroups[7]._id, content: 'How do you find the null space of a 3x4 matrix? I keep getting the wrong answer.', type: 'question',     tags: ['linearAlgebra'], createdAt: daysAgo(1) },
    { author: naomi._id,  group: newGroups[8]._id, content: 'Reading response for McLuhan is due Friday — has anyone started?', type: 'announcement', tags: ['media'],      createdAt: daysAgo(2) },
    { author: linor._id,  group: newGroups[9]._id, content: 'Beta-blocker mnemonic: "BEAM" — Bisoprolol, Esmolol, Atenolol, Metoprolol. Posting the full set.', type: 'material',      tags: ['pharmacy'],   createdAt: daysAgo(4) },
    { author: yuval._id,  group: newGroups[9]._id, content: 'What is the difference between pharmacokinetics and pharmacodynamics?', type: 'question',     tags: ['pharma'],     createdAt: daysAgo(1) },
  ]);
  console.log('Added sample posts');

  const total = await User.countDocuments();
  const totalG = await Group.countDocuments();
  console.log(`Done! DB now has ${total} users and ${totalG} groups.`);
  mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
