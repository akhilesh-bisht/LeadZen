/**
 * ============================================================================
 * ProspectPulse Backend Entry Point (Express + TypeScript)
 * Architecture: Model-View-Controller (MVC) Pattern
 * ============================================================================
 *
 * Folder Structure:
 *   - /src/server/models/       -> Mongoose Schemas & Type definitions (User, Lead)
 *   - /src/server/controllers/  -> Request handling & business orchestration
 *   - /src/server/routes/       -> Modular Express REST endpoints (/api/*)
 *   - /src/server/middlewares/  -> JWT/Bearer Auth verification & RBAC
 *   - /src/server/services/     -> Data providers, crypto hashing, persistent stores
 *
 * Seeded Accounts:
 *   - Administrator: akhilesh@gmail.com (pass: akhilesh)
 *   - Sales Rep 1:   dhananjay@company.sales (pass: password123)
 *   - Sales Rep 2:   harsh@company.sales (pass: password123)
 * ============================================================================
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Database & Persistence initialization
import { connectToDatabase, getDatabaseStatus } from './src/lib/mongodb.js';

// Modular MVC Routers
import authRoutes from './src/server/routes/authRoutes.js';
import leadRoutes from './src/server/routes/leadRoutes.js';
import teamRoutes from './src/server/routes/teamRoutes.js';
import searchRoutes from './src/server/routes/searchRoutes.js';
import dashboardRoutes from './src/server/routes/dashboardRoutes.js';
import exportRoutes from './src/server/routes/exportRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database / MongoDB connection on server boot
  await connectToDatabase();

  // --------------------------------------------------------------------------
  // 1. Health & Database Diagnostic Routes
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/db-status', (req, res) => {
    res.json(getDatabaseStatus());
  });

  // --------------------------------------------------------------------------
  // 2. Mount Modular MVC API Routes
  // --------------------------------------------------------------------------
  // Authentication & User Management (Login, Register, User Roster)
  app.use('/api/auth', authRoutes);

  // CRM Leads Management (Search, CRUD, Assign, Social Enrichment)
  app.use('/api/leads', leadRoutes);

  // Sales Team & Workload Allocation (Roster, Reps)
  app.use('/api/team', teamRoutes);

  // Live Business Prospecting Search
  app.use('/api/search', searchRoutes);

  // Aggregated Pipeline & Workload Metrics
  app.use('/api/dashboard', dashboardRoutes);

  // Excel (.xlsx) Report Generation
  app.use('/api/export', exportRoutes);

  // --------------------------------------------------------------------------
  // 3. Vite Middleware (Development) / Static Asset Serving (Production)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP Server on 0.0.0.0:3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProspectPulse Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
