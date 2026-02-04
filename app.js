// Configuration
const CONFIG = {
    API_ENDPOINT: 'https://gen.pollinations.ai/v1/chat/completions'
};

// Get API key from localStorage or prompt user
function getApiKey() {
    let apiKey = localStorage.getItem('pollinations_api_key');
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        apiKey = prompt(
            'Please enter your Pollinations API key:\n\n' +
            'Get a free API key at: https://pollinations.ai\n\n' +
            'Your key will be saved locally in your browser.'
        );
        
        if (apiKey) {
            localStorage.setItem('pollinations_api_key', apiKey);
        }
    }
    
    return apiKey;
}

// Clear API key (for settings)
function clearApiKey() {
    localStorage.removeItem('pollinations_api_key');
    showAlert('info', 'API key cleared. You will be prompted on next scan.');
}

// DOM Elements
const imageInput = document.getElementById('input-image');
const previewDiv = document.getElementById('preview');
const result = document.getElementById('result');
const quantityType = document.getElementById('input-quantity-type');
const table = document.getElementById('table-products');
const alertsDiv = document.getElementById('alerts');

let products = [];
let clickedRow = null;

// Event Listeners
imageInput.addEventListener('change', handleFileUpload);
document.getElementById('button-scan').addEventListener('click', handleScan);
document.getElementById('button-export').addEventListener('click', exportToCSV);
document.getElementById('button-copy').addEventListener('click', copyToClipboard);

// Context menu for deleting rows
$('#result').on('contextmenu', '#table-products tr', function(e) {
    e.preventDefault();
    clickedRow = $(this);
    const existingMenu = document.querySelector('.product-menu');
    if (!existingMenu) {
        $('#contextMenu').css({
            top: (e.clientY + 5) + 'px',
            left: (e.clientX + 5) + 'px',
            display: 'block'
        });
    }
});

$('#deleteRow').on('click', function() {
    if (clickedRow) {
        clickedRow.remove();
        clickedRow = null;
        $('#contextMenu').hide();
    }
});

$(document).on('click', function(e) {
    if (!$(e.target).closest('#contextMenu').length) {
        $('#contextMenu').hide();
    }
});

// File Upload Handler
function handleFileUpload() {
    const files = Array.from(this.files);
    previewDiv.innerHTML = "";

    if (files) {
        files.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'preview-container';
            div.innerHTML = `<label class="control-label" for="preview-${index}">Page ${index + 1}</label>`;
            const imgDiv = document.createElement('div');
            imgDiv.style.overflow = 'hidden';

            if (file.type.startsWith('image/')) {
                // Image handling
                const img = document.createElement('img');
                img.id = 'preview-' + index;
                img.src = URL.createObjectURL(file);
                img.style.width = '743px';
                imgDiv.appendChild(img);
                div.appendChild(imgDiv);
                previewDiv.appendChild(div);

                // Initialize Panzoom
                const panzoomInstance = panzoom(img, {
                    maxZoom: 5,
                    minZoom: 1,
                    bounds: true,
                    boundsPadding: 1,
                    step: 0.5,
                });
                imgDiv.addEventListener('wheel', panzoomInstance.zoomWithWheel);
            } else if (file.type === 'application/pdf') {
                // PDF handling
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 3.0 });
                        const canvas = document.createElement('canvas');
                        canvas.id = `preview-${index}-${pageNum}`;
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        canvas.style.width = '743px';

                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;

                        const pageDiv = document.createElement('div');
                        pageDiv.className = 'preview-container';
                        pageDiv.innerHTML = `<label class="control-label" for="preview-${index}-${pageNum}">Page ${pageNum}</label>`;
                        const pageImgDiv = document.createElement('div');
                        pageImgDiv.style.overflow = 'hidden';
                        pageImgDiv.appendChild(canvas);
                        pageDiv.appendChild(pageImgDiv);
                        previewDiv.appendChild(pageDiv);

                        const panzoomInstance = panzoom(canvas, {
                            maxZoom: 5,
                            minZoom: 1,
                            bounds: true,
                            boundsPadding: 1,
                            step: 0.5,
                        });
                        pageImgDiv.addEventListener('wheel', panzoomInstance.zoomWithWheel);
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }
}

