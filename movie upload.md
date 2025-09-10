
# Movie Upload Flow

This document describes the movie upload workflow and related API endpoints.

---

## 1) Create Movie (Obtain Upload Credential)

- **Endpoint**: `/api-movie/v1/vod/upload`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Create an upload credential for a movie. Use the returned `uploadId` and `key` to perform multipart upload.

### Request Example

```javascript
{
	"title": "Sample Movie",
	"fileName": "movie.mp4",
	"fileSize": 1073741824,
	"description": "A great movie",
	"coverUrl": "https://example.com/cover.jpg",
	"customCoverUrl": "image id e.g. 68b00c41f15ac27e096be97d",
	"duration": 7200000,
	"categoryId": "movie",
	"year": 2024,
	"region": "Mainland China",
	"language": "Chinese",
	"director": "Director Name",
	"actors": "/Zhang Luyi/Yu Hewei/Chen Jin",
	"rating": 8.5,
	"tags": ["Drama", "Action"]
}
```

### Request Parameters

| Parameter | Description | Location | Required | Type | Schema |
| --------- | ----------- | -------- | -------- | ---- | ------ |
| api-key | API key | header | true | string | |
| vodUploadDto | Movie upload request body | body | true | VodUploadDto | VodUploadDto |
| &emsp;&emsp;title | Title |  | true | string | |
| &emsp;&emsp;fileName | File name |  | true | string | |
| &emsp;&emsp;fileSize | File size (bytes) |  | false | integer(int64) | |
| &emsp;&emsp;description | Description |  | false | string | |
| &emsp;&emsp;coverUrl | Cover image URL |  | false | string | |
| &emsp;&emsp;customCoverUrl | Custom cover image id |  | false | string | |
| &emsp;&emsp;duration | Duration (ms) |  | false | integer(int64) | |
| &emsp;&emsp;categoryId | Category ID |  | false | string | |
| &emsp;&emsp;year | Year |  | false | integer(int32) | |
| &emsp;&emsp;region | Region |  | false | string | |
| &emsp;&emsp;language | Language |  | false | string | |
| &emsp;&emsp;director | Director |  | false | string | |
| &emsp;&emsp;actors | Actors (supports `/Actor1/Actor2` or `Actor1,Actor2`) |  | false | string | |
| &emsp;&emsp;rating | Rating |  | false | number(double) | |
| &emsp;&emsp;tags | Tags |  | false | array | string |

### Response Status

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | OK | StandardResponseUploadVideoVo |

### Response Fields

| Field | Description | Type | Schema |
| ----- | ----------- | ---- | ------ |
| status | HTTP status code (200) | integer(int32) | integer(int32) |
| code | Business status code | string | |
| success | Whether the request succeeded | boolean | |
| message | Message | string | |
| data | Response data | UploadVideoVo | UploadVideoVo |
| &emsp;&emsp;uploadId | Upload task ID | string | |
| &emsp;&emsp;key | S3 object key / path | string | |
| timestamp | Timestamp | integer(int64) | integer(int64) |
| errorId | Error ID | string | |
| path | Request path | string | |
| error | Error details | ErrorDetail | ErrorDetail |
| validationErrors | Validation errors | array | ValidationError |
| pageInfo | Pagination info | PageInfo | PageInfo |
| metadata | Additional metadata | object | |
| clientError | Client error flag | boolean | |
| serverError | Server error flag | boolean | |

### Response Example

```javascript
{
	"status": 0,
	"code": "",
	"success": true,
	"message": "",
	"data": {
		"uploadId": "upload_123456",
		"key": "videos/movie.mp4"
	},
	"timestamp": 0,
	"errorId": "",
	"path": "",
	"error": null,
	"validationErrors": [],
	"pageInfo": null,
	"metadata": {},
	"clientError": false,
	"serverError": false
}
```

---

## 2) Get Pre-signed Upload URL for a Part

- **DefaultEndpoint**: `/api/file/upload/part-url/?uploadId={uploadId}&key={key}&partNumber={partNumber}`
- **FallbackEndpoint**: `/api-net/upload/part-url/?uploadId={uploadId}&key={key}&partNumber={partNumber}`
- **Method**: `GET`
- **Request Content-Type**: `application/x-www-form-urlencoded`
- **Response Content-Type**: `*/*`

