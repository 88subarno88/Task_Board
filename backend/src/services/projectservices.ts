import prisma from '../config/database';
import {
  NewProjectData,
  UpdateProjectInfo,
  AddUserToProject,
  ChangeMemberRole,
} from '../types/projecttype';
import { AppError } from '../middleware/errorHandler';


export const createProject = async (data: NewProjectData, creatorId: string) => {
  try {
    let newProject = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        members: {
          create: {
            userId: creatorId,
            role: 'PROJECT_ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    return newProject;
  } catch (error) {
    throw new Error('Error : Couldnot createProject');
  }
};

export const getAllProjects = async (userId: string, includeArchived: boolean = false) => {
  let filterOptions: any = {
    members: {
      some: {
        userId: userId,
      },
    },
  };

  if (includeArchived == false) {
    filterOptions.archived = false;
  }

  try {
    let projectsFromDb = await prisma.project.findMany({
      where: filterOptions,
      include: {
        members: {
          where: { userId: userId },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            boards: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let niceProjects = projectsFromDb.map((p) => {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        archived: p.archived,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        role: p.members[0]?.role,
        memberCount: p._count.members,
        boardCount: p._count.boards,
      };
    });

    return niceProjects;
  } catch (error) {
    throw new Error('ERROR: Couldnot getAllProjects');
  }
};
export const getProjectById = async (projectId: string) => {
  let theProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      boards: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (theProject == null) {
    throw new AppError(404, 'ERROR: Couldnot getProjectById');
  }

  return theProject;
};

export const updateProject = async (projectId: string, data: UpdateProjectInfo) => {
  try {
    let updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        archived: data.archived,
      },
    });
    return updated;
  } catch (e) {
    throw new AppError(500, 'ERROR: Couldnot updateProject');
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
  } catch (e) {
    throw new AppError(500, 'ERROR: Couldnot deleteProject ');
  }
};

export const addMember = async (projectId: string, data: AddUserToProject) => {
  let foundUser = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (foundUser == null) {
    throw new AppError(404, 'User not found');
  }
  let alreadyInProject = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: data.userId,
      },
    },
  });

  if (alreadyInProject != null) {
    throw new AppError(400, 'ERROR: This user is already a member');
  }

  try {
    let newMember = await prisma.projectMember.create({
      data: {
        projectId: projectId,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    return newMember;
  } catch (error) {
    throw new AppError(500, 'ERROR: Couldnot addMember');
  }
};

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  data: ChangeMemberRole
) => {
  let theMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: userId,
      },
    },
  });

  if (theMember == null) {
    throw new AppError(404, 'Member not found in this project');
  }

  try {
    let updatedMember = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId,
        },
      },
      data: {
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    return updatedMember;
  } catch (e) {
    throw new AppError(500, 'ERROR: Couldnot updateMemberRole');
  }
};

export const removeMember = async (projectId: string, userId: string) => {
  let member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: userId,
      },
    },
  });

  if (member == null) {
    throw new AppError(404, 'Member not found');
  }

  let numberOfAdmins = await prisma.projectMember.count({
    where: {
      projectId: projectId,
      role: 'PROJECT_ADMIN',
    },
  });

  if (member.role == 'PROJECT_ADMIN' && numberOfAdmins == 1) {
    throw new AppError(400, 'Cannot remove the last admin from project');
  }

  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId,
        },
      },
    });
  } catch (e) {
    throw new AppError(500, 'ERROR: Couldnot removeMember');
  }
};

export const getProjectMembers = async (projectId: string) => {
  try {
    let membersList = await prisma.projectMember.findMany({
      where: { projectId: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return membersList;
  } catch (e) {
    throw new AppError(500, 'ERROR: Couldnot getProjectMembers');
  }
};
