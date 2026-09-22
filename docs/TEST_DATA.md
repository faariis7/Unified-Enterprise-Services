# Test Data Guide

**Purpose:** Document test users, workspaces, and sample data for development  
**Last Updated:** Phase 7 - Test Data Documentation

---

## Roles Overview

The system implements a role-based access control (RBAC) model with the following roles:

| Role | Scope | Permissions |
|------|-------|-------------|
| **Global Administrator** | Platform-wide | Full access to all workspaces, settings, and configurations |
| **Workspace Owner** | Single workspace | Manage workspace membership, settings, modules, services |
| **Service Administrator** | Single service | Configure service, manage forms, workflows, SLAs |
| **Service Agent** | Single service | View assigned requests, update status, fulfill requests |
| **Approver** | Single service | Approve/reject requests in approval workflow |
| **Requester** | Platform-wide | Create requests, view own requests, respond to queries |
| **Auditor** | Assigned scope | Read-only access to requests and audit logs |
| **Service Manager** | Single service | Operational oversight, reporting, team management |

---

## Test Users

### Pre-Seed Test Users

After running `npm run db:seed`, the following users are available:

| Email | Password | Role | Workspaces | Description |
|-------|----------|------|------------|-------------|
| `admin@unified-esm.local` | `Password123!` | Global Administrator | All | Full platform access |
| `manager@unified-esm.local` | `Password123!` | Workspace Owner | IT Services | Manages IT workspace |
| `agent@unified-esm.local` | `Password123!` | Service Agent | IT Services | Handles IT requests |
| `requester@unified-esm.local` | `Password123!` | Requester | All | Standard employee |
| `approver@unified-esm.local` | `Password123!` | Approver | IT Services, HR Services | Multi-workspace approver |
| `auditor@unified-esm.local` | `Password123!` | Auditor | All | Compliance auditing |

### User Details

#### admin@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000001",
  "email": "admin@unified-esm.local",
  "name": "System Administrator",
  "roles": ["global_admin"],
  "workspaces": [],
  "permissions": ["*"]
}
```

**Use Cases:**
- Test global administration features
- Create/delete workspaces
- Manage platform settings
- Access all reports and audits

#### manager@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000002",
  "email": "manager@unified-esm.local",
  "name": "IT Manager",
  "roles": ["workspace_owner"],
  "workspaces": ["it-services"],
  "permissions": ["workspace:*", "service:*"]
}
```

**Use Cases:**
- Test workspace administration
- Configure services and forms
- Manage workspace membership
- View workspace reports

#### agent@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000003",
  "email": "agent@unified-esm.local",
  "name": "IT Support Agent",
  "roles": ["service_agent"],
  "workspaces": ["it-services"],
  "services": ["it-support"],
  "permissions": ["request:read", "request:update", "request:assign"]
}
```

**Use Cases:**
- Test request queue
- Update request status
- Add internal notes
- Assign requests to colleagues

#### requester@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000004",
  "email": "requester@unified-esm.local",
  "name": "John Employee",
  "roles": ["requester"],
  "workspaces": [],
  "permissions": ["request:create", "request:read:own"]
}
```

**Use Cases:**
- Test service marketplace
- Submit new requests
- Track request status
- Respond to agent queries

