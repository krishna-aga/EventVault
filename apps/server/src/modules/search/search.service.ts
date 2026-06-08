import { queryEvents } from "./search.repository.js";
import type { SearchFilters } from "@repo/contracts";

export const searchEvents = async (filters: SearchFilters) => {
  const parsedFilters: any = {
    q: filters.q,
    category: filters.category,
    clubId: filters.clubId,
    uploaderId: filters.uploaderId,
    tag: filters.tag,
  };

  if (filters.startDate) {
    parsedFilters.startDate = new Date(filters.startDate);
  }
  
  if (filters.endDate) {
    parsedFilters.endDate = new Date(filters.endDate);
  }

  return queryEvents(parsedFilters);
};
