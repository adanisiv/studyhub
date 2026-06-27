import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';
// Icons for each achievement type — rendered inside the achievement badge
const AchievementIcon = ({ type }) => {
  const icons = {
    first_post: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    author: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
    prolific: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    first_friend: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>,
    networker: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    social_hub: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    team_player: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    community: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  };
  return icons[type] || null;
};

// Achievement definitions: each has an id, display name, description, and a
// check() function that receives (postCount, friendCount, groupCount) and
// returns true if the achievement is earned.
const ALL_ACHIEVEMENTS = [
  { id: 'first_post',    name: 'First Post',        desc: 'Published your first post',    check: (p, f, g) => p >= 1 },
  { id: 'author',        name: 'Author',            desc: 'Published 5+ posts',            check: (p, f, g) => p >= 5 },
  { id: 'prolific',      name: 'Prolific',          desc: 'Published 25+ posts',           check: (p, f, g) => p >= 25 },
  { id: 'first_friend',  name: 'Connected',         desc: 'Made your first friend',        check: (p, f, g) => f >= 1 },
  { id: 'networker',     name: 'Networker',         desc: 'Made 5+ friends',               check: (p, f, g) => f >= 5 },
  { id: 'social_hub',    name: 'Social Hub',        desc: 'Made 15+ friends',              check: (p, f, g) => f >= 15 },
  { id: 'team_player',   name: 'Team Player',       desc: 'Joined your first group',       check: (p, f, g) => g >= 1 },
  { id: 'community',     name: 'Community Builder',  desc: 'Joined 5+ groups',             check: (p, f, g) => g >= 5 },
];

