/**
 * Repository SQLite pour AMBILATRES.
 * Utilise db.js (dbGet, dbAll, dbRun). Même interface que repository-firebase.js.
 */
const { dbGet, dbAll, dbRun } = require('./db');

function formatArticleRow(row) {
    if (!row) return null;
    return {
        ...row,
        featured: Boolean(row.featured),
        published: Boolean(row.published),
        on_homepage: Boolean(row.on_homepage),
        live: Boolean(row.live)
    };
}

// --- Users ---
async function getUserByUsername(username) {
    return dbGet('SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE username = ?', [username]);
}

async function getUserById(id) {
    return dbGet('SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE id = ?', [id]);
}

async function getUsers() {
    return dbAll('SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
}

async function createUser({ username, email, password, role }) {
    const r = await dbRun(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role || 'editor']
    );
    return dbGet('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [r.id]);
}

async function updateUser(id, updates) {
    const { email, password, role } = updates;
    const set = [];
    const params = [];
    if (email !== undefined) { set.push('email = ?'); params.push(email); }
    if (password !== undefined) { set.push('password = ?'); params.push(password); }
    if (role !== undefined) { set.push('role = ?'); params.push(role); }
    if (set.length === 0) return getUserById(id).then(u => { if (u) delete u.password; return u; });
    set.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    await dbRun(`UPDATE users SET ${set.join(', ')} WHERE id = ?`, params);
    return dbGet('SELECT id, username, email, role, updated_at FROM users WHERE id = ?', [id]).then(u => { if (u) delete u.password; return u; });
}

async function deleteUser(id) {
    const r = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    return r.changes > 0;
}

async function findUserByUsernameOrEmail(username, email) {
    return dbGet('SELECT id, username, email, password, role, created_at, updated_at FROM users WHERE username = ? OR email = ?', [username, email]);
}

async function findUserByEmailExcludingId(email, excludeId) {
    return dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, excludeId]);
}

// --- Articles ---
async function getArticles(filters = {}) {
    let query = 'SELECT * FROM articles WHERE 1=1';
    const params = [];
    if (filters.category) { query += ' AND category = ?'; params.push(filters.category); }
    if (filters.featured !== undefined) { query += ' AND featured = ?'; params.push(filters.featured ? 1 : 0); }
    if (filters.published !== undefined) { query += ' AND published = ?'; params.push(filters.published ? 1 : 0); }
    query += ' ORDER BY created_at DESC';
    if (filters.limit) { query += ' LIMIT ?'; params.push(parseInt(filters.limit, 10)); }
    const rows = await dbAll(query, params);
    return rows.map(formatArticleRow);
}

async function getArticleById(id) {
    const row = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    return formatArticleRow(row);
}

async function getArticleBySlug(slug) {
    const row = await dbGet('SELECT * FROM articles WHERE slug = ?', [slug]);
    return formatArticleRow(row);
}

async function getArticleByIdOrSlug(identifier) {
    const isNumeric = /^\d+$/.test(identifier);
    return isNumeric ? getArticleById(identifier) : getArticleBySlug(identifier);
}

async function articleExistsBySlug(slug, excludeId = null) {
    const row = excludeId
        ? await dbGet('SELECT id FROM articles WHERE slug = ? AND id != ?', [slug, excludeId])
        : await dbGet('SELECT id FROM articles WHERE slug = ?', [slug]);
    return !!row;
}

async function createArticle(data) {
    const r = await dbRun(
        `INSERT INTO articles (title, slug, category, subcategory, author, content, excerpt, image_url,
         featured, published, on_homepage, live, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.title,
            data.slug,
            data.category,
            data.subcategory || null,
            data.author,
            data.content,
            data.excerpt || null,
            data.image_url || null,
            data.featured ? 1 : 0,
            data.published ? 1 : 0,
            data.on_homepage ? 1 : 0,
            data.live ? 1 : 0,
            data.created_by
        ]
    );
    return getArticleById(r.id);
}

async function updateArticle(id, data) {
    const article = await getArticleById(id);
    if (!article) return null;
    await dbRun(
        `UPDATE articles SET
         title = COALESCE(?, title), slug = ?, category = COALESCE(?, category), subcategory = ?,
         author = COALESCE(?, author), content = COALESCE(?, content), excerpt = ?, image_url = ?,
         featured = ?, published = ?, on_homepage = ?, live = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
            data.title !== undefined ? data.title : article.title,
            data.slug !== undefined ? data.slug : article.slug,
            data.category !== undefined ? data.category : article.category,
            data.subcategory !== undefined ? data.subcategory : article.subcategory,
            data.author !== undefined ? data.author : article.author,
            data.content !== undefined ? data.content : article.content,
            data.excerpt !== undefined ? data.excerpt : article.excerpt,
            data.image_url !== undefined ? data.image_url : article.image_url,
            data.featured !== undefined ? (data.featured ? 1 : 0) : (article.featured ? 1 : 0),
            data.published !== undefined ? (data.published ? 1 : 0) : (article.published ? 1 : 0),
            data.on_homepage !== undefined ? (data.on_homepage ? 1 : 0) : (article.on_homepage ? 1 : 0),
            data.live !== undefined ? (data.live ? 1 : 0) : (article.live ? 1 : 0),
            id
        ]
    );
    return getArticleById(id);
}

