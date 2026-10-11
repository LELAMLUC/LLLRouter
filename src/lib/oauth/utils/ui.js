import chalk from "chalk";

/**
 * UI Helper Functions
 */

export function success(message) {
  console.log(chalk.green(`\n✓ ${message}\n`));
}

export function error(message) {
  console.log(chalk.red(`\n✗ ${message}\n`));
}

export function info(message) {
  console.log(chalk.blue(`\n${message}\n`));
}

export function warn(message) {
  console.log(chalk.yellow(`\n⚠ ${message}\n`));
}

export function gray(message) {
  console.log(chalk.gray(message));
}

// Server-side replacement for the removed `ora` dependency: same call surface
// (start/stop/succeed/fail + .text) but plain console lines.
export function spinner(text) {
  let label = text || "";
  return {
    start(next) {
      if (typeof next === "string") label = next;
      console.log(chalk.gray(`  ${label}`));
      return this;
    },
    stop() {
      return this;
    },
    succeed(message) {
      console.log(chalk.green(`✓ ${message || label}`));
      return this;
    },
    fail(message) {
      console.log(chalk.red(`✗ ${message || label}`));
      return this;
    },
    get text() {
      return label;
    },
    set text(value) {
      label = value || "";
    },
  };
}

export function printSection(title) {
  console.log(chalk.blue(`\n${title}\n`));
}

export function printKeyValue(key, value, isSuccess = false) {
  const color = isSuccess ? chalk.green : chalk.gray;
  console.log(color(`  ${key}: ${value}`));
}

export function printList(items, isSuccess = false) {
  const symbol = isSuccess ? "✓" : "✗";
  const color = isSuccess ? chalk.green : chalk.gray;
  items.forEach((item) => {
    console.log(color(`  ${symbol} ${item}`));
  });
}

