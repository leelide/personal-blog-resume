// 李昱德室內設計 - 主要 JavaScript 控制器 (Vanilla SPA Router)

// 全域資料存儲
let appData = {
  posts: [],
  portfolio: {}
};

// 導覽定義
const navItems = [
  { id: 'home', label: '首頁', hash: '#/', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
  { id: 'blog', label: '文章紀錄', hash: '#/blog', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>` },
  { id: 'portfolio', label: '作品與履歷', hash: '#/portfolio', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>` },
  { id: 'about', label: '關於我', hash: '#/about', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` }
];

// 解析 Markdown + YAML Frontmatter 的簡易函式
function parseMarkdown(mdText) {
  // 移除 UTF-8 BOM 檔頭與前後多餘空白，防止正則解析失敗
  const cleanText = mdText.replace(/^\ufeff/, '').trim();
  const matches = cleanText.match(/^---([\s\S]+?)---([\s\S]*)$/);
  if (!matches) {
    return {
      content: typeof marked !== 'undefined' ? marked.parse(cleanText) : cleanText
    };
  }
  
  const yamlSection = matches[1];
  const markdownBody = matches[2];
  
  const metadata = {};
  yamlSection.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let val = line.slice(colonIndex + 1).trim();
      // 去除前後雙引號或單引號
      val = val.replace(/^["']|["']$/g, '');
      metadata[key] = val;
    }
  });
  
  return {
    ...metadata,
    content: typeof marked !== 'undefined' ? marked.parse(markdownBody) : markdownBody
  };
}

// 頁面初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 異步讀取文章索引
    const postsIndexRes = await fetch('./src/data/posts.json?t=' + Date.now());
    const postsIndex = await postsIndexRes.json();

    // 異步下載並解析每一篇 Markdown 文章
    const postsPromises = postsIndex.map(async (filePath) => {
      // 緩存防錯機制：如果瀏覽器讀取到舊緩存的 posts.json (陣列內是物件而非路徑字串)
      if (typeof filePath === 'object' && filePath !== null) {
        return filePath;
      }
      const res = await fetch(`./${filePath}?t=` + Date.now());
      const text = await res.text();
      return parseMarkdown(text);
    });
    
    appData.posts = await Promise.all(postsPromises);

    const portfolioRes = await fetch('./src/data/portfolio.json?t=' + Date.now());
    appData.portfolio = await portfolioRes.json();
    
    // 初始化導覽欄
    renderNavigations();
    
    // 綁定路由監聽
    window.addEventListener('hashchange', router);
    
    // 初次執行路由
    router();
  } catch (err) {
    console.error('資料初始化失敗:', err);
    document.getElementById('content-view').innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1rem; color: var(--accent-terracotta);">資料加載失敗</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">請確認本地伺服器運作正常或 JSON 檔案配置無誤。</p>
        <div style="background: rgba(140, 94, 71, 0.05); padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; text-align: left; max-width: 600px; margin: 0 auto; overflow-x: auto; color: #a3704c; border: 1px solid rgba(140, 94, 71, 0.1); line-height: 1.5;">
          <strong>錯誤詳情 (Error details)：</strong><br>${err.stack || err.message || err}
        </div>
      </div>
    `;
  }
});

