import { Fragment, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createPurchaseOrder,
  fetchPurchaseOrders,
  fetchPurchaseRequestOptions,
  fetchSupplierOptions,
  updatePurchaseOrderStatus,
} from './purchase-order-service'
import type { PurchaseOrder, PurchaseRequestOption, SupplierOption } from './purchase-order-service'

const statusOptions = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']

const statusClass: Record<string, string> = {
  DRAFT: 'status-neutral',
  ORDERED: 'status-active',
  PARTIALLY_RECEIVED: 'status-review',
  RECEIVED: 'status-active',
  CANCELLED: 'status-danger',
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially received',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}

function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [requests, setRequests] = useState<PurchaseRequestOption[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRequestID, setSelectedRequestID] = useState('')
  const [selectedSupplierID, setSelectedSupplierID] = useState('')
  const [expandedOrderID, setExpandedOrderID] = useState<number | null>(null)
  const [updatingOrderID, setUpdatingOrderID] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    fetchPurchaseOrders()
      .then((result) => { if (active) setOrders(result) })
      .catch((error: unknown) => { if (active) setErrorMessage(getErrorMessage(error)) })
      .finally(() => { if (active) setIsLoading(false) })

    return () => { active = false }
  }, [])

  async function loadOrders(status = statusFilter) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setOrders(await fetchPurchaseOrders(status))
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const existingRequestIDs = useMemo(
    () => new Set(orders.map((order) => order.purchase_request_id)),
    [orders],
  )
  const eligibleRequests = requests.filter((request) =>
    request.status === 'APPROVED' && !existingRequestIDs.has(request.id),
  )
  const filteredOrders = orders.filter((order) =>
    [order.po_number, order.supplier_name, order.warehouse_name, String(order.purchase_request_id)]
      .some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  )
  const itemCount = orders.reduce((total, order) => total + order.items.length, 0)
  const openCount = orders.filter((order) => ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(order.status)).length

  async function openCreateForm() {
    setErrorMessage('')
    setNotice('')
    setSelectedRequestID('')
    setSelectedSupplierID('')
    setIsOptionsLoading(true)
    setIsModalOpen(true)
    try {
      const [requestOptions, supplierOptions] = await Promise.all([
        fetchPurchaseRequestOptions(),
        fetchSupplierOptions(),
      ])
      setRequests(requestOptions)
      setSuppliers(supplierOptions)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsOptionsLoading(false)
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setErrorMessage('')
    try {
      const order = await createPurchaseOrder(Number(selectedRequestID), Number(selectedSupplierID))
      setOrders((current) => [order, ...current])
      setNotice(`Purchase order ${order.po_number} berhasil dibuat.`)
      setIsModalOpen(false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleStatusChange(order: PurchaseOrder, status: string) {
    setUpdatingOrderID(order.id)
    setErrorMessage('')
    setNotice('')
    try {
      const updatedOrder = await updatePurchaseOrderStatus(order.id, status)
      setOrders((current) => current.map((item) => item.id === order.id ? updatedOrder : item))
      setNotice(`Status ${order.po_number} diperbarui menjadi ${statusLabel[status]}.`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setUpdatingOrderID(null)
    }
  }

  return (
    <section className="purchase-orders-page" aria-labelledby="purchase-orders-title">
      <div className="suppliers-toolbar">
        <div>
          <p className="suppliers-eyebrow">PENGADAAN</p>
          <h2 id="purchase-orders-title">Purchase orders</h2>
          <p className="suppliers-description">Kelola pesanan yang dibuat dari purchase request yang disetujui.</p>
        </div>
        <button className="supplier-primary-button" onClick={() => void openCreateForm()} type="button">
          <span aria-hidden="true">+</span> Buat purchase order
        </button>
      </div>

      {notice && <p className="supplier-notice" role="status">{notice}</p>}
      {errorMessage && !isModalOpen && <p className="supplier-error-banner" role="alert">{errorMessage}</p>}

      <div className="supplier-summary po-summary" aria-label="Ringkasan purchase orders">
        <div><span>Total purchase order</span><strong>{orders.length}</strong></div>
        <div><span>Dalam proses</span><strong>{openCount}</strong></div>
        <div><span>Total baris produk</span><strong>{itemCount}</strong></div>
      </div>

      <div className="supplier-directory">
        <div className="supplier-directory-header po-directory-header">
          <div>
            <h3>Daftar pesanan</h3>
            <span>{filteredOrders.length} dari {orders.length} purchase order</span>
          </div>
          <div className="po-filters">
            <label className="supplier-search">
              <span aria-hidden="true">⌕</span>
              <span className="visually-hidden">Cari purchase order</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor, supplier, gudang"
                type="search"
                value={search}
              />
            </label>
            <label className="po-status-filter">
              <span className="visually-hidden">Filter status</span>
              <select
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  void loadOrders(event.target.value)
                }}
                value={statusFilter}
              >
                <option value="">Semua status</option>
                {statusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="supplier-table-wrap">
          <table className="supplier-table purchase-order-table">
            <thead>
              <tr>
                <th>Nomor PO</th>
                <th>Purchase request</th>
                <th>Supplier</th>
                <th>Gudang</th>
                <th>Item</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th><span className="visually-hidden">Detail</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="supplier-table-message" colSpan={8}>Memuat purchase order...</td></tr>
              ) : filteredOrders.length ? filteredOrders.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td><strong className="supplier-company">{order.po_number}</strong></td>
                    <td>#{order.purchase_request_id}</td>
                    <td>{order.supplier_name || '-'}</td>
                    <td>{order.warehouse_name || '-'}</td>
                    <td>{order.items.length} produk</td>
                    <td>
                      <select
                        aria-label={`Status ${order.po_number}`}
                        className={`po-status-select ${statusClass[order.status] ?? 'status-neutral'}`}
                        disabled={updatingOrderID === order.id}
                        onChange={(event) => void handleStatusChange(order, event.target.value)}
                        value={order.status}
                      >
                        {statusOptions.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
                      </select>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <button
                        aria-expanded={expandedOrderID === order.id}
                        aria-label={expandedOrderID === order.id ? 'Tutup detail item' : 'Lihat detail item'}
                        className="po-detail-button"
                        onClick={() => setExpandedOrderID((current) => current === order.id ? null : order.id)}
                        type="button"
                      >
                        {expandedOrderID === order.id ? 'Tutup' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrderID === order.id && (
                    <tr className="po-expanded-row" key={`${order.id}-items`}>
                      <td colSpan={8}>
                        <div className="po-items-detail">
                          {order.items.map((item) => (
                            <div className="po-item" key={item.id}>
                              <div><strong>{item.product_name}</strong><span>{item.unit}</span></div>
                              <span>{item.received_quantity} / {item.ordered_quantity} diterima</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )) : (
                <tr>
                  <td className="supplier-table-message" colSpan={8}>
                    {search || statusFilter ? 'Tidak ada purchase order yang cocok dengan filter.' : 'Belum ada purchase order.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="supplier-modal-backdrop" role="presentation">
          <section aria-labelledby="po-form-title" aria-modal="true" className="supplier-modal" role="dialog">
            <header className="supplier-modal-header">
              <div>
                <p className="suppliers-eyebrow">PENGADAAN / PURCHASE ORDER</p>
                <h3 id="po-form-title">Buat purchase order</h3>
              </div>
              <button aria-label="Tutup form" className="supplier-modal-close" onClick={() => setIsModalOpen(false)} type="button">×</button>
            </header>

            <form className="supplier-form" onSubmit={handleCreate}>
              {isOptionsLoading ? (
                <p className="supplier-form-wide">Memuat request dan supplier...</p>
              ) : (
                <>
                  <label className="supplier-form-wide">
                    Purchase request disetujui <span>*</span>
                    <select
                      onChange={(event) => setSelectedRequestID(event.target.value)}
                      required
                      value={selectedRequestID}
                    >
                      <option value="" disabled>Pilih purchase request</option>
                      {eligibleRequests.map((request) => (
                        <option key={request.id} value={request.id}>
                          {request.request_number} · {request.warehouse_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="supplier-form-wide">
                    Supplier <span>*</span>
                    <select
                      onChange={(event) => setSelectedSupplierID(event.target.value)}
                      required
                      value={selectedSupplierID}
                    >
                      <option value="" disabled>Pilih supplier</option>
                      {suppliers.filter((supplier) => supplier.is_active === 1).map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company_name} · {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!eligibleRequests.length && (
                    <p className="po-form-help supplier-form-wide">Belum ada purchase request berstatus APPROVED yang belum memiliki order.</p>
                  )}
                  {!suppliers.some((supplier) => supplier.is_active === 1) && (
                    <p className="po-form-help supplier-form-wide">Belum ada supplier aktif.</p>
                  )}
                </>
              )}

              {errorMessage && <p className="form-error supplier-form-wide" role="alert">{errorMessage}</p>}

              <footer className="supplier-form-actions supplier-form-wide">
                <button className="supplier-secondary-button" onClick={() => setIsModalOpen(false)} type="button">Batal</button>
                <button
                  className="supplier-primary-button"
                  disabled={isCreating || isOptionsLoading || !eligibleRequests.length || !suppliers.some((supplier) => supplier.is_active === 1)}
                  type="submit"
                >
                  {isCreating ? 'Membuat order...' : 'Buat purchase order'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default PurchaseOrdersPage
