export function getApiExplorerHtml(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BƯỚC TIẾP API Engine — Developer Console & Architecture Explorer | UNESCO Youth Hackathon 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-body: #F6FAFE;
      --bg-surface: #FFFFFF;
      --bg-subtle: #F1F5F9;
      --bg-card: #FFFFFF;
      --border-light: #E2E8F0;
      --border-medium: #CBD5E1;
      --border-focus: #2563EB;
      
      --text-main: #0F172A;
      --text-muted: #475569;
      --text-soft: #64748B;
      
      --brand-primary: #1D4ED8;
      --brand-hover: #1E40AF;
      --brand-light: #EFF6FF;
      --brand-border: #BFDBFE;
      
      --method-get: #059669;
      --method-get-bg: #ECFDF5;
      --method-get-border: #A7F3D0;
      
      --method-post: #2563EB;
      --method-post-bg: #EFF6FF;
      --method-post-border: #BFDBFE;
      
      --method-put: #D97706;
      --method-put-bg: #FFFBEB;
      --method-put-border: #FDE68A;
      
      --method-patch: #7C3AED;
      --method-patch-bg: #F5F3FF;
      --method-patch-border: #DDD6FE;
      
      --method-delete: #DC2626;
      --method-delete-bg: #FEF2F2;
      --method-delete-border: #FECACA;
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
      
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-sans);
      background-color: var(--bg-body);
      color: var(--text-main);
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-light);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }

    .header-inner {
      max-width: 1440px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      background: #1D4ED8;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 13px;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;
    }

    .brand-meta h1 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-meta p {
      font-size: 12px;
      color: var(--text-soft);
      font-weight: 500;
    }

    .header-links {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .nav-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-muted);
      background: var(--bg-body);
      border: 1px solid var(--border-light);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-btn:hover {
      background: #E2E8F0;
      color: var(--text-main);
    }

    .nav-btn.primary {
      background: var(--brand-primary);
      color: #FFFFFF;
      border-color: var(--brand-primary);
    }

    .nav-btn.primary:hover {
      background: var(--brand-hover);
    }

    /* Tab Bar */
    .tab-nav-wrapper {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-light);
    }

    .tab-nav-inner {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      gap: 4px;
      overflow-x: auto;
    }

    .tab-btn {
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--text-main);
      background: #F8FAFC;
    }

    .tab-btn.active {
      color: var(--brand-primary);
      border-bottom-color: var(--brand-primary);
      font-weight: 700;
      background: var(--brand-light);
    }

    /* Main Container */
    .main-wrapper {
      max-width: 1440px;
      margin: 20px auto;
      padding: 0 24px;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Cards & Grids */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-soft);
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .stat-val {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-main);
      font-family: var(--font-mono);
    }

    .stat-desc {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .badge-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
    .badge-info { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
    .badge-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
    .badge-danger { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
    .badge-gray { background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }

    /* Filters & Auth Banner */
    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-input, .filter-select {
      background: var(--bg-surface);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 13px;
      color: var(--text-main);
      font-family: var(--font-sans);
    }

    .search-input { flex: 1; min-width: 260px; }
    .search-input:focus, .filter-select:focus { outline: none; border-color: var(--border-focus); }

    .auth-banner {
      background: var(--bg-surface);
      border: 1px solid var(--brand-border);
      border-left: 4px solid var(--brand-primary);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
    }

    .auth-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .auth-roles {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .role-chip {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      background: var(--bg-subtle);
      border: 1px solid var(--border-light);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .role-chip:hover {
      background: #E2E8F0;
      color: var(--text-main);
    }

    .role-chip.active {
      background: var(--brand-primary);
      color: #FFFFFF;
      border-color: var(--brand-primary);
    }

    .token-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .token-box {
      flex: 1;
      font-family: var(--font-mono);
      font-size: 11px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      color: var(--text-main);
    }

    /* 2-Column Layout */
    .explorer-layout {
      display: grid;
      grid-template-columns: 1fr 440px;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .explorer-layout { grid-template-columns: 1fr; }
    }

    .domain-section {
      margin-bottom: 24px;
    }

    .domain-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-light);
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .endpoint-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      margin-bottom: 8px;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.15s ease;
    }

    .endpoint-card:hover {
      border-color: var(--border-medium);
    }

    .endpoint-row {
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      gap: 12px;
    }

    .endpoint-main {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      overflow: hidden;
    }

    .method-tag {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      min-width: 58px;
      text-align: center;
    }

    .method-GET { background: var(--method-get-bg); color: var(--method-get); border: 1px solid var(--method-get-border); }
    .method-POST { background: var(--method-post-bg); color: var(--method-post); border: 1px solid var(--method-post-border); }
    .method-PUT { background: var(--method-put-bg); color: var(--method-put); border: 1px solid var(--method-put-border); }
    .method-PATCH { background: var(--method-patch-bg); color: var(--method-patch); border: 1px solid var(--method-patch-border); }
    .method-DELETE { background: var(--method-delete-bg); color: var(--method-delete); border: 1px solid var(--method-delete-border); }

    .endpoint-path-text {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
    }

    .endpoint-desc-brief {
      font-size: 12px;
      color: var(--text-soft);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .endpoint-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .endpoint-details {
      display: none;
      padding: 14px;
      border-top: 1px solid var(--border-light);
      background: var(--bg-subtle);
      border-bottom-left-radius: var(--radius-md);
      border-bottom-right-radius: var(--radius-md);
    }

    .endpoint-card.expanded .endpoint-details {
      display: block;
    }

    /* Sticky Live Runner Console */
    .runner-sticky-panel {
      position: sticky;
      top: 75px;
      background: var(--bg-surface);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-lg);
      padding: 16px;
      box-shadow: var(--shadow-md);
    }

    .runner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-light);
    }

    .runner-header h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
    }

    .form-group {
      margin-bottom: 10px;
    }

    .form-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      display: block;
      margin-bottom: 4px;
    }

    .input-row {
      display: flex;
      gap: 6px;
    }

    .runner-select {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      color: var(--text-main);
    }

    .runner-input {
      flex: 1;
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 6px 10px;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-sm);
      color: var(--text-main);
    }

    .runner-textarea {
      width: 100%;
      height: 85px;
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 8px;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      background: var(--bg-surface);
      resize: vertical;
    }

    .btn-send {
      width: 100%;
      background: var(--brand-primary);
      color: #FFFFFF;
      border: none;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 700;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s ease;
    }

    .btn-send:hover { background: var(--brand-hover); }

    .res-box {
      margin-top: 12px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .res-bar {
      background: var(--bg-subtle);
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      border-bottom: 1px solid var(--border-light);
    }

    .res-status-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .res-body-pre {
      background: #FFFFFF;
      padding: 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-main);
      max-height: 220px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Workflow Visualizer Map */
    .workflow-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 20px 0;
    }

    .workflow-node {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-left: 4px solid var(--brand-primary);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-sm);
    }

    .workflow-node:hover {
      border-color: var(--brand-border);
      background: #F8FAFC;
    }

    .workflow-node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .workflow-node-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
    }

    .workflow-node-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .workflow-meta-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    /* Table Styles */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    .matrix-table th {
      background: var(--bg-subtle);
      color: var(--text-main);
      font-weight: 700;
      padding: 10px 14px;
      border-bottom: 2px solid var(--border-light);
      white-space: nowrap;
    }

    .matrix-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-muted);
    }

    .matrix-table tr:hover td {
      background: #F8FAFC;
    }

    .schema-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
    }

    .schema-card h4 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>

  <!-- Top Header Navigation -->
  <header>
    <div class="header-inner">
      <div class="brand-section">
        <div class="brand-logo">BƯỚC TIẾP</div>
        <div class="brand-meta">
          <h1>API Engine & Architecture Console <span class="badge-pill badge-success">PDR Canonical v1</span></h1>
          <p>UNESCO Youth Hackathon 2026 — D1 Native Serverless Backend</p>
        </div>
      </div>
      <div class="header-links">
        <a href="https://buoc-tiep-web.pages.dev" target="_blank" class="nav-btn">🏢 Web Admin</a>
        <a href="https://buoc-tiep-app.pages.dev" target="_blank" class="nav-btn">📱 Mobile App</a>
        <a href="https://survey-buoctiep-unesco2026.pages.dev" target="_blank" class="nav-btn">📋 Khảo Sát</a>
        <a href="/openapi.json" target="_blank" class="nav-btn">📄 OpenAPI 3.1</a>
        <a href="https://github.com/hungpixi/unesco-youth-hackathon-2026" target="_blank" class="nav-btn primary">🐙 GitHub SSOT</a>
      </div>
    </div>
  </header>

  <!-- Tab Navigation Bar -->
  <div class="tab-nav-wrapper">
    <div class="tab-nav-inner">
      <button class="tab-btn active" onclick="switchTab('explorer')">🔍 API Explorer & Live Test</button>
      <button class="tab-btn" onclick="switchTab('workflows')">🗺️ Luồng Nghiệp Vụ (Workflows)</button>
      <button class="tab-btn" onclick="switchTab('overview')">🌐 Tổng Quan Kiến Trúc</button>
      <button class="tab-btn" onclick="switchTab('crud')">📊 Ma Trận Độ Phủ 11 Năng Lực</button>
      <button class="tab-btn" onclick="switchTab('models')">📦 Mô Hình CSDL D1</button>
      <button class="tab-btn" onclick="switchTab('rbac')">🛡️ Phân Quyền & RBAC</button>
      <button class="tab-btn" onclick="switchTab('openapi')">📄 Chuẩn OpenAPI 3.1</button>
      <button class="tab-btn" onclick="switchTab('health')">🏥 Giám Sát & Audit Logs</button>
    </div>
  </div>

  <div class="main-wrapper">

    <!-- ================= TAB 1: API EXPLORER ================= -->
    <div id="tab-explorer" class="tab-content active">
      
      <!-- Filter Bar -->
      <div class="filter-bar">
        <input type="text" id="search-box" class="search-input" placeholder="🔍 Tìm kiếm endpoint theo từ khóa, URL, domain..." oninput="filterEndpoints()" />
        <select id="method-filter" class="filter-select" onchange="filterEndpoints()">
          <option value="ALL">Tất cả Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select id="auth-filter" class="filter-select" onchange="filterEndpoints()">
          <option value="ALL">Tất cả Quyền Hạn</option>
          <option value="PUBLIC">Công khai (Public)</option>
          <option value="VOLUNTEER">Tình nguyện viên</option>
          <option value="SOCIAL_WORKER">Cán bộ NGO</option>
          <option value="ADMIN">Quản trị viên (Admin)</option>
          <option value="PARTNER">Đối tác tiếp nhận</option>
        </select>
      </div>

      <!-- Auth Switcher Banner -->
      <div class="auth-banner">
        <div class="auth-header">
          <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">🔑 Bộ Chọn Phân Quyền & JWT Token Xác Thực (Authorization Header)</span>
          <span id="current-role-badge" class="badge-pill badge-info">Role: Public (Không Auth)</span>
        </div>
        <div class="auth-roles">
          <button class="role-chip active" onclick="selectRole('public')">👤 Public (Không Auth)</button>
          <button class="role-chip" onclick="selectRole('volunteer')">🤝 Tình Nguyện Viên</button>
          <button class="role-chip" onclick="selectRole('social_worker')">🏢 Cán Bộ NGO (Social Worker)</button>
          <button class="role-chip" onclick="selectRole('admin')">🛡️ Quản Trị Viên (Admin)</button>
          <button class="role-chip" onclick="selectRole('partner')">🏛️ Đơn Vị Đối Tác</button>
        </div>
        <div class="token-row">
          <input type="text" id="active-token-input" class="token-box" placeholder="JWT Bearer Token..." />
          <button class="nav-btn" onclick="fetchNewDevToken()">🔄 Sinh Token Mới</button>
        </div>
      </div>

      <!-- 2-Column Explorer & Live Runner -->
      <div class="explorer-layout">
        <div id="endpoints-container">
          <!-- Dynamic endpoints rendered from manifest -->
        </div>

        <div>
          <div class="runner-sticky-panel">
            <div class="runner-header">
              <h3>⚡ Trình Chạy Lệnh Live Test</h3>
              <span class="badge-pill badge-success">Cloudflare D1 Ready</span>
            </div>

            <div class="form-group">
              <label class="form-label">Yêu Cầu (Method & Path)</label>
              <div class="input-row">
                <select id="run-method" class="runner-select">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input type="text" id="run-path" class="runner-input" value="/api/v1/cases" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">JSON Request Body (POST / PATCH)</label>
              <textarea id="run-body" class="runner-textarea" placeholder="{}"></textarea>
            </div>

            <button id="btn-execute" class="btn-send" onclick="sendLiveRequest()">
              <span>🚀 Gửi Yêu Cầu Thực Thi</span>
            </button>

            <div class="res-box">
              <div class="res-bar">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span>Phản Hồi:</span>
                  <span id="res-status-code" class="res-status-pill badge-info">Sẵn sàng</span>
                  <span id="res-time" style="color: var(--text-soft); font-size: 11px;">0ms</span>
                </div>
                <button class="nav-btn" style="padding: 2px 6px; font-size: 10px;" onclick="copyJsonResult()">📋 Chép JSON</button>
              </div>
              <pre id="res-output-pre" class="res-body-pre">// Bấm "Thử Nghiệm" trên bất kỳ endpoint nào để gửi request trực tiếp...</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= TAB 2: WORKFLOWS ================= -->
    <div id="workflows" class="tab-content">
      <div class="stat-card" style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">🗺️ Hành Trình Thực Địa & Vòng Đời Ca Hỗ Trợ (Beneficiary Journey)</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Khung kiến trúc liên kết trực tiếp từ Màn hình Giao diện $\rightarrow$ API Endpoint $\rightarrow$ Bảng CSDL D1 $\rightarrow$ Phân quyền RBAC.</p>
      </div>

      <div class="workflow-timeline">
        <div class="workflow-node" onclick="setRunner('/api/v1/cases', 'POST', { aliasName: 'Bé Hùng', birthYear: 2010, isMinor: true, priority: 'high' })">
          <div class="workflow-node-header">
            <span class="workflow-node-title">1. Tiếp Cận, Thu Thập Ban Đầu & Consent Gate (3 Không)</span>
            <span class="badge-pill badge-info">POST /api/v1/cases</span>
          </div>
          <p class="workflow-node-desc">Tình nguyện viên tiếp cận người thụ hưởng ngoài thực địa, giải thích quyền riêng tư, ghi nhận đồng thuận giọng nói hoặc xác nhận trực tiếp.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: Mobile Intake Modal</span>
            <span class="badge-pill badge-gray">DB: beneficiaries, cases, consents</span>
            <span class="badge-pill badge-success">Role: Volunteer, Social Worker</span>
          </div>
        </div>

        <div class="workflow-node" onclick="setRunner('/api/v1/safeguarding/report', 'POST', { childId: 'CHILD-2026-0001', severity: 'P0_EMERGENCY', reason: 'Trẻ em có nguy cơ bị bóc lột' })">
          <div class="workflow-node-header">
            <span class="workflow-node-title">2. Sàng Lọc Rủi Ro Khẩn Cấp & Rule 0 / Hotline 111</span>
            <span class="badge-pill badge-danger">POST /api/v1/safeguarding/report</span>
          </div>
          <p class="workflow-node-desc">Tự động kích hoạt khi phát hiện nguy cơ bạo hành, bóc lột trẻ em hoặc đe dọa tính mạng. Báo động trực tiếp cán bộ trực ban và kết nối Hotline 111.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: 1-Tap SOS Button</span>
            <span class="badge-pill badge-gray">DB: safeguarding_flags, audit_logs</span>
            <span class="badge-pill badge-danger">Role: Mọi vai trò (Rule 0)</span>
          </div>
        </div>

        <div class="workflow-node" onclick="setRunner('/api/v1/cases/case_2026_0012/next-steps', 'POST', { title: 'Khám sức khỏe ban đầu', action: 'Đưa đến Trạm Y tế Hóc Môn' })">
          <div class="workflow-node-header">
            <span class="workflow-node-title">3. Đánh Giá Nhu Cầu & Xác Định Bước An Toàn (Next Safe Step)</span>
            <span class="badge-pill badge-info">POST /api/v1/cases/:id/next-steps</span>
          </div>
          <p class="workflow-node-desc">Phân loại nhu cầu theo 6 trụ cột (Y tế, Nơi ở, Dinh dưỡng, Pháp lý, Việc làm, Học nghề). Lựa chọn 1 bước khả thi nhất trong 24-48 giờ tới.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: Next Step Card</span>
            <span class="badge-pill badge-gray">DB: safe_next_steps, needs</span>
            <span class="badge-pill badge-success">Role: Volunteer, Social Worker</span>
          </div>
        </div>

        <div class="workflow-node" onclick="setRunner('/api/v1/resources', 'GET')">
          <div class="workflow-node-header">
            <span class="workflow-node-title">4. Khớp Nối Nguồn Lực An Sinh & Bản Đồ Địa Lý</span>
            <span class="badge-pill badge-success">GET /api/v1/resources</span>
          </div>
          <p class="workflow-node-desc">Tra cứu 50+ điểm an sinh xã hội thực tế tại TP.HCM theo bán kính gần nhất, trạng thái sức chứa và kiểm định chất lượng.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: Web Map / Mobile Map</span>
            <span class="badge-pill badge-gray">DB: resources, organizations</span>
            <span class="badge-pill badge-gray">Role: Public / Bearer</span>
          </div>
        </div>

        <div class="workflow-node" onclick="setRunner('/api/v1/referrals', 'POST', { caseId: 'case_2026_0012', resourceId: 'res-shelter-01', notes: 'Chuyển tuyến tiếp nhận tạm trú' })">
          <div class="workflow-node-header">
            <span class="workflow-node-title">5. Phát Hành Chuyển Tuyến Form 07 & Bàn Giao Handoff</span>
            <span class="badge-pill badge-info">POST /api/v1/referrals</span>
          </div>
          <p class="workflow-node-desc">Tạo phiếu chuyển tuyến số hóa chuẩn quy chuẩn Việt Nam, gửi đến đối tác tiếp nhận, theo dõi tiến trình phản hồi qua Partner Inbox.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: New Referral Modal</span>
            <span class="badge-pill badge-gray">DB: referrals, referral_events</span>
            <span class="badge-pill badge-warning">Role: Social Worker, Partner</span>
          </div>
        </div>

        <div class="workflow-node" onclick="setRunner('/api/v1/passports/pass_2026_8891', 'GET')">
          <div class="workflow-node-header">
            <span class="workflow-node-title">6. Hộ Chiếu Sinh Kế & Tự Chủ Dài Hạn</span>
            <span class="badge-pill badge-success">GET /api/v1/passports/:id</span>
          </div>
          <p class="workflow-node-desc">Lộ trình 5 bước trang bị kỹ năng, hỗ trợ việc làm ổn định, cấp mã QR xác thực bảo mật không thể giả mạo.</p>
          <div class="workflow-meta-tags">
            <span class="badge-pill badge-gray">UI: Passport View</span>
            <span class="badge-pill badge-gray">DB: livelihood_passports, beneficiaries</span>
            <span class="badge-pill badge-info">Role: Social Worker, Volunteer</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= TAB 3: OVERVIEW ================= -->
    <div id="overview" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Tổng Endpoints Canonical</div>
          <div class="stat-val" style="color: var(--brand-primary);">48</div>
          <div class="stat-desc">Mount song song /api & /api/v1</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Độ Phủ Bounded Contexts</div>
          <div class="stat-val" style="color: #059669;">15 / 15</div>
          <div class="stat-desc">100% nghiệp vụ thực tế</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">D1 Native Schema Tables</div>
          <div class="stat-val" style="color: #7C3AED;">22</div>
          <div class="stat-desc">SQLite Native Binding trên Edge</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chuẩn Trắc Quan UI</div>
          <div class="stat-val" style="color: #D97706;">WCAG AAA</div>
          <div class="stat-desc">0% Glassmorphism, Light Mode</div>
        </div>
      </div>

      <div class="table-container">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Bounded Context</th>
              <th>Số Lượng Endpoints</th>
              <th>Thực Thể D1 Quản Lý</th>
              <th>Mục Tiêu Nghiệp Vụ Cốt Lõi</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>01. Xác Thực & Phân Quyền</strong></td>
              <td>6 Endpoints</td>
              <td><code>users</code>, <code>sessions</code></td>
              <td>Đăng nhập SHA-256, Google OAuth2, Dev Login có kiểm soát, JWT Session</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>02. Quản Lý Ca Đồng Hành</strong></td>
              <td>11 Endpoints</td>
              <td><code>cases</code>, <code>beneficiaries</code>, <code>encounters</code></td>
              <td>Toàn bộ vòng đời ca, Command transitions, phân công, ghi chú, đóng/tái mở ca</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>03. Bảo Vệ Trẻ Em & Rule 0</strong></td>
              <td>3 Endpoints</td>
              <td><code>safeguarding_flags</code>, <code>audit_logs</code></td>
              <td>1-Tap SOS, kết nối Hotline 111, ẩn danh trẻ em, làm mờ tọa độ GPS</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>04. Danh Bạ Nguồn Lực An Sinh</strong></td>
              <td>5 Endpoints</td>
              <td><code>resources</code>, <code>organizations</code></td>
              <td>50+ điểm cứu trợ thực tế, lọc bán kính GPS, giờ mở cửa 24/7, sức chứa</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>05. Chuyển Tuyến An Sinh</strong></td>
              <td>6 Endpoints</td>
              <td><code>referrals</code>, <code>referral_events</code></td>
              <td>Phiếu Chuyển tuyến Form 07, Partner Inbox, chấp thuận/từ chối chuyển tuyến</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>06. Hộ Chiếu Sinh Kế</strong></td>
              <td>5 Endpoints</td>
              <td><code>livelihood_passports</code></td>
              <td>Lộ trình 5 bước sinh kế, xác thực kỹ năng, mã QR ký điện tử</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>07. Xuất Hồ Sơ Hành Chính</strong></td>
              <td>2 Endpoints</td>
              <td><code>cases</code>, <code>beneficiaries</code></td>
              <td>Xuất tệp Word (.docx) chuẩn Mẫu số 07 Nghị định 20/2021/NĐ-CP</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
            <tr>
              <td><strong>08. Khảo Sát Thực Địa & Public</strong></td>
              <td>10 Endpoints</td>
              <td><code>survey_responses</code>, <code>impact_metrics</code></td>
              <td>116+ phản hồi thực địa, báo cáo SNSR, Thẻ cảnh báo lừa đảo MIL</td>
              <td><span class="badge-pill badge-success">Production</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 4: CRUD & CAPABILITY MATRIX ================= -->
    <div id="crud" class="tab-content">
      <div class="stat-card" style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">📊 Ma Trận Độ Phủ 11 Năng Lực Nghiệp Vụ (Capability Coverage)</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Đánh giá toàn diện theo 11 năng lực thực tế: CREATE, READ, UPDATE, ARCHIVE, SEARCH, ASSIGN, TRANSITION, VERIFY, SHARE, EXPORT, AUDIT.</p>
      </div>

      <div class="table-container">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>CREATE</th>
              <th>READ</th>
              <th>UPDATE</th>
              <th>ARCHIVE</th>
              <th>SEARCH</th>
              <th>ASSIGN</th>
              <th>TRANSITION</th>
              <th>VERIFY</th>
              <th>SHARE</th>
              <th>EXPORT</th>
              <th>AUDIT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Hồ Sơ Ca (Cases)</strong></td>
              <td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td><strong>Nguồn Lực (Resources)</strong></td>
              <td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>-</td><td>✅</td><td>✅</td><td>✅</td><td>-</td><td>✅</td>
            </tr>
            <tr>
              <td><strong>Chuyển Tuyến (Referrals)</strong></td>
              <td>✅</td><td>✅</td><td>✅</td><td>-</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td><strong>Hộ Chiếu (Passports)</strong></td>
              <td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>-</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td><strong>Bảo Vệ Trẻ Em (Rule 0)</strong></td>
              <td>✅</td><td>✅</td><td>✅</td><td>-</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>-</td><td>-</td><td>✅</td>
            </tr>
            <tr>
              <td><strong>Khảo Sát (Surveys)</strong></td>
              <td>✅</td><td>✅</td><td>-</td><td>-</td><td>✅</td><td>-</td><td>-</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 5: MODELS ================= -->
    <div id="models" class="tab-content">
      <div class="schema-card">
        <h4>📦 <code>beneficiaries</code> — Thực Thể Người Thụ Hưởng (Person SSOT)</h4>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Lưu trữ thông tin nhân thân được ẩn danh hóa. Tuân thủ nguyên tắc Privacy-by-Design.</p>
        <pre class="res-body-pre" style="max-height: 120px;">
