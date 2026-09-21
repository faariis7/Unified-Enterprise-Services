import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  listCalendarView,
  type ListCalendarViewResponse,
} from '../../app-gen-sdk/data/workiq/m365-mcp-clients';
import { chunkDateRange, parseCalendarDateTime } from '../../app-gen-sdk/data/workiq/calendar-date-utils';


export interface CalendarAction {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  isOnline: boolean;
}

export function useM365CalendarActions() {

  const range = useMemo(() => {
    const start = new Date();
    start.setSeconds(0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);
  const chunks = useMemo(() => chunkDateRange(range.start, range.end), [range]);
  const queries = useQueries({
    queries: chunks.map(({ startDate, endDate }) => ({
      queryKey: ['m365-calendar-actions', startDate.toISOString(), endDate.toISOString()],
      queryFn: () => listCalendarView({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        select: 'id,subject,start,end,location,isOnlineMeeting,isAllDay,isCancelled,showAs',
        top: 999,
      }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const events = useMemo(() => queries
    .flatMap((query) => query.data ?? [])
    .filter((event: ListCalendarViewResponse) => Boolean(event.id && event.subject && event.start && event.end && !event.isCancelled))
    .map((event: ListCalendarViewResponse): CalendarAction => ({
      id: event.id ?? '',
      title: event.subject ?? 'Calendar event',
      startsAt: parseCalendarDateTime(event.start?.dateTime ?? '', event.start?.timeZone ?? 'UTC'),
      endsAt: parseCalendarDateTime(event.end?.dateTime ?? '', event.end?.timeZone ?? 'UTC'),
      location: event.location?.displayName,
      isOnline: Boolean(event.isOnlineMeeting),
    }))
    .filter((event: CalendarAction) => event.endsAt >= range.start)
    .sort((first: CalendarAction, second: CalendarAction) => first.startsAt.getTime() - second.startsAt.getTime()), [queries, range.start]);

  const actions = events.filter((event: CalendarAction) => event.startsAt <= range.end);

  return {
    data: actions,
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
