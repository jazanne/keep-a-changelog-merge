exports.getUnreleased = (changelog, title) => {
  const unreleased = changelog[title]["[Unreleased]"];
  if (unreleased) {
    return unreleased;
  } else {
    throw new Error("Cannot find Unreleased section. Check Specification.");
  }
};

exports.getUniqueKeys = (x, y) => {
  const combined = Object.keys(x).concat(Object.keys(y));
  return combined.filter((x, y) => combined.indexOf(x) === y);
};

exports.appendNewValues = (originalValues, newValues) => {
  if (!originalValues) {
    return newValues;
  } else if (!newValues) {
    return originalValues;
  }
  const newValuesUnique = newValues.filter((x) => !originalValues.includes(x));
  return originalValues.concat(newValuesUnique);
};

exports.getChangeListFromString = (raw) => {
  return raw.split("\n").filter((x) => x !== "");
};

exports.cleanChangeEntryString = (raw) => {
  return raw
    .replace(new RegExp("^(.*-)", "i"), "- ")
    .replace(new RegExp("^(-\\s+)", "i"), "- ");
};

exports.buildValuesFromRaw = (json) => {
  let result = {};
  Object.keys(json).forEach((key) => {
    result[key] = this.getChangeListFromString(json[key]["raw"]).map(
      this.cleanChangeEntryString
    );
  });
  return result;
};

exports.mergeUnreleased = (srcUnreleased, destUnreleased) => {
  let merged = {};
  const unreleasedKeys = this.getUniqueKeys(srcUnreleased, destUnreleased);
  unreleasedKeys.forEach((key) => {
    merged[key] = this.appendNewValues(destUnreleased[key], srcUnreleased[key]);
  });
  return merged;
};

exports.replaceUnreleasedText = (changelogText, json) => {
  const insert =
    `## [Unreleased]\n\n` +
    Object.keys(json)
      .sort()
      .map((key) => {
        return `### ${key}\n` + json[key].join("\n");
      })
      .join("\n\n") +
    `\n\n## [`;
  const regex = new RegExp("^##\\s+\\[Unreleased\\].*?##\\s+\\[", "gims");
  return changelogText.replace(regex, insert);
};
