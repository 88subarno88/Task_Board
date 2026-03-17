import request from 'supertest'
import app from '../app'

describe('Comment Tests', () => {
  let token: string
  let issueId: string

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Comment Tester', email: 'commenttest@test.com', password: 'Test1234567' })
    token = res.body.data.accessToken

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Comment Test Project' })
    const projectId = projectRes.body.data.id

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1', projectId })
    const columnId = boardRes.body.data.columns[0].id
    const boardId = boardRes.body.data.id

    const issueRes = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Issue', type: 'TASK', boardId, columnId })

    console.log('issue response:', JSON.stringify(issueRes.body))
    issueId = issueRes.body.data?.id
  })

  it('should add a comment', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a comment' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.content).toBe('This is a comment')
  })

  it('should get comments for an issue', async () => {
    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello!' })

    const res = await request(app)
      .get(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('should fail without content', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })
})