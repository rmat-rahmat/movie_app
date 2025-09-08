
# Image Upload API

This document describes the image upload workflow used by the Movie app. The upload process is a multipart / presigned-URL flow backed by S3 (or S3-compatible storage). Steps:

1. Initialize an upload and obtain an uploadId and storage key.
2. Request presigned URLs for each upload part.
3. Upload each part to the presigned URL and collect ETag headers.
4. Complete the multipart upload with the collected parts (PartNumber + ETag).
5. (Optional) Retrieve image metadata / access URL by image ID.

All endpoints expect an `api-key` header (or Authorization when configured). Request/response object names use the `StandardResponse` wrapper shown in examples.

---

## 1) Initialize image upload

- **Endpoint:** `POST /api-movie/v1/init`
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Response:** `StandardResponse<ImageUploadInitVo>`
- **Description:** Create an image upload task. Returns `uploadId` and `key` (storage path).

Request example (JSON):

```json
{
	"title": "logo.png",
	"fileName": "logo.png",
	"contentType": "image/png",
	"fileSize": 102400,
	"totalParts": 1,
	"imageType": "default",
	"description": "Site logo",
	"tags": "landscape,travel,summer"
}
```

Parameters:

| Name | Description | Where | Required | Type | Notes |
|------|-------------|-------|----------|------|-------|
| `api-key` | API key / access header | header | yes | string | or use Authorization header if configured |
| `imageUploadDto` | Upload payload (see fields below) | body | yes | ImageUploadDto | payload fields below |
| `title` | Image title | body | no | string |
| `fileName` | Original file name | body | yes | string |
| `contentType` | MIME type | body | yes | string |
| `fileSize` | File size in bytes | body | yes | integer (int64) |
| `totalParts` | Number of multipart parts | body | yes | integer (int32) |
| `imageType` | Image type (`default` or `cover`) | body | yes | string | `cover` used for video thumbnails |
| `description` | Description | body | no | string |
| `tags` | Comma-separated tags (UTF-8) | body | no | string | max 16 tags, tag length <= 32 chars |

Successful response (fields of interest):

```json
{
	"status": 200,
	"success": true,
	"data": {
		"id": "",
		"uploadId": "<uploadId>",
		"key": "<storage/key/path>"
	}
}
```

---

## 2) Get presigned part URL

- **Endpoint:** `GET /api-net/upload/part-url/?uploadId={uploadId}&key={key}&partNumber={partNumber}`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Response:** `StandardResponse<FileUploadPartVo>`
- **Description:** Returns a presigned URL for uploading a specific part.

Request parameters:

| Name | Description | Where | Required | Type |
|------|-------------|-------|----------|------|
| `uploadId` | Upload ID returned from init | query | yes | string |
| `key` | Storage key/path | query | yes | string |
| `partNumber` | Part index (1-based) | query | yes | integer |
| `api-key` | API key | header | yes | string |

Response example (data field):

```json
{
	"status": 200,
	"success": true,
	"data": {
		"url": "https://example.com/upload?token=xxx&part=1",
		"partNumber": 1,
		"expires": 1640995200000
	}
}
```

The returned `url` is the presigned PUT URL for that part and usually expires after some time.

---

## 3) Upload a part

Upload each part's bytes to the presigned PUT URL returned in Step 2.

- Use HTTP `PUT` to the provided `url`.
- Set `Content-Type: application/octet-stream`.
- After each successful part upload, record the `ETag` response header. The `ETag` is required to complete the multipart upload.

Notes:

- Recommended part size: 5MB–10MB (or the service's recommended range).
- Retry transient failures and preserve the uploaded parts' ETag values.

Example (curl style):

```bash
curl -X PUT "<presigned-url>" \
	-H "Content-Type: application/octet-stream" \
	--data-binary "@part-1.bin"
```

---

## 4) Complete multipart upload

- **Endpoint:** `POST /api-net/upload/complete`
- **Content-Type:** `application/json` or `application/x-www-form-urlencoded`
- **Response:** `StandardResponse<string>`
- **Description:** Tell the server all uploaded parts (PartNumber + ETag) so the backend can finalize the multipart upload.

Request example:

```json
{
	"uploadId": "upload_123456",
	"key": "videos/movie.mp4",
	"parts": [
		{ "PartNumber": 1, "ETag": "etag123" }
	]
}
```

Parameters:

| Name | Description | Where | Required | Type |
|------|-------------|-------|----------|------|
| `uploadId` | Upload ID | body | yes | string |
| `key` | Storage key/path | body | yes | string |
| `parts` | Array of uploaded parts | body | yes | array of { PartNumber, ETag } |

Successful response example (data may be empty or contain a confirmation string):

```json
{
	"status": 200,
	"success": true,
	"data": ""
}
```

---

## 5) Get image information / access URL

- **Endpoint:** `GET /api-movie/v1/images/getImageById`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Response:** `StandardResponse<ImageVo>`
- **Description:** Retrieve metadata and direct access URL for an image by its ID.

Request parameters:

| Name | Description | Where | Required | Type |
|------|-------------|-------|----------|------|
| `id` | Image ID (database key) | query | yes | string |
| `type` | Requested resolution (e.g. `360`, `720`) | query | yes | string |

Response data fields (data = ImageVo) of interest:

| Field | Description |
|-------|-------------|
| `id` | Database primary key (image identifier) |
| `imageId` | Cloud provider image id |
| `title` | Image file title |
| `imageType` | `default` or `cover` |
| `tags` | Comma-separated tags |
| `status` | Provider upload status |
| `description` | Description text |
| `url` | Direct image URL |
| `createBy`, `createTime`, `updateBy`, `updateTime` | Audit fields |

Response example:

```json
{
	"status": 200,
	"success": true,
	"data": {
		"id": "64b7c2f1e4b0a12d34e8a123",
		"imageId": "img-123456",
		"title": "logo.png",
		"imageType": "default",
		"tags": "landscape,travel,summer",
		"status": "Normal",
		"description": "Site logo",
		"url": "https://example.aliyundoc.com/storage/images/logo.png",
		"createBy": "admin",
		"createTime": "2023-07-20T12:34:56.789+08:00",
		"updateBy": "admin",
		"updateTime": "2023-07-21T12:34:56.789+08:00"
	}
}
```

---

Notes & tips:

- Use the `uploadId` and `key` from the initialization response to request part URLs.
- Keep track of each part's ETag header exactly as returned by the storage provider.
- If you expect very large files, choose an appropriate chunk size and concurrency model (the SDK in `src/lib/uploadAPI.ts` uses 8MB chunks by default).
- The API may support both `api-key` header and standard `Authorization: Bearer <token>`—follow your deployment's authentication method.

If you want this document converted into OpenAPI/Swagger or a Postman collection, I can generate that next.
