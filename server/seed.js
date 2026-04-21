require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Post = require('./models/Post');
const Message = require('./models/Message');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // clear everything
  await User.deleteMany({});
  await Group.deleteMany({});
  await Post.deleteMany({});
  await Message.deleteMany({});
  console.log('Cleared old data');

  // --- users (password is "123456" for all) ---
  const users = await User.create([
    { name: 'Dana Cohen',    email: 'dana@test.com',    password: '123456', department: 'Computer Science', year: 3 },
    { name: 'Yoni Levi',     email: 'yoni@test.com',    password: '123456', department: 'Computer Science', year: 3 },
    { name: 'Noa Mizrahi',   email: 'noa@test.com',     password: '123456', department: 'Computer Science', year: 2 },
    { name: 'Amit Shapira',  email: 'amit@test.com',    password: '123456', department: 'Electrical Eng',   year: 2 },
    { name: 'Maya Peretz',   email: 'maya@test.com',    password: '123456', department: 'Computer Science', year: 1 },
    { name: 'Oren Katz',     email: 'oren@test.com',    password: '123456', department: 'Electrical Eng',   year: 4 },
    { name: 'Admin User',    email: 'admin@test.com',   password: '123456', department: 'Computer Science', year: 4, role: 'admin' },
  ]);
  const [dana, yoni, noa, amit, maya, oren, admin] = users;
  console.log(`Created ${users.length} users`);

  // friendships
  dana.friends = [yoni._id, noa._id, maya._id];
  yoni.friends = [dana._id, amit._id];
  noa.friends  = [dana._id, maya._id];
  amit.friends = [yoni._id, oren._id];
  maya.friends = [dana._id, noa._id];
  oren.friends = [amit._id];
  await Promise.all(users.map(u => u.save()));

  // --- groups ---
  const groups = await Group.create([
    {
      name: 'Android Development', description: 'Course projects and help for Android 2',
      subject: 'Android', year: 3, semester: 'B', department: 'Computer Science',
      admin: dana._id, members: [dana._id, yoni._id, noa._id, maya._id], isPrivate: false
    },
    {
      name: 'Data Structures', description: 'DS homework and exam prep',
      subject: 'Data Structures', year: 2, semester: 'A', department: 'Computer Science',
      admin: noa._id, members: [noa._id, amit._id, maya._id], isPrivate: false
    },
    {
      name: 'Algorithms Study Group', description: 'Private study group for algo course',
      subject: 'Algorithms', year: 3, semester: 'A', department: 'Computer Science',
      admin: yoni._id, members: [yoni._id, dana._id], pendingRequests: [oren._id], isPrivate: true
    },
    {
      name: 'Circuit Design Lab', description: 'Lab reports and circuit help',
      subject: 'Circuits', year: 2, semester: 'B', department: 'Electrical Eng',
      admin: amit._id, members: [amit._id, oren._id], isPrivate: false
    }
  ]);
  const [androidGrp, dsGrp, algoGrp, circuitGrp] = groups;
  console.log(`Created ${groups.length} groups`);

  // --- posts ---
  const months = [0, 1, 2, 3, 4, 5]; // spread posts across months for D3 chart
  const posts = [];

  // Android group posts
  const androidPosts = [
    { content: 'How do you set up Socket.io with React? I keep getting CORS errors.', type: 'question', tags: ['socket.io', 'react'] },
    { content: 'Here are my notes on MVC architecture in Node.js. Hope it helps!', type: 'material', tags: ['mvc', 'node'] },
    { content: 'Project deadline extended to next Sunday.', type: 'announcement', tags: ['deadline'] },
    { content: 'Anyone know how to use D3.js inside a React component?', type: 'question', tags: ['d3', 'react'] },
    { content: 'Shared my Mongoose schema examples on GitHub. Link in comments.', type: 'material', tags: ['mongoose', 'mongodb'] },
    { content: 'What CSS3 features are required for the project?', type: 'question', tags: ['css3', 'project'] },
  ];
  for (let i = 0; i < androidPosts.length; i++) {
    const p = androidPosts[i];
    const date = new Date(2025, months[i % 6], 10 + i);
    posts.push({
      ...p, author: [dana, yoni, noa, maya][i % 4]._id,
      group: androidGrp._id, createdAt: date, updatedAt: date,
      comments: [{ author: [yoni, dana, maya, noa][i % 4]._id, text: 'Thanks for sharing!' }]
    });
  }

  // DS group posts
  const dsPosts = [
    { content: 'Can someone explain AVL tree rotations?', type: 'question', tags: ['avl', 'trees'] },
    { content: 'Uploaded my summary for linked lists chapter.', type: 'material', tags: ['linked-list'] },
    { content: 'Quiz next Thursday — chapters 4 through 7.', type: 'announcement', tags: ['quiz'] },
    { content: 'Big O cheat sheet I made.', type: 'material', tags: ['big-o', 'complexity'] },
    { content: 'How does a min-heap differ from a BST?', type: 'question', tags: ['heap', 'bst'] },
  ];
  for (let i = 0; i < dsPosts.length; i++) {
    const p = dsPosts[i];
    const date = new Date(2025, months[i % 6], 5 + i * 3);
    posts.push({
      ...p, author: [noa, amit, maya][i % 3]._id,
      group: dsGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Algo group posts (private)
  const algoPosts = [
    { content: 'Dynamic programming practice problems.', type: 'material', tags: ['dp'] },
    { content: 'Does anyone have the recording from last lecture?', type: 'question', tags: ['lecture'] },
    { content: 'Exam moved to moed B.', type: 'announcement', tags: ['exam'] },
  ];
  for (let i = 0; i < algoPosts.length; i++) {
    const p = algoPosts[i];
    const date = new Date(2025, months[i % 6], 15 + i);
    posts.push({
      ...p, author: [yoni, dana][i % 2]._id,
      group: algoGrp._id, createdAt: date, updatedAt: date
    });
  }

  // Circuit group posts
  const circuitPosts = [
    { content: 'Lab 3 report template attached.', type: 'material', tags: ['lab', 'report'] },
    { content: 'How do you calculate impedance in an RC circuit?', type: 'question', tags: ['impedance', 'rc'] },
    { content: 'No lab session this Friday.', type: 'announcement', tags: ['schedule'] },
    { content: 'Oscilloscope tutorial video.', type: 'material', tags: ['oscilloscope'], mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', mediaType: 'video' },
  ];
  for (let i = 0; i < circuitPosts.length; i++) {
    const p = circuitPosts[i];
    const date = new Date(2025, months[i % 6], 8 + i * 2);
    posts.push({
      ...p, author: [amit, oren][i % 2]._id,
      group: circuitGrp._id, createdAt: date, updatedAt: date
    });
  }

  // personal posts (no group)
  posts.push(
    { content: 'Looking for a study partner for linear algebra!', type: 'question', tags: ['linear-algebra'], author: maya._id, group: null, createdAt: new Date(2025, 2, 20) },
    { content: 'Just passed my AWS certification exam!', type: 'announcement', tags: ['aws', 'cert'], author: dana._id, group: null, createdAt: new Date(2025, 3, 1) },
    { content: 'Free pizza at the CS lounge right now.', type: 'announcement', tags: ['food'], author: yoni._id, group: null, createdAt: new Date(2025, 4, 10) },
  );

  await Post.insertMany(posts);
  console.log(`Created ${posts.length} posts`);

  // --- chat messages ---
  const roomId = [dana._id, yoni._id].sort().join('_');
  await Message.create([
    { roomId, sender: dana._id, text: 'Hey, did you finish the Socket.io part?', createdAt: new Date(2025, 4, 1, 10, 0) },
    { roomId, sender: yoni._id, text: 'Almost! Having some issues with rooms.', createdAt: new Date(2025, 4, 1, 10, 2) },
    { roomId, sender: dana._id, text: 'I can help after lunch if you want.', createdAt: new Date(2025, 4, 1, 10, 3) },
    { roomId, sender: yoni._id, text: 'That would be great, thanks!', createdAt: new Date(2025, 4, 1, 10, 4) },
  ]);
  console.log('Created chat messages');

  console.log('\nSeed complete! You can login with any user, password is 123456');
  console.log('Example: email=dana@test.com password=123456');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
