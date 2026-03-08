import { readFile, writeFile } from 'fs/promises';

export async function addDeclarationToModule(
  modulePath: string,
  className: string,
  importPath: string,
  type: 'controller' | 'provider'
): Promise<void> {
  let content = await readFile(modulePath, 'utf8');

  // 1. Add import statement
  const importStatement = `import { ${className} } from '${importPath}';\n`;
  
  // Find the last import
  const importMatches = Array.from(content.matchAll(/^import.*from.*$/gm));
  if (importMatches.length > 0) {
    const lastMatch = importMatches[importMatches.length - 1];
    const insertPos = (lastMatch.index || 0) + lastMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
    // remove double blank lines that might occur
    content = content.replace(/\n\n\n/g, '\n\n');
  } else {
    // No imports, add to top
    content = importStatement + '\n' + content;
  }

  // 2. Identify array name
  const arrayName = type === 'controller' ? 'controllers' : 'providers';

  // 3. Find if array exists
  const arrayRegex = new RegExp(`(${arrayName}\\s*:\\s*\\[)([^\\]]*)(\\])`);
  if (arrayRegex.test(content)) {
    // Array exists, append to it
    content = content.replace(arrayRegex, (match, prefix, items, suffix) => {
      // Check if it's already there
      if (items.includes(className)) return match;
      
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
    // Array does not exist, inject it into @Module({
    const moduleDecoratorRegex = /@Module\s*\(\s*\{/;
    if (moduleDecoratorRegex.test(content)) {
      content = content.replace(
        moduleDecoratorRegex,
        `@Module({\n  ${arrayName}: [${className}],`
      );
    }
  }

  await writeFile(modulePath, content, 'utf8');
}
