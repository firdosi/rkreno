import manifest from '../../config/blog-post-index.json';

export const blogPosts = manifest.posts;
export const BLOG_POST_ROUTES = manifest.posts.map((post) => post.route);
