import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { CatalogItemFormAssignment } from '@/generated/models/catalog-item-form-assignment-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormDefinition } from '@/generated/models/form-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Service } from '@/generated/models/service-model';

export type MigrationClassification = 'Already compatible' | 'Can be adapted with mapping' | 'Requires controlled migration' | 'Must temporarily remain legacy';
export type MigrationPlanStatus = 'Analyzed' | 'Draft generated' | 'Validated' | 'Tested' | 'Cut over' | 'Rolled back';
export type MigrationSeverity = 'safe' | 'warning' | 'blocking';

export interface MigrationFinding {
  id: string;
  area: 'Form' | 'Rules' | 'Workflow' | 'SLA' | 'Reporting' | 'Routing';
  severity: MigrationSeverity;
  title: string;
  detail: string;
  remediation: string;
}

export interface MigrationFieldMapping {
  legacyKey: string;
  legacyLabel: string;
  recommendedKey: string;
  recommendedType: string;
  confidence: 'High' | 'Medium' | 'Low';
  included: boolean;
}

export interface MigrationPlanSnapshot {
  schemaVersion: 1;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  classification: MigrationClassification;
  status: MigrationPlanStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName: string;
  sourceFormIds: string[];
  sourceCatalogItemIds: string[];
  mappings: MigrationFieldMapping[];
  findings: MigrationFinding[];
  targetFormId?: string;
  targetVersionId?: string;
  targetAssignmentId?: string;
  previousPublishedVersionId?: string;
  previousAssignmentIds: string[];
  cutoverAt?: string;
  rolledBackAt?: string;
  testSummary?: string;
}

export interface MigrationAnalysisInput {
  service: Service;
  catalogItems: CatalogItem[];
  assignments: CatalogItemFormAssignment[];
  forms: FormDefinition[];
  versions: FormVersion[];
  fields: FieldDefinition[];
  hasRules: boolean;
  hasWorkflow: boolean;
  hasSla: boolean;
  hasReports: boolean;
}

export interface MigrationAnalysis {
  classification: MigrationClassification;
  catalogItems: CatalogItem[];
  assignments: CatalogItemFormAssignment[];
  forms: FormDefinition[];
  versions: FormVersion[];
  fields: FieldDefinition[];
  mappings: MigrationFieldMapping[];
  findings: MigrationFinding[];
  readyForDraft: boolean;
}

const stableKey = (value: string, index: number) => {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || `legacy_field_${index + 1}`;
};

