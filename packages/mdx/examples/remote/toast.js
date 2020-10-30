import { sourceMdx } from "@toastdotdev/mdx";

export const sourceData = async ({ setDataForSlug }) => {
  let allMdx = await sourceMdx({
    setDataForSlug,
    sources: [
      {
        id: "dynamodb://0ujsswThIGTUYm2K8FjOOfXtY1K",
        source: `export const meta = {
        slug: '/somewhere'
      }

# hi

sdfg
sdfg
sdf
gsd
fg
sfdg
 
some content`,
      },
    ],
    slugPrefix: "/posts",
  });

  await setDataForSlug("/", {
    data: { posts: allMdx },
  });
  return;
};
