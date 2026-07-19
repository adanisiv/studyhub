import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useLanguage } from '../contexts/LanguageContext';
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

function Achievements({ posts, friends, groups }) {
  const { t } = useLanguage();
  const postCount = posts.length;
  const friendCount = friends?.length || 0;
  const groupCount = groups?.length || 0;

  return (
    <div className="card">
      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>{t('achievements')}</h2>
      <div className="achievements-grid">
        {ALL_ACHIEVEMENTS.map(a => {
          const earned = a.check(postCount, friendCount, groupCount);
          return (
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

function ProfilePage({ currentUser, onUserUpdate }) {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useLanguage();

  // All of these are useState: each change re-renders the page.
  const [profile, setProfile] = useState(null);       // useState — the user this profile belongs to
  const [posts, setPosts] = useState([]);              // useState — the posts this user published
  const [userGroups, setUserGroups] = useState([]);    // useState — the groups this user is a member of
  const [editing, setEditing] = useState(false);       // useState — whether the edit form is currently open
  const [editForm, setEditForm] = useState({});        // useState — the values in the edit form while typing
  const [userStats, setUserStats] = useState(null);    // useState — the stats numbers (posts/likes/comments)

  const canvasRef = useRef(null);       // useRef — points to the canvas element that draws the banner
  const avatarInputRef = useRef(null);  // useRef — points to the hidden file input, to open it via a button click
  const [avatarUploading, setAvatarUploading] = useState(false); // useState — whether the profile photo is currently uploading

  const isOwnProfile = id === currentUser._id;
  // Server computes this relative to the logged-in viewer: 'none' | 'pending_sent' |
  // 'pending_received' | 'friends' | 'self'
  const friendStatus = profile?.friendStatus || 'none';

  const loadProfile = async () => {
    try {
      const res = await API.get(`/users/${id}`);
      setProfile(res.data);
      setEditForm({ name: res.data.name, department: res.data.department, year: res.data.year, avatar: res.data.avatar || '' });
    } catch (err) {
      console.error(err);
    }
  };

  // Always load posts for the profile user — shown on all profiles (own and others)
  const loadPosts = async () => {
    try {
      const res = await API.get(`/posts/user/${id}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await API.get('/groups');
      const memberOf = res.data.filter(g => g.members?.some(m => (m._id || m) === id));
      setUserGroups(memberOf);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUserStats = async () => {
    try {
      const res = await API.get(`/stats/user/${id}`);
      setUserStats(res.data);
    } catch (err) {
      console.error(err);
      setUserStats(null);
    }
  };

  // useEffect — runs every time id changes (viewing a different profile). Loads
  // the profile, posts, groups, and stats for whichever user this page is for.
  useEffect(() => { loadProfile(); loadPosts(); loadGroups(); loadUserStats(); }, [id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('media', file);
      const res = await API.post('/upload', form);
      setEditForm(prev => ({ ...prev, avatar: res.data.url }));
      toast('Photo uploaded', 'success');
    } catch (err) {
      toast('Upload failed', 'error');
    }
    setAvatarUploading(false);
  };

  // useEffect — runs every time `profile` changes. Draws a gradient banner with
  // the user's name/initial using the HTML5 Canvas API.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 860;
    const h = 110;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f0f1a');
    grad.addColorStop(0.4, '#1a1a3e');
    grad.addColorStop(1, '#e94560');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(60 + i * 100, 55 + Math.sin(i * 0.8) * 25, 20 + i * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.02 + i * 0.008})`;
      ctx.fill();
    }

    const initial = profile.name?.charAt(0)?.toUpperCase() || '?';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initial, 70, 78);

    ctx.font = 'bold 22px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(profile.name, 130, 58);

    ctx.font = '13px Rubik, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${profile.department || 'No department'} · Year ${profile.year}`, 130, 82);

    ctx.shadowColor = 'rgba(233, 69, 96, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initial, 70, 78);
    ctx.shadowBlur = 0;
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/users/${id}`, editForm);
      setEditing(false);
      toast('Profile updated', 'success');
      loadProfile();
      // Sync the Navbar/App state so avatar and name change instantly
      if (isOwnProfile && onUserUpdate) {
        onUserUpdate({ name: editForm.name, avatar: editForm.avatar || '' });
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Sends a friend request (does not add either side to `friends` yet — the
  // other person must Accept first, either here or from the notification bell).
  const handleAddFriend = async () => {
    try {
      await API.post(`/users/${currentUser._id}/friend`, { friendId: id });
      toast(t('friendRequestSentToast'), 'success');
      loadProfile();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Accepts a request THEY sent me (only relevant when friendStatus === 'pending_received').
  const handleAcceptFriend = async () => {
    try {
      await API.post(`/users/${currentUser._id}/friend/accept`, { requesterId: id });
      toast(t('friendRequestAcceptedToast'), 'success');
      loadProfile();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // One endpoint covers all 3 "sever the relationship" cases — unfriend, cancel
  // a request I sent, or decline a request they sent me — so the label just
  // changes based on friendStatus while the call stays the same.
  const handleRemoveFriend = async () => {
    try {
      await API.delete(`/users/${currentUser._id}/friend`, { data: { friendId: id } });
      const msg = friendStatus === 'pending_sent' ? t('friendRequestCanceledToast')
        : friendStatus === 'pending_received' ? t('friendRequestDeclinedToast')
        : 'Friend removed';
      toast(msg, 'info');
      loadProfile();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!await confirm('Delete your account? This cannot be undone.', 'Delete Account')) return;
    try {
      await API.delete(`/users/${id}`);
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  if (!profile) return (
    <div>
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
      {/* Canvas banner — HTML5 Canvas API course requirement */}
      <canvas ref={canvasRef} width={860} height={110} className="profile-canvas" aria-label={`Profile banner for ${profile.name}`} />

      {/* ── Profile card ────────────────────────────────────────────────── */}
      <div className="profile-card">
        <div className="profile-info">
          {editing ? (
            <form onSubmit={handleUpdate}>
              {/* Avatar upload section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                {/* Preview: show uploaded photo or initial */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1a1a3e, #e94560)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: '#fff', border: '2px solid var(--border-light)',
                }}>
                  {editForm.avatar
                    ? <img src={editForm.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : profile.name?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {t('profilePhoto')}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? t('uploading') : t('uploadPhoto')}
                  </button>
                  {editForm.avatar && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      style={{ marginLeft: 8, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}
                      onClick={() => setEditForm(prev => ({ ...prev, avatar: '' }))}
                    >
                      {t('remove')}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pe-name">{t('name')}</label>
                <input id="pe-name" className="form-input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label htmlFor="pe-dept">{t('department')}</label>
                  <input id="pe-dept" className="form-input" value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="pe-year">{t('year')}</label>
                  <select id="pe-year" className="form-input" value={editForm.year}
                    onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })}>
                    {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-small" type="submit">{t('saveChanges')}</button>
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditing(false)}>{t('cancel')}</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {/* Avatar: photo if set, otherwise letter initial */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1a1a3e, #e94560)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: '#fff', border: '2px solid var(--border-light)',
                  }}>
                    {profile.avatar
                      ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile.name?.charAt(0)?.toUpperCase()
                    }
                  </div>
                  <div>
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-detail">
                      {profile.email} · {profile.department || 'No department'} · Year {profile.year}
                    </p>
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                {isOwnProfile && (
                  <button className="btn btn-secondary btn-small" onClick={() => setEditing(true)} aria-label="Edit profile">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('editProfile')}
                  </button>
                )}
                {isOwnProfile && (
                  <button className="btn btn-danger btn-small" onClick={handleDeleteAccount}>{t('deleteAccount')}</button>
                )}
                {!isOwnProfile && friendStatus === 'none' && (
                  <button className="btn btn-primary btn-small" onClick={handleAddFriend}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                    {t('addFriend')}
                  </button>
                )}
                {!isOwnProfile && friendStatus === 'pending_sent' && (
                  <button className="btn btn-outline btn-small" onClick={handleRemoveFriend}>{t('cancelRequest')}</button>
                )}
                {!isOwnProfile && friendStatus === 'pending_received' && (
                  <>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', alignSelf: 'center' }}>{t('respondToRequest')}</span>
                    <button className="btn btn-primary btn-small" onClick={handleAcceptFriend}>{t('acceptRequest')}</button>
                    <button className="btn btn-outline btn-small" onClick={handleRemoveFriend}>{t('declineRequest')}</button>
                  </>
                )}
                {!isOwnProfile && friendStatus === 'friends' && (
                  <button className="btn btn-outline btn-small" onClick={handleRemoveFriend}>{t('removeFriend')}</button>
                )}
                {!isOwnProfile && (
                  <Link to={`/chat/${id}`} className="btn btn-secondary btn-small">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    {t('message')}
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── KPI stats row ───────────────────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginTop: 'var(--space-4)' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#6366f1' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <div className="kpi-value">{userStats?.totalPosts ?? posts.length}</div>
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

      {/* ── Posts feed (LinkedIn style — shown for all profiles) ─────────── */}
      <div className="section-header mt-20" style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="section-title">
          {isOwnProfile ? 'My Posts' : `Posts by ${profile.name?.split(' ')[0]}`}
          <span className="section-count">{posts.length}</span>
        </h2>
      </div>
      {posts.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <div className="empty-state-title">No posts yet</div>
          <div className="empty-state-text">
            {isOwnProfile ? "You haven't posted anything yet" : `${profile.name?.split(' ')[0]} hasn't posted anything yet`}
          </div>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} currentUserId={currentUser._id}
            onUpdate={loadPosts} onDelete={loadPosts} />
        ))
      )}

      {/* ── Friends list ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
          {t('friends')} <span className="section-count">{profile.friends?.length || 0}</span>
        </h2>
        {profile.friends?.length > 0 ? (
          <div className="friends-list" style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {profile.friends.map(f => (
              <Link
                key={f._id}
                to={`/profile/${f._id}`}
                className="friend-row"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text-primary)' }}
              >
                {f.avatar
                  ? <div className="avatar avatar-sm" style={{ width: 36, height: 36, overflow: 'hidden', padding: 0, flexShrink: 0 }}>
                      <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.textContent = f.name?.charAt(0)?.toUpperCase() || '?'; }} />
                    </div>
                  : <div className="avatar avatar-sm" style={{ width: 36, height: 36, fontSize: 15, flexShrink: 0 }}>{f.name?.charAt(0)?.toUpperCase() || '?'}</div>
                }
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                  {f.department && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{f.department}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{t('noFriendsYet')}</p>
        )}
      </div>

      {/* ── Achievements ────────────────────────────────────────────────── */}
      <Achievements posts={posts} friends={profile.friends} groups={userGroups} />
    </div>
  );
}

export default ProfilePage;
