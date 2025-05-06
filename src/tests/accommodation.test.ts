import request from 'supertest';
import express from 'express';
import accommodationRouter from '../routes/accommodation.routes';
import prisma from '../prisma/client';

jest.mock('../prisma/client', () => ({
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn()
      },
      accommodation: {
        create: jest.fn()
      }
    }
}));

const app = express();
app.use(express.json());
app.use('/createAccommodations', accommodationRouter);

describe('POST /createAccommodations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an accommodation for a valid OWNER', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: 'OWNER',
    });

    (prisma.accommodation.create as jest.Mock).mockResolvedValue({
      ACCN_ID: 1,
      ACCC_NAME: 'Test House',
      ACCC_TYPE: 'House',
      ACCC_DESC: 'A test house',
      ACCC_ADDRESS: '123 Main St',
      ACCB_AVAILABLE: true,
      USEN_ID: 1,
    });

    const response = await request(app)
      .post('/createAccommodations')
      .send({
        ACCC_NAME: 'Test House',
        ACCC_TYPE: 'House',
        ACCC_DESC: 'A test house',
        ACCC_ADDRESS: '123 Main St',
        ACCB_AVAILABLE: true,
        USEN_ID: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.ACCN_ID).toBeDefined();
  });

  it('should return 404 if user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/createAccommodations')
      .send({
        ACCC_NAME: 'Test House',
        ACCC_TYPE: 'House',
        ACCC_DESC: 'A test house',
        ACCC_ADDRESS: '123 Main St',
        ACCB_AVAILABLE: true,
        USEN_ID: 999,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should return 403 if user is not an OWNER', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 2,
      USEC_TYPE: 'TENANT',
    });

    const response = await request(app)
      .post('/createAccommodations')
      .send({
        ACCC_NAME: 'Test House',
        ACCC_TYPE: 'House',
        ACCC_DESC: 'A test house',
        ACCC_ADDRESS: '123 Main St',
        ACCB_AVAILABLE: true,
        USEN_ID: 2,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only owners can create accommodations');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/createAccommodations')
      .send({
        ACCC_TYPE: 'House',
        ACCC_DESC: 'A test house',
        ACCC_ADDRESS: '123 Main St',
        ACCB_AVAILABLE: true,
        USEN_ID: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });

  it('should handle internal server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      USEN_ID: 1,
      USEC_TYPE: 'OWNER',
    });

    (prisma.accommodation.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const response = await request(app)
      .post('/createAccommodations')
      .send({
        ACCC_NAME: 'Test House',
        ACCC_TYPE: 'House',
        ACCC_DESC: 'A test house',
        ACCC_ADDRESS: '123 Main St',
        ACCB_AVAILABLE: true,
        USEN_ID: 1,
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Error creating accommodation');
  });
});