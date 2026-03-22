import request from 'supertest';
import app from '../app';

describe('Notification Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Notif Tester', email: 'notiftest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Notif Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Notif Board', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;
  });

  it('should get empty notifications initially', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get unread count', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBeDefined();
  });

  it('should mark all as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should create notification when issue is assigned', async () => {
    // register second user
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Assignee', email: 'assignee@test.com', password: 'Test1234567' });
    const user2Token = user2Res.body.data.accessToken;
    const user2Id = user2Res.body.data.user.id;

    // create issue assigned to user2
    await request(app).post('/api/issues').set('Authorization', `Bearer ${token}`).send({
      title: 'Assigned Issue',
      type: 'TASK',
      boardId,
      columnId,
      projectId,
      assigneeId: user2Id,
    });

    // check user2 notifications
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(notifRes.body.data.length).toBeGreaterThan(0);
    expect(notifRes.body.data[0].type).toBe('ASSIGNED');
  });

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});
