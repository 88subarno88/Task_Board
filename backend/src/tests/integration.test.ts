import request from 'supertest';
import app from '../app';

describe('Integration Tests - Full Workflows', () => {
  let token: string;
  let token2: string;
  let userId2: string;
  let projectId: string;
  let boardId: string;
  let columns: any[];

  beforeEach(async () => {
    // setup two users
    const user1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Test1234567' });
    token = user1.body.data.accessToken;

    const user2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'Test1234567' });
    token2 = user2.body.data.accessToken;
    userId2 = user2.body.data.user.id;

    // create project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration Project', description: 'Full workflow test' });
    projectId = projectRes.body.data.id;

    // create board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint 1', projectId });
    boardId = boardRes.body.data.id;
    columns = boardRes.body.data.columns;
  });

  it('full issue lifecycle - create, move through all stages, complete', async () => {
    const todoCol = columns.find((c: any) => c.name === 'To Do');
    const inProgressCol = columns.find((c: any) => c.name === 'In Progress');
    const reviewCol = columns.find((c: any) => c.name === 'Review');
    const doneCol = columns.find((c: any) => c.name === 'Done');

    // create issue
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Full Lifecycle Issue',
        type: 'TASK',
        boardId,
        columnId: todoCol.id,
        projectId,
      });
    const issueId = issueRes.body.data.id;
    expect(issueRes.body.data.status).toBe('To Do');

    // move to In Progress
    const move1 = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });
    expect(move1.body.data.status).toBe('In Progress');

    // move to Review
    const move2 = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: reviewCol.id });
    expect(move2.body.data.status).toBe('Review');

    // move to Done
    const move3 = await request(app)
      .patch(`/api/issues/${issueId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: doneCol.id });
    expect(move3.body.data.status).toBe('Done');
    expect(move3.body.data.closedAt).not.toBeNull();
  });

  it('full collaboration workflow - add member, assign issue, comment, notify', async () => {
    const todoCol = columns[0];

    // add bob to project
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: userId2, role: 'PROJECT_MEMBER' });

    // create issue assigned to bob
    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Collaborative Issue',
        type: 'TASK',
        boardId,
        columnId: todoCol.id,
        projectId,
        assigneeId: userId2,
      });
    const issueId = issueRes.body.data.id;

    // alice comments
    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hey Bob, please check this!' });

    // bob should have notifications
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token2}`);
    expect(notifRes.body.data.length).toBeGreaterThan(0);

    // bob comments back
    const commentRes = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'On it!' });
    expect(commentRes.status).toBe(201);

    // verify comments exist
    const commentsRes = await request(app)
      .get(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(commentsRes.body.data.length).toBe(2);
  });

  it('story with multiple child tasks - auto status derivation', async () => {
    const todoCol = columns.find((c: any) => c.name === 'To Do');
    const inProgressCol = columns.find((c: any) => c.name === 'In Progress');
    const doneCol = columns.find((c: any) => c.name === 'Done');

    // create story
    const storyRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Big Story', type: 'STORY', boardId, columnId: todoCol.id, projectId });
    const storyId = storyRes.body.data.id;

    // create two child tasks
    const task1Res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task 1',
        type: 'TASK',
        boardId,
        columnId: todoCol.id,
        projectId,
        parentId: storyId,
      });
    const task1Id = task1Res.body.data.id;

    const task2Res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task 2',
        type: 'TASK',
        boardId,
        columnId: todoCol.id,
        projectId,
        parentId: storyId,
      });
    const task2Id = task2Res.body.data.id;

    // move task1 to In Progress - story should become In Progress
    await request(app)
      .patch(`/api/issues/${task1Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });

    const storyCheck1 = await request(app)
      .get(`/api/issues/${storyId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(storyCheck1.body.data.status).toBe('In Progress');

    // move task1 to Done
    const reviewCol = columns.find((c: any) => c.name === 'Review');
    await request(app)
      .patch(`/api/issues/${task1Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: reviewCol.id });
    await request(app)
      .patch(`/api/issues/${task1Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: doneCol.id });

    // move task2 to Done
    await request(app)
      .patch(`/api/issues/${task2Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: inProgressCol.id });
    await request(app)
      .patch(`/api/issues/${task2Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: reviewCol.id });
    await request(app)
      .patch(`/api/issues/${task2Id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: doneCol.id });

    // story should now be Done
    const storyCheck2 = await request(app)
      .get(`/api/issues/${storyId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(storyCheck2.body.data.status).toBe('Done');
  });

  it('project admin can manage members and roles', async () => {
    // add bob as viewer
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: userId2, role: 'PROJECT_VIEWER' });

    // bob can view project
    const viewRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(viewRes.status).toBe(200);

    // promote bob to admin
    await request(app)
      .put(`/api/projects/${projectId}/members/${userId2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'PROJECT_ADMIN' });

    // bob can now create board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Bobs Board', projectId });
    expect(boardRes.status).toBe(201);
  });

  it('WIP limit enforced across create and move operations', async () => {
    // add limited column
    const colRes = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Capped Column', wipLimit: 2 });
    const cappedColId = colRes.body.data.id;

    const todoCol = columns[0];

    // create 2 issues directly in capped column - should work
    await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Issue A', type: 'TASK', boardId, columnId: cappedColId, projectId });
    await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Issue B', type: 'TASK', boardId, columnId: cappedColId, projectId });

    // third issue should fail
    const failRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Issue C', type: 'TASK', boardId, columnId: cappedColId, projectId });
    expect(failRes.status).toBe(400);

    // also block moving into capped column
    const issue = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Move Issue', type: 'TASK', boardId, columnId: todoCol.id, projectId });

    // try to move to capped column
    const moveRes = await request(app)
      .patch(`/api/issues/${issue.body.data.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ columnId: cappedColId });
    expect(moveRes.status).toBe(400);
  });

  it('comment edit and delete own comments only', async () => {
    const todoCol = columns[0];

    // add bob to project
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: userId2, role: 'PROJECT_MEMBER' });

    const issueRes = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Comment Issue', type: 'TASK', boardId, columnId: todoCol.id, projectId });
    const issueId = issueRes.body.data.id;

    // alice adds comment
    const commentRes = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Original comment' });
    const commentId = commentRes.body.data.id;

    // alice edits own comment
    const editRes = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Edited comment' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.content).toBe('Edited comment');

    // bob cannot edit alice comment
    const bobEditRes = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'Bob edited' });
    expect(bobEditRes.status).toBe(403);

    // bob cannot delete alice comment
    const bobDeleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(bobDeleteRes.status).toBe(403);

    // alice can delete own comment
    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
  });
});
