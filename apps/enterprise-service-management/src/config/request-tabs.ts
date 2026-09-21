export const requestTabs = [
  'Activity',
  'Details',
  'Work',
  'Resolution',
  'History',
] as const;

export type RequestTab = (typeof requestTabs)[number];
