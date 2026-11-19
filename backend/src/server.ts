import mongoose from 'mongoose';
import { createApp } from './app';
import { config } from './config';
import { startEmailRetryJob } from './services/mailer';

async function main() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
  await mongoose.syncIndexes().catch((e) => console.warn('Index sync warning:', e.message));

  const app = createApp();
  const server = app.listen(config.PORT, () => console.log(`Atelier North API listening on :${config.PORT} (${config.NODE_ENV})`));
  const retryTimer = startEmailRetryJob();

  const shutdown = (signal: string) => {
    console.log(`${signal} received – shutting down`);
    clearInterval(retryTimer);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