async function deleteArticle(id) {
    await dbRun('DELETE FROM homepage_config WHERE article_id = ?', [id]);
    const r = await dbRun('DELETE FROM articles WHERE id = ?', [id]);
    return r.changes > 0;
}

async function getArticleIdExists(articleId) {
    const row = await dbGet('SELECT id FROM articles WHERE id = ?', [articleId]);
    return !!row;
}

// --- Homepage ---
async function getFeaturedArticle() {
    const row = await dbGet(
        `SELECT a.* FROM articles a
         INNER JOIN homepage_config hc ON a.id = hc.article_id
         WHERE hc.section = 'featured' AND hc.enabled = 1 AND a.published = 1
         ORDER BY hc.position ASC, a.created_at DESC LIMIT 1`
    );
    return row ? formatArticleRow(row) : null;
}

async function getLiveArticles(limit = 5) {
    const rows = await dbAll(
        `SELECT * FROM articles WHERE live = 1 AND published = 1 ORDER BY created_at DESC LIMIT ?`,
        [limit]
    );
    return rows.map(formatArticleRow);
}

async function getSpotlightArticles(limit = 5) {
    const rows = await dbAll(
        `SELECT a.* FROM articles a
         INNER JOIN homepage_config hc ON a.id = hc.article_id
         WHERE hc.section = 'spotlight' AND hc.enabled = 1 AND a.published = 1
         ORDER BY hc.position ASC, a.created_at DESC LIMIT ?`,
        [limit]
    );
    return rows.map(formatArticleRow);
}

async function getLatestArticles(limit = 10) {
    const rows = await dbAll(
        `SELECT * FROM articles WHERE published = 1 AND on_homepage = 1 ORDER BY created_at DESC LIMIT ?`,
        [limit]
    );
    return rows.map(formatArticleRow);
}

async function getHomepageConfig() {
    return dbAll('SELECT * FROM homepage_config ORDER BY section, position ASC');
}

async function setFeatured(articleId) {
    await dbRun('DELETE FROM homepage_config WHERE section = ?', ['featured']);
    await dbRun(
        'INSERT INTO homepage_config (section, article_id, position, enabled) VALUES (?, ?, ?, ?)',
        ['featured', parseInt(articleId, 10), 1, 1]
    );
}

async function addSpotlight(articleId, position) {
    const aid = parseInt(articleId, 10);
    const existing = await dbGet('SELECT id FROM homepage_config WHERE section = ? AND article_id = ?', ['spotlight', aid]);
    if (existing) return false;
    let pos = position;
    if (pos == null) {
        const max = await dbGet('SELECT MAX(position) as max FROM homepage_config WHERE section = ?', ['spotlight']);
        pos = (max && max.max != null ? max.max : 0) + 1;
    }
    await dbRun(
        'INSERT INTO homepage_config (section, article_id, position, enabled) VALUES (?, ?, ?, ?)',
        ['spotlight', aid, pos, 1]
    );
    return true;
}

async function removeSpotlight(articleId) {
    await dbRun('DELETE FROM homepage_config WHERE section = ? AND article_id = ?', ['spotlight', parseInt(articleId, 10)]);
}

async function setArticleOnHomepage(articleId, onHomepage) {
    await dbRun('UPDATE articles SET on_homepage = ? WHERE id = ?', [onHomepage ? 1 : 0, articleId]);
}

async function updateSpotlightOrder(orders) {
    for (const { article_id, position } of orders) {
        await dbRun(
            'UPDATE homepage_config SET position = ? WHERE section = ? AND article_id = ?',
            [position, 'spotlight', article_id]
        );
    }
}

async function ensureSuperAdmin() {
    // Déjà géré dans db.js à l'init SQLite
    return Promise.resolve();
}

module.exports = {
    getUserByUsername,
    getUserById,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    findUserByUsernameOrEmail,
    findUserByEmailExcludingId,
    getArticles,
    getArticleById,
    getArticleBySlug,
    getArticleByIdOrSlug,
    articleExistsBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    getArticleIdExists,
    getFeaturedArticle,
    getLiveArticles,
    getSpotlightArticles,
    getLatestArticles,
    getHomepageConfig,
    setFeatured,
    addSpotlight,
    removeSpotlight,
    setArticleOnHomepage,
    updateSpotlightOrder,
    ensureSuperAdmin,
    formatArticleRow
};
