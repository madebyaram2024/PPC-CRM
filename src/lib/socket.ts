import { Server } from 'socket.io';
import { db } from './db';

// Store connected users by their socket ID
const connectedUsers = new Map<string, { id: string; name: string; email: string; role: string }>();
const socketToUserMap = new Map<string, string>(); // socketId -> userId
const userToSocketsMap = new Map<string, string[]>(); // userId -> socketIds[]

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user joining
    socket.on('join', async (userData: { userId: string; name: string; email: string; role: string } | string) => {
      try {
        let userId: string;
        let userName: string;
        let userEmail: string;
        let userRole: string;
        
        // Handle both string (room name) and object (user data) cases
        if (typeof userData === 'string') {
          // It's a room name, join the room
          socket.join(userData);
          console.log(`Socket ${socket.id} joined room: ${userData}`);
          return;
        } else {
          // It's user data
          userId = userData.userId;
          userName = userData.name;
          userEmail = userData.email;
          userRole = userData.role;
        }
        
        // Store user connection
        connectedUsers.set(socket.id, {
          id: userId,
          name: userName,
          email: userEmail,
          role: userRole
        });
        
        socketToUserMap.set(socket.id, userId);
        
        // Add socket to user's socket list
        if (!userToSocketsMap.has(userId)) {
          userToSocketsMap.set(userId, []);
        }
        userToSocketsMap.get(userId)?.push(socket.id);
        
        // Join user room
        socket.join(`user:${userId}`);
        
        // Join general company room for broadcasting
        socket.join('company:general');
        
        // Notify others that user is online
        socket.to('company:general').emit('userOnline', {
          userId: userId,
          name: userName,
          timestamp: new Date().toISOString()
        });
        
        console.log(`User ${userName} (${userId}) joined with socket ID ${socket.id}`);
      } catch (error) {
        console.error('Error in join event:', error);
      }
    });

    // Handle sending messages to all users
    socket.on('broadcastMessage', (msg: { 
      text: string; 
      senderId: string;
      senderName: string;
      timestamp: string;
    }) => {
      try {
        // Broadcast message to all connected clients in the company
        socket.to('company:general').emit('broadcastMessage', {
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
        
        console.log(`Broadcast message from ${msg.senderName}: ${msg.text}`);
      } catch (error) {
        console.error('Error in broadcastMessage event:', error);
      }
    });

    // Handle sending private messages
    socket.on('privateMessage', (msg: { 
      text: string; 
      senderId: string;
      senderName: string;
      recipientId: string;
      timestamp: string;
    }) => {
      try {
        // Send message to recipient's room
        socket.to(`user:${msg.recipientId}`).emit('privateMessage', {
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
        
        console.log(`Private message from ${msg.senderName} to ${msg.recipientId}: ${msg.text}`);
      } catch (error) {
        console.error('Error in privateMessage event:', error);
      }
    });

    // Handle sending work order messages
    socket.on('workOrderMessage', (msg: { 
      text: string; 
      senderId: string;
      senderName: string;
      workOrderId: string;
      timestamp: string;
    }) => {
      try {
        // Join work order room and broadcast message
        socket.join(`workOrder:${msg.workOrderId}`);
        
        // Broadcast to everyone in the work order room except sender
        socket.to(`workOrder:${msg.workOrderId}`).emit('workOrderMessage', {
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          workOrderId: msg.workOrderId,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
        
        console.log(`Work order message for ${msg.workOrderId} from ${msg.senderName}: ${msg.text}`);
      } catch (error) {
        console.error('Error in workOrderMessage event:', error);
      }
    });

    // Handle sending invoice messages
    socket.on('invoiceMessage', (msg: { 
      text: string; 
      senderId: string;
      senderName: string;
      invoiceId: string;
      timestamp: string;
    }) => {
      try {
        // Join invoice room and broadcast message
        socket.join(`invoice:${msg.invoiceId}`);
        
        // Broadcast to everyone in the invoice room except sender
        socket.to(`invoice:${msg.invoiceId}`).emit('invoiceMessage', {
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          invoiceId: msg.invoiceId,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
        
        console.log(`Invoice message for ${msg.invoiceId} from ${msg.senderName}: ${msg.text}`);
      } catch (error) {
        console.error('Error in invoiceMessage event:', error);
      }
    });

    // Handle sending customer messages
    socket.on('customerMessage', (msg: { 
      text: string; 
      senderId: string;
      senderName: string;
      customerId: string;
      timestamp: string;
    }) => {
      try {
        // Join customer room and broadcast message
        socket.join(`customer:${msg.customerId}`);
        
        // Broadcast to everyone in the customer room except sender
        socket.to(`customer:${msg.customerId}`).emit('customerMessage', {
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          customerId: msg.customerId,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
        
        console.log(`Customer message for ${msg.customerId} from ${msg.senderName}: ${msg.text}`);
      } catch (error) {
        console.error('Error in customerMessage event:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { 
      userId: string;
      userName: string;
      context: string; // workOrder, invoice, customer, general
      contextId?: string;
    }) => {
      try {
        if (data.context === 'general') {
          socket.to('company:general').emit('typing', data);
        } else if (data.contextId) {
          socket.to(`${data.context}:${data.contextId}`).emit('typing', data);
        }
      } catch (error) {
        console.error('Error in typing event:', error);
      }
    });

    // Handle stop typing indicators
    socket.on('stopTyping', (data: { 
      userId: string;
      userName: string;
      context: string; // workOrder, invoice, customer, general
      contextId?: string;
    }) => {
      try {
        if (data.context === 'general') {
          socket.to('company:general').emit('stopTyping', data);
        } else if (data.contextId) {
          socket.to(`${data.context}:${data.contextId}`).emit('stopTyping', data);
        }
      } catch (error) {
        console.error('Error in stopTyping event:', error);
      }
    });

    // Handle joining a room
    socket.on('joinRoom', (room: string) => {
      try {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      } catch (error) {
        console.error('Error in joinRoom event:', error);
      }
    });

    // Handle leaving a room
    socket.on('leaveRoom', (room: string) => {
      try {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      } catch (error) {
        console.error('Error in leaveRoom event:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      try {
        const userId = socketToUserMap.get(socket.id);
        const user = connectedUsers.get(socket.id);
        
        if (user && userId) {
          // Remove socket from user's socket list
          const userSockets = userToSocketsMap.get(userId) || [];
          const updatedSockets = userSockets.filter(id => id !== socket.id);
          
          if (updatedSockets.length > 0) {
            userToSocketsMap.set(userId, updatedSockets);
          } else {
            userToSocketsMap.delete(userId);
          }
          
          // Remove mappings
          socketToUserMap.delete(socket.id);
          connectedUsers.delete(socket.id);
          
          // Notify others that user went offline if this was their last socket
          if (updatedSockets.length === 0) {
            socket.to('company:general').emit('userOffline', {
              userId: userId,
              name: user.name,
              timestamp: new Date().toISOString()
            });
          }
          
          console.log(`User ${user.name} (${userId}) disconnected socket ${socket.id}`);
        } else {
          console.log(`Unknown client disconnected: ${socket.id}`);
        }
      } catch (error) {
        console.error('Error in disconnect event:', error);
      }
    });

    // Send welcome message
    socket.emit('welcome', {
      text: 'Connected to CRM Communication Server!',
      timestamp: new Date().toISOString(),
    });
  });
};

// Utility function to get list of connected users
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

// Utility function to send notification to specific user
export const notifyUser = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Utility function to broadcast to company
export const broadcastToCompany = (io: Server, message: any) => {
  io.to('company:general').emit('broadcastMessage', message);
};