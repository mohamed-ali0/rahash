# Business Management System

A Flask-based web application for managing clients, products, and generating reports.

## Project Structure

```
rahash/
├── frontend/
│   ├── html/
│   │   └── index.html
│   ├── css/
│   │   └── globals.css
│   └── js/
│       └── main.js
├── backend/
│   └── app.py
├── database/
│   ├── models.py
│   └── init.py
├── requirements.txt
└── README.md
```

## Features

- **Client Management**: Add, edit, delete, and view clients
- **Product Management**: Add, edit, delete, and view products  
- **Report Export**: Generate and export various reports

## Setup Instructions

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask backend:
   ```
   cd backend
   python app.py
   ```

3. Open the frontend by serving the HTML files from the frontend directory.

## Development Status

This is the initial file structure. Implementation details will be added in future iterations.

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Delete client

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/<id>` - Update product
- `DELETE /api/products/<id>` - Delete product

### Reports
- `GET /api/reports/clients` - Export clients report
- `GET /api/reports/products` - Export products report
- `GET /api/reports/summary` - Export summary report
