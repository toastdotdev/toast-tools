import { createCompiler } from "@mdx-js/mdx";
import { promises as fs } from "fs";
import globby from "globby";
import path from "path";
import rehypeLink from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import slugify from "@sindresorhus/slugify";

import rehypePrism from "./rehype-prism-mdx.js";
import remarkPluckMeta from "./remark-pluck-meta.js";

export const fetchMdxFromDisk = async ({ directory, extensions = ["mdx"] }) => {
  const filenames = await globby(directory, {
    expandDirectories: { extensions },
  });
  const files = await Promise.all(
    filenames.map(async (filename) => {
      const contents = await fs.readFile(filename, "utf-8");
      return {
        filename,
        file: contents,
      };
    })
  );

  return files;
};

export const processMdx = async (
  content,
  { filepath, namedExports, prismTheme }
) => {
  try {
    const result = await compileMdx(content, {
      filepath,
      remarkPlugins: [
        [
          remarkPluckMeta,
          {
            exportNames: namedExports.includes("meta")
              ? namedExports
              : [...namedExports, "meta"],
          },
        ],
      ],
      rehypePlugins: [
        [rehypePrism, { theme: prismTheme }],
        rehypeSlug,
        [
          rehypeLink,
          {
            properties: {
              className: "heading-link-anchor",
              // style: "position: absolute; right: calc(100% + 5px);",
            },
            content: {
              type: "element",
              tagName: "heading-link-icon",
              properties: { className: ["heading-link-icon"] },
              children: [],
              // children: [parsedCorgi]
            },
          },
        ],
      ],
    });
    return result;
  } catch (e) {
    console.error(
      `mdx content at ${filepath} failed to process with error: `,
      e
    );
    throw e;
  }
};
export const sourceMdx = async ({
  setDataForSlug,
  namedExports = ["meta"],
  directory = [],
  sources = [],
  slugPrefix = "/",
  ...options
}) => {
  let files = [];

  // given a directory or list of directories,
  // fetch the mdx
  if (directory) {
    let dirs = [];
    if (Array.isArray(directory)) {
      dirs = directory;
    } else if (typeof directory === "string") {
      dirs = [directory];
    } else {
      throw new Error(
        `directory should be a string or an array of strings, received: ${directory}`
      );
    }
    const results = await Promise.all(
      dirs.map((dir) => fetchMdxFromDisk({ directory: dir }))
    );
    files = results.flat();
  }
  // if we're given MDX strings, make them into
  // a form we can process
  if (sources) {
    files = files.concat(sources.map((source) => ({ file: source })));
  }
  return Promise.all(
    files.map(async ({ filename, file }) => {
      const result = await processMdx(file, {
        filepath: filename,
        namedExports,
      });
      const compiledMdx = result.content;
      const mdxExports = result.data.exports;
      // if the user doesn't have a meta export, make it
      // an empty object
      if (!mdxExports.meta) {
        mdxExports.meta = {};
      }
      // if user hasn't specified a slug, but has a title
      // slugify the title
      if (!mdxExports.meta.slug && mdxExports.meta.title) {
        mdxExports.meta.slug = slugify(mdxExports.meta.title);
      }
      // if we still don't have a slug, use the filename
      if (!mdxExports.meta.slug && filename) {
        // TODO: doesn't account for `directory/index.mdx` yet
        mdxExports.meta.slug = slugify(
          path.basename(filename, path.extname(filename))
        );
      }
      if (!mdxExports.meta.slug) {
        throw new Error(`unable to generate slug. The following MDX does not have a \`slug\` or \`title\` in \`export const meta\` and also does not have a filename:

${file}`);
      }

      // remove leading and trailing slashes
      mdxExports.meta.slug = mdxExports.meta.slug
        .replace(/^\//, "")
        .replace(/\/$/, "");

      let prefix = slugPrefix === "/" ? "/" : slugPrefix + "/";
      await setDataForSlug(prefix + mdxExports.meta.slug, {
        component: {
          mode: "source",
          value: compiledMdx,
        },
        data: mdxExports,
      });

      return mdxExports;
    })
  );
};

// process MDX using a slightly custom function
// so that we get the data back from plugins
// you should probably use processMdx
export async function compileMdx(mdx, options = {}) {
  const compiler = createCompiler(options);

  const fileOpts = { contents: mdx };
  if (options.filepath) {
    fileOpts.path = options.filepath;
  }

  const { contents, data } = await compiler.process(fileOpts);

  return {
    content: `/** @jsxRuntime classic */
/** @jsx mdx */
import { mdx } from '@mdx-js/preact';

${contents}`,
    data,
  };
}
