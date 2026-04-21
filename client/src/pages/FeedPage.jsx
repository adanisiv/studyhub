import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';

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
      <h1 className="page-title">My Feed</h1>
      <PostForm onCreated={loadFeed} />
      {loading ? (
        <p className="text-muted text-center mt-20">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-muted text-center mt-20">No posts yet. Join some groups!</p>
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
