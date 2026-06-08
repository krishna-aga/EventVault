import dotenv from "dotenv";
import path from "path";

dotenv.config(
  {path: path.resolve(process.cwd(), "../../.env"),}
);
import express from "express";
import cors from "cors";
import { prisma } from "@repo/db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});


async function testDb() {
  const users = await prisma.user.findMany();

  console.log(users);
}

testDb();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:5000 `);
});