# Automatic Marksheet Generator

## Requirements
- Node.js and MySQL Server

## Setup
1. Open MySQL Workbench or command line and run `database.sql` (or `mysql -u root -p < database.sql`).
2. Open a terminal in this project folder and run `npm install`.
3. Set database credentials. In Windows PowerShell: `$env:DB_USER="root"; $env:DB_PASSWORD="YOUR_PASSWORD"`. On macOS/Linux: `export DB_USER=root DB_PASSWORD=YOUR_PASSWORD`. Default user is `root` and default password is empty.
4. Run `npm start`.
5. Visit `http://localhost:3000` in a browser. Do not open the HTML files directly; the database API requires the server.

## Pages
- `index.html`: student details and validation
- `marks.html`: subject marks entry and validation
- `result.html`: stored marksheet lookup, result and Print / Save as PDF

Passing: minimum 35/100 in *each* of five subjects. Total out of 500. Percentage = total / 5. Failed students receive grade F. One marksheet per roll number (unique); use a new roll number for another record.

## Note
This is a classroom demonstration. For real student records, add login, role-based authorization, HTTPS and appropriate privacy protections before deployment.
