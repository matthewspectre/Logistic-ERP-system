import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createInventory,
  deleteInventory,
  fetchInventory,
  fetchProductOptions,
  fetchWarehouseOptions,
  updateInventory,
} from './inventory-service'
import type { Inventory, InventoryInput, OptionItem } from './inventory-service'

const emptyForm: InventoryInput = { product_id: 0, warehouse_id: 0, stock: 0 }

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}

function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [productOptions, setProductOptions] = useState<OptionItem[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<OptionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const [form, setForm] = useState<InventoryInput>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchInventory(), fetchProductOptions(), fetchWarehouseOptions()])
      .then(([inventoryResult, productResult, warehouseResult]) => {
        if (!active) return
        setInventory(inventoryResult)
        setProductOptions(productResult)
        setWarehouseOptions(warehouseResult)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  async function loadInventory() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setInventory(await fetchInventory())
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredInventory = inventory.filter((item) =>
    [item.product_name, item.warehouse_name]
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
  )

  const totalStock = inventory.reduce((total, item) => total + item.stock, 0)
  const lowStockCount = inventory.filter((item) => item.stock <= 10).length

  function openCreateForm() {
    setEditingInventory(null)
    setForm(emptyForm)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditForm(item: Inventory) {
    setEditingInventory(item)
    setForm({ product_id: item.product_id, warehouse_id: item.warehouse_id, stock: item.stock })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    try {
      if (editingInventory) {
        await updateInventory(editingInventory.id, form)
        setNotice('Data inventory berhasil diperbarui.')
      } else {
        await createInventory(form)
        setNotice('Inventory berhasil ditambahkan.')
      }
      setIsModalOpen(false)
      await loadInventory()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(item: Inventory) {
    if (!window.confirm(`Hapus inventory ${item.product_name} di ${item.warehouse_name}?`)) return

    setNotice('')
    setErrorMessage('')
    try {
      await deleteInventory(item.id)
      setNotice(`Inventory ${item.product_name} berhasil dihapus.`)
      await loadInventory()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <section className="inventory-page" aria-labelledby="inventory-title">
      <div className="suppliers-toolbar">
        <div>
          <p className="suppliers-eyebrow">STOK OPERASIONAL</p>
          <h2 id="inventory-title">Inventory</h2>
          <p className="suppliers-description">Pantau stok produk di setiap gudang.</p>
        </div>
        <button className="supplier-primary-button" onClick={openCreateForm} type="button">
          <span aria-hidden="true">+</span> Tambah inventory
        </button>
      </div>

      {notice && <p className="supplier-notice" role="status">{notice}</p>}
      {errorMessage && !isModalOpen && <p className="supplier-error-banner" role="alert">{errorMessage}</p>}

      <div className="supplier-summary inventory-summary" aria-label="Ringkasan inventory">
        <div><span>Total baris inventory</span><strong>{inventory.length}</strong></div>
        <div><span>Total stok</span><strong>{totalStock}</strong></div>
        <div><span>Stok rendah</span><strong>{lowStockCount}</strong></div>
      </div>

      <div className="supplier-directory">
        <div className="supplier-directory-header">
          <div>
            <h3>Daftar inventory</h3>
            <span>{filteredInventory.length} dari {inventory.length} lokasi stok</span>
          </div>
          <label className="supplier-search">
            <span aria-hidden="true">⌕</span>
            <span className="visually-hidden">Cari inventory</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk atau gudang"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div className="supplier-table-wrap">
          <table className="supplier-table inventory-table">
            <thead>
              <tr>
                <th>Product name</th>
                <th>Warehouse name</th>
                <th>Stock</th>
                <th><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="supplier-table-message" colSpan={4}>Memuat data inventory...</td></tr>
              ) : filteredInventory.length ? filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td><strong className="supplier-company">{item.product_name}</strong></td>
                  <td>{item.warehouse_name}</td>
                  <td>
                    <span className={item.stock <= 10 ? 'inventory-stock inventory-stock-low' : 'inventory-stock'}>
                      {item.stock}
                    </span>
                  </td>
                  <td>
                    <div className="supplier-row-actions">
                      <button onClick={() => openEditForm(item)} type="button">Edit</button>
                      <button onClick={() => void handleDelete(item)} type="button">Hapus</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="supplier-table-message" colSpan={4}>
                    {search ? 'Tidak ada inventory yang cocok dengan pencarian.' : 'Belum ada data inventory.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="supplier-modal-backdrop" role="presentation">
          <section aria-labelledby="inventory-form-title" aria-modal="true" className="supplier-modal" role="dialog">
            <header className="supplier-modal-header">
              <div>
                <p className="suppliers-eyebrow">STOK OPERASIONAL / INVENTORY</p>
                <h3 id="inventory-form-title">{editingInventory ? 'Edit inventory' : 'Tambah inventory'}</h3>
              </div>
              <button aria-label="Tutup form" className="supplier-modal-close" onClick={() => setIsModalOpen(false)} type="button">×</button>
            </header>

            <form className="supplier-form" onSubmit={handleSubmit}>
              <label>
                Product name <span>*</span>
                <select
                  autoFocus
                  disabled={Boolean(editingInventory)}
                  onChange={(event) => setForm({ ...form, product_id: Number(event.target.value) })}
                  required
                  value={form.product_id || ''}
                >
                  <option value="" disabled>Pilih produk</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Warehouse name <span>*</span>
                <select
                  onChange={(event) => setForm({ ...form, warehouse_id: Number(event.target.value) })}
                  required
                  value={form.warehouse_id || ''}
                >
                  <option value="" disabled>Pilih gudang</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </label>

              <label className="supplier-form-wide">
                Stock <span>*</span>
                <input
                  min={0}
                  onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}
                  required
                  type="number"
                  value={form.stock}
                />
              </label>

              {errorMessage && <p className="form-error supplier-form-wide" role="alert">{errorMessage}</p>}

              <footer className="supplier-form-actions supplier-form-wide">
                <button className="supplier-secondary-button" onClick={() => setIsModalOpen(false)} type="button">Batal</button>
                <button className="supplier-primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Menyimpan...' : editingInventory ? 'Simpan perubahan' : 'Simpan inventory'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default InventoryPage
