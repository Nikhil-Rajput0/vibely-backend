import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URI);

redis.on("connect", () => {
  console.log("Redis connecting...");
});

redis.on("ready", () => {
  console.log("Redis connected and ready!");
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export default redis;
