// scripts/add-user.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addUser() {
  console.log("Creating user record...");
  
  // Check if user already exists
  let user = await prisma.user.findFirst({
    where: { email: "shivonfortuin999@gmail.com" }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "shivonfortuin999@gmail.com",
        name: "Shivon Fortuin",

        password: "password123", // In real app, hash this
        role: "MEMBER",
        isActive: true,
        gender: "Male",
        addressLine1: "22 Kuruman street, Beacon Hill, Atlantis, 7349",
        phone: "084 282 2022",
        idNumber: "9405285167088"
      }
    });
    console.log("Created user:", user.id);
  } else {
    console.log("User already exists:", user.id);
  }
  
  console.log("------------------------------------");
  console.log("User details:");
  console.log("Name:", user.name);
  console.log("Email:", user.email);
  console.log("ID Number:", user.idNumber);
  console.log("Phone:", user.phone);
  console.log("Address:", user.addressLine1);
  console.log("------------------------------------");
}

addUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());