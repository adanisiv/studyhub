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

  // --- 16 users (password is "123456" for all) ---
  const users = await User.create([
    { name: 'Dana Cohen',      email: 'dana@test.com',     password: '123456', department: 'Computer Science', year: 3, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DC' },
    { name: 'Yoni Levi',       email: 'yoni@test.com',     password: '123456', department: 'Computer Science', year: 3, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=YL' },
    { name: 'Noa Mizrahi',     email: 'noa@test.com',      password: '123456', department: 'Computer Science', year: 2, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NM' },
    { name: 'Amit Shapira',    email: 'amit@test.com',     password: '123456', department: 'Electrical Eng',   year: 2, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AS' },
    { name: 'Maya Peretz',     email: 'maya@test.com',     password: '123456', department: 'Computer Science', year: 1, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MP' },
    { name: 'Oren Katz',       email: 'oren@test.com',     password: '123456', department: 'Electrical Eng',   year: 4, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=OK' },
    { name: 'Admin User',      email: 'admin@test.com',    password: '123456', department: 'Computer Science', year: 4, role: 'admin', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AU' },
    { name: 'Tamar Ben-David', email: 'tamar@test.com',    password: '123456', department: 'Computer Science', year: 2, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TB' },
    { name: 'Eyal Alon',       email: 'eyal@test.com',     password: '123456', department: 'Computer Science', year: 3, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EA' },
    { name: 'Shira Goldstein', email: 'shira@test.com',    password: '123456', department: 'Information Sys',  year: 1, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SG' },
    { name: 'Rotem Hadad',     email: 'rotem@test.com',    password: '123456', department: 'Electrical Eng',   year: 3, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RH' },
    { name: 'Lior Azulay',     email: 'lior@test.com',     password: '123456', department: 'Computer Science', year: 4, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=LA' },
    { name: 'Hila Oved',       email: 'hila@test.com',     password: '123456', department: 'Information Sys',  year: 2, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=HO' },
    { name: 'Gal Yosef',       email: 'gal@test.com',      password: '123456', department: 'Computer Science', year: 1, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=GY' },
    { name: 'Noam Friedman',   email: 'noam@test.com',     password: '123456', department: 'Electrical Eng',   year: 2, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NF' },
    { name: 'Sapir Levy',      email: 'sapir@test.com',    password: '123456', department: 'Computer Science', year: 3, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SL' },
  ]);
  const [dana, yoni, noa, amit, maya, oren, admin, tamar, eyal, shira, rotem, lior, hila, gal, noam, sapir] = users;
  console.log(`Created ${users.length} users`);

  // friendships
  dana.friends  = [yoni._id, noa._id, maya._id, tamar._id, eyal._id];
  yoni.friends  = [dana._id, amit._id, eyal._id, sapir._id];
  noa.friends   = [dana._id, maya._id, tamar._id, hila._id];
  amit.friends  = [yoni._id, oren._id, noam._id, rotem._id];
  maya.friends  = [dana._id, noa._id, gal._id, shira._id];
  oren.friends  = [amit._id, rotem._id, lior._id];
  admin.friends = [dana._id, yoni._id];
  tamar.friends = [dana._id, noa._id, shira._id, hila._id];
  eyal.friends  = [dana._id, yoni._id, lior._id, sapir._id];
  shira.friends = [maya._id, tamar._id, hila._id, gal._id];
  rotem.friends = [amit._id, oren._id, noam._id];
  lior.friends  = [oren._id, eyal._id, sapir._id];
  hila.friends  = [noa._id, tamar._id, shira._id];
  gal.friends   = [maya._id, shira._id];
  noam.friends  = [amit._id, rotem._id];
  sapir.friends = [yoni._id, eyal._id, lior._id];
  await Promise.all(users.map(u => u.save()));

  // --- groups ---
  const groups = await Group.create([
    {
      name: 'Android Development', description: 'Course projects and help for Android 2',
      subject: 'Android', year: 3, semester: 'B', department: 'Computer Science',
      admin: dana._id, members: [dana._id, yoni._id, noa._id, maya._id, eyal._id, sapir._id, tamar._id], isPrivate: false
    },
    {
      name: 'Data Structures', description: 'DS homework and exam prep',
      subject: 'Data Structures', year: 2, semester: 'A', department: 'Computer Science',
      admin: noa._id, members: [noa._id, amit._id, maya._id, tamar._id, hila._id, gal._id], isPrivate: false
    },
    {
      name: 'Algorithms Study Group', description: 'Private study group for algo course',
      subject: 'Algorithms', year: 3, semester: 'A', department: 'Computer Science',
      admin: yoni._id, members: [yoni._id, dana._id, eyal._id], pendingRequests: [oren._id, sapir._id], isPrivate: true
    },
    {
      name: 'Circuit Design Lab', description: 'Lab reports and circuit help',
      subject: 'Circuits', year: 2, semester: 'B', department: 'Electrical Eng',
      admin: amit._id, members: [amit._id, oren._id, rotem._id, noam._id], isPrivate: false
    },
    {
      name: 'Web Development', description: 'Full-stack web projects and resources',
      subject: 'Web', year: 3, semester: 'B', department: 'Computer Science',
      admin: eyal._id, members: [eyal._id, dana._id, yoni._id, sapir._id, lior._id, tamar._id, maya._id, gal._id], isPrivate: false
    },
    {
      name: 'Database Systems', description: 'SQL, NoSQL, and DB design help',
      subject: 'Databases', year: 2, semester: 'A', department: 'Computer Science',
      admin: lior._id, members: [lior._id, noa._id, hila._id, shira._id, tamar._id], isPrivate: false
    },
    {
      name: 'Signals & Systems', description: 'Private EE study group',
      subject: 'Signals', year: 3, semester: 'A', department: 'Electrical Eng',
      admin: rotem._id, members: [rotem._id, oren._id, noam._id, amit._id], pendingRequests: [gal._id], isPrivate: true
    }
  ]);
  const [androidGrp, dsGrp, algoGrp, circuitGrp, webGrp, dbGrp, signalsGrp] = groups;
  console.log(`Created ${groups.length} groups`);

  // --- posts ---
  const posts = [];
  const months = [0, 1, 2, 3, 4, 5];

  // Android group posts
  const androidPosts = [
    { content: 'How do you set up Socket.io with React? I keep getting CORS errors.', type: 'question', tags: ['socket.io', 'react'] },
    { content: 'Here are my notes on MVC architecture in Node.js. Hope it helps!', type: 'material', tags: ['mvc', 'node'] },
    { content: 'Project deadline extended to next Sunday.', type: 'announcement', tags: ['deadline'] },
    { content: 'Anyone know how to use D3.js inside a React component?', type: 'question', tags: ['d3', 'react'] },
    { content: 'Shared my Mongoose schema examples on GitHub. Link in comments.', type: 'material', tags: ['mongoose', 'mongodb'] },
    { content: 'What CSS3 features are required for the project?', type: 'question', tags: ['css3', 'project'] },
    { content: 'I created a tutorial on JWT authentication with Express. Check it out!', type: 'material', tags: ['jwt', 'express', 'tutorial'] },
    { content: 'Final project presentation schedule is posted on Moodle.', type: 'announcement', tags: ['final', 'schedule'] },
  ];
  for (let i = 0; i < androidPosts.length; i++) {
    const p = androidPosts[i];
    const date = new Date(2025, months[i % 6], 10 + i);
    const authors = [dana, yoni, noa, maya, eyal, sapir, tamar];
    posts.push({
      ...p, author: authors[i % authors.length]._id,
      group: androidGrp._id, createdAt: date, updatedAt: date,
      comments: [
        { author: authors[(i + 1) % authors.length]._id, text: 'Thanks for sharing!' },
        { author: authors[(i + 2) % authors.length]._id, text: 'Very helpful, appreciate it.' }
      ],
      likes: [authors[(i + 1) % authors.length]._id, authors[(i + 3) % authors.length]._id]
    });
  }

  // DS group posts
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

  // Algo group posts (private)
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

  // Web group posts
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
    const authors = [lior, noa, hila, shira, tamar];
    posts.push({
      ...p, author: authors[i % authors.length]._id,
      group: dbGrp._id, createdAt: date, updatedAt: date
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

  // personal posts (no group)
  const personalPosts = [
    { content: 'Looking for a study partner for linear algebra!', type: 'question', tags: ['linear-algebra'], author: maya._id, createdAt: new Date(2025, 2, 20) },
    { content: 'Just passed my AWS certification exam!', type: 'announcement', tags: ['aws', 'cert'], author: dana._id, createdAt: new Date(2025, 3, 1) },
    { content: 'Free pizza at the CS lounge right now.', type: 'announcement', tags: ['food'], author: yoni._id, createdAt: new Date(2025, 4, 10) },
    { content: 'Anyone interested in a hackathon next month? Looking for teammates!', type: 'question', tags: ['hackathon', 'team'], author: eyal._id, createdAt: new Date(2025, 3, 15) },
    { content: 'My internship at Google starts next semester — happy to share tips!', type: 'announcement', tags: ['internship', 'google'], author: lior._id, createdAt: new Date(2025, 4, 1) },
    { content: 'Created a study playlist on Spotify for exam season.', type: 'material', tags: ['study', 'music'], author: shira._id, createdAt: new Date(2025, 2, 25) },
    { content: 'Selling my Discrete Math textbook — barely used, great condition.', type: 'announcement', tags: ['textbook', 'sell'], author: gal._id, createdAt: new Date(2025, 3, 20) },
    { content: 'Tips for surviving the final project crunch week.', type: 'material', tags: ['tips', 'final-project'], author: sapir._id, createdAt: new Date(2025, 4, 5) },
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

  console.log(`\nSeed complete!`);
  console.log(`${users.length} users, ${groups.length} groups, ${posts.length} posts`);
  console.log('Login with any user — password is 123456');
  console.log('Example: email=dana@test.com password=123456');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
