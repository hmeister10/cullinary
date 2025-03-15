// This file should only be imported in server components or API routes
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Read and parse a CSV file (server-side only)
 * @param filePath Path to the CSV file
 * @param options CSV parse options
 * @returns Parsed CSV data as an array of objects
 */
export function readCsvFile<T>(filePath: string, options: any = {}): T[] {
  try {
    // Resolve the file path
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);
    
    // Read the file
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    
    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true, // Use the first line as column names
      skip_empty_lines: true,
      ...options
    });
    
    return records as T[];
  } catch (error) {
    console.error('Error reading or parsing CSV file:', error);
    throw error;
  }
}

/**
 * Read and parse a CSV file in chunks to handle large files (server-side only)
 * @param filePath Path to the CSV file
 * @param chunkSize Number of records to read at a time
 * @param callback Function to process each chunk
 * @param options CSV parse options
 */
export async function readCsvFileInChunks<T>(
  filePath: string, 
  chunkSize: number,
  callback: (chunk: T[], isLastChunk: boolean) => Promise<void>,
  options: any = {}
): Promise<void> {
  try {
    // Resolve the file path
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);
    
    // Read the file
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    
    // Parse the CSV content
    const records = parse(fileContent, {
      columns: true, // Use the first line as column names
      skip_empty_lines: true,
      ...options
    }) as T[];
    
    // Process in chunks
    const totalChunks = Math.ceil(records.length / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, records.length);
      const chunk = records.slice(start, end);
      const isLastChunk = i === totalChunks - 1;
      
      await callback(chunk, isLastChunk);
    }
  } catch (error) {
    console.error('Error reading or parsing CSV file in chunks:', error);
    throw error;
  }
} 