const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { globalThis: {}, document: {} };
context.globalThis = context;
vm.runInNewContext(fs.readFileSync("src/core/config.js", "utf8"), context);
context.TagAll.dom = { findConversationHeader: () => null };
vm.runInNewContext(fs.readFileSync("src/core/participants.js", "utf8"), context);

assert.deepEqual([...context.TagAll.participants.splitCandidates("Ada, Lin, You")], ["Ada", "Lin"]);
assert.deepEqual([...context.TagAll.participants.splitCandidates("张三，李四、王五")], ["张三", "李四", "王五"]);
assert.deepEqual([...context.TagAll.participants.splitCandidates("Ada is typing, Lin")], []);
console.log("Participant parsing tests passed.");
