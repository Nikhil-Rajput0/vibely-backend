import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URI);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", () => {
  console.log("Falied to connect to redis:", error);
});

export default redis;
