#!/bin/bash
# Test script for friends A, B, C, D scenario
# This tests all the different interval formats

set -e

echo "================================================"
echo "  Group Scheduler - Friends A, B, C, D Test"
echo "================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/sessions/info 2>&1 | grep -q "Cannot GET"; then
  echo "❌ Backend server not running on localhost:3000"
  echo "   Start it with: cd backend && npm start"
  exit 1
fi

echo "✅ Backend server is running"
echo ""

# 1. Create Session (Friend A is host)
echo "📝 Step 1: Creating session (Friend A as host)..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "hostDeviceId": "friend-A-device",
    "constraints": {
      "rangeStart": 1739491200000,
      "rangeEnd": 1740096000000,
      "minDuration": 3600000,
      "maxResults": 10
    }
  }')

SESSION_ID=$(echo $CREATE_RESPONSE | jq -r '.sessionId')
SECRET=$(echo $CREATE_RESPONSE | jq -r '.secret')
JOIN_CODE=$(echo $CREATE_RESPONSE | jq -r '.joinCode')

echo "   Session ID: $SESSION_ID"
echo "   Join Code: $JOIN_CODE"
echo "   ✅ Session created"
echo ""

# 2. All friends join
echo "📝 Step 2: Friends joining session..."
PARTICIPANT_A=$(curl -s -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"secret\": \"$SECRET\"}" | jq -r '.participantId')
echo "   ✅ Friend A joined (Participant ID: ${PARTICIPANT_A:0:8}...)"

PARTICIPANT_B=$(curl -s -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"secret\": \"$SECRET\"}" | jq -r '.participantId')
echo "   ✅ Friend B joined (Participant ID: ${PARTICIPANT_B:0:8}...)"

PARTICIPANT_C=$(curl -s -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"secret\": \"$SECRET\"}" | jq -r '.participantId')
echo "   ✅ Friend C joined (Participant ID: ${PARTICIPANT_C:0:8}...)"

PARTICIPANT_D=$(curl -s -X POST http://localhost:3000/api/sessions/join \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"secret\": \"$SECRET\"}" | jq -r '.participantId')
echo "   ✅ Friend D joined (Participant ID: ${PARTICIPANT_D:0:8}...)"
echo ""

# 3. Upload intervals in different formats
echo "📝 Step 3: Uploading busy intervals (testing various formats)..."

# Friend A: Object format with ISO strings (the problematic format from the bug)
echo "   Friend A: Using object format with ISO date strings..."
RESPONSE_A=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
  -H "Content-Type: application/json" \
  -d "{
    \"participantId\": \"$PARTICIPANT_A\",
    \"secret\": \"$SECRET\",
    \"busyIntervals\": [
      {\"start\": \"2026-02-15T09:00:00Z\", \"end\": \"2026-02-15T10:00:00Z\"},
      {\"start\": \"2026-02-15T14:00:00Z\", \"end\": \"2026-02-15T15:00:00Z\"}
    ]
  }")

if echo $RESPONSE_A | jq -e '.success' > /dev/null; then
  echo "   ✅ Friend A uploaded intervals (object + ISO strings)"
else
  echo "   ❌ Friend A failed: $(echo $RESPONSE_A | jq -r '.error')"
  exit 1
fi

# Friend B: Array format with timestamps (the traditional format)
echo "   Friend B: Using array format with timestamps..."
RESPONSE_B=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
  -H "Content-Type: application/json" \
  -d "{
    \"participantId\": \"$PARTICIPANT_B\",
    \"secret\": \"$SECRET\",
    \"busyIntervals\": [
      [1739512800000, 1739516400000],
      [1739534400000, 1739538000000]
    ]
  }")

if echo $RESPONSE_B | jq -e '.success' > /dev/null; then
  echo "   ✅ Friend B uploaded intervals (array + timestamps)"
else
  echo "   ❌ Friend B failed: $(echo $RESPONSE_B | jq -r '.error')"
  exit 1
fi

# Friend C: Array format with ISO strings (mixed format)
echo "   Friend C: Using array format with ISO date strings..."
RESPONSE_C=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
  -H "Content-Type: application/json" \
  -d "{
    \"participantId\": \"$PARTICIPANT_C\",
    \"secret\": \"$SECRET\",
    \"busyIntervals\": [
      [\"2026-02-16T10:00:00Z\", \"2026-02-16T11:30:00Z\"],
      [\"2026-02-16T14:00:00Z\", \"2026-02-16T16:00:00Z\"]
    ]
  }")

if echo $RESPONSE_C | jq -e '.success' > /dev/null; then
  echo "   ✅ Friend C uploaded intervals (array + ISO strings)"
else
  echo "   ❌ Friend C failed: $(echo $RESPONSE_C | jq -r '.error')"
  exit 1
fi

# Friend D: Object format with timestamps
echo "   Friend D: Using object format with timestamps..."
RESPONSE_D=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
  -H "Content-Type: application/json" \
  -d "{
    \"participantId\": \"$PARTICIPANT_D\",
    \"secret\": \"$SECRET\",
    \"busyIntervals\": [
      {\"start\": 1739620800000, \"end\": 1739624400000}
    ]
  }")

if echo $RESPONSE_D | jq -e '.success' > /dev/null; then
  echo "   ✅ Friend D uploaded intervals (object + timestamps)"
else
  echo "   ❌ Friend D failed: $(echo $RESPONSE_D | jq -r '.error')"
  exit 1
fi

echo ""

# 4. Test error handling
echo "📝 Step 4: Testing error handling..."
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/intervals \
  -H "Content-Type: application/json" \
  -d "{
    \"participantId\": \"$PARTICIPANT_A\",
    \"secret\": \"$SECRET\",
    \"busyIntervals\": [
      {\"start\": \"2026-02-15T15:00:00Z\", \"end\": \"2026-02-15T10:00:00Z\"}
    ]
  }")

if echo $ERROR_RESPONSE | jq -e '.error' > /dev/null; then
  echo "   ✅ Invalid interval correctly rejected"
  echo "      Error: $(echo $ERROR_RESPONSE | jq -r '.details')"
else
  echo "   ❌ Invalid interval should have been rejected"
  exit 1
fi

echo ""

# 5. Check session info
echo "📝 Step 5: Checking session info..."
INFO_RESPONSE=$(curl -s http://localhost:3000/api/sessions/$SESSION_ID/info)
PARTICIPANT_COUNT=$(echo $INFO_RESPONSE | jq -r '.participantCount')
WITH_DATA=$(echo $INFO_RESPONSE | jq -r '.participantsWithData')

echo "   Participants: $PARTICIPANT_COUNT"
echo "   With data: $WITH_DATA"

if [ "$PARTICIPANT_COUNT" -eq 4 ] && [ "$WITH_DATA" -eq 4 ]; then
  echo "   ✅ All participants have uploaded data"
else
  echo "   ❌ Expected 4 participants with data"
  exit 1
fi

echo ""

# 6. Finalize session
echo "📝 Step 6: Finalizing session..."
FINALIZE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/sessions/$SESSION_ID/finalize \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"$SECRET\"}")

RESULT_COUNT=$(echo $FINALIZE_RESPONSE | jq -r '.totalCount')
echo "   Found $RESULT_COUNT common free time slots"

if [ "$RESULT_COUNT" -gt 0 ]; then
  echo "   ✅ Session finalized with results"
else
  echo "   ❌ No results found"
  exit 1
fi

echo ""

# 7. Display results
echo "📝 Step 7: Displaying results..."
echo ""
echo "   Top Common Free Times:"
echo $FINALIZE_RESPONSE | jq -r '.topResults[] | "   • \(.startDate) for \(.duration / 3600000 | floor) hours"'

echo ""
echo "================================================"
echo "  ✅ All tests passed!"
echo "================================================"
echo ""
echo "Summary:"
echo "  • Session created with 4 participants"
echo "  • All 4 interval format types accepted:"
echo "    - Object with ISO strings (Friend A)"
echo "    - Array with timestamps (Friend B)"
echo "    - Array with ISO strings (Friend C)"
echo "    - Object with timestamps (Friend D)"
echo "  • Error handling validated"
echo "  • Session finalized successfully"
echo "  • $RESULT_COUNT common free time slots found"
echo ""
