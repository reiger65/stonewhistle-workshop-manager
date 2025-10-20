// Script to add test data to MemStorage
import { storage } from './server/storage.js';

async function addTestData() {
  console.log('Adding test data to MemStorage...');
  
  // Add some test orders
  const testOrders = [
    {
      orderNumber: '1633',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      status: 'in_progress',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      isUrgent: false,
      archived: false,
      orderType: 'regular',
      isReseller: false,
      resellerNickname: null
    },
    {
      orderNumber: '1634',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      status: 'pending',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date(),
      isUrgent: true,
      archived: false,
      orderType: 'regular',
      isReseller: false,
      resellerNickname: null
    },
    {
      orderNumber: '1635',
      customerName: 'Bob Wilson',
      customerEmail: 'bob@example.com',
      status: 'completed',
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date(),
      isUrgent: false,
      archived: false,
      orderType: 'regular',
      isReseller: false,
      resellerNickname: null
    }
  ];

  // Add test order items
  const testItems = [
    {
      orderId: 1,
      serialNumber: 'SW-1633-1',
      instrumentType: 'innato',
      tuning: 'A3',
      color: 'blue',
      specifications: {
        tuning: 'A3',
        color: 'blue',
        size: 'L'
      },
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    },
    {
      orderId: 1,
      serialNumber: 'SW-1633-2',
      instrumentType: 'natey',
      tuning: 'C4',
      color: 'red',
      specifications: {
        tuning: 'C4',
        color: 'red',
        size: 'M'
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    },
    {
      orderId: 2,
      serialNumber: 'SW-1634-1',
      instrumentType: 'zen',
      tuning: 'L',
      color: 'green',
      specifications: {
        tuning: 'L',
        color: 'green',
        size: 'XL'
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    }
  ];

  try {
    // Add orders
    for (const order of testOrders) {
      const createdOrder = await storage.createOrder(order);
      console.log(`Created order: ${createdOrder.orderNumber}`);
    }

    // Add order items
    for (const item of testItems) {
      const createdItem = await storage.createOrderItem(item);
      console.log(`Created item: ${createdItem.serialNumber}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData();


