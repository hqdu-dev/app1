import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Package, Search, Plus, Pencil, Trash2,
  RefreshCw, Menu, X, Boxes, Activity, AlertCircle,
  CheckCircle2, ChevronRight, LogOut, LockKeyhole
} from 'lucide-react';
import { api, auth } from './api';

const money = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
}).format(Number(value || 0));

function App() {
  const [currentUser, setCurrentUser] = useState(() => auth.getUser());
  const [page, setPage] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  const roles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  const isAdmin = roles.includes('admin');
  const canReadProducts = permissions.includes('products.read');
  const canCreateProducts = permissions.includes('products.create');
  const canUpdateProducts = permissions.includes('products.update');
  const canDeleteProducts = permissions.includes('products.delete');

  // Tạm thời quyền quản lý Users chỉ dành cho Admin.
  const canManageUsers = isAdmin;

  function handleUnauthorized(error) {
    if (error.status === 401) {
      auth.logout();
      setCurrentUser(null);
      setUsers([]);
      setProducts([]);
      setPage('dashboard');
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return true;
    }
    return false;
  }

  async function loadAll() {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const tasks = [
        canManageUsers ? api.getUsers() : Promise.resolve([]),
        canReadProducts ? api.getProducts() : Promise.resolve([])
      ];

      const [u, p] = await Promise.all(tasks);

      setUsers(Array.isArray(u) ? u : (u?.users || u?.data || []));
      setProducts(Array.isArray(p) ? p : (p?.products || p?.data || []));
    } catch (e) {
      if (!handleUnauthorized(e)) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPageData() {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      if (page === 'users' && canManageUsers) {
        const result = await api.getUsers();
        setUsers(Array.isArray(result) ? result : (result?.users || result?.data || []));
      }

      if (page === 'products' && canReadProducts) {
        const result = await api.getProducts();
        setProducts(Array.isArray(result) ? result : (result?.products || result?.data || []));
      }
    } catch (e) {
      if (!handleUnauthorized(e)) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentUser) return;

    if (page === 'dashboard') loadAll();
    else loadPageData();
  }, [page, currentUser]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  }

  async function handleLogin(email, password) {
    const result = await api.login({ email, password });

    const token = result?.token || result?.data?.token;
    const user = result?.user || result?.data?.user;

    if (!token || !user) {
      throw new Error(
        'Backend chưa trả về đủ token và user (roles, permissions).'
      );
    }

    auth.save(token, user);
    setCurrentUser(user);
    setPage('dashboard');
    setError('');
  }

  function handleLogout() {
    auth.logout();
    setCurrentUser(null);
    setUsers([]);
    setProducts([]);
    setPage('dashboard');
    setSearch('');
    setModal(null);
    setError('');
    setNotice('');
  }

  function navigate(nextPage) {
    if (nextPage === 'users' && !canManageUsers) return;
    if (nextPage === 'products' && !canReadProducts) return;

    setPage(nextPage);
    setSearch('');
    setError('');
    setMobileNav(false);
  }

  async function saveRecord(form) {
    if (!modal) return;

    const isUser = modal.type === 'user';
    const action = modal.mode;
    const id = modal.record?.id;

    try {
      if (isUser) {
        if (!canManageUsers) throw new Error('Bạn không có quyền quản lý người dùng.');

        if (action === 'create') {
          await api.createUser({ name: form.name, email: form.email });
        } else {
          await api.updateUser(id, { name: form.name, email: form.email });
        }
      } else {
        if (action === 'create' && !canCreateProducts) {
          throw new Error('Bạn không có quyền thêm sản phẩm.');
        }

        if (action === 'edit' && !canUpdateProducts) {
          throw new Error('Bạn không có quyền sửa sản phẩm.');
        }

        if (action === 'create') {
          await api.createProduct({ name: form.name, price: Number(form.price) });
        } else {
          await api.updateProduct(id, { name: form.name, price: Number(form.price) });
        }
      }

      setModal(null);
      await loadPageData();
      showNotice(action === 'create'
        ? 'Đã tạo dữ liệu thành công.'
        : 'Đã cập nhật dữ liệu.');
    } catch (e) {
      if (!handleUnauthorized(e)) setError(e.message);
    }
  }

  async function deleteRecord(type, record) {
    const allowed = type === 'user'
      ? canManageUsers
      : canDeleteProducts;

    if (!allowed) {
      setError('Bạn không có quyền xóa dữ liệu.');
      return;
    }

    if (!window.confirm(
      `Bạn chắc chắn muốn xóa ${type === 'user' ? 'người dùng' : 'sản phẩm'} "${record.name}"?`
    )) return;

    try {
      if (type === 'user') await api.deleteUser(record.id);
      else await api.deleteProduct(record.id);

      await loadPageData();
      showNotice('Đã xóa dữ liệu.');
    } catch (e) {
      if (!handleUnauthorized(e)) setError(e.message);
    }
  }

  const filteredUsers = useMemo(() => users.filter(x =>
    `${x.name || ''} ${x.email || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const filteredProducts = useMemo(() => products.filter(x =>
    `${x.name || ''} ${x.id || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const nav = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    ...(canManageUsers
      ? [{ id: 'users', label: 'Người dùng', icon: Users }]
      : []),
    ...(canReadProducts
      ? [{ id: 'products', label: 'Sản phẩm', icon: Package }]
      : [])
  ];

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} initialError={error} />;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Boxes size={22}/></div>
        <div><b>APP1</b><small>ADMIN CONSOLE</small></div>
        <button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav>
        {nav.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={18}/>
            <span>{item.label}</span>
            {page === item.id && <ChevronRight size={16} className="nav-arrow"/>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <span className="status-dot"></span>
        <div><b>App1 Backend</b><small>API · localhost:3003</small></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu/></button>

        <div className="breadcrumb">
          Workspace <span>/</span> <b>{nav.find(x => x.id === page)?.label}</b>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <b>{currentUser.name || currentUser.email}</b>
            <div style={{ color: '#777' }}>{roles.join(', ')}</div>
          </div>

          <button className="refresh-btn" onClick={loadPageData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''}/>
            <span>Làm mới</span>
          </button>

          <button className="refresh-btn" onClick={handleLogout}>
            <LogOut size={16}/>
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">APP1 MANAGEMENT</div>
            <h1>
              {page === 'dashboard'
                ? 'Tổng quan'
                : page === 'users' ? 'Người dùng' : 'Sản phẩm'}
            </h1>
            <p>Quản lý dữ liệu App1 từ một nơi.</p>
          </div>

          {page === 'users' && canManageUsers && (
            <button
              className="primary-btn"
              onClick={() => setModal({ type: 'user', mode: 'create' })}
            >
              <Plus size={17}/> Thêm người dùng
            </button>
          )}

          {page === 'products' && canCreateProducts && (
            <button
              className="primary-btn"
              onClick={() => setModal({ type: 'product', mode: 'create' })}
            >
              <Plus size={17}/> Thêm sản phẩm
            </button>
          )}
        </div>

        {error && (
          <div className="alert error">
            <AlertCircle size={18}/>
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={16}/></button>
          </div>
        )}

        {notice && (
          <div className="alert success">
            <CheckCircle2 size={18}/>{notice}
          </div>
        )}

        {page === 'dashboard' && (
          <Dashboard
            users={users}
            products={products}
            loading={loading}
            canManageUsers={canManageUsers}
            canReadProducts={canReadProducts}
            onUsers={() => navigate('users')}
            onProducts={() => navigate('products')}
            onRefresh={loadAll}
          />
        )}

        {page === 'users' && canManageUsers && (
          <DataPanel
            title="Danh sách người dùng"
            count={filteredUsers.length}
            search={search}
            setSearch={setSearch}
            loading={loading}
            empty="Chưa có người dùng."
            onAdd={() => setModal({ type: 'user', mode: 'create' })}
          >
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>HỌ TÊN</th><th>EMAIL</th>
                  <th className="right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(row => (
                  <tr key={row.id}>
                    <td><span className="id-tag">#{row.id}</span></td>
                    <td>
                      <div className="person">
                        <div className="avatar">
                          {(row.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <b>{row.name}</b>
                      </div>
                    </td>
                    <td className="muted">{row.email}</td>
                    <td className="right">
                      <RowActions
                        onEdit={() => setModal({
                          type: 'user', mode: 'edit', record: row
                        })}
                        onDelete={() => deleteRecord('user', row)}
                        canEdit={canManageUsers}
                        canDelete={canManageUsers}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataPanel>
        )}

        {page === 'products' && canReadProducts && (
          <DataPanel
            title="Danh sách sản phẩm"
            count={filteredProducts.length}
            search={search}
            setSearch={setSearch}
            loading={loading}
            empty="Chưa có sản phẩm."
            onAdd={canCreateProducts
              ? () => setModal({ type: 'product', mode: 'create' })
              : null}
          >
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>TÊN SẢN PHẨM</th><th>GIÁ</th>
                  <th className="right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(row => (
                  <tr key={row.id}>
                    <td><span className="id-tag">#{row.id}</span></td>
                    <td>
                      <div className="person">
                        <div className="product-icon"><Package size={17}/></div>
                        <b>{row.name}</b>
                      </div>
                    </td>
                    <td className="price">{money(row.price)}</td>
                    <td className="right">
                      <RowActions
                        onEdit={() => setModal({
                          type: 'product', mode: 'edit', record: row
                        })}
                        onDelete={() => deleteRecord('product', row)}
                        canEdit={canUpdateProducts}
                        canDelete={canDeleteProducts}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataPanel>
        )}
      </section>

      <footer>APP1 ADMIN <span>•</span> React + Express + PostgreSQL</footer>
    </main>

    {modal && (
      <RecordModal
        modal={modal}
        onClose={() => setModal(null)}
        onSave={saveRecord}
      />
    )}
  </div>;
}

function LoginScreen({ onLogin, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await onLogin(email.trim(), password);
    } catch (e) {
      setError(e.message || 'Đăng nhập thất bại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
      background: 'linear-gradient(135deg, #eef2ff, #f8fafc)'
    }}>
      <form onSubmit={submit} style={{
        width: '100%',
        maxWidth: 420,
        boxSizing: 'border-box',
        padding: 36,
        borderRadius: 18,
        background: '#fff',
        boxShadow: '0 16px 50px rgba(15, 23, 42, .10)'
      }}>
        <div style={{
          width: 52,
          height: 52,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 14,
          color: '#fff',
          background: '#4f46e5',
          marginBottom: 22
        }}>
          <Boxes size={27}/>
        </div>

        <div style={{
          color: '#64748b',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2
        }}>
          APP1 MANAGEMENT
        </div>

        <h1 style={{ margin: '8px 0', fontSize: 28, color: '#0f172a' }}>
          Đăng nhập
        </h1>

        <p style={{ color: '#64748b', marginBottom: 26 }}>
          Đăng nhập để tiếp tục sử dụng hệ thống.
        </p>

        {error && (
          <div style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <label style={{
          display: 'block',
          marginBottom: 7,
          fontWeight: 600,
          color: '#334155'
        }}>
          Email
        </label>

        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          style={loginInputStyle}
        />

        <label style={{
          display: 'block',
          margin: '18px 0 7px',
          fontWeight: 600,
          color: '#334155'
        }}>
          Mật khẩu
        </label>

        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          style={loginInputStyle}
        />

        <button type="submit" disabled={busy} style={{
          width: '100%',
          border: 0,
          borderRadius: 9,
          padding: 14,
          marginTop: 24,
          color: '#fff',
          background: busy ? '#818cf8' : '#4f46e5',
          fontSize: 15,
          fontWeight: 700,
          cursor: busy ? 'wait' : 'pointer'
        }}>
          {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div style={{
          marginTop: 22,
          color: '#94a3b8',
          fontSize: 12,
          textAlign: 'center'
        }}>
          <LockKeyhole size={13} style={{
            verticalAlign: 'middle',
            marginRight: 5
          }}/>
          Kết nối bảo mật với App1 Backend
        </div>
      </form>
    </div>
  );
}

const loginInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 13,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  outline: 'none',
  fontSize: 14
};

function Dashboard({
  users, products, loading, canManageUsers, canReadProducts,
  onUsers, onProducts, onRefresh
}) {
  return (
    <div className="dashboard">
      <div className="welcome-card">
        <div>
          <div className="eyebrow light">CONTROL CENTER</div>
          <h2>Chào mừng đến với App1</h2>
          <p>Theo dõi và quản lý dữ liệu trong hệ thống.</p>
          <button className="light-btn" onClick={onRefresh}>
            <RefreshCw size={16}/> Cập nhật dữ liệu
          </button>
        </div>
        <div className="welcome-art">
          <div className="art-ring ring-one"></div>
          <div className="art-ring ring-two"></div>
          <Boxes size={66}/>
        </div>
      </div>

      <div className="stat-grid">
        {canManageUsers && (
          <StatCard
            icon={Users}
            label="Tổng người dùng"
            value={loading ? '—' : users.length}
            note="Dữ liệu từ API /users"
            tone="blue"
          />
        )}

        {canReadProducts && (
          <StatCard
            icon={Package}
            label="Tổng sản phẩm"
            value={loading ? '—' : products.length}
            note="Dữ liệu từ API /products"
            tone="purple"
          />
        )}

        <StatCard
          icon={Activity}
          label="Trạng thái ứng dụng"
          value="API"
          note="Kết nối qua Backend"
          tone="green"
        />
      </div>

      <div className="quick-grid">
        {canManageUsers && (
          <button className="quick-card" onClick={onUsers}>
            <div className="quick-icon blue-bg"><Users/></div>
            <div>
              <b>Quản lý người dùng</b>
              <small>Xem, thêm, sửa và xóa tài khoản</small>
            </div>
            <ChevronRight/>
          </button>
        )}

        {canReadProducts && (
          <button className="quick-card" onClick={onProducts}>
            <div className="quick-icon purple-bg"><Package/></div>
            <div>
              <b>Quản lý sản phẩm</b>
              <small>Xem và thao tác theo quyền được cấp</small>
            </div>
            <ChevronRight/>
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20}/></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function DataPanel({
  title, count, search, setSearch, loading, empty, onAdd, children
}) {
  const hasRows = count > 0;

  return (
    <div className="data-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <span>{count} bản ghi</span>
        </div>

        <div className="table-tools">
          <div className="search-box">
            <Search size={16}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
            />
          </div>

          {onAdd && (
            <button className="small-add" onClick={onAdd}>
              <Plus size={16}/><span>Thêm mới</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spin"/> Đang tải dữ liệu...
        </div>
      ) : hasRows ? (
        <div className="table-wrap">{children}</div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><Package size={25}/></div>
          <b>{empty}</b>
          <span>Kiểm tra kết nối Backend hoặc tạo dữ liệu mới.</span>
        </div>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete, canEdit, canDelete }) {
  if (!canEdit && !canDelete) {
    return <span className="muted">Không có thao tác</span>;
  }

  return (
    <div className="row-actions">
      {canEdit && (
        <button title="Sửa" onClick={onEdit}><Pencil size={16}/></button>
      )}
      {canDelete && (
        <button
          title="Xóa"
          className="delete-action"
          onClick={onDelete}
        >
          <Trash2 size={16}/>
        </button>
      )}
    </div>
  );
}

function RecordModal({ modal, onClose, onSave }) {
  const record = modal.record || {};
  const [name, setName] = useState(record.name || '');
  const [email, setEmail] = useState(record.email || '');
  const [price, setPrice] = useState(record.price ?? '');
  const [busy, setBusy] = useState(false);

  const isUser = modal.type === 'user';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);

    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        price
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">APP1 DATA</div>
            <h2>
              {modal.mode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
              {' '}{isUser ? 'người dùng' : 'sản phẩm'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
          >
            <X/>
          </button>
        </div>

        <label>
          Tên {isUser ? 'người dùng' : 'sản phẩm'}
          <input
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isUser ? 'Ví dụ: Nguyễn Văn An' : 'Ví dụ: Laptop Dell'}
          />
        </label>

        {isUser ? (
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </label>
        ) : (
          <label>
            Giá (VND)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="15000000"
            />
          </label>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Hủy
          </button>
          <button className="primary-btn" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu dữ liệu'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;