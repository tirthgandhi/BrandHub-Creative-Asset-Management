import MongoStore from "connect-mongo";

export function createMongoSessionStore(mongoUrl) {
  return MongoStore.create({ mongoUrl, collectionName: "sessions", ttl: 60 * 60 * 24 * 7, autoRemove: "native" });
}
