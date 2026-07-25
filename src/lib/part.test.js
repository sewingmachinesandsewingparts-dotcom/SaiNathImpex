import test from "node:test";
import assert from "node:assert/strict";
import { resolveIdentifierFields } from "./part-identifiers.js";

test("resolveIdentifierFields prefers explicit series, id1 and id2 values", () => {
  const resolved = resolveIdentifierFields(
    {
      linkedSeries: { series: "OLD-SERIES" },
      MCG: "OLD-MCG",
      OEM: "OLD-OEM",
      id1: "OLD-ID1",
      id2: "OLD-ID2",
    },
    {
      series: "PG-80001",
      id1: "209298",
      id2: "L52-01",
      MCG: "",
      OEM: "",
    },
    { has: () => true },
  );

  assert.equal(resolved.series, "PG-80001");
  assert.equal(resolved.id1, "209298");
  assert.equal(resolved.id2, "L52-01");
  assert.equal(resolved.MCG, "PG-80001");
  assert.equal(resolved.OEM, "L52-01");
});

test("resolveIdentifierFields preserves existing values when the form does not submit them", () => {
  const resolved = resolveIdentifierFields(
    {
      linkedSeries: { series: "PG-80001" },
      MCG: "PG-80001",
      OEM: "L52-01",
      id1: "209298",
      id2: "L52-01",
    },
    {
      series: "",
      id1: "",
      id2: "",
      MCG: "",
      OEM: "",
    },
    { has: (name) => name === "price" },
  );

  assert.equal(resolved.series, "PG-80001");
  assert.equal(resolved.id1, "209298");
  assert.equal(resolved.id2, "L52-01");
  assert.equal(resolved.MCG, "PG-80001");
  assert.equal(resolved.OEM, "L52-01");
});
