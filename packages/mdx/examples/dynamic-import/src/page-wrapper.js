import { h } from "preact";
import { MDXProvider } from "@mdx-js/preact";
import { Helmet } from "react-helmet";
import Thing from "../src/components/a-thing.js";

const components = {
  wrapper: (props) => <div style={{ padding: "1rem" }} {...props} />,
  h1: (props) => <h1 {...props} style={{ display: "flex" }} />,
  codeblock: ({ children, ...props }) => (
    <div
      dangerouslySetInnerHTML={{ __html: children }}
      {...props}
      style={{ background: "black", padding: "1rem" }}
    />
  ),
  "heading-link-icon": (props) => (
    <svg
      width="20px"
      height="20px"
      //   {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Something: Thing,
};
export default (props) => {
  return (
    <MDXProvider components={components}>
      <Helmet>
        <link
          href="https://unpkg.com/tailwindcss@1.9.2/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Helmet>
      <div>{props.children}</div>
    </MDXProvider>
  );
};
