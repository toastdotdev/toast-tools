import { promises as fs } from "fs";
import json5 from "json5";
import slugify from "@sindresorhus/slugify";
import mdx from "@mdx-js/mdx";
import rehypePrism from "./rehype-prism-mdx.js";
import rehypeSlug from "rehype-slug";
import rehypeLink from "rehype-autolink-headings";
import parse from "rehype-parse";
import unified from "unified";
import visit from "unist-util-visit";
import globby from "globby";
import path from "path";

const linkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
</svg>`;

const parseSvg = unified().use(parse, {
  emitParseErrors: true,
  duplicateAttribute: false,
});

let parsedHeadingLink;
try {
  parsedHeadingLink = parseSvg.runSync(parseSvg.parse(linkIcon)).children[0]
    .children[1].children;
} catch (e) {
  console.log(e);
}

export const fetchMdxFromDisk = async ({ directory }) => {
  const filenames = await globby(directory, {
    expandDirectories: { extensions: ["mdx"] },
  });
  const files = await Promse.all(
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

export const sourceMdx = async ({
  setDataForSlug,
  namedExports = ["meta"],
  directory,
  slugPrefix = "/",
  ...options
}) => {
  const nExports = namedExports.includes("meta")
    ? namedExports
    : [...namedExports, "meta"];
  const files = fetchMdxFromDisk();
  return Promise.all(
    files.map(async ({ filename, file }) => {
      const mdxExports = {};
      const remarkPluckMeta = (_options) => (tree) => {
        nExports.forEach((exportName) => {
          let re = new RegExp(`^export const ${exportName} = `);
          visit(tree, "export", (ast) => {
            if (ast.value.startsWith(`export const ${exportName} = `)) {
              const obj = ast.value.replace(re, "").replace(/;$/, "");
              mdxExports[exportName] = json5.parse(obj);
            }
          });
        });
        return tree;
      };

      let compiledMDX;
      try {
        compiledMDX = await mdx(file, {
          remarkPlugins: [remarkPluckMeta],
          rehypePlugins: [
            rehypePrism,
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
      } catch (e) {
        console.error(
          `mdx content at ${filename} failed to process with error: `,
          e
        );
        throw e;
      }

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
      if (!mdxExports.meta.slug) {
        // TODO: doesn't account for `directory/index.mdx` yet
        mdxExports.meta.slug = slugify(
          path.basename(filename, path.extname(filename))
        );
      }

      // remove leading and trailing slashes
      mdxExports.meta.slug = mdxExports.meta.slug
        .replace(/^\//, "")
        .replace(/\/$/, "");

      let prefix = slugPrefix === "/" ? "/" : slugPrefix + "/";
      await setDataForSlug(prefix + mdxExports.meta.slug, {
        component: {
          mode: "source",
          value: `/** @jsx mdx */
import {mdx} from '@mdx-js/preact';
${compiledMDX}`,
        },
        data: mdxExports,
      });

      return mdxExports;
    })
  );
};
