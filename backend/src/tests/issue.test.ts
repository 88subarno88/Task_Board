import request from 'supertest';
import app from '../app';

describe('Issue Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;
  let issueId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Issue Tester', email: 'issuetest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Issue Test Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Issue', type: 'TASK', boardId, columnId, projectId });
    issueId = issueRes.body.data.id;
  });

  it('should create a TASK issue', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Task', type: 'TASK', boardId, columnId, projectId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('TASK');
    expect(res.body.data.status).toBe('To Do');
  });

  it('should create a BUG issue', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Bug', type: 'BUG', boardId, columnId, projectId });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('BUG');
  });

  it('should create a STORY issue', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Story', type: 'STORY', boardId, columnId, projectId });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('STORY');
  });

  it('should get issues by board', async () => {
    const res = await request(app)
      .get(`/api/issues?boardId=${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should update an issue', async () => {
    const res = await request(app)
      .put(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', priority: 'HIGH' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.priority).toBe('HIGH');
  });

  it('should block invalid status transition', async () => {
    // get Done column
    const boardRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const doneColumn = boardRes.body.data.columns.find((c: any) => c.name === 'Done');

    const res = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: doneColumn.id });

    // should fail - can't go from To Do to Done directly
    expect(res.status).toBe(400);
  });

  it('should move issue to valid column', async () => {
    const boardRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const inProgressColumn = boardRes.body.data.columns.find((c: any) => c.name === 'In Progress');

    const res = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressColumn.id });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Progress');
  });

  it('should delete an issue', async () => {
    const res = await request(app)
      .delete(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
