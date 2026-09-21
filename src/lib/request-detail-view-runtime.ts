import { useMemo } from 'react';
import { useViewActionDefinitionList } from '@/generated/hooks/use-view-action-definition';
import { useViewDefinitionList } from '@/generated/hooks/use-view-definition';
import { useViewSectionDefinitionList } from '@/generated/hooks/use-view-section-definition';
import type { ViewActionDefinition, ViewActionDefinitionHandlerKeyKey } from '@/generated/models/view-action-definition-model';
import type { ViewSectionDefinition, ViewSectionDefinitionRendererKeyKey } from '@/generated/models/view-section-definition-model';

export type RequestDetailSurface = 'Requester' | 'Agent';
export type RequestDetailTab = 'home' | 'progress' | 'timeline';

export type RequestDetailComposition = {
  viewKey: string;
  sections: ViewSectionDefinitionRendererKeyKey[];
  actions: ViewActionDefinitionHandlerKeyKey[];
  tabs: Array<{ value: RequestDetailTab; label: string }>;
  isConfigured: boolean;
};

const defaultSections: Record<RequestDetailSurface, ViewSectionDefinitionRendererKeyKey[]> = {
  Requester: ['RequestSummary', 'RequestDetails', 'RequestActivity', 'RequestAttachments', 'RequestApprovals', 'RequestServiceTargets'],
  Agent: ['RequestSummary', 'RequestDetails', 'RequestActivity', 'RequestAttachments', 'RequestApprovals', 'RequestServiceTargets'],
};

const defaultActions: Record<RequestDetailSurface, ViewActionDefinitionHandlerKeyKey[]> = {
  Requester: ['AddComment', 'AddAttachment', 'TransitionRequest'],
  Agent: ['AddComment', 'AddAttachment', 'EditRequest', 'TransitionRequest'],
};

const defaultTabs: Array<{ value: RequestDetailTab; label: string }> = [
  { value: 'home', label: 'Home' },
  { value: 'progress', label: 'Approval & fulfillment' },
  { value: 'timeline', label: 'Request timeline' },
];

function isAllowedSection(section: ViewSectionDefinition): boolean {
  return section.statusKey === 'Active' && Object.prototype.hasOwnProperty.call({ RequestSummary: true, RequestDetails: true, RequestActivity: true, RequestAttachments: true, RequestApprovals: true, RequestServiceTargets: true }, section.rendererKeyKey);
}

function isAllowedAction(action: ViewActionDefinition): boolean {
  return action.statusKey === 'Active' && Object.prototype.hasOwnProperty.call({ AddComment: true, AddAttachment: true, EditRequest: true, TransitionRequest: true }, action.handlerKeyKey);
}

export function useRequestDetailViewRuntime(surface: RequestDetailSurface): RequestDetailComposition {
  const { data: views = [] } = useViewDefinitionList();
  const { data: sectionDefinitions = [] } = useViewSectionDefinitionList();
  const { data: actionDefinitions = [] } = useViewActionDefinitionList();

  return useMemo<RequestDetailComposition>(() => {
    const view = views
      .filter((candidate) => candidate.entityName === 'Request' && candidate.surfaceKey === surface && candidate.statusKey === 'Active')
      .sort((first, second) => second.version - first.version)[0];
    if (!view) return { viewKey: `request-detail-${surface.toLowerCase()}-default`, sections: defaultSections[surface], actions: defaultActions[surface], tabs: defaultTabs, isConfigured: false };

    const sections = sectionDefinitions
      .filter((section) => section.viewDefinition.id === view.id && isAllowedSection(section) && !section.requiredPermission)
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((section) => section.rendererKeyKey);
    const actions = actionDefinitions
      .filter((action) => action.viewDefinition.id === view.id && isAllowedAction(action) && !action.requiredPermission)
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((action) => action.handlerKeyKey);
    const effectiveSections = sections.length > 0 ? sections : defaultSections[surface];
    const tabs = defaultTabs.filter((tab) => tab.value === 'home'
      ? effectiveSections.some((section) => ['RequestSummary', 'RequestDetails', 'RequestActivity', 'RequestAttachments'].includes(section))
      : tab.value === 'progress'
        ? effectiveSections.some((section) => ['RequestApprovals', 'RequestServiceTargets'].includes(section))
        : effectiveSections.includes('RequestActivity'));

    return {
      viewKey: view.viewKey,
      sections: effectiveSections,
      actions: actions.length > 0 ? actions : defaultActions[surface],
      tabs: tabs.length > 0 ? tabs : defaultTabs,
      isConfigured: true,
    };
  }, [actionDefinitions, sectionDefinitions, surface, views]);
}
