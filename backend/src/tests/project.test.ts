import request from 'supertest'
import app from '../app'

describe('Project Tests', () => {
  let token: string

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Project Tester', email: 'projecttest@test.com', password: 'Test1234567' })
    token = res.body.data.accessToken
  })

  it('should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'testing' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('Test Project')
  })

  it('should fail without auth', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'No Auth Project' })

    expect(res.status).toBe(401)
  })

  it('should fail without name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no name here' })

    expect(res.status).toBe(500)
  })

  it('should get all projects', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another Project' })

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})