// 渲染桌面與行動端導覽欄
function renderNavigations() {
  const header = document.getElementById('header-container');
  const mobileNav = document.getElementById('mobile-nav-container');

  // 1. 桌面端 Top Header
  header.innerHTML = `
    <div class="header-logo" onclick="window.location.hash = '#/'" style="display: flex; flex-direction: row; align-items: center; gap: 0.75rem;">
      <img src="./logo.png" alt="LudeLee Logo" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;">
      <div style="display: flex; flex-direction: column; align-items: flex-start;">
        <span class="logo-title">LudeLee</span>
        <span class="logo-sub">INTERIOR DESIGN</span>
      </div>
    </div>
    <nav class="header-nav-list">
      ${navItems.map(item => `
        <a href="${item.hash}" class="header-link" id="header-nav-${item.id}">
          ${item.label}
        </a>
      `).join('')}
    </nav>
  `;

  // 2. 行動端 Bottom Nav
  mobileNav.innerHTML = `
    ${navItems.map(item => `
      <a href="${item.hash}" class="mobile-nav-item" id="mobile-nav-${item.id}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `).join('')}
  `;
}

// 導覽狀態更新
function updateActiveNav(activeId) {
  navItems.forEach(item => {
    const headerEl = document.getElementById(`header-nav-${item.id}`);
    const mobEl = document.getElementById(`mobile-nav-${item.id}`);
    
    if (headerEl) {
      if (item.id === activeId) headerEl.classList.add('active');
      else headerEl.classList.remove('active');
    }
    
    if (mobEl) {
      if (item.id === activeId) mobEl.classList.add('active');
      else mobEl.classList.remove('active');
    }
  });
}

// 路由控制器
function router() {
  const hash = window.location.hash || '#/';
  const contentView = document.getElementById('content-view');
  
  // 觸發淡出再淡入效果
  contentView.classList.remove('fade-in');
  void contentView.offsetWidth; // 觸發重繪
  contentView.classList.add('fade-in');
  
  // 匹配單篇文章詳細頁
  if (hash.startsWith('#/blog/')) {
    const postId = hash.replace('#/blog/', '');
    renderPostDetail(contentView, postId);
    updateActiveNav('blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  // 標準路由匹配
  switch (hash) {
    case '#/':
    case '#/home':
      renderHome(contentView);
      updateActiveNav('home');
      break;
    case '#/blog':
      renderBlog(contentView);
      updateActiveNav('blog');
      break;
    case '#/portfolio':
      renderPortfolio(contentView);
      updateActiveNav('portfolio');
      break;
    case '#/about':
      renderAbout(contentView);
      updateActiveNav('about');
      break;
    default:
      contentView.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem;">
          <h2 style="font-family: var(--font-serif); margin-bottom: 1rem; color: var(--accent-terracotta);">404 找不到網頁</h2>
          <a href="#/" class="hero-cta">返回首頁</a>
        </div>
      `;
      updateActiveNav('');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------
// 頁面視圖渲染函式 (Views Rendering)
// ---------------------------------

// 1. 首頁視圖 (Home View)
function renderHome(container) {
  // 精選文章（拿第一篇）
  const featuredPost = appData.posts[0] || {};
  // 最新文章（顯示前 4 篇，包含精選文章）
  const latestPosts = appData.posts.slice(0, 4);
  const stats = appData.portfolio.stats || [];

  container.innerHTML = `
    <!-- Split Hero Section -->
    <section class="hero-section">
      <div class="hero-visual-card">
        <img class="hero-img" src="${featuredPost.image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'}" alt="精選案例">
      </div>
      <div class="hero-content-card">
        <span class="hero-number">(01) 精選主打</span>
        <h2 class="hero-title">${featuredPost.title || '暖沙侘寂空間設計'}</h2>
        <p class="hero-desc">${featuredPost.summary || '點擊了解李昱德設計總監如何透過留白與暖色基調調配，創造讓居住者放鬆心靈的自然溫暖美學。'}</p>
        <a href="#/blog/${featuredPost.id || ''}" class="hero-cta">閱讀完整文章</a>
      </div>
    </section>

    <!-- Marquee Skills -->
    <div class="marquee-container">
      <div class="marquee-track">
        <!-- 複製多份確保無縫滾動 -->
        ${Array(4).fill([
          'SPACE PLANNING 空間規劃',
          'WABI-SABI 侘寂美學',
          'LIGHTING DESIGN 光影設計',
          'RESIDENTIAL DESIGN 住宅規劃',
          'MINIMALISM 極簡主義'
        ]).flat().map(text => `
          <span class="marquee-item"><span class="marquee-dot"></span>${text}</span>
        `).join('')}
      </div>
    </div>

    <!-- Stats Section -->
    <section class="stats-section">
      ${stats.map(stat => `
        <div class="stat-cell">
          <span class="stat-value">${stat.value}</span>
          <span class="stat-label">${stat.label}</span>
          <span class="stat-desc">${stat.description}</span>
        </div>
      `).join('')}
    </section>

    <!-- Latest Blog Posts -->
    <section>
      <header class="section-header">
        <h3 class="section-title">設計隨筆 & 專業紀錄</h3>
        <div class="section-line"></div>
      </header>
      
      <div class="posts-grid">
        ${latestPosts.map(post => `
          <div class="post-card" onclick="window.location.hash = '#/blog/${post.id}'">
            <div class="post-img-wrapper">
              <img class="post-card-img" src="${post.image}" alt="${post.title}" loading="lazy">
            </div>
            <div class="post-card-body">
              <div class="post-meta">
                <span class="post-tag">${post.category}</span>
              </div>
              <h4 class="post-card-title">${post.title}</h4>
              <p class="post-card-summary">${post.summary}</p>
              <div class="post-card-footer">
                <span>${post.date}</span>
                <svg class="arrow-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Site Footer -->
    <footer class="site-footer">
      <p>&copy; 2026 LudeLee | Yude Li Design. All Rights Reserved.</p>
      <p class="footer-tech">
        <a href="${appData.portfolio.profile.github || '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">GitHub</a>
      </p>
    </footer>
  `;
}

// 2. 部落格列表視圖 (Blog View)
function renderBlog(container) {
  container.innerHTML = `
    <div class="posts-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); margin-top: 1rem;">
      ${appData.posts.map(post => `
        <div class="post-card" onclick="window.location.hash = '#/blog/${post.id}'">
          <div class="post-img-wrapper">
            <img class="post-card-img" src="${post.image}" alt="${post.title}" loading="lazy">
          </div>
          <div class="post-card-body">
            <div class="post-meta">
              <span class="post-tag">${post.category}</span>
            </div>
            <h4 class="post-card-title">${post.title}</h4>
            <p class="post-card-summary">${post.summary}</p>
            <div class="post-card-footer">
              <span>${post.date}</span>
              <svg class="arrow-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <footer class="site-footer">
      <p>&copy; 2026 LudeLee | Yude Li Design.</p>
      <p class="footer-tech">
        <a href="#/" class="hero-cta" style="font-family: var(--font-sans); font-size: 0.8rem; padding-bottom: 0;">返回首頁</a>
      </p>
    </footer>
  `;
}

// 3. 作品集與履歷視圖 (Portfolio & Resume View)
function renderPortfolio(container) {
  const profile = appData.portfolio.profile || {};
  const experiences = appData.portfolio.experiences || [];
  const skills = appData.portfolio.skills || [];
  const projects = appData.portfolio.projects || [];

  container.innerHTML = `
    <!-- Projects Grid -->
    <section style="margin-bottom: 5rem; margin-top: 1rem;">
      <header class="section-header">
        <h3 class="section-title">設計作品案例</h3>
        <div class="section-line"></div>
      </header>
      
      <div class="portfolio-list">
        ${projects.map((proj, idx) => `
          <div class="portfolio-item-card">
            <div class="portfolio-img-wrapper" style="${idx % 2 === 1 ? 'order: 2;' : ''}">
              <img class="portfolio-img" src="${proj.image}" alt="${proj.title}" loading="lazy">
            </div>
            <div class="portfolio-details">
              <span class="portfolio-case-meta">${proj.style} / ${proj.year}</span>
              <h4 class="portfolio-case-title">${proj.title}</h4>
              <p class="portfolio-case-desc">${proj.description}</p>
              <div class="portfolio-features">
                ${proj.features.map(f => `<span class="feature-pill">${f}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Resume grid -->
    <section>
      <header class="section-header">
        <h3 class="section-title">學經歷與專業技能</h3>
        <div class="section-line"></div>
      </header>

      <div class="resume-section">
        <!-- Timeline -->
        <div class="timeline-container">
          <h4 class="section-title" style="font-size: 1.25rem; margin-bottom: 1.5rem;">工作經歷</h4>
          ${experiences.map(exp => `
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <div class="timeline-period">${exp.period}</div>
              <div class="timeline-title">${exp.title}</div>
              <div class="timeline-company">${exp.company}</div>
              <p class="timeline-details">${exp.details}</p>
            </div>
          `).join('')}

          <h4 class="section-title" style="font-size: 1.25rem; margin-top: 2.5rem; margin-bottom: 1.5rem;">教育背景</h4>
          ${(appData.portfolio.education || []).map(edu => `
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <div class="timeline-period">${edu.period}</div>
              <div class="timeline-title">${edu.title}</div>
              <div class="timeline-company">${edu.school}</div>
              <p class="timeline-details">${edu.details}</p>
            </div>
          `).join('')}
        </div>

        <!-- Skills list -->
        <div class="skills-wrapper">
          <h4 class="section-title" style="font-size: 1.25rem; margin-bottom: 1rem;">專業領域</h4>
          ${skills.map(grp => `
            <div class="skill-group">
              <div class="skill-group-title">${grp.category}</div>
              <ul class="skill-list">
                ${grp.items.map(item => `<li class="skill-item">${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <p>&copy; 2026 LudeLee | Yude Li Design.</p>
      <p class="footer-tech">
        <a href="#/" class="hero-cta" style="font-family: var(--font-sans); font-size: 0.8rem; padding-bottom: 0;">返回首頁</a>
      </p>
    </footer>
  `;
}

// 4. 關於我視圖 (About View)
function renderAbout(container) {
  const profile = appData.portfolio.profile || {};

  container.innerHTML = `
    <div class="about-card" style="margin-top: 1rem;">
      <div class="about-img-wrapper">
        <img class="about-img" src="${profile.avatar}?t=${Date.now()}" alt="${profile.name}">
      </div>
      <div class="about-details">
        <h3 class="about-title">${profile.name} <span style="font-size: 1.1rem; font-weight: normal; color: var(--text-muted);">${profile.englishName}</span></h3>
        <span class="about-subtitle">${profile.title}</span>
        
        <p class="about-bio">${profile.bio}</p>
        
        <ul class="about-contact-list">
          <li class="about-contact-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>電子信箱：${profile.email}</span>
          </li>
          <li class="about-contact-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>聯絡電話：${profile.phone}</span>
          </li>
        </ul>

        <div class="about-socials">
          <a href="${profile.github}" target="_blank" rel="noopener noreferrer" class="social-btn" aria-label="GitHub" title="GitHub">
            <svg role="img" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </a>
          <a href="mailto:${profile.email}" class="social-btn" aria-label="Email" title="Email">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        </div>
      </div>
    </div>

    <footer class="site-footer">
      <p>&copy; 2026 LudeLee | Yude Li Design.</p>
      <p class="footer-tech">
        <a href="#/" class="hero-cta" style="font-family: var(--font-sans); font-size: 0.8rem; padding-bottom: 0;">返回首頁</a>
      </p>
    </footer>
  `;
}

// 5. 單篇文章詳細頁視圖 (Post Detail View)
function renderPostDetail(container, postId) {
  const post = appData.posts.find(p => p.id === postId);
  
  if (!post) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <h2 style="font-family: var(--font-serif); margin-bottom: 1rem; color: var(--accent-terracotta);">找不到該篇文章</h2>
        <a href="#/blog" class="hero-cta">返回文章列表</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="post-detail-container">
      <span class="back-link" onclick="window.location.hash = '#/blog'">
        <svg style="width: 14px; height: 14px; transform: scaleX(-1);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
        返回文章列表
      </span>
      
      <header>
        <span class="post-tag" style="margin-bottom: 1rem; display: inline-block;">${post.category}</span>
        <h2 class="post-detail-title">${post.title}</h2>
        <div class="post-detail-meta">
          <span>發布日期：${post.date}</span>
          <span>作者：李昱德 (Yude Li)</span>
        </div>
      </header>
      
      <!-- Feature Image -->
      <div style="aspect-ratio: 16/9; overflow: hidden; border-radius: 12px; margin-bottom: 2.5rem; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
        <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      
      <!-- Content Body -->
      <article class="post-detail-body">
        ${post.content}
      </article>
    </div>

    <footer class="site-footer" style="max-width: 800px; margin: 4rem auto 0 auto;">
      <p>&copy; 2026 LudeLee | Yude Li Design.</p>
      <p class="footer-tech">
        <a href="#/blog" class="hero-cta" style="font-family: var(--font-sans); font-size: 0.8rem; padding-bottom: 0;">返回文章列表</a>
      </p>
    </footer>
  `;
}
