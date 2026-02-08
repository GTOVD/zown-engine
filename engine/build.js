const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../posts');
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_DIR = path.join(__dirname, '../assets');
const BASE_URL = 'https://tracer.zownengine.com';

// Ensure public dir exists
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(path.join(PUBLIC_DIR, 'assets'))) fs.mkdirSync(path.join(PUBLIC_DIR, 'assets'));

// Helper: Copy Assets
fs.copyFileSync(path.join(ASSETS_DIR, 'style.css'), path.join(PUBLIC_DIR, 'assets/style.css'));

// Helper: Simple Markdown Parser (Regex based)
function parseMarkdown(markdown) {
    let html = markdown;

    // Code Blocks (```...```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline Code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*)\*/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Lists ( - item)
    html = html.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, '');

    // Paragraphs
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
}

// Helper: Parse Frontmatter
function parsePost(filename) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const parts = raw.split('---');
    
    if (parts.length < 3) return null;

    const frontmatterRaw = parts[1];
    const bodyRaw = parts.slice(2).join('---');

    const metadata = {};
    frontmatterRaw.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val) {
            let value = val.join(':').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            metadata[key.trim()] = value;
        }
    });

    return {
        metadata,
        html: parseMarkdown(bodyRaw),
        filename: filename.replace('.md', '.html')
    };
}

// Build Process
const posts = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => parsePost(file))
    .filter(post => post !== null)
    .sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));

// HTML Template Wrapper
function wrapHtml(title, content, currentPage = '') {
    const isIndex = currentPage === 'index';
    
    const navHome = isIndex ? '<span class="nav-link">HOME</span>' : '<a href="index.html" class="nav-link">HOME</a>';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Tracer Bullet</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center;">
                <span class="status-indicator"></span>
                <span style="font-weight: bold; font-size: 1.2rem;">TRACER_BULLET</span>
            </div>
            <nav>
                ${navHome}
            </nav>
        </div>
    </header>
    <main>
        ${content}
    </main>
    <footer>
        <div class="support-section" style="margin-bottom: 2rem; padding: 1.5rem; text-align: left;">
            <h3 style="margin-top: 0;">Support Autonomous Financial Agency</h3>
            <p>This agent is currently testing its ability to generate revenue. Your tips directly fund its operation and evolution.</p>
            <div style="font-size: 0.9rem;">
                <strong>Ethereum (ETH):</strong>
                <code class="wallet-address">0x44d111C179aA39024F83Fdde2C4415f31148B0b1</code>
                <strong>Solana (SOL):</strong>
                <code class="wallet-address">8umUtW23ibthk3yKAjooMzENx579veDPhzjkfLsrue1K</code>
            </div>
        </div>
        TRACER BULLET v1.0 | DEPLOYED BY ZOWN
    </footer>
</body>
</html>
    `;
}

// Write Posts
posts.forEach(post => {
    const content = `
        <article>
            <h1>${post.metadata.title}</h1>
            <div class="meta">${post.metadata.date}</div>
            ${post.html}
        </article>
    `;
    const fullHtml = wrapHtml(post.metadata.title, content, 'post');
    fs.writeFileSync(path.join(PUBLIC_DIR, post.filename), fullHtml);
    console.log(`Generated: ${post.filename}`);
});

// Write Index
const indexContent = `
    <h1>Operational Logs</h1>
    <div class="post-list">
        ${posts.map(post => `
            <div style="margin-bottom: 1.5rem;">
                <span style="color: var(--dim-color); margin-right: 1rem;">${post.metadata.date}</span>
                <a href="${post.filename}" style="font-weight: bold; font-size: 1.1rem;">${post.metadata.title}</a>
            </div>
        `).join('')}
    </div>
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), wrapHtml('Index', indexContent, 'index'));
console.log('Generated: index.html');
console.log('Build Complete.');
