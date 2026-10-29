import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HealthResponse, ProblemDetails, ValidationProblem } from "@talentstroom/contracts";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import apiPackage from "../package.json" with { type: "json" };
import { problem, type AppEnv } from "./problem.ts";
import { ipKey, rateLimit } from "./rate-limit.ts";
import { cachePolicy, requestBodyLimit, securityHeaders } from "./security.ts";

export const openapiConfig = {
  openapi: "3.1.0",
  info: { title: "TalentStroom API", version: apiPackage.version },
  servers: [{ url: "/" }],
};

/** A fresh app lets tests exercise the production hook without shipping test routes. */
export function createApp() {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        // Zod messages and dynamic paths can contain submitted values. Expose only
        // the input section and fixed copy, never the issues or input themselves.
        return problem(c, "validationError", [
          {
            path: result.target === "json" ? "body" : result.target,
            message: t(DEFAULT_LOCALE, "api.problem.invalidValue"),
          },
        ]);
      }
      return undefined;
    },
  });
  app.use(requestId());
  app.use(securityHeaders, cachePolicy, requestBodyLimit);
  // Global per-IP limit; /health stays exempt so uptime probes never trip it.
  app.use(
    rateLimit("RATE_LIMIT_ANON", {
      key: ipKey,
      failOpen: true,
      retryAfterSeconds: 60,
      skip: (c) => c.req.path === "/health",
    }),
  );
  app.notFound((c) => problem(c, "notFound"));
  app.onError((err, c) => {
    // Hono's JSON validator wraps JSON parse failures before the Zod hook runs.
    if (err instanceof HTTPException && err.status === 400 && err.message === "Malformed JSON in request body") {
      return problem(c, "malformedJson");
    }
    console.error(JSON.stringify({ message: "unhandled error", requestId: c.get("requestId") }));
    return problem(c, "internalError");
  });

  app.openAPIRegistry.register("ProblemDetails", ProblemDetails);
  app.openAPIRegistry.register("ValidationProblem", ValidationProblem);
  for (const [name, schema, description] of [
    ["PayloadTooLarge", "ProblemDetails", "Request body exceeds 1 MiB"],
    ["MalformedJson", "ProblemDetails", "Malformed JSON request body"],
    ["NotFound", "ProblemDetails", "Resource not found"],
    ["TooManyRequests", "ProblemDetails", "Rate limit exceeded; see Retry-After"],
    ["InternalError", "ProblemDetails", "Unexpected server error"],
    ["ValidationError", "ValidationProblem", "Request validation failed"],
  ] as const) {
    app.openAPIRegistry.registerComponent("responses", name, {
      description,
      headers: { "X-Request-Id": { schema: { type: "string" }, description: "Request correlation ID" } },
      content: { "application/problem+json": { schema: { $ref: `#/components/schemas/${schema}` } } },
    });
  }
  return app;
}

export const app = createApp();
const healthSchema = app.openAPIRegistry.register("HealthResponse", HealthResponse);
app.openapi(
  createRoute({
    method: "get",
    path: "/health",
    operationId: "getHealth",
    responses: {
      200: {
        description: "API health",
        headers: z.object({ "X-Request-Id": z.string() }),
        content: { "application/json": { schema: healthSchema } },
      },
      500: { $ref: "#/components/responses/InternalError" },
    },
  }),
  (c) => c.json(HealthResponse.parse({ status: "ok", service: c.env.SERVICE_NAME }), 200),
);

app.get("/openapi.json", (c) =>
  c.env.ENVIRONMENT === "development" ? c.json(app.getOpenAPI31Document(openapiConfig)) : c.notFound(),
);
