/**
 * Pure review state machine for BrandHub asset workflow
 * Phase 5 - Dev C
 * 
 * Implements the approved state transitions:
 * - draft → in_review (submit by Designer/Admin)
 * - in_review → approved (approve by Client/Admin, NOT Designer)
 * - in_review → changes_requested (request changes by Client/Admin with note)
 * - changes_requested → draft (revision uploaded by Designer/Admin)
 */

const STATUSES = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
};

const ACTIONS = {
  SUBMIT: "submit",
  APPROVE: "approve",
  REQUEST_CHANGES: "request_changes",
  REVISION_UPLOADED: "revision_uploaded",
};

const ROLES = {
  ADMIN: "admin",
  DESIGNER: "designer",
  CLIENT: "client",
};

/**
 * Compute the next status given current state, action, and actor role
 * @param {string} currentStatus - Current asset status
 * @param {string} action - Action being performed
 * @param {string} actorRole - Role of the user performing the action
 * @param {object} context - Additional context (note, isAssigned, etc.)
 * @returns {{status: string, error?: string}} Next status or error
 */
export function nextStatus(currentStatus, action, actorRole, context = {}) {
  // Validate inputs
  if (!Object.values(STATUSES).includes(currentStatus)) {
    return { status: currentStatus, error: "Invalid current status" };
  }
  if (!Object.values(ACTIONS).includes(action)) {
    return { status: currentStatus, error: "Invalid action" };
  }
  if (!Object.values(ROLES).includes(actorRole)) {
    return { status: currentStatus, error: "Invalid actor role" };
  }

  // SUBMIT: draft → in_review
  if (action === ACTIONS.SUBMIT) {
    if (currentStatus !== STATUSES.DRAFT) {
      return { status: currentStatus, error: "Can only submit draft assets" };
    }
    // Only Admin or assigned Designer can submit
    if (actorRole === ROLES.CLIENT) {
      return { status: currentStatus, error: "Clients cannot submit assets" };
    }
    if (actorRole === ROLES.DESIGNER && !context.isAssignedDesigner) {
      return { status: currentStatus, error: "Only assigned designers can submit" };
    }
    return { status: STATUSES.IN_REVIEW };
  }

  // APPROVE: in_review → approved
  if (action === ACTIONS.APPROVE) {
    if (currentStatus !== STATUSES.IN_REVIEW) {
      return { status: currentStatus, error: "Can only approve assets in review" };
    }
    // Only Admin or assigned Client can approve
    if (actorRole === ROLES.DESIGNER) {
      return { status: currentStatus, error: "Designers cannot approve assets" };
    }
    if (actorRole === ROLES.CLIENT && !context.isAssignedClient) {
      return { status: currentStatus, error: "Only assigned clients can approve" };
    }
    return { status: STATUSES.APPROVED };
  }

  // REQUEST_CHANGES: in_review → changes_requested
  if (action === ACTIONS.REQUEST_CHANGES) {
    if (currentStatus !== STATUSES.IN_REVIEW) {
      return { status: currentStatus, error: "Can only request changes on assets in review" };
    }
    // Only Admin or assigned Client can request changes
    if (actorRole === ROLES.DESIGNER) {
      return { status: currentStatus, error: "Designers cannot request changes" };
    }
    if (actorRole === ROLES.CLIENT && !context.isAssignedClient) {
      return { status: currentStatus, error: "Only assigned clients can request changes" };
    }
    // Note is required
    if (!context.note || context.note.trim().length === 0) {
      return { status: currentStatus, error: "Review note is required when requesting changes" };
    }
    return { status: STATUSES.CHANGES_REQUESTED };
  }

  // REVISION_UPLOADED: changes_requested → draft
  if (action === ACTIONS.REVISION_UPLOADED) {
    if (currentStatus !== STATUSES.CHANGES_REQUESTED) {
      return { status: currentStatus, error: "Can only upload revisions for assets with requested changes" };
    }
    // Only Admin or assigned Designer can upload revisions
    if (actorRole === ROLES.CLIENT) {
      return { status: currentStatus, error: "Clients cannot upload revisions" };
    }
    if (actorRole === ROLES.DESIGNER && !context.isAssignedDesigner) {
      return { status: currentStatus, error: "Only assigned designers can upload revisions" };
    }
    return { status: STATUSES.DRAFT };
  }

  return { status: currentStatus, error: "Invalid state transition" };
}

/**
 * Check if a transition is valid
 * @param {string} currentStatus - Current status
 * @param {string} action - Action to perform
 * @param {string} actorRole - Actor role
 * @param {object} context - Additional context
 * @returns {boolean} Whether the transition is valid
 */
export function isValidTransition(currentStatus, action, actorRole, context = {}) {
  const result = nextStatus(currentStatus, action, actorRole, context);
  return !result.error && result.status !== currentStatus;
}

/**
 * Get allowed actions for a given status and actor
 * @param {string} currentStatus - Current asset status
 * @param {string} actorRole - Actor role
 * @param {object} context - Additional context
 * @returns {string[]} Array of allowed actions
 */
export function getAllowedActions(currentStatus, actorRole, context = {}) {
  const allowed = [];

  for (const action of Object.values(ACTIONS)) {
    if (isValidTransition(currentStatus, action, actorRole, context)) {
      allowed.push(action);
    }
  }

  return allowed;
}

export { STATUSES, ACTIONS, ROLES };
