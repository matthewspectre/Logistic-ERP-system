import { apiRequest } from '../../services/api'

export interface Inventory {
  id: number
  product_id: number
  product_name: string
  warehouse_id: number
  warehouse_name: string
  stock: number
  created_at: string
  updated_at: string | null
}

export interface InventoryInput {
  product_id: number
  warehouse_id: number
  stock: number
}

export interface OptionItem {
  id: number
  name: string
}

interface InventoryListResponse {
  data: Inventory[]
  total_data: number
}

interface OptionListResponse<T> {
  data: T[]
  total_data: number
}

export async function fetchInventory(): Promise<Inventory[]> {
  const response = await apiRequest<InventoryListResponse>('/inventories/')
  return response.data
}

export async function fetchProductOptions(): Promise<OptionItem[]> {
  const response = await apiRequest<OptionListResponse<{ id: number; name: string }>>('/products/')
  return response.data.map((product) => ({ id: product.id, name: product.name }))
}

export async function fetchWarehouseOptions(): Promise<OptionItem[]> {
  const response = await apiRequest<OptionListResponse<{ id: number; name: string }>>('/warehouses/')
  return response.data.map((warehouse) => ({ id: warehouse.id, name: warehouse.name }))
}

export function createInventory(data: InventoryInput): Promise<Inventory> {
  return apiRequest<Inventory>('/inventories/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateInventory(id: number, data: Partial<InventoryInput>): Promise<Inventory> {
  return apiRequest<Inventory>(`/inventories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteInventory(id: number): Promise<{ message: string; id: number }> {
  return apiRequest<{ message: string; id: number }>(`/inventories/${id}`, {
    method: 'DELETE',
  })
}
