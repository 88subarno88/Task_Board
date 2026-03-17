import request from 'supertest'
import app from '../app'

describe('Board Tests', () => {
  let token: string
  let projectId: string
  let boardId: string

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Board Tester', email: 'boardtest@test.com', password: 'Test1234567' })
    token = res.body.data.accessToken

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board Test Project' })
    projectId = projectRes.body.data.id

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1', projectId })
    boardId = boardRes.body.data.id
  })

  it('should create a board with 4 default columns', async () => {
    expect(boardId).toBeDefined()
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.columns.length).toBe(4)
    expect(res.body.data.columns[0].name).toBe('To Do')
  })

  it('should fail without projectId', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Project Board' })

    expect(res.status).toBe(400)
  })

  it('should get boards for a project', async () => {
    const res = await request(app)
      .get(`/api/boards?projectId=${projectId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('should add a column to board', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Testing', wipLimit: 3 })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Testing')
  })
})