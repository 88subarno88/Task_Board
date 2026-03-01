import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Tests that ensure login and signup work', () => {
  const myTestUser = {
    email: 'atester@gmail.com',
    password: 'PasswOrd123',
    name: 'ATester',
  };

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: myTestUser.email },
    });
  });

  describe('Testing the registration ', () => {
    it('This should allow a brand new user sign up', async () => {
      const res = await request(app).post('/api/auth/register').send(myTestUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(myTestUser.email);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('This should stop using same email twice', async () => {
      await request(app).post('/api/auth/register').send(myTestUser);

      const res = await request(app).post('/api/auth/register').send(myTestUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('A user associated with this email already exists.');
    });

    it('should reject a password that is too weak', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...myTestUser,
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('This should catch missing name', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: myTestUser.email,
        password: myTestUser.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You forgot to fill name.');
    });
  });

  describe('Testing the Login ', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(myTestUser);
    });

    it(' should log in if password is correct.', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: myTestUser.email,
        password: myTestUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful!');
    });

    it('shouldnot login if password is incorrect ', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: myTestUser.email,
        password: 'WrongPassword123',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid  password');
    });
  });

  describe('Testing the /me route (Profile)', () => {
    let myToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(myTestUser);

      myToken = res.body.data.accessToken;
    });

    it('This should show a profile if someone has a valid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${myToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(myTestUser.email);
    });

    it('should fail if  donot send a token ', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('No authorization header found.');
    });

    it('should fail if the token isnot valid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer this_isnot_a_real_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
