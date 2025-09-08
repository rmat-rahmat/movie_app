

### Authorization API Reference

	This document describes the authorization-related endpoints used by the service. Each endpoint includes the HTTP method, request content type, parameters, and example request/response bodies.

	Notes:
	- Base path used in examples: `/api-movie/v1/auth`
	- Responses generally follow a standard wrapper object with fields like `status`, `success`, `message`, and `data`.

	---

### Login

- Endpoint: `/api-movie/v1/auth/login`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded` or `application/json`

Description: Authenticate a user and return user info and tokens.

Request example:

```json
## Authorization API Reference

This document describes the authorization-related endpoints used by the service. Each endpoint includes the HTTP method, request content type, parameters, and example request/response bodies.

Notes:
- Base path used in examples: `/api-movie/v1/auth`
- Responses generally follow a standard wrapper object with fields like `status`, `success`, `message`, and `data`.

---

## Important behavior (new)

- Device limit: the platform currently enforces a fixed limit of one logged-in device per user. In future releases this limit will depend on membership level.
- Access token lifetime: 30 minutes. After expiry the client must call the Refresh Token endpoint to obtain a new access token.
- Refresh token lifetime: 30 days. A refresh token is single-use and becomes invalid immediately after it is successfully used to obtain new tokens.

---

## Login

- Endpoint: `/api-movie/v1/auth/login`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded` or `application/json`

Description: Authenticate a user and return user info and tokens. The request must include the device identifier (`deviceId`). The server enforces the device limit policy and may reject login if the device limit is exceeded.

Request example:

```json
{
	"email": "user@example.com",
	"password": "your_password",
	"deviceId": "device-identifier"
}
```

Request parameters:

| Name | Description | In | Required | Type |
| ---- | ----------- | -- | -------- | ---- |
| email | User email | body | yes | string |
| password | User password | body | yes | string |
| deviceId | Device identifier | body | yes | string |

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"id": "507f1f77bcf86cd799439011",
		"email": "user@example.com",
		"token": "jwt-token",
		"refreshToken": "refresh-token",
		"nickname": "User"
	},
	"timestamp": 0
}
```

---

## Refresh Token

- Endpoint: `/api-movie/v1/auth/refresh`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`

Description: Exchange the current access token and refresh token for new tokens. The client must send both the access token and refresh token in request headers.

Required headers:

| Header | Value |
| ------ | ----- |
| Authorization | `<token>` (current access token) |
| refreshToken | `<refreshToken>` (current refresh token) |

Behavior:

- On success the server returns a new `token` and a new `refreshToken` in the response `data` object.
- The previous refresh token becomes invalid as soon as it is used.

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"token": "new-jwt-token",
		"refreshToken": "new-refresh-token"
	}
}
```

---

## Register

- Endpoint: `/api-movie/v1/auth/register`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded` or `application/json`

Description: Create a new user account. The registration process now requires the `deviceId` and an email verification code `emailCaptcha`.

Request example:

```json
{
	"email": "newuser@example.com",
	"password": "secure_password",
	"deviceId": "device-identifier",
	"emailCaptcha": "123456",
	"phone": "",
	"avatar": "",
	"nickname": "NewUser",
	"gender": 0,
	"birthday": ""
}
```

Notes:

- `emailCaptcha` must be obtained by calling `/api-movie/v1/auth/sendEmailCaptcha`.
- After successful registration the API returns the created user's `email`, `token` and `refreshToken` in the response `data` object.

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"email": "newuser@example.com",
		"token": "jwt-token",
		"refreshToken": "refresh-token"
	}
}
```

---

## Send Registration Email Captcha

- Endpoint: `/api-movie/v1/auth/sendEmailCaptcha`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`

Description: Send a verification code to the provided email address for registration.

Request parameters:

| Name | Description | In | Required | Type |
| ---- | ----------- | -- | -------- | ---- |
| email | Target email address | query or form | yes | string |

Response example:

```json
{
	"status": 200,
	"success": true,
	"message": "Verification email sent"
}
```

---

## Update User Info

- Endpoint: `/api-movie/v1/auth/updateUserInfo`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded` or `application/json`

Description: Update the current user's basic profile information. This endpoint does not change passwords. To change a password, use the Change Password endpoint.

Request example:

```json
{
	"phone": "",
	"avatar": "",
	"nickname": "UpdatedName",
	"gender": 0,
	"birthday": ""
}
```

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"id": "507f1f77bcf86cd799439011",
		"email": "user@example.com",
		"nickname": "UpdatedName",
		"token": "jwt-token",
		"refreshToken": "refresh-token"
	}
}
```

---

## Is Logged In

- Endpoint: `/api-movie/v1/auth/isLogin`
- Method: `GET`
- Content-Type: `application/x-www-form-urlencoded`

Description: Check whether the current session or provided token corresponds to a logged-in user.

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"id": "507f1f77bcf86cd799439011",
		"email": "user@example.com",
		"nickname": "User",
		"token": "jwt-token",
		"refreshToken": "refresh-token"
	}
}
```

---

## Change Password

- Endpoint: `/api-movie/v1/auth/changePassword`
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded` or `application/json`

Description: Change the user's password. Provide `oldPassword` and `password` in the request body.

Request example:

```json
{
	"oldPassword": "current_password",
	"password": "new_secure_password"
}
```

Response example:

```json
{
	"status": 200,
	"success": true,
	"message": "Password changed successfully"
}
```

---

## Logout

- Endpoint: `/api-movie/v1/auth/logout`
- Method: `GET`
- Content-Type: `application/x-www-form-urlencoded`

Description: Log out the current user and invalidate the session or tokens as implemented by the server.

Response example:

```json
{
	"status": 200,
	"success": true,
	"message": "Logged out"
}
```

Behavior and frontend responsibilities:

- After a successful logout call the server invalidates the user's `refreshToken`.
- The frontend MUST synchronously remove the locally stored `token` and `refreshToken` immediately after a successful logout response to avoid re-use.

---

Common response wrapper fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| status | integer | HTTP or application status code |
| code | string | Business-specific code |
| success | boolean | Whether the operation succeeded |
| message | string | Human-readable message |
| data | object | Operation-specific data payload |
| timestamp | integer | Server timestamp (ms since epoch) |

If you want this converted to OpenAPI/Swagger or need additional examples, tell me which endpoints to expand.