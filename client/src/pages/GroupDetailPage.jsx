import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useLanguage } from '../contexts/LanguageContext';
import { useGroup, useGroupPosts, useGroupInvalidate } from '../hooks/useGroup';
import { useScrollToPost } from '../hooks/useScrollToPost';

function GroupDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'resources'
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [approveLoading, setApproveLoading] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: group, isLoading: groupLoading, error: groupError } = useGroup(id);
  const { data: posts = [] } = useGroupPosts(id);
  const invalidate = useGroupInvalidate();

  // Scroll to + highlight a specific post when arriving via a notification click (?post=<id>)
  useScrollToPost(posts.length > 0);

  // Pre-fill edit form whenever group data loads
  useEffect(() => {
    if (group) setEditForm({ name: group.name, description: group.description, subject: group.subject });
  }, [group]);

  // Derived flags: is the current user the group admin? is the user a member?
  // group?.admin may be a full object or just an ID string depending on populate depth
  const isAdmin = String(group?.admin?._id || group?.admin) === String(user._id);
  const isMember = group?.members?.some(m => String(m._id || m) === String(user._id));
  // Calls POST /api/groups/:id/approve with the userId of the requester
  const handleApprove = async (userId) => {
    setApproveLoading(userId); // spinner on the specific Approve button
    try {
      await API.post(`/groups/${id}/approve`, { userId });
      toast('Member approved', 'success');
      invalidate(id); // reload to move the user from pendingRequests → members
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setApproveLoading(null);
  };
  // Uses the ConfirmDialog to ask for confirmation before the irreversible action.
  // await confirm(...) returns true if the user clicked Confirm, false if cancelled.
  const handleLeave = async () => {
    if (!await confirm('Leave this group?', 'Leave Group')) return;
    setActionLoading(true);
    try {
      await API.post(`/groups/${id}/leave`);
      navigate('/groups'); // redirect to the groups list after leaving
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setActionLoading(false);
  };
  const handleDelete = async () => {
    if (!await confirm('Delete this group? This cannot be undone.', 'Delete Group')) return;
    setActionLoading(true);
    try {
      await API.delete(`/groups/${id}`);
      navigate('/groups'); // redirect to the groups list after deletion
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setActionLoading(false);
  };
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/groups/${id}`, editForm);
      setEditing(false);
      toast('Group updated', 'success');
      invalidate(id); // reload to show the updated name/description
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  // Error state
  if (groupError) return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
      </div>
      <div className="empty-state-title" style={{ color: 'var(--error)' }}>{groupError.response?.data?.error || 'Failed to load group'}</div>
    </div>
  );

  // Loading state: skeleton while waiting for the API response
  if (groupLoading) return (
    <div>
      <div className="skeleton-card" style={{ height: 120 }}>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 24 }} />
        <div className="skeleton skeleton-text" style={{ marginTop: 16 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Group header card ──────────────────────────────────────────── */}
      <div className="card">
        {editing ? (
          /* Inline edit form — replaces the header when editing is true */
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="ge-name">{t('name')}</label>
              <input id="ge-name" className="form-input" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="ge-desc">{t('groupDescription')}</label>
              <textarea id="ge-desc" className="form-input" value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-small" type="submit">{t('save')}</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditing(false)}>{t('cancel')}</button>
            </div>
          </form>
        ) : (
          /* Normal view: group name, badges, admin/member action buttons */
          <>
            <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="flex items-center gap-3">
                <h1 className="page-title" style={{ marginBottom: 0 }}>{group.name}</h1>
                {/* Lock badge for private groups */}
                {group.isPrivate && (
                  <span className="private-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    {t('private')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <button className="btn btn-small btn-secondary" onClick={() => setEditing(true)} aria-label="Edit group">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('edit')}
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn-small btn-danger" onClick={handleDelete} disabled={actionLoading}>
                    {actionLoading ? <><span className="btn-spinner" /> {t('deleting')}</> : t('delete')}
                  </button>
                )}
                {isMember && !isAdmin && (
                  <button className="btn btn-small btn-outline" onClick={handleLeave} disabled={actionLoading}>
                    {actionLoading ? <><span className="btn-spinner" /> {t('leaving')}</> : t('leave')}
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{group.description}</p>
            {/* Metadata chips: subject, year, semester, privacy */}
            <div className="group-card-meta" style={{ marginTop: 'var(--space-3)' }}>
              {group.subject && <span>{group.subject}</span>}
              <span>{t('year')} {group.year}</span>
              <span>{t('semester')} {group.semester}</span>
              <span>{group.isPrivate ? t('private') : t('public')}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Pending join requests (admin only) ────────────────────────── */}
      {/* Only rendered when the admin has pending requests to review */}
      {isAdmin && group.pendingRequests?.length > 0 && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
            {t('pendingRequests')}
            <span className="section-count" style={{ marginLeft: 'var(--space-2)' }}>{group.pendingRequests.length}</span>
          </h2>
          {group.pendingRequests.map(u => (
            <div key={u._id} className="flex-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <div className="avatar avatar-sm">{u.name?.charAt(0) || '?'}</div>
                <span style={{ fontSize: 'var(--text-sm)' }}>{u.name} <span style={{ color: 'var(--text-tertiary)' }}>({u.email})</span></span>
              </div>
              {/* Approve button — shows spinner while the request is being processed */}
              <button className="btn btn-primary btn-small" onClick={() => handleApprove(u._id)} disabled={approveLoading === u._id}>
                {approveLoading === u._id ? <><span className="btn-spinner" /> {t('approving')}</> : t('approve')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Member list ────────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
          {t('members')} <span className="section-count">{group.members?.length}</span>
        </h2>
        {/* Each member is a chip that links to their profile */}
        <div className="flex gap-2 flex-wrap">
          {group.members?.map(m => (
            <Link key={m._id} to={`/profile/${m._id}`} className="member-chip">
              <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                {m.name?.charAt(0) || '?'}
              </div>
              {m.name}
              {/* "(admin)" label next to the group admin's name */}
              {m._id === group.admin?._id && <span style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)' }}>({t('admin')})</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Tabs: Posts / Resources ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--border)', marginBottom: 'var(--space-4)' }}>
        {['posts', 'resources'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2, transition: 'color 0.15s',
            }}
          >
            {tab === 'posts' ? t('posts') : t('resourcesTab')}
            {tab === 'resources' && posts.filter(p => p.mediaUrl).length > 0 && (
              <span className="section-count" style={{ marginLeft: 6 }}>
                {posts.filter(p => p.mediaUrl).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Posts tab ───────────────────────────────────────────────────── */}
      {activeTab === 'posts' && (
        <>
          {isMember && <PostForm groupId={id} onCreated={() => invalidate(id)} />}
          {posts.length === 0 && isMember && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">{t('noGroupPosts')}</div>
            </div>
          )}
          {posts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user._id}
              onUpdate={() => invalidate(id)} onDelete={() => invalidate(id)} />
          ))}
        </>
      )}

      {/* ── Resources tab ───────────────────────────────────────────────── */}
      {activeTab === 'resources' && (() => {
        const resources = posts.filter(p => p.mediaUrl);
        if (resources.length === 0) return (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
            </svg>
            <div className="empty-state-text" style={{ marginTop: 'var(--space-3)' }}>{t('noResourcesYet')}</div>
          </div>
        );
        return (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {resources.map((post, i) => (
              <a
                key={post._id}
                href={post.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-5)',
                  borderBottom: i < resources.length - 1 ? '1px solid var(--border-light)' : 'none',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
                  {post.mediaType === 'image'
                    ? <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>
                    : post.mediaType === 'video'
                    ? <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>
                    : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>
                  }
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.mediaOriginalName || post.mediaUrl.split('/').pop()}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {post.author?.name} · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              </a>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default GroupDetailPage;
