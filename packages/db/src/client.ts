import dotenv from "dotenv";
import { PrismaClient } from "./generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";

dotenv.config(
  {path: path.resolve(process.cwd(), "../../.env"),}
);


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
