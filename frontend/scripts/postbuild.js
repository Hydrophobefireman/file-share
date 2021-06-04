const {
  readdirSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  existsSync,
} = require("fs");
const { join } = require("path");

const currPath = __dirname;
const outputDir = join(currPath, "..", "docs");
const BUILD_STATIC = join(currPath, "..", "build_static/");

function copyFolderSync(from, to) {
  if (!existsSync(to)) {
    mkdirSync(to);
  }
  console.log("Copying ", from, "to", to);
  readdirSync(from).forEach((element) => {
    if (lstatSync(join(from, element)).isFile()) {
      copyFileSync(join(from, element), join(to, element));
    } else {
      copyFolderSync(join(from, element), join(to, element));
    }
  });
}

copyFolderSync(BUILD_STATIC, outputDir);
