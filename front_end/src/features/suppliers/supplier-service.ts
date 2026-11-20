import { apiRequest } from '../../services/api'

export interface Supplier {
  id: number
  company_name: string
  name: string
  email: string
  phone: string
  address: string
  is_active: number
  created_at: string
  updated_at: string | null
}

export interface SupplierInput {
  company_name: string
  name: string
  email: string
  phone: string
  address: string
  is_active?: number
}

interface SupplierListResponse {
  data: Supplier[]
  total_data: number
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await apiRequest<SupplierListResponse>('/suppliers/')
  return response.data
}

export function createSupplier(data: SupplierInput): Promise<Supplier> {
  return apiRequest<Supplier>('/suppliers/', {
    method: 'POST',
    body: JSON.stringify({ ...data, is_active: 1 }),
  })
}

export function updateSupplier(id: number, data: Partial<SupplierInput>): Promise<Supplier> {
  return apiRequest<Supplier>(`/suppliers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deactivateSupplier(id: number): Promise<{ message: string; id: number }> {
  return apiRequest<{ message: string; id: number }>(`/suppliers/${id}/deactivate`, {
    method: 'PATCH',
  })
}