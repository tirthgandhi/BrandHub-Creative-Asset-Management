import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export async function validateAssignments(clientId, designerIds) {
  const ids = [clientId, ...designerIds];
  const users = await User.find({ _id: { $in: ids }, isActive: true }).select("role");
  const byId = new Map(users.map((user) => [user.id, user.role]));
  if (byId.get(String(clientId)) !== "client") throw new AppError(422, "VALIDATION_ERROR", "Select an active Client");
  if (designerIds.some((id) => byId.get(String(id)) !== "designer")) throw new AppError(422, "VALIDATION_ERROR", "Select active Designers only");
}

export function validateProjectDates(startDate, dueDate) {
  if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) throw new AppError(422, "VALIDATION_ERROR", "Due date must not precede the start date");
}
