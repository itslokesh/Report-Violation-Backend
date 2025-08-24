# Enhanced Dashboard API Documentation

## Overview

The enhanced dashboard API provides separate endpoints for different dashboard components with flexible time ranges. This allows the frontend to request data for different graphs with different time periods simultaneously.

## Base URL
```
http://localhost:3000/api/police/dashboard
```

## Authentication
All endpoints require police authentication unless `PROTOTYPE_NO_AUTH=true` is set.

---

## 1. Dashboard Overview

### Endpoint
```
GET /dashboard/overview
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateFrom` | string | - | Start date (ISO format: YYYY-MM-DD) |
| `dateTo` | string | - | End date (ISO format: YYYY-MM-DD) |
| `days` | number | 30 | Number of days from today (used if dateFrom/dateTo not provided) |
| `city` | string | - | Filter by city |

### Request Examples
```bash
# Last 30 days (default)
GET /api/police/dashboard/overview

# Custom date range
GET /api/police/dashboard/overview?dateFrom=2025-05-01&dateTo=2025-08-24

# Last 7 days
GET /api/police/dashboard/overview?days=7

# Filter by city
GET /api/police/dashboard/overview?days=30&city=Coimbatore
```

### Response
```json
{
  "success": true,
  "data": {
    "totalReports": 100,
    "pendingReports": 21,
    "approvedReports": 39,
    "rejectedReports": 40,
    "duplicateReports": 0,
    "processedToday": 5,
    "approvedToday": 2,
    "rejectedToday": 3,
    "averageProcessingTime": 86400,
    "reportsByViolationType": {
      "SPEED_VIOLATION": 25,
      "SIGNAL_JUMPING": 15,
      "WRONG_SIDE_DRIVING": 10
    },
    "reportsByCity": {
      "Coimbatore": 100
    },
    "reportsByStatus": {
      "APPROVED": 39,
      "REJECTED": 40,
      "PENDING": 21
    }
  },
  "meta": {
    "timeRange": {
      "dateFrom": "2025-05-25T00:00:00.000Z",
      "dateTo": null,
      "days": 30
    }
  }
}
```

---

## 2. Weekly Trend

### Endpoint
```
GET /dashboard/weekly-trend
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Number of days for trend |
| `dateFrom` | string | - | Start date (ISO format) |
| `dateTo` | string | - | End date (ISO format) |
| `city` | string | - | Filter by city |

### Request Examples
```bash
# Last 7 days (default)
GET /api/police/dashboard/weekly-trend

# Last 14 days
GET /api/police/dashboard/weekly-trend?days=14

# Custom date range
GET /api/police/dashboard/weekly-trend?dateFrom=2025-08-01&dateTo=2025-08-07
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-08-18",
      "reports": 5,
      "approved": 2,
      "rejected": 2,
      "pending": 1,
      "revenue": 2500
    },
    {
      "date": "2025-08-19",
      "reports": 8,
      "approved": 3,
      "rejected": 4,
      "pending": 1,
      "revenue": 3500
    }
  ],
  "meta": {
    "timeRange": {
      "days": 7,
      "dateFrom": "2025-08-18T00:00:00.000Z",
      "dateTo": null
    }
  }
}
```

---

## 3. Monthly Trend

### Endpoint
```
GET /dashboard/monthly-trend
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `months` | number | 12 | Number of months for trend |
| `dateFrom` | string | - | Start date (ISO format) |
| `dateTo` | string | - | End date (ISO format) |
| `city` | string | - | Filter by city |

### Request Examples
```bash
# Last 12 months (default)
GET /api/police/dashboard/monthly-trend

# Last 6 months
GET /api/police/dashboard/monthly-trend?months=6

# Custom date range
GET /api/police/dashboard/monthly-trend?dateFrom=2025-01-01&dateTo=2025-08-31
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-06",
      "reports": 45,
      "approved": 18,
      "rejected": 20,
      "pending": 7,
      "revenue": 12500
    },
    {
      "month": "2025-07",
      "reports": 52,
      "approved": 21,
      "rejected": 22,
      "pending": 9,
      "revenue": 14200
    }
  ],
  "meta": {
    "timeRange": {
      "months": 12,
      "dateFrom": "2024-09-01T00:00:00.000Z",
      "dateTo": null
    }
  }
}
```

---

## 4. Recent Activity

### Endpoint
```
GET /dashboard/recent-activity
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Number of days to look back |
| `city` | string | - | Filter by city |
| `limit` | number | 20 | Maximum number of activities to return |

### Request Examples
```bash
# Last 7 days, 20 activities (default)
GET /api/police/dashboard/recent-activity

