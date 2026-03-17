import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import * as commentService from '../services/commentservice'

interface AuthRequest extends Request {
  user?: { userId: string; email: string; globalRole: string }
}

export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const issueId = req.params.issueId as string
  const { content } = req.body

  if (!content) {
    res.status(400).json({ success: false, message: 'Content is required' })
    return
  }

  const comment = await commentService.addComment(issueId, userId, content)
  res.status(201).json({ success: true, data: comment, message: 'Comment added' })
})

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const issueId = req.params.issueId as string
  const comments = await commentService.getCommentsByIssue(issueId)
  res.status(200).json({ success: true, data: comments })
})

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const commentId = req.params.commentId as string
  const { content } = req.body

  if (!content) {
    res.status(400).json({ success: false, message: 'Content is required' })
    return
  }

  const comment = await commentService.updateComment(commentId, userId, content)
  res.status(200).json({ success: true, data: comment, message: 'Comment updated' })
})

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const commentId = req.params.commentId as string
  await commentService.deleteComment(commentId, userId)
  res.status(200).json({ success: true, message: 'Comment deleted' })
})