// Renders the 8 achievement badges, each showing as "earned" or "locked"
// based on the user's current post/friend/group counts.
function Achievements({ posts, friends, groups }) {
  const postCount = posts.length;
  const friendCount = friends?.length || 0;
  const groupCount = groups?.length || 0;

  return (
    <div className="card">
      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Achievements</h2>
      <div className="achievements-grid">
        {ALL_ACHIEVEMENTS.map(a => {
          const earned = a.check(postCount, friendCount, groupCount);
          return (
            // CSS class 'earned' or 'locked' controls visual styling of the badge
            <div key={a.id} className={`achievement-badge ${earned ? 'earned' : 'locked'}`} title={a.desc}>
              {earned && <span className="achievement-checkmark">&#10003;</span>}
              <span className="achievement-icon"><AchievementIcon type={a.id} /></span>
              <span className="achievement-name">{a.name}</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePage({ currentUser }) {
  const { id } = useParams(); // profile user's MongoDB ID from the URL
  const toast = useToast();
  const confirm = useConfirm();

  const [profile, setProfile] = useState(null);     // the profile user's data
  const [posts, setPosts] = useState([]);            // the user's own posts (own profile only)
  const [userGroups, setUserGroups] = useState([]);  // groups the profile user belongs to
  const [editing, setEditing] = useState(false);    // whether the edit form is open
  const [editForm, setEditForm] = useState({});     // edit form field values
  const [userStats, setUserStats] = useState(null); // personal aggregated stats

  // canvasRef gives us access to the <canvas> DOM element for drawing
  const canvasRef = useRef(null);

  // Whether we're viewing our own profile or someone else's
  const isOwnProfile = id === currentUser._id;
  // Check friendship using profile.friends (reloaded from API after add/remove).
  // We cannot use currentUser.friends here because it's loaded from localStorage
  // once at login and never refreshed — it would always show stale data.
  const isFriend = profile?.friends?.some(f => String(f._id || f) === String(currentUser._id));

  // Fetch the profile user's data from GET /api/users/:id
  const loadProfile = async () => {
    try {
      const res = await API.get(`/users/${id}`);
      setProfile(res.data);
      setEditForm({ name: res.data.name, department: res.data.department, year: res.data.year });
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch the user's posts (only relevant when viewing own profile)
  const loadPosts = async () => {
    if (!isOwnProfile) return; // don't fetch posts for other users' profiles
    try {
      const res = await API.get('/posts/my');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all groups and filter to only those the profile user belongs to
  const loadGroups = async () => {
    try {
      const res = await API.get('/groups');
      const memberOf = res.data.filter(g => g.members?.some(m => (m._id || m) === id));
      setUserGroups(memberOf);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch aggregated stats for the displayed user (post/like/comment counts)
  const loadUserStats = async () => {
    try {
      const res = await API.get(`/stats/user/${id}`);
      setUserStats(res.data);
    } catch (err) {
      console.error(err);
      setUserStats(null);
    }
  };

  // Load all profile data when :id in the URL changes
  useEffect(() => { loadProfile(); loadPosts(); loadGroups(); loadUserStats(); }, [id]);
  // Draws a gradient banner with decorative circles and the user's name/initial.
  // Runs whenever the profile data changes (needs name/department to render text).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;

    // Scale canvas for retina/HiDPI displays to avoid blurry rendering
    const dpr = window.devicePixelRatio || 1;
    const w = 860;
    const h = 110;
    canvas.width = w * dpr;   // physical pixel dimensions
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';   // CSS dimensions (display size)
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // scale drawing context to match devicePixelRatio

    // Background: diagonal gradient from dark navy → indigo → red
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f0f1a');
    grad.addColorStop(0.4, '#1a1a3e');
    grad.addColorStop(1, '#e94560');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles: 8 semi-transparent circles with sine-wave positions
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(60 + i * 100, 55 + Math.sin(i * 0.8) * 25, 20 + i * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.02 + i * 0.008})`;
      ctx.fill();
    }

    // First letter of the user's name as a large avatar initial
    const initial = profile.name?.charAt(0)?.toUpperCase() || '?';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initial, 70, 78);

    // User's full name
    ctx.font = 'bold 22px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(profile.name, 130, 58);

    // Department and year in smaller text
    ctx.font = '13px Rubik, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${profile.department || 'No department'} · Year ${profile.year}`, 130, 82);

    // Redraw the initial with a glow effect (shadow before text draw)
    // Canvas doesn't have CSS text-shadow, so we simulate it with shadowBlur
    ctx.shadowColor = 'rgba(233, 69, 96, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initial, 70, 78);
    ctx.shadowBlur = 0; // reset shadow so it doesn't affect other drawings
  }, [profile]);
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${id}`, editForm);
      setEditing(false);
      toast('Profile updated', 'success');
      loadProfile(); // reload to show the updated name/department
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Add the profile user as a friend
  const handleAddFriend = async () => {
    try {
      await API.post(`/users/${currentUser._id}/friend`, { friendId: id });
      toast('Friend added!', 'success');
      loadProfile(); // reload so the friend relationship is reflected
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Remove the profile user from the friend list
  const handleRemoveFriend = async () => {
    try {
      // DELETE with a body requires passing { data: ... } in Axios
      await API.delete(`/users/${currentUser._id}/friend`, { data: { friendId: id } });
      toast('Friend removed', 'info');
      loadProfile();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };
  // This permanently deletes the account — uses ConfirmDialog to prevent accidents.
  const handleDeleteAccount = async () => {
    if (!await confirm('Delete your account? This cannot be undone.', 'Delete Account')) return;
    try {
      await API.delete(`/users/${id}`);
      localStorage.clear(); // remove JWT and user data from browser storage
      window.location.href = '/login'; // hard redirect to login page
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Loading state: skeleton placeholder while the profile API call is in flight
  if (!profile) return (
    <div>
      {/* Skeleton for the canvas banner */}
      <div className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }} />
      <div className="skeleton-card" style={{ height: 140 }}>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 20 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: 12 }} />
        <div className="skeleton skeleton-text" style={{ width: '30%' }} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Canvas banner — HTML5 Canvas API course requirement.
          The canvas element is drawn into by the useEffect above.
          aria-label provides text description for screen readers. */}
      <canvas ref={canvasRef} width={860} height={110} className="profile-canvas" aria-label={`Profile banner for ${profile.name}`} />

      <div className="profile-card">
        <div className="profile-info">
          {editing ? (
            /* Inline edit form — replaces the profile info while editing */
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="pe-name">Name</label>
                <input id="pe-name" className="form-input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              {/* Department and Year in a 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label htmlFor="pe-dept">Department</label>
                  <input id="pe-dept" className="form-input" value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="pe-year">Year</label>
                  <select id="pe-year" className="form-input" value={editForm.year}
                    onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })}>
                    {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-small" type="submit">Save Changes</button>
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            /* Normal profile view */
            <>
              <div className="flex-between">
                <div>
                  <h2 className="profile-name">{profile.name}</h2>
                  <p className="profile-detail">
                    {profile.email} · {profile.department || 'No department'} · Year {profile.year}
                  </p>
                </div>
              </div>
              <div className="profile-actions">
                {/* Own profile: Edit Profile and Delete Account buttons */}
                {isOwnProfile && (
                  <button className="btn btn-secondary btn-small" onClick={() => setEditing(true)} aria-label="Edit profile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit Profile
                  </button>
                )}
                {isOwnProfile && (
                  <button className="btn btn-danger btn-small" onClick={handleDeleteAccount}>Delete Account</button>
                )}
                {/* Other user's profile: Add Friend (if not already friends) */}
                {!isOwnProfile && !isFriend && (
                  <button className="btn btn-primary btn-small" onClick={handleAddFriend}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                    Add Friend
                  </button>
                )}
                {/* Other user's profile: Remove Friend (if already friends) */}
                {!isOwnProfile && isFriend && (
                  <button className="btn btn-outline btn-small" onClick={handleRemoveFriend}>Remove Friend</button>
                )}
                {/* Other user's profile: Message button links to the chat page */}
                {!isOwnProfile && (
                  <Link to={`/chat/${id}`} className="btn btn-secondary btn-small">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Message
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Friends list — clickable chips linking to each friend's profile */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
          Friends <span className="section-count">{profile.friends?.length || 0}</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {profile.friends?.map(f => (
            <Link key={f._id} to={`/profile/${f._id}`} className="member-chip">
              <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 10 }}>{f.name?.charAt(0)}</div>
              {f.name}
            </Link>
          ))}
          {(!profile.friends || profile.friends.length === 0) && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No friends yet</p>
          )}
        </div>
      </div>

      {/* Personal stats — 4 KPI cards summarizing the user's activity */}
      <div className="kpi-grid" style={{ marginTop: 'var(--space-4)' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#6366f1' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <div className="kpi-value">{userStats?.totalPosts ?? '–'}</div>
          <div className="kpi-label">Posts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f93a5b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <div className="kpi-value">{userStats?.likesReceived ?? '–'}</div>
          <div className="kpi-label">Likes Received</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="kpi-value">{userStats?.commentsReceived ?? '–'}</div>
          <div className="kpi-label">Comments Received</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#10b981' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="kpi-value">{userGroups.length}</div>
          <div className="kpi-label">Groups Joined</div>
        </div>
      </div>

      {/* Achievements — calculated from the user's actual post/friend/group counts */}
      <Achievements posts={posts} friends={profile.friends} groups={userGroups} />

      {/* Own posts list — only shown when viewing the logged-in user's own profile */}
      {isOwnProfile && (
        <>
          <div className="section-header mt-20">
            <h2 className="section-title">My Posts <span className="section-count">{posts.length}</span></h2>
          </div>
          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">You haven't posted anything yet</div>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post._id} post={post} currentUserId={currentUser._id}
                onUpdate={loadPosts} onDelete={loadPosts} />
            ))
          )}
        </>
      )}
    </div>
  );
}

export default ProfilePage;
