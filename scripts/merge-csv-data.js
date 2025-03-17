const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Configuration
const CLEANED_CSV_PATH = path.join(__dirname, '../lib/data/Cleaned_Indian_Food_Dataset.csv');
const ENRICHED_CSV_PATH = path.join(__dirname, '../lib/data/Enriched_Indian_Food_Dataset.csv');
const MASTER_CSV_PATH = path.join(__dirname, '../lib/data/Master_Indian_Food_Dataset.csv');
const LOG_FILE_PATH = path.join(__dirname, '../lib/data/merge_log.jsonl');

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
 * Main function to merge the CSV files
 */
async function main() {
  try {
    // Initialize log file
    if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
      fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
    }
    
    writeLog({
      level: 'info',
      message: 'Starting CSV merge process',
      config: {
        cleanedPath: CLEANED_CSV_PATH,
        enrichedPath: ENRICHED_CSV_PATH,
        outputPath: MASTER_CSV_PATH
      }
    });
    
    console.log('Reading cleaned CSV file...');
    const cleanedContent = fs.readFileSync(CLEANED_CSV_PATH, 'utf8');
    
    console.log('Parsing cleaned CSV data...');
    const cleanedRecords = csv.parse(cleanedContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log('Reading enriched CSV file...');
    const enrichedContent = fs.readFileSync(ENRICHED_CSV_PATH, 'utf8');
    
    console.log('Parsing enriched CSV data...');
    const enrichedRecords = csv.parse(enrichedContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    writeLog({
      level: 'info',
      message: `Found ${cleanedRecords.length} cleaned records and ${enrichedRecords.length} enriched records`,
      cleanedCount: cleanedRecords.length,
      enrichedCount: enrichedRecords.length
    });
    
    // Create a map of enriched records by recipe index for faster lookup
    const enrichedMap = new Map();
    enrichedRecords.forEach(record => {
      enrichedMap.set(parseInt(record.recipe_index), record);
    });
    
    // Merge the records
    const masterRecords = [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    cleanedRecords.forEach((cleanedRecord, index) => {
      // Find the corresponding enriched record
      const enrichedRecord = enrichedMap.get(index + 1); // recipe_index is 1-based
      
      if (enrichedRecord) {
        matchedCount++;
        
        // Merge the records
        const masterRecord = {
          // Basic information
          dish_id: enrichedRecord.dish_id,
          recipe_index: enrichedRecord.recipe_index,
          name: cleanedRecord.TranslatedRecipeName,
          
          // Enriched data
          category: enrichedRecord.category,
          is_healthy: enrichedRecord.is_healthy,
          preference: enrichedRecord.preference,
          image_url: enrichedRecord.image_url || cleanedRecord['image-url'] || '/assets/food-placeholder.svg',
          cuisines: enrichedRecord.cuisines,
          dietary_tags: enrichedRecord.dietary_tags,
          spice_level: enrichedRecord.spice_level,
          description: enrichedRecord.description,
          
          // Original data
          cuisine: cleanedRecord.Cuisine,
          course: cleanedRecord.Course || '',
          diet: cleanedRecord.Diet || '',
          
          // Time information
          preparation_time: cleanedRecord.PrepTimeInMins || enrichedRecord.preparation_time,
          cooking_time: cleanedRecord.CookTimeInMins || '',
          total_time: cleanedRecord.TotalTimeInMins || '',
          
          // Ingredients and instructions
          ingredients_raw: cleanedRecord.TranslatedIngredients || '',
          ingredients_cleaned: cleanedRecord.CleanedIngredients || '',
          ingredients_array: enrichedRecord.ingredients || [],
          ingredient_count: cleanedRecord['Ingredient-count'] || '',
          instructions: cleanedRecord.TranslatedInstructions || '',
          
          // Source information
          original_recipe_id: cleanedRecord.RecipeId || '',
          original_url: cleanedRecord.URL || enrichedRecord.original_url || ''
        };
        
        masterRecords.push(masterRecord);
      } else {
        unmatchedCount++;
        
        // If no enriched record exists, create a master record with just the cleaned data
        const masterRecord = {
          // Basic information
          dish_id: `csv_${index + 1}_${cleanedRecord.TranslatedRecipeName.slice(0, 20).replace(/\s+/g, '_').toLowerCase()}`,
          recipe_index: index + 1,
          name: cleanedRecord.TranslatedRecipeName,
          
          // Default enriched data
          category: '',
          is_healthy: '',
          preference: '',
          image_url: cleanedRecord['image-url'] || '/assets/food-placeholder.svg',
          cuisines: JSON.stringify([cleanedRecord.Cuisine || 'Other']),
          dietary_tags: JSON.stringify([]),
          spice_level: 'Medium',
          description: `${cleanedRecord.TranslatedRecipeName} - ${cleanedRecord.Cuisine || 'Indian'} cuisine.`,
          
          // Original data
          cuisine: cleanedRecord.Cuisine || '',
          course: cleanedRecord.Course || '',
          diet: cleanedRecord.Diet || '',
          
          // Time information
          preparation_time: cleanedRecord.PrepTimeInMins || '',
          cooking_time: cleanedRecord.CookTimeInMins || '',
          total_time: cleanedRecord.TotalTimeInMins || '',
          
          // Ingredients and instructions
          ingredients_raw: cleanedRecord.TranslatedIngredients || '',
          ingredients_cleaned: cleanedRecord.CleanedIngredients || '',
          ingredients_array: JSON.stringify((cleanedRecord.CleanedIngredients || '').split(',').map(i => i.trim()).filter(i => i)),
          ingredient_count: cleanedRecord['Ingredient-count'] || '',
          instructions: cleanedRecord.TranslatedInstructions || '',
          
          // Source information
          original_recipe_id: cleanedRecord.RecipeId || '',
          original_url: cleanedRecord.URL || ''
        };
        
        masterRecords.push(masterRecord);
      }
    });
    
    writeLog({
      level: 'info',
      message: `Merged ${matchedCount} matched records and ${unmatchedCount} unmatched records`,
      matchedCount,
      unmatchedCount,
      totalMasterRecords: masterRecords.length
    });
    
    // Write the master records to the CSV file
    console.log('Writing master CSV file...');
    const csvOutput = stringify(masterRecords, { header: true });
    fs.writeFileSync(MASTER_CSV_PATH, csvOutput);
    
    writeLog({
      level: 'info',
      message: `Merge complete! Master data saved to ${MASTER_CSV_PATH}`,
      totalRecords: masterRecords.length
    });
    
    console.log(`\nMerge complete! Master data saved to ${MASTER_CSV_PATH}`);
    console.log(`Total records: ${masterRecords.length}`);
    console.log(`Matched records: ${matchedCount}`);
    console.log(`Unmatched records: ${unmatchedCount}`);
    
  } catch (error) {
    writeLog({
      level: 'error',
      message: `Error merging CSV files: ${error.message}`,
      error: error.toString(),
      stack: error.stack
    });
    
    console.error(`\nError: ${error.message}`);
    console.error(error.stack);
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
  
  console.error(`\nFatal error: ${error.message}`);
  console.error(error.stack);
}); 