import { Router } from 'express';
import Post from '../../api/models/post.js';

const router = Router();

/**
 * GET /
 * Home page — paginated list of published posts.
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 9;
    const search = req.query.q || '';

    const [posts, total] = await Promise.all([
      Post.findAll({ page, limit, search, userId: res.locals.currentUser?.id }),
      Post.count({ search }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('index', {
      title: 'Open Pages — Discover Stories',
      posts,
      pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      search,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /search
 * Search results page.
 */
router.get('/search', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 9;
    const search = req.query.q || '';

    const [posts, total] = await Promise.all([
      Post.findAll({ page, limit, search }),
      Post.count({ search }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('search', {
      title: `Search: "${search}" — Open Pages`,
      posts,
      pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      search,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /post/:id
 * Single post view.
 */
router.get('/post/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).render('error', { title: 'Bad Request', statusCode: 400, message: 'Invalid post ID.' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'This post doesn\'t exist.' });

    // Don't show drafts to non-owners
    if (post.status === 'draft' && post.user_id !== res.locals.currentUser?.id) {
      return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'This post doesn\'t exist.' });
    }

    res.render('post', { title: `${post.title} — Open Pages`, post });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /new
 * New post form (requires auth).
 */
router.get('/new', (req, res) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in to create a post.');
    return res.redirect('/login');
  }
  res.render('modify', { title: 'New Post — Open Pages', heading: 'New Post', submit: 'Publish Post', post: null });
});

/**
 * POST /new
 * Create a new post (form submission).
 */
router.post('/new', async (req, res, next) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in to create a post.');
    return res.redirect('/login');
  }
  try {
    const { title, content, status } = req.body;

    // Validate
    const errors = [];
    if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters.');
    if (!content || content.trim().length < 10) errors.push('Content must be at least 10 characters.');

    if (errors.length) {
      req.flash('error', errors.join(' '));
      return res.render('modify', {
        title: 'New Post — Open Pages',
        heading: 'New Post',
        submit: 'Publish Post',
        post: { title, content, status },
      });
    }

    await Post.create({
      userId: res.locals.currentUser.id,
      title: title.trim(),
      content: content.trim(),
      status: status || 'published',
    });

    req.flash('success', 'Post created successfully!');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /edit/:id
 * Edit post form.
 */
router.get('/edit/:id', async (req, res, next) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in to edit posts.');
    return res.redirect('/login');
  }
  try {
    const post = await Post.findById(parseInt(req.params.id, 10));
    if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Post not found.' });

    if (post.user_id !== res.locals.currentUser.id) {
      req.flash('error', 'You can only edit your own posts.');
      return res.redirect('/');
    }

    res.render('modify', { title: 'Edit Post — Open Pages', heading: 'Edit Post', submit: 'Update Post', post });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /edit/:id
 * Update a post (form submission).
 */
router.post('/edit/:id', async (req, res, next) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in.');
    return res.redirect('/login');
  }
  try {
    const id = parseInt(req.params.id, 10);
    const post = await Post.findById(id);
    if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Post not found.' });

    if (post.user_id !== res.locals.currentUser.id) {
      req.flash('error', 'You can only edit your own posts.');
      return res.redirect('/');
    }

    const { title, content, status } = req.body;

    // Validate
    const errors = [];
    if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters.');
    if (!content || content.trim().length < 10) errors.push('Content must be at least 10 characters.');

    if (errors.length) {
      req.flash('error', errors.join(' '));
      return res.render('modify', {
        title: 'Edit Post — Open Pages',
        heading: 'Edit Post',
        submit: 'Update Post',
        post: { ...post, title, content, status },
      });
    }

    await Post.update(id, { title: title.trim(), content: content.trim(), status: status || post.status });

    req.flash('success', 'Post updated successfully!');
    res.redirect(`/post/${id}`);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /delete/:id
 * Delete a post.
 */
router.post('/delete/:id', async (req, res, next) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in.');
    return res.redirect('/login');
  }
  try {
    const id = parseInt(req.params.id, 10);
    const post = await Post.findById(id);
    if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Post not found.' });

    if (post.user_id !== res.locals.currentUser.id) {
      req.flash('error', 'You can only delete your own posts.');
      return res.redirect('/');
    }

    await Post.remove(id);
    req.flash('success', 'Post deleted.');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /my-posts
 * Current user's posts (all statuses).
 */
router.get('/my-posts', async (req, res, next) => {
  if (!res.locals.currentUser) {
    req.flash('error', 'Please log in to view your posts.');
    return res.redirect('/login');
  }
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 9;
    const statusFilter = req.query.status || 'all';

    const [posts, total] = await Promise.all([
      Post.findByUserId(res.locals.currentUser.id, { page, limit, status: statusFilter }),
      Post.countByUserId(res.locals.currentUser.id, statusFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('my-posts', {
      title: 'My Posts — Open Pages',
      posts,
      pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      statusFilter,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
