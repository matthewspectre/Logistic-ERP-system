import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createProduct,
  deactivateProduct,
  fetchProducts,
  updateProduct,
} from './product-service'
import type { Product, ProductInput } from './product-service'

const emptyForm: ProductInput = { sku: '', name: '', unit: '', is_active: 1 }

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductInput>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    fetchProducts()
      .then((result) => { if (active) setProducts(result) })
      .catch((error: unknown) => { if (active) setErrorMessage(getErrorMessage(error)) })
      .finally(() => { if (active) setIsLoading(false) })

    return () => { active = false }
  }, [])

  async function loadProducts() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setProducts(await fetchProducts())
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredProducts = products.filter((product) =>
    product.name.toLocaleLowerCase().includes(normalizedSearch),
  )

  function openCreateForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setForm({ sku: product.sku, name: product.name, unit: product.unit, is_active: product.is_active })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          sku: form.sku,
          name: form.name,
          unit: form.unit,
          is_active: 1,
        })
        setNotice('Data produk berhasil diperbarui.')
      } else {
        await createProduct(form)
        setNotice('Produk berhasil ditambahkan.')
      }
      setIsModalOpen(false)
      await loadProducts()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate(product: Product) {
    if (!window.confirm(`Nonaktifkan produk ${product.name}?`)) return

    setNotice('')
    setErrorMessage('')
    try {
      await deactivateProduct(product.id)
      setNotice(`${product.name} berhasil dinonaktifkan.`)
      await loadProducts()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <section className="products-page" aria-labelledby="products-title">
      <div className="suppliers-toolbar">
        <div>
          <p className="suppliers-eyebrow">DATA MASTER</p>
          <h2 id="products-title">Produk</h2>
          <p className="suppliers-description">Kelola nama produk dan status ketersediaannya.</p>
        </div>
        <button className="supplier-primary-button" onClick={openCreateForm} type="button">
          <span aria-hidden="true">+</span> Tambah produk
        </button>
      </div>

      {notice && <p className="supplier-notice" role="status">{notice}</p>}
      {errorMessage && !isModalOpen && <p className="supplier-error-banner" role="alert">{errorMessage}</p>}

      <div className="supplier-summary product-summary" aria-label="Ringkasan produk">
        <div><span>Produk aktif</span><strong>{products.length}</strong></div>
        <div><span>Ditampilkan</span><strong>{filteredProducts.length}</strong></div>
      </div>

      <div className="supplier-directory">
        <div className="supplier-directory-header">
          <div>
            <h3>Daftar produk</h3>
            <span>{filteredProducts.length} dari {products.length} data aktif</span>
          </div>
          <label className="supplier-search">
            <span aria-hidden="true">⌕</span>
            <span className="visually-hidden">Cari produk</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama produk"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div className="supplier-table-wrap">
          <table className="supplier-table products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status aktif</th>
                <th>Created at</th>
                <th><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="supplier-table-message" colSpan={4}>Memuat data produk...</td></tr>
              ) : filteredProducts.length ? filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><strong className="supplier-company">{product.name}</strong></td>
                  <td>
                    <span className="supplier-status"><i /> Aktif</span>
                  </td>
                  <td>{formatDate(product.created_at)}</td>
                  <td>
                    <div className="supplier-row-actions">
                      <button onClick={() => openEditForm(product)} type="button">Edit</button>
                      <button onClick={() => void handleDeactivate(product)} type="button">Nonaktifkan</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="supplier-table-message" colSpan={4}>
                    {search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk aktif.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="supplier-modal-backdrop" role="presentation">
          <section aria-labelledby="product-form-title" aria-modal="true" className="supplier-modal" role="dialog">
            <header className="supplier-modal-header">
              <div>
                <p className="suppliers-eyebrow">DATA MASTER / PRODUK</p>
                <h3 id="product-form-title">{editingProduct ? 'Edit produk' : 'Tambah produk'}</h3>
              </div>
              <button aria-label="Tutup form" className="supplier-modal-close" onClick={() => setIsModalOpen(false)} type="button">×</button>
            </header>

            <form className="supplier-form" onSubmit={handleSubmit}>
              <label>
                SKU <span>*</span>
                <input
                  autoFocus
                  onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  required
                  value={form.sku}
                />
              </label>
              <label>
                Name <span>*</span>
                <input
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  value={form.name}
                />
              </label>
              <label className="supplier-form-wide">
                Unit <span>*</span>
                <input
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  required
                  value={form.unit}
                  placeholder="Contoh: pcs, box, kg"
                />
              </label>

              {errorMessage && <p className="form-error supplier-form-wide" role="alert">{errorMessage}</p>}

              <footer className="supplier-form-actions supplier-form-wide">
                <button className="supplier-secondary-button" onClick={() => setIsModalOpen(false)} type="button">Batal</button>
                <button className="supplier-primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Menyimpan...' : editingProduct ? 'Simpan perubahan' : 'Simpan produk'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default ProductsPage
