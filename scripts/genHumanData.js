// 扫描 howToCook/dishes，生成扁平化的 foodData/human.json
// 每个元素: { name, recipe }，recipe 为相对网站根目录的路径
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DISHES_DIR = path.join(ROOT, "howToCook", "dishes");
const OUT = path.join(ROOT, "foodData", "human.json");

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "template") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      if (entry.name.toLowerCase().startsWith("readme")) continue;
      results.push(full);
    }
  }
  return results;
}

function extractName(full) {
  const content = fs.readFileSync(full, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m) {
      return m[1].replace(/的做法$/, "").trim();
    }
  }
  return path.basename(full, ".md");
}

const files = walk(DISHES_DIR);
const data = files.map((full) => {
  const rel = path.relative(ROOT, full).split(path.sep).join("/");
  return { name: extractName(full), recipe: rel };
});

fs.writeFileSync(OUT, JSON.stringify(data, null, 4) + "\n", "utf8");
console.log(`Generated ${data.length} recipes -> ${OUT}`);
