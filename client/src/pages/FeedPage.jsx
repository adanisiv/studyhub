import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';

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

function FeedPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const res = await API.get('/posts/feed');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  return (
    <div>
      <h1 className="page-title">Feed</h1>
      <PostForm onCreated={loadFeed} />

      {loading ? (
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
          <div className="empty-state-title">No posts yet</div>
          <div className="empty-state-text">Join some groups to see posts in your feed, or create the first post!</div>
          <Link to="/groups" className="btn btn-primary btn-small">Browse Groups</Link>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} currentUserId={user._id}
            onUpdate={loadFeed} onDelete={loadFeed} />
        ))
      )}
    </div>
  );
}

export default FeedPage;
