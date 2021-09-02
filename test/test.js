const fs = require("fs");
const assert = require("assert");
const {
  getUnreleased,
  getChangeListFromString,
  mergeUnreleased,
  replaceUnreleasedText,
  cleanChangeEntryString,
} = require("../utils");

describe("Utils", () => {
  describe("test string replacement", () => {
    it("should add when unreleased is empty", () => {
      let changelogContents = "";
      let expectedChangelogContents = "";
      const merged = {
        Added: ["- One"],
        Changed: ["- Two", "- Three"],
        Removed: ["- Four", "- Five", "- Six"],
      };
      return fs.promises
        .readFile("test/sample/CHANGELOG_EMPTY.md", "utf-8")
        .then((content) => {
          changelogContents = content;
          return fs.promises.readFile(
            "test/expected/CHANGELOG_EMPTY.md",
            "utf-8"
          );
        })
        .then((content) => {
          expectedChangelogContents = content;
          const output = replaceUnreleasedText(changelogContents, merged);
          assert.strictEqual(output, expectedChangelogContents);
        });
    });
    it("should merge when unreleased already exists", () => {
      let changelogContents = "";
      const merged = {
        Fixed: ["- Added from Local"],
        Changed: [
          "- Feature X is not Feature Z",
          "- Feature P controls Feature Q",
          "- Feature A is not equal to Feature C",
        ],
        Added: [
          "- Test 1",
          "- Test 2",
          "- Test 3",
          "- Added after Local branched",
        ],
      };
      return fs.promises
        .readFile("test/sample/CHANGELOG_FULL.md", "utf-8")
        .then((content) => {
          changelogContents = content;
          return fs.promises.readFile(
            "test/expected/CHANGELOG_MERGED.md",
            "utf-8"
          );
        })
        .then((expectedChangelogContents) => {
          const output = replaceUnreleasedText(changelogContents, merged);
          console.log(output);
          assert.strictEqual(output, expectedChangelogContents);
        });
    });
  });
  describe("test diffing Unreleased sections", () => {
    it("should merge unreleased when not all keys exist in one another", () => {
      const unreleasedOnMainBranch = {
        Changed: [
          "- Feature R existed at branch init",
          "- Feature S was added after branching and already merged",
        ],
        Added: ["- Test 1", "- Test 2", "- Test 3"],
      };
      const unreleasedFeatureBranch = {
        Fixed: ["- Fixed the ABC bug preventing login."],
        Changed: [
          "- Feature R existed at branch init",
          "- Feature T was added in the feature branch",
        ],
        Added: [
          "- Test 1",
          "- Test 2",
          "- Test 3",
          "- Test 4 added in local branch",
        ],
      };
      const merged = mergeUnreleased(
        unreleasedFeatureBranch,
        unreleasedOnMainBranch
      );
      const expected = {
        Added: [
          "- Test 1",
          "- Test 2",
          "- Test 3",
          "- Test 4 added in local branch",
        ],
        Changed: [
          "- Feature R existed at branch init",
          "- Feature S was added after branching and already merged",
          "- Feature T was added in the feature branch",
        ],
        Fixed: ["- Fixed the ABC bug preventing login."],
      };
      assert.deepStrictEqual(merged, expected);
    });
    it("should merge unreleased when not all keys exist in one another", () => {
      const unreleasedFeatureBranch = {
        Added: ["- Feature 1 - branch created right after merge from main"],
      };
      const unreleasedOnMainBranch = {
        Added: ["- Test 1", "- Test 2", "- Test 3"],
        Changed: [
          "- Feature X came from an earlier merged feature",
          "- Feature Y came from an earlier merged feature",
        ],
        Removed: [" - Feature Z removed"],
      };
      const merged = mergeUnreleased(
        unreleasedFeatureBranch,
        unreleasedOnMainBranch
      );
      const expected = {
        Added: [
          "- Test 1",
          "- Test 2",
          "- Test 3",
          "- Feature 1 - branch created right after merge from main",
        ],
        Changed: [
          "- Feature X came from an earlier merged feature",
          "- Feature Y came from an earlier merged feature",
        ],
        Removed: [" - Feature Z removed"],
      };
      assert.deepStrictEqual(merged, expected);
    });
    it("should merge even in destination empty", () => {
      const unreleasedOnMainBranch = {};
      const unreleasedFeatureBranch = {
        Fixed: ["- Fixed the ABC bug preventing login."],
        Changed: [
          "- Feature R existed at branch init",
          "- Feature T was added in the feature branch",
        ],
        Added: [
          "- Test 1",
          "- Test 2",
          "- Test 3",
          "- Test 4 added in local branch",
        ],
      };
      const merged = mergeUnreleased(
        unreleasedFeatureBranch,
        unreleasedOnMainBranch
      );
      assert.deepStrictEqual(merged, unreleasedFeatureBranch);
    });
    it("should properly order Unreleased keys alphabetically", () => {});
  });
  describe("test reading raw change data", () => {
    it("should build array from markdown list", () => {
      const rawString = "- One\n- Two\n- Three\n";
      assert.deepStrictEqual(getChangeListFromString(rawString), [
        "- One",
        "- Two",
        "- Three",
      ]);
    });
    it("should build array from markdown list with extra line breaks", () => {
      const rawString = "\n- One\n\n- Two\n- Three\n\n";
      assert.deepStrictEqual(getChangeListFromString(rawString), [
        "- One",
        "- Two",
        "- Three",
      ]);
    });
  });
  describe("test parsing change list entry", () => {
    it("should format string leading spaces", () => {
      const rawString = " - The brown fox";
      assert.strictEqual(cleanChangeEntryString(rawString), "- The brown fox");
    });
    it("should format string extra spaces", () => {
      const rawString = "  -    The brown fox";
      assert.strictEqual(cleanChangeEntryString(rawString), "- The brown fox");
    });
    it("should format string with tabs", () => {
      const rawString = "\t-The brown fox";
      assert.strictEqual(cleanChangeEntryString(rawString), "- The brown fox");
    });
    it("should format string with no spacing", () => {
      const rawString = "-The brown fox";
      assert.strictEqual(cleanChangeEntryString(rawString), "- The brown fox");
    });
  });
  describe("Parse Unreleased section", () => {
    it("should be able to locate unreleased section", () => {
      const changelogJson = {
        Changelog: {
          raw: "All notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n",
          "[Unreleased]": {
            Fixed: {
              raw: "- Added from Local\n\n",
            },
            Changed: {
              raw: "- Feature X is not Feature Z\n- Feature P controls Feature Q\n\n",
            },
            Added: {
              raw: "- Test 1\n- Test 2\n- Test 3\n\n",
            },
          },
          "[1.0.0] - 2017-06-20": {
            Added: {
              raw: '- New visual identity by [@tylerfortune8](https://github.com/tylerfortune8).\n- Version navigation.\n- Links to latest released version in previous versions.\n- "Why keep a changelog?" section.\n- "Who needs a changelog?" section.\n- "How do I make a changelog?" section.\n- "Frequently Asked Questions" section.\n- New "Guiding Principles" sub-section to "How do I make a changelog?".\n- Simplified and Traditional Chinese translations from [@tianshuo](https://github.com/tianshuo).\n- German translation from [@mpbzh](https://github.com/mpbzh) & [@Art4](https://github.com/Art4).\n- Italian translation from [@azkidenz](https://github.com/azkidenz).\n- Swedish translation from [@magol](https://github.com/magol).\n- Turkish translation from [@karalamalar](https://github.com/karalamalar).\n- French translation from [@zapashcanon](https://github.com/zapashcanon).\n- Brazilian Portugese translation from [@Webysther](https://github.com/Webysther).\n- Polish translation from [@amielucha](https://github.com/amielucha) & [@m-aciek](https://github.com/m-aciek).\n- Russian translation from [@aishek](https://github.com/aishek).\n- Czech translation from [@h4vry](https://github.com/h4vry).\n- Slovak translation from [@jkostolansky](https://github.com/jkostolansky).\n- Korean translation from [@pierceh89](https://github.com/pierceh89).\n- Croatian translation from [@porx](https://github.com/porx).\n- Persian translation from [@Hameds](https://github.com/Hameds).\n- Ukrainian translation from [@osadchyi-s](https://github.com/osadchyi-s).\n\n',
            },
            Changed: {
              raw: '- Start using "changelog" over "change log" since it\'s the common usage.\n- Start versioning based on the current English version at 0.3.0 to help\n  translation authors keep things up-to-date.\n- Rewrite "What makes unicorns cry?" section.\n- Rewrite "Ignoring Deprecations" sub-section to clarify the ideal\n  scenario.\n- Improve "Commit log diffs" sub-section to further argument against\n  them.\n- Merge "Why can’t people just use a git log diff?" with "Commit log\n  diffs"\n- Fix typos in Simplified Chinese and Traditional Chinese translations.\n- Fix typos in Brazilian Portuguese translation.\n- Fix typos in Turkish translation.\n- Fix typos in Czech translation.\n- Fix typos in Swedish translation.\n- Improve phrasing in French translation.\n- Fix phrasing and spelling in German translation.\n\n',
            },
            Removed: {
              raw: '- Section about "changelog" vs "CHANGELOG".\n\n',
            },
          },
          "[0.0.1] - 2014-05-31": {
            Added: {
              raw: '- This CHANGELOG file to hopefully serve as an evolving example of a\n  standardized open source project CHANGELOG.\n- CNAME file to enable GitHub Pages custom domain\n- README now contains answers to common questions about CHANGELOGs\n- Good examples and basic guidelines, including proper date formatting.\n- Counter-examples: "What makes unicorns cry?"\n\n',
            },
          },
        },
      };
      assert.deepStrictEqual(getUnreleased(changelogJson, "Changelog"), {
        Fixed: {
          raw: "- Added from Local\n\n",
        },
        Changed: {
          raw: "- Feature X is not Feature Z\n- Feature P controls Feature Q\n\n",
        },
        Added: {
          raw: "- Test 1\n- Test 2\n- Test 3\n\n",
        },
      });
    });
    it("should throw error - cannot locate unreleased section", () => {
      const missingReleasedJson = {
        Changelog: {
          raw: "All notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n",
          "[1.0.0] - 2017-06-20": {
            Added: {
              raw: '- New visual identity by [@tylerfortune8](https://github.com/tylerfortune8).\n- Version navigation.\n- Links to latest released version in previous versions.\n- "Why keep a changelog?" section.\n- "Who needs a changelog?" section.\n- "How do I make a changelog?" section.\n- "Frequently Asked Questions" section.\n- New "Guiding Principles" sub-section to "How do I make a changelog?".\n- Simplified and Traditional Chinese translations from [@tianshuo](https://github.com/tianshuo).\n- German translation from [@mpbzh](https://github.com/mpbzh) & [@Art4](https://github.com/Art4).\n- Italian translation from [@azkidenz](https://github.com/azkidenz).\n- Swedish translation from [@magol](https://github.com/magol).\n- Turkish translation from [@karalamalar](https://github.com/karalamalar).\n- French translation from [@zapashcanon](https://github.com/zapashcanon).\n- Brazilian Portugese translation from [@Webysther](https://github.com/Webysther).\n- Polish translation from [@amielucha](https://github.com/amielucha) & [@m-aciek](https://github.com/m-aciek).\n- Russian translation from [@aishek](https://github.com/aishek).\n- Czech translation from [@h4vry](https://github.com/h4vry).\n- Slovak translation from [@jkostolansky](https://github.com/jkostolansky).\n- Korean translation from [@pierceh89](https://github.com/pierceh89).\n- Croatian translation from [@porx](https://github.com/porx).\n- Persian translation from [@Hameds](https://github.com/Hameds).\n- Ukrainian translation from [@osadchyi-s](https://github.com/osadchyi-s).\n\n',
            },
            Changed: {
              raw: '- Start using "changelog" over "change log" since it\'s the common usage.\n- Start versioning based on the current English version at 0.3.0 to help\n  translation authors keep things up-to-date.\n- Rewrite "What makes unicorns cry?" section.\n- Rewrite "Ignoring Deprecations" sub-section to clarify the ideal\n  scenario.\n- Improve "Commit log diffs" sub-section to further argument against\n  them.\n- Merge "Why can’t people just use a git log diff?" with "Commit log\n  diffs"\n- Fix typos in Simplified Chinese and Traditional Chinese translations.\n- Fix typos in Brazilian Portuguese translation.\n- Fix typos in Turkish translation.\n- Fix typos in Czech translation.\n- Fix typos in Swedish translation.\n- Improve phrasing in French translation.\n- Fix phrasing and spelling in German translation.\n\n',
            },
            Removed: {
              raw: '- Section about "changelog" vs "CHANGELOG".\n\n',
            },
          },
          "[0.0.1] - 2014-05-31": {
            Added: {
              raw: '- This CHANGELOG file to hopefully serve as an evolving example of a\n  standardized open source project CHANGELOG.\n- CNAME file to enable GitHub Pages custom domain\n- README now contains answers to common questions about CHANGELOGs\n- Good examples and basic guidelines, including proper date formatting.\n- Counter-examples: "What makes unicorns cry?"\n\n',
            },
          },
        },
      };
      assert.throws(() => {
        getUnreleased(missingReleasedJson, "Changelog");
      });
    });
  });
});
