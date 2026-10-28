import { HealthResponse } from "@talentstroom/contracts";
import { Hono } from "hono";
import { requestId } from "hono/request-id";

interface AppEnv {
  Bindings: Env;
  Variables: { requestId: string };
}

export const app = new Hono<AppEnv>();

app.use(requestId());

app.get("/health", (c) => {
  const body: HealthResponse = { status: "ok", service: c.env.SERVICE_NAME };
  return c.json(HealthResponse.parse(body));
});

app.notFound((c) =>
  c.json({ type: "about:blank", title: "Not Found", status: 404, requestId: c.get("requestId") }, 404, {
    "Content-Type": "application/problem+json",
  }),
);

app.onError((err, c) => {
  console.error(JSON.stringify({ message: "unhandled error", requestId: c.get("requestId"), error: err.message }));
  return c.json(
    { type: "about:blank", title: "Internal Server Error", status: 500, requestId: c.get("requestId") },
    500,
    { "Content-Type": "application/problem+json" },
  );
});
