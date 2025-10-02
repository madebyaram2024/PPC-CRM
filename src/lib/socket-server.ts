import { Server } from 'socket.io';

// Global Socket.IO server instance
let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const getSocketServer = (): Server | null => {
  return io;
};

// Notification helper functions
export const notifyWorkOrderCreated = (workOrder: any) => {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  io.to('company:general').emit('notification', {
    type: 'work_order_created',
    title: 'New Work Order',
    message: `Work Order #${workOrder.number} has been created`,
    workOrderId: workOrder.id,
    workOrderNumber: workOrder.number,
    timestamp: new Date().toISOString(),
  });
};

export const notifyWorkOrderUpdated = (workOrder: any) => {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  io.to('company:general').emit('notification', {
    type: 'work_order_updated',
    title: 'Work Order Updated',
    message: `Work Order #${workOrder.number} has been updated`,
    workOrderId: workOrder.id,
    workOrderNumber: workOrder.number,
    timestamp: new Date().toISOString(),
  });
};

export const notifyWorkOrderCompleted = (workOrder: any) => {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return;
  }

  io.to('company:general').emit('notification', {
    type: 'work_order_completed',
    title: 'Work Order Completed',
    message: `Work Order #${workOrder.number} has been completed`,
    workOrderId: workOrder.id,
    workOrderNumber: workOrder.number,
    timestamp: new Date().toISOString(),
  });
};
