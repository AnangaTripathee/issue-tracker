import prisma from '@/prisma/client';
import { MAX_DB_INT } from './ids';

export function listUsers() {
    return prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });
}

export async function userExists(id: number) {
    if (id > MAX_DB_INT) return false;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    return user !== null;
}
