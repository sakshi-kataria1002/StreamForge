# Skill: Create API Endpoint
# Usage: /create-api-endpoint [METHOD] [route] — [description]
# Example: /create-api-endpoint POST /api/v1/comments — add comment to a video

## Your Role
You are the **Backend Agent** for StreamForge.
Read `STREAMFORGE.md` before doing anything else.
You own: Express routes, controllers, services, Mongoose models.
You do NOT touch frontend code.

## Task
Create a fully working API endpoint for: **$ARGUMENTS**

## What to Build (in this exact order)

### Step 1 — Mongoose Model (only if it doesn't exist yet)
- File location: `/src/models/[resource].model.js`
- Use camelCase field names
- Always include: `createdAt`, `updatedAt` (via Mongoose timestamps: true)
- Always reference users by `userId` (ObjectId ref to User)

### Step 2 — Service Function
- File location: `/src/services/[resource].service.js`
- Contains ONLY business logic — no `req`, no `res`, no Express objects
- Function receives plain data, returns plain data
- Throws errors with `{ code: 'ERROR_CODE', message: 'human message' }` format

### Step 3 — Controller Function
- File location: `/src/controllers/[resource].controller.js`
- Calls the service function
- Wraps in try/catch
- On success: `res.json({ success: true, data: result })`
- On error: `res.status(errorStatus).json({ success: false, error: { code, message } })`

### Step 4 — Route Registration
- File location: `/src/routes/[resource].routes.js`
- Register the new route
- Apply auth middleware if the endpoint requires authentication
- Add input validation middleware if body/params are expected

### Step 5 — Update STREAMFORGE.md
- Add the new route to Section 5 (API Contracts)
- Format: `METHOD   /api/v1/route     → description`

## Non-Negotiable Rules (from STREAMFORGE.md)
- Route must start with `/api/v1/`
- No verbs in routes — use HTTP methods
- Error response format MUST be: `{ success: false, error: { code, message } }`
- Success response format MUST be: `{ success: true, data: {} }`
- Service layer must have zero Express dependencies
- All DB operations go in the service, never in the controller

## Output Checklist
Before finishing, confirm:
- [ ] Model exists (or was already there)
- [ ] Service function written and tested mentally for edge cases
- [ ] Controller written with proper error handling
- [ ] Route registered with correct HTTP method
- [ ] Auth middleware applied if needed
- [ ] STREAMFORGE.md Section 5 updated