id (PK text) | organization_id (FK text) | alias_name (text, CHILD-XXXX) | birth_year (int) | is_minor (bool) | vulnerability_group (text) | is_sensitive (bool) | created_at (timestamp)
        </pre>
      </div>

      <div class="schema-card">
        <h4>📦 <code>cases</code> — Hồ Sơ Ca Hỗ Trợ (Aggregate Root)</h4>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Quản lý toàn bộ tiến trình hỗ trợ, trạng thái chuyển đổi và mã QR ký điện tử.</p>
        <pre class="res-body-pre" style="max-height: 120px;">
id (PK text) | organization_id (FK text) | beneficiary_id (FK text) | assigned_to (FK text) | status (text) | priority (text) | next_follow_up_at (text) | signed_qr_token (text) | qr_expires_at (text)
        </pre>
      </div>

      <div class="schema-card">
        <h4>📦 <code>resources</code> — Danh Bạ Điểm An Sinh Xã Hội & Tọa Độ GPS</h4>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">50+ điểm cứu trợ thực tế tại TP.HCM (Trạm y tế, Bếp ăn, Mái ấm, TT Việc làm).</p>
        <pre class="res-body-pre" style="max-height: 120px;">
id (PK text) | name (text) | category (text) | district (text) | ward (text) | latitude (real) | longitude (real) | is_24_hours (bool) | verification_status (text) | capacity_status (text)
        </pre>
      </div>
    </div>

    <!-- ================= TAB 6: RBAC ================= -->
    <div id="rbac" class="tab-content">
      <div class="stat-card" style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">🛡️ Ma Trận Phân Quyền Đa Tầng (RBAC & Multi-Tenancy)</h3>
        <p style="font-size: 13px; color: var(--text-muted);">Kết hợp vai trò người dùng với Ranh giới Tổ chức (Organization Boundary) và Phạm vi Đồng thuận (Consent Scope).</p>
      </div>

      <div class="table-container">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Hành Động Nghiệp Vụ</th>
              <th>PUBLIC</th>
              <th>VOLUNTEER</th>
              <th>SOCIAL_WORKER</th>
              <th>PARTNER</th>
              <th>ADMIN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Xem danh bạ an sinh & Bản đồ công khai</td>
              <td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td>Tiếp cận thực địa & Tạo hồ sơ ca mới</td>
              <td>❌</td><td>✅</td><td>✅</td><td>❌</td><td>✅</td>
            </tr>
            <tr>
              <td>Kích hoạt Báo động Rule 0 / Hotline 111</td>
              <td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td>Phát hành Phiếu Chuyển Tuyến Form 07</td>
              <td>❌</td><td>❌</td><td>✅</td><td>❌</td><td>✅</td>
            </tr>
            <tr>
              <td>Tiếp nhận & Xử lý Chuyển tuyến (Partner Inbox)</td>
              <td>❌</td><td>❌</td><td>✅</td><td>✅</td><td>✅</td>
            </tr>
            <tr>
              <td>Đóng ca / Tái mở ca hỗ trợ</td>
              <td>❌</td><td>❌</td><td>✅</td><td>❌</td><td>✅</td>
            </tr>
            <tr>
              <td>Xem toàn bộ Nhật ký Kiểm toán (Audit Logs)</td>
              <td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= TAB 7: OPENAPI ================= -->
    <div id="openapi" class="tab-content">
      <div class="stat-card" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 15px; font-weight: 700;">📄 Tài Liệu Chuẩn OpenAPI 3.1 SSOT</h3>
          <p style="font-size: 12px; color: var(--text-muted);">Đặc tả API chính thức phục vụ tích hợp đa nền tảng và kiểm thử tự động.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/openapi.json" target="_blank" class="nav-btn primary">📥 Tải OpenAPI JSON</a>
          <button class="nav-btn" onclick="copyOpenApiSpec()">📋 Sao Chép Spec</button>
        </div>
      </div>
      <pre id="openapi-pre" class="res-body-pre" style="max-height: 450px;">// Đang nạp đặc tả OpenAPI 3.1...</pre>
    </div>

    <!-- ================= TAB 8: HEALTH & AUDIT ================= -->
    <div id="health" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Trạng Thái API Service</div>
          <div class="stat-val" style="color: #059669;">HEALTHY</div>
          <div class="stat-desc">Cloudflare Serverless Edge</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">CSDL D1 SQLite Native</div>
          <div class="stat-val" style="color: #2563EB;">CONNECTED</div>
          <div class="stat-desc">Độ trễ trung bình &lt; 8ms</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tự Động Quét SLA 48h</div>
          <div class="stat-val" style="color: #7C3AED;">ACTIVE</div>
          <div class="stat-desc">Cloudflare Cron Trigger 01:00 UTC</div>
        </div>
      </div>

      <div class="stat-card">
        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">🔍 Nhật Ký Kiểm Toán Thời Gian Thực (Live Audit Logs)</h4>
        <pre id="audit-log-pre" class="res-body-pre" style="max-height: 250px;">// Bấm kiểm tra để nạp nhật ký kiểm toán gần nhất...</pre>
        <button class="nav-btn primary" style="margin-top: 10px;" onclick="fetchLiveAuditLogs()">🔄 Tải Nhật Ký Mới Nhất</button>
      </div>
    </div>

  </div>

  <script>
    const ENDPOINTS = [
      // 01. Auth
      { domain: '01. Xác Thực & Phân Quyền', method: 'POST', path: '/api/v1/auth/login', auth: 'PUBLIC', desc: 'Đăng nhập mật khẩu SHA-256 an toàn', sampleBody: { email: 'admin@buoctiep.vn', password: '123456' } },
      { domain: '01. Xác Thực & Phân Quyền', method: 'POST', path: '/api/v1/auth/google', auth: 'PUBLIC', desc: 'Đăng nhập Google OAuth2 Single Sign-On', sampleBody: { id_token: 'google_jwt_sample' } },
      { domain: '01. Xác Thực & Phân Quyền', method: 'POST', path: '/api/v1/auth/dev-login', auth: 'GUARDED', desc: 'Đăng nhập nhanh môi trường Dev / Demo', sampleBody: { role: 'social_worker' } },
      { domain: '01. Xác Thực & Phân Quyền', method: 'GET', path: '/api/v1/auth/me', auth: 'BEARER_JWT', desc: 'Lấy thông tin tài khoản & cấu hình an toàn' },

      // 02. Cases
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'GET', path: '/api/v1/cases', auth: 'VOLUNTEER', desc: 'Tra cứu danh sách hồ sơ ca (phân quyền theo Org/Team)' },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'POST', path: '/api/v1/cases', auth: 'VOLUNTEER', desc: 'Tiếp nhận hồ sơ ca mới thực địa (Consent Gate & Mã Ẩn Danh)', sampleBody: { aliasName: 'Bé Hùng', birthYear: 2010, isMinor: true, priority: 'high', location: 'Hóc Môn' } },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'GET', path: '/api/v1/cases/case_2026_0012', auth: 'VOLUNTEER', desc: 'Chi tiết hồ sơ ca, nhu cầu đa chiều & dòng thời gian' },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'PATCH', path: '/api/v1/cases/case_2026_0012', auth: 'SOCIAL_WORKER', desc: 'Cập nhật thông tin ca hỗ trợ', sampleBody: { priority: 'emergency' } },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'POST', path: '/api/v1/cases/case_2026_0012/assign', auth: 'SOCIAL_WORKER', desc: 'Lệnh phân bổ cán bộ phụ trách ca', sampleBody: { assignedTo: 'usr-social-worker-01', reason: 'Phụ trách địa bàn Hóc Môn' } },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'POST', path: '/api/v1/cases/case_2026_0012/close', auth: 'SOCIAL_WORKER', desc: 'Lệnh đóng ca có kiểm duyệt & biên bản kết quả', sampleBody: { outcomeStatus: 'RESOLVED', notes: 'Đã bố trí việc làm ổn định' } },
      { domain: '02. Quản Lý Ca Đồng Hành', method: 'POST', path: '/api/v1/cases/case_2026_0012/reopen', auth: 'SOCIAL_WORKER', desc: 'Lệnh tái mở ca khi có nhu cầu phát sinh' },

      // 03. Next Safe Step
      { domain: '03. Bước An Toàn Tiếp Theo', method: 'POST', path: '/api/v1/cases/case_2026_0012/next-steps', auth: 'VOLUNTEER', desc: 'Đề xuất & xác nhận Bước An Toàn Tiếp Theo trong 24-48h', sampleBody: { title: 'Khám sức khỏe ban đầu', action: 'Đưa đến Trạm Y tế Hóc Môn', owner: 'TNV Nam' } },

      // 04. Safeguarding
      { domain: '04. Bảo Vệ Trẻ Em & Rule 0', method: 'POST', path: '/api/v1/safeguarding/report', auth: 'PUBLIC', desc: 'Kích hoạt Báo Động Khẩn Cấp Rule 0 / Hotline 111 (1-Tap SOS)', sampleBody: { childId: 'CHILD-2026-0001', severity: 'P0_EMERGENCY', reason: 'Trẻ em có nguy cơ bị bạo hành' } },
      { domain: '04. Bảo Vệ Trẻ Em & Rule 0', method: 'GET', path: '/api/v1/safeguarding/incidents', auth: 'SOCIAL_WORKER', desc: 'Giám sát các ca cảnh báo khẩn cấp cần can thiệp' },

      // 05. Resources
      { domain: '05. Danh Bạ Nguồn Lực An Sinh', method: 'GET', path: '/api/v1/resources', auth: 'PUBLIC', desc: 'Tra cứu 50+ điểm an sinh xã hội thực tế tại TP.HCM' },
      { domain: '05. Danh Bạ Nguồn Lực An Sinh', method: 'POST', path: '/api/v1/resources', auth: 'SOCIAL_WORKER', desc: 'Thêm mới Điểm Nguồn Lực An Sinh', sampleBody: { name: 'Mái ấm Ánh Sáng Mới', category: 'shelter', district: 'Quận 12', address: '45 Phan Văn Hớn' } },

      // 06. Referrals
      { domain: '06. Chuyển Tuyến An Sinh', method: 'GET', path: '/api/v1/referrals', auth: 'SOCIAL_WORKER', desc: 'Danh sách phiếu chuyển tuyến giữa các tổ chức' },
      { domain: '06. Chuyển Tuyến An Sinh', method: 'POST', path: '/api/v1/referrals', auth: 'SOCIAL_WORKER', desc: 'Phát hành Phiếu Chuyển Tuyến Form 07 Số Hóa', sampleBody: { caseId: 'case_2026_0012', resourceId: 'res-shelter-01', notes: 'Chuyển tuyến tiếp nhận tạm trú an toàn' } },
      { domain: '06. Chuyển Tuyến An Sinh', method: 'POST', path: '/api/v1/referrals/ref_2026_001/accept', auth: 'PARTNER', desc: 'Lệnh Đơn vị Tiếp nhận Đồng ý Hỗ trợ' },
      { domain: '06. Chuyển Tuyến An Sinh', method: 'POST', path: '/api/v1/referrals/ref_2026_001/decline', auth: 'PARTNER', desc: 'Lệnh Từ chối Chuyển tuyến Kèm Lý do', sampleBody: { reason: 'Cơ sở hiện đã vượt quá sức chứa tiếp nhận' } },

      // 07. Passports
      { domain: '07. Hộ Chiếu Sinh Kế Số Hóa', method: 'GET', path: '/api/v1/passports/pass_2026_8891', auth: 'VOLUNTEER', desc: 'Chi tiết Hộ chiếu Sinh kế 5 Bước & Mã QR Xác Thực' },

      // 08. Export
      { domain: '08. Xuất Hồ Sơ Hành Chính', method: 'GET', path: '/api/v1/export/form07-docx?caseId=case_2026_0012', auth: 'SOCIAL_WORKER', desc: 'Kết xuất Tờ khai Mẫu 07 NĐ 20/2021 thành tệp Word (.docx) Chuẩn Hành Chính' },

      // 09. Surveys & Impact
      { domain: '09. Khảo Sát & Tác Động Cộng Đồng', method: 'POST', path: '/api/v1/survey/submit', auth: 'PUBLIC', desc: 'Gửi kết quả khảo sát thực địa 4 bước', sampleBody: { contact_name: 'Nguyễn Văn Nam', contact_phone: '0901234567', a1_experience: 'Tình nguyện viên 2 năm' } },
      { domain: '09. Khảo Sát & Tác Động Cộng Đồng', method: 'GET', path: '/api/v1/impact/summary', auth: 'PUBLIC', desc: 'Báo cáo chỉ số tác động xã hội & Tỷ lệ chuyển tiếp thành công (SNSR)' },
      { domain: '09. Khảo Sát & Tác Động Cộng Đồng', method: 'GET', path: '/api/v1/mil/cards', auth: 'PUBLIC', desc: 'Danh sách Thẻ phòng chống lừa đảo việc làm & buôn người' },

      // 10. System
      { domain: '10. Hệ Thống & Kiểm Toán', method: 'GET', path: '/api/v1/audit-logs', auth: 'ADMIN', desc: 'Tra cứu nhật ký kiểm toán hệ thống bất biến' }
    ];

    let currentRole = 'public';
    let tokenCache = {};

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      event.currentTarget.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'openapi') loadOpenApiSpec();
      if (tabId === 'health') fetchLiveAuditLogs();
    }

    async function selectRole(role) {
      currentRole = role;
      document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
      event.currentTarget.classList.add('active');

      const labels = {
        public: 'Role: Public (Không Auth)',
        volunteer: 'Role: Tình Nguyện Viên',
        social_worker: 'Role: Cán Bộ NGO (Social Worker)',
        admin: 'Role: Quản Trị Viên (Admin)',
        partner: 'Role: Đơn Vị Đối Tác'
      };
      document.getElementById('current-role-badge').innerText = labels[role] || role;

      if (role === 'public') {
        document.getElementById('active-token-input').value = '';
        return;
      }

      if (tokenCache[role]) {
        document.getElementById('active-token-input').value = tokenCache[role];
        return;
      }

      await fetchNewDevToken();
    }

    async function fetchNewDevToken() {
      if (currentRole === 'public') return;
      const input = document.getElementById('active-token-input');
      input.value = 'Đang sinh JWT Token...';

      try {
        const res = await fetch('/api/v1/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: currentRole })
        });
        const data = await res.json();
        if (data.token) {
          tokenCache[currentRole] = data.token;
          input.value = data.token;
        } else {
          input.value = 'Lỗi: ' + (data.error || 'Không sinh được token');
        }
      } catch (err) {
        input.value = 'Lỗi kết nối: ' + err.message;
      }
    }

    function renderEndpoints(endpointsToRender) {
      const container = document.getElementById('endpoints-container');
      container.innerHTML = '';

      const groups = {};
      endpointsToRender.forEach(item => {
        if (!groups[item.domain]) groups[item.domain] = [];
        groups[item.domain].push(item);
      });

      Object.keys(groups).forEach(domainName => {
        const section = document.createElement('div');
        section.className = 'domain-section';

        const title = document.createElement('div');
        title.className = 'domain-title';
        title.innerHTML = \`<span>\${domainName}</span> <span class="badge-pill badge-gray">\${groups[domainName].length} endpoints</span>\`;
        section.appendChild(title);

        groups[domainName].forEach(item => {
          const card = document.createElement('div');
          card.className = 'endpoint-card';

          const row = document.createElement('div');
          row.className = 'endpoint-row';
          row.onclick = () => card.classList.toggle('expanded');

          const main = document.createElement('div');
          main.className = 'endpoint-main';
          main.innerHTML = \`
            <span class="method-tag method-\${item.method}">\${item.method}</span>
            <span class="endpoint-path-text">\${item.path}</span>
            <span class="endpoint-desc-brief">\${item.desc}</span>
          \`;

          const actions = document.createElement('div');
          actions.className = 'endpoint-actions';

          const authBadge = document.createElement('span');
          authBadge.className = 'badge-pill ' + (item.auth === 'PUBLIC' ? 'badge-success' : 'badge-warning');
          authBadge.innerText = item.auth;

          const btnTry = document.createElement('button');
          btnTry.className = 'nav-btn primary';
          btnTry.style.padding = '4px 8px';
          btnTry.style.fontSize = '11px';
          btnTry.innerText = '⚡ Thử Nghiệm';
          btnTry.onclick = (e) => {
            e.stopPropagation();
            setRunner(item.path, item.method, item.sampleBody);
          };

          actions.appendChild(authBadge);
          actions.appendChild(btnTry);

          row.appendChild(main);
          row.appendChild(actions);
          card.appendChild(row);

          const details = document.createElement('div');
          details.className = 'endpoint-details';
          details.innerHTML = \`
            <p style="font-size: 12px; color: var(--text-main); margin-bottom: 6px;"><strong>Mô tả:</strong> \${item.desc}</p>
            <p style="font-size: 11px; color: var(--text-soft); font-family: var(--font-mono);">Path: \${item.path} | Auth: \${item.auth}</p>
          \`;
          card.appendChild(details);

          section.appendChild(card);
        });

        container.appendChild(section);
      });
    }

    function filterEndpoints() {
      const q = document.getElementById('search-box').value.toLowerCase();
      const m = document.getElementById('method-filter').value;
      const a = document.getElementById('auth-filter').value;

      const filtered = ENDPOINTS.filter(item => {
        const matchQ = item.path.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q);
        const matchM = m === 'ALL' || item.method === m;
        const matchA = a === 'ALL' || item.auth.includes(a);
        return matchQ && matchM && matchA;
      });

      renderEndpoints(filtered);
    }

    function setRunner(path, method, body) {
      document.getElementById('run-path').value = path;
      document.getElementById('run-method').value = method;
      document.getElementById('run-body').value = body ? JSON.stringify(body, null, 2) : '{}';
      switchTab('explorer');
    }

    async function sendLiveRequest() {
      const path = document.getElementById('run-path').value;
      const method = document.getElementById('run-method').value;
      const bodyText = document.getElementById('run-body').value;
      const token = document.getElementById('active-token-input').value;
      const pre = document.getElementById('res-output-pre');
      const statusPill = document.getElementById('res-status-code');
      const timeSpan = document.getElementById('res-time');

      pre.innerText = '// Đang gửi yêu cầu tới Cloudflare Edge D1...';
      statusPill.className = 'res-status-pill badge-info';
      statusPill.innerText = 'Đang xử lý';

      const headers = { 'Content-Type': 'application/json' };
      if (token && token.trim() !== '') {
        headers['Authorization'] = 'Bearer ' + token.trim();
      }

      const options = { method, headers };
      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim() !== '') {
        try {
          JSON.parse(bodyText);
          options.body = bodyText;
        } catch (e) {
          pre.innerText = 'Lỗi cú pháp JSON trong Request Body: ' + e.message;
          statusPill.className = 'res-status-pill badge-danger';
          statusPill.innerText = '400 Bad JSON';
          return;
        }
      }

      const t0 = performance.now();
      try {
        const res = await fetch(path, options);
        const t1 = performance.now();
        const duration = Math.round(t1 - t0);
        timeSpan.innerText = duration + 'ms';

        const statusClass = res.ok ? 'badge-success' : 'badge-danger';
        statusPill.className = 'res-status-pill ' + statusClass;
        statusPill.innerText = res.status + ' ' + res.statusText;

        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          pre.innerText = JSON.stringify(json, null, 2);
        } else {
          const text = await res.text();
          pre.innerText = text.slice(0, 1500);
        }
      } catch (err) {
        timeSpan.innerText = '0ms';
        statusPill.className = 'res-status-pill badge-danger';
        statusPill.innerText = 'Network Error';
        pre.innerText = 'Lỗi kết nối mạng: ' + err.message;
      }
    }

    async function loadOpenApiSpec() {
      try {
        const res = await fetch('/openapi.json');
        const spec = await res.json();
        document.getElementById('openapi-pre').innerText = JSON.stringify(spec, null, 2);
      } catch (e) {
        document.getElementById('openapi-pre').innerText = 'Không thể nạp OpenAPI Spec: ' + e.message;
      }
    }

    async function fetchLiveAuditLogs() {
      const pre = document.getElementById('audit-log-pre');
      pre.innerText = '// Đang nạp nhật ký kiểm toán từ D1...';
      try {
        const token = tokenCache['admin'] || '';
        const res = await fetch('/api/v1/audit-logs', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (res.ok) {
          const json = await res.json();
          pre.innerText = JSON.stringify(json, null, 2);
        } else {
          pre.innerText = 'Yêu cầu quyền Quản trị viên (Admin) để xem toàn bộ Audit Logs. Vui lòng chọn Role: Quản Trị Viên.';
        }
      } catch (e) {
        pre.innerText = 'Lỗi nạp Audit Logs: ' + e.message;
      }
    }

    function copyJsonResult() {
      const text = document.getElementById('res-output-pre').innerText;
      navigator.clipboard.writeText(text);
      alert('Đã sao chép phản hồi JSON vào clipboard!');
    }

    function copyOpenApiSpec() {
      const text = document.getElementById('openapi-pre').innerText;
      navigator.clipboard.writeText(text);
      alert('Đã sao chép OpenAPI Spec vào clipboard!');
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      renderEndpoints(ENDPOINTS);
    });
  </script>
</body>
</html>`;
}
