import { authenticate, find } from "../services/data-source.js";

export const requireRole = (allowedRoles) => async (request, response, next) => {
  try {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "") || request.header("x-local-token");
    const user = await authenticate(token);
    if (!user || !allowedRoles.includes(user.role)) return response.status(403).json({ error: "This action requires an authorized campus role." });
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireResource = (resource) => async (request, response, next) => {
  try {
    const item = await find(resource, request.params.id);
    if (!item) return response.status(404).json({ error: `${resource.slice(0, -1)} not found.` });
    request.resource = item;
    next();
  } catch (error) {
    next(error);
  }
};
