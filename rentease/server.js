const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join user's room based on their user ID
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`Socket ${socket.id} joined conversation:${conversationId}`)
    })

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`Socket ${socket.id} left conversation:${conversationId}`)
    })

    // Handle new message
    socket.on('send-message', (data) => {
      // Emit to conversation room
      socket.to(`conversation:${data.conversationId}`).emit('new-message', data.message)
      
      // Emit to receiver's user room for notifications
      socket.to(`user:${data.receiverId}`).emit('message-notification', {
        conversationId: data.conversationId,
        message: data.message,
      })
      
      console.log(`Message sent in conversation:${data.conversationId}`)
    })

    // Handle typing indicator
    socket.on('typing-start', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
        userId: data.userId,
        userName: data.userName,
      })
    })

    socket.on('typing-stop', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user-stopped-typing', {
        userId: data.userId,
      })
    })

    // Handle messages read
    socket.on('messages-read', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('messages-marked-read', {
        userId: data.userId,
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running on http://${hostname}:${port}/api/socket`)
    })
})
