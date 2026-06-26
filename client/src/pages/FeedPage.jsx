import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';

// ── Skeleton components ──────────────────────────────────────────────────────

function SkeletonPost() {
  return (
    <div className="skeleton-card">
      <div className="flex gap-3 items-center" style={{ marginBottom: 16 }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ width: '25%', height: 10 }} />
        </div>
      </div>
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
    </div>
  );
}

function SkeletonDashCard() {
  return (
    <div className="dashboard-card">
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 28 }} />
      <div className="skeleton skeleton-text" style={{ width: '70%', height: 10 }} />
    </div>
  );
}

function SkeletonSidebar() {
  return (
    <div className="sidebar-card">
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-2 items-center" style={{ marginTop: 12 }}>
          <div className="skeleton skeleton-avatar" style={{ width: 28, height: 28 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '80%', height: 11 }} />
            <div className="skeleton skeleton-text" style={{ width: '50%', height: 9 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard stat cards ─────────────────────────────────────────────────────

function DashboardCards({ stats, loading }) {
  const cards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Active Groups',
      value: stats?.activeGroups ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        </svg>
      ),
    },
    {
      label: 'Posts This Week',
      value: stats?.postsThisWeek ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        </svg>
      ),
    },
    {
      label: 'New Members',
      value: stats?.newMembers ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-cards">
        {[1, 2, 3, 4].map(i => <SkeletonDashCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="dashboard-cards">
      {cards.map(card => (
        <div key={card.label} className="dashboard-card">
          <div className="dashboard-card-icon">{card.icon}</div>
          <div className="dashboard-card-value">{card.value}</div>
          <div className="dashboard-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

function FeedSidebar({ user, trending, groups, users, joinLoading, onJoin, onAddFriend, friendLoading }) {
  return (
    <aside className="feed-sidebar" aria-label="Sidebar">

      {/* Trending Tags */}
      <div className="sidebar-card">
        <div className="sidebar-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          Trending Tags
        </div>
        {trending?.tags?.length > 0 ? (
          <div className="trending-tags">
            {trending.tags.map(t => (
              <span key={t.tag} className="trending-tag">
                #{t.tag}
                <span className="trending-tag-count">{t.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No trending tags yet</p>
        )}
      </div>

      {/* Trending Groups */}
      <div className="sidebar-card">
        <div className="sidebar-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          Popular Groups
        </div>
        {trending?.groups?.length > 0 ? (
          <div>
            {trending.groups.map((g, i) => (
              <Link key={g._id} to={`/groups/${g._id}`} className="trending-group-item">
                <span className="trending-group-rank">{i + 1}</span>
                <span className="trending-group-name">{g.name}</span>
                <span className="trending-group-members">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {' '}{g.memberCount}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No groups yet</p>
        )}
      </div>

      {/* Suggested Groups */}
      {groups?.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            Suggested Groups
          </div>
          {groups.map(g => (
            <div key={g._id} className="suggested-item">
              <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{g.name?.charAt(0)}</div>
              <div className="suggested-item-info">
                <Link to={`/groups/${g._id}`} className="suggested-item-name">{g.name}</Link>
                <div className="suggested-item-meta">{g.members?.length || 0} members</div>
              </div>
              <button
                className="btn btn-outline btn-small"
                style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                onClick={() => onJoin(g._id)}
                disabled={joinLoading === g._id}
              >
                {joinLoading === g._id ? <span className="btn-spinner" /> : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Friends */}
      {users?.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
            </svg>
            People You May Know
          </div>
          {users.map(u => (
            <div key={u._id} className="suggested-item">
              <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{u.name?.charAt(0)}</div>
              <div className="suggested-item-info">
                <Link to={`/profile/${u._id}`} className="suggested-item-name">{u.name}</Link>
                <div className="suggested-item-meta">{u.department || 'Student'} · Year {u.year}</div>
              </div>
              <button
                className="btn btn-primary btn-small"
                style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                onClick={() => onAddFriend(u._id)}
                disabled={friendLoading === u._id}
              >
                {friendLoading === u._id ? <span className="btn-spinner" /> : '+ Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// ── FeedPage ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function FeedPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [trending, setTrending] = useState(null);
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [joinLoading, setJoinLoading] = useState(null);
  const [friendLoading, setFriendLoading] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // ── Initial load ───────────────────────────────────────────────────────────

  const loadFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoadingInitial(true);
    else setLoadingMore(true);
    try {
      const res = await API.get(`/posts/feed?page=${pageNum}&limit=${PAGE_SIZE}`);
      const { posts: newPosts = [], pages = 1 } = res.data || {};
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(pageNum < pages);
    } catch (err) {
      console.error(err);
    }
    if (pageNum === 1) setLoadingInitial(false);
    else setLoadingMore(false);
  };

  const loadSidebar = async () => {
    setSidebarLoading(true);
    try {
      const [statsRes, trendingRes, groupsRes, usersRes] = await Promise.all([
        API.get('/stats/dashboard').catch(() => ({ data: null })),
        API.get('/stats/trending').catch(() => ({ data: null })),
        API.get('/groups').catch(() => ({ data: [] })),
        API.get('/users').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setStatsLoading(false);
      setTrending(trendingRes.data);

      // Suggested groups: not a member
      const allGroups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      const nonMember = allGroups.filter(g => !g.members?.some(m => String(m._id || m) === String(user._id)));
      setSuggestedGroups(nonMember.slice(0, 3));

      // Suggested users: not friends and not self
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      const friendIds = new Set((user.friends || []).map(f => String(f._id || f)));
      const strangers = allUsers.filter(u => String(u._id) !== String(user._id) && !friendIds.has(String(u._id)));
      setSuggestedUsers(strangers.slice(0, 4));
    } catch (err) {
      console.error(err);
      setStatsLoading(false);
    }
    setSidebarLoading(false);
  };

  useEffect(() => {
    loadFeed(1, false);
    loadSidebar();
  }, []);

  // ── Infinite scroll via IntersectionObserver ───────────────────────────────

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadFeed(nextPage, true);
  }, [loadingMore, hasMore, page]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore(); },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleLoadMore]);

  // ── Sidebar actions ────────────────────────────────────────────────────────

  const handleJoin = async (groupId) => {
    setJoinLoading(groupId);
    try {
      await API.post(`/groups/${groupId}/join`);
      setSuggestedGroups(prev => prev.filter(g => g._id !== groupId));
      setStats(prev => prev ? { ...prev, activeGroups: (prev.activeGroups || 0) + 1 } : prev);
    } catch (err) {
      console.error(err);
    }
    setJoinLoading(null);
  };

  const handleAddFriend = async (friendId) => {
    setFriendLoading(friendId);
    try {
      await API.post(`/users/${user._id}/friend`, { friendId });
      setSuggestedUsers(prev => prev.filter(u => u._id !== friendId));
      setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers } : prev);
    } catch (err) {
      console.error(err);
    }
    setFriendLoading(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Dashboard cards */}
      <DashboardCards stats={stats} loading={statsLoading} />

      <div className="feed-layout">
        {/* Main feed column */}
        <main>
          <PostForm onCreated={() => { setPage(1); loadFeed(1, false); }} />

          {loadingInitial ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div className="empty-state-title">Your feed is empty</div>
              <div className="empty-state-text">Join groups or add friends to see posts here.</div>
              <div className="empty-state-actions">
                <Link to="/groups" className="btn btn-primary btn-small">Browse Groups</Link>
                <Link to="/search" className="btn btn-outline btn-small">Find People</Link>
              </div>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user._id}
                  onUpdate={() => loadFeed(1, false)}
                  onDelete={() => loadFeed(1, false)}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />

              {loadingMore && (
                <div className="load-more-spinner">
                  <span className="btn-spinner" />
                  Loading more...
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  You've seen all posts
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar */}
        {sidebarLoading ? (
          <div className="feed-sidebar">
            <SkeletonSidebar />
            <SkeletonSidebar />
          </div>
        ) : (
          <FeedSidebar
            user={user}
            trending={trending}
            groups={suggestedGroups}
            users={suggestedUsers}
            joinLoading={joinLoading}
            onJoin={handleJoin}
            onAddFriend={handleAddFriend}
            friendLoading={friendLoading}
          />
        )}
      </div>
    </div>
  );
}

export default FeedPage;
