const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const axios = require('axios');

// Configuration
const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';
const MODEL_NAME = 'llama3.2:latest';
const INPUT_CSV_PATH = path.join(__dirname, '../lib/data/Cleaned_Indian_Food_Dataset.csv');
const OUTPUT_CSV_PATH = path.join(__dirname, '../lib/data/Enriched_Indian_Food_Dataset.csv');
const LOG_FILE_PATH = path.join(__dirname, '../lib/data/process_log.jsonl');
const MAX_CONCURRENT_REQUESTS = 10; // Maximum number of parallel requests
const PROGRESS_SAVE_INTERVAL = 50; // Save progress after every N records

// Define the meal categories, diet preferences, cuisine types, and spice levels
const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIET_PREFERENCES = ['Veg', 'Non-Veg'];
const CUISINE_TYPES = [
  'North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Punjabi', 
  'Maharashtrian', 'Rajasthani', 'Goan', 'Kerala', 'Hyderabadi', 
  'Indo-Chinese', 'Mughlai', 'Street Food', 'Continental', 'Italian', 
  'Thai', 'Mediterranean', 'Other'
];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy'];

/**
 * Write a log entry to the log file
 */
function writeLog(entry) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    ...entry
  });
  
  fs.appendFileSync(LOG_FILE_PATH, logEntry + '\n');
  console.log(`[${timestamp}] ${entry.message}`);
}

/**
 * Generate a prompt for the LLM to analyze a dish
 */
function generatePrompt(record) {
  return `
You are a culinary expert specializing in Indian cuisine. Analyze this dish and provide structured information.

Dish: ${record.TranslatedRecipeName}
Ingredients: ${record.CleanedIngredients || record.TranslatedIngredients}
Cuisine: ${record.Cuisine}
Course: ${record.Course || 'Unknown'}
Diet: ${record.Diet || 'Unknown'}
Preparation Time: ${record.PrepTimeInMins || 'Unknown'} minutes
Cooking Time: ${record.CookTimeInMins || 'Unknown'} minutes
Total Time: ${record.TotalTimeInMins || 'Unknown'} minutes
Instructions: ${record.TranslatedInstructions || 'Not provided'}

Based on this information, provide the following details in JSON format:
1. category: The meal category (${MEAL_CATEGORIES.join(', ')})
2. preference: Diet preference (${DIET_PREFERENCES.join(', ')})
3. cuisines: Array of cuisine types that apply (from ${CUISINE_TYPES.join(', ')})
4. is_healthy: Boolean indicating if the dish is healthy
5. spice_level: Spice level (${SPICE_LEVELS.join(', ')})
6. dietary_tags: Array of applicable tags (e.g., vegetarian, vegan, gluten-free, protein-rich, quick, easy, traditional, street-food)
7. description: A brief, appetizing description of the dish (2-3 sentences)

Return ONLY valid JSON with these fields and nothing else.
`;
}

/**
 * Call Ollama API to get LLM analysis
 */
async function analyzeWithOllama(prompt) {
  try {
    const response = await axios.post(OLLAMA_API_URL, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    writeLog({
      level: 'error',
      message: `Error calling Ollama API: ${error.message}`,
      error: error.toString()
    });
    return null;
  }
}

/**
 * Extract JSON from LLM response
 */
function extractJsonFromResponse(response) {
  if (!response) return null;
  
  try {
    // Find JSON-like content in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    writeLog({
      level: 'error',
      message: `Error parsing JSON from LLM response: ${error.message}`,
      error: error.toString()
    });
    return null;
  }
}

/**
 * Process a single record with Ollama
 */
async function processRecord(record, index, enrichedRecords) {
  const startTime = Date.now();
  writeLog({
    level: 'info',
    message: `Processing record ${index + 1}: ${record.TranslatedRecipeName}`,
    index: index + 1,
    name: record.TranslatedRecipeName
  });
  
  // Generate a unique ID
  const dish_id = `csv_${index + 1}_${record.TranslatedRecipeName.slice(0, 20).replace(/\s+/g, '_').toLowerCase()}`;
  
  // Generate prompt and call Ollama
  const prompt = generatePrompt(record);
  const llmResponse = await analyzeWithOllama(prompt);
  const analysis = extractJsonFromResponse(llmResponse);
  
  let result;
  if (!analysis) {
    writeLog({
      level: 'warn',
      message: `Failed to get valid analysis for record ${index + 1}`,
      index: index + 1,
      name: record.TranslatedRecipeName
    });
    
    // Return a record with default values
    result = {
      dish_id,
      recipe_index: index + 1,
      name: record.TranslatedRecipeName,
      category: 'Dinner', // Default
      is_healthy: false,
      preference: 'Non-Veg', // Default
      image_url: record['image-url'] || '/assets/food-placeholder.svg',
      cuisines: ['Other'],
      ingredients: (record.CleanedIngredients || '').split(',').map(i => i.trim()).filter(i => i),
      dietary_tags: [],
      spice_level: 'Medium',
      preparation_time: parseInt(record.PrepTimeInMins) || undefined,
      description: `${record.TranslatedRecipeName} - ${record.Cuisine} cuisine.`,
      // Original fields for reference
      original_recipe_id: record.RecipeId,
      original_url: record.URL
    };
  } else {
    // Combine the analysis with the original data
    result = {
      dish_id,
      recipe_index: index + 1,
      name: record.TranslatedRecipeName,
      category: analysis.category || 'Dinner',
      is_healthy: analysis.is_healthy || false,
      preference: analysis.preference || 'Non-Veg',
      image_url: record['image-url'] || '/assets/food-placeholder.svg',
      cuisines: analysis.cuisines || ['Other'],
      ingredients: (record.CleanedIngredients || '').split(',').map(i => i.trim()).filter(i => i),
      dietary_tags: analysis.dietary_tags || [],
      spice_level: analysis.spice_level || 'Medium',
      preparation_time: parseInt(record.PrepTimeInMins) || undefined,
      description: analysis.description || `${record.TranslatedRecipeName} - ${record.Cuisine} cuisine.`,
      // Original fields for reference
      original_recipe_id: record.RecipeId,
      original_url: record.URL
    };
  }
  
  // Add the result to the enriched records array
  enrichedRecords.push(result);
  
  // Write the updated records to the CSV file after each record
  const csvOutput = stringify(enrichedRecords, { header: true });
  fs.writeFileSync(OUTPUT_CSV_PATH, csvOutput);
  
  const processingTime = Date.now() - startTime;
  writeLog({
    level: 'info',
    message: `Completed record ${index + 1} in ${processingTime}ms`,
    index: index + 1,
    name: record.TranslatedRecipeName,
    processingTime,
    success: !!analysis
  });
  
  return result;
}

