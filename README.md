# AI OCR Standalone Web App

A standalone web application for extracting product data from images and PDFs using AI OCR (Optical Character Recognition).

## Features

✨ **AI-Powered OCR**: Uses Gemini AI models via Pollinations API to extract data from documents
📄 **Multi-Format Support**: Process images (JPG, PNG, etc.) and PDF files
🔍 **Interactive Preview**: Pan and zoom images/PDFs before processing
📊 **Editable Results**: Edit extracted data directly in the table
💾 **Export Options**: Export to CSV or copy to clipboard
🎯 **Smart Aggregation**: Automatically combines duplicate entries

## Setup Instructions

### 1. Get Your API Key

1. Visit [Pollinations.ai](https://pollinations.ai) to get a free API key
2. Open `app.js` and replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
const CONFIG = {
    POLLINATIONS_API_KEY: 'your_actual_api_key_here',
    API_ENDPOINT: 'https://gen.pollinations.ai/v1/chat/completions'
};
```

### 2. Run the Application

Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari).

**Note**: Due to browser security restrictions, you may need to run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using PHP
php -S localhost:8000

# Using Node.js (http-server)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## How to Use

### Step 1: Upload Documents
- Click "Choose Files" and select images or PDF files
- Preview will show all pages with pan/zoom capabilities

### Step 2: Configure Extraction
- **Quantity Type**: Choose "Pieces" or "Packages"
- **Column Name**: Specify which column to extract (e.g., "quantity", "amount", "total")
- **Additional Instructions**: (Optional) Provide extra context for the AI
- **AI Model Switch**: Toggle between Fast (Gemini Flash) and Pro (Gemini Pro) models

### Step 3: Extract Data
- Click the "Scan" button
- Wait for AI to process the images
- Review extracted data in the table

### Step 4: Edit & Export
- Click any cell to edit data manually
- Right-click rows to delete them
- Export to CSV or copy to clipboard

## AI Models

### Gemini Flash (Default)
- **Speed**: Fast
- **Cost**: Lower
- **Use For**: Simple, clear documents

### Gemini Pro (Toggle ON)
- **Speed**: Slower
- **Cost**: Higher  
- **Use For**: Complex documents, handwriting, low-quality scans

## Features Explained

### Interactive Preview
- **Pan**: Click and drag to move around
- **Zoom**: Scroll with mouse wheel
- Supports both images and multi-page PDFs

### Smart Data Extraction
The AI automatically:
- Detects tables in documents
- Extracts product codes, descriptions, and quantities
- Aggregates duplicate entries by summing quantities
- Removes invalid or incomplete rows

### Editable Table
- Click any cell to edit
- Right-click rows to delete
- Changes are preserved when exporting

### Export Options
- **CSV**: Download as comma-separated values file
- **Clipboard**: Copy tab-separated data (paste into Excel/Sheets)

## Troubleshooting

### "Please configure your API key"
- Make sure you've replaced `YOUR_API_KEY_HERE` in `app.js` with your actual Pollinations API key

### Images not loading
- Use a local server (see Setup Instructions)
- Check browser console for CORS errors

### AI extraction fails
- Try using the Pro model (toggle switch)
- Ensure images are clear and readable
- Specify column name accurately
- Add additional instructions in the comment field

### Table shows wrong data
- Click cells to manually correct
- Add more specific instructions
- Try pre-processing images (crop, enhance contrast)

## Technical Details

### Dependencies
- **Bootstrap 3.3.7**: UI framework
- **jQuery 3.6.0**: DOM manipulation
- **Font Awesome 4.7.0**: Icons
- **PDF.js 4.0.379**: PDF rendering
- **Panzoom 9.4.0**: Image pan/zoom
- **Pollinations API**: AI/OCR processing

### Browser Requirements
- Modern browser with ES6+ support
- JavaScript enabled
- LocalStorage support (for model preference)

### API Usage
- Each image/page = 1 API call
- Multi-page PDFs = multiple calls
- Rate limits apply (check Pollinations docs)

## File Structure

```
ocr/
├── index.html          # Main HTML file
├── app.js             # JavaScript logic
└── README.md          # This file
```

## Privacy & Security

⚠️ **Important**: 
- Images are sent to Pollinations AI for processing
- Do not upload sensitive/confidential documents
- API key is stored in plain JavaScript (client-side only)
- Consider backend implementation for production use

## Limitations

- Requires internet connection for AI processing
- API rate limits apply
- Accuracy depends on document quality
- Complex tables may need manual correction

## Future Enhancements

Potential features to add:
- Backend API endpoint for secure key storage
- Multiple AI provider support (OpenAI, Google, AWS)
- Batch processing with progress bar
- Custom column mapping
- Data validation rules
- Direct database integration

## Credits

Based on the container_check OCR functionality from the OpenCart Family system.

## License

This is a standalone extraction of existing code. Use according to your organization's policies.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key is correct
3. Test with simpler documents first
4. Review Pollinations API documentation
