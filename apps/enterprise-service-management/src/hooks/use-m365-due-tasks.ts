import { useQuery } from '@tanstack/react-query';
import { copilotChat } from '../../app-gen-sdk/data/workiq/m365-mcp-clients';

export interface M365DueTask {
  title: string;
  source: string;
  dueDate: string;
  status: string;
  webUrl: string;
}

export function useM365DueTasks() {
  return useQuery({
    queryKey: ['m365-due-tasks', 'overdue-or-next-48-hours'],
    queryFn: () => copilotChat<M365DueTask>({
      message: 'Find my incomplete tasks in Microsoft Planner and Microsoft Loop that are overdue or due within the next 48 hours. Return each task once, ordered by due date. Use an empty string when a web link is unavailable.',
      responseSchema: {
        title: 'string',
        source: 'string',
        dueDate: 'string',
        status: 'string',
        webUrl: 'string',
      },
    }),
    staleTime: 5 * 60 * 1000,
  });
}
