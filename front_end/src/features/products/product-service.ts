import { apiRequest } from '../../services/api'

export interface Product {
  id: number
  sku: string
  name: string
  unit: string
  is_active: number
  created_at: string
  updated_at: string | null
}

export interface ProductInput {
  sku: string
  name: string
  unit: string
  is_active?: number
}

interface ProductListResponse {
  data: Product[]
  total_data: number
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await apiRequest<ProductListResponse>('/products/')
  return response.data
}

export function createProduct(data: ProductInput): Promise<Product> {
  return apiRequest<Product>('/products/', {
    method: 'POST',
    body: JSON.stringify({ ...data, is_active: 1 }),
  })
}

export function updateProduct(id: number, data: Partial<ProductInput>): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deactivateProduct(id: number): Promise<{ message: string; id: number }> {
  return apiRequest<{ message: string; id: number }>(`/products/${id}/deactivate`, {
    method: 'PATCH',
  })
}