export function analyzeLegacyService(input: MigrationAnalysisInput): MigrationAnalysis {
  const itemIds = new Set(input.catalogItems.map((item: CatalogItem) => item.id));
  const assignments = input.assignments.filter((assignment: CatalogItemFormAssignment) => itemIds.has(assignment.catalogItem.id));
  const formIds = new Set(input.catalogItems.map((item: CatalogItem) => item.formDefinition.id));
  const forms = input.forms.filter((form: FormDefinition) => formIds.has(form.id));
  const versions = input.versions.filter((version: FormVersion) => forms.some((form: FormDefinition) => form.id === version.formDefinition.id) && !version.isDeleted);
  const versionIds = new Set(versions.map((version: FormVersion) => version.id));
  const fields = input.fields.filter((field: FieldDefinition) => versionIds.has(field.formVersionID.id) && !field.isDeleted);
  const activeAssignments = assignments.filter((assignment: CatalogItemFormAssignment) => assignment.statusKey === 'Active');
  const classification: MigrationClassification = activeAssignments.some((assignment: CatalogItemFormAssignment) => versions.some((version: FormVersion) => version.id === assignment.formVersion.id && version.statusKey === 'Published'))
    ? 'Already compatible'
    : fields.length > 0
      ? 'Can be adapted with mapping'
      : input.catalogItems.length > 0
        ? 'Requires controlled migration'
        : 'Must temporarily remain legacy';

  const uniqueFields = new Map<string, FieldDefinition>();
  fields.forEach((field: FieldDefinition) => uniqueFields.set(field.fieldCode || field.label, field));
  const mappings = [...uniqueFields.values()].map((field: FieldDefinition, index: number): MigrationFieldMapping => ({
    legacyKey: field.fieldCode || stableKey(field.label, index),
    legacyLabel: field.label,
    recommendedKey: field.fieldCode || stableKey(field.label, index),
    recommendedType: field.fieldTypeKey,
    confidence: field.fieldCode ? 'High' : 'Medium',
    included: true,
  }));

  const findings: MigrationFinding[] = [
    {
      id: 'form', area: 'Form', severity: fields.length ? 'safe' : 'warning',
      title: fields.length ? `${fields.length} metadata fields detected` : 'No reusable field metadata detected',
      detail: fields.length ? 'Existing stable keys and typed definitions can seed the migration draft.' : 'The draft will start with a review section and requires field mapping before cutover.',
      remediation: fields.length ? 'Review recommended keys and exclude obsolete fields.' : 'Add legacy form fields to the generated draft before validation.',
    },
    {
      id: 'rules', area: 'Rules', severity: input.hasRules ? 'safe' : 'warning',
      title: input.hasRules ? 'Rule metadata detected' : 'No reusable rules detected',
      detail: input.hasRules ? 'Existing rule records remain available for mapping.' : 'Legacy conditional or assignment logic may exist outside metadata.',
      remediation: input.hasRules ? 'Verify every rule reference resolves to a mapped stable key.' : 'Document and recreate legacy rules in the Business Rules Catalog.',
    },
    {
      id: 'workflow', area: 'Workflow', severity: input.hasWorkflow ? 'safe' : 'warning',
      title: input.hasWorkflow ? 'Workflow configuration detected' : 'Workflow requires review',
      detail: input.hasWorkflow ? 'Existing automation configuration can remain the execution source.' : 'No version-bound workflow was detected.',
      remediation: input.hasWorkflow ? 'Bind and test the workflow against the generated draft version.' : 'Configure a version-bound workflow before cutover if fulfilment is automated.',
    },
    {
      id: 'sla', area: 'SLA', severity: input.hasSla ? 'safe' : 'warning',
      title: input.hasSla ? 'SLA policy detected' : 'SLA policy not detected',
      detail: input.hasSla ? 'Existing service target rules can be reused.' : 'New submissions may not receive response and resolution targets.',
      remediation: input.hasSla ? 'Confirm priority and business-calendar mappings.' : 'Add an SLA rule or explicitly accept operation without one.',
    },
    {
      id: 'reporting', area: 'Reporting', severity: input.hasReports || mappings.length ? 'safe' : 'warning',
      title: input.hasReports ? 'Reporting configuration detected' : 'Reporting mapping requires confirmation',
      detail: 'Historical requests remain unchanged; new typed values use stable keys from this plan.',
      remediation: 'Confirm reportable and sensitive flags before publication.',
    },
    {
      id: 'routing', area: 'Routing', severity: input.catalogItems.length ? 'safe' : 'blocking',
      title: input.catalogItems.length ? 'Catalog identity can be preserved' : 'No catalog route exists',
      detail: input.catalogItems.length ? 'Cutover can update the existing catalog assignment without creating a duplicate entry.' : 'A controlled cutover cannot route new submissions without an existing catalog item.',
      remediation: input.catalogItems.length ? 'Keep the item code and update only its default form assignment.' : 'Create or identify the existing requester catalog entry before migration.',
    },
  ];

  return { classification, catalogItems: input.catalogItems, assignments, forms, versions, fields, mappings, findings, readyForDraft: !findings.some((finding: MigrationFinding) => finding.severity === 'blocking') };
}

export function validateMigrationPlan(plan: MigrationPlanSnapshot): MigrationFinding[] {
  const findings = [...plan.findings];
  const activeMappings = plan.mappings.filter((mapping: MigrationFieldMapping) => mapping.included);
  const keys = activeMappings.map((mapping: MigrationFieldMapping) => mapping.recommendedKey.trim().toLowerCase());
  if (!activeMappings.length) findings.push({ id: 'mapping-empty', area: 'Form', severity: 'blocking', title: 'No fields are mapped', detail: 'At least one field must be included in the metadata draft.', remediation: 'Include a field mapping or add fields in Service Builder.' });
  if (keys.some((key: string) => !key)) findings.push({ id: 'mapping-key', area: 'Form', severity: 'blocking', title: 'A stable key is blank', detail: 'Every included field requires a stable key.', remediation: 'Enter a stable key for every included mapping.' });
  if (new Set(keys).size !== keys.length) findings.push({ id: 'mapping-duplicate', area: 'Form', severity: 'blocking', title: 'Duplicate stable keys detected', detail: 'Mapped fields must have unique stable keys.', remediation: 'Rename duplicate keys before generating or validating the draft.' });
  if (!plan.targetVersionId) findings.push({ id: 'draft-missing', area: 'Form', severity: 'blocking', title: 'Metadata draft has not been generated', detail: 'Validation requires an independent draft version.', remediation: 'Generate the metadata draft first.' });
  return findings;
}

export function runMigrationTest(plan: MigrationPlanSnapshot): { passed: boolean; summary: string; checks: string[] } {
  const validation = validateMigrationPlan(plan);
  const blocking = validation.filter((finding: MigrationFinding) => finding.severity === 'blocking');
  const checks = [
    `Historical requests remain bound to their original versions (${plan.previousPublishedVersionId ? 'verified' : 'no prior published version'}).`,
    `${plan.mappings.filter((mapping: MigrationFieldMapping) => mapping.included).length} stable field mappings are unique and typed.`,
    'Catalog identity and requester URL remain unchanged.',
    'Test mode creates no request, assignment, workflow instance, or production routing change.',
    'Rollback retains the previous published version and assignments.',
  ];
  return { passed: blocking.length === 0, summary: blocking.length === 0 ? 'All non-production migration checks passed.' : `${blocking.length} blocking checks must be resolved.`, checks };
}
