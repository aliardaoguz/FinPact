import fs from 'fs';
import https from 'https';

const downloadAndEncode = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          const data = [];
          res2.on('data', (chunk) => data.push(chunk));
          res2.on('end', () => {
            resolve(Buffer.concat(data).toString('base64'));
          });
        }).on('error', reject);
        return;
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(data).toString('base64'));
      });
    }).on('error', reject);
  });
};

async function run() {
  console.log("Downloading fonts...");
  // Using jsDelivr to avoid CORS or 404s
  const regular = await downloadAndEncode("https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-regular-webfont.ttf");
  const bold = await downloadAndEncode("https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-bold-webfont.ttf");
  
  const js = `export const RobotoRegular = '${regular}';\nexport const RobotoBold = '${bold}';\n`;
  fs.writeFileSync('src/fonts.js', js);
  console.log("Fonts downloaded and saved to src/fonts.js successfully!");
}
run();
