import request from 'supertest';
import app from '../app';

describe('Audit Log Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;
  let issueId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Audit Tester', email: 'audittest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audit Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audit Board', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Audit Issue', type: 'TASK', boardId, columnId, projectId });
    issueId = issueRes.body.data.id;
  });

  it('should return audit logs for an issue', async () => {
    const res = await request(app)
      .get(`/api/issues/${issueId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should log status change when issue is moved', async () => {
    const boardRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const inProgressCol = boardRes.body.data.columns.find((c: any) => c.name === 'In Progress');

    await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });

    const auditRes = await request(app)
      .get(`/api/issues/${issueId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(auditRes.body.data.length).toBeGreaterThan(0);
    const statusLog = auditRes.body.data.find((log: any) => log.action === 'STATUS_CHANGED');
    expect(statusLog).toBeDefined();
    expect(statusLog.newValue).toBe('In Progress');
  });

  it('should log assignee change', async () => {
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Assignee User', email: 'assigneeaudit@test.com', password: 'Test1234567' });
    const user2Id = user2Res.body.data.user.id;

    await request(app)
      .put(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assigneeId: user2Id });

    const auditRes = await request(app)
      .get(`/api/issues/${issueId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    const assigneeLog = auditRes.body.data.find((log: any) => log.action === 'ASSIGNEE_CHANGED');
    expect(assigneeLog).toBeDefined();
    expect(assigneeLog.newValue).toBe(user2Id);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get(`/api/issues/${issueId}/audit`);
    expect(res.status).toBe(401);
  });
});
