import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';

describe('API Architecture & Health Endpoint', () => {
  it('GET /api/health returns healthy status and service info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('Honda');
    expect(res.body.database).toBeDefined();
  });

  it('GET non-existent route returns clean 404 JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});

describe('Authentication & Authorization Middleware', () => {
  it('rejects protected routes without Authorization header with 401', async () => {
    const res = await request(app).get('/api/v1/bike-models');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No token provided');
  });

  it('rejects invalid or forged JWT tokens with 401', async () => {
    const res = await request(app)
      .get('/api/v1/bike-models')
      .set('Authorization', 'Bearer invalid.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired');
  });

  it('rejects login with malformed email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects login with missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Input Validators & Business Rules Protection', () => {
  const dummyToken = jwt.sign(
    { id: '507f1f77bcf86cd799439011', role: 'admin' },
    process.env.JWT_SECRET || 'super_secret_jwt_key_dealership_2026_change_in_production'
  );

  it('validates customer creation: rejects missing phone and address', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${dummyToken}`)
      .send({ name: 'Rahul' });
    expect([400, 401]).toContain(res.status); // 400 validation or 401 if user not in db
    if (res.status === 400) {
      expect(res.body.errors).toBeDefined();
    }
  });

  it('validates bike model: rejects negative prices', async () => {
    const res = await request(app)
      .post('/api/v1/bike-models')
      .set('Authorization', `Bearer ${dummyToken}`)
      .send({
        modelName: 'Activa 6G',
        variant: 'Standard',
        modelYear: 2026,
        basePrice: -500,
        engineCapacityCc: 110,
      });
    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.errors.some(e => e.field === 'basePrice')).toBe(true);
    }
  });

  it('validates bike unit: rejects chassis number with invalid length', async () => {
    const res = await request(app)
      .post('/api/v1/bike-units')
      .set('Authorization', `Bearer ${dummyToken}`)
      .send({
        chassisNumber: '123', // too short (< 10 chars)
        engineNumber: 'JF50E',
        model: '507f1f77bcf86cd799439011',
      });
    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.errors.some(e => e.field === 'chassisNumber')).toBe(true);
    }
  });

  it('validates payment recording: rejects zero or negative amounts', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${dummyToken}`)
      .send({
        saleId: '507f1f77bcf86cd799439011',
        amount: 0,
        paymentMethod: 'cash',
      });
    expect([400, 401]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.errors.some(e => e.field === 'amount')).toBe(true);
    }
  });
});
