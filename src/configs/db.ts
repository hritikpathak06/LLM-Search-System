import mongoose from "mongoose";

const connection: any = {
  isConnected: 0,
};

export const connect_db = async () => {
  try {
    if (connection.isConnected) {
      console.log(`MongoDB Already Connected`);
    } else {
      const conn = await mongoose.connect(process.env.DATABASE_URI!);
      connection.isConnected = conn.connections[0].readyState;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error: any) {
    console.log(`Error: ${error.msg}`);
    process.exit();
  }
};
