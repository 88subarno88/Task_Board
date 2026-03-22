import request from 'supertest';
import app from '../app';

describe('User Tests', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User Tester', email: 'usertest@test.com', password: 'Test1234567' });
    token = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  it('should get current user profile', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('usertest@test.com');
  });

  it('should update user profile name', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('should update avatar', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'User Tester', avatarUrl: 'data:image/png;base64,abc123' });

    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toBe('data:image/png;base64,abc123');
  });

  it('should get user by id', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userId);
  });

  it('should search user by email', async () => {
    const res = await request(app)
      .get('/api/users/search?email=usertest@test.com')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('usertest@test.com');
  });

  it('should return 404 for non-existent email search', async () => {
    const res = await request(app)
      .get('/api/users/search?email=nobody@test.com')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should fail without auth', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