/**
 * Check if we have a progress file to resume from
 */
function getLastProcessedIndex() {
  const progressFilePath = OUTPUT_CSV_PATH + '.progress';
  if (fs.existsSync(progressFilePath)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressFilePath, 'utf8'));
      return progress.lastProcessedIndex;
    } catch (error) {
      writeLog({
        level: 'error',
        message: `Error reading progress file: ${error.message}`,
        error: error.toString()
      });
      return -1;
    }
  }
  return -1;
}

/**
 * Save progress information
 */
function saveProgress(lastProcessedIndex) {
  // Save progress info
  const progressFilePath = OUTPUT_CSV_PATH + '.progress';
  fs.writeFileSync(progressFilePath, JSON.stringify({ 
    lastProcessedIndex,
    timestamp: new Date().toISOString()
  }));
  
  writeLog({
    level: 'info',
    message: `Progress saved: ${lastProcessedIndex + 1} records processed`,
    lastProcessedIndex: lastProcessedIndex + 1
  });
}

/**
 * Main function to process the CSV file
 */
async function main() {
  try {
    // Initialize log file
    if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
      fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
    }
    
    writeLog({
      level: 'info',
      message: 'Starting CSV processing with Ollama',
      config: {
        model: MODEL_NAME,
        inputPath: INPUT_CSV_PATH,
        outputPath: OUTPUT_CSV_PATH,
        maxConcurrentRequests: MAX_CONCURRENT_REQUESTS
      }
    });
    
    console.log('Reading CSV file...');
    const fileContent = fs.readFileSync(INPUT_CSV_PATH, 'utf8');
    
    console.log('Parsing CSV data...');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    writeLog({
      level: 'info',
      message: `Found ${records.length} records to process`,
      totalRecords: records.length
    });
    
    // Check if we need to resume from a previous run
    const lastProcessedIndex = getLastProcessedIndex();
    const startIndex = lastProcessedIndex + 1;
    
    if (startIndex > 0) {
      writeLog({
        level: 'info',
        message: `Resuming from record ${startIndex + 1}`,
        resumeIndex: startIndex + 1
      });
    }
    
    // Load any existing enriched records
    let enrichedRecords = [];
    if (fs.existsSync(OUTPUT_CSV_PATH)) {
      try {
        const existingContent = fs.readFileSync(OUTPUT_CSV_PATH, 'utf8');
        enrichedRecords = csv.parse(existingContent, {
          columns: true,
          skip_empty_lines: true,
        });
        writeLog({
          level: 'info',
          message: `Loaded ${enrichedRecords.length} existing records from output file`,
          existingRecords: enrichedRecords.length
        });
      } catch (error) {
        writeLog({
          level: 'warn',
          message: 'Could not load existing output file, starting fresh',
          error: error.toString()
        });
      }
    }
    
    // Process records in parallel with a maximum concurrency
    for (let i = startIndex; i < records.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = records.slice(i, Math.min(i + MAX_CONCURRENT_REQUESTS, records.length));
      writeLog({
        level: 'info',
        message: `Processing batch of ${batch.length} records starting at index ${i}`,
        batchSize: batch.length,
        startIndex: i
      });
      
      // Process records in parallel, but update the enrichedRecords array for each one
      const promises = batch.map((record, batchIndex) => 
        processRecord(record, i + batchIndex, enrichedRecords)
      );
      
      // Wait for all records in this batch to complete
      await Promise.all(promises);
      
      // Save progress after each batch
      saveProgress(i + batch.length - 1);
    }
    
    // Remove progress file since we're done
    const progressFilePath = OUTPUT_CSV_PATH + '.progress';
    if (fs.existsSync(progressFilePath)) {
      fs.unlinkSync(progressFilePath);
    }
    
    writeLog({
      level: 'info',
      message: `Processing complete! Enriched data saved to ${OUTPUT_CSV_PATH}`,
      totalProcessed: enrichedRecords.length
    });
  } catch (error) {
    writeLog({
      level: 'error',
      message: `Error processing CSV: ${error.message}`,
      error: error.toString(),
      stack: error.stack
    });
  }
}

// Run the main function
main().catch(error => {
  writeLog({
    level: 'fatal',
    message: `Unhandled error: ${error.message}`,
    error: error.toString(),
    stack: error.stack
  });
}); 