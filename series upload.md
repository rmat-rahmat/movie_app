
# Create TV SERIES Upload Flow (English)

This document describes the TV Series upload flow and related API endpoints.

---

## 1) create a TV series work


**接口地址**:`/api-movie/v1/vod/series/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>创建新的剧集作品，生成seriesId</p>



**请求示例**:

# TV Series Upload Flow

This document describes the TV series upload workflow and related API endpoints.

---

## 1) Create a TV Series

- **Endpoint**: `/api-movie/v1/vod/series/create`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Create a new TV series record and obtain a `seriesId`.

### Request Example

```javascript
{
	"title": "Game of Thrones",
	"description": "An epic fantasy series",
	"coverUrl": "enter image id e.g. 68b00c41f15ac27e096be97d",
	"categoryId": "series",
	"year": 2024,
	"region": "Mainland China",
	"language": "Chinese",
	"director": "Director Name",
	"actors": "/Zhang Luyi/Yu Hewei/Chen Jin",
	"rating": 8.5,
	"tags": ["Drama", "Action"],
	"seasonNumber": 1,
	"totalEpisodes": 20
}
```

### Request Parameters

| Parameter | Description | Location | Required | Type | Schema |
| --------- | ----------- | -------- | -------- | ---- | ------ |
| createSeriesDto | Create series request body | body | true | CreateSeriesDto | CreateSeriesDto |
| &emsp;&emsp;title | Series title |  | true | string | |
| &emsp;&emsp;description | Series description |  | false | string | |
| &emsp;&emsp;coverUrl | Cover image id or URL |  | false | string | |
| &emsp;&emsp;categoryId | Category ID |  | false | string | |
| &emsp;&emsp;year | Year |  | false | integer(int32) | |
| &emsp;&emsp;region | Region |  | false | string | |
| &emsp;&emsp;language | Language |  | false | string | |
| &emsp;&emsp;director | Director |  | false | string | |
| &emsp;&emsp;actors | Actors (supports `/Actor1/Actor2` or `Actor1,Actor2`) |  | false | string | |
| &emsp;&emsp;rating | Rating |  | false | number(double) | |
| &emsp;&emsp;tags | Tags |  | false | array | string |
| &emsp;&emsp;seasonNumber | Season number |  | true | integer(int32) | |
| &emsp;&emsp;totalEpisodes | Total episodes |  | true | integer(int32) | |

### Response Status

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | OK | StandardResponseSeriesOverviewVO |

### Response Fields

| Field | Description | Type | Schema |
| ----- | ----------- | ---- | ------ |
| status | HTTP status code (200) | integer(int32) | integer(int32) |
| code | Business status code | string | |
| success | Whether the request succeeded | boolean | |
| message | Message | string | |
| data | Response data | SeriesOverviewVO | SeriesOverviewVO |
| &emsp;&emsp;seriesId | Series ID | string | |
| &emsp;&emsp;title | Series title | string | |
| &emsp;&emsp;description | Series description | string | |
| &emsp;&emsp;coverUrl | Cover image URL | string | |
| &emsp;&emsp;categoryId | Category ID | string | |
| &emsp;&emsp;year | Year | integer(int32) | |
| &emsp;&emsp;region | Region | string | |
| &emsp;&emsp;language | Language | string | |
| &emsp;&emsp;director | Director | string | |
| &emsp;&emsp;actors | Actors | string | |
| &emsp;&emsp;rating | Rating | number(double) | |
| &emsp;&emsp;tags | Tags | array | string |
| &emsp;&emsp;seasonNumber | Season number | integer(int32) | |
| &emsp;&emsp;totalEpisodes | Total episodes | integer(int32) | |
| &emsp;&emsp;isCompleted | Is the series completed | boolean | |
| &emsp;&emsp;createTime | Creation time | string (date-time) | |
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
		"seriesId": 123456789,
		"title": "Game of Thrones",
		"description": "An epic fantasy series",
		"coverUrl": "https://example.com/cover.jpg",
		"categoryId": "series",
		"year": 2024,
		"region": "Mainland China",
		"language": "Chinese",
		"director": "Director Name",
		"actors": "Zhang Luyi/Yu Hewei/Chen Jin",
		"rating": 8.5,
		"tags": ["Drama","Action"],
		"seasonNumber": 1,
		"totalEpisodes": 20,
		"isCompleted": false,
		"createTime": ""
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

## 2) Create Episodes for a Series

- **Endpoint**: `/api-movie/v1/vod/episodes/create`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Create episode records for a given series. This endpoint does not handle file uploads.

### Request Example

```javascript
{
	"seriesId": 123456789,
	"title": "Episode 1",
	"description": "Description of episode 1",
	"coverUrl": "enter image id e.g. 68b00c41f15ac27e096be97d",
	"episodeNumber": 1,
	"duration": 3600000
}
```

### Request Parameters

| Parameter | Description | Location | Required | Type | Schema |
| --------- | ----------- | -------- | -------- | ---- | ------ |
| createEpisodeDto | Create episode request body | body | true | CreateEpisodeDto | CreateEpisodeDto |
| &emsp;&emsp;seriesId | Series ID |  | true | string | |
| &emsp;&emsp;title | Episode title |  | true | string | |
| &emsp;&emsp;description | Episode description |  | false | string | |
| &emsp;&emsp;coverUrl | Cover image id or URL |  | false | string | |
| &emsp;&emsp;episodeNumber | Episode number |  | true | integer(int32) | |
| &emsp;&emsp;duration | Duration (ms) |  | false | integer(int64) | |

### Response Status

| Status Code | Description | Schema |
| ----------- | ----------- | ------ |
| 200 | OK | StandardResponseEpisodeVO |

### Response Fields

| Field | Description | Type | Schema |
| ----- | ----------- | ---- | ------ |
| status | HTTP status code (200) | integer(int32) | integer(int32) |
| code | Business status code | string | |
| success | Whether the request succeeded | boolean | |
| message | Message | string | |
| data | Response data | EpisodeVO | EpisodeVO |
| &emsp;&emsp;id | Episode ID | string | |
| &emsp;&emsp;uploadId | Upload ID | string | |
| &emsp;&emsp;title | Episode title | string | |
| &emsp;&emsp;description | Episode description | string | |
| &emsp;&emsp;episodeNumber | Episode number | integer(int32) | |
| &emsp;&emsp;seriesId | Series ID | string | |
| &emsp;&emsp;duration | Duration (seconds) | integer(int64) | |
| &emsp;&emsp;fileSize | File size (bytes) | integer(int64) | |
| &emsp;&emsp;coverUrl | Episode cover URL | string | |
| &emsp;&emsp;imageQuality | Image quality info | ImageQualityVO | ImageQualityVO |
| &emsp;&emsp;&emsp;&emsp;customCoverUrl | Custom cover image id | string | |
| &emsp;&emsp;&emsp;&emsp;p144 | 144p image URL | string | |
| &emsp;&emsp;&emsp;&emsp;p360 | 360p image URL | string | |
| &emsp;&emsp;&emsp;&emsp;p720 | 720p image URL | string | |
| &emsp;&emsp;status | Episode status | string | |
| &emsp;&emsp;createTime | Creation time | string (date-time) | |
| &emsp;&emsp;createBy | Created by | string | |
| &emsp;&emsp;updateTime | Update time | string (date-time) | |

### Response Example

```javascript
{
	"status": 0,
	"code": "",
	"success": true,
	"message": "",
	"data": {
		"id": "episode_12345",
		"uploadId": "upload_12345",
		"title": "Episode 1",
		"description": "Description of episode 1",
		"episodeNumber": 1,
		"seriesId": "series_12345",
		"duration": 3600,
		"fileSize": 2147483648,
		"coverUrl": "https://example.com/episode_cover.jpg",
		"imageQuality": {
			"customCoverUrl": "img_12345",
			"p144": "https://cdn.example.com/img_144.jpg",
			"p360": "https://cdn.example.com/img_360.jpg",
			"p720": "https://cdn.example.com/img_720.jpg"
		},
		"status": "ready",
		"createTime": "2024-01-01T00:00:00Z",
		"createBy": "user_001",
		"updateTime": "2024-01-01T00:00:00Z"
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

## 3) Initialize Episode Upload (get upload credentials)

- **Endpoint**: `/api-movie/v1/vod/episodes/upload`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Create upload credentials for a specific episode (used for file upload).

### Request Example

```javascript
{
	"seriesId": 123456789,
	"episodeNumber": 1,
	"fileName": "episode1.mp4",
	"fileSize": 1073741824
}
```

### Request Parameters

| Parameter | Description | Location | Required | Type | Schema |
| --------- | ----------- | -------- | -------- | ---- | ------ |
| api-key | API key | header | true | string | |
| episodeUploadInitDto | Episode upload init request body | body | true | EpisodeUploadInitDto | EpisodeUploadInitDto |
| &emsp;&emsp;seriesId | Series ID |  | true | string | |
| &emsp;&emsp;episodeNumber | Episode number |  | true | integer(int32) | |
| &emsp;&emsp;fileName | File name |  | true | string | |
| &emsp;&emsp;fileSize | File size (bytes) |  | true | integer(int64) | |

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

## 4) Get Pre-signed Upload URL (part)

- **DefaultEndpoint**: `/api/file/upload/part-url/?uploadId={uploadId}&key={key}&partNumber={partNumber}`
- **FallBackEndpoint**: `/api-net/upload/part-url/?uploadId={uploadId}&key={key}&partNumber={partNumber}`
- **Method**: `GET`
- **Request Content-Type**: `application/x-www-form-urlencoded`
- **Response Content-Type**: `*/*`

### Description
Return a pre-signed URL for uploading a specific part (used in multipart uploads).

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

## 5) Upload Part

Upload the content of the part to the returned pre-signed URL and save the returned ETag for each part.

> Save the ETag values — they are required to complete the multipart upload.

Recommended fragment size: 5MB–10MB.

---

## 6) Complete Multipart Upload

- **DefaultEndpoint**: `/api/file/complete`
- **FallBackEndpoint**: `/api-net/upload/complete`
- **Method**: `POST`
- **Request Content-Type**: `application/x-www-form-urlencoded`, `application/json`
- **Response Content-Type**: `*/*`

### Description
Complete the multipart upload and merge all uploaded parts into the final object.

### Request Example

```javascript
{
	"uploadId": "upload_123456",
	"key": "videos/movie.mp4",
	"parts": [
		{
			"PartNumber": 1,
			"ETag": "etag123"
		}
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

## 7) Get Available Playback Qualities

GET:

```
${BASE_URL}/api/file/play/{uploadId}?expires={expires}&signature={signature}
```

Response example:

```json
{ "qualities": ["360p", "720p", "1080p"] }
```

---

## 8) Get Playback URL for a Specific Quality

Use the playback endpoint to fetch the HLS playlist for a specific quality (type):

```
${BASE_URL}/api/file/Play/{uploadID}/{type}.m3u8
```

Parameters: `type` = `360p` | `720p` | `1080p`

Response: HLS (m3u8) playlist URL.

---

If you want, I can also:

- Save this translated file as `series upload.en.md` in the repository.
- Generate an OpenAPI fragment or TypeScript interfaces for these endpoints.
|api-key||header|true|string||

