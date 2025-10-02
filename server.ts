// server.ts - Next.js Standalone + Socket.IO
import 'dotenv/config';
import { setupSocket } from '@/lib/socket';
import { validateEnv } from '@/lib/env';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

// Validate environment variables before starting
try {
  validateEnv();
  console.log('✓ Environment variables validated');
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const currentPort = parseInt(process.env.PORT || '3400', 10);
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO with enhanced configuration
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: process.env.NEXTAUTH_URL || (dev ? "http://localhost:3400" : false),
        methods: ["GET", "POST"],
        credentials: true
      },
      // Add additional options for better real-time performance
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
