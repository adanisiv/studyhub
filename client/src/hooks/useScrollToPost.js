import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// When the URL contains ?post=<id> (set by clicking a notification),
// scroll to that post's card and flash a highlight so the user sees
// exactly which post the notification was about.
//
// Posts load asynchronously, so we poll briefly for the element to appear
// instead of assuming it exists on first render.
export function useScrollToPost(postsLoaded) {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('post');
    if (!postId || !postsLoaded) return;

    let attempts = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(`post-${postId}`);
      attempts++;
      if (el) {
        clearInterval(timer);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('post-highlight');
        setTimeout(() => el.classList.remove('post-highlight'), 2500);
      } else if (attempts > 20) {
        clearInterval(timer); // post not on this page (old/paginated) — give up quietly
      }
    }, 150);

    return () => clearInterval(timer);
  }, [location.search, postsLoaded]);
}
