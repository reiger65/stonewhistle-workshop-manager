// Transform API responses from snake_case to camelCase for frontend compatibility

export function transformOrderItem(item: any): any {
  return {
    ...item,
    // Map snake_case to camelCase
    orderId: item.order_id,
    serialNumber: item.serial_number,
    itemType: item.item_type,
    itemSize: item.item_size,
    tuningType: item.tuning_type,
    orderNumber: item.order_number,
    orderDate: item.order_date,
    buildDate: item.build_date,
    bagSize: item.bag_size,
    boxSize: item.box_size,
    shopifyLineItemId: item.shopify_line_item_id,
    statusChangeDates: item.status_change_dates,
    isArchived: item.is_archived,
    archivedReason: item.archived_reason,
    workshopNotes: item.workshop_notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function transformOrder(order: any): any {
  return {
    ...order,
    // Map snake_case to camelCase
    orderNumber: order.order_number,
    shopifyOrderId: order.shopify_order_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    customerAddress: order.customer_address,
    customerCity: order.customer_city,
    customerState: order.customer_state,
    customerZip: order.customer_zip,
    customerCountry: order.customer_country,
    orderType: order.order_type,
    isReseller: order.is_reseller,
    resellerNickname: order.reseller_nickname,
    orderDate: order.order_date,
    shippedDate: order.shipped_date,
    deliveredDate: order.delivered_date,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    trackingCompany: order.tracking_company,
    deliveryStatus: order.delivery_status,
    isUrgent: order.is_urgent,
    statusChangeDates: order.status_change_dates,
    buildDate: order.build_date,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}
