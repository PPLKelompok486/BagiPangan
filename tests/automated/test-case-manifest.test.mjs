import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(
  await readFile(new URL("./test-case-manifest.json", import.meta.url), "utf8"),
);

const jiraKeysSeenInScrumProject = new Set([
  "SCRUM-1",
  "SCRUM-12",
  "SCRUM-13",
  "SCRUM-15",
  "SCRUM-16",
  "SCRUM-17",
  "SCRUM-18",
  "SCRUM-19",
  "SCRUM-20",
  "SCRUM-21",
  "SCRUM-22",
  "SCRUM-23",
  "SCRUM-24",
  "SCRUM-25",
  "SCRUM-26",
  "SCRUM-27",
  "SCRUM-30",
  "SCRUM-31",
  "SCRUM-32",
  "SCRUM-33",
  "SCRUM-35",
  "SCRUM-36",
  "SCRUM-37",
  "SCRUM-38",
  "SCRUM-40",
  "SCRUM-41",
  "SCRUM-43",
  "SCRUM-45",
  "SCRUM-46",
  "SCRUM-48",
  "SCRUM-49",
  "SCRUM-50",
  "SCRUM-51",
  "SCRUM-52",
  "SCRUM-53",
  "SCRUM-54",
  "SCRUM-55",
  "SCRUM-57",
  "SCRUM-58",
  "SCRUM-59",
  "SCRUM-60",
  "SCRUM-61",
  "SCRUM-62",
  "SCRUM-63",
  "SCRUM-65",
  "SCRUM-66",
  "SCRUM-67",
  "SCRUM-68",
  "SCRUM-71",
  "SCRUM-73",
  "SCRUM-74",
  "SCRUM-75",
  "SCRUM-76",
  "SCRUM-77",
  "SCRUM-78",
  "SCRUM-79",
]);

const requirementsWithoutTicketInWorkbook = new Set([
  "FR-12",
  "NFR-03",
  "NFR-04",
  "NFR-05",
]);

test("TC baseline matches the Excel workbook count", () => {
  assert.equal(manifest.baseline.total, 80);
  assert.equal(manifest.baseline.functional, 64);
  assert.equal(manifest.baseline.nonFunctional, 16);
  assert.equal(manifest.cases.length, manifest.baseline.total);
});

test("every TC id is unique", () => {
  const ids = manifest.cases.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("each TC has code-based automation metadata and valid JIRA traceability", async (t) => {
  for (const item of manifest.cases) {
    await t.test(item.id, () => {
      assert.match(item.id, /^TC-/);
      assert.ok(item.title);
      assert.match(item.requirement, /^(FR|NFR)-\d{2}$/);
      assert.ok(item.expected);
      assert.ok(item.automation?.kind);
      assert.ok(item.automation?.file);
      assert.doesNotMatch(item.automation.kind, /manual|excel/i);

      if (requirementsWithoutTicketInWorkbook.has(item.requirement)) {
        assert.deepEqual(item.jiraTickets, []);
      } else {
        assert.ok(item.jiraTickets.length > 0, `${item.id} must map to at least one JIRA ticket`);
      }

      for (const ticket of item.jiraTickets) {
        assert.ok(jiraKeysSeenInScrumProject.has(ticket), `${item.id} references missing JIRA key ${ticket}`);
      }
    });
  }
});
