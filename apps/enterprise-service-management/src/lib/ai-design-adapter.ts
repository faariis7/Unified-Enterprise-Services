import type { FieldDefinitionFieldTypeKey } from '@/generated/models/field-definition-model';

export type AiDesignFieldSuggestion = {
  key: string;
  label: string;
  type: FieldDefinitionFieldTypeKey;
  required: boolean;
  reportable: boolean;
  helpText?: string;
  options?: string[];
};

export type AiDesignSectionSuggestion = {
  title: string;
  description: string;
  fields: AiDesignFieldSuggestion[];
};

export type AiDesignSuggestion = {
  title: string;
  summary: string;
  sections: AiDesignSectionSuggestion[];
  rules: string[];
  workflow: string[];
  lifecycle: string[];
  sla: { responseHours: number; resolutionHours: number };
  reports: string[];
  warnings: string[];
};

export interface AiDesignProvider {
  readonly key: string;
  readonly name: string;
  generate(description: string): Promise<AiDesignSuggestion>;
}

const stableKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48);
const includesAny = (text: string, terms: string[]) => terms.some((term: string) => text.includes(term));

export class LocalDesignHeuristicsProvider implements AiDesignProvider {
  readonly key = 'local-design-heuristics';
  readonly name = 'Local design assistant';

  async generate(description: string): Promise<AiDesignSuggestion> {
    const normalized = description.toLowerCase();
    const subject = description.split(/[.!?]/)[0]?.trim().slice(0, 70) || 'New service';
    const needsApproval = includesAny(normalized, ['approve', 'approval', 'manager', 'permission', 'access', 'cost', 'purchase']);
    const needsPerson = includesAny(normalized, ['employee', 'user', 'person', 'staff', 'onboard', 'offboard']);
    const needsDate = includesAny(normalized, ['date', 'deadline', 'start', 'travel', 'needed by', 'due']);
    const needsCost = includesAny(normalized, ['cost', 'budget', 'purchase', 'equipment', 'travel', 'vendor']);
    const needsAttachment = includesAny(normalized, ['document', 'attachment', 'evidence', 'quote', 'invoice', 'file']);
    const fields: AiDesignFieldSuggestion[] = [
      { key: 'request_summary', label: 'Request summary', type: 'Text', required: true, reportable: true, helpText: 'Summarize the outcome you need.' },
      { key: 'business_justification', label: 'Business justification', type: 'MultiLineText', required: true, reportable: false, helpText: 'Explain why this request is needed.' },
    ];
    if (needsPerson) fields.unshift({ key: 'requested_for', label: 'Requested for', type: 'Person', required: true, reportable: true });
    if (needsDate) fields.push({ key: 'needed_by', label: 'Needed by', type: 'Date', required: true, reportable: true });
    if (needsCost) fields.push({ key: 'estimated_cost', label: 'Estimated cost', type: 'Currency', required: false, reportable: true });
    if (needsAttachment) fields.push({ key: 'supporting_documents', label: 'Supporting documents', type: 'Attachment', required: false, reportable: false });
    fields.push({ key: 'priority_reason', label: 'Priority', type: 'SingleChoice', required: true, reportable: true, options: ['Standard', 'High', 'Critical'] });

    return {
      title: subject.replace(/^(create|build|design|provide)\s+/i, '') || 'New service',
      summary: `Editable starting point generated from: ${description.trim()}`,
      sections: [{ title: 'Request details', description: 'Information required to assess and fulfil the request.', fields }],
      rules: needsCost ? ['Require business justification when estimated cost is entered.'] : ['Show all requester fields by default.'],
      workflow: ['Start', ...(needsApproval ? ['Approval'] : []), 'Fulfilment task', 'Notification', 'End'],
      lifecycle: ['Draft', 'Submitted', ...(needsApproval ? ['Awaiting approval'] : []), 'In progress', 'Completed', 'Cancelled'],
      sla: { responseHours: includesAny(normalized, ['urgent', 'critical']) ? 2 : 8, resolutionHours: includesAny(normalized, ['urgent', 'critical']) ? 8 : 40 },
      reports: ['Request volume', 'Completion time', 'SLA compliance', ...fields.filter((field: AiDesignFieldSuggestion) => field.reportable).map((field: AiDesignFieldSuggestion) => field.label)],
      warnings: ['Confirm audience, ownership, permissions, assignments, and approver resolution before publication.', 'AI suggestions are drafts and require administrator review.'],
    };
  }
}

const providers = new Map<string, AiDesignProvider>();
export const registerAiDesignProvider = (provider: AiDesignProvider) => providers.set(provider.key, provider);
export const getAiDesignProvider = (key = 'local-design-heuristics') => providers.get(key);
registerAiDesignProvider(new LocalDesignHeuristicsProvider());

export const sanitizeAiSuggestion = (suggestion: AiDesignSuggestion): AiDesignSuggestion => ({
  ...suggestion,
  title: suggestion.title.trim().slice(0, 120) || 'New service',
  sections: suggestion.sections.map((section: AiDesignSectionSuggestion, sectionIndex: number) => ({
    ...section,
    title: section.title.trim() || `Section ${sectionIndex + 1}`,
    fields: section.fields.map((field: AiDesignFieldSuggestion, fieldIndex: number) => ({ ...field, key: stableKey(field.key || `${field.label}_${fieldIndex + 1}`), label: field.label.trim() || `Field ${fieldIndex + 1}` })),
  })),
});
