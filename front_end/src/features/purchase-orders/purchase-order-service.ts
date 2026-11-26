import { apiRequest } from '../../services/api'

export interface PurchaseOrderItem {
  id: number
  product_id: number
  product_name: string
  unit: string
  ordered_quantity: number
  received_quantity: number
}

export interface PurchaseOrder {
  id: number
  po_number: string
  purchase_request_id: number
  supplier_id: number
  supplier_name: string
  warehouse_id: number
  warehouse_name: string
  status: string
  items: PurchaseOrderItem[]
  created_at: string
  updated_at: string | null
}

export interface PurchaseRequestOption {
  id: number
  request_number: string
  status: string
  warehouse_name: string
}

export interface SupplierOption {
  id: number
  company_name: string
  name: string
  is_active: number
}

interface ListResponse<T> {
  data: T[]
  total_data: number
}

export async function fetchPurchaseOrders(status = ''): Promise<PurchaseOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await apiRequest<ListResponse<PurchaseOrder>>(`/purchase-orders/${query}`)
  return response.data
}

export async function fetchPurchaseRequestOptions(): Promise<PurchaseRequestOption[]> {
  const response = await apiRequest<ListResponse<PurchaseRequestOption>>('/purchase-requests/')
  return response.data
}

export async function fetchSupplierOptions(): Promise<SupplierOption[]> {
  const response = await apiRequest<ListResponse<SupplierOption>>('/suppliers/')
  return response.data
}

export function createPurchaseOrder(purchaseRequestID: number, supplierID: number): Promise<PurchaseOrder> {
  return apiRequest<PurchaseOrder>(`/purchase-requests/${purchaseRequestID}/purchase-order`, {
    method: 'POST',
    body: JSON.stringify({ supplier_id: supplierID }),
  })
}

export function updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder> {
  return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