# Last 3 days, 10 activities
GET /api/police/dashboard/recent-activity?days=3&limit=10

# Filter by city
GET /api/police/dashboard/recent-activity?days=7&city=Coimbatore
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "type": "VIOLATION_REPORT",
      "title": "SPEED_VIOLATION violation reported",
      "description": "SPEED_VIOLATION violation in Coimbatore, RS Puram",
      "status": "APPROVED",
      "severity": "MAJOR",
      "reporter": "Rahul Kumar",
      "reviewer": "Commissioner Suresh Kumar",
      "timestamp": "2025-08-24T10:30:00.000Z",
      "location": {
        "city": "Coimbatore",
        "district": "RS Puram"
      }
    }
  ],
  "meta": {
    "timeRange": {
      "days": 7
    },
    "total": 15
  }
}
```

---

## 5. Violation Types Trend

### Endpoint
```
GET /dashboard/violation-types-trend
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateFrom` | string | - | Start date (ISO format) |
| `dateTo` | string | - | End date (ISO format) |
| `days` | number | 30 | Number of days from today |
| `city` | string | - | Filter by city |

### Request Examples
```bash
# Last 30 days (default)
GET /api/police/dashboard/violation-types-trend

# Last 7 days
GET /api/police/dashboard/violation-types-trend?days=7

# Custom date range
GET /api/police/dashboard/violation-types-trend?dateFrom=2025-08-01&dateTo=2025-08-24
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "violationType": "SPEED_VIOLATION",
      "total": 25,
      "approved": 10,
      "rejected": 12,
      "pending": 3
    },
    {
      "violationType": "SIGNAL_JUMPING",
      "total": 15,
      "approved": 6,
      "rejected": 7,
      "pending": 2
    }
  ],
  "meta": {
    "timeRange": {
      "dateFrom": "2025-07-25T00:00:00.000Z",
      "dateTo": null,
      "days": 30
    }
  }
}
```

---

## Frontend Integration Examples

### Multiple Graphs with Different Time Ranges

```javascript
// Example: Fetch different data for different graphs
const fetchDashboardData = async () => {
  const [
    overview,      // Last 30 days
    weeklyTrend,   // Last 7 days
    monthlyTrend,  // Last 12 months
    recentActivity // Last 3 days
  ] = await Promise.all([
    fetch('/api/police/dashboard/overview?days=30'),
    fetch('/api/police/dashboard/weekly-trend?days=7'),
    fetch('/api/police/dashboard/monthly-trend?months=12'),
    fetch('/api/police/dashboard/recent-activity?days=3&limit=10')
  ]);

  const [overviewData, weeklyData, monthlyData, activityData] = await Promise.all([
    overview.json(),
    weeklyTrend.json(),
    monthlyTrend.json(),
    recentActivity.json()
  ]);

  // Update different graphs with their respective data
  updateOverviewChart(overviewData.data);
  updateWeeklyChart(weeklyData.data);
  updateMonthlyChart(monthlyData.data);
  updateActivityFeed(activityData.data);
};
```

### Date Range Picker Integration

```javascript
// Example: Update all graphs when date range changes
const updateDateRange = async (dateFrom, dateTo) => {
  const [
    overview,
    weeklyTrend,
    violationTypes
  ] = await Promise.all([
    fetch(`/api/police/dashboard/overview?dateFrom=${dateFrom}&dateTo=${dateTo}`),
    fetch(`/api/police/dashboard/weekly-trend?dateFrom=${dateFrom}&dateTo=${dateTo}`),
    fetch(`/api/police/dashboard/violation-types-trend?dateFrom=${dateFrom}&dateTo=${dateTo}`)
  ]);

  // Update charts with new data
  // ...
};
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized
- `500`: Internal Server Error

---

## Performance Considerations

1. **Caching**: Consider implementing caching for frequently requested time ranges
2. **Pagination**: For large datasets, consider adding pagination to recent activity
3. **Database Indexing**: Ensure proper indexes on `createdAt`, `city`, and `status` fields
4. **Query Optimization**: Use database views for complex aggregations if needed

---

## Migration from Old API

The old `/dashboard` endpoint is still available for backward compatibility. To migrate:

1. Replace single dashboard calls with specific endpoint calls
2. Update frontend to handle the new response structure
3. Use the `meta.timeRange` information for debugging and display
4. Consider implementing loading states for multiple concurrent requests
