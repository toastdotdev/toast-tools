import renderToString from "preact-render-to-string";
import { h } from "preact";
import Highlight from "prism-react-renderer";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";
import prismComponents from "prismjs/components.js";
import visit from "unist-util-visit";
import rangeParser from "parse-numeric-range";
import rehypeParse from 'rehype-parse';
import unified from 'unified';

try {
  // meta doesn't exist in the prismjs package and thus will *FAIL* because it's a FAILURE
  loadLanguages(
    Object.keys(prismComponents.languages).filter((v) => v !== "meta")
  );
} catch (e) {
  // this is here in case prismjs ever removes a language, so we can easily debug
  console.log(e);
}

const defaultPrismTheme = {
  plain: {
    color: "#d6deeb",
    backgroundColor: "#011627",
  },
  styles: [
    {
      types: ["changed"],
      style: {
        color: "rgb(162, 191, 252)",
        fontStyle: "italic",
      },
    },
    {
      types: ["deleted"],
      style: {
        color: "rgba(239, 83, 80, 0.56)",
        fontStyle: "italic",
      },
    },
    {
      types: ["inserted", "attr-name"],
      style: {
        color: "rgb(173, 219, 103)",
        fontStyle: "italic",
      },
    },
    {
      types: ["comment"],
      style: {
        color: "rgb(99, 119, 119)",
        fontStyle: "italic",
      },
    },
    {
      types: ["string", "url"],
      style: {
        color: "rgb(173, 219, 103)",
      },
    },
    {
      types: ["variable"],
      style: {
        color: "rgb(214, 222, 235)",
      },
    },
    {
      types: ["number"],
      style: {
        color: "rgb(247, 140, 108)",
      },
    },
    {
      types: ["builtin", "char", "constant", "function"],
      style: {
        color: "rgb(130, 170, 255)",
      },
    },
    {
      // This was manually added after the auto-generation
      // so that punctuations are not italicised
      types: ["punctuation"],
      style: {
        color: "rgb(199, 146, 234)",
      },
    },
    {
      types: ["selector", "doctype"],
      style: {
        color: "rgb(199, 146, 234)",
        fontStyle: "italic",
      },
    },
    {
      types: ["class-name"],
      style: {
        color: "rgb(255, 203, 139)",
      },
    },
    {
      types: ["tag", "operator", "keyword"],
      style: {
        color: "rgb(127, 219, 202)",
      },
    },
    {
      types: ["boolean"],
      style: {
        color: "rgb(255, 88, 116)",
      },
    },
    {
      types: ["property"],
      style: {
        color: "rgb(128, 203, 196)",
      },
    },
    {
      types: ["namespace"],
      style: {
        color: "rgb(178, 204, 214)",
      },
    },
  ],
};

const RE = /{([\d,-]+)}/;
const calculateLinesToHighlight = (meta) => {
  if (RE.test(meta)) {
    const strlineNumbers = RE.exec(meta)[1];
    const lineNumbers = rangeParser(strlineNumbers);
    // console.log(lineNumbers);
    return (index) => lineNumbers.includes(index + 1);
  } else {
    return () => false;
  }
};

export default function rehypePrismMdx(options) {
  return (ast) => {
    visit(ast, "element", (parentTree) => {
      if (
        parentTree.tagName === "pre" &&
        parentTree.children.length === 1 &&
        parentTree.children[0].tagName === "code"
      ) {
        let tree = parentTree.children[0];
        // store codestring for later
        tree.properties.codestring = tree.children[0].value.trim();
        const shouldHighlightLine = calculateLinesToHighlight(
          tree.properties.metastring
        );

        const lang =
          tree.properties.className &&
          tree.properties.className[0] &&
          tree.properties.className[0].split("-")[1];
        const highlightedCode = renderToString(
          h(
            Highlight.default,
            {
              ...Highlight.defaultProps,
              ...{
                code: tree.children[0].value.trim(),
                language: lang,
                theme: options?.theme || defaultPrismTheme,
                Prism,
              },
            },
            ({ className, style, tokens, getLineProps, getTokenProps }) =>
              h(
                "pre",
                {
                  className: className,
                  style: { ...style, "background-color": "transparent" },
                },
                tokens.map((line, i) =>
                  h(
                    "div",

                    getLineProps({
                      line,
                      key: i,
                      className: shouldHighlightLine(i)
                        ? "mdx-highlight-line"
                        : "",
                    }),

                    line.map((token, key) =>
                      h(
                        "span",
                        getTokenProps({
                          token,
                          key,
                        })
                      )
                    )
                  )
                )
              )
          )
        );
        // parse html string to HAST because unified breaks
        // all the time.
        const hastRoot = unified()
          .use(rehypeParse, {
            emitParseErrors: true,
            fragment: true
          })
          .parse(highlightedCode);
        // render code to string
        parentTree.tagName = "codeblock";
        parentTree.properties = tree.properties;
        parentTree.children = hastRoot.children;
      }
    });
  };
}
