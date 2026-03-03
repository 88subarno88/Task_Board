import { Request, Response } from 'express';
import * as userService from '../services/userservice';
import { UpdateUserto, UpdateUserroleto } from '../types/usertypes';

export async function getMe(req: Request, res: Response) {
  try {
    let userId = req.user?.userId;

    if (userId != null && userId != undefined) {
      let user = await userService.getUserbyid(userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'You arenot logged in',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot getMe' });
  }
}

export async function getUserbyId(req: Request, res: Response) {
  try {
    let userId = req.params.userId as string;
    let user = await userService.getUserbyid(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot getUserbyId' });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    let page = 1;
    let limit = 10;

    if (req.query.page != undefined) {
      page = parseInt(req.query.page as string);
    }

    if (req.query.limit != undefined) {
      limit = parseInt(req.query.limit as string);
    }

    let search: string | undefined;
    if (req.query.search != undefined) {
      search = req.query.search as string;
    }

    let result = await userService.getAllUsers(page, limit, search);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot getAllUsers' });
  }
}

export async function updateUserProfile(req: Request, res: Response) {
  try {
    let userId = req.user?.userId as string;

    if (userId != null) {
      let data: UpdateUserto = {
        name: req.body.name,
        avatarUrl: req.body.avatarUrl,
      };

      let user = await userService.updateProfile(userId, data);

      res.status(200).json({
        success: true,
        data: user,
        message: 'User profile updated',
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'User not logged in',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot updateUserProfile' });
  }
}

export async function updateUserrole(req: Request, res: Response) {
  try {
    let userId = req.params.userId as string;
    let globalRole = req.body.globalRole;

    if (globalRole != null && globalRole.trim() != '') {
      let data: UpdateUserroleto = {
        userId: userId,
        globalRole: globalRole,
      };

      let user = await userService.updateUserRole(data);

      res.status(200).json({
        success: true,
        data: user,
        message: 'User role updated',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Please provide a role',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: couldnot updateUserrole' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    let userId = req.params.userId as string;

    await userService.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot deleteUser' });
  }
}

export async function getUserProjects(req: Request, res: Response) {
  try {
    let userId = req.user?.userId;

    if (userId != null) {
      let projects = await userService.getUserprojects(userId);

      res.status(200).json({
        success: true,
        data: projects,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Not logged in',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'ERROR: Couldnot getUserProjects' });
  }
}
