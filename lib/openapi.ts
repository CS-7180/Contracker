import type { OpenAPIV3 } from 'openapi-types'

const spec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Contracker API',
    description:
      'REST API for the Contracker contract and supplier management platform. ' +
      'All routes (except signup and the cron endpoint) require a valid Supabase ' +
      'session cookie. Admin-only routes additionally require `role = "admin"` on ' +
      'the caller\'s profile row.',
    version: '1.0.0',
    contact: {
      name: 'Vineela Goli / Raj Laskar',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local dev server' },
    { url: 'https://contracker-zeta.vercel.app', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Signup and session management' },
    { name: 'Contracts', description: 'Contract CRUD and PDF upload' },
    { name: 'Suppliers', description: 'Supplier CRUD' },
    { name: 'Certifications', description: 'Supplier compliance certifications' },
    { name: 'Notifications', description: 'In-app renewal notifications' },
    { name: 'Dashboard', description: 'Portfolio health summary' },
    { name: 'Spend', description: 'Spend aggregation by supplier and category' },
    { name: 'Team', description: 'Member management (Admin only)' },
    { name: 'Cron', description: 'Internal scheduled jobs (CRON_SECRET required)' },
  ],
  components: {
    securitySchemes: {
      supabaseCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Supabase session cookie set after login.',
      },
    },
    schemas: {
      // ─── Generic wrappers ───────────────────────────────────────────────
      ErrorDetail: {
        type: 'object',
        required: ['message', 'code'],
        properties: {
          message: { type: 'string', example: 'Unauthorized' },
          code: { type: 'string', example: '401' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['data', 'error'],
        properties: {
          data: { type: 'object', nullable: true, example: null },
          error: { $ref: '#/components/schemas/ErrorDetail' },
        },
      },
      // ─── Shared primitives ───────────────────────────────────────────────
      UUID: {
        type: 'string',
        format: 'uuid',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      ISODate: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        example: '2026-06-30',
      },
      ISOTimestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-01T12:00:00.000Z',
      },
      ContractType: {
        type: 'string',
        enum: ['service', 'purchase', 'lease', 'other'],
      },
      ContractStatus: {
        type: 'string',
        enum: ['active', 'expiring', 'expired'],
        description:
          'Computed server-side from end_date, renewal_date, notice_period_days. Never stored in the DB.',
      },
      RiskColour: {
        type: 'string',
        enum: ['green', 'amber', 'red'],
        description:
          'green = renewal > 60 days away; amber = ≤60 days but outside notice period; red = within notice period or expired.',
      },
      CertType: {
        type: 'string',
        enum: ['ISO', 'NDA', 'insurance', 'other'],
      },
      CertStatus: {
        type: 'string',
        enum: ['valid', 'expiring', 'expired'],
        description: 'valid = expiry > 30 days; expiring = ≤30 days; expired = past.',
      },
      UserRole: {
        type: 'string',
        enum: ['admin', 'member', 'super_admin'],
      },
      // ─── Contract ────────────────────────────────────────────────────────
      Contract: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/UUID' },
          contract_number: { type: 'string', example: 'CON-A1B2C3D4' },
          name: { type: 'string', example: 'Office 365 Subscription' },
          type: { $ref: '#/components/schemas/ContractType' },
          supplier_id: { $ref: '#/components/schemas/UUID' },
          category: { type: 'string', nullable: true, example: 'Software' },
          start_date: { $ref: '#/components/schemas/ISODate' },
          end_date: { $ref: '#/components/schemas/ISODate' },
          renewal_date: { $ref: '#/components/schemas/ISODate' },
          notice_period_days: { type: 'integer', example: 30 },
          value: { type: 'number', nullable: true, example: 12000.0 },
          pdf_url: { type: 'string', nullable: true, example: 'uuid.pdf' },
          created_by: { $ref: '#/components/schemas/UUID' },
          created_at: { $ref: '#/components/schemas/ISOTimestamp' },
          updated_at: { $ref: '#/components/schemas/ISOTimestamp' },
          status: { $ref: '#/components/schemas/ContractStatus' },
          risk_colour: { $ref: '#/components/schemas/RiskColour' },
        },
      },
      ContractWithSupplier: {
        allOf: [
          { $ref: '#/components/schemas/Contract' },
          {
            type: 'object',
            properties: {
              suppliers: {
                type: 'object',
                properties: {
                  id: { $ref: '#/components/schemas/UUID' },
                  name: { type: 'string', example: 'Acme Corp' },
                },
              },
              signed_url: {
                type: 'string',
                nullable: true,
                description: '15-minute Supabase Storage signed URL for the PDF (single-contract GET only).',
                example: 'https://supabase.co/storage/v1/object/sign/...',
              },
            },
          },
        ],
      },
      ContractCreate: {
        type: 'object',
        required: ['name', 'type', 'supplier_id', 'start_date', 'end_date', 'renewal_date'],
        properties: {
          contract_number: {
            type: 'string',
            description: 'Omit to auto-generate a CON-XXXXXXXX identifier.',
          },
          name: { type: 'string', minLength: 1, example: 'Office 365 Subscription' },
          type: { $ref: '#/components/schemas/ContractType' },
          supplier_id: { $ref: '#/components/schemas/UUID' },
          category: { type: 'string', example: 'Software' },
          start_date: { $ref: '#/components/schemas/ISODate' },
          end_date: { $ref: '#/components/schemas/ISODate' },
          renewal_date: { $ref: '#/components/schemas/ISODate' },
          notice_period_days: {
            type: 'integer',
            minimum: 1,
            default: 30,
            example: 30,
          },
          value: { type: 'number', minimum: 0, example: 12000.0 },
        },
      },
      ContractUpdate: {
        type: 'object',
        description: 'All fields optional — only provided fields are updated.',
        properties: {
          name: { type: 'string', minLength: 1 },
          type: { $ref: '#/components/schemas/ContractType' },
          supplier_id: { $ref: '#/components/schemas/UUID' },
          category: { type: 'string', nullable: true },
          start_date: { $ref: '#/components/schemas/ISODate' },
          end_date: { $ref: '#/components/schemas/ISODate' },
          renewal_date: { $ref: '#/components/schemas/ISODate' },
          notice_period_days: { type: 'integer', minimum: 1 },
          value: { type: 'number', nullable: true },
        },
      },
      // ─── Supplier ────────────────────────────────────────────────────────
      Supplier: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/UUID' },
          name: { type: 'string', example: 'Acme Corp' },
          contact_name: { type: 'string', nullable: true, example: 'Jane Doe' },
          contact_email: { type: 'string', format: 'email', nullable: true },
          contact_phone: { type: 'string', nullable: true, example: '+1 555-0100' },
          category: { type: 'string', nullable: true, example: 'Software' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_by: { $ref: '#/components/schemas/UUID' },
          created_at: { $ref: '#/components/schemas/ISOTimestamp' },
          updated_at: { $ref: '#/components/schemas/ISOTimestamp' },
          max_contract_risk: {
            $ref: '#/components/schemas/RiskColour',
            nullable: true,
            description: 'Worst risk colour across all active contracts. null if no contracts.',
          } as OpenAPIV3.ReferenceObject,
        },
      },
      SupplierWithDetails: {
        allOf: [
          { $ref: '#/components/schemas/Supplier' },
          {
            type: 'object',
            properties: {
              contracts: {
                type: 'array',
                items: { $ref: '#/components/schemas/Contract' },
              },
              certifications: {
                type: 'array',
                items: { $ref: '#/components/schemas/Certification' },
              },
            },
          },
        ],
      },
      SupplierCreate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Acme Corp' },
          contact_name: { type: 'string', example: 'Jane Doe' },
          contact_email: { type: 'string', format: 'email', example: 'jane@acme.com' },
          contact_phone: { type: 'string', example: '+1 555-0100' },
          category: { type: 'string', example: 'Software' },
        },
      },
      SupplierUpdate: {
        type: 'object',
        description: 'All fields optional.',
        properties: {
          name: { type: 'string', minLength: 1 },
          contact_name: { type: 'string' },
          contact_email: { type: 'string', format: 'email' },
          contact_phone: { type: 'string' },
          category: { type: 'string' },
        },
      },
      // ─── Certification ───────────────────────────────────────────────────
      Certification: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/UUID' },
          supplier_id: { $ref: '#/components/schemas/UUID' },
          cert_type: { $ref: '#/components/schemas/CertType' },
          issued_date: { $ref: '#/components/schemas/ISODate', nullable: true } as OpenAPIV3.ReferenceObject,
          expiry_date: { $ref: '#/components/schemas/ISODate' },
          document_url: { type: 'string', nullable: true },
          created_by: { $ref: '#/components/schemas/UUID' },
          created_at: { $ref: '#/components/schemas/ISOTimestamp' },
          updated_at: { $ref: '#/components/schemas/ISOTimestamp' },
          status: { $ref: '#/components/schemas/CertStatus' },
        },
      },
      CertificationCreate: {
        type: 'object',
        required: ['supplier_id', 'cert_type', 'expiry_date'],
        properties: {
          supplier_id: { $ref: '#/components/schemas/UUID' },
          cert_type: { $ref: '#/components/schemas/CertType' },
          issued_date: { $ref: '#/components/schemas/ISODate' },
          expiry_date: { $ref: '#/components/schemas/ISODate' },
          document_url: { type: 'string', format: 'uri' },
        },
      },
      CertificationUpdate: {
        type: 'object',
        description: 'All fields optional.',
        properties: {
          cert_type: { $ref: '#/components/schemas/CertType' },
          issued_date: { $ref: '#/components/schemas/ISODate' },
          expiry_date: { $ref: '#/components/schemas/ISODate' },
          document_url: { type: 'string', format: 'uri' },
        },
      },
      // ─── Notification ────────────────────────────────────────────────────
      Notification: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/UUID' },
          user_id: { $ref: '#/components/schemas/UUID' },
          contract_id: { $ref: '#/components/schemas/UUID' },
          threshold_days: {
            type: 'integer',
            enum: [60, 30, 7],
            description: 'Which alert threshold triggered this notification.',
          },
          message: { type: 'string', example: 'Contract renews in 30 days — action required' },
          is_read: { type: 'boolean', example: false },
          created_at: { $ref: '#/components/schemas/ISOTimestamp' },
          contracts: {
            type: 'object',
            nullable: true,
            properties: {
              id: { $ref: '#/components/schemas/UUID' },
              name: { type: 'string', example: 'Office 365 Subscription' },
              renewal_date: { $ref: '#/components/schemas/ISODate' },
              suppliers: {
                type: 'object',
                nullable: true,
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      },
      // ─── Dashboard ───────────────────────────────────────────────────────
      DashboardData: {
        type: 'object',
        properties: {
          active_count: { type: 'integer', example: 12 },
          expiring_count: { type: 'integer', example: 3 },
          expired_count: { type: 'integer', example: 1 },
          green_count: { type: 'integer', example: 10 },
          amber_count: { type: 'integer', example: 4 },
          red_count: { type: 'integer', example: 2 },
          total_value: {
            type: 'number',
            description: 'Sum of values of all non-expired contracts.',
            example: 250000,
          },
          expiring_soon: {
            type: 'array',
            description: 'Contracts whose renewal_date is within 30 days.',
            items: {
              type: 'object',
              properties: {
                id: { $ref: '#/components/schemas/UUID' },
                name: { type: 'string' },
                renewal_date: { $ref: '#/components/schemas/ISODate' },
                end_date: { $ref: '#/components/schemas/ISODate' },
                notice_period_days: { type: 'integer' },
                value: { type: 'number', nullable: true },
                risk_colour: { $ref: '#/components/schemas/RiskColour' },
              },
            },
          },
        },
      },
      // ─── Spend ───────────────────────────────────────────────────────────
      SupplierSpend: {
        type: 'object',
        properties: {
          supplier_id: { $ref: '#/components/schemas/UUID' },
          supplier_name: { type: 'string', example: 'Acme Corp' },
          total: { type: 'number', example: 48000.0 },
        },
      },
      CategorySpend: {
        type: 'object',
        properties: {
          category: { type: 'string', example: 'Software' },
          total: { type: 'number', example: 36000.0 },
        },
      },
      SpendData: {
        type: 'object',
        properties: {
          bySupplier: {
            type: 'array',
            items: { $ref: '#/components/schemas/SupplierSpend' },
            description: 'Sorted descending by total.',
          },
          byCategory: {
            type: 'array',
            items: { $ref: '#/components/schemas/CategorySpend' },
            description: 'Sorted descending by total.',
          },
        },
      },
      // ─── Team ────────────────────────────────────────────────────────────
      Member: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/UUID' },
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          full_name: { type: 'string', nullable: true, example: 'Alice Smith' },
          role: { $ref: '#/components/schemas/UserRole' },
          created_at: { $ref: '#/components/schemas/ISOTimestamp' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'No valid session cookie.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { data: null, error: { message: 'Unauthorized', code: '401' } },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated but insufficient role (Admin required).',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { data: null, error: { message: 'Forbidden', code: '403' } },
          },
        },
      },
      NotFound: {
        description: 'Resource not found.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { data: null, error: { message: 'Not found', code: '404' } },
          },
        },
      },
      BadRequest: {
        description: 'Validation error — one or more inputs were invalid.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { data: null, error: { message: 'name: Required', code: '400' } },
          },
        },
      },
      InternalError: {
        description: 'Unexpected server error.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    parameters: {
      idParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/UUID' },
      },
    },
  },
  security: [{ supabaseCookie: [] }],
  paths: {
    // ───────────────────────────── AUTH ─────────────────────────────────
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new user account',
        description:
          'Creates a Supabase Auth user with email_confirm bypassed (admin SDK). ' +
          'The `handle_new_user` trigger creates the corresponding `profiles` row ' +
          'with `role = "admin"` (first user) or `"member"` (subsequent users).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'full_name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'supersecret' },
                  full_name: { type: 'string', minLength: 1, example: 'Alice Smith' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Account created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        user: {
                          type: 'object',
                          properties: {
                            id: { $ref: '#/components/schemas/UUID' },
                            email: { type: 'string', format: 'email' },
                          },
                        },
                      },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': {
            description: 'Email already in use.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  data: null,
                  error: { message: 'An account with this email already exists', code: '409' },
                },
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── CONTRACTS ────────────────────────────
    '/api/contracts': {
      get: {
        tags: ['Contracts'],
        summary: 'List contracts',
        description:
          'Returns all contracts enriched with computed `status` and `risk_colour`. ' +
          'Status filtering is applied in the application layer (not SQL).',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Full-text search on contract name.' },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/ContractStatus' }, description: 'Filter by computed status.' },
          { name: 'supplier_id', in: 'query', schema: { $ref: '#/components/schemas/UUID' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { $ref: '#/components/schemas/ContractType' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['renewal_date', 'value', 'name'], default: 'renewal_date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Paginated contract list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/ContractWithSupplier' } },
                    total: { type: 'integer', description: 'Total matching records (before pagination).' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Contracts'],
        summary: 'Create a contract',
        description: 'Any authenticated user (Member or Admin) can create contracts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContractCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Contract created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Contract' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/contracts/{id}': {
      get: {
        tags: ['Contracts'],
        summary: 'Get a single contract',
        description:
          'Returns the contract with an embedded `suppliers` object. ' +
          'If a PDF is attached, a 15-minute signed Storage URL is included as `signed_url`.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Contract found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/ContractWithSupplier' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Contracts'],
        summary: 'Update a contract',
        description: 'Partial update — only include the fields you want to change.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContractUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Contract updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Contract' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Contracts'],
        summary: 'Delete a contract (Admin only)',
        description: 'Hard-deletes the contract. Cascades to linked notifications. Returns 403 for Members.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Contract deleted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { $ref: '#/components/schemas/UUID' } },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/contracts/{id}/upload': {
      post: {
        tags: ['Contracts'],
        summary: 'Upload a PDF for a contract',
        description:
          'Accepts `multipart/form-data` with a `pdf` field. ' +
          'PDF only, max 10 MB. Stores the file in the private `contract-pdfs` ' +
          'Supabase Storage bucket and updates `contracts.pdf_url` with the storage path.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['pdf'],
                properties: {
                  pdf: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF file, max 10 MB.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'PDF uploaded and contract updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { pdf_url: { type: 'string', example: 'uuid.pdf' } },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── SUPPLIERS ────────────────────────────
    '/api/suppliers': {
      get: {
        tags: ['Suppliers'],
        summary: 'List active suppliers',
        description:
          'Returns all suppliers with `status = "active"`, ordered by name. ' +
          'Each supplier includes a computed `max_contract_risk` field.',
        responses: {
          '200': {
            description: 'Supplier list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Supplier' } },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Suppliers'],
        summary: 'Create a supplier',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SupplierCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Supplier created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Supplier' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/suppliers/{id}': {
      get: {
        tags: ['Suppliers'],
        summary: 'Get a single supplier',
        description: 'Returns the supplier with embedded `contracts` and `certifications` arrays.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Supplier found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/SupplierWithDetails' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Suppliers'],
        summary: 'Update a supplier',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SupplierUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Supplier updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Supplier' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Suppliers'],
        summary: 'Soft-delete a supplier (Admin only)',
        description:
          'Sets `status = "inactive"`. The supplier\'s contracts are preserved ' +
          '(`ON DELETE RESTRICT`). Returns 403 for Members.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Supplier soft-deleted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { id: { $ref: '#/components/schemas/UUID' } },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── CERTIFICATIONS ────────────────────────
    '/api/certifications': {
      get: {
        tags: ['Certifications'],
        summary: 'List certifications for a supplier',
        description:
          'Requires `supplier_id` query param. Each certification includes a computed `status` field.',
        parameters: [
          {
            name: 'supplier_id',
            in: 'query',
            required: true,
            schema: { $ref: '#/components/schemas/UUID' },
            description: 'UUID of the supplier whose certifications to fetch.',
          },
        ],
        responses: {
          '200': {
            description: 'Certification list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Certification' } },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Certifications'],
        summary: 'Create a certification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CertificationCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Certification created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Certification' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/certifications/{id}': {
      put: {
        tags: ['Certifications'],
        summary: 'Update a certification',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CertificationUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Certification updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Certification' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Certifications'],
        summary: 'Delete a certification (Admin only)',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Certification deleted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', nullable: true, example: null },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── NOTIFICATIONS ────────────────────────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List all notifications for the current user',
        description:
          'Returns all notifications for the authenticated user, ordered by `created_at` descending. ' +
          'Each notification embeds contract name, renewal date, and supplier name.',
        responses: {
          '200': {
            description: 'Notification list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/notifications/{id}': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark a notification as read',
        description:
          'Sets `is_read = true`. Only the notification owner can mark it as read ' +
          '(ownership verified before update).',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Notification marked as read.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', nullable: true, example: null },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── DASHBOARD ────────────────────────────
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get portfolio health summary',
        description:
          'Returns contract counts by status (active/expiring/expired) and risk colour ' +
          '(green/amber/red), total portfolio value, and a list of contracts whose ' +
          'renewal_date is within 30 days.',
        responses: {
          '200': {
            description: 'Dashboard data.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/DashboardData' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── SPEND ────────────────────────────────
    '/api/spend': {
      get: {
        tags: ['Spend'],
        summary: 'Get spend totals by supplier and category',
        description:
          'Aggregates `value` across non-expired contracts. ' +
          'Filter by period (`all` | `year` | `custom`) and optionally by `category`.',
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['all', 'year', 'custom'], default: 'all' },
            description: '`all` = no date filter; `year` = current calendar year; `custom` = use start + end.',
          },
          {
            name: 'start',
            in: 'query',
            schema: { $ref: '#/components/schemas/ISODate' },
            description: 'Required when `period=custom`. Filters by `start_date >= start`.',
          },
          {
            name: 'end',
            in: 'query',
            schema: { $ref: '#/components/schemas/ISODate' },
            description: 'Required when `period=custom`. Filters by `start_date <= end`.',
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Restrict aggregation to this category.',
          },
        ],
        responses: {
          '200': {
            description: 'Spend totals.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/SpendData' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── TEAM ─────────────────────────────────
    '/api/team': {
      get: {
        tags: ['Team'],
        summary: 'List all team members (Admin only)',
        description: 'Returns all profiles ordered by `created_at` ascending.',
        responses: {
          '200': {
            description: 'Member list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Member' } },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/team/invite': {
      post: {
        tags: ['Team'],
        summary: 'Invite a new member by email (Admin only)',
        description:
          'Sends a Supabase Auth invite email. The invited user clicks the link, ' +
          'sets a password, and lands with `role = "member"` on their profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'newmember@example.com' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invitation sent.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        email: { type: 'string', format: 'email' },
                      },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/team/{id}': {
      put: {
        tags: ['Team'],
        summary: 'Update a member\'s role (Admin only)',
        description:
          'Promotes or demotes a member. Admins cannot change their own role ' +
          '(returns 403). Valid roles: `admin` | `member`.',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'member'], example: 'admin' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Role updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', nullable: true, example: null },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Team'],
        summary: 'Remove a team member (Admin only)',
        description:
          'Hard-deletes the profile. Admins cannot delete their own account (returns 403).',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          '200': {
            description: 'Member removed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object', nullable: true, example: null },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ───────────────────────────── CRON ─────────────────────────────────
    '/api/cron/notifications': {
      get: {
        tags: ['Cron'],
        summary: 'Run renewal alert cron job',
        description:
          'Scans all contracts for the 60/30/7-day thresholds, inserts in-app ' +
          'notifications, and sends Resend emails. The unique index on ' +
          '`(contract_id, threshold_days)` makes this idempotent — re-running ' +
          'never creates duplicate notifications. ' +
          '\n\n**Auth:** `Authorization: Bearer <CRON_SECRET>` header required. ' +
          'No Supabase session needed (uses service role key internally).',
        security: [{ cronSecret: [] }],
        responses: {
          '200': {
            description: 'Cron ran successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        inserted: {
                          type: 'integer',
                          description: 'Number of new notifications created in this run.',
                          example: 3,
                        },
                      },
                    },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
}

export default spec
