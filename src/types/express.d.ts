import { DriftClient } from '@drift-labs/sdk';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      driftClient?: DriftClient;
    }
  }
}