# Group Scheduler MVP - Demo Script

This script walks through a complete demo of the Group Scheduler MVP.

## Prerequisites

Terminal 1: Start the backend server
```bash
cd group-scheduler/backend
npm start
```

Terminal 2: Start the mobile app
```bash
cd group-scheduler/mobile-app
npx expo start
```

## Demo Flow

### Part 1: Host Creates Session

1. **Open the app** in Expo Go or web browser
2. **Tap "Create New Session"**
3. **Configure session**:
   - Minimum Duration: 60 minutes
   - Date Range: 7 days
4. **Tap "Create Session"**
5. **Note the session details**:
   - Session ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Join Code: `ABC123`
   - Secret: Long hex string (keep this secure!)
6. **Copy the invite link**: `groupscheduler://join/...`

### Part 2: Host Imports Calendar

1. **Tap "Import My Calendar"**
2. **Tap "Use Sample Data"** to load example iCal
3. **Tap "Parse Calendar"**
   - Should show: "Parsed X busy time slots"
4. **Review busy intervals** (preview first 5)
5. **Tap "Upload Availability"**
   - Success message appears
6. **Navigate to Results screen**

### Part 3: Participant Joins

**Simulate a second participant:**

1. **Restart app** or use different device/browser
2. **Tap "Join Session"**
3. **Enter credentials**:
   - Session ID: Paste from host
   - Secret: Paste from host
4. **Tap "Join Session"**
5. **Import participant's calendar**:
   - Use sample data (slightly modified schedule)
   - Parse and upload

### Part 4: Finalize and View Results

1. **Return to Results screen**
2. **Check session status**:
   - Participants: 2
   - With Data: 2
   - State: open
3. **Tap "Finalize Session"**
   - Session state changes to "locked"
   - Results are computed
4. **View common free times**:
   - Shows ranked list of available slots
   - Each slot shows:
     - Time and date
     - Duration
     - Weekend badge if applicable
5. **Select a time** (in future version)

## API Testing with cURL

### 1. Create Session
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "hostDeviceId": "demo-device-001",
    "constraints": {
      "rangeStart": '$(date +%s)'000,
      "rangeEnd": '$(date -d "+7 days" +%s)'000,
      "minDuration": 3600000,
      "maxResults": 10
    }
  }'
```

Save the `sessionId`, `secret`, and `joinCode` from the response.

### 2. Join Session
```bash
curl -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID_HERE",
    "secret": "SECRET_HERE"
  }'
```

Save the `participantId` from the response.

### 3. Upload Busy Intervals
```bash
curl -X POST http://localhost:3000/api/sessions/SESSION_ID_HERE/intervals \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "PARTICIPANT_ID_HERE",
    "secret": "SECRET_HERE",
    "busyIntervals": [
      [1705312800000, 1705316400000],
      [1705327200000, 1705330800000]
    ]
  }'
```

### 4. Finalize Session
```bash
curl -X POST http://localhost:3000/api/sessions/SESSION_ID_HERE/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "SECRET_HERE"
  }'
```

### 5. Get Results
```bash
curl "http://localhost:3000/api/sessions/SESSION_ID_HERE/results?secret=SECRET_HERE"
```

### 6. Get Session Info
```bash
curl "http://localhost:3000/api/sessions/SESSION_ID_HERE/info"
```

## Sample Scenarios

### Scenario A: Perfect Overlap
**Participants**: Alice, Bob
**Alice busy**: Mon 9am-12pm, Tue 2pm-4pm
**Bob busy**: Mon 2pm-5pm, Wed 10am-11am
**Result**: Multiple common free times on Mon afternoon, Tue morning, Thu-Fri

### Scenario B: No Overlap
**Participants**: Charlie, Dana
**Charlie busy**: Mon-Wed 9am-5pm
**Dana busy**: Mon-Wed 9am-5pm
**Result**: No common free times in work hours, suggest evenings or Thu-Fri

### Scenario C: Minimal Overlap
**Participants**: Eve, Frank, Grace
**Eve busy**: All day Mon-Tue
**Frank busy**: All day Wed-Thu  
**Grace busy**: All mornings
**Result**: Small windows on Wed-Thu afternoons

## Testing Security Features

### Test 1: Invalid Secret
```bash
curl -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "VALID_SESSION_ID",
    "secret": "wrong-secret-123"
  }'
```
Expected: HTTP 500 with error "Invalid secret"

### Test 2: Expired Session
1. Create session with 1 minute TTL
2. Wait 2 minutes
3. Try to join
Expected: Error "Session is not accessible (locked or expired)"

### Test 3: Rate Limiting
```bash
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/sessions/join \
    -H "Content-Type: application/json" \
    -d '{"sessionId": "fake", "secret": "fake"}'
done
```
Expected: After 20 attempts, HTTP 429 "Too many join attempts"

### Test 4: Locked Session Access
1. Create and finalize a session
2. Try to upload more intervals
Expected: Error "Session is not accessible"

## Performance Testing

### Load Test: Multiple Participants
```bash
# Create session
SESSION_ID="..."
SECRET="..."

# Simulate 10 participants joining and uploading
for i in {1..10}; do
  # Join
  PARTICIPANT=$(curl -s -X POST http://localhost:3000/api/sessions/join \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_ID\", \"secret\": \"$SECRET\"}" \
    | jq -r '.participantId')
  
  # Upload intervals
  curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
    -H "Content-Type: application/json" \
    -d "{
      \"participantId\": \"$PARTICIPANT\",
      \"secret\": \"$SECRET\",
      \"busyIntervals\": [[1705312800000, 1705316400000]]
    }"
done

# Finalize
time curl -X POST http://localhost:3000/api/sessions/$SESSION_ID/finalize \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"$SECRET\"}"
```

Expected: Finalization completes in <100ms for 10 participants

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 18+)
- Check port 3000 is not in use: `lsof -i :3000`
- Check dependencies: `npm install`

### Mobile app errors
- Check backend URL in `src/services/api.js`
- For physical device, use machine IP instead of localhost
- Check Expo CLI is installed: `npx expo --version`

### iCal parsing fails
- Verify iCal format is valid
- Check date range includes the events
- Ensure DTSTART and DTEND are present

### No common free times
- Check if constraints are too restrictive
- Verify time windows overlap with participant availability
- Reduce minDuration requirement

## Next Steps After Demo

1. Deploy backend to cloud (Heroku, Railway, AWS)
2. Build standalone apps with `npx expo build`
3. Add persistent database (PostgreSQL)
4. Implement push notifications
5. Add calendar export feature
6. Enhance UI/UX with animations
7. Add more iCal format support
8. Implement offline mode
9. Add unit tests for components
10. Set up CI/CD pipeline

## Demo Recording Checklist

- [ ] Show clean home screen
- [ ] Create session with clear credentials display
- [ ] Copy and paste invite link
- [ ] Import and parse sample iCal
- [ ] Upload availability successfully
- [ ] Show session info with participant count
- [ ] Join as second participant
- [ ] Upload second participant's availability
- [ ] Finalize session
- [ ] View and explain results
- [ ] Highlight security features (encryption, one-time use)
- [ ] Show session becomes locked after finalization
