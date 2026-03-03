import prisma from '../config/database';
import { Prisma } from '@prisma/client'; 
import { UpdateUserto, UserResponse, UpdateUserroleto } from '../types/usertypes';
import { AppError } from '../middleware/errorHandler';


const USER_DETAILS= {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  globalRole: true,
  createdAt: true,
  updatedAt: true,
};


export async function getUserbyid(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_DETAILS,
    });

    if (!user) {
        throw new AppError(404, 'User not found');
    }else{
       return user;
    }

}

export async function getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    let where: Prisma.UserWhereInput = {}; 
    if (search) {
      where = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_DETAILS,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where })
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

export async function getUserprojects(userId: string) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            archived: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map(({ project, role }) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      archived: project.archived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role,
    }));
}


export async function updateProfile(userId: string, data: UpdateUserto): Promise<UserResponse> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      select: USER_DETAILS,
    });
  }

export async function updateUserRole(data: UpdateUserroleto): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user){
       throw new AppError(404, 'User not found');
    } 

    return prisma.user.update({
      where: { id: data.userId },
      data: { globalRole: data.globalRole },
      select: USER_DETAILS,
    });
  }

export async function deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user){
          throw new AppError(404, 'User not found');

    } 
    await prisma.user.delete({
      where: { id: userId },
    });
  }

