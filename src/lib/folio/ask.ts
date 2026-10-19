import { createServerFn } from "@tanstack/react-start";
import type { AskResult } from "@/lib/folio/types";

export const askGrok = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<AskResult> => {
    const { runAsk } = await import("./grok.server");
    return runAsk(data);
  });
