import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useFeed } from '../hooks/useFeed';
import { useScrollToPost } from '../hooks/useScrollToPost';
// Skeletons are placeholder elements with an animated shimmer.
// They show while content loads, preventing layout shifts and giving visual feedback.

// Skeleton for a single post card
function SkeletonPost() {
  return (
    <div className="skeleton-card">
      {/* Avatar + author name row */}
      <div className="flex gap-3 items-center" style={{ marginBottom: 16 }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ width: '25%', height: 10 }} />
        </div>
      </div>
      {/* Three lines of content text */}
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
    </div>
  );
}

// Skeleton for a dashboard stat card
function SkeletonDashCard() {
  return (
    <div className="dashboard-card">
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 28 }} />
      <div className="skeleton skeleton-text" style={{ width: '70%', height: 10 }} />
    </div>
  );
}

// Skeleton for a sidebar card (used in both trending and suggested sections)
function SkeletonSidebar() {
  return (
    <div className="sidebar-card">
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
      {/* Three suggested items */}
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
// Shows 4 KPI tiles at the top of the feed: total users, active groups,
// posts this week, and new members. Data comes from GET /api/stats/dashboard.

function DashboardCards({ stats, loading }) {
  const { t } = useLanguage();
  const cards = [
    {
      label: t('totalUsers'),
      value: stats?.totalUsers ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      label: t('activeGroups'),
      value: stats?.activeGroups ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        </svg>
      ),
    },
    {
      label: t('postsThisWeek'),
      value: stats?.postsThisWeek ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
        </svg>
      ),
    },
    {
      label: t('newMembers'),
      value: stats?.newMembers ?? '–',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
        </svg>
      ),
    },
  ];

  // Show skeleton tiles while stats are being fetched
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
// The right-hand column with:
//   • Trending Tags — most-used hashtags from the trending API
//   • Popular Groups — top groups by member count
//   • Suggested Groups — groups the user hasn't joined yet (join button)
//   • People You May Know — users who are not yet friends (add button)

