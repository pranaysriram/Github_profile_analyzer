const express = require('express');
const pool = require('../db');
const { fetchUser, fetchAllRepos, summarizeRepos } = require('../github');

const router = express.Router();

/**
 * POST /api/profiles/analyze
 * body: { username: string }
 * Fetches the GitHub profile, computes insights, upserts into MySQL.
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { username } = req.body || {};
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }

    const user = await fetchUser(username);
    const repos = await fetchAllRepos(user.login);
    const insights = summarizeRepos(repos);

    const row = {
      github_id: user.id,
      username: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      email: user.email,
      twitter_username: user.twitter_username,
      public_repos: user.public_repos,
      public_gists: user.public_gists,
      followers: user.followers,
      following: user.following,
      total_stars: insights.totalStars,
      total_forks: insights.totalForks,
      top_language: insights.topLanguage,
      languages_json: JSON.stringify(insights.languages),
      top_repos_json: JSON.stringify(insights.topRepos),
      account_created_at: user.created_at ? new Date(user.created_at) : null,
      account_updated_at: user.updated_at ? new Date(user.updated_at) : null,
    };

    const cols = Object.keys(row);
    const placeholders = cols.map(() => '?').join(', ');
    const updates = cols
      .filter(c => c !== 'github_id' && c !== 'username')
      .map(c => `${c} = VALUES(${c})`)
      .join(', ');

    const sql = `
      INSERT INTO profiles (${cols.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updates}, analyzed_at = CURRENT_TIMESTAMP
    `;

    await pool.execute(sql, cols.map(c => row[c]));

    const [rows] = await pool.execute(
      'SELECT * FROM profiles WHERE username = ?',
      [user.login],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    if (err.response?.status === 403) {
      return res.status(429).json({
        error: 'GitHub API rate limit reached. Set GITHUB_TOKEN to increase limits.',
      });
    }
    next(err);
  }
});

/**
 * GET /api/profiles
 * Returns the list of analyzed profiles (summary fields).
 */
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, github_id, username, name, avatar_url, public_repos,
              followers, following, total_stars, top_language, analyzed_at
       FROM profiles
       ORDER BY analyzed_at DESC`,
    );
    res.json({ count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profiles/:username
 * Returns the full stored analysis for a single profile.
 */
router.get('/:username', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM profiles WHERE username = ?',
      [req.params.username],
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/profiles/:username
 */
router.delete('/:username', async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM profiles WHERE username = ?',
      [req.params.username],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Profile not found' });
    res.json({ deleted: true, username: req.params.username });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
