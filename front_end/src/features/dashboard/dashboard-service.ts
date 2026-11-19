import { apiRequest } from '../../services/api'

export interface ListResponse<T> {
  data: T[]
  total_data: number
}

export interface InventoryItem {
  id: number
  product_id: number
  product_name: string
  warehouse_id: number
  warehouse_name: string
  stock: number
  created_at: string
  updated_at: string | null
}

export interface PurchaseRequestItem {
  id: number
  request_number: string
  warehouse_name: string
  status: string
  created_at: string
}

export interface PurchaseOrderItem {
  id: number
  po_number: string
  supplier_name: string
  warehouse_name: string
  status: string
  created_at: string
}

export interface GoodsReceiptItem {
  id: number
  receipt_number: string
  warehouse_id: number
  status: string
}

export interface InventoryMovementItem {
  id: number
  warehouse_id: number
  product_id: number
  movement_type: string
  quantity: number
  reference: string
  created_at: string
}

export async function fetchDashboardData() {
  const [inventory, requests, orders, receipts, movements] = await Promise.allSettled([
    apiRequest<ListResponse<InventoryItem>>('/inventories'),
    apiRequest<ListResponse<PurchaseRequestItem>>('/purchase-requests'),
    apiRequest<ListResponse<PurchaseOrderItem>>('/purchase-orders'),
    apiRequest<ListResponse<GoodsReceiptItem>>('/goods-receipts'),
    apiRequest<ListResponse<InventoryMovementItem>>('/inventory-movements'),
  ])

  const value = <T,>(result: PromiseSettledResult<ListResponse<T>>) =>
    result.status === 'fulfilled' ? result.value : { data: [] as T[], total_data: 0 }

  return {
    inventory: value(inventory),
    requests: value(requests),
    orders: value(orders),
    receipts: value(receipts),
    movements: value(movements),
  }
}
