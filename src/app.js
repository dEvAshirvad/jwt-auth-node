import express from "express";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client";

import { checkUser } from "./utils/checkUser.js";

import "dotenv/config"
import { authenticteUser } from "./utils/middlewares/authenticate.js";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log(`Backend is up now at port ${process.env.PORT}`)
})

app.get('/', (req, res) => {
    res.send(`Hello World from port ${process.env.PORT}`)
})

app.post('/register', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(401).json({ message: "Credentials not found" })

    const existUser = await checkUser(email)
    if (existUser.status) return res.status(401).json({ message: 'Email already in use' })

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name: email,
            email: email,
        }
    });

    await prisma.account.create({
        data: {
            provider: "CREDENTIAL",
            scope: hashedPassword,
            type: "CREDENTIAL",
            user: {
                connect: {
                    id: user.id,
                }
            }
        }
    })

    const jwtToken = jwt.sign({ userId: user.email }, process.env.JWT_SECRET);

    await prisma.token.create({
        data: {
            access_token: jwtToken,
            user: {
                connect: {
                    id: user.id
                }
            }
        }
    })

    res.status(200).json({ user, jwtToken })
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(401).json({ message: "Credentials not found" })
    const user = await checkUser(email)
    if (!user.status) return res.status(401).json({ message: "Email not found" })

    const account = await prisma.account.findFirst({
        where: {
            userId: user.user.id
        }
    })

    if (!(await bcrypt.compare(password, account.scope))) return res.status(401).json({ message: "Password not match" })

    const token = await prisma.token.findFirst({
        where: {
            userId: user.user.id
        }
    })

    const jwtToken = {
        access_token: token.access_token,
        refresh_token: token.refresh_token
    }

    if (!(token.expires_at)) {
        jwt.access_token = jwt.sign({ userId: user.email }, process.env.JWT_SECRET)
    }

    return res.status(200).json({
        user: user.user,
        jwtToken
    })
})

app.get('/service', authenticteUser, (req, res) => {
    const userId = req.userId
    res.status(200).json({ message: `Here is your secret message agent ${userId}` })
})