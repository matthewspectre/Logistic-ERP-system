import { useEffect, useState } from 'react'
import type { AuthSession } from '../auth/types'
import SuppliersPage from '../suppliers/SuppliersPage'
import { fetchDashboardData } from './dashboard-service'

interface DashboardPageProps {
  session: AuthSession
  onLogout: () => void
}

interface DashboardData {
  inventory: { data: Array<{ product_name: string; warehouse_name: string; stock: number }> }
  requests: { data: Array<{ id: number; request_number: string; warehouse_name: string; status: string; created_at: string }> }
  orders: { data: Array<{ id: number; po_number: string; supplier_name: string; warehouse_name: string; status: string }> }
  receipts: { data: Array<{ id: number; receipt_number: string; status: string }> }
  movements: { data: Array<{ id: number; movement_type: string; quantity: number; reference: string; created_at: string }> }
}

const navigation = [
  { label: 'Ringkasan', key: 'summary', icon: '01' },
  { label: 'Produk', key: 'products', icon: '02' },
  { label: 'Supplier', key: 'suppliers', icon: '03' },
  { label: 'Inventori', key: 'inventory', icon: '04' },
  { label: 'Permintaan', key: 'requests', icon: '05' },
  { label: 'Pesanan', key: 'orders', icon: '06' },
  { label: 'Penerimaan', key: 'receipts', icon: '07' },
]

