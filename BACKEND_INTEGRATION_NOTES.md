# Backend Integration Notes - Opening Delay Feature

## Overview
The enhanced Analysis Table includes a new **Opening Delay** column that displays how many seconds the agent took before properly greeting the customer. This document outlines the backend changes needed to support this feature.

## Database Changes

### Add `openingDelay` field to Recording table

**Prisma Schema Update:**
```prisma
model Recording {
  id                String    @id @default(uuid())
  audioPath         String?
  agentId           String?
  language          String?
  transcription     String?   @db.Text
  sentiment         String?
  score             Float?
  openingStatus     String?
  tone              String?
  energyLevel       String?
  activeListening   String?
  empathy           String?
  confidence        String?
  summary           String?   @db.Text
  coachingFeedback  String?   @db.Text
  status            String    @default("Pending")
  statusReason      String?
  result            Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // NEW FIELD
  openingDelay      Float?    // Time in seconds before agent greeting
}
```

### Migration SQL
```sql
-- Add openingDelay column to Recording table
ALTER TABLE `Recording` 
ADD COLUMN `openingDelay` DOUBLE NULL AFTER `openingStatus`;
```

## AI Analysis Enhancement

### Update AI Analysis Service

The AI analysis should calculate the opening delay based on the transcription timing. Here's the recommended approach:

**File:** `apps/api/src/analysis/analysis.service.ts`

```typescript
interface AnalysisResult {
  sentiment: string;
  score: number;
  openingStatus: string;
  openingDelay?: number;  // NEW: Time in seconds
  tone: string;
  energyLevel: string;
  activeListening: string;
  empathy: string;
  confidence: string;
  summary: string;
  coachingFeedback: string;
}

// In your AI analysis function:
private calculateOpeningDelay(transcription: string): number | null {
  try {
    // Example logic - adjust based on your transcription format
    // Assumes transcription has timestamps or you can infer from content
    
    // Method 1: If you have timestamps in transcription
    // Parse first agent greeting timestamp
    const greetingPatterns = [
      /hello/i,
      /hi\s/i,
      /good morning/i,
      /good afternoon/i,
      /good evening/i,
      /thank you for calling/i,
      /welcome to/i,
    ];
    
    // Find first greeting in transcription
    const lines = transcription.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line contains a greeting
      for (const pattern of greetingPatterns) {
        if (pattern.test(line)) {
          // If you have timestamps, calculate delay
          // Example: "00:03.2 Agent: Hello, how can I help you?"
          const timestampMatch = line.match(/(\d+):(\d+)\.(\d+)/);
          if (timestampMatch) {
            const minutes = parseInt(timestampMatch[1]);
            const seconds = parseInt(timestampMatch[2]);
            const milliseconds = parseInt(timestampMatch[3]);
            const totalSeconds = minutes * 60 + seconds + milliseconds / 10;
            return parseFloat(totalSeconds.toFixed(1));
          }
          
          // If no timestamps, estimate based on line position
          // Assuming each line ~2 seconds
          return parseFloat((i * 2).toFixed(1));
        }
      }
    }
    
    // Method 2: If using Whisper with timestamps
    // Whisper API provides word-level timestamps
    // Calculate time of first greeting word
    
    return null;  // Unable to determine
  } catch (error) {
    console.error('Error calculating opening delay:', error);
    return null;
  }
}

// In your analysis method:
async analyzeRecording(recordingId: string) {
  // ... existing code ...
  
  const transcription = await this.transcribeAudio(audioPath);
  const analysisResult = await this.performAIAnalysis(transcription);
  const openingDelay = this.calculateOpeningDelay(transcription);
  
  await prisma.recording.update({
    where: { id: recordingId },
    data: {
      transcription,
      sentiment: analysisResult.sentiment,
      score: analysisResult.score,
      openingStatus: analysisResult.openingStatus,
      openingDelay: openingDelay,  // NEW
      tone: analysisResult.tone,
      // ... rest of fields
    },
  });
}
```

## Alternative: Ask AI to Calculate

If you want the AI (Ollama) to calculate the opening delay, include it in your prompt:

```typescript
const prompt = `
Analyze the following call transcription and provide:

1. Sentiment (Positive/Neutral/Negative)
2. Overall Quality Score (0-100)
3. Opening Status (Proper/Delayed/Missing)
4. Opening Delay (in seconds - how long before agent greeted customer)
5. Tone (Warm/Professional/Calm/Tense/Harsh)
6. Energy Level (High/Medium/Low)
7. Active Listening (Excellent/Good/Fair/Poor)
8. Empathy Score
9. Confidence Score
10. Summary
11. Coaching Feedback

Transcription:
${transcription}

Provide response in JSON format:
{
  "sentiment": "...",
  "score": 0-100,
  "openingStatus": "...",
  "openingDelay": 0.0,  // Time in seconds
  "tone": "...",
  ...
}
`;
```

## API Response Format

### GET /analysis/recordings

