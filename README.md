# Loan Product Management System

Skeleton backend for uploading and processing loan product batches.

Quick start

```bash
npm install
# compile
npm run build
# or run with ts-node
npm start
```

Files live under `src/`.

![data layer](image.png)






📝 Test Scenarios by Category
System Health:

✅ Health check
✅ API info

File Upload:

✅ Valid new products
✅ Valid updates
✅ Invalid file types
✅ Missing columns
✅ File too large
✅ Empty files

Data Validation:

✅ Negative pricing
✅ Invalid dates
✅ Missing required fields
✅ Withdrawn before start date

Processing:

✅ Monitor all status states
✅ Chunk-based processing
✅ Reconciliation accuracy

Products:

✅ Pagination (various page sizes)
✅ Search functionality
✅ Get by ID
✅ History tracking

Error Handling:

✅ 404 - Not found
✅ 400 - Bad request
✅ 429 - Rate limiting
