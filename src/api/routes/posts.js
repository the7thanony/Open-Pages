import { Router } from 'express';
import Post from '../models/post.js';
import { requireAuth, requireOwner, attachUser } from '../middleware/auth.js';
import { validatePost } from '../middleware/validate.js';

const router = Router();

// Attach user info to all requests
router.use(attachUser);

/**
 * GET /posts
 * List posts with pagination and search.
 * Query params: page, limit, q (search), status
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const search = req.query.q || '';
    const status = req.query.status || 'published';

    const [posts, total] = await Promise.all([
      Post.findAll({ page, limit, search, status, userId: req.userId }),
      Post.count({ search, status, userId: req.userId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /posts/:id
 * Get a single post by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Don't show drafts to non-owners
    if (post.status === 'draft' && post.user_id !== req.userId) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /posts
 * Create a new post. Requires authentication.
 */
router.post('/', requireAuth, validatePost, async (req, res, next) => {
  try {
    const post = await Post.create({
      userId: req.session.userId,
      title: req.body.title,
      content: req.body.content,
      status: req.body.status || 'published',
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /posts/:id
 * Update a post. Requires authentication and ownership.
 */
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    // Attach resource for ownership check
    req.resource = post;
    requireOwner(req, res, async () => {
      try {
        const updated = await Post.update(id, {
          title: req.body.title,
          content: req.body.content,
          status: req.body.status,
        });
        res.json(updated);
      } catch (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /posts/:id
 * Delete a post. Requires authentication and ownership.
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID.' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    req.resource = post;
    requireOwner(req, res, async () => {
      try {
        await Post.remove(id);
        res.json({ message: 'Post deleted successfully.' });
      } catch (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