**Updated Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recording-123",
      "agentId": "agent-456",
      "language": "English",
      "transcription": "...",
      "sentiment": "Positive",
      "score": 92,
      "openingStatus": "Proper",
      "openingDelay": 0.8,  // NEW: Time in seconds
      "tone": "Warm",
      "energyLevel": "High",
      "activeListening": "Excellent",
      "status": "Completed",
      "createdAt": "2026-07-07T10:30:00Z",
      "updatedAt": "2026-07-07T10:35:00Z"
    }
  ]
}
```

### GET /analysis/:id

**Updated Response:**
```json
{
  "success": true,
  "data": {
    "id": "recording-123",
    "agentId": "agent-456",
    "language": "English",
    "transcription": "Full transcription text...",
    "sentiment": "Positive",
    "score": 92,
    "openingStatus": "Proper",
    "openingDelay": 0.8,  // NEW
    "tone": "Warm",
    "energyLevel": "High",
    "activeListening": "Excellent",
    "empathy": "High",
    "confidence": "Strong",
    "summary": "Agent provided excellent customer service...",
    "coachingFeedback": "Continue this level of performance...",
    "status": "Completed",
    "statusReason": null,
    "result": {},
    "createdAt": "2026-07-07T10:30:00Z",
    "updatedAt": "2026-07-07T10:35:00Z"
  }
}
```

## Frontend Handling

The frontend already handles the `openingDelay` field gracefully:

### If `openingDelay` is present:
- Displays color-coded badge (Green/Yellow/Red)
- Shows formatted time (e.g., "0.8 sec", "3.2 sec")
- Provides tooltip explanation

### If `openingDelay` is `null` or missing:
- Shows "N/A" in gray
- Tooltip: "Opening delay not available"

### If record is still processing:
- Shows current status (e.g., "Transcribing...")
- Styled in italics with info color

## Testing Recommendations

### Test Cases:

1. **Excellent Opening (0-2 seconds)**
   ```json
   { "openingDelay": 0.8 }
   ```
   Expected: Green badge "0.8 sec"

2. **Slight Delay (2-5 seconds)**
   ```json
   { "openingDelay": 3.2 }
   ```
   Expected: Yellow badge "3.2 sec"

3. **Late Opening (5+ seconds)**
   ```json
   { "openingDelay": 8.6 }
   ```
   Expected: Red badge "8.6 sec"

4. **Not Available**
   ```json
   { "openingDelay": null }
   ```
   Expected: Gray "N/A"

5. **Still Processing**
   ```json
   { "openingDelay": null, "status": "Transcribing" }
   ```
   Expected: "Transcribing..." in italics

## Performance Considerations

1. **Index the field** for filtering/sorting:
   ```sql
   CREATE INDEX idx_recording_opening_delay ON Recording(openingDelay);
   ```

2. **Default value:** Use `null` (not `0`) to distinguish between:
   - `null` = Not calculated yet
   - `0.0` = Instant greeting (unrealistic but possible)
   - `0.8` = Very fast greeting (typical good performance)

3. **Precision:** Store as `Float` (DOUBLE in MySQL) with 1 decimal precision for display

## Sample Data for Testing

```sql
-- Excellent opening
UPDATE Recording 
SET openingDelay = 0.8 
WHERE id = 'test-record-1';

-- Slight delay
UPDATE Recording 
SET openingDelay = 3.2 
WHERE id = 'test-record-2';

-- Late opening
UPDATE Recording 
SET openingDelay = 8.6 
WHERE id = 'test-record-3';

-- Not available
UPDATE Recording 
SET openingDelay = NULL 
WHERE id = 'test-record-4';
```

## Backwards Compatibility

✅ **Fully backwards compatible**
- Existing records without `openingDelay` will show "N/A"
- No breaking changes to API
- Optional field - won't cause errors if missing
- Frontend handles all states gracefully

## Future Enhancements

1. **Filtering by opening delay:**
   ```typescript
   GET /analysis/recordings?openingDelayMax=2
   ```

2. **Analytics:**
   - Average opening delay per agent
   - Opening delay trends over time
   - Correlation between opening delay and customer satisfaction

3. **Alerts:**
   - Trigger alert if agent consistently has >5 second delays
   - Dashboard widget showing opening delay distribution

## Implementation Checklist

Backend Team:
- [ ] Add `openingDelay` field to Prisma schema
- [ ] Create and run database migration
- [ ] Update `AnalysisService` to calculate opening delay
- [ ] Test calculation logic with sample transcriptions
- [ ] Update API response to include `openingDelay`
- [ ] Add database index for performance
- [ ] Update API documentation
- [ ] Create sample test data
- [ ] Deploy to staging environment
- [ ] Verify frontend display works correctly

Frontend Team:
- [x] Enhanced AnalysisTable with Opening Delay column
- [x] Color-coded badges (Green/Yellow/Red)
- [x] Tooltips with explanations
- [x] Handles null/missing values
- [x] Processing state handling
- [x] Responsive design
- [x] Accessibility features

## Questions?

Contact the frontend team if you need clarification on:
- Expected data format
- Edge case handling
- Display requirements
- Testing scenarios

---

**Note:** The frontend is ready to consume this data. Once the backend implements the `openingDelay` calculation and includes it in the API response, the feature will automatically work without any frontend changes needed.
