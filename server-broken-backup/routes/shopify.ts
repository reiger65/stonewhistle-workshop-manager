import express from 'express';
import { db } from '../db/connection.js';
import { orders, orderItems } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Mock Shopify import endpoint
router.post('/import-shopify', async (req, res) => {
      try {
        const { period } = req.body;
        
        console.log(`[SHOPIFY IMPORT] Starting import for period: ${period || 'all'}`);
        
        // Use real Shopify API
        const shopifyApiKey = process.env.SHOPIFY_API_KEY;
        const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shopifyShopName = process.env.SHOPIFY_SHOP_NAME;
        
        if (!shopifyApiKey || !shopifyAccessToken || !shopifyShopName) {
          return res.status(500).json({ 
            success: false, 
            message: 'Shopify credentials not configured' 
          });
        }
        
        // Call real Shopify API
        const shopifyUrl = `https://${shopifyShopName}/admin/api/2023-10/orders.json`;
        const params = new URLSearchParams({
          status: 'any',
          limit: '250'
        });
        
        if (period === 'last_30_days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          params.append('created_at_min', thirtyDaysAgo.toISOString());
        }
        
        const response = await fetch(`${shopifyUrl}?${params}`, {
          headers: {
            'X-Shopify-Access-Token': shopifyAccessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
        }
        
        const shopifyData = await response.json();
        console.log(`[SHOPIFY IMPORT] Retrieved ${shopifyData.orders.length} orders from Shopify`);
        
        // Convert Shopify orders to our format
        const shopifyOrders = shopifyData.orders.map((order: any) => ({
          order_number: order.name,
          shopify_order_id: order.id.toString(),
          customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown Customer',
          customer_email: order.customer?.email || null,
          customer_phone: order.customer?.phone || null,
          customer_address: order.shipping_address?.address1 || null,
          customer_city: order.shipping_address?.city || null,
          customer_state: order.shipping_address?.province || null,
          customer_zip: order.shipping_address?.zip || null,
          customer_country: order.shipping_address?.country || null,
          order_type: 'shopify', // Add default order type
          status: order.fulfillment_status || 'pending',
          order_date: new Date(order.created_at),
          notes: order.note || null,
          created_at: new Date(order.created_at),
          updated_at: new Date(order.updated_at)
        }));

    // Insert Shopify orders into database
    const insertedOrders = [];
    for (const orderData of shopifyOrders) {
      try {
        console.log(`[SHOPIFY IMPORT] Inserting order: ${orderData.order_number}`);
        
            const [newOrder] = await db
              .insert(orders)
              .values({
                ...orderData,
                created_at: new Date(),
                updated_at: new Date()
              })
              .returning();
        
        console.log(`[SHOPIFY IMPORT] Created order with ID: ${newOrder.id}`);
        
        // Get the original Shopify order to extract line items
        const originalOrder = shopifyData.orders.find((o: any) => o.name === orderData.order_number);
        if (originalOrder && originalOrder.line_items) {
          for (const [index, lineItem] of originalOrder.line_items.entries()) {
            const itemData = {
              order_id: newOrder.id,
              serial_number: `${orderData.order_number}-${index + 1}`,
              item_type: lineItem.title,
              color: lineItem.variant_title || null,
              status: 'ordered',
              specifications: {
                shopify_line_item_id: lineItem.id,
                variant_id: lineItem.variant_id,
                sku: lineItem.sku,
                quantity: lineItem.quantity,
                price: lineItem.price
              },
              shopify_line_item_id: lineItem.id.toString(),
              order_number: orderData.order_number,
              order_date: orderData.order_date
            };

            await db.insert(orderItems).values(itemData);
            console.log(`[SHOPIFY IMPORT] Created item: ${itemData.serial_number}`);
          }
        }

        insertedOrders.push(newOrder);
      } catch (error) {
        console.error(`[SHOPIFY IMPORT] Error inserting order ${orderData.order_number}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedOrders.length} orders from Shopify`,
      importedCount: insertedOrders.length,
      importedOrders: insertedOrders
    });

  } catch (error) {
    console.error('Shopify import error:', error);
    res.status(500).json({
      success: false,
      message: `Import failed: ${error.message}`
    });
  }
});

export default router;
