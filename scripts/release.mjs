import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const repoRoot = process.cwd();
const packagesDir = path.join(repoRoot, "packages");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getPackages() {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(packagesDir, entry.name);
      const packageJsonPath = path.join(dir, "package.json");
      const packageJson = readJson(packageJsonPath);
      return {
        dir,
        packageJsonPath,
        packageJson,
        name: packageJson.name,
        version: packageJson.version,
      };
    })
    .filter((pkg) => !pkg.packageJson.private);
}

function bumpVersion(version, releaseType) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (releaseType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unsupported release type: ${releaseType}`);
  }
}

function validateVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function updatePackageVersions(packages, nextVersion) {
  for (const pkg of packages) {
    const nextPackageJson = {
      ...pkg.packageJson,
      version: nextVersion,
    };
    writeJson(pkg.packageJsonPath, nextPackageJson);
  }
}

async function main() {
  const packages = getPackages();

  if (packages.length === 0) {
    throw new Error("No publishable packages found in ./packages");
  }

  const currentVersions = [...new Set(packages.map((pkg) => pkg.version))];
  if (currentVersions.length !== 1) {
    throw new Error(
      `Expected a unified version across packages, found: ${currentVersions.join(", ")}`
    );
  }

  const currentVersion = currentVersions[0];
  const rl = createInterface({ input, output });

  try {
    output.write(`Current version: ${currentVersion}\n`);
    output.write("Select release type:\n");
    output.write("1. patch\n");
    output.write("2. minor\n");
    output.write("3. major\n");
    output.write("4. custom\n");

    const choice = (await rl.question("Enter choice [1-4]: ")).trim();

    let nextVersion;
    if (choice === "1") {
      nextVersion = bumpVersion(currentVersion, "patch");
    } else if (choice === "2") {
      nextVersion = bumpVersion(currentVersion, "minor");
    } else if (choice === "3") {
      nextVersion = bumpVersion(currentVersion, "major");
    } else if (choice === "4") {
      const customVersion = (await rl.question("Enter custom version (x.y.z): ")).trim();
      if (!validateVersion(customVersion)) {
        throw new Error(`Invalid custom version: ${customVersion}`);
      }
      nextVersion = customVersion;
    } else {
      throw new Error(`Invalid choice: ${choice}`);
    }

    output.write(`\nPackages to publish (${packages.length}):\n`);
    for (const pkg of packages) {
      output.write(`- ${pkg.name}: ${pkg.version} -> ${nextVersion}\n`);
    }

    const shouldContinue = (
      await rl.question("\nContinue with version update, build, and publish? [y/N]: ")
    )
      .trim()
      .toLowerCase();

    if (shouldContinue !== "y" && shouldContinue !== "yes") {
      output.write("Cancelled.\n");
      return;
    }

    updatePackageVersions(packages, nextVersion);

    output.write("\nBuilding packages...\n");
    run("pnpm", ["-r", "--filter", "./packages/*", "build"]);

    output.write("\nPublishing packages to npm...\n");
    run("pnpm", ["-r", "--filter", "./packages/*", "publish", "--access", "public", "--no-git-checks"]);

    output.write(`\nPublished ${packages.length} packages at version ${nextVersion}.\n`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`\nRelease failed: ${error.message}`);
  process.exitCode = 1;
});
