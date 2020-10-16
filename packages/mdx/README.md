# @toastdotdev/mdx

A toast package that sources, and optionally creates pages for, MDX files

## Get Started

```shell
npm i @toastdotdev/mdx
```

Then in your `toast.js` use it:

```js
import { sourceMdx } from "@toastdotdev/mdx";

export const sourceData = async ({ setDataForSlug }) => {
  await sourceMdx({
    setDataForSlug,
    directory: "./content",
    slugPrefix: "/posts",
  });
  return;
};
```
