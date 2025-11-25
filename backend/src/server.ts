import app from "./app.js";
import mongoose from "mongoose";
import { seedAdmin } from "./utils/seedAdmin.js";

type ShutdownSignal = "SIGTERM" | "SIGINT";

const MONGOOSE_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true,
};

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, MONGOOSE_OPTIONS);
    console.log('MongoDB Connected Successfully');

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB Connection Error:", error);
      if (!isShuttingDown) {
        gracefulShutdown("SIGTERM");
      }
    });

    mongoose.connection.on("disconnected", () => {
      if (!isShuttingDown) {
        console.warn("MongoDB Disconnected - Attempting to reconnect...");
      }
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB Reconnected");
    });
  } catch (error) {
    console.error("Database Connection Failed:", error);
    throw error;
  }
};

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await seedAdmin();

  const PORT = process.env.PORT;
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Started at: ${new Date().toISOString()}`);
  });
};

const gracefulShutdown = async (signal: ShutdownSignal): Promise<void> => {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  };

  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  const shutdownTimer = setTimeout(() => {
    console.error('Graceful shutdown timeout. Forcing exit...');
    process.exit(1);
  }, 10000);


  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log("Server closed");
            resolve();
          }
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed");
    }

    clearTimeout(shutdownTimer);
    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimer);
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();