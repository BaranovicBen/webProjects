# Group Scheduler MVP

A secure, single-use group scheduling application that finds common free time from calendar data.

## Architecture

### Backend: Node.js + Express
**Why Node.js over Firebase?**
- **Full control over security**: Custom token hashing, encryption, and rate limiting
- **Stateless architecture**: Easier to scale horizontally
- **Simple deployment**: Can run on any Node.js host
- **No vendor lock-in**: Can migrate storage layer independently
- **Better for interval computation**: CPU-intensive algorithm runs efficiently on server

### Frontend: React Native + Expo
- Cross-platform mobile app (iOS & Android)
- Web deployment support via Expo
- Fast development iteration

## Project Structure

```
group-scheduler/
├── backend/
│   ├── src/
│   │   ├── config.js              # Configuration
│   │   ├── server.js              # Express server
│   │   ├── utils/
│   │   │   ├── crypto.js          # Cryptographic functions
│   │   │   └── intervals.js       # Interval algorithms
│   │   ├── services/
│   │   │   ├── sessionStore.js    # In-memory session storage
│   │   │   └── sessionService.js  # Business logic
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js     # Rate limiting
│   │   │   └── errorHandler.js    # Error handling
│   │   └── routes/
│   │       └── sessions.js        # API endpoints
│   └── tests/
│       └── intervals.test.js      # Unit tests
├── mobile-app/
│   ├── src/
│   │   ├── screens/               # React Native screens
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   └── utils/
│   │       └── icalParser.js     # iCal parsing
│   └── App.js                     # Main app component
└── samples/
    └── sample.ics                 # Sample iCal file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (optional, will be installed automatically)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Mobile App Setup

1. Navigate to mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npx expo start
```

4. Run on your device:
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `w` to open in web browser
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)

## API Endpoints

### POST /api/sessions
Create a new session
```json
{
  "hostDeviceId": "device-abc123",
  "constraints": {
    "rangeStart": 1234567890000,
    "rangeEnd": 1234567890000,
    "minDuration": 3600000,
    "maxResults": 10
  }
}
```

### POST /api/sessions/join
Join an existing session
```json
{
  "sessionId": "session-uuid",
  "secret": "secret-token"
}
```

### POST /api/sessions/:sessionId/intervals
Upload busy intervals
```json
{
  "participantId": "participant-uuid",
  "secret": "secret-token",
  "busyIntervals": [[start, end], ...]
}
```

### POST /api/sessions/:sessionId/finalize
Finalize session and compute results
```json
{
  "secret": "secret-token"
}
```

### GET /api/sessions/:sessionId/results?secret=xxx
Get session results

### GET /api/sessions/:sessionId/info
Get public session info (no auth required)

## Security Implementation

### Token Generation
- 256-bit cryptographically secure random tokens
- bcrypt hashing with salt rounds = 10
- Secrets never stored, only hashes

### One-Time Access
- Sessions lock after finalization
- TTL: 24 hours default (configurable)
- Hard delete after expiry

### Data Minimization
- Only busy intervals stored, no event details
- Data encrypted at rest using AES
- HTTPS required in production

### Rate Limiting
- API: 100 requests / 15 minutes per IP
- Session creation: 10 / hour per IP
- Join attempts: 20 / 15 minutes per IP

### Access Control
- Token verification on every request
- No token reuse after session lock
- Join codes map to session but still require secret

## Algorithm: Deterministic Interval Intersection

**NO MACHINE LEARNING** - This is a pure computational geometry problem.

### Algorithm Steps

1. **Normalize**: Merge overlapping intervals per participant
2. **Clip**: Restrict to requested date range
3. **Compute Free**: Calculate free intervals for each participant
4. **Intersect**: Find common free times across all participants
5. **Filter**: Apply time windows and minimum duration
6. **Rank**: Sort by simple heuristics (duration, date, weekend)

### Complexity Analysis
- Time: O(n log n + m) where n = total intervals, m = intersections
- Space: O(n)
- Deterministic and fast for typical use cases (<100 participants)

### Why No ML?
- **Correctness**: Enumerating free times is exact computation, not prediction
- **No training data**: Single-use sessions provide no historical data
- **Privacy**: No long-term data storage to train on
- **Performance**: Deterministic algorithm is faster and predictable

### Future ML Use Cases
- **Ranking**: Predict preferred times based on past selections
- **Suggestions**: When no full overlap, suggest best compromises
- **Optimization**: Cluster near-miss alternatives
- **Requires**: User accounts and historical data (post-MVP)

## Demo Flow

1. **Create Session**
   - Set date range: 7 days
   - Set minimum duration: 60 minutes
   - Get session ID, secret, and join code

2. **Share Invite**
   - Copy invite link or join code
   - Send to participants

3. **Join Session**
   - Paste session ID/code and secret
   - Import calendar (iCal format)

4. **Import Calendar**
   - Use sample data or paste iCal content
   - Parse to extract busy intervals
   - Upload availability

5. **Finalize & View Results**
   - Host finalizes session
   - View ranked common free times
   - Session locks and expires

## Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Test Coverage
- Interval merging
- Interval intersection
- Range clipping
- Duration filtering
- Time window application
- Full algorithm integration

## Sample iCal File

See `samples/sample.ics` for a working example.

## Future Improvements (Priority Order)

1. **Persistent Storage**: Replace in-memory store with database (PostgreSQL/MongoDB)
2. **Push Notifications**: Notify participants when all data is ready
3. **Calendar Export**: Export selected time slots to iCal
4. **Partial Overlap**: Show slots with N-1 participants available
5. **Advanced Recurrence**: Support more RRULE patterns (daily, monthly)
6. **Time Zone Support**: Better handling of multiple time zones
7. **User Accounts**: Optional accounts for history and preferences
8. **ML Ranking**: Learn preferred times from historical selections
9. **Conflict Resolution**: Smart suggestions when no perfect overlap
10. **Video Call Integration**: Auto-create Zoom/Meet links for selected slots

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
SESSION_TTL=86400000
ENCRYPTION_KEY=your-32-character-encryption-key-here
NODE_ENV=development
```

## Security Notes for Production

1. **Change encryption key**: Use a strong, random 32-character key
2. **Enable HTTPS**: Use TLS certificates (Let's Encrypt)
3. **Secure headers**: Add helmet.js middleware
4. **Database encryption**: Encrypt data at rest in database
5. **Monitoring**: Add logging and alerting for security events
6. **Input validation**: Add comprehensive input sanitization
7. **CORS**: Restrict to known origins only
8. **Rate limiting**: Consider Redis for distributed rate limiting

## License

MIT

## Authors

Built as an MVP for secure group scheduling with privacy-first design.
