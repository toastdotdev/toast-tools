import { sourceMdx } from "@toastdotdev/mdx";

export const sourceData = async ({ setDataForSlug }) => {
  let allMdx = await sourceMdx({
    setDataForSlug,
    directory: "./content",
    slugPrefix: "/posts",
  });

  await setDataForSlug("/", {
    data: { posts: allMdx },
  });
  return;
};
