import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Excluded directories for performance and security
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', 'dist', '.cache', '.tsbuildinfo']);
const EXCLUDED_FILES = new Set(['.DS_Store', 'tsconfig.tsbuildinfo']);

// Get absolute workspace root path
const WORKSPACE_ROOT = process.cwd();

// Helper to check and resolve path safely to prevent directory traversal
function safeResolve(relativeSubPath: string): string {
  // Normalize path and remove leading/trailing slashes
  const cleanSubPath = path.normalize(relativeSubPath).replace(/^(\.\.(\/|\\))+/, '');
  const absolutePath = path.join(WORKSPACE_ROOT, cleanSubPath);
  
  if (!absolutePath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Directory traversal attempt detected');
  }
  return absolutePath;
}

// Recursively build tree of files
interface FileNode {
  name: string;
  path: string; // Relative to WORKSPACE_ROOT
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modifiedTime?: number;
}

function scanDirectory(dirPath: string, relativeRoot = ''): FileNode[] {
  const nodes: FileNode[] = [];
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (EXCLUDED_DIRS.has(item) || EXCLUDED_FILES.has(item)) {
        continue;
      }
      
      const absoluteItemPath = path.join(dirPath, item);
      const relativeItemPath = relativeRoot ? `${relativeRoot}/${item}` : item;
      let stat: fs.Stats;
      try {
        stat = fs.statSync(absoluteItemPath);
      } catch {
        continue; // Skip inaccessible files
      }

      if (stat.isDirectory()) {
        nodes.push({
          name: item,
          path: relativeItemPath,
          type: 'directory',
          children: scanDirectory(absoluteItemPath, relativeItemPath),
          modifiedTime: stat.mtimeMs,
        });
      } else {
        nodes.push({
          name: item,
          path: relativeItemPath,
          type: 'file',
          size: stat.size,
          modifiedTime: stat.mtimeMs,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  // Sort: directories first, then files alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    const filePathParam = url.searchParams.get('path') || '';

    if (action === 'read') {
      if (!filePathParam) {
        return NextResponse.json({ error: 'Path is required to read file' }, { status: 400 });
      }
      const absolutePath = safeResolve(filePathParam);
      if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const content = fs.readFileSync(absolutePath, 'utf-8');
      return NextResponse.json({ path: filePathParam, content });
    }

    // Default: List entire workspace (excluding hidden/heavy folders)
    const tree = scanDirectory(WORKSPACE_ROOT);
    return NextResponse.json({
      root: WORKSPACE_ROOT,
      tree,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path: targetPath, type, content = '' } = body;

    if (action === 'create') {
      if (!targetPath) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
      }
      const absolutePath = safeResolve(targetPath);
      
      if (fs.existsSync(absolutePath)) {
        return NextResponse.json({ error: 'Path already exists' }, { status: 400 });
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(absolutePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (type === 'directory') {
        fs.mkdirSync(absolutePath, { recursive: true });
      } else {
        fs.writeFileSync(absolutePath, content, 'utf-8');
      }

      return NextResponse.json({ success: true, path: targetPath });
    }

    if (action === 'duplicate') {
      const { source, destination } = body;
      if (!source || !destination) {
        return NextResponse.json({ error: 'Source and destination paths are required' }, { status: 400 });
      }
      const absoluteSource = safeResolve(source);
      const absoluteDest = safeResolve(destination);

      if (!fs.existsSync(absoluteSource)) {
        return NextResponse.json({ error: 'Source path does not exist' }, { status: 404 });
      }
      if (fs.existsSync(absoluteDest)) {
        return NextResponse.json({ error: 'Destination path already exists' }, { status: 400 });
      }

      // Ensure target parent directory exists
      const parentDir = path.dirname(absoluteDest);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.cpSync(absoluteSource, absoluteDest, { recursive: true });
      return NextResponse.json({ success: true, source, destination });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path: targetPath, content, oldPath, newPath } = body;

    if (action === 'write') {
      if (!targetPath) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
      }
      const absolutePath = safeResolve(targetPath);
      fs.writeFileSync(absolutePath, content || '', 'utf-8');
      return NextResponse.json({ success: true, path: targetPath });
    }

    if (action === 'rename' || action === 'move') {
      if (!oldPath || !newPath) {
        return NextResponse.json({ error: 'Old path and new path are required' }, { status: 400 });
      }
      const absoluteOld = safeResolve(oldPath);
      const absoluteNew = safeResolve(newPath);

      if (!fs.existsSync(absoluteOld)) {
        return NextResponse.json({ error: 'Source does not exist' }, { status: 404 });
      }
      if (fs.existsSync(absoluteNew)) {
        return NextResponse.json({ error: 'Target path already exists' }, { status: 400 });
      }

      // Ensure parent directory of target path exists
      const parentDir = path.dirname(absoluteNew);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.renameSync(absoluteOld, absoluteNew);
      return NextResponse.json({ success: true, oldPath, newPath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path: targetPath } = body;

    if (action === 'delete') {
      if (!targetPath) {
        return NextResponse.json({ error: 'Path is required to delete' }, { status: 400 });
      }
      const absolutePath = safeResolve(targetPath);
      if (!fs.existsSync(absolutePath)) {
        return NextResponse.json({ error: 'Path not found' }, { status: 404 });
      }

      fs.rmSync(absolutePath, { recursive: true, force: true });
      return NextResponse.json({ success: true, path: targetPath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
