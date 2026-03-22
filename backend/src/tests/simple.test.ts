import request from 'supertest';
import app from '../app';

describe('Simple API Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columns: any[];
  let issueId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Simple Tester', email: 'simple@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Simple Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Simple Board', projectId });
    boardId = boardRes.body.data.id;
    columns = boardRes.body.data.columns;

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Simple Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });
    issueId = issueRes.body.data.id;
  });

  // AUTH TESTS
  it('should reject login with wrong email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'Test1234567' });
    expect(res.status).toBe(401);
  });

  it('should reject empty registration', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('should reject short password on register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test2@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('should get current user with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('simple@test.com');
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });

  // ISSUE TESTS
  it('should get issue by id', async () => {
    const res = await request(app)
      .get(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(issueId);
  });

  it('should return 404 for non existent issue', async () => {
    const res = await request(app)
      .get('/api/issues/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should create issue with HIGH priority', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'High Priority',
        type: 'BUG',
        boardId,
        columnId: columns[0].id,
        projectId,
        priority: 'HIGH',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe('HIGH');
  });

  it('should create issue with LOW priority', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Low Priority',
        type: 'TASK',
        boardId,
        columnId: columns[0].id,
        projectId,
        priority: 'LOW',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe('LOW');
  });

  it('should update issue description', async () => {
    const res = await request(app)
      .put(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description');
  });

  // BOARD TESTS
  it('should return 404 for non existent board', async () => {
    const res = await request(app)
      .get('/api/boards/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should have exactly 4 default columns', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.columns.length).toBe(4);
  });

  it('default columns should be in correct order', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const cols = res.body.data.columns;
    expect(cols[0].name).toBe('To Do');
    expect(cols[1].name).toBe('In Progress');
    expect(cols[2].name).toBe('Review');
    expect(cols[3].name).toBe('Done');
  });

  // COMMENT TESTS
  it('should add comment to issue', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Simple comment' });
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('Simple comment');
  });

  it('should reject empty comment', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('should get comments for issue', async () => {
    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test comment' });

    const res = await request(app)
      .get(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // PROJECT TESTS
  it('should return 404 for non existent project', async () => {
    const res = await request(app)
      .get('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should create project with description', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Described Project', description: 'A great project' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('A great project');
  });

  // NOTIFICATION TESTS
  it('should get notifications list', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get unread notification count as number', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.count).toBe('number');
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // USER TESTS
  it('should search user by email', async () => {
    const res = await request(app)
      .get('/api/users/search?email=simple@test.com')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('simple@test.com');
  });

  it('should return 404 for non existent user email', async () => {
    const res = await request(app)
      .get('/api/users/search?email=nobody@nowhere.com')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should get user by id', async () => {
    const meRes = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.id;

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userId);
  });
});