function FeedSidebar({ user, trending, groups, users, joinLoading, onJoin, onAddFriend, friendLoading }) {
  const { t } = useLanguage();
  return (
    <aside className="feed-sidebar" aria-label="Sidebar">

      <div className="sidebar-card">
        <div className="sidebar-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          {t('trendingTags')}
        </div>
        {trending?.tags?.length > 0 ? (
          <div className="trending-tags">
            {trending.tags.map(tag => (
              <Link
                key={tag.tag}
                to={`/tag/${encodeURIComponent(tag.tag)}`}
                className="trending-tag"
                title={`#${tag.tag}`}
              >
                #{tag.tag}
                <span className="trending-tag-count">{tag.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{t('noTrendingTags')}</p>
        )}
      </div>

      <div className="sidebar-card">
        <div className="sidebar-card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          {t('popularGroups')}
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
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{t('noGroupsYet')}</p>
        )}
      </div>

      {groups?.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            {t('suggestedGroups')}
          </div>
          {groups.map(g => (
            <div key={g._id} className="suggested-item">
              <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{g.name?.charAt(0)}</div>
              <div className="suggested-item-info">
                <Link to={`/groups/${g._id}`} className="suggested-item-name">{g.name}</Link>
                <div className="suggested-item-meta">{g.members?.length || 0} {t('members')}</div>
              </div>
              <button
                className="btn btn-outline btn-small"
                style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                onClick={() => onJoin(g._id)}
                disabled={joinLoading === g._id}
              >
                {joinLoading === g._id ? <span className="btn-spinner" /> : t('join')}
              </button>
            </div>
          ))}
        </div>
      )}

      {users?.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
            </svg>
            {t('suggestedFriends')}
          </div>
          {users.map(u => (
            <div key={u._id} className="suggested-item">
              <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{u.name?.charAt(0)}</div>
              <div className="suggested-item-info">
                <Link to={`/profile/${u._id}`} className="suggested-item-name">{u.name}</Link>
                <div className="suggested-item-meta">{u.department || t('studentLabel')} · {t('year')} {u.year}</div>
              </div>
              <button
                className="btn btn-primary btn-small"
                style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
                onClick={() => onAddFriend(u._id)}
                disabled={friendLoading === u._id}
              >
                {friendLoading === u._id ? <span className="btn-spinner" /> : `+ ${t('addFriend')}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function FeedPage({ user }) {
  const toast = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // React Query infinite scroll — replaces manual page/posts/loading state
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingInitial,
  } = useFeed();

  // Flatten pages: each page has a `posts` array
  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  // Scroll to + highlight a specific post when arriving via a notification click (?post=<id>)
  useScrollToPost(!loadingInitial && posts.length > 0);

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
  // Loads all sidebar data in parallel using Promise.all.
  // Each individual request has .catch() so one failure doesn't block the rest.
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

      // Suggested groups: filter out groups the user is already a member of,
      // AND restrict to the user's own department — a Computer Science student
      // shouldn't see Pharmacy/Law/Medicine groups suggested to them.
      const allGroups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      const userDept = (user.department || '').toLowerCase();
      const nonMember = allGroups.filter(g =>
        !g.members?.some(m => String(m._id || m) === String(user._id)) &&
        (g.department || '').toLowerCase() === userDept
      );
      setSuggestedGroups(nonMember.slice(0, 3));

      // Suggested users: filter out self, existing friends, AND anyone we already
      // sent a pending friend request to (otherwise they'd reappear and clicking
      // "+ Add Friend" again would just error with "already sent").
      // currentUser.friends comes from localStorage and is stale after any friend
      // activity this session, so fetch a fresh copy from the API first.
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      let freshFriendIds = new Set((user.friends || []).map(f => String(f._id || f)));
      let freshPendingIds = new Set();
      try {
        const meRes = await API.get('/users/me');
        freshFriendIds = new Set((meRes.data?.friends || []).map(f => String(f._id || f)));
        freshPendingIds = new Set((meRes.data?.friendRequestsSent || []).map(f => String(f._id || f)));
      } catch { /* keep the stale set if fetch fails */ }
      const strangers = allUsers.filter(u =>
        String(u._id) !== String(user._id) &&
        !freshFriendIds.has(String(u._id)) &&
        !freshPendingIds.has(String(u._id))
      );
      setSuggestedUsers(strangers.slice(0, 4)); // show at most 4
    } catch (err) {
      console.error(err);
      setStatsLoading(false);
    }
    setSidebarLoading(false);
  };

  // Load sidebar when the page mounts
  useEffect(() => { loadSidebar(); }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    // Create an observer that fires handleLoadMore when the sentinel scrolls into view
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore(); },
      { rootMargin: '200px' } // trigger 200px before the sentinel is fully visible
    );
    observerRef.current.observe(sentinelRef.current);

    // Cleanup: disconnect observer when component unmounts or handleLoadMore changes
    return () => observerRef.current?.disconnect();
  }, [handleLoadMore]);

  // Join a group from the sidebar
  const handleJoin = async (groupId) => {
    setJoinLoading(groupId); // show spinner on that specific button
    try {
      const res = await API.post(`/groups/${groupId}/join`);
      toast(res.data.message || 'Joined group', 'success');
      // Remove this group from suggestions (user is now a member)
      setSuggestedGroups(prev => prev.filter(g => g._id !== groupId));
      // Optimistically increment the group count in the stat tiles
      setStats(prev => prev ? { ...prev, activeGroups: (prev.activeGroups || 0) + 1 } : prev);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to join', 'error');
    }
    setJoinLoading(null);
  };

  // Add a friend from the sidebar
  const handleAddFriend = async (friendId) => {
    setFriendLoading(friendId); // show spinner on that specific button
    try {
      await API.post(`/users/${user._id}/friend`, { friendId });
      toast(t('friendRequestSentToast'), 'success');
      // Remove this user from suggestions
      setSuggestedUsers(prev => prev.filter(u => u._id !== friendId));
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add friend', 'error');
    }
    setFriendLoading(null);
  };

  return (
    <div>
      {/* Dashboard stat tiles — shown above the feed */}
      <DashboardCards stats={stats} loading={statsLoading} />

      <div className="feed-layout">
        {/* Main feed column */}
        <main>
          <PostForm onCreated={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />

          {loadingInitial ? (
            /* Show 3 skeleton cards while the first page loads */
            <>
              <SkeletonPost />
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : posts.length === 0 ? (
            /* Empty state: shown when the user has no feed content yet */
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div className="empty-state-title">{t('feedEmpty')}</div>
              <div className="empty-state-text">{t('feedEmptyDesc')}</div>
              <div className="empty-state-actions">
                <Link to="/groups" className="btn btn-primary btn-small">{t('browseGroups')}</Link>
                <Link to="/search" className="btn btn-outline btn-small">{t('findPeople')}</Link>
              </div>
            </div>
          ) : (
            <>
              {/* Render each post as a PostCard */}
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user._id}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
                  onDelete={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
                />
              ))}

              {/* Infinite scroll sentinel — an invisible div at the bottom of the list.
                  IntersectionObserver fires handleLoadMore when this element enters the viewport. */}
              <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />

              {isFetchingNextPage && (
                <div className="load-more-spinner">
                  <span className="btn-spinner" />
                  {t('loadingMore')}
                </div>
              )}

              {!hasNextPage && posts.length > 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  {t('seenAllPosts')}
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar — skeleton while loading, real sidebar after */}
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
