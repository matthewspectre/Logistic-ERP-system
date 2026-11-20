import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createSupplier,
  deactivateSupplier,
  fetchSuppliers,
  updateSupplier,
} from './supplier-service'
import type { Supplier, SupplierInput } from './supplier-service'

const emptyForm: SupplierInput = {
  company_name: '',
  name: '',
  email: '',
  phone: '',
  address: '',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierInput>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')

  async function loadSuppliers() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      setSuppliers(await fetchSuppliers())
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchSuppliers()
      .then((result) => {
        if (active) setSuppliers(result)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredSuppliers = suppliers.filter((supplier) =>
    [supplier.company_name, supplier.name, supplier.email, supplier.phone, supplier.address]
      .some((value) => value?.toLocaleLowerCase().includes(normalizedSearch)),
  )
  const companiesCount = new Set(suppliers.map((supplier) => supplier.company_name)).size
  const contactCount = suppliers.filter((supplier) => supplier.phone).length

  function openCreateForm() {
    setEditingSupplier(null)
    setForm(emptyForm)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditForm(supplier: Supplier) {
    setEditingSupplier(supplier)
    setForm({
      company_name: supplier.company_name,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      is_active: supplier.is_active,
    })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    try {
      if (editingSupplier) {
        const updates: Partial<SupplierInput> = {
          company_name: form.company_name,
          name: form.name,
          email: form.email,
        }
        if (form.phone.trim()) updates.phone = form.phone
        if (form.address.trim()) updates.address = form.address
        await updateSupplier(editingSupplier.id, updates)
        setNotice('Data supplier berhasil diperbarui.')
      } else {
        await createSupplier(form)
        setNotice('Supplier berhasil ditambahkan.')
      }
      setIsModalOpen(false)
      await loadSuppliers()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivate(supplier: Supplier) {
    if (!window.confirm(`Nonaktifkan ${supplier.company_name}?`)) return

    setNotice('')
    setErrorMessage('')
    try {
      await deactivateSupplier(supplier.id)
      setNotice(`${supplier.company_name} berhasil dinonaktifkan.`)
      await loadSuppliers()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <section className="suppliers-page" aria-labelledby="suppliers-title">
      <div className="suppliers-toolbar">
        <div>
          <p className="suppliers-eyebrow">DATA MASTER</p>
          <h2 id="suppliers-title">Suppliers</h2>
          <p className="suppliers-description">Kelola perusahaan pemasok dan informasi kontaknya.</p>
        </div>
        <button className="supplier-primary-button" onClick={openCreateForm} type="button">
          <span aria-hidden="true">+</span> Tambah supplier
        </button>
      </div>

      {notice && <p className="supplier-notice" role="status">{notice}</p>}
      {errorMessage && !isModalOpen && <p className="supplier-error-banner" role="alert">{errorMessage}</p>}

      <div className="supplier-summary" aria-label="Ringkasan supplier">
        <div><span>Supplier aktif</span><strong>{suppliers.length}</strong></div>
        <div><span>Perusahaan terdaftar</span><strong>{companiesCount}</strong></div>
        <div><span>Kontak telepon tersedia</span><strong>{contactCount}</strong></div>
      </div>

      <div className="supplier-directory">
        <div className="supplier-directory-header">
          <div>
            <h3>Daftar supplier</h3>
            <span>{filteredSuppliers.length} dari {suppliers.length} data aktif</span>
          </div>
          <label className="supplier-search">
            <span aria-hidden="true">⌕</span>
            <span className="visually-hidden">Cari supplier</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari perusahaan atau kontak"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div className="supplier-table-wrap">
          <table className="supplier-table">
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>Kontak</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th>Status</th>
                <th>Terdaftar</th>
                <th><span className="visually-hidden">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="supplier-table-message" colSpan={7}>Memuat data supplier...</td></tr>
              ) : filteredSuppliers.length ? filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td><strong className="supplier-company">{supplier.company_name}</strong></td>
                  <td><span className="supplier-contact-name">{supplier.name}</span><span className="supplier-contact-email">{supplier.email}</span></td>
                  <td>{supplier.phone || '-'}</td>
                  <td className="supplier-address">{supplier.address || '-'}</td>
                  <td><span className="supplier-status"><i /> Aktif</span></td>
                  <td>{formatDate(supplier.created_at)}</td>
                  <td>
                    <div className="supplier-row-actions">
                      <button onClick={() => openEditForm(supplier)} type="button">Edit</button>
                      <button onClick={() => void handleDeactivate(supplier)} type="button">Nonaktifkan</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="supplier-table-message" colSpan={7}>
                    {search ? 'Tidak ada supplier yang cocok dengan pencarian.' : 'Belum ada supplier aktif.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="supplier-modal-backdrop" role="presentation">
          <section aria-labelledby="supplier-form-title" aria-modal="true" className="supplier-modal" role="dialog">
            <header className="supplier-modal-header">
              <div>
                <p className="suppliers-eyebrow">DATA MASTER / SUPPLIER</p>
                <h3 id="supplier-form-title">{editingSupplier ? 'Edit supplier' : 'Tambah supplier'}</h3>
              </div>
              <button aria-label="Tutup form" className="supplier-modal-close" onClick={() => setIsModalOpen(false)} type="button">×</button>
            </header>

            <form className="supplier-form" onSubmit={handleSubmit}>
              <label>
                Nama perusahaan <span>*</span>
                <input
                  autoFocus
                  onChange={(event) => setForm({ ...form, company_name: event.target.value })}
                  required
                  value={form.company_name}
                />
              </label>
              <label>
                Nama kontak <span>*</span>
                <input
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  value={form.name}
                />
              </label>
              <label>
                Email <span>*</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label>
                Telepon
                <input
                  autoComplete="tel"
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  type="tel"
                  value={form.phone}
                />
              </label>
              <label className="supplier-form-wide">
                Alamat
                <textarea
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  rows={3}
                  value={form.address}
                />
              </label>

              {errorMessage && <p className="form-error supplier-form-wide" role="alert">{errorMessage}</p>}

              <footer className="supplier-form-actions supplier-form-wide">
                <button className="supplier-secondary-button" onClick={() => setIsModalOpen(false)} type="button">Batal</button>
                <button className="supplier-primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Menyimpan...' : editingSupplier ? 'Simpan perubahan' : 'Simpan supplier'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default SuppliersPage