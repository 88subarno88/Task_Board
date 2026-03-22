import request from 'supertest';
import app from '../app';

describe('Member Management Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let projectId: string;

  beforeEach(async () => {
    // create admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin User', email: 'admin@test.com', password: 'Test1234567' });
    adminToken = adminRes.body.data.accessToken;

    // create member
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Member User', email: 'member@test.com', password: 'Test1234567' });
    memberToken = memberRes.body.data.accessToken;
    memberId = memberRes.body.data.user.id;

    // create project as admin
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Member Project' });
    projectId = projectRes.body.data.id;
  });

  it('should add a member to project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('PROJECT_MEMBER');
  });

  it('should get project members', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should block adding same member twice', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    expect(res.status).toBe(500);
  });

  it('should block non-admin from adding members', async () => {
    // add member first
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    // register third user
    const user3Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Third User', email: 'third@test.com', password: 'Test1234567' });
    const user3Id = user3Res.body.data.user.id;

    // try to add as member (not admin)
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: user3Id, role: 'PROJECT_MEMBER' });

    expect(res.status).toBe(403);
  });

  it('should update member role', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    const res = await request(app)
      .put(`/api/projects/${projectId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'PROJECT_ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('PROJECT_ADMIN');
  });

  it('should remove a member from project', async () => {
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: memberId, role: 'PROJECT_MEMBER' });

    const res = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
