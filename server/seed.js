require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Group.deleteMany({});
  await Post.deleteMany({});
  await Message.deleteMany({});
  await Notification.deleteMany({});
  console.log('Cleared old data');

  // --- 24 users across 7 departments (password is "123456" for all) ---
  const users = await User.create([
    // Computer Science
    { name: 'Dana Cohen',      email: 'dana@test.com',     password: '123456', department: 'Computer Science',     year: 3 },
    { name: 'Yoni Levi',       email: 'yoni@test.com',     password: '123456', department: 'Computer Science',     year: 3 },
    { name: 'Noa Mizrahi',     email: 'noa@test.com',      password: '123456', department: 'Computer Science',     year: 2 },
    { name: 'Eyal Alon',       email: 'eyal@test.com',     password: '123456', department: 'Computer Science',     year: 3 },
    { name: 'Sapir Levy',      email: 'sapir@test.com',    password: '123456', department: 'Computer Science',     year: 3 },
    { name: 'Lior Azulay',     email: 'lior@test.com',     password: '123456', department: 'Computer Science',     year: 4 },
    // Electrical Engineering
    { name: 'Amit Shapira',    email: 'amit@test.com',     password: '123456', department: 'Electrical Engineering', year: 2 },
    { name: 'Oren Katz',       email: 'oren@test.com',     password: '123456', department: 'Electrical Engineering', year: 4 },
    { name: 'Rotem Hadad',     email: 'rotem@test.com',    password: '123456', department: 'Electrical Engineering', year: 3 },
    { name: 'Noam Friedman',   email: 'noam@test.com',     password: '123456', department: 'Electrical Engineering', year: 2 },
    // Information Systems
    { name: 'Shira Goldstein', email: 'shira@test.com',    password: '123456', department: 'Information Systems',   year: 1 },
    { name: 'Hila Oved',       email: 'hila@test.com',     password: '123456', department: 'Information Systems',   year: 2 },
    // Business Administration
    { name: 'Tomer Baruch',    email: 'tomer@test.com',    password: '123456', department: 'Business Administration', year: 2 },
    { name: 'Yael Dahan',      email: 'yael@test.com',     password: '123456', department: 'Business Administration', year: 3 },
    { name: 'Itay Navon',      email: 'itay@test.com',     password: '123456', department: 'Business Administration', year: 1 },
    // Psychology
    { name: 'Moran Tal',       email: 'moran@test.com',    password: '123456', department: 'Psychology',            year: 2 },
    { name: 'Ofir Ben-Ami',    email: 'ofir@test.com',     password: '123456', department: 'Psychology',            year: 3 },
    // Law
    { name: 'Keren Shoham',    email: 'keren@test.com',    password: '123456', department: 'Law',                   year: 3 },
    { name: 'Adir Gabai',      email: 'adir@test.com',     password: '123456', department: 'Law',                   year: 2 },
    // Industrial Engineering
    { name: 'Roni Avital',     email: 'roni@test.com',     password: '123456', department: 'Industrial Engineering', year: 2 },
    { name: 'Tal Meir',        email: 'tal@test.com',      password: '123456', department: 'Industrial Engineering', year: 3 },
    // General
    { name: 'Maya Peretz',     email: 'maya@test.com',     password: '123456', department: 'Computer Science',      year: 1 },
    { name: 'Gal Yosef',       email: 'gal@test.com',      password: '123456', department: 'Computer Science',      year: 1 },
    { name: 'Tamar Ben-David', email: 'tamar@test.com',    password: '123456', department: 'Computer Science',      year: 2 },
    // Admin
    { name: 'Admin User',      email: 'admin@studyhub.com', password: 'admin123', department: 'Computer Science',   year: 4, role: 'admin' },
  ]);
  const [
    dana, yoni, noa, eyal, sapir, lior,
    amit, oren, rotem, noam,
    shira, hila,
    tomer, yael, itay,
    moran, ofir,
    keren, adir,
    roni, tal,
    maya, gal, tamar,
    admin
  ] = users;
  console.log(`Created ${users.length} users`);

  // friendships
  dana.friends  = [yoni._id, noa._id, maya._id, tamar._id, eyal._id, sapir._id];
  yoni.friends  = [dana._id, amit._id, eyal._id, sapir._id, tomer._id];
  noa.friends   = [dana._id, maya._id, tamar._id, hila._id];
  eyal.friends  = [dana._id, yoni._id, lior._id, sapir._id, tal._id];
  sapir.friends = [yoni._id, eyal._id, lior._id, dana._id];
  lior.friends  = [oren._id, eyal._id, sapir._id, roni._id];
  amit.friends  = [yoni._id, oren._id, noam._id, rotem._id];
  oren.friends  = [amit._id, rotem._id, lior._id];
  rotem.friends = [amit._id, oren._id, noam._id, tal._id];
  noam.friends  = [amit._id, rotem._id];
  shira.friends = [maya._id, tamar._id, hila._id, gal._id, moran._id];
  hila.friends  = [noa._id, tamar._id, shira._id];
  tomer.friends = [yoni._id, yael._id, itay._id, keren._id];
  yael.friends  = [tomer._id, itay._id, ofir._id, keren._id];
  itay.friends  = [tomer._id, yael._id];
  moran.friends = [ofir._id, shira._id, yael._id];
  ofir.friends  = [moran._id, yael._id];
  keren.friends = [adir._id, tomer._id, yael._id];
  adir.friends  = [keren._id];
  roni.friends  = [tal._id, lior._id, amit._id];
  tal.friends   = [roni._id, rotem._id, eyal._id];
  maya.friends  = [dana._id, noa._id, gal._id, shira._id];
  gal.friends   = [maya._id, shira._id];
  tamar.friends = [dana._id, noa._id, shira._id, hila._id];
  admin.friends = [dana._id, yoni._id];
  await Promise.all(users.map(u => u.save()));

  // --- 14 groups across multiple departments ---
  const groups = await Group.create([
    // Computer Science
    {
      name: 'Web Development', description: 'Full-stack web projects and resources — MERN stack',
      subject: 'Web Development', year: 3, semester: 'B', department: 'Computer Science',
      admin: eyal._id, members: [eyal._id, dana._id, yoni._id, sapir._id, lior._id, tamar._id, maya._id, gal._id], isPrivate: false
    },
    {
      name: 'Data Structures', description: 'DS homework, exam prep, and practice problems',
      subject: 'Data Structures', year: 2, semester: 'A', department: 'Computer Science',
      admin: noa._id, members: [noa._id, amit._id, maya._id, tamar._id, hila._id, gal._id], isPrivate: false
    },
    {
      name: 'Algorithms', description: 'Private study group for algorithms course',
      subject: 'Algorithms', year: 3, semester: 'A', department: 'Computer Science',
      admin: yoni._id, members: [yoni._id, dana._id, eyal._id], pendingRequests: [oren._id, sapir._id], isPrivate: true
    },
    {
      name: 'Operating Systems', description: 'OS concepts, kernel programming, and lab assignments',
      subject: 'Operating Systems', year: 3, semester: 'A', department: 'Computer Science',
      admin: lior._id, members: [lior._id, eyal._id, sapir._id, dana._id], isPrivate: false
    },
    {
      name: 'Database Systems', description: 'SQL, NoSQL, and database design help',
      subject: 'Database Systems', year: 2, semester: 'A', department: 'Computer Science',
      admin: lior._id, members: [lior._id, noa._id, hila._id, shira._id, tamar._id], isPrivate: false
    },
    {
      name: 'Machine Learning Intro', description: 'ML basics, Python, and project collaboration',
      subject: 'Machine Learning', year: 4, semester: 'B', department: 'Computer Science',
      admin: dana._id, members: [dana._id, lior._id, eyal._id], isPrivate: false
    },
    // Electrical Engineering
    {
      name: 'Circuit Design Lab', description: 'Lab reports, circuit analysis, and help',
      subject: 'Circuit Design', year: 2, semester: 'B', department: 'Electrical Engineering',
      admin: amit._id, members: [amit._id, oren._id, rotem._id, noam._id], isPrivate: false
    },
    {
      name: 'Signals & Systems', description: 'Private EE study group — Fourier, Laplace, Z-transform',
      subject: 'Signals & Systems', year: 3, semester: 'A', department: 'Electrical Engineering',
      admin: rotem._id, members: [rotem._id, oren._id, noam._id, amit._id], pendingRequests: [gal._id], isPrivate: true
    },
    // Business Administration
    {
      name: 'Marketing Strategy', description: 'Case studies, presentations, and group projects',
      subject: 'Marketing', year: 2, semester: 'B', department: 'Business Administration',
      admin: tomer._id, members: [tomer._id, yael._id, itay._id], isPrivate: false
    },
    {
      name: 'Financial Accounting', description: 'Balance sheets, income statements, and exam prep',
      subject: 'Accounting', year: 1, semester: 'A', department: 'Business Administration',
      admin: yael._id, members: [yael._id, tomer._id, itay._id], isPrivate: false
    },
    // Psychology
    {
      name: 'Cognitive Psychology', description: 'Perception, memory, attention — lecture notes and discussions',
      subject: 'Cognitive Psychology', year: 2, semester: 'A', department: 'Psychology',
      admin: moran._id, members: [moran._id, ofir._id, shira._id], isPrivate: false
    },
    // Law
    {
      name: 'Contract Law', description: 'Case analysis, court rulings, and study materials',
      subject: 'Contract Law', year: 2, semester: 'B', department: 'Law',
      admin: keren._id, members: [keren._id, adir._id], isPrivate: false
    },
    // Industrial Engineering
    {
      name: 'Operations Research', description: 'Linear programming, optimization, and simulations',
      subject: 'Operations Research', year: 3, semester: 'A', department: 'Industrial Engineering',
      admin: tal._id, members: [tal._id, roni._id], isPrivate: false
    },
    // Cross-department
    {
      name: 'Statistics for All', description: 'Probability & statistics help — all departments welcome',
      subject: 'Statistics', year: 1, semester: 'A', department: 'General',
      admin: shira._id, members: [shira._id, moran._id, itay._id, noam._id, roni._id, maya._id], isPrivate: false
    },
  ]);
  const [webGrp, dsGrp, algoGrp, osGrp, dbGrp, mlGrp, circuitGrp, signalsGrp, marketGrp, accountGrp, cogPsyGrp, contractGrp, orGrp, statsGrp] = groups;
  console.log(`Created ${groups.length} groups`);

  // --- posts ---
  const posts = [];
  const months = [0, 1, 2, 3, 4, 5];

  // Web Development group posts
  const webPosts = [
    { content: 'Best practices for REST API design — compiled from class notes.', type: 'material', tags: ['rest', 'api', 'design'] },
    { content: 'How do I deploy a Node.js app to Heroku?', type: 'question', tags: ['deploy', 'heroku', 'node'] },
    { content: 'CSS Grid vs Flexbox — when to use which?', type: 'question', tags: ['css', 'grid', 'flexbox'] },
    { content: 'Project milestone 1 due next week.', type: 'announcement', tags: ['milestone', 'deadline'] },
    { content: 'React hooks cheat sheet with examples for useState, useEffect, useRef.', type: 'material', tags: ['react', 'hooks'] },
    { content: 'Who wants to pair-program on the Canvas requirement?', type: 'question', tags: ['canvas', 'pair-programming'] },
    { content: 'Socket.io rooms guide — how to create private chat rooms.', type: 'material', tags: ['socket.io', 'chat'] },
    { content: 'Demo video of my project so far — feedback welcome!', type: 'material', tags: ['demo', 'feedback'], mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', mediaType: 'video' },
    { content: 'Express middleware explained in simple terms.', type: 'material', tags: ['express', 'middleware'] },
    { content: 'Final presentations moved to room 301.', type: 'announcement', tags: ['final', 'room-change'] },
    { content: 'I created a tutorial on JWT authentication with Express. Check it out!', type: 'material', tags: ['jwt', 'express', 'tutorial'] },
    { content: 'What CSS3 features are required for the project?', type: 'question', tags: ['css3', 'project'] },
  ];
  for (let i = 0; i < webPosts.length; i++) {
    const p = webPosts[i];
    const date = new Date(2025, months[i % 6], 3 + i * 2);
    const authors = [eyal, dana, yoni, sapir, lior, tamar, maya, gal];
    posts.push({
      ...p, author: authors[i % authors.length]._id,
      group: webGrp._id, createdAt: date, updatedAt: date,
      comments: i < 5 ? [{ author: authors[(i + 2) % authors.length]._id, text: 'Great resource!' }] : [],
      likes: authors.slice(0, 2 + (i % 3)).map(a => a._id)
    });
  }

  // Data Structures group posts
  const dsPosts = [
    { content: 'Can someone explain AVL tree rotations?', type: 'question', tags: ['avl', 'trees'] },
    { content: 'Uploaded my summary for linked lists chapter.', type: 'material', tags: ['linked-list'] },
    { content: 'Quiz next Thursday — chapters 4 through 7.', type: 'announcement', tags: ['quiz'] },
    { content: 'Big O cheat sheet I made.', type: 'material', tags: ['big-o', 'complexity'] },
    { content: 'How does a min-heap differ from a BST?', type: 'question', tags: ['heap', 'bst'] },
    { content: 'Study group meeting tomorrow at 14:00 in room 205.', type: 'announcement', tags: ['meeting'] },
    { content: 'Hash table collision strategies comparison.', type: 'material', tags: ['hash', 'data-structures'] },
  ];
  for (let i = 0; i < dsPosts.length; i++) {
    const p = dsPosts[i];
    const date = new Date(2025, months[i % 6], 5 + i * 3);
    const authors = [noa, amit, maya, tamar, hila, gal];
    posts.push({
      ...p, author: authors[i % authors.length]._id,
      group: dsGrp._id, createdAt: date, updatedAt: date,
      likes: [authors[(i + 1) % authors.length]._id]
    });
  }

  // Algorithms group posts (private)
  const algoPosts = [
    { content: 'Dynamic programming practice problems.', type: 'material', tags: ['dp'] },
    { content: 'Does anyone have the recording from last lecture?', type: 'question', tags: ['lecture'] },
    { content: 'Exam moved to moed B.', type: 'announcement', tags: ['exam'] },
    { content: 'Graph traversal cheat sheet: BFS vs DFS.', type: 'material', tags: ['graphs', 'bfs', 'dfs'] },
  ];
  for (let i = 0; i < algoPosts.length; i++) {
    const p = algoPosts[i];
    const date = new Date(2025, months[i % 6], 15 + i);
    posts.push({
      ...p, author: [yoni, dana, eyal][i % 3]._id,
      group: algoGrp._id, createdAt: date, updatedAt: date
    });
  }

  // OS group posts
  const osPosts = [
    { content: 'Process vs Thread — quick summary with diagrams.', type: 'material', tags: ['process', 'thread'] },
    { content: 'How do semaphores prevent deadlock?', type: 'question', tags: ['semaphore', 'deadlock'] },
    { content: 'Lab 4 submission extended to Sunday.', type: 'announcement', tags: ['lab', 'deadline'] },
    { content: 'Virtual memory paging explained step by step.', type: 'material', tags: ['virtual-memory', 'paging'] },
    { content: 'Who has the slides from the scheduling algorithms lecture?', type: 'question', tags: ['scheduling', 'slides'] },
  ];
  for (let i = 0; i < osPosts.length; i++) {
    const p = osPosts[i];
    const date = new Date(2025, months[i % 6], 7 + i * 3);
    posts.push({
      ...p, author: [lior, eyal, sapir, dana][i % 4]._id,
      group: osGrp._id, createdAt: date, updatedAt: date,
      likes: i % 2 === 0 ? [lior._id, eyal._id] : []
    });
  }

  // DB group posts
  const dbPosts = [
    { content: 'MongoDB aggregation pipeline examples.', type: 'material', tags: ['mongodb', 'aggregation'] },
    { content: 'When should I use indexing?', type: 'question', tags: ['indexing', 'performance'] },
    { content: 'SQL vs NoSQL — pros and cons for different use cases.', type: 'material', tags: ['sql', 'nosql'] },
    { content: 'Exam review session this Sunday at 10:00.', type: 'announcement', tags: ['exam', 'review'] },
    { content: 'Mongoose populate() explained with real examples.', type: 'material', tags: ['mongoose', 'populate'] },
  ];
  for (let i = 0; i < dbPosts.length; i++) {
    const p = dbPosts[i];
    const date = new Date(2025, months[i % 6], 12 + i * 3);
    posts.push({
      ...p, author: [lior, noa, hila, shira, tamar][i % 5]._id,
      group: dbGrp._id, createdAt: date, updatedAt: date
    });
  }

  // ML group posts
  const mlPosts = [
    { content: 'Linear regression from scratch in Python — my notebook.', type: 'material', tags: ['regression', 'python'] },
    { content: 'Difference between supervised and unsupervised learning?', type: 'question', tags: ['ml-basics'] },
    { content: 'Project topic proposals due Friday.', type: 'announcement', tags: ['project', 'deadline'] },
  ];
  for (let i = 0; i < mlPosts.length; i++) {
    const p = mlPosts[i];
    const date = new Date(2025, months[i % 6], 20 + i);
    posts.push({
      ...p, author: [dana, lior, eyal][i % 3]._id,
      group: mlGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Circuit group posts
  const circuitPosts = [
    { content: 'Lab 3 report template attached.', type: 'material', tags: ['lab', 'report'] },
    { content: 'How do you calculate impedance in an RC circuit?', type: 'question', tags: ['impedance', 'rc'] },
    { content: 'No lab session this Friday.', type: 'announcement', tags: ['schedule'] },
    { content: 'Oscilloscope tutorial video.', type: 'material', tags: ['oscilloscope'], mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', mediaType: 'video' },
    { content: 'Kirchhoff laws summary with examples.', type: 'material', tags: ['kirchhoff', 'laws'] },
  ];
  for (let i = 0; i < circuitPosts.length; i++) {
    const p = circuitPosts[i];
    const date = new Date(2025, months[i % 6], 8 + i * 2);
    posts.push({
      ...p, author: [amit, oren, rotem, noam][i % 4]._id,
      group: circuitGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Signals group posts (private)
  const signalsPosts = [
    { content: 'Fourier transform summary — all formulas on one page.', type: 'material', tags: ['fourier', 'formulas'] },
    { content: 'Anyone have solutions for HW 5?', type: 'question', tags: ['homework'] },
    { content: 'Lab canceled next week due to holiday.', type: 'announcement', tags: ['lab', 'canceled'] },
  ];
  for (let i = 0; i < signalsPosts.length; i++) {
    const p = signalsPosts[i];
    const date = new Date(2025, months[i % 6], 18 + i);
    posts.push({
      ...p, author: [rotem, oren, noam, amit][i % 4]._id,
      group: signalsGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Marketing group posts
  const marketPosts = [
    { content: 'Case study analysis — Nike digital marketing strategy.', type: 'material', tags: ['case-study', 'nike'] },
    { content: 'What is the difference between B2B and B2C marketing?', type: 'question', tags: ['b2b', 'b2c'] },
    { content: 'Group presentation slides due Wednesday.', type: 'announcement', tags: ['presentation', 'deadline'] },
    { content: 'SWOT analysis template I made for the final project.', type: 'material', tags: ['swot', 'template'] },
  ];
  for (let i = 0; i < marketPosts.length; i++) {
    const p = marketPosts[i];
    const date = new Date(2025, months[i % 6], 4 + i * 4);
    posts.push({
      ...p, author: [tomer, yael, itay][i % 3]._id,
      group: marketGrp._id, createdAt: date, updatedAt: date,
      likes: i < 2 ? [tomer._id, yael._id] : []
    });
  }

  // Accounting group posts
  const accountPosts = [
    { content: 'How to prepare a trial balance — step by step guide.', type: 'material', tags: ['trial-balance'] },
    { content: 'Does depreciation affect the cash flow statement?', type: 'question', tags: ['depreciation', 'cash-flow'] },
    { content: 'Midterm exam covers chapters 1-6.', type: 'announcement', tags: ['midterm', 'exam'] },
  ];
  for (let i = 0; i < accountPosts.length; i++) {
    const p = accountPosts[i];
    const date = new Date(2025, months[i % 6], 10 + i * 5);
    posts.push({
      ...p, author: [yael, tomer, itay][i % 3]._id,
      group: accountGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Cognitive Psychology group posts
  const cogPsyPosts = [
    { content: 'Summary of attention models — Broadbent, Treisman, Deutsch.', type: 'material', tags: ['attention', 'models'] },
    { content: 'What is the difference between short-term and working memory?', type: 'question', tags: ['memory', 'stm'] },
    { content: 'Article discussion next Tuesday — bring printed copies.', type: 'announcement', tags: ['discussion'] },
    { content: 'My flashcards for cognitive biases — 40 cards.', type: 'material', tags: ['biases', 'flashcards'] },
  ];
  for (let i = 0; i < cogPsyPosts.length; i++) {
    const p = cogPsyPosts[i];
    const date = new Date(2025, months[i % 6], 6 + i * 3);
    posts.push({
      ...p, author: [moran, ofir, shira][i % 3]._id,
      group: cogPsyGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Contract Law group posts
  const contractPosts = [
    { content: 'Summary of contract formation requirements in Israeli law.', type: 'material', tags: ['contract', 'formation'] },
    { content: 'Can a minor enter a binding contract? Case law discussion.', type: 'question', tags: ['minor', 'capacity'] },
    { content: 'Mock trial practice — Sunday 16:00 room 412.', type: 'announcement', tags: ['mock-trial'] },
  ];
  for (let i = 0; i < contractPosts.length; i++) {
    const p = contractPosts[i];
    const date = new Date(2025, months[i % 6], 9 + i * 4);
    posts.push({
      ...p, author: [keren, adir][i % 2]._id,
      group: contractGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Operations Research group posts
  const orPosts = [
    { content: 'Simplex method worked example with 3 variables.', type: 'material', tags: ['simplex', 'linear-programming'] },
    { content: 'How do you set up a transportation problem?', type: 'question', tags: ['transportation'] },
    { content: 'HW 3 answers posted on course website.', type: 'announcement', tags: ['homework'] },
  ];
  for (let i = 0; i < orPosts.length; i++) {
    const p = orPosts[i];
    const date = new Date(2025, months[i % 6], 11 + i * 3);
    posts.push({
      ...p, author: [tal, roni][i % 2]._id,
      group: orGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Statistics group posts (cross-department)
  const statsPosts = [
    { content: 'Normal distribution cheat sheet with z-table.', type: 'material', tags: ['normal', 'z-table'] },
    { content: 'When should I use a t-test vs chi-square?', type: 'question', tags: ['t-test', 'chi-square'] },
    { content: 'Study session before the exam — Thursday 18:00 library.', type: 'announcement', tags: ['study', 'exam'] },
    { content: 'Probability formulas summary — Bayes, conditional, combinatorics.', type: 'material', tags: ['probability', 'bayes'] },
    { content: 'What is the central limit theorem in simple words?', type: 'question', tags: ['clt', 'theorem'] },
  ];
  for (let i = 0; i < statsPosts.length; i++) {
    const p = statsPosts[i];
    const date = new Date(2025, months[i % 6], 2 + i * 4);
    const authors = [shira, moran, itay, noam, roni, maya];
    posts.push({
      ...p, author: authors[i % authors.length]._id,
      group: statsGrp._id, createdAt: date, updatedAt: date,
      likes: [authors[(i + 1) % authors.length]._id]
    });
  }

  // Personal posts (no group)
  const personalPosts = [
    { content: 'Looking for a study partner for linear algebra!', type: 'question', tags: ['linear-algebra'], author: maya._id, createdAt: new Date(2025, 2, 20) },
    { content: 'Just passed my AWS certification exam!', type: 'announcement', tags: ['aws', 'cert'], author: dana._id, createdAt: new Date(2025, 3, 1) },
    { content: 'Free pizza at the CS lounge right now.', type: 'announcement', tags: ['food'], author: yoni._id, createdAt: new Date(2025, 4, 10) },
    { content: 'Anyone interested in a hackathon next month? Looking for teammates!', type: 'question', tags: ['hackathon', 'team'], author: eyal._id, createdAt: new Date(2025, 3, 15) },
    { content: 'My internship at Google starts next semester — happy to share tips!', type: 'announcement', tags: ['internship', 'google'], author: lior._id, createdAt: new Date(2025, 4, 1) },
    { content: 'Created a study playlist on Spotify for exam season.', type: 'material', tags: ['study', 'music'], author: shira._id, createdAt: new Date(2025, 2, 25) },
    { content: 'Selling my Discrete Math textbook — barely used, great condition.', type: 'announcement', tags: ['textbook', 'sell'], author: gal._id, createdAt: new Date(2025, 3, 20) },
    { content: 'Tips for surviving the final project crunch week.', type: 'material', tags: ['tips', 'final-project'], author: sapir._id, createdAt: new Date(2025, 4, 5) },
    { content: 'Does anyone have the recording for intro to psychology lecture 8?', type: 'question', tags: ['psychology', 'recording'], author: moran._id, createdAt: new Date(2025, 3, 8) },
    { content: 'Law faculty student council meeting this Wednesday — all invited.', type: 'announcement', tags: ['student-council', 'law'], author: keren._id, createdAt: new Date(2025, 4, 3) },
    { content: 'Excel shortcuts cheat sheet for accounting students.', type: 'material', tags: ['excel', 'accounting'], author: tomer._id, createdAt: new Date(2025, 2, 15) },
    { content: 'Looking for a ride to campus from Haifa on Sunday mornings.', type: 'question', tags: ['ride', 'haifa'], author: roni._id, createdAt: new Date(2025, 3, 25) },
  ];
  personalPosts.forEach(p => posts.push({ ...p, group: null }));

  await Post.insertMany(posts);
  console.log(`Created ${posts.length} posts`);

  // --- chat messages ---
  const chatPairs = [
    [dana, yoni, [
      { text: 'Hey, did you finish the Socket.io part?', mins: 0 },
      { text: 'Almost! Having some issues with rooms.', mins: 2 },
      { text: 'I can help after lunch if you want.', mins: 3 },
      { text: 'That would be great, thanks!', mins: 4 },
      { text: 'Meet at the library at 2?', mins: 5 },
      { text: 'Perfect, see you there!', mins: 6 },
    ]],
    [noa, tamar, [
      { text: 'Did you understand the linked list homework?', mins: 0 },
      { text: 'Sort of... the doubly-linked part is confusing me.', mins: 3 },
      { text: 'Let me share my notes, they helped me a lot.', mins: 5 },
      { text: 'Thank you so much!', mins: 6 },
    ]],
    [eyal, sapir, [
      { text: 'Ready for the web project presentation?', mins: 0 },
      { text: 'I still need to add the D3 charts...', mins: 1 },
      { text: 'I can handle the charts if you finish the CSS part.', mins: 2 },
      { text: 'Deal! Let me push my code first.', mins: 3 },
    ]],
    [tomer, yael, [
      { text: 'Did you start the marketing case study?', mins: 0 },
      { text: 'Yes, I picked Nike — lots of material online.', mins: 2 },
      { text: 'Can we work on it together tomorrow?', mins: 4 },
      { text: 'Sure, I will be at the library after 10.', mins: 5 },
    ]],
    [moran, ofir, [
      { text: 'Are you going to the cognitive psych review session?', mins: 0 },
      { text: 'Definitely. I need help with the attention models.', mins: 3 },
      { text: 'Same! Let us sit together and compare notes.', mins: 5 },
    ]],
  ];

  for (const [userA, userB, msgs] of chatPairs) {
    const roomId = [userA._id, userB._id].sort().join('_');
    for (let i = 0; i < msgs.length; i++) {
      await Message.create({
        roomId,
        sender: i % 2 === 0 ? userA._id : userB._id,
        text: msgs[i].text,
        createdAt: new Date(2025, 4, 1, 10, msgs[i].mins)
      });
    }
  }
  console.log('Created chat messages');

  // Generate realistic notifications for the most active users so the bell icon
  // shows recent activity right after login. Each notification points back to
  // the post that triggered it.
  const notifications = [];
  // Helper to add a notification with a relative-time createdAt
  const makeNotif = (recipient, sender, type, message, postId, group, hoursAgo) => {
    notifications.push({
      recipient: recipient._id,
      sender: sender._id,
      type,
      message,
      post: postId || null,
      group: group?._id || null,
      read: hoursAgo > 24, // older than a day = already read
      createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    });
  };

  // Build notifications from the latest posts: each post's likes and comments
  // become notifications targeting the post author.
  const recentPosts = await Post.find({}).sort({ createdAt: -1 }).limit(40).populate('author', 'name');
  recentPosts.forEach((post, idx) => {
    (post.likes || []).slice(0, 3).forEach((likerId, lIdx) => {
      if (String(likerId) === String(post.author._id)) return;
      const liker = users.find(u => String(u._id) === String(likerId));
      if (liker) makeNotif(post.author, liker, 'like', `${liker.name} liked your post`, post._id, post.group, idx + lIdx);
    });
    (post.comments || []).slice(0, 2).forEach((c, cIdx) => {
      if (String(c.author) === String(post.author._id)) return;
      const commenter = users.find(u => String(u._id) === String(c.author));
      if (commenter) makeNotif(post.author, commenter, 'comment', `${commenter.name} commented on your post`, post._id, post.group, idx + cIdx + 1);
    });
  });

  // A few friend-request notifications for variety
  makeNotif(dana,  yoni,  'friend_request', 'Yoni Levi added you as a friend', null, null, 0.5);
  makeNotif(dana,  maya,  'friend_request', 'Maya Peretz added you as a friend', null, null, 3);
  makeNotif(yoni,  dana,  'friend_request', 'Dana Cohen added you as a friend', null, null, 1);
  makeNotif(eyal,  sapir, 'friend_request', 'Sapir Levy added you as a friend', null, null, 6);
  makeNotif(amit,  rotem, 'friend_request', 'Rotem Hadad added you as a friend', null, null, 12);

  await Notification.insertMany(notifications);
  console.log(`Created ${notifications.length} notifications`);

  console.log('\n=== Seed complete! ===');
  console.log(`${users.length} users, ${groups.length} groups, ${posts.length} posts`);
  console.log('\nDepartments: Computer Science, Electrical Engineering, Information Systems,');
  console.log('             Business Administration, Psychology, Law, Industrial Engineering');
  console.log('\nLogin credentials (password for all regular users: 123456):');
  console.log('  CS:    dana@test.com, yoni@test.com, noa@test.com, eyal@test.com');
  console.log('  EE:    amit@test.com, oren@test.com, rotem@test.com');
  console.log('  Biz:   tomer@test.com, yael@test.com, itay@test.com');
  console.log('  Psych: moran@test.com, ofir@test.com');
  console.log('  Law:   keren@test.com, adir@test.com');
  console.log('  IE:    roni@test.com, tal@test.com');
  console.log('\n  ADMIN: admin@studyhub.com / admin123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
