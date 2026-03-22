import request from 'supertest';
import app from '../app';

describe('Board Management Tests', () => {
  let token: string;
  let projectId: string;
  let boardId: string;
  let columnId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Board Manager', email: 'boardmgr@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board Mgmt Project' });
    projectId = projectRes.body.data.id;

    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Board', projectId });
    boardId = boardRes.body.data.id;
    columnId = boardRes.body.data.columns[0].id;
  });

  it('should get a board by id', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(boardId);
    expect(res.body.data.columns.length).toBe(4);
  });

  it('should update board name', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Board Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Board Name');
  });

  it('should delete a board', async () => {
    const res = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for deleted board', async () => {
    await request(app).delete(`/api/boards/${boardId}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should add a column to board', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Column' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('New Column');
  });

  it('should add a column with WIP limit', async () => {
    const res = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Limited Column', wipLimit: 3 });

    expect(res.status).toBe(201);
    expect(res.body.data.wipLimit).toBe(3);
  });

  it('should update a column name', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/columns/${columnId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Column' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Column');
  });

  it('should update a column WIP limit', async () => {
    const res = await request(app)
      .put(`/api/boards/${boardId}/columns/${columnId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ wipLimit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.wipLimit).toBe(5);
  });

  it('should delete a column', async () => {
    // add extra column first
    const colRes = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });
    const newColId = colRes.body.data.id;

    const res = await request(app)
      .delete(`/api/boards/${boardId}/columns/${newColId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get(`/api/boards/${boardId}`);
    expect(res.status).toBe(401);
  });
});
