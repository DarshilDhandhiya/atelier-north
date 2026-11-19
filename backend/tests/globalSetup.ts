import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

/** Uses TEST_MONGODB_URI if provided (e.g. a local MongoDB); otherwise downloads and starts an in-memory MongoDB. */
export async function setup() {
  process.env.NODE_ENV = 'test';
  if (!process.env.TEST_MONGODB_URI) {
    mongod = await MongoMemoryServer.create();
    process.env.TEST_MONGODB_URI = mongod.getUri('atelier_test');
  }
}
export async function teardown() {
  await mongod?.stop();
}
