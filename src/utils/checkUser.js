import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export async function checkUser(email) {
    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (existingUser) {
        return {
            status: true,
            user: existingUser
        }
    }

    return {
        status: false,
    }
}