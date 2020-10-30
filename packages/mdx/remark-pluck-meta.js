import json5 from "json5";
import visit from "unist-util-visit";

// a remark plugin that plucks MDX exports and parses then with json5
export default function remarkPluckMeta({ exportNames }) {
  return (tree, file) => {
    file.data.exports = {};
    exportNames.forEach((exportName) => {
      const re = new RegExp(`^export const ${exportName} = `);
      visit(tree, "export", (ast) => {
        if (ast.value.startsWith(`export const ${exportName} = `)) {
          const obj = ast.value.replace(re, "").replace(/;\s*$/, "");
          file.data.exports[exportName] = json5.parse(obj);
        }
      });
    });
    return tree;
  };
}