// Scan Handler
async function handleScan(e) {
    e.preventDefault();
    if ($('#input-column').val()) {
        await processImage();
    } else {
        showAlert('danger', 'Please specify a column name (e.g., "quantity", "amount")');
    }
}

// Process Images with AI
async function processImage() {
    let products = [];
    let listArray = [];
    const files = Array.from(imageInput.files);

    if (files.length === 0) {
        showAlert('warning', 'Please upload at least one file');
        return;
    }

    table.style.display = 'none';

    if ($('.loading').length) $('.loading').remove();

    let span = document.createElement('span');
    span.className = 'loading';
    span.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing images with AI...';
    result.appendChild(span);

    const comment = $('#input-comment').val().trim();
    const column = $('#input-column').val();
    const model = $('#model-switch').is(':checked');

    for (const file of files) {
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });

        const response = await callAI(dataUrl, comment, column, listArray, model);

        if (response.success) {
            const result = JSON.parse(response.data);
            console.log('API Response:', result);
            
            // Handle different response formats
            let extractedData;
            try {
                if (result.choices && result.choices[0]) {
                    // Try different possible response structures
                    const choice = result.choices[0];
                    if (choice.message && choice.message.content_blocks) {
                        // Find the text block (skip image blocks)
                        const textBlock = choice.message.content_blocks.find(block => block.type === 'text');
                        if (textBlock && textBlock.text) {
                            const textContent = textBlock.text;
                            console.log('Parsing content_blocks text:', textContent);
                            extractedData = JSON.parse(textContent);
                        }
                    } else if (choice.message && choice.message.content) {
                        const textContent = choice.message.content;
                        console.log('Parsing content:', textContent);
                        extractedData = JSON.parse(textContent);
                    } else if (choice.text) {
                        const textContent = choice.text;
                        console.log('Parsing text:', textContent);
                        extractedData = JSON.parse(textContent);
                    }
                } else if (result.candidates && result.candidates[0]) {
                    // Gemini format
                    const candidate = result.candidates[0];
                    if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                        const textContent = candidate.content.parts[0].text;
                        console.log('Parsing Gemini format:', textContent);
                        extractedData = JSON.parse(textContent);
                    }
                }
                
                if (extractedData) {
                    products.push(...extractedData);
                    console.log('Extracted products:', products);
                } else {
                    console.error('Could not find data in response structure:', result);
                    showAlert('danger', 'Error: Could not find data in AI response. Check console for details.');
                    span.remove();
                    return;
                }
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.error('Failed to parse:', result);
                showAlert('danger', 'Error parsing AI response: ' + parseError.message);
                span.remove();
                return;
            }
        } else {
            showAlert('danger', response.error);
            span.remove();
            return;
        }
    }

    // Aggregate products by code
    products = Object.values(
        products.reduce((acc, item) => {
            let obj;
            if (Array.isArray(item)) {
                obj = {
                    codice: item[0],
                    descrizione: item[1],
                    valore: item[2]
                };
            } else {
                obj = item;
            }

            if (!obj.codice || typeof obj.codice !== 'string') {
                return acc;
            }

            if (obj.codice.includes('\n')) {
                obj.codice = obj.codice.split('\n')[0].trim().replace(/\s+/g, '');
            }
            const key = obj.codice;
            obj.valore = parseFloat(obj.valore);
            if (!acc[key]) {
                acc[key] = {
                    codice: obj.codice,
                    descrizione: obj.descrizione,
                    valore: obj.valore
                };
            } else {
                acc[key].valore += obj.valore;
            }

            return acc;
        }, {})
    );

    renderTable(products);
    span.remove();
}

