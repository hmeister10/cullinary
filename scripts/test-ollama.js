const axios = require('axios');

// Configuration
const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';
const MODEL_NAME = 'llama3.2:latest';

async function testOllama() {
  try {
    console.log('Testing Ollama connection...');
    console.log('Using API URL:', OLLAMA_API_URL);
    console.log('Using model:', MODEL_NAME);
    
    const response = await axios.post(OLLAMA_API_URL, {
      model: MODEL_NAME,
      prompt: 'Analyze this Indian dish and provide a JSON response with category (Breakfast, Lunch, Dinner, Snack), preference (Veg, Non-Veg), cuisines (array), is_healthy (boolean), spice_level (Mild, Medium, Spicy), dietary_tags (array), and description (string). Dish: Butter Chicken, Ingredients: chicken, butter, cream, tomato, spices',
      stream: false
    });
    
    console.log('Ollama response:');
    console.log(response.data.response);
    
    // Try to extract JSON
    try {
      const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        console.log('\nParsed JSON:');
        console.log(JSON.stringify(parsedJson, null, 2));
      } else {
        console.log('\nNo JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing Ollama:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is Ollama running?');
      console.error('Request details:', error.request._currentUrl);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('\nPlease make sure Ollama is running with the llama3.2 model.');
    console.error('You can start it with: ollama run llama3.2:latest');
    
    // Additional debugging information
    console.error('\nDebug information:');
    console.error('Node.js version:', process.version);
    console.error('Operating system:', process.platform);
    console.error('Error code:', error.code);
    console.error('Error syscall:', error.syscall);
    if (error.address) console.error('Error address:', error.address);
    if (error.port) console.error('Error port:', error.port);
  }
}

// Run the test
testOllama(); 