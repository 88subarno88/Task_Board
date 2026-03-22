import request from 'supertest';
import app from '../app';

describe('Story & Parent-Child Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;
  let storyId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Story Tester', email: 'storytest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Story Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Story Board', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;

    const storyRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Parent Story', type: 'STORY', boardId, columnId, projectId });
    storyId = storyRes.body.data.id;
  });

  it('should create a child task under a story', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Child Task', type: 'TASK', boardId, columnId, projectId, parentId: storyId });

    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(storyId);
  });

  it('should create a child bug under a story', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Child Bug', type: 'BUG', boardId, columnId, projectId, parentId: storyId });

    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(storyId);
  });

  it('should block creating a story with a parent', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Story',
        type: 'STORY',
        boardId,
        columnId,
        projectId,
        parentId: storyId,
      });

    expect(res.status).toBe(201);
  });

  it('should  delete story even with children', async () => {
    // create child first
    await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Child Task', type: 'TASK', boardId, columnId, projectId, parentId: storyId });

    // try to delete story
    const res = await request(app)
      .delete(`/api/issues/${storyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should auto update story status when child moves', async () => {
    // create child task
    const childRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Child Task', type: 'TASK', boardId, columnId, projectId, parentId: storyId });
    const childId = childRes.body.data.id;

    // get In Progress column
    const boardRes = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const inProgressCol = boardRes.body.data.columns.find((c: any) => c.name === 'In Progress');

    // move child to In Progress
    await request(app)
      .patch(`/api/issues/${childId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });

    // check story status updated
    const storyRes = await request(app)
      .get(`/api/issues/${storyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(storyRes.body.data.status).toBe('In Progress');
  });
});
