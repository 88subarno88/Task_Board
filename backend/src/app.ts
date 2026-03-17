import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import authRoutes from './routes/authroutes';
import userRoutes from './routes/userroutes';
import projectRoutes from './routes/projectroutes';
import boardRoutes from './routes/boardroutes';
import issueRoutes from './routes/issueroutes';
import commentRoutes from './routes/commentroutes';
import notificationRoutes from './routes/notificationroutes';

const app: Application = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl === '/health' && res.statusCode === 200) {
      return;
    }
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Task Board API  is up and running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
