import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';

function TagPage({ user }) {
  const { tag } = useParams(); // the hashtag from the URL
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load posts AND groups with this tag in parallel
  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/posts/search', { params: { tag } }).catch(() => ({ data: [] })),
      API.get('/groups/search', { params: { tag } }).catch(() => ({ data: [] }))
    ]).then(([postsRes, groupsRes]) => {
      setPosts(postsRes.data || []);
      setGroups(groupsRes.data || []);
      setLoading(false);
    });
  }, [tag]);

  return (
    <div>
      {/* ── Hashtag header ────────────────────────────────────────────────── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1a1a3e 0%, #e94560 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: 'var(--space-6)',
      }}>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, marginBottom: 'var(--space-2)', textShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
          #{tag}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>
          {loading ? 'Loading…' : `${posts.length} post${posts.length === 1 ? '' : 's'} · ${groups.length} group${groups.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* ── Groups with this tag ───────────────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
            Groups <span className="section-count">{groups.length}</span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {groups.map(g => (
              <Link key={g._id} to={`/groups/${g._id}`} className="member-chip">
                <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                  {g.name?.charAt(0)}
                </div>
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Posts with this tag ───────────────────────────────────────────── */}
      <div className="section-header" style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="section-title">
          Recent Posts <span className="section-count">{posts.length}</span>
        </h2>
      </div>

      {loading ? (
        // Skeleton placeholder
        <div className="skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div className="empty-state-title">No posts tagged #{tag}</div>
          <div className="empty-state-text">Be the first to post with this tag!</div>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} currentUserId={user._id} />
        ))
      )}
    </div>
  );
}

export default TagPage;
