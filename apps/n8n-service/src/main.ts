import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import chatbotRouter from './routes/chatbot.routes';
import * as path from 'path';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to n8n-service!' });
});

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to n8n-service API!' });
});

// Routes
app.use('/api', chatbotRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`[ ready ] http://localhost:${port}/api`);
  console.log(`Chatbot service running on port ${port}`);
});
server.on('error', console.error);

