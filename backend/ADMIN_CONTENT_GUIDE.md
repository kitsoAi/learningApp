# Admin Content Management Guide

## Overview

Admins can create, update, and delete all course content including courses, units, lessons, challenges, and challenge options.

All endpoints require admin authentication (Bearer token from admin login).

## API Endpoints

### Courses

#### Create Course

```http
POST /api/v1/admin/content/courses
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Spanish for Beginners",
  "description": "Learn Spanish from scratch",
  "image_src": "https://example.com/spanish.jpg"
}
```

#### Update Course

```http
PUT /api/v1/admin/content/courses/{course_id}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Spanish for Beginners - Updated",
  "description": "New description"
}
```

#### Delete Course

```http
DELETE /api/v1/admin/content/courses/{course_id}
Authorization: Bearer <admin_token>
```

---

### Units

#### Create Unit

```http
POST /api/v1/admin/content/units
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Unit 1: Greetings",
  "description": "Learn basic greetings",
  "course_id": 1,
  "order_index": 0
}
```

#### Update Unit

```http
PUT /api/v1/admin/content/units/{unit_id}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Unit 1: Basic Greetings",
  "order_index": 1
}
```

#### Delete Unit

```http
DELETE /api/v1/admin/content/units/{unit_id}
Authorization: Bearer <admin_token>
```

---

### Lessons

#### Create Lesson

```http
POST /api/v1/admin/content/lessons
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Lesson 1: Hello & Goodbye",
  "unit_id": 1,
  "order_index": 0
}
```

#### Update Lesson

```http
PUT /api/v1/admin/content/lessons/{lesson_id}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "title": "Lesson 1: Greetings",
  "order_index": 1
}
```

#### Delete Lesson

```http
DELETE /api/v1/admin/content/lessons/{lesson_id}
Authorization: Bearer <admin_token>
```

---

### Challenges

#### Create Challenge

```http
POST /api/v1/admin/content/challenges
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "lesson_id": 1,
  "type": "SELECT",
  "question": "How do you say 'Hello' in Spanish?",
  "order_index": 0
}
```

**Challenge Types:**

- `SELECT` - Multiple choice question
- `ASSIST` - Fill in the blank with word bank
- `SPEAK` - Speaking exercise
- `LISTEN` - Listening comprehension

#### Update Challenge

```http
PUT /api/v1/admin/content/challenges/{challenge_id}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "question": "What is the Spanish word for 'Hello'?",
  "type": "SELECT"
}
```

#### Delete Challenge

```http
DELETE /api/v1/admin/content/challenges/{challenge_id}
Authorization: Bearer <admin_token>
```

---

### Challenge Options

#### Create Challenge Option

```http
POST /api/v1/admin/content/challenges/{challenge_id}/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "text": "Hola",
  "correct": true,
  "image_src": null,
  "audio_src": "https://example.com/audio/hola.mp3"
}
```

#### Update Challenge Option

```http
PUT /api/v1/admin/content/options/{option_id}
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "text": "¡Hola!",
  "correct": true
}
```

#### Delete Challenge Option

```http
DELETE /api/v1/admin/content/options/{option_id}
Authorization: Bearer <admin_token>
```

---

## Complete Example: Creating a Full Lesson

Here's how to create a complete lesson with challenges:

### Step 1: Create a Course

```bash
POST /api/v1/admin/content/courses
{
  "title": "Spanish Basics",
  "description": "Learn fundamental Spanish"
}
# Response: { "id": 1, ... }
```

### Step 2: Create a Unit

```bash
POST /api/v1/admin/content/units
{
  "title": "Unit 1: Greetings",
  "course_id": 1,
  "order_index": 0
}
# Response: { "id": 1, ... }
```

### Step 3: Create a Lesson

```bash
POST /api/v1/admin/content/lessons
{
  "title": "Basic Greetings",
  "unit_id": 1,
  "order_index": 0
}
# Response: { "id": 1, ... }
```

### Step 4: Create a Challenge

```bash
POST /api/v1/admin/content/challenges
{
  "lesson_id": 1,
  "type": "SELECT",
  "question": "How do you say 'Hello'?",
  "order_index": 0
}
# Response: { "id": 1, ... }
```

### Step 5: Add Challenge Options

```bash
# Correct answer
POST /api/v1/admin/content/challenges/1/options
{
  "text": "Hola",
  "correct": true
}

# Wrong answers
POST /api/v1/admin/content/challenges/1/options
{
  "text": "Adiós",
  "correct": false
}

POST /api/v1/admin/content/challenges/1/options
{
  "text": "Gracias",
  "correct": false
}
```

---

## Testing with Swagger UI

1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Login as admin to get token
4. Use the token for all admin/content endpoints
5. Try creating a course, unit, lesson, and challenges

## Important Notes

- **Cascading Deletes**: Deleting a course will delete all its units, lessons, and challenges
- **Order Index**: Use `order_index` to control the display order (0 = first)
- **Authentication**: All endpoints require admin role
- **Validation**: The API validates all required fields and relationships
