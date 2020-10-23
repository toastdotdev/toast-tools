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

or take a more manual approach and compile the mdx yourself

```js
import { fetchMdxFromDisk } from "@toastdotdev/mdx";

export const sourceData = async ({ setDataForSlug }) => {
  const files = await fetchMdxFromDisk({directory: "./content});
  // do stuff
  return
}
```
