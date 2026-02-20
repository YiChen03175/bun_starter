import { Elysia, t } from "elysia";
import {
  ParsedSpecSchema,
  SpecChangeSchema,
  SpecModel,
  SpecSummarySchema,
} from "./model";
import { SpecService } from "./service";

export const specController = new Elysia({
  prefix: "/specs",
  name: "Spec.Controller",
})
  .use(SpecModel)
  .get("/", () => SpecService.list(), {
    response: t.Array(SpecSummarySchema),
  })
  .get("/dev/changes", () => SpecService.getDevChanges(), {
    response: t.Array(SpecChangeSchema),
  })
  .get("/:code", ({ params }) => SpecService.get(params.code), {
    params: "spec.code",
    response: ParsedSpecSchema,
  });
