import { PrismaClient, Auth_types, Role } from '@prisma/client'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import "dotenv/config"
const prisma = new PrismaClient()

const email = "ash@gmail.com"
const password = "secret"

createUser(email, password)

async function createUser(email, password) {
    await prisma.user.deleteMany()
    const hashedPassword = await bcrypt.hash(password, 10);
    const jwtToken = jwt.sign({ email: email, role: Role.SUBSCRIBER }, process.env.JWT_SECRET);

    const User = await prisma.user.create({
        data: {
            email,
            Account: {
                create: {
                    scope: hashedPassword,
                    type: Auth_types.CREDENTIALS,
                    provider: "CREDENTIALS",
                    access_token: jwtToken,
                }
            }
        },
        include: {
            Account: true
        }
    },)

    console.log(User)

}