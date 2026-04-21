import React, { useState } from 'react';
import API from '../../api/axios';

function PostForm({ groupId, onCreated }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('question');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/posts', {
        content,
        type,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        group: groupId || undefined
      });
      setContent('');
      setTags('');
      setMediaUrl('');
      setMediaType('');
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <textarea className="form-input" placeholder="What's on your mind?"
          value={content} onChange={e => setContent(e.target.value)} required />
        <div className="flex gap-8 mt-10" style={{ flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 'auto' }}
            value={type} onChange={e => setType(e.target.value)}>
            <option value="question">Question</option>
            <option value="material">Material</option>
            <option value="announcement">Announcement</option>
          </select>
          <input className="form-input" style={{ flex: 1 }} placeholder="Tags (comma separated)"
            value={tags} onChange={e => setTags(e.target.value)} />
        </div>
        <div className="flex gap-8 mt-10">
          <input className="form-input" style={{ flex: 1 }} placeholder="Media URL (optional)"
            value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
          <select className="form-input" style={{ width: 'auto' }}
            value={mediaType} onChange={e => setMediaType(e.target.value)}>
            <option value="">No media</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary mt-10" type="submit">Post</button>
      </form>
    </div>
  );
}

export default PostForm;
