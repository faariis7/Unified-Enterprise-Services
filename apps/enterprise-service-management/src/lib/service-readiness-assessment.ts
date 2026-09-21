export type ReadinessStatus = 'Ready' | 'Ready With Warnings' | 'Not Ready';
export type ReadinessArea = 'Forms' | 'Validation' | 'Rules' | 'Workflow' | 'Lifecycle' | 'SLA' | 'Permissions' | 'Reporting' | 'Dependencies';
export type ReadinessSeverity = 'pass' | 'warning' | 'error';

export type ReadinessFinding = {
  id: string;
  area: ReadinessArea;
  severity: ReadinessSeverity;
  title: string;
  detail: string;
  remediation: string;
  target?: string;
};

export type ServiceReadinessInput = {
  sectionCount: number;
  fieldCount: number;
  requiredFieldCount: number;
  validationRuleCount: number;
  ruleDiagnosticMessages: string[];
  activeRuleCount: number;
  workflowConfigured: boolean;
  workflowBoundToVersion: boolean;
  workflowErrorMessages: string[];
  lifecycleConfigured: boolean;
  lifecycleIssueMessages: string[];
  slaConfigured: boolean;
  permissionsConfigured: boolean;
  audienceConfigured: boolean;
  reportableFieldCount: number;
  reportingConfigured: boolean;
  breakingDependencyMessages: string[];
  dependencyWarningMessages: string[];
};

export type ServiceReadinessAssessment = {
  status: ReadinessStatus;
  score: number;
  findings: ReadinessFinding[];
  areas: Array<{ area: ReadinessArea; status: ReadinessStatus; findings: ReadinessFinding[] }>;
};

const areas: ReadinessArea[] = ['Forms', 'Validation', 'Rules', 'Workflow', 'Lifecycle', 'SLA', 'Permissions', 'Reporting', 'Dependencies'];

