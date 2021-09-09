const fs = require("fs");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const md2json = require("md-2-json");
const {
  getUnreleased,
  buildValuesFromRaw,
  mergeUnreleased,
  replaceUnreleasedText,
} = require("./utils");

const argv = yargs(hideBin(process.argv)).argv;

const config = {
  currentChangelog:
    process.env.SOURCE_CHANGELOG || argv.source || "CHANGELOG.md",
  destinationChangelog:
    process.env.DESTINATION_CHANGELOG ||
    argv.destination ||
    "CHANGELOG.md.remote",
  outputFile: process.env.OUTPUT_FILE || argv.output || null,
  title: process.env.CHANGELOG_TITLE || argv.title || "Changelog",
};

(async () => {
  try {
    const srcContent = await fs.promises.readFile(
      config.currentChangelog,
      "utf-8"
    );
    const srcJson = await md2json.parse(srcContent);
    const srcUnreleasedRaw = getUnreleased(srcJson, config.title);
    const srcUnreleased = buildValuesFromRaw(srcUnreleasedRaw);

    const destContent = await fs.promises.readFile(
      config.currentChangelog,
      "utf-8"
    );
    const destJson = await md2json.parse(destContent);
    const destUnreleasedRaw = getUnreleased(destJson, config.title);
    const destUnreleased = buildValuesFromRaw(destUnreleasedRaw);

    const merged = mergeUnreleased(srcUnreleased, destUnreleased);

    const replacedDestinationContents = replaceUnreleasedText(
      destContent,
      merged
    );

    if (config.outputFile) {
      await fs.promises.writeFile(
        config.outputFile,
        replacedDestinationContents
      );
    } else {
      process.stdout.write(replacedDestinationContents);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
