import request from 'supertest';
import app from '../app';

describe('Integration Tests 2 - Edge Cases & Security', () => {
  let token: string;
  let token2: string;
  let userId2: string;
  let projectId: string;
  let boardId: string;
  let columns: any[];

  beforeEach(async () => {
    const user1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Charlie', email: 'charlie@test.com', password: 'Test1234567' });
    token = user1.body.data.accessToken;

    const user2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Diana', email: 'diana@test.com', password: 'Test1234567' });
    token2 = user2.body.data.accessToken;
    userId2 = user2.body.data.user.id;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration2 Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration2 Board', projectId });
    boardId = boardRes.body.data.id;
    columns = boardRes.body.data.columns;
  });

  it('non member cannot access project boards', async () => {
    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token2}`)
      .query({ projectId });

    // either empty array or 403
    const isEmpty = !res.body.data || res.body.data.length === 0;
    const isForbidden = res.status === 403;
    expect(isEmpty || isForbidden).toBe(true);
  });

  it('non member cannot create issues', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hack Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });

    expect(res.status).toBe(403);
  });

  it('member can create issues after being added', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: userId2, role: 'PROJECT_MEMBER' });

    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Member Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });

    expect(res.status).toBe(201);
  });

  it('should not allow moving issue backwards past To Do', async () => {
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Backward Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });
    const issueId = issueRes.body.data.id;

    // try to move from To Do to Done directly
    const doneCol = columns.find((c: any) => c.name === 'Done');
    const res = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: doneCol.id });

    expect(res.status).toBe(400);
  });

  it('should track multiple status changes in audit log', async () => {
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Audit Trail Issue',
        type: 'TASK',
        boardId,
        columnId: columns[0].id,
        projectId,
      });
    const issueId = issueRes.body.data.id;

    const inProgressCol = columns.find((c: any) => c.name === 'In Progress');
    const reviewCol = columns.find((c: any) => c.name === 'Review');

    await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });

    await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: reviewCol.id });

    const auditRes = await request(app)
      .get(`/api/issues/${issueId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle multiple comments on same issue', async () => {
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Multi Comment Issue',
        type: 'TASK',
        boardId,
        columnId: columns[0].id,
        projectId,
      });
    const issueId = issueRes.body.data.id;

    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment 1' });

    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment 2' });

    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment 3' });

    const res = await request(app)
      .get(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.length).toBe(3);
  });

  it('should get issue with all related data', async () => {
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Full Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });
    const issueId = issueRes.body.data.id;

    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'A comment' });

    const res = await request(app)
      .get(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comments).toBeDefined();
    expect(res.body.data.reporter).toBeDefined();
    expect(res.body.data.column).toBeDefined();
  });

  it('should create multiple boards in same project', async () => {
    const board2Res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 2', projectId });

    const board3Res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 3', projectId });

    expect(board2Res.status).toBe(201);
    expect(board3Res.status).toBe(201);

    const boardsRes = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(boardsRes.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('should mark notification as read', async () => {
    // create issue assigned to user2
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: userId2, role: 'PROJECT_MEMBER' });

    await request(app).post('/api/issues').set('Authorization', `Bearer ${token}`).send({
      title: 'Notif Issue',
      type: 'TASK',
      boardId,
      columnId: columns[0].id,
      projectId,
      assigneeId: userId2,
    });

    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token2}`);
    const notifId = notifRes.body.data[0].id;

    const markRes = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${token2}`);

    expect(markRes.status).toBe(200);

    // verify unread count decreased
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token2}`);

    expect(countRes.body.data.count).toBe(0);
  });

  it('should create BUG and TASK under same story', async () => {
    const storyRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Parent Story', type: 'STORY', boardId, columnId: columns[0].id, projectId });
    const storyId = storyRes.body.data.id;

    const taskRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Child Task',
        type: 'TASK',
        boardId,
        columnId: columns[0].id,
        projectId,
        parentId: storyId,
      });

    const bugRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Child Bug',
        type: 'BUG',
        boardId,
        columnId: columns[0].id,
        projectId,
        parentId: storyId,
      });

    expect(taskRes.status).toBe(201);
    expect(bugRes.status).toBe(201);

    const storyCheck = await request(app)
      .get(`/api/issues/${storyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(storyCheck.body.data.children.length).toBe(2);
  });

  it('should update issue priority', async () => {
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Priority Issue', type: 'TASK', boardId, columnId: columns[0].id, projectId });
    const issueId = issueRes.body.data.id;

    const res = await request(app)
      .put(`/api/issues/${issueId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'CRITICAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('CRITICAL');
  });

  it('should get empty boards list for new project', async () => {
    const newProjectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Empty Project' });
    const newProjectId = newProjectRes.body.data.id;

    const res = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId: newProjectId });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('should handle issue with due date', async () => {
    const dueDate = '2026-12-31T00:00:00.000Z';
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Due Date Issue',
        type: 'TASK',
        boardId,
        columnId: columns[0].id,
        projectId,
        dueDate,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.dueDate).toBeDefined();
  });
});
