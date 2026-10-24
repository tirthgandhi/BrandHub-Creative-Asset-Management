import mongoose from "mongoose";

const capability = new WeakMap();

export async function withReviewTransaction(work) {
  const db = mongoose.connection.db;
  let supported = capability.get(db);
  if (supported === undefined) {
    const hello = await db.admin().command({ hello: 1 });
    supported = Boolean(hello.setName);
    capability.set(db, supported);
  }
  if (!supported) return work(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally { await session.endSession(); }
}
