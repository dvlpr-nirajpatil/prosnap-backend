# Chat API and Socket Events

Base URL: `/api/v1`

All chat endpoints require auth header:
`Authorization: Bearer <accessToken>`

## 1) Create Conversation
- Method: `POST`
- URL: `/conversation`
- Body:
```json
{
  "receiverId": "<userId>"
}
```
- Response data:
```json
{
  "conversationId": "<conversationId>"
}
```

## 2) Get Conversation List
Only conversations with non-empty last message are returned.

- Method: `GET`
- URL: `/conversation?page=1&limit=20`
- Response data:
```json
{
  "conversations": [
    {
      "_id": "<conversationId>",
      "opponent": {
        "_id": "<userId>",
        "userName": "john_doe",
        "name": "John Doe",
        "profilePicture": "https://...",
        "isVerified": false
      },
      "lastMessage": {
        "text": "Hello",
        "image": null,
        "sender": "<userId>",
        "createdAt": "2026-02-26T00:00:00.000Z"
      },
      "createdAt": "2026-02-26T00:00:00.000Z",
      "updatedAt": "2026-02-26T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

## 3) Get Chat Details (Header Data)
Returns opposite user details for chat screen.

- Method: `GET`
- URL: `/message/:conversationId/details`

## 4) Send Message
- Method: `POST`
- URL: `/message`
- Body:
```json
{
  "conversationId": "<conversationId>",
  "text": "Hi",
  "image": null
}
```
Rules:
- At least one of `text` or `image` is required.

## 5) Get Messages By Conversation
- Method: `GET`
- URL: `/message/:conversationId?page=1&limit=30`
- Sorted oldest to newest.

## 6) View Messages (Mark as Seen)
Marks all unseen messages in this conversation as seen where sender is opposite user.

- Method: `POST`
- URL: `/message/:conversationId/view`
- Response data:
```json
{
  "conversationId": "<conversationId>",
  "updatedCount": 4,
  "seenAt": "2026-02-26T00:00:00.000Z"
}
```

## 7) Typing Indicator API
- Method: `POST`
- URL: `/message/typing`
- Body:
```json
{
  "conversationId": "<conversationId>",
  "isTyping": true
}
```

---

# Socket Integration

## Connect
- Use socket auth token:
```js
const socket = io(SOCKET_URL, {
  auth: { token: accessToken }
});
```

## Events Frontend Should Listen

### `new-message`
Triggered when opposite user sends a message.
Payload:
```json
{
  "conversationId": "<conversationId>",
  "message": {
    "_id": "<messageId>",
    "conversation": "<conversationId>",
    "sender": {
      "_id": "<userId>",
      "userName": "john_doe",
      "name": "John Doe",
      "profilePicture": "https://...",
      "isVerified": false
    },
    "text": "Hi",
    "image": null,
    "status": "unseen",
    "createdAt": "2026-02-26T00:00:00.000Z"
  }
}
```

### `typing-indicator`
Triggered when opposite user typing state changes.
Payload:
```json
{
  "conversationId": "<conversationId>",
  "userId": "<opponentUserId>",
  "isTyping": true,
  "timestamp": "2026-02-26T00:00:00.000Z"
}
```

### `messages-seen`
Triggered when opposite user opens the chat and messages become seen.
Payload:
```json
{
  "conversationId": "<conversationId>",
  "seenBy": "<opponentUserId>",
  "seenAt": "2026-02-26T00:00:00.000Z",
  "updatedCount": 4
}
```

## Recommended Frontend Flow
1. Open conversation screen -> call `GET /message/:conversationId/details` and `GET /message/:conversationId`.
2. Immediately call `POST /message/:conversationId/view`.
3. While typing -> call `POST /message/typing` with `isTyping: true`; on stop/blur/send call with `isTyping: false`.
4. On send -> call `POST /message`.
5. Listen to `new-message`, `typing-indicator`, `messages-seen` and update UI state.
