# CSV Processing with Ollama

This script processes the Indian Food Dataset CSV file using Ollama's llama3.2 model to enrich the data with additional information.

## Prerequisites

1. Node.js installed on your system
2. Ollama installed and running locally
3. llama3.2 model pulled in Ollama

## Setup

1. Make sure Ollama is running with the llama3.2 model:
   ```
   ollama run llama3.2:latest
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Script

Run the script with:

```
npm run process-csv
```

This will:
1. Read the CSV file from `lib/data/Cleaned_Indian_Food_Dataset.csv`
2. Process each record using Ollama's llama3.2 model
3. Generate a new enriched CSV file at `lib/data/Enriched_Indian_Food_Dataset.csv`

## Configuration

You can modify the following parameters in the script:

- `OLLAMA_API_URL`: URL of the Ollama API (default: http://localhost:11434/api/generate)
- `MODEL_NAME`: Name of the model to use (default: llama3.2:latest)
- `BATCH_SIZE`: Number of records to process in each batch (default: 10)
- `DELAY_BETWEEN_BATCHES`: Delay in ms between batches (default: 1000)

## Output Format

The enriched CSV file will contain the following fields for each dish:

- `dish_id`: Unique identifier for the dish
- `name`: Name of the dish
- `category`: Meal category (Breakfast, Lunch, Dinner, Snack)
- `is_healthy`: Boolean indicating if the dish is healthy
- `preference`: Diet preference (Veg, Non-Veg)
- `image_url`: URL of the dish image
- `cuisines`: Array of cuisine types
- `ingredients`: Array of ingredients
- `dietary_tags`: Array of dietary tags
- `spice_level`: Spice level (Mild, Medium, Spicy)
- `preparation_time`: Preparation time in minutes
- `description`: Brief description of the dish
- `original_recipe_id`: Original recipe ID from the source data
- `original_url`: Original URL from the source data 