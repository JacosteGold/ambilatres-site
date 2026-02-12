/**
 * Repository Firestore pour AMBILATRES.
 * Expose la même interface que repository-sqlite pour pouvoir basculer via USE_FIREBASE.
 */
const { getDb } = require('./firebase-config');

const USERS = 'users';
const ARTICLES = 'articles';
const HOMEPAGE_CONFIG = 'homepage_config';
const COUNTERS = 'counters';

async function getNextId(collectionName) {
    const db = getDb();
    const ref = db.collection(COUNTERS).doc(collectionName);
    const result = await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const next = (doc.exists && doc.data().value) ? doc.data().value + 1 : 1;
        t.set(ref, { value: next });
        return next;
    });
    return result;
}

function docToUser(doc) {
    if (!doc || !doc.exists) return null;
    const d = doc.data();
    return {
        id: d.id,
        username: d.username,
        email: d.email,
        password: d.password,
        role: d.role,
        created_at: d.created_at,
        updated_at: d.updated_at
    };
}

function docToArticle(doc) {
    if (!doc || !doc.exists) return null;
    const d = doc.data();
    return {
        id: d.id,
        title: d.title,
        slug: d.slug,
        category: d.category,
        subcategory: d.subcategory,
        author: d.author,
        content: d.content,
        excerpt: d.excerpt,
        image_url: d.image_url,
        featured: d.featured === true,
        published: d.published === true,
        on_homepage: d.on_homepage === true,
        homepage_position: d.homepage_position,
        live: d.live === true,
        created_by: d.created_by,
        created_at: d.created_at,
        updated_at: d.updated_at
    };
}

function formatArticleRow(row) {
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
    const db = getDb();
    const snap = await db.collection(USERS).where('username', '==', username).limit(1).get();
    if (snap.empty) return null;
    return docToUser(snap.docs[0]);
}

async function getUserById(id) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(USERS).where('id', '==', numId).limit(1).get();
    if (snap.empty) return null;
    return docToUser(snap.docs[0]);
}

async function getUsers() {
    const db = getDb();
    const snap = await db.collection(USERS).orderBy('created_at', 'desc').get();
    return snap.docs.map(d => {
        const u = docToUser(d);
        if (u) delete u.password;
        return u;
    });
}

async function createUser({ username, email, password, role }) {
    const id = await getNextId(USERS);
    const now = new Date().toISOString();
    const db = getDb();
    await db.collection(USERS).add({
        id,
        username,
        email,
        password,
        role: role || 'editor',
        created_at: now,
        updated_at: now
    });
    return { id, username, email, role, created_at: now, updated_at: now };
}

async function updateUser(id, { email, password, role }) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(USERS).where('id', '==', numId).limit(1).get();
    if (snap.empty) return null;
    const ref = snap.docs[0].ref;
    const updates = { updated_at: new Date().toISOString() };
    if (email !== undefined) updates.email = email;
    if (password !== undefined) updates.password = password;
    if (role !== undefined) updates.role = role;
    await ref.update(updates);
    return getUserById(id).then(u => {
        if (u) delete u.password;
        return u;
    });
}

async function deleteUser(id) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(USERS).where('id', '==', numId).limit(1).get();
    if (snap.empty) return false;
    await snap.docs[0].ref.delete();
    return true;
}

async function findUserByUsernameOrEmail(username, email) {
    const db = getDb();
    const byUsername = await db.collection(USERS).where('username', '==', username).limit(1).get();
    if (!byUsername.empty) return docToUser(byUsername.docs[0]);
    const byEmail = await db.collection(USERS).where('email', '==', email).limit(1).get();
    if (!byEmail.empty) return docToUser(byEmail.docs[0]);
    return null;
}

async function findUserByEmailExcludingId(email, excludeId) {
    const db = getDb();
    const snap = await db.collection(USERS).where('email', '==', email).get();
    for (const doc of snap.docs) {
        const u = doc.data();
        if (u.id !== parseInt(excludeId, 10)) return docToUser(doc);
    }
    return null;
}

// --- Articles ---
async function getArticles(filters = {}) {
    const db = getDb();
    // Une seule clause where + orderBy pour éviter trop d'index composites ; le reste en mémoire
    let q = db.collection(ARTICLES).orderBy('created_at', 'desc');
    const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
    q = q.limit(Math.min(limit, 500));
    const snap = await q.get();
    let list = snap.docs.map(d => formatArticleRow(docToArticle(d)));
    if (filters.category) list = list.filter(a => a.category === filters.category);
    if (filters.featured !== undefined) list = list.filter(a => !!a.featured === !!filters.featured);
    if (filters.published !== undefined) list = list.filter(a => !!a.published === !!filters.published);
    if (filters.limit) list = list.slice(0, parseInt(filters.limit, 10));
    return list;
}

async function getArticleById(id) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(ARTICLES).where('id', '==', numId).limit(1).get();
    if (snap.empty) return null;
    return formatArticleRow(docToArticle(snap.docs[0]));
}

async function getArticleBySlug(slug) {
    const db = getDb();
    const snap = await db.collection(ARTICLES).where('slug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    return formatArticleRow(docToArticle(snap.docs[0]));
}

async function getArticleByIdOrSlug(identifier) {
    const isNumeric = /^\d+$/.test(identifier);
    return isNumeric ? getArticleById(identifier) : getArticleBySlug(identifier);
}

async function articleExistsBySlug(slug, excludeId = null) {
    const db = getDb();
    let q = db.collection(ARTICLES).where('slug', '==', slug);
    const snap = await q.get();
    if (snap.empty) return false;
    if (!excludeId) return true;
    const numId = parseInt(excludeId, 10);
    return snap.docs.some(d => d.data().id !== numId);
}

async function createArticle(data) {
    const id = await getNextId(ARTICLES);
    const now = new Date().toISOString();
    const doc = {
        id,
        title: data.title,
        slug: data.slug,
        category: data.category,
        subcategory: data.subcategory || null,
        author: data.author,
        content: data.content,
        excerpt: data.excerpt || null,
        image_url: data.image_url || null,
        featured: !!data.featured,
        published: !!data.published,
        on_homepage: !!data.on_homepage,
        homepage_position: data.homepage_position || null,
        live: !!data.live,
        created_by: data.created_by,
        created_at: now,
        updated_at: now
    };
    const db = getDb();
    await db.collection(ARTICLES).add(doc);
    return formatArticleRow(doc);
}

async function updateArticle(id, data) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(ARTICLES).where('id', '==', numId).limit(1).get();
    if (snap.empty) return null;
    const ref = snap.docs[0].ref;
    const updates = {
        ...data,
        updated_at: new Date().toISOString()
    };
    if (data.featured !== undefined) updates.featured = !!data.featured;
    if (data.published !== undefined) updates.published = !!data.published;
    if (data.on_homepage !== undefined) updates.on_homepage = !!data.on_homepage;
    if (data.live !== undefined) updates.live = !!data.live;
    await ref.update(updates);
    return getArticleById(id);
}

async function deleteArticle(id) {
    const db = getDb();
    const numId = parseInt(id, 10);
    const snap = await db.collection(ARTICLES).where('id', '==', numId).limit(1).get();
    if (snap.empty) return false;
    await snap.docs[0].ref.delete();
    const configSnap = await db.collection(HOMEPAGE_CONFIG).where('article_id', '==', numId).get();
    const batch = db.batch();
    configSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
}

async function getArticleIdExists(articleId) {
    const a = await getArticleById(articleId);
    return !!a;
}

// --- Homepage ---
async function getFeaturedArticle() {
    const db = getDb();
    const snap = await db.collection(HOMEPAGE_CONFIG)
        .where('section', '==', 'featured')
        .where('enabled', '==', true)
        .orderBy('position')
        .limit(1)
        .get();
    if (snap.empty) return null;
    const aid = snap.docs[0].data().article_id;
    const article = await getArticleById(aid);
    return article && article.published ? article : null;
}

async function getLiveArticles(limit = 5) {
    const db = getDb();
    const snap = await db.collection(ARTICLES)
        .where('live', '==', true)
        .where('published', '==', true)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
    return snap.docs.map(d => formatArticleRow(docToArticle(d)));
}

async function getSpotlightArticles(limit = 5) {
    const db = getDb();
    const snap = await db.collection(HOMEPAGE_CONFIG)
        .where('section', '==', 'spotlight')
        .where('enabled', '==', true)
        .orderBy('position')
        .limit(limit)
        .get();
    const articles = [];
    for (const d of snap.docs) {
        const a = await getArticleById(d.data().article_id);
        if (a && a.published) articles.push(a);
    }
    return articles;
}

async function getLatestArticles(limit = 10) {
    const db = getDb();
    const snap = await db.collection(ARTICLES)
        .where('published', '==', true)
        .where('on_homepage', '==', true)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
    return snap.docs.map(d => formatArticleRow(docToArticle(d)));
}

async function getHomepageConfig() {
    const db = getDb();
    const snap = await db.collection(HOMEPAGE_CONFIG).orderBy('section').orderBy('position').get();
    return snap.docs.map(d => {
        const x = d.data();
        return {
            id: d.id,
            section: x.section,
            article_id: x.article_id,
            position: x.position,
            enabled: x.enabled,
            updated_at: x.updated_at
        };
    });
}

async function setFeatured(articleId) {
    const db = getDb();
    const aid = parseInt(articleId, 10);
    const batch = db.batch();
    const old = await db.collection(HOMEPAGE_CONFIG).where('section', '==', 'featured').get();
    old.docs.forEach(d => batch.delete(d.ref));
    const ref = db.collection(HOMEPAGE_CONFIG).doc();
    batch.set(ref, { section: 'featured', article_id: aid, position: 1, enabled: true, updated_at: new Date().toISOString() });
    await batch.commit();
}

async function addSpotlight(articleId, position) {
    const db = getDb();
    const aid = parseInt(articleId, 10);
    const existing = await db.collection(HOMEPAGE_CONFIG)
        .where('section', '==', 'spotlight')
        .where('article_id', '==', aid)
        .limit(1)
        .get();
    if (!existing.empty) return false;
    let pos = position;
    if (pos == null) {
        const maxSnap = await db.collection(HOMEPAGE_CONFIG).where('section', '==', 'spotlight').orderBy('position', 'desc').limit(1).get();
        pos = maxSnap.empty ? 1 : (maxSnap.docs[0].data().position || 0) + 1;
    }
    await db.collection(HOMEPAGE_CONFIG).add({
        section: 'spotlight',
        article_id: aid,
        position: pos,
        enabled: true,
        updated_at: new Date().toISOString()
    });
    return true;
}

async function removeSpotlight(articleId) {
    const db = getDb();
    const aid = parseInt(articleId, 10);
    const snap = await db.collection(HOMEPAGE_CONFIG)
        .where('section', '==', 'spotlight')
        .where('article_id', '==', aid)
        .get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
}

async function setArticleOnHomepage(articleId, onHomepage) {
    const db = getDb();
    const numId = parseInt(articleId, 10);
    const snap = await db.collection(ARTICLES).where('id', '==', numId).limit(1).get();
    if (snap.empty) return;
    await snap.docs[0].ref.update({ on_homepage: !!onHomepage, updated_at: new Date().toISOString() });
}

async function updateSpotlightOrder(orders) {
    const db = getDb();
    for (const { article_id, position } of orders) {
        const aid = parseInt(article_id, 10);
        const snap = await db.collection(HOMEPAGE_CONFIG)
            .where('section', '==', 'spotlight')
            .where('article_id', '==', aid)
            .limit(1)
            .get();
        if (!snap.empty) {
            await snap.docs[0].ref.update({ position, updated_at: new Date().toISOString() });
        }
    }
}

// Créer le superadmin par défaut si aucun
async function ensureSuperAdmin() {
    const bcrypt = require('bcryptjs');
    const db = getDb();
    const snap = await db.collection(USERS).where('role', '==', 'superadmin').limit(1).get();
    if (!snap.empty) return;
    const id = await getNextId(USERS);
    const now = new Date().toISOString();
    const password = bcrypt.hashSync('admin123', 10);
    await db.collection(USERS).add({
        id,
        username: 'admin',
        email: 'admin@ambilatres.com',
        password,
        role: 'superadmin',
        created_at: now,
        updated_at: now
    });
    console.log('✅ Superadmin créé par défaut (username: admin, password: admin123)');
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
