const fs = require("fs");
const path = require("path");
const swPath = path.join(__dirname, "../public/sw.js");
let content = fs.readFileSync(swPath, "utf8");
const version = Date.now().toString();
content = content.replace("BUILD_TIME_PLACEHOLDER", version);
fs.writeFileSync(swPath, content, "utf8");
console.log("SW version actualizada:", version);
