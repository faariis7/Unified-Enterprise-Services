import type { ComponentFieldTemplate } from '@/lib/reusable-form-components';

export type ServiceTemplateKind = 'Complete Service' | 'Form' | 'Workflow' | 'Lifecycle' | 'SLA' | 'Reporting';

export type ServiceTemplateSection = {
  title: string;
  description: string;
  fields: ComponentFieldTemplate[];
};

export type ServiceTemplateDefinition = {
  key: string;
  name: string;
  description: string;
  category: string;
  kinds: ServiceTemplateKind[];
  sections: ServiceTemplateSection[];
  workflow: string[];
  lifecycle: string[];
  sla: { responseHours: number; resolutionHours: number };
  reporting: string[];
};

const person = (label: string, key: string): ComponentFieldTemplate => ({ key, label, type: 'Person', required: true, configuration: { lookupSource: 'people' } });
const choice = (label: string, key: string, options: string[]): ComponentFieldTemplate => ({ key, label, type: 'SingleChoice', required: true, options });

export const serviceTemplateLibrary: ServiceTemplateDefinition[] = [
  {
    key: 'employee-onboarding', name: 'Employee Onboarding', category: 'People operations', description: 'Coordinate a new employee’s access, equipment, workplace, and first-day readiness.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [
      { title: 'New employee', description: 'Employment and manager details', fields: [person('New employee', 'employee'), person('Hiring manager', 'manager'), { key: 'start_date', label: 'Start date', type: 'Date', required: true, width: 'Half' }, choice('Employment type', 'employment_type', ['Permanent', 'Fixed term', 'Contractor', 'Intern'])] },
      { title: 'Provisioning', description: 'Services required before the start date', fields: [{ key: 'access_profile', label: 'Access profile', type: 'MultipleChoice', options: ['Email', 'Collaboration', 'Business applications', 'Shared drives'], required: true }, choice('Equipment package', 'equipment_package', ['Standard laptop', 'Developer workstation', 'Mobile only', 'No equipment']), { key: 'special_instructions', label: 'Special instructions', type: 'MultiLineText' }] },
    ], workflow: ['Manager confirmation', 'Parallel access and equipment tasks', 'Readiness review'], lifecycle: ['Draft', 'Submitted', 'Provisioning', 'Ready', 'Completed'], sla: { responseHours: 4, resolutionHours: 40 }, reporting: ['Employment type', 'Equipment package', 'Lead time'],
  },
  {
    key: 'employee-offboarding', name: 'Employee Offboarding', category: 'People operations', description: 'Securely recover access and assets when an employee leaves.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Departure', description: 'Employee and departure details', fields: [person('Departing employee', 'employee'), person('Manager', 'manager'), { key: 'last_working_date', label: 'Last working date', type: 'Date', required: true }, choice('Departure type', 'departure_type', ['Resignation', 'End of contract', 'Transfer', 'Termination'])] }, { title: 'Recovery', description: 'Access and property controls', fields: [{ key: 'assets', label: 'Assets to recover', type: 'Asset', configuration: { lookupSource: 'assets', multiple: true } }, { key: 'data_owner', label: 'Data transfer owner', type: 'Person' }, { key: 'notes', label: 'Confidential instructions', type: 'MultiLineText', configuration: { sensitivity: 'restricted' } }] }], workflow: ['HR verification', 'Parallel access removal and asset recovery', 'Manager sign-off'], lifecycle: ['Draft', 'Submitted', 'Scheduled', 'In progress', 'Completed'], sla: { responseHours: 2, resolutionHours: 24 }, reporting: ['Departure type', 'Assets recovered', 'Completion time'],
  },
  {
    key: 'access-request', name: 'Access Request', category: 'Technology', description: 'Request governed application, role, or shared-resource access.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Access details', description: 'Who needs access and why', fields: [person('Requested for', 'requested_for'), { key: 'application', label: 'Application or resource', type: 'Lookup', required: true, configuration: { lookupSource: 'applications' } }, choice('Access level', 'access_level', ['Read', 'Contribute', 'Administrator']), { key: 'business_justification', label: 'Business justification', type: 'MultiLineText', required: true }] }, { title: 'Duration', description: 'Time-bound access', fields: [{ key: 'temporary', label: 'Temporary access', type: 'YesOrNo' }, { key: 'end_date', label: 'Access end date', type: 'Date' }] }], workflow: ['Manager approval', 'Resource owner approval', 'Provision access', 'Requester notification'], lifecycle: ['Draft', 'Submitted', 'Awaiting approval', 'Fulfilment', 'Completed', 'Rejected'], sla: { responseHours: 4, resolutionHours: 16 }, reporting: ['Application', 'Access level', 'Approval duration'],
  },
  {
    key: 'equipment-request', name: 'Equipment Request', category: 'Technology', description: 'Request standard workplace equipment with cost and approval controls.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Equipment', description: 'Required equipment', fields: [person('Requested for', 'requested_for'), choice('Equipment type', 'equipment_type', ['Laptop', 'Monitor', 'Mobile phone', 'Accessory']), { key: 'quantity', label: 'Quantity', type: 'Number', required: true, configuration: { defaultValue: '1' } }, { key: 'justification', label: 'Justification', type: 'MultiLineText', required: true }] }, { title: 'Financial coding', description: 'Charge allocation', fields: [{ key: 'cost_center', label: 'Cost center', type: 'Lookup', required: true, configuration: { lookupSource: 'cost-centers' } }, { key: 'estimated_cost', label: 'Estimated cost', type: 'Currency', configuration: { reportable: true } }] }], workflow: ['Budget approval', 'Stock allocation', 'Delivery task'], lifecycle: ['Draft', 'Submitted', 'Approval', 'Ordered', 'Delivered', 'Completed'], sla: { responseHours: 8, resolutionHours: 80 }, reporting: ['Equipment type', 'Estimated cost', 'Delivery time'],
  },
  {
    key: 'travel-request', name: 'Travel Request', category: 'Travel', description: 'Capture itinerary, cost, and approvals for business travel.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Traveler and itinerary', description: 'Travel dates and destination', fields: [person('Traveler', 'traveler'), { key: 'destination', label: 'Destination', type: 'Text', required: true }, { key: 'departure_date', label: 'Departure date', type: 'Date', required: true, width: 'Half' }, { key: 'return_date', label: 'Return date', type: 'Date', required: true, width: 'Half' }] }, { title: 'Trip details', description: 'Purpose and estimated spend', fields: [{ key: 'purpose', label: 'Business purpose', type: 'MultiLineText', required: true }, { key: 'estimated_cost', label: 'Estimated cost', type: 'Currency', required: true }, choice('Travel class', 'travel_class', ['Economy', 'Premium economy', 'Business'])] }], workflow: ['Manager approval', 'Budget approval', 'Travel booking'], lifecycle: ['Draft', 'Submitted', 'Approval', 'Booking', 'Confirmed', 'Completed'], sla: { responseHours: 8, resolutionHours: 40 }, reporting: ['Destination', 'Estimated cost', 'Travel class'],
  },
  {
    key: 'business-card-request', name: 'Business Card Request', category: 'Communications', description: 'Request approved business cards with precise contact and delivery details.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Card details', description: 'Information printed on the card', fields: [person('Employee', 'employee'), { key: 'job_title', label: 'Job title', type: 'Text', required: true }, { key: 'phone', label: 'Phone', type: 'Phone' }, { key: 'email', label: 'Email', type: 'Email', required: true }] }, { title: 'Order', description: 'Quantity and delivery', fields: [choice('Quantity', 'quantity', ['100', '250', '500']), { key: 'delivery_location', label: 'Delivery location', type: 'Text', required: true }] }], workflow: ['Brand review', 'Manager approval', 'Print order'], lifecycle: ['Draft', 'Submitted', 'Review', 'Printing', 'Delivered'], sla: { responseHours: 8, resolutionHours: 120 }, reporting: ['Quantity', 'Department', 'Turnaround'],
  },
  {
    key: 'vendor-onboarding', name: 'Vendor Onboarding', category: 'Procurement', description: 'Collect vendor, compliance, tax, banking, and sponsorship information.', kinds: ['Complete Service', 'Form', 'Workflow', 'Lifecycle', 'SLA', 'Reporting'],
    sections: [{ title: 'Vendor identity', description: 'Legal and commercial details', fields: [{ key: 'legal_name', label: 'Legal name', type: 'Text', required: true }, { key: 'registration_number', label: 'Registration number', type: 'Text', required: true }, { key: 'country', label: 'Country', type: 'Text', required: true }, person('Business sponsor', 'sponsor')] }, { title: 'Due diligence', description: 'Risk and documentation', fields: [choice('Vendor type', 'vendor_type', ['Supplier', 'Consultant', 'Contractor', 'Partner']), { key: 'annual_spend', label: 'Estimated annual spend', type: 'Currency', required: true }, { key: 'documents', label: 'Supporting documents', type: 'Attachment', required: true, configuration: { multiple: true, allowedFileTypes: 'pdf,docx,xlsx' } }, { key: 'risk_notes', label: 'Risk notes', type: 'MultiLineText' }] }], workflow: ['Procurement review', 'Compliance approval', 'Finance setup', 'Sponsor confirmation'], lifecycle: ['Draft', 'Submitted', 'Due diligence', 'Setup', 'Active', 'Rejected'], sla: { responseHours: 8, resolutionHours: 80 }, reporting: ['Vendor type', 'Annual spend', 'Risk outcome'],
  },
];
