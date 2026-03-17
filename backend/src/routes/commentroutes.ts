import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as commentController from '../controllers/commentcontroller'

const router = Router()

router.post('/issues/:issueId/comments', authenticate, commentController.addComment)
router.get('/issues/:issueId/comments', authenticate, commentController.getComments)
router.patch('/comments/:commentId', authenticate, commentController.updateComment)
router.delete('/comments/:commentId', authenticate, commentController.deleteComment)

export default router