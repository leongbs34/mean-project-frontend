import { writeFile, mkdir } from "fs";

const envPath = "src/environments";
const targetPath = `${envPath}/environment.prod.ts`;

const envConfigFile = `
  export const environment = {
    production: true,
    apiUrl: ${process.env.API_URL},
  };
`;

mkdir(envPath, { recursive: true }, (err) => {
  if (err) return console.log(err);
});

writeFile(targetPath, envConfigFile, "utf8", (err) => {
  if (err) {
    return console.log(err);
  }
});
