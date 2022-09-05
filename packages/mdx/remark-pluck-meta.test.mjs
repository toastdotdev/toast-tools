import test from "ava";
import { compile } from "@mdx-js/mdx";
import remarkPluckMeta from "./remark-pluck-meta.js";

test("remark-pluck-meta", async (t) => {
  let results = await compile(
    {
      value: `export const meta = {
    "something": true,
    "another": {
        "nested": "object"
    }
}

# testing`,
    },
    {
      remarkPlugins: [[remarkPluckMeta, { exportNames: "meta" }]],
    }
  );

  t.deepEqual(results.data, {
    exports: { meta: { something: true, another: { nested: "object" } } },
  });
});
