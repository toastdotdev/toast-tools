import visit from "unist-util-visit";

// a remark plugin that plucks MDX exports and converts
// the raw estree representation of exports to JSON as much
// as possible
export default function remarkPluckMeta(
  { exportNames = [] } = { exportNames: [] }
) {
  return (tree, file) => {
    file.data.exports = {};

    visit(tree, "mdxjsEsm", (ast) => {
      const exportNodes = ast?.data?.estree?.body
        .filter((child) => child.type === "ExportNamedDeclaration")
        .forEach((exportDecl) => {
          // declarations is technically an array because you
          // can do things like `let x,y,z;` but that really
          // doesn't apply for this use case
          const decl = exportDecl.declaration.declarations[0];
          // if we should handle this
          if (exportNames.includes(decl.id.name)) {
            file.data.exports[decl.id.name] = handleDecl(
              decl.init,
              decl.id.name
            );
          }
        });
    });

    return tree;
  };
}

function handleDecl(decl, parent) {
  // handle value
  let pluckedValue;
  switch (decl.type) {
    case "Literal":
      pluckedValue = decl.value;
      break;
    case "ObjectExpression":
      const fields = Object.fromEntries(
        decl.properties.map(({ key, value, kind }) => {
          // kind can be "init", "get", or "set"
          if (kind === "init") {
            // handle key name
            let keyName;
            switch (key.type) {
              case "Identifier":
                keyName = key.name;
                break;
              case "Literal":
                keyName = key.value;
                break;
              default:
                console.warn(
                  `toast-tools/mdx: Unhandleable property type ${key.type} in ${parent}. If you think this should be handled, please file a bug.`
                );
            }
            return [keyName, handleDecl(value, `${parent}.${keyName}`)];
          } else {
            console.warn(
              `toast-tools.rehype-pluck-meta is not going to handle object property with kind \`${kind}\` on export ${parent}`
            );
          }
        })
      );
      pluckedValue = fields;
      break;
    case "ArrayExpression":
      pluckedValue = decl.elements.map((elementDecl, i) =>
        handleDecl(elementDecl, `parent[${i}]`)
      );
      break;
    case "TemplateLiteral":
      if (decl.expressions.length !== 0) {
        console.warn(
          `[skipping] @toast-tools/mdx: Template Literals with expressions are not handled. at ${parent}`
        );
        break;
      }
      // TODO: should we remove newlines from this?
      pluckedValue = decl.quasis[0].value.raw;
      break;
    default:
      console.warn(
        `Unhandleable value type ${decl.type} in ${parent}. If you think this should be handled, please file a bug.`
      );
  }

  return pluckedValue;
}
