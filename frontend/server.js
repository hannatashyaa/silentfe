const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://silenbek-production.up.railway.app';


const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and BMP are allowed.'));
        }
    }
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://silenbek-production.up.railway.app',
        'https://your-frontend-domain.com' // Add your frontend domain here
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'SILENT - Sign Language Recognition',
        apiUrl: API_BASE_URL
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'SILENT Frontend',
        timestamp: new Date().toISOString(),
        port: PORT,
        backend_url: API_BASE_URL
    });
});

// API proxy endpoints
app.get('/api/health', async (req, res) => {
    try {
        console.log('Checking backend health at:', `${API_BASE_URL}/api/health`);
        const response = await axios.get(`${API_BASE_URL}/api/health`, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'SILENT-Frontend/1.0'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Backend health check failed:', error.message);
        res.status(500).json({
            error: 'Backend API not available',
            message: error.message,
            backend_url: API_BASE_URL
        });
    }
});

app.get('/api/models', async (req, res) => {
    try {
        console.log('Getting models from:', `${API_BASE_URL}/api/models`);
        const response = await axios.get(`${API_BASE_URL}/api/models`, {
            timeout: 10000,
            headers: {
                'User-Agent': 'SILENT-Frontend/1.0'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Failed to get model info:', error.message);
        res.status(500).json({
            error: 'Failed to get model info',
            message: error.message,
            backend_url: API_BASE_URL
        });
    }
});

// Prediction endpoint
app.post('/api/predict', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided'
            });
        }

        const { dataset_type } = req.body;

        console.log(' Making prediction request to:', `${API_BASE_URL}/api/translate`);
        console.log('Request params:', { 
            hasImage: !!req.file, 
            dataset_type,
            imageSize: req.file.size,
            imageType: req.file.mimetype
        });

        // Create form data for backend API
        const FormData = require('form-data');
        const formData = new FormData();
        
        formData.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        
        if (dataset_type) {
            formData.append('dataset_type', dataset_type);
        }

        // Send to backend API
        const response = await axios.post(`${API_BASE_URL}/api/translate`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Content-Length': formData.getLengthSync(),
                'User-Agent': 'SILENT-Frontend/1.0'
            },
            timeout: 30000 // 30 second timeout
        });

        console.log('Prediction successful:', response.data);
        res.json(response.data);

    } catch (error) {
        console.error('Prediction error:', error.message);
        
        if (error.response) {
            console.error('Backend error response:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to process prediction',
                message: error.message,
                backend_url: API_BASE_URL
            });
        }
    }
});

// Batch prediction endpoint
app.post('/api/predict/batch', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No image files provided'
            });
        }

        const { dataset_type } = req.body;

        console.log('📦 Making batch prediction request to:', `${API_BASE_URL}/api/translate`);
        console.log('📋 Batch params:', { 
            fileCount: req.files.length, 
            dataset_type 
        });

        // Process each image individually since backend doesn't have batch endpoint
        const results = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            
            try {
                const FormData = require('form-data');
                const formData = new FormData();
                
                formData.append('image', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
                
                if (dataset_type) {
                    formData.append('dataset_type', dataset_type);
                }

                const response = await axios.post(`${API_BASE_URL}/api/translate`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Content-Length': formData.getLengthSync(),
                        'User-Agent': 'SILENT-Frontend/1.0'
                    },
                    timeout: 30000
                });

                results.push({
                    ...response.data,
                    imageIndex: i,
                    imageName: file.originalname,
                    success: true
                });

                console.log(` Image ${i+1}/${req.files.length} processed successfully`);
                
            } catch (error) {
                console.error(` Image ${i+1}/${req.files.length} failed:`, error.message);
                results.push({
                    success: false,
                    error: error.message,
                    imageIndex: i,
                    imageName: file.originalname
                });
            }
            
            // Small delay between requests
            if (i < req.files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        const successfulResults = results.filter(r => r.success);
        
        res.json({
            success: true,
            results: results,
            total: results.length,
            successful: successfulResults.length
        });

    } catch (error) {
        console.error(' Batch prediction error:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to process batch prediction',
                message: error.message,
                backend_url: API_BASE_URL
            });
        }
    }
});

// Load model endpoint
app.post('/api/load_model/:dataset_type', async (req, res) => {
    try {
        const { dataset_type } = req.params;
        
        console.log('🔄 Loading model:', dataset_type);
        const response = await axios.post(`${API_BASE_URL}/api/load_model/${dataset_type}`, {}, {
            timeout: 30000,
            headers: {
                'User-Agent': 'SILENT-Frontend/1.0'
            }
        });
        
        console.log('Model loaded successfully:', response.data);
        res.json(response.data);

    } catch (error) {
        console.error('Load model error:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to load model',
                message: error.message,
                backend_url: API_BASE_URL
            });
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`SILENT Frontend Server running on http://localhost:${PORT}`);
    console.log(`Backend API: ${API_BASE_URL}`);
    console.log(`Static files: ${path.join(__dirname, 'public')}`);
    console.log(`Templates: ${path.join(__dirname, 'views')}`);
    
    // Test backend connection on startup
    setTimeout(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
            console.log('Backend connection verified:', response.data.status);
        } catch (error) {
            console.warn('Backend connection failed:', error.message);
            console.warn(' Make sure the backend is running at:', API_BASE_URL);
        }
    }, 2000);
});
