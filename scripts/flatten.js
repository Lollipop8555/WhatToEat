// 把 monster.json / oasis.json 的 {breakfast,lunch,dinner} 扁平化为单一数组
const fs = require("fs");

for (const f of ["monster", "oasis"]) {
  const d = JSON.parse(fs.readFileSync("foodData/" + f + ".json"));
  const a = [].concat(d.breakfast || [], d.lunch || [], d.dinner || []);
  fs.writeFileSync("foodData/" + f + ".json", JSON.stringify(a, null, 4) + "\n");
  console.log(f, a.length);
}