// Call AI API
async function callAI(dataUrl, comment, column, prevData, useProModel) {
    try {
        const apiKey = getApiKey();
        
        if (!apiKey) {
            return {
                success: false,
                error: 'API key is required. Please provide a valid Pollinations API key.'
            };
        }

        const model = useProModel ? 'gemini-3-pro-preview' : 'gemini-3-flash';
        
        const prev_data = prevData && prevData.length > 0 
            ? ' Previous data extracted: ' + JSON.stringify(prevData) + '.'
            : '';

        const payload = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prev_data + 'Extract the table containing product data in JSON array format without headers and not in markdown.' + 
                                  (comment ? ' ' + comment + '.' : '') + 
                                  ' Extract data exactly as: ["product code", "description", value in column "' + column + '" as number]'
                        },
                        {
                            type: 'image_url',
                            image_url: { url: dataUrl }
                        }
                    ]
                }
            ],
            temperature: 0
        };

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error('API request failed: ' + response.statusText + ' - ' + errorText);
        }

        const data = await response.json();
        console.log('Full API Response:', data);
        return {
            success: true,
            data: JSON.stringify(data)
        };
    } catch (error) {
        console.error('AI API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Render Table
function renderTable(products) {
    if (!products || products.length === 0) {
        showAlert('warning', 'No products found in the images');
        return;
    }

    const tbody = document.createElement("tbody");

    products.forEach(row => {
        const tr = document.createElement("tr");

        [row.codice, row.descrizione, row.valore, ''].forEach((cell, index) => {
            const td = document.createElement("td");
            td.textContent = cell;
            td.setAttribute("contenteditable", "true");
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    const thead = document.createElement("thead");
    thead.innerHTML = '<tr><th>Product Code</th><th>Description</th><th>Quantity</th><th>Barcode</th></tr>';

    table.innerHTML = '';
    table.appendChild(thead);
    table.appendChild(tbody);
    table.style.display = 'block';
    
    showAlert('success', `Successfully extracted ${products.length} products!`);
}

// Export to CSV
function exportToCSV() {
    const rows = [];
    
    // Header
    rows.push(['Product Code', 'Description', 'Quantity', 'Barcode']);
    
    // Data
    $('#table-products tbody tr').each(function() {
        const row = [];
        $(this).find('td').each(function() {
            row.push($(this).text().trim());
        });
        rows.push(row);
    });

    if (rows.length <= 1) {
        showAlert('warning', 'No data to export');
        return;
    }

    // Convert to CSV
    const csvContent = rows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ocr_export_' + new Date().toISOString().slice(0,10) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('success', 'CSV file downloaded successfully!');
}

// Copy to Clipboard
function copyToClipboard() {
    const rows = [];
    
    $('#table-products tbody tr').each(function() {
        const row = [];
        $(this).find('td').each(function() {
            row.push($(this).text().trim());
        });
        rows.push(row.join('\t'));
    });

    if (rows.length === 0) {
        showAlert('warning', 'No data to copy');
        return;
    }

    const text = rows.join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showAlert('success', 'Data copied to clipboard!');
    }).catch(err => {
        showAlert('danger', 'Failed to copy: ' + err);
    });
}

// Show Alert
function showAlert(type, message) {
    const alert = `
        <div class="alert alert-${type} alert-dismissible">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <i class="fa fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        </div>
    `;
    $(alertsDiv).html(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        $(alertsDiv).find('.alert').fadeOut();
    }, 5000);
}

// Load/Save AI Model Preference
function loadCheckboxState(id, defaultValue = false) {
    const checkbox = document.getElementById(id);
    const savedState = localStorage.getItem(`${id}aiModel`);
    if (savedState === null) {
        checkbox.checked = defaultValue;
        localStorage.setItem(`${id}aiModel`, defaultValue);
    } else {
        checkbox.checked = savedState === 'true';
    }
}

function saveCheckboxState(id) {
    const checkbox = document.getElementById(id);
    checkbox.addEventListener('change', () => {
        localStorage.setItem(`${id}aiModel`, checkbox.checked);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCheckboxState('model-switch');
    saveCheckboxState('model-switch');
});
