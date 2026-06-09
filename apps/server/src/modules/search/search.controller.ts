import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { searchEvents } from "./search.service.js";

export const handleSearch: RequestHandler = async (req, res, next) => {
  try {
    const filters = {
      q: req.query.q as string | undefined,
      category: req.query.category as string | undefined,
      clubId: req.query.clubId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      uploaderId: req.query.uploaderId as string | undefined,
      tag: req.query.tag as string | undefined,
    };

    const results = await searchEvents(filters);
    sendSuccess(res, "Search results loaded successfully", { events: results });
  } catch (error) {
    next(error);
  }
};
