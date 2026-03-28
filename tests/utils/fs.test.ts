/**
 * Tests for filesystem utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  ensureDir,
  fileExists,
  readJsonFile,
  writeJsonFile,
  listFiles,
} from '../../lib/utils/fs';

const TEST_DIR = path.join(process.cwd(), 'data', 'test-fs');

beforeEach(async () => {
  // Clean up test directory before each test
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore if doesn't exist
  }
});

afterEach(async () => {
  // Clean up after each test
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

describe('ensureDir', () => {
  it('should create a directory', async () => {
    const dirPath = path.join(TEST_DIR, 'test-dir');
    
    await ensureDir(dirPath);
    
    const stats = await fs.stat(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  it('should create nested directories', async () => {
    const dirPath = path.join(TEST_DIR, 'a', 'b', 'c');
    
    await ensureDir(dirPath);
    
    const stats = await fs.stat(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });

  it('should not throw if directory already exists', async () => {
    const dirPath = path.join(TEST_DIR, 'existing');
    
    await ensureDir(dirPath);
    await ensureDir(dirPath); // Second call should not throw
    
    const stats = await fs.stat(dirPath);
    expect(stats.isDirectory()).toBe(true);
  });
});

describe('fileExists', () => {
  it('should return true for existing file', async () => {
    const filePath = path.join(TEST_DIR, 'test.txt');
    await ensureDir(TEST_DIR);
    await fs.writeFile(filePath, 'test');
    
    expect(await fileExists(filePath)).toBe(true);
  });

  it('should return false for non-existent file', async () => {
    const filePath = path.join(TEST_DIR, 'nonexistent.txt');
    
    expect(await fileExists(filePath)).toBe(false);
  });

  it('should return true for existing directory', async () => {
    await ensureDir(TEST_DIR);
    
    expect(await fileExists(TEST_DIR)).toBe(true);
  });
});

describe('JSON file operations', () => {
  it('should write and read JSON file', async () => {
    const filePath = path.join(TEST_DIR, 'data.json');
    const data = { name: 'test', count: 42, nested: { value: true } };
    
    await writeJsonFile(filePath, data);
    const read = await readJsonFile(filePath);
    
    expect(read).toEqual(data);
  });

  it('should create parent directories when writing JSON', async () => {
    const filePath = path.join(TEST_DIR, 'nested', 'deep', 'data.json');
    const data = { test: 'value' };
    
    await writeJsonFile(filePath, data);
    
    expect(await fileExists(filePath)).toBe(true);
    const read = await readJsonFile(filePath);
    expect(read).toEqual(data);
  });

  it('should format JSON with indentation', async () => {
    const filePath = path.join(TEST_DIR, 'formatted.json');
    const data = { key: 'value' };
    
    await writeJsonFile(filePath, data);
    
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('  "key"'); // 2-space indent
  });

  it('should handle arrays and primitives', async () => {
    const filePath = path.join(TEST_DIR, 'array.json');
    const data = [1, 2, 3, { nested: 'value' }];
    
    await writeJsonFile(filePath, data);
    const read = await readJsonFile(filePath);
    
    expect(read).toEqual(data);
  });
});

describe('listFiles', () => {
  it('should list all files in directory', async () => {
    await ensureDir(TEST_DIR);
    await fs.writeFile(path.join(TEST_DIR, 'file1.txt'), '');
    await fs.writeFile(path.join(TEST_DIR, 'file2.json'), '');
    await fs.writeFile(path.join(TEST_DIR, 'file3.md'), '');
    
    const files = await listFiles(TEST_DIR);
    
    expect(files.sort()).toEqual(['file1.txt', 'file2.json', 'file3.md'].sort());
  });

  it('should filter files by pattern', async () => {
    await ensureDir(TEST_DIR);
    await fs.writeFile(path.join(TEST_DIR, 'file1.json'), '');
    await fs.writeFile(path.join(TEST_DIR, 'file2.json'), '');
    await fs.writeFile(path.join(TEST_DIR, 'file3.txt'), '');
    
    const jsonFiles = await listFiles(TEST_DIR, /\.json$/);
    
    expect(jsonFiles.sort()).toEqual(['file1.json', 'file2.json'].sort());
  });

  it('should return empty array for non-existent directory', async () => {
    const files = await listFiles(path.join(TEST_DIR, 'nonexistent'));
    
    expect(files).toEqual([]);
  });

  it('should not include subdirectories', async () => {
    await ensureDir(path.join(TEST_DIR, 'subdir'));
    await fs.writeFile(path.join(TEST_DIR, 'file.txt'), '');
    
    const files = await listFiles(TEST_DIR);
    
    expect(files).toEqual(['file.txt']);
  });
});