#### approver@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000005",
  "email": "approver@unified-esm.local",
  "name": "Finance Approver",
  "roles": ["approver"],
  "workspaces": ["it-services", "hr-services"],
  "approvalLimits": {
    "it-services": 10000,
    "hr-services": 5000
  },
  "permissions": ["approval:review", "approval:approve", "approval:reject"]
}
```

**Use Cases:**
- Test approval workflows
- Approve/reject requests
- Delegate approvals
- View approval history

#### auditor@unified-esm.local
```json
{
  "id": "usr-00000000-0000-0000-0000-000000000006",
  "email": "auditor@unified-esm.local",
  "name": "Compliance Auditor",
  "roles": ["auditor"],
  "workspaces": ["all"],
  "permissions": ["request:read", "audit:read", "report:read"]
}
```

**Use Cases:**
- Test audit log access
- Review request history
- Generate compliance reports
- Export audit trails

---

## Workspaces

### Default Workspaces

| Code | Name | Description | Owner |
|------|------|-------------|-------|
| `it-services` | Information Technology | IT support, infrastructure, software | manager@unified-esm.local |
| `hr-services` | Human Resources | Employee onboarding, benefits, policies | TBD |
| `facilities` | Facility Management | Office space, maintenance, security | TBD |
| `finance` | Finance & Accounting | Procurement, expenses, billing | TBD |
| `legal` | Legal & Compliance | Contracts, legal review, compliance | TBD |
| `operations` | Operations | General operations, coordination | TBD |
| `compliance` | Compliance & Risk | Risk management, audits, regulations | TBD |

### Workspace Configuration

Each workspace has:
- Unique code (e.g., `it-services`)
- Display name and description
- Locale settings (language, timezone, currency)
- Request numbering format (e.g., `IT-{YYYY}-{NNNN}`)
- Portal branding (logo, colors)
- Module configuration
- Membership roster

---

## Departments

Departments are organizational units within workspaces:

| Department | Workspace | Description |
|------------|-----------|-------------|
| **IT Support** | it-services | Help desk, technical support |
| **Infrastructure** | it-services | Servers, network, cloud |
| **Application Development** | it-services | Software development |
| **Security** | it-services | Information security |
| **Recruitment** | hr-services | Hiring, onboarding |
| **Employee Relations** | hr-services | Benefits, policies, grievances |
| **Training** | hr-services | Learning and development |
| **Maintenance** | facilities | Building maintenance, repairs |
| **Reception** | facilities | Front desk, visitor management |
| **Procurement** | finance | Purchasing, vendor management |
| **Accounts Payable** | finance | Invoice processing, payments |
| **Legal Counsel** | legal | Legal advice, contract review |
| **Compliance** | legal | Regulatory compliance, audits |

---

## Approval Chains

### Example Approval Flows

#### IT Purchase Request (> $5,000)
```
Request → IT Manager → Finance Approver → Procurement → Complete
         ($5k-$10k)   ($10k-$50k)        (>$50k)
```

#### HR Onboarding Request
```
Request → HR Manager → IT Setup → Facilities → Complete
                   (Equipment)  (Access Card)
```

#### Leave Request
```
Request → Direct Manager → HR Records → Complete
         (< 5 days)       (Documentation)
```

#### Contract Review
```
Request → Legal Review → Compliance Check → Executive Approval → Complete
         (Terms)         (Regulations)     (>$100k value)
