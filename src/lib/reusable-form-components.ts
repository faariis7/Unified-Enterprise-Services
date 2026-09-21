import type { FieldDefinitionFieldTypeKey, FieldDefinitionWidthKey } from '@/generated/models/field-definition-model';

export type ReusableComponentKey = 'address-block' | 'employee-selector' | 'manager-selector' | 'department-selector' | 'business-unit-selector' | 'cost-center-selector' | 'asset-selector' | 'date-range' | 'contact-block' | 'checklist' | 'editable-grid' | 'repeating-section' | 'approval-matrix' | 'document-list';

export type ComponentFieldTemplate = {
  key: string;
  label: string;
  type: FieldDefinitionFieldTypeKey;
  width?: FieldDefinitionWidthKey;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: string[];
  configuration?: Record<string, unknown>;
};

export type ReusableFormComponentDefinition = {
  key: ReusableComponentKey;
  name: string;
  description: string;
  category: 'People' | 'Organization' | 'Contact' | 'Planning' | 'Structured data' | 'Documents';
  fields: ComponentFieldTemplate[];
};

const structured = (component: ReusableComponentKey, schema: Record<string, string>, minimumRows = 0): Record<string, unknown> => ({ component, storage: 'structured-json', schema, minimumRows });

export const reusableFormComponents: ReusableFormComponentDefinition[] = [
  { key: 'address-block', name: 'Address Block', description: 'Structured postal address with reusable typed fields.', category: 'Contact', fields: [
    { key: 'address_line_1', label: 'Address line 1', type: 'Text', width: 'Full', required: true, placeholder: 'Street and number' },
    { key: 'address_line_2', label: 'Address line 2', type: 'Text', width: 'Full' },
    { key: 'city', label: 'City', type: 'Text', width: 'Half', required: true }, { key: 'region', label: 'State or region', type: 'Text', width: 'Half' },
    { key: 'postal_code', label: 'Postal code', type: 'Text', width: 'Half', required: true }, { key: 'country', label: 'Country', type: 'SingleChoice', width: 'Half', required: true, options: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Other'] },
  ]},
  { key: 'employee-selector', name: 'Employee Selector', description: 'Select an employee from a configured people provider.', category: 'People', fields: [{ key: 'employee', label: 'Employee', type: 'Person', required: true, configuration: { component: 'employee-selector', lookupSource: 'people' } }] },
  { key: 'manager-selector', name: 'Manager Selector', description: 'Select or resolve an employee manager.', category: 'People', fields: [{ key: 'manager', label: 'Manager', type: 'Person', required: true, configuration: { component: 'manager-selector', lookupSource: 'people', relationship: 'manager' } }] },
  { key: 'department-selector', name: 'Department Selector', description: 'Select a governed department.', category: 'Organization', fields: [{ key: 'department', label: 'Department', type: 'Department', required: true, configuration: { component: 'department-selector', lookupSource: 'departments' } }] },
  { key: 'business-unit-selector', name: 'Business Unit Selector', description: 'Select a governed business unit.', category: 'Organization', fields: [{ key: 'business_unit', label: 'Business unit', type: 'BusinessUnit', required: true, configuration: { component: 'business-unit-selector', lookupSource: 'business-units' } }] },
  { key: 'cost-center-selector', name: 'Cost Center Selector', description: 'Select a cost center from a provider-neutral lookup.', category: 'Organization', fields: [{ key: 'cost_center', label: 'Cost center', type: 'Lookup', required: true, configuration: { component: 'cost-center-selector', lookupSource: 'cost-centers' } }] },
  { key: 'asset-selector', name: 'Asset Selector', description: 'Select an asset while retaining its stable identifier.', category: 'Organization', fields: [{ key: 'asset', label: 'Asset', type: 'Asset', required: true, configuration: { component: 'asset-selector', lookupSource: 'assets' } }] },
  { key: 'date-range', name: 'Date Range', description: 'Related start and end dates with range semantics.', category: 'Planning', fields: [
    { key: 'start_date', label: 'Start date', type: 'Date', width: 'Half', required: true, configuration: { component: 'date-range', role: 'start' } },
    { key: 'end_date', label: 'End date', type: 'Date', width: 'Half', required: true, configuration: { component: 'date-range', role: 'end', validateAfter: 'start_date' } },
  ]},
  { key: 'contact-block', name: 'Contact Block', description: 'Name, email, and phone contact details.', category: 'Contact', fields: [
    { key: 'contact_name', label: 'Contact name', type: 'Text', width: 'Full', required: true }, { key: 'contact_email', label: 'Email', type: 'Email', width: 'Half', required: true }, { key: 'contact_phone', label: 'Phone', type: 'Phone', width: 'Half' },
  ]},
  { key: 'checklist', name: 'Checklist', description: 'Configurable checklist stored as normalized choices.', category: 'Structured data', fields: [{ key: 'checklist', label: 'Checklist', type: 'MultipleChoice', required: true, options: ['Item 1', 'Item 2', 'Item 3'], configuration: { component: 'checklist' } }] },
  { key: 'editable-grid', name: 'Editable Grid', description: 'Repeatable rows with typed column metadata.', category: 'Structured data', fields: [{ key: 'grid', label: 'Items', type: 'RichText', configuration: structured('editable-grid', { item: 'text', quantity: 'number', notes: 'text' }, 1) }] },
  { key: 'repeating-section', name: 'Repeating Section', description: 'Repeat a configured group while preserving structured values.', category: 'Structured data', fields: [{ key: 'entries', label: 'Entries', type: 'RichText', configuration: structured('repeating-section', { name: 'text', description: 'text' }, 1) }] },
  { key: 'approval-matrix', name: 'Approval Matrix', description: 'Ordered approval levels and thresholds.', category: 'Structured data', fields: [{ key: 'approval_matrix', label: 'Approval matrix', type: 'RichText', configuration: structured('approval-matrix', { level: 'number', approver: 'person', threshold: 'currency' }, 1) }] },
  { key: 'document-list', name: 'Document List', description: 'Repeatable document metadata and attachment references.', category: 'Documents', fields: [{ key: 'documents', label: 'Documents', type: 'Attachment', configuration: { component: 'document-list', multiple: true, storage: 'attachment-reference-list' } }] },
];

export function createComponentFieldCode(componentKey: string, instance: number, fieldKey: string): string {
  return `${componentKey.replaceAll('-', '_')}_${instance}_${fieldKey}`;
}
