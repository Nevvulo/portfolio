import { Projects } from "../constants/projects";
import getFile from "../modules/getFile";

const URL = "https://nevulo.xyz";

function generateSiteMap(posts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${URL}/</loc>
     </url>
     <url>
       <loc>${URL}/about</loc>
     </url>
     <url>
       <loc>${URL}/contact</loc>
     </url>
     <url>
       <loc>${URL}/projects</loc>
     </url>
     <url>
       <loc>${URL}/blog</loc>
     </url>
     ${posts
       .map(({ slug }) => {
         return `
       <url>
           <loc>${`${URL}/blog/${slug}`}</loc>
       </url>
     `;
       })
       .join("")}
       ${Projects.map(({ projectId }) => {
         return `
        <url>
            <loc>${`${URL}/projects/${projectId}`}</loc>
        </url>
      `;
       }).join("")}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  // We make an API call to gather the URLs for our site
  const posts = await getFile("blogmap.json");

  // We generate the XML sitemap with the posts data
  const sitemap = generateSiteMap(posts);

  res.setHeader("Content-Type", "text/xml");
  // we send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
