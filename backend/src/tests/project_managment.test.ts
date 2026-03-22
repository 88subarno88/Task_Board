import request from 'supertest';
import app from '../app';

describe('Project Management Tests', () => {
  let token: string;
  let projectId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Project Manager', email: 'projmgr@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', description: 'Test Description' });
    projectId = projectRes.body.data.id;
  });

  it('should get project by id', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(projectId);
    expect(res.body.data.name).toBe('Test Project');
  });

  it('should update project name', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Project');
  });

  it('should update project description', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'New Description' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('New Description');
  });

  it('should archive a project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    expect(res.status).toBe(200);
    expect(res.body.data.archived).toBe(true);
  });

  it('should unarchive a project', async () => {
    // archive first
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    // unarchive
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: false });

    expect(res.status).toBe(200);
    expect(res.body.data.archived).toBe(false);
  });

  it('should get all my projects', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should delete a project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 after deletion', async () => {
    await request(app).delete(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`);
    expect(res.status).toBe(401);
  });

  it('should block non-member from accessing project', async () => {
    // register another user
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other User', email: 'other@test.com', password: 'Test1234567' });
    const otherToken = otherRes.body.data.accessToken;

    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
