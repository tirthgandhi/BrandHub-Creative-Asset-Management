import { describe, it } from "node:test";
import assert from "node:assert";
import { nextStatus, isValidTransition, getAllowedActions, STATUSES, ACTIONS, ROLES } from "../src/utils/reviewStateMachine.js";

describe("Review State Machine", () => {
  describe("Draft → In Review (Submit)", () => {
    it("should allow Project Manager to submit draft", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.SUBMIT, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.strictEqual(result.error, undefined);
    });

    it("should allow assigned Designer to submit draft", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.SUBMIT, ROLES.DESIGNER, { isAssignedDesigner: true });
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.strictEqual(result.error, undefined);
    });

    it("should block unassigned Designer from submitting", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.SUBMIT, ROLES.DESIGNER, { isAssignedDesigner: false });
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.ok(result.error);
    });

    it("should block Client from submitting", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.SUBMIT, ROLES.CLIENT, {});
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.ok(result.error);
    });

    it("should only allow submit from draft status", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.SUBMIT, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.ok(result.error);
    });
  });

  describe("In Review → Approved (Approve)", () => {
    it("should allow Project Manager to approve", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.APPROVE, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.APPROVED);
      assert.strictEqual(result.error, undefined);
    });

    it("should allow assigned Client to approve", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.APPROVE, ROLES.CLIENT, { isAssignedClient: true });
      assert.strictEqual(result.status, STATUSES.APPROVED);
      assert.strictEqual(result.error, undefined);
    });

    it("should block unassigned Client from approving", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.APPROVE, ROLES.CLIENT, { isAssignedClient: false });
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.ok(result.error);
    });

    it("should block Designer from approving", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.APPROVE, ROLES.DESIGNER, { isAssignedDesigner: true });
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.ok(result.error);
    });

    it("should only allow approve from in_review status", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.APPROVE, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.ok(result.error);
    });
  });

  describe("In Review → Changes Requested (Request Changes)", () => {
    it("should allow Project Manager to request changes with note", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.REQUEST_CHANGES, ROLES.ADMIN, { note: "Please adjust colors" });
      assert.strictEqual(result.status, STATUSES.CHANGES_REQUESTED);
      assert.strictEqual(result.error, undefined);
    });

    it("should allow assigned Client to request changes with note", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.REQUEST_CHANGES, ROLES.CLIENT, { 
        isAssignedClient: true, 
        note: "Needs more contrast" 
      });
      assert.strictEqual(result.status, STATUSES.CHANGES_REQUESTED);
      assert.strictEqual(result.error, undefined);
    });

    it("should require non-empty note", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.REQUEST_CHANGES, ROLES.ADMIN, { note: "" });
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.ok(result.error);
      assert.ok(result.error.includes("note"));
    });

    it("should block Designer from requesting changes", () => {
      const result = nextStatus(STATUSES.IN_REVIEW, ACTIONS.REQUEST_CHANGES, ROLES.DESIGNER, { 
        isAssignedDesigner: true,
        note: "Fix this" 
      });
      assert.strictEqual(result.status, STATUSES.IN_REVIEW);
      assert.ok(result.error);
    });
  });

  describe("Changes Requested → Draft (Revision Uploaded)", () => {
    it("should allow Project Manager to upload revision", () => {
      const result = nextStatus(STATUSES.CHANGES_REQUESTED, ACTIONS.REVISION_UPLOADED, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.strictEqual(result.error, undefined);
    });

    it("should allow assigned Designer to upload revision", () => {
      const result = nextStatus(STATUSES.CHANGES_REQUESTED, ACTIONS.REVISION_UPLOADED, ROLES.DESIGNER, { 
        isAssignedDesigner: true 
      });
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.strictEqual(result.error, undefined);
    });

    it("should block Client from uploading revision", () => {
      const result = nextStatus(STATUSES.CHANGES_REQUESTED, ACTIONS.REVISION_UPLOADED, ROLES.CLIENT, {});
      assert.strictEqual(result.status, STATUSES.CHANGES_REQUESTED);
      assert.ok(result.error);
    });

    it("should only allow revision upload from changes_requested status", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.REVISION_UPLOADED, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.ok(result.error);
    });
  });

  describe("Invalid Transitions", () => {
    it("should block approving a draft", () => {
      const result = nextStatus(STATUSES.DRAFT, ACTIONS.APPROVE, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.DRAFT);
      assert.ok(result.error);
    });

    it("should block approving an approved asset", () => {
      const result = nextStatus(STATUSES.APPROVED, ACTIONS.APPROVE, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.APPROVED);
      assert.ok(result.error);
    });

    it("should block submitting an approved asset", () => {
      const result = nextStatus(STATUSES.APPROVED, ACTIONS.SUBMIT, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.APPROVED);
      assert.ok(result.error);
    });

    it("should block revision upload on approved asset", () => {
      const result = nextStatus(STATUSES.APPROVED, ACTIONS.REVISION_UPLOADED, ROLES.ADMIN, {});
      assert.strictEqual(result.status, STATUSES.APPROVED);
      assert.ok(result.error);
    });
  });

  describe("Utility Functions", () => {
    it("isValidTransition should correctly identify valid transitions", () => {
      assert.strictEqual(isValidTransition(STATUSES.DRAFT, ACTIONS.SUBMIT, ROLES.ADMIN, {}), true);
      assert.strictEqual(isValidTransition(STATUSES.DRAFT, ACTIONS.APPROVE, ROLES.ADMIN, {}), false);
      assert.strictEqual(isValidTransition(STATUSES.IN_REVIEW, ACTIONS.APPROVE, ROLES.DESIGNER, {}), false);
    });

    it("getAllowedActions should return correct actions for Project Manager on draft", () => {
      const actions = getAllowedActions(STATUSES.DRAFT, ROLES.ADMIN, {});
      assert.ok(actions.includes(ACTIONS.SUBMIT));
      assert.strictEqual(actions.includes(ACTIONS.APPROVE), false);
    });

    it("getAllowedActions should return correct actions for Client on in_review", () => {
      const actions = getAllowedActions(STATUSES.IN_REVIEW, ROLES.CLIENT, { isAssignedClient: true, note: "test" });
      assert.ok(actions.includes(ACTIONS.APPROVE));
      assert.ok(actions.includes(ACTIONS.REQUEST_CHANGES));
      assert.strictEqual(actions.includes(ACTIONS.SUBMIT), false);
    });

    it("getAllowedActions should return empty for Designer on in_review", () => {
      const actions = getAllowedActions(STATUSES.IN_REVIEW, ROLES.DESIGNER, { isAssignedDesigner: true });
      assert.strictEqual(actions.length, 0);
    });
  });
});
