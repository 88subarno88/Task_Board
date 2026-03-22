import { Request, Response } from 'express';
import * as projectService from '../services/projectservices';
import {
  NewProjectData,
  UpdateProjectInfo,
  AddUserToProject,
  ChangeMemberRole,
} from '../types/projecttype';

export const createProject = async (req: Request, res: Response) => {
  try {
    let userId = req.user?.userId;

    if (userId == null) {
      res.status(401).json({
        success: false,
        message: 'You arenot logged in',
      });
      return;
    }

    let data: NewProjectData = {
      name: req.body.name,
      description: req.body.description,
    };

    if (data.name == '') {
      res.status(400).json({
        success: false,
        message: 'Make a name for the project',
      });
      return;
    }

    let newProj = await projectService.createProject(data, userId);

    res.status(200).json({
      success: true,
      data: newProj,
      message: 'Project created',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Caught an error' });
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    let userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Please login',
      });
      return;
    }
    let showArchived = false;
    if (req.query.includeArchived == 'true') {
      showArchived = true;
    }

    let allMyProjects = await projectService.getAllProjects(userId, showArchived);

    res.status(200).json({
      success: true,
      data: allMyProjects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not get projects' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    var projId = req.params.projectId as string;
    var proj = await projectService.getProjectById(projId);

    res.status(200).json({
      success: true,
      data: proj,
    });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Cannot find project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;

    let updateData: UpdateProjectInfo = {
      name: req.body.name,
      description: req.body.description,
      archived: req.body.archived,
    };

    let updated = await projectService.updateProject(projId, updateData);
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Project is updated now',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;

    await projectService.deleteProject(projId);

    res.status(200).json({
      success: true,
      message: 'Deleted project successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in  deleteProject ' });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;

    let newMemberInfo: AddUserToProject = {
      userId: req.body.userId,
      role: req.body.role,
    };

    if (newMemberInfo.userId == null || newMemberInfo.role == null) {
      res.status(400).json({
        success: false,
        message: 'Missing user id or role',
      });
      return;
    }

    let addedMember = await projectService.addMember(projId, newMemberInfo);

    res.status(200).json({
      success: true,
      data: addedMember,
      message: 'Added them to the project',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not addMember' });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;
    let uId = req.params.userId as string;

    let roleData: ChangeMemberRole = {
      role: req.body.role,
    };

    if (roleData.role.trim() == '') {
      res.status(400).json({
        success: false,
        message: 'You need to pick a role',
      });
      return;
    }

    const requesterId = req.user?.userId;
    if (!requesterId) {
      res.status(401).json({ success: false, message: 'Not logged in' });
      return;
    }
    let changedRole = await projectService.updateMemberRole(projId, uId, roleData, requesterId);

    res.status(200).json({
      success: true,
      data: changedRole,
      message: 'Role changed',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not change role' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;
    let uId = req.params.userId as string;

    await projectService.removeMember(projId, uId);

    res.status(200).json({
      success: true,
      message: 'They are removed',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in removeMember' });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    let projId = req.params.projectId as string;
    let memberList = await projectService.getProjectMembers(projId);

    res.status(200).json({
      success: true,
      data: memberList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not get members list' });
  }
};