### Description
Get a pre-signed URL for a specific part number (used for multipart upload).

### Request Parameters

| Parameter | Description | Location | Required | Type |
| --------- | ----------- | -------- | -------- | ---- |
| uploadId | Upload task ID | query | true | string |
| key | S3 object key | query | true | string |
| partNumber | Part number | query | true | integer(int32) |
| api-key | API key | header | true | string |

### Response Status

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | OK | StandardResponseFileUploadPartVo |

### Response Fields

| Field | Description | Type |
| ----- | ----------- | ---- |
| status | HTTP status code (200) | integer(int32) |
| code | Business status code | string |
| success | Whether successful | boolean |
| message | Message | string |
| data | File upload part info | FileUploadPartVo |
| &emsp;&emsp;url | Pre-signed upload URL for the part | string |
| &emsp;&emsp;partNumber | Part number | integer(int32) |
| &emsp;&emsp;expires | Expiration timestamp (ms) | integer(int64) |

### Response Example

```javascript
{
	"status": 0,
	"code": "",
	"success": true,
	"message": "",
	"data": {
		"url": "https://example.com/upload?token=xxx&part=1",
		"partNumber": 1,
		"expires": 1640995200000
	},
	"timestamp": 0,
	"errorId": "",
	"path": "",
	"error": null,
	"validationErrors": [],
	"pageInfo": null,
	"metadata": {},
	"clientError": false,
	"serverError": false
}
```

---

## 3) Upload Part

Upload each part's content to the returned pre-signed URL and record the returned ETag for each part.

> Save the ETag values — they are required to complete the multipart upload.

Recommended fragment size: 5MB–10MB.

---

## 4) Complete Multipart Upload

- **DefaultEndpoint**: `/api/file/complete`
- **FallBackEndpoint**: `/api-net/upload/complete`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Finish the multipart upload by sending the list of parts (PartNumber + ETag) so the server can assemble the final object.

### Request Example

```javascript
{
	"uploadId": "upload_123456",
	"key": "videos/movie.mp4",
	"parts": [
		{ "PartNumber": 1, "ETag": "etag123" }
	]
}
```

### Request Parameters

| Parameter | Description | Location | Required | Type |
| --------- | ----------- | -------- | -------- | ---- |
| api-key | API key | header | true | string |
| fileUploadCompleteDto | Complete upload request body | body | true | FileUploadCompleteDto |
| &emsp;&emsp;uploadId | Upload ID |  | true | string |
| &emsp;&emsp;key | File key |  | true | string |
| &emsp;&emsp;parts | Parts list |  | true | array (UploadPart) |
| &emsp;&emsp;&emsp;&emsp;PartNumber | Part number |  | true | integer(int32) |
| &emsp;&emsp;&emsp;&emsp;ETag | ETag |  | true | string |

### Response Status

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | OK | StandardResponseBoolean |

### Response Example

```javascript
{
	"status": 0,
	"code": "",
	"success": true,
	"message": "",
	"data": true,
	"timestamp": 0,
	"errorId": "",
	"path": "",
	"error": null,
	"validationErrors": [],
	"pageInfo": null,
	"metadata": {},
	"clientError": false,
	"serverError": false
}
```

---

## 5) Get playback quality list (from S3)

Call the file API to retrieve the available quality levels for the uploaded video:

```
${BASE_URL}/api/file/play/{uploadId}?expires={expires}&signature={signature}
```

Replace `{uploadId}`, `{expires}`, and `{signature}` with the actual values.

Response example:

```json
{ "qualities": ["360p", "720p", "1080p"] }
```

---

## 6) Get playback URL for a specific quality

Use the playback endpoint to fetch the HLS playlist for a specific quality (type):

```
${BASE_URL}/api/file/Play/{uploadID}/{type}.m3u8
```

Parameters: `type` = `360p` | `720p` | `1080p`

Response: HLS (m3u8) playlist URL.

---

If you want, I can also:

- Save this translated file as `movie upload.en.md` in the repository.
- Generate an OpenAPI fragment or TypeScript interfaces for these endpoints.