```

### Approval Stages Configuration

```json
{
  "approvalFlow": {
    "id": "approval-flow-001",
    "name": "Standard IT Purchase",
    "stages": [
      {
        "order": 1,
        "type": "single",
        "resolver": "manager",
        "timeout": "24h"
      },
      {
        "order": 2,
        "type": "any",
        "resolvers": ["finance_team"],
        "timeout": "48h"
      },
      {
        "order": 3,
        "type": "all",
        "resolvers": ["procurement", "legal"],
        "timeout": "72h"
      }
    ]
  }
}
```

---

## Sample Requests

### Request #1: IT Support - Password Reset

```json
{
  "requestNumber": "IT-2024-00001",
  "workspace": "it-services",
  "service": "it-support",
  "catalogItem": "password-reset",
  "title": "Unable to access email account",
  "description": "Locked out after multiple failed login attempts",
  "status": "in_progress",
  "priority": "medium",
  "requester": "requester@unified-esm.local",
  "assignedTo": "agent@unified-esm.local",
  "createdAt": "2024-01-15T09:30:00Z",
  "dueAt": "2024-01-15T17:30:00Z",
  "fields": {
    "affected_system": "Microsoft 365",
    "urgency": "high",
    "impact": "single_user"
  }
}
```

### Request #2: HR Services - Equipment Request

```json
{
  "requestNumber": "HR-2024-00001",
  "workspace": "hr-services",
  "service": "onboarding",
  "catalogItem": "new-hire-equipment",
  "title": "New hire equipment setup - Sarah Johnson",
  "description": "Laptop, monitor, keyboard, mouse, headset required",
  "status": "pending_approval",
  "priority": "high",
  "requester": "manager@unified-esm.local",
  "requestedFor": "sarah.johnson@company.com",
  "createdAt": "2024-01-14T14:00:00Z",
  "dueAt": "2024-01-18T09:00:00Z",
  "approvals": [
    {
      "stage": 1,
      "approver": "approver@unified-esm.local",
      "status": "approved",
      "decidedAt": "2024-01-14T15:30:00Z"
    },
    {
      "stage": 2,
      "approver": "pending",
      "status": "pending"
    }
  ],
  "fields": {
    "start_date": "2024-01-22",
    "position": "Software Engineer",
    "department": "Engineering",
    "equipment_list": ["laptop", "monitor", "keyboard", "mouse", "headset"]
  }
}
```

### Request #3: Facilities - Maintenance Request

```json
{
  "requestNumber": "FAC-2024-00001",
  "workspace": "facilities",
  "service": "maintenance",
  "catalogItem": "repair-request",
  "title": "Air conditioning not working in Conference Room B",
  "description": "Temperature too high, affecting meetings",
  "status": "resolved",
  "priority": "high",
  "requester": "agent@unified-esm.local",
  "assignedTo": "facilities-team",
  "createdAt": "2024-01-13T10:00:00Z",
  "resolvedAt": "2024-01-13T16:00:00Z",
  "resolution": "HVAC technician replaced faulty thermostat",
  "fields": {
    "location": "Conference Room B, Floor 3",
    "issue_type": "hvac",
    "urgency": "high"
  }
}
```

### Request #4: Finance - Purchase Request

```json
{
  "requestNumber": "FIN-2024-00001",
  "workspace": "finance",
  "service": "procurement",
  "catalogItem": "software-license",
  "title": "Adobe Creative Cloud licenses - Marketing Team",
  "description": "Annual subscription for 5 users",
  "status": "pending_approval",
  "priority": "medium",
  "requester": "manager@unified-esm.local",
  "createdAt": "2024-01-12T11:00:00Z",
  "dueAt": "2024-01-19T17:00:00Z",
  "approvals": [
    {
      "stage": 1,
      "approver": "manager@unified-esm.local",
      "status": "approved",
      "amount_limit": 10000
    },
    {
      "stage": 2,
      "approver": "approver@unified-esm.local",
      "status": "pending",
      "amount_limit": 50000
    }
  ],
  "fields": {
    "vendor": "Adobe Systems",
    "total_cost": 1788.00,
    "currency": "USD",
    "cost_center": "MKT-001",
    "justification": "Required for marketing content creation"
  }
}
```

---

## Sample Workflow Scenarios

### Scenario 1: Happy Path - Simple Request

```
1. Requester submits password reset request
2. Auto-assigned to IT Support queue
3. Agent picks up request
4. Agent resets password
5. Agent marks as resolved
6. Requester receives notification
7. Requester confirms resolution
8. Request closed successfully
```

### Scenario 2: Approval Required

```
1. Requester submits equipment request ($2,000)
2. System detects approval requirement
3. Approval sent to manager
4. Manager approves
5. Request moves to fulfillment
6. IT prepares equipment
7. Facilities delivers equipment
8. Requester confirms receipt
9. Request closed
```

### Scenario 3: Escalation Path

```
1. Requester submits urgent facility issue
2. Request assigned to facilities team
3. No response within 2 hours (SLA breach warning)
4. Automation escalates to manager
5. Manager reassigns to senior technician
6. Technician responds and resolves
7. Post-incident review triggered
8. Lessons learned documented
```

### Scenario 4: Rejection Flow

```
1. Requester submits non-compliant request
2. Manager reviews and rejects
3. Rejection reason provided
4. Requester notified
5. Requester can revise and resubmit
6. Revised request enters workflow again
```

### Scenario 5: Cross-Workspace Orchestration

```
1. New hire onboarding initiated in HR
2. Child request auto-created in IT (equipment setup)
3. Child request auto-created in Facilities (access card)
4. Parent request waits for all children
5. IT completes equipment setup
6. Facilities completes access card
7. Parent request proceeds to final step
8. HR completes onboarding checklist
```

---

## Test Data Generation

### Manual Seed Commands

```bash
# Connect to database
docker exec -it unified-esm-postgres psql -U postgres -d unified_esm

# Insert additional test users
INSERT INTO users (id, email, name, password_hash) VALUES 
('gen-0001', 'test.user1@company.com', 'Test User 1', '$2a$10$...'),
('gen-0002', 'test.user2@company.com', 'Test User 2', '$2a$10$...');

# Insert test requests
INSERT INTO requests (id, workspace_id, request_number, title, status) VALUES
('req-0001', 'ws-it', 'IT-2024-00010', 'Test Request 1', 'new'),
('req-0002', 'ws-it', 'IT-2024-00011', 'Test Request 2', 'in_progress');
```

### Using API

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"requester@unified-esm.local","password":"Password123!"}' \
  | jq -r '.token')

# Create test request
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "it-services",
    "serviceId": "it-support",
    "title": "API Test Request",
    "description": "Created via API for testing"
  }'
```

---

## Data Retention Policy (Development)

| Data Type | Retention | Cleanup Method |
|-----------|-----------|----------------|
| Test Users | Permanent | Manual deletion |
| Test Requests | 30 days | Automated cleanup script |
| Audit Logs | 90 days | Archive then delete |
| File Uploads | 30 days | MinIO lifecycle policy |
| Email (MailHog) | 7 days | Auto-purge |

---

## Notes

- All test data is isolated to development environment
- Production seeding uses separate scripts
- Test passwords meet complexity requirements but should be changed
- User emails use `.local` domain to avoid conflicts
- UUIDs follow pattern for easy identification
- Request numbers include year for realistic testing
