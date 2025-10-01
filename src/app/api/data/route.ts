import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to your db.json file
const dbPath = path.join(process.cwd(), 'src', 'database', 'db.json');

// Helper function to read data from the database file
async function readData() {
  try {
    const fileData = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileData);
  } catch (error) {
    // If the file doesn't exist or there's an error, handle it
    console.error('Error reading database file:', error);
    // You might want to return a default structure or throw an error
    return { products: [], categories: [], customers: [], invoices: [], units: [], stores: [], toolbarPosition: { x: 50, y: 16 } };
  }
}

// Helper function to write data to the database file
async function writeData(data: any) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
    throw new Error('Could not write to database.');
  }
}

// GET handler to retrieve all data
export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error reading data' }, { status: 500 });
  }
}

// POST handler to update all data
export async function POST(request: Request) {
  try {
    const newData = await request.json();
    await writeData(newData);
    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error writing data' }, { status: 500 });
  }
}