const statusClass: Record<string, string> = {
  APPROVED: 'status-active',
  ORDERED: 'status-active',
  RECEIVED: 'status-active',
  POSTED: 'status-active',
  PARTIALLY_RECEIVED: 'status-review',
  SUBMITTED: 'status-review',
  DRAFT: 'status-neutral',
  REJECTED: 'status-danger',
  CANCELLED: 'status-danger',
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const [activeNav, setActiveNav] = useState('summary')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    let active = true
    fetchDashboardData()
      .then((result) => {
        if (active) setData(result)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const inventoryCount = data?.inventory.data.length ?? 0
  const requestCount = data?.requests.data.length ?? 0
  const orderCount = data?.orders.data.length ?? 0
  const receiptCount = data?.receipts.data.length ?? 0
  const lowStockCount = data?.inventory.data.filter((item) => item.stock <= 10).length ?? 0

  const recentRequests = data?.requests.data.slice(0, 5) ?? []
  const recentOrders = data?.orders.data.slice(0, 5) ?? []

  return (
    <main className="dashboard-shell">
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="dashboard-brand" href="/" aria-label="InvenTrack">
          <span className="dashboard-mark" aria-hidden="true">IT</span>
          <span>InvenTrack</span>
        </a>

        <nav className="dashboard-nav" aria-label="Navigasi utama">
          <p className="nav-label">WORKSPACE</p>
          {navigation.map((item) => (
            <button
              className={`nav-item ${activeNav === item.key ? 'nav-item-active' : ''}`}
              key={item.key}
              onClick={() => {
                setActiveNav(item.key)
                setMobileNavOpen(false)
              }}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">
            {session.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="sidebar-user-copy">
            <strong>{session.user.name}</strong>
            <span>{session.user.role}</span>
          </div>
          <button className="logout-icon-button" onClick={onLogout} type="button" aria-label="Keluar">
            X
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          aria-label="Tutup navigasi"
          className="sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      )}

      <section className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileNavOpen(true)}
            type="button"
            aria-label="Buka navigasi"
          >
            Menu
          </button>
          <div>
            <p className="dashboard-eyebrow">OPERATIONS / {activeNav.toUpperCase()}</p>
            <h1>{navigation.find((item) => item.key === activeNav)?.label ?? 'Ringkasan'}</h1>
          </div>
          <div className="header-actions">
            <span className="sync-status"><i /> API terhubung</span>
            <button className="header-profile" type="button">
              <span>{session.user.name.slice(0, 1).toUpperCase()}</span>
              <span className="header-profile-copy">
                <strong>{session.user.name}</strong>
                <small>{session.user.role}</small>
              </span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {activeNav === 'suppliers' ? <SuppliersPage /> : loading ? (
            <div className="loading-grid" aria-label="Memuat ringkasan">
              {[1, 2, 3, 4].map((item) => <div className="loading-card" key={item} />)}
            </div>
          ) : (
            <>
              <section className="metric-grid" aria-label="Ringkasan operasional">
                <article className="metric-card">
                  <div className="metric-card-head"><span>STOK TERKINI</span><span className="metric-index">01</span></div>
                  <strong>{inventoryCount}</strong>
                  <p>Baris inventori aktif</p>
                  <small>{lowStockCount} item perlu perhatian</small>
                </article>
                <article className="metric-card">
                  <div className="metric-card-head"><span>PERMINTAAN</span><span className="metric-index">02</span></div>
                  <strong>{requestCount}</strong>
                  <p>Purchase request</p>
                  <small>Monitoring pengadaan</small>
                </article>
                <article className="metric-card">
                  <div className="metric-card-head"><span>PESANAN</span><span className="metric-index">03</span></div>
                  <strong>{orderCount}</strong>
                  <p>Purchase order</p>
                  <small>Status pembelian</small>
                </article>
                <article className="metric-card accent-card">
                  <div className="metric-card-head"><span>PENERIMAAN</span><span className="metric-index">04</span></div>
                  <strong>{receiptCount}</strong>
                  <p>Goods receipt</p>
                  <small>Barang diterima</small>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading">
                    <div><p>ALUR TERBARU</p><h2>Permintaan pembelian</h2></div>
                    <button type="button">Lihat semua</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Nomor</th><th>Gudang</th><th>Status</th><th>Tanggal</th></tr>
                      </thead>
                      <tbody>
                        {recentRequests.length ? recentRequests.map((request) => (
                          <tr key={request.id}>
                            <td><strong>{request.request_number}</strong></td>
                            <td>{request.warehouse_name || '-'}</td>
                            <td><span className={`status-badge ${statusClass[request.status] ?? 'status-neutral'}`}>{request.status}</span></td>
                            <td>{formatDate(request.created_at)}</td>
                          </tr>
                        )) : (
                          <tr><td className="empty-state" colSpan={4}>Belum ada permintaan pembelian.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel stock-panel">
                  <div className="panel-heading">
                    <div><p>PERHATIAN</p><h2>Stok rendah</h2></div>
                  </div>
                  <div className="stock-list">
                    {(data?.inventory.data.filter((item) => item.stock <= 10).slice(0, 5) ?? []).length ?
                      data?.inventory.data.filter((item) => item.stock <= 10).slice(0, 5).map((item) => (
                        <div className="stock-row" key={`${item.product_name}-${item.warehouse_name}`}>
                          <div><strong>{item.product_name}</strong><span>{item.warehouse_name}</span></div>
                          <b>{item.stock}</b>
                        </div>
                      )) : (
                        <div className="stock-empty">
                          <strong>Stok aman</strong>
                          <span>Tidak ada item dengan stok rendah.</span>
                        </div>
                      )}
                  </div>
                </article>

                <article className="panel order-panel">
                  <div className="panel-heading">
                    <div><p>PEMBELIAN</p><h2>Pesanan terbaru</h2></div>
                    <button type="button">Buka daftar</button>
                  </div>
                  <div className="order-list">
                    {recentOrders.length ? recentOrders.map((order) => (
                      <div className="order-row" key={order.id}>
                        <div className="order-code" aria-hidden="true">PO</div>
                        <div className="order-copy">
                          <strong>{order.po_number}</strong>
                          <span>{order.supplier_name} · {order.warehouse_name}</span>
                        </div>
                        <span className={`status-badge ${statusClass[order.status] ?? 'status-neutral'}`}>{order.status}</span>
                      </div>
                    )) : (
                      <div className="empty-state">Belum ada purchase order.</div>
                    )}
                  </div>
                </article>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
