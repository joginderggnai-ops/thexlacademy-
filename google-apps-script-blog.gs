/**
 * The XL Academy — Blog API (Google Sheet backed)
 * Powers the public blog (blog.html, blog-post.html) and the admin
 * panel (blog-admin.html). Posts are stored in a Google Sheet.
 *
 * ─── SETUP (one time) ───────────────────────────────────────────────
 * 1. Create a new Google Sheet (any blank sheet). Copy its ID from the
 *    URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
 * 2. Paste that ID into SHEET_ID below.
 * 3. Set ADMIN_PASSWORD to a strong password (this logs into the panel).
 * 4. Extensions ▸ Apps Script (from that sheet) — or script.google.com
 *    ▸ New project — paste EVERYTHING from this file, Save.
 * 5. Deploy ▸ New deployment ▸ (gear) Web app.
 *      - Execute as:     Me
 *      - Who has access: Anyone
 *    Deploy, authorise, and COPY the Web app URL (ends in /exec).
 * 6. Paste that URL into BLOG_ENDPOINT in blog.html, blog-post.html,
 *    and blog-admin.html.
 *
 * The "Posts" tab and its header row are created automatically on first use.
 * ────────────────────────────────────────────────────────────────────
 */

var SHEET_ID       = 'PASTE_YOUR_BLOG_SHEET_ID_HERE';
var SHEET_NAME     = 'Posts';
var ADMIN_PASSWORD = 'CHANGE_ME_TO_A_STRONG_PASSWORD';

var HEADERS = ['ID', 'Title', 'Slug', 'Author', 'Category', 'Date', 'Image', 'Excerpt', 'Content', 'Status'];

/* ---------------- Public + admin reads ---------------- */
function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var action = p.action || 'list';
  try {
    if (action === 'auth') {
      return json({ ok: p.password === ADMIN_PASSWORD });
    }

    var posts = readAll();

    if (action === 'all') { // admin — includes drafts, full content
      if (p.password !== ADMIN_PASSWORD) return json({ error: 'unauthorized' });
      return json({ posts: posts });
    }

    if (action === 'post') { // single published post, full content
      var one = posts.filter(function (x) {
        return x.status === 'published' && (x.slug === p.slug || String(x.id) === String(p.id));
      })[0];
      return json({ post: one || null });
    }

    // default: published list (no full content)
    var list = posts
      .filter(function (x) { return x.status === 'published'; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
      .map(function (x) {
        return { id: x.id, title: x.title, slug: x.slug, author: x.author,
                 category: x.category, date: x.date, image: x.image, excerpt: x.excerpt };
      });
    return json({ posts: list });

  } catch (err) {
    return json({ error: err.toString() });
  }
}

/* ---------------- Admin writes ---------------- */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.password !== ADMIN_PASSWORD) return json({ error: 'unauthorized' });

    var sheet = getSheet();

    if (d.action === 'create') {
      var post = d.post || {};
      post.id = 'p' + (new Date().getTime());
      if (!post.date) post.date = todayStr();
      if (!post.slug) post.slug = slugify(post.title || post.id);
      if (!post.status) post.status = 'draft';
      sheet.appendRow(rowFrom(post));
      return json({ result: 'success', id: post.id });
    }

    if (d.action === 'update') {
      var row = findRow(sheet, d.id);
      if (row < 0) return json({ error: 'not found' });
      var p2 = d.post || {}; p2.id = d.id;
      if (!p2.slug) p2.slug = slugify(p2.title || d.id);
      sheet.getRange(row, 1, 1, HEADERS.length).setValues([rowFrom(p2)]);
      return json({ result: 'success' });
    }

    if (d.action === 'delete') {
      var r = findRow(sheet, d.id);
      if (r < 0) return json({ error: 'not found' });
      sheet.deleteRow(r);
      return json({ result: 'success' });
    }

    return json({ error: 'unknown action' });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

/* ---------------- Helpers ---------------- */
function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function readAll() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0] && !r[1]) continue;
    out.push({
      id: r[0], title: r[1], slug: r[2], author: r[3], category: r[4],
      date: r[5], image: r[6], excerpt: r[7], content: r[8], status: r[9] || 'draft'
    });
  }
  return out;
}

function rowFrom(p) {
  return [p.id || '', p.title || '', p.slug || '', p.author || '', p.category || '',
          p.date || '', p.image || '', p.excerpt || '', p.content || '', p.status || 'draft'];
}

function findRow(sheet, id) {
  var ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var i = 1; i < ids.length; i++) { if (String(ids[i][0]) === String(id)) return i + 1; }
  return -1;
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
}

function todayStr() {
  var d = new Date(), p = function (n) { return ('0' + n).slice(-2); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
