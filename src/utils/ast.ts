import { readFile, writeFile } from 'fs/promises';

type ModuleArrayType = 'controller' | 'provider' | 'import';

const ARRAY_NAME: Record<ModuleArrayType, string> = {
  controller: 'controllers',
  provider: 'providers',
  import: 'imports',
};

export async function addDeclarationToModule(
  modulePath: string,
  className: string,
  importPath: string,
  type: ModuleArrayType,
): Promise<void> {
  let content = await readFile(modulePath, 'utf8');

  // 1. Add import statement at the end of existing imports
  const importStatement = `import { ${className} } from '${importPath}';\n`;

  const importMatches = Array.from(content.matchAll(/^import.*from.*$/gm));
  if (importMatches.length > 0) {
    const lastMatch = importMatches[importMatches.length - 1];
    const insertPos = (lastMatch.index || 0) + lastMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
    // Collapse triple-or-more blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
  } else {
    content = importStatement + '\n' + content;
  }

  // 2. Identify the @Module array to modify
  const arrayName = ARRAY_NAME[type];

  // 3. Append to existing array, or inject a new one
  const arrayRegex = new RegExp(`(${arrayName}\\s*:\\s*\\[)([^\\]]*)(\\])`);
  if (arrayRegex.test(content)) {
    content = content.replace(arrayRegex, (match, prefix, items, suffix) => {
      if (items.includes(className)) return match; // already present

      const trimmedItems = items.trim();
      if (trimmedItems.length === 0) {
        return `${prefix}${className}${suffix}`;
      } else if (trimmedItems.endsWith(',')) {
        return `${prefix}${items} ${className},${suffix}`;
      } else {
        return `${prefix}${items}, ${className}${suffix}`;
      }
    });
  } else {
    // Array missing from @Module decorator — inject it
    const moduleDecoratorRegex = /@Module\s*\(\s*\{/;
    if (moduleDecoratorRegex.test(content)) {
      content = content.replace(
        moduleDecoratorRegex,
        `@Module({\n  ${arrayName}: [${className}],`,
      );
    }
  }

  await writeFile(modulePath, content, 'utf8');
}
