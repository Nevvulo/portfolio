export default async function getFile(location: string, mode = "json") {
  return fetch(
    `https://raw.githubusercontent.com/Nevvulo/blog/main/${location}`
  ).then((res) => res[mode]());
}