export function assessServiceReadiness(input: ServiceReadinessInput): ServiceReadinessAssessment {
  const findings: ReadinessFinding[] = [];
  const add = (finding: ReadinessFinding) => findings.push(finding);

  add(input.sectionCount > 0 && input.fieldCount > 0
    ? { id: 'forms-ready', area: 'Forms', severity: 'pass', title: 'Form structure is complete', detail: `${input.sectionCount} section(s) and ${input.fieldCount} field(s) are configured.`, remediation: 'No action required.' }
    : { id: 'forms-empty', area: 'Forms', severity: 'error', title: 'Form structure is incomplete', detail: 'A publishable service requires at least one section and one field.', remediation: 'Open the Form tab, add a section, then add at least one requester-visible field.', target: 'form' });

  add(input.requiredFieldCount === 0
    ? { id: 'validation-required', area: 'Validation', severity: 'warning', title: 'No required information', detail: 'The form can be submitted without any required service-specific answers.', remediation: 'Review the Form tab and mark the minimum information needed for fulfilment as required.', target: 'form' }
    : { id: 'validation-required-ready', area: 'Validation', severity: 'pass', title: 'Required information is defined', detail: `${input.requiredFieldCount} required field(s) are configured.`, remediation: 'No action required.' });
  if (input.validationRuleCount === 0) add({ id: 'validation-rules', area: 'Validation', severity: 'warning', title: 'No explicit validation rules', detail: 'Only field-type and required checks will run.', remediation: 'Open Rules, select fields that need length, range, pattern, email, phone, or URL constraints, and add validation rules.', target: 'rules' });
  else add({ id: 'validation-rules-ready', area: 'Validation', severity: 'pass', title: 'Validation rules are configured', detail: `${input.validationRuleCount} active validation rule(s) will run.`, remediation: 'No action required.' });

  if (input.ruleDiagnosticMessages.length) input.ruleDiagnosticMessages.forEach((message: string, index: number) => add({ id: `rule-error-${index}`, area: 'Rules', severity: 'error', title: 'Conditional rule requires repair', detail: message, remediation: 'Open Rules, replace missing field references and remove circular or conflicting effects before publishing.', target: 'rules' }));
  else add({ id: 'rules-ready', area: 'Rules', severity: 'pass', title: 'Conditional rules are consistent', detail: `${input.activeRuleCount} active rule(s) passed reference and conflict checks.`, remediation: 'No action required.' });

  if (!input.workflowConfigured) add({ id: 'workflow-missing', area: 'Workflow', severity: 'error', title: 'Workflow is not configured', detail: 'No workflow configuration is associated with this service.', remediation: 'Open Workflow, create or select an automation workflow, bind it to this form version, connect every path to End, then activate it.', target: 'workflow' });
  else if (!input.workflowBoundToVersion) add({ id: 'workflow-unbound', area: 'Workflow', severity: 'error', title: 'Workflow is not version-bound', detail: 'The workflow cannot safely execute against an immutable service definition.', remediation: 'Open Workflow, select the current published service version, validate the graph, and activate the workflow.', target: 'workflow' });
  if (input.workflowErrorMessages.length) input.workflowErrorMessages.forEach((message: string, index: number) => add({ id: `workflow-error-${index}`, area: 'Workflow', severity: 'error', title: 'Workflow validation failed', detail: message, remediation: 'Open Workflow and correct the referenced node, outcome, assignment, field, loop, or end path shown in this finding.', target: 'workflow' }));
  if (input.workflowConfigured && input.workflowBoundToVersion && !input.workflowErrorMessages.length) add({ id: 'workflow-ready', area: 'Workflow', severity: 'pass', title: 'Workflow is executable', detail: 'The workflow is configured, version-bound, and structurally valid.', remediation: 'No action required.' });

  if (!input.lifecycleConfigured) add({ id: 'lifecycle-missing', area: 'Lifecycle', severity: 'error', title: 'Lifecycle is not configured', detail: 'No active lifecycle is available for this service.', remediation: 'Open Lifecycle, assign or create an active lifecycle with one initial status, at least one terminal status, and valid transitions.', target: 'lifecycle' });
  input.lifecycleIssueMessages.forEach((message: string, index: number) => add({ id: `lifecycle-error-${index}`, area: 'Lifecycle', severity: 'error', title: 'Lifecycle validation failed', detail: message, remediation: 'Open Lifecycle and correct the status or transition identified by this validation message.', target: 'lifecycle' }));
  if (input.lifecycleConfigured && !input.lifecycleIssueMessages.length) add({ id: 'lifecycle-ready', area: 'Lifecycle', severity: 'pass', title: 'Lifecycle is valid', detail: 'An active lifecycle has valid initial, terminal, and transition configuration.', remediation: 'No action required.' });

  add(input.slaConfigured
    ? { id: 'sla-ready', area: 'SLA', severity: 'pass', title: 'Service targets are configured', detail: 'An active SLA policy and service rule are available.', remediation: 'No action required.' }
    : { id: 'sla-missing', area: 'SLA', severity: 'warning', title: 'No service target policy', detail: 'Requests will not have governed response or resolution targets.', remediation: 'Open SLA, configure an active target policy and add a rule for this service or catalog item.', target: 'sla' });

  if (!input.permissionsConfigured) add({ id: 'permissions-missing', area: 'Permissions', severity: 'error', title: 'Configuration ownership is incomplete', detail: 'The service has no active governance or service permission configuration.', remediation: 'Open Permissions or Governance and assign a service owner, backup owner, designer, publisher, and required runtime roles.', target: 'permissions' });
  else add({ id: 'permissions-ready', area: 'Permissions', severity: 'pass', title: 'Governance permissions are assigned', detail: 'Active ownership or service permission metadata is present.', remediation: 'No action required.' });
  if (!input.audienceConfigured) add({ id: 'audience-missing', area: 'Permissions', severity: 'error', title: 'Requester audience is missing', detail: 'No eligible audience is configured for the catalog service.', remediation: 'Open Audience and add at least one active eligible workspace, role, department, site, or person audience.', target: 'audience' });

  if (input.reportableFieldCount === 0) add({ id: 'reporting-fields', area: 'Reporting', severity: 'warning', title: 'No custom fields are reportable', detail: 'Operational reports will contain common request fields only.', remediation: 'Open Form or Reporting and mark the fields needed for analysis as reportable after reviewing sensitivity.', target: 'reporting' });
  else if (!input.reportingConfigured) add({ id: 'reporting-config', area: 'Reporting', severity: 'warning', title: 'Reportable fields lack report configuration', detail: `${input.reportableFieldCount} field(s) are reportable, but the service has no reporting configuration.`, remediation: 'Open Reporting, confirm field eligibility and save a service report definition or reporting configuration.', target: 'reporting' });
  else add({ id: 'reporting-ready', area: 'Reporting', severity: 'pass', title: 'Reporting is configured', detail: `${input.reportableFieldCount} reportable field(s) are discoverable.`, remediation: 'No action required.' });

  input.breakingDependencyMessages.forEach((message: string, index: number) => add({ id: `dependency-error-${index}`, area: 'Dependencies', severity: 'error', title: 'Breaking dependency impact', detail: message, remediation: 'Open Dependencies and remap or remove each affected rule, workflow, lifecycle, report, dashboard, or template reference.', target: 'dependencies' }));
  input.dependencyWarningMessages.forEach((message: string, index: number) => add({ id: `dependency-warning-${index}`, area: 'Dependencies', severity: 'warning', title: 'Dependency review required', detail: message, remediation: 'Open Dependencies, review every affected consumer, and confirm the change is backward-compatible.', target: 'dependencies' }));
  if (!input.breakingDependencyMessages.length && !input.dependencyWarningMessages.length) add({ id: 'dependencies-ready', area: 'Dependencies', severity: 'pass', title: 'Dependencies are safe', detail: 'No warning or breaking impacts were detected.', remediation: 'No action required.' });

  const areaResults = areas.map((area: ReadinessArea) => {
    const areaFindings = findings.filter((finding: ReadinessFinding) => finding.area === area);
    const status: ReadinessStatus = areaFindings.some((finding: ReadinessFinding) => finding.severity === 'error') ? 'Not Ready' : areaFindings.some((finding: ReadinessFinding) => finding.severity === 'warning') ? 'Ready With Warnings' : 'Ready';
    return { area, status, findings: areaFindings };
  });
  const status: ReadinessStatus = areaResults.some((item) => item.status === 'Not Ready') ? 'Not Ready' : areaResults.some((item) => item.status === 'Ready With Warnings') ? 'Ready With Warnings' : 'Ready';
  const score = Math.round((findings.reduce((sum: number, finding: ReadinessFinding) => sum + (finding.severity === 'pass' ? 1 : finding.severity === 'warning' ? 0.5 : 0), 0) / Math.max(findings.length, 1)) * 100);
  return { status, score, findings, areas: areaResults };
}
