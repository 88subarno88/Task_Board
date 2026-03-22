import request from 'supertest';
import app from '../app';

describe('WIP Limit Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'WIP Tester', email: 'wiptest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WIP Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WIP Board', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;
  });

  it('should set WIP limit on column', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Limited Column', wipLimit: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.wipLimit).toBe(2);
  });

  it('should block issue creation when WIP limit reached', async () => {
    // create column with WIP limit of 1
    const colRes = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Strict Column', wipLimit: 1 });
    const limitedColumnId = colRes.body.data.id;

    // create first issue - should succeed
    await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Issue 1', type: 'TASK', boardId, columnId: limitedColumnId, projectId });

    // create second issue - should fail
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Issue 2', type: 'TASK', boardId, columnId: limitedColumnId, projectId });

    expect(res.status).toBe(400);
  });

  it('should allow issue creation when no WIP limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Issue ${i}`, type: 'TASK', boardId, columnId, projectId });
      expect(res.status).toBe(201);
    }
  });
});
