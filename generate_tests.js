
const fs = require('fs');
const path = require('path');

const COLLECTION_NAME = "Linkivo API Tests";
const BASE_URL_VAR = "{{base_url}}";

const collection = {
    "info": {
        "name": COLLECTION_NAME,
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "0. Setup & Auth",
            "item": [
                {
                    "name": "Health Check",
                    "request": {
                        "method": "GET",
                        "header": [],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/health`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "health"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "name": "1. User Profile",
            "item": [
                {
                    "name": "Get User Profile",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" }
                        ],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/users/profile`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "users", "profile"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "var jsonData = pm.response.json();",
                                    "pm.test(\"Has user data\", function () {",
                                    "    pm.expect(jsonData.success).to.be.true;",
                                    "    pm.expect(jsonData.data).to.have.property('username');",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "name": "2. AI Career Coach",
            "item": [
                {
                    "name": "Get Roadmap Status",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" }
                        ],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/enhanced-ai-career-coach/roadmap/status`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "enhanced-ai-career-coach", "roadmap", "status"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200 or 404\", function () {",
                                    "    pm.expect(pm.response.code).to.be.oneOf([200, 404]);",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                },
                {
                    "name": "Get Recommendations",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" }
                        ],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/enhanced-ai-career-coach/recommendations?type=all&limit=10`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "enhanced-ai-career-coach", "recommendations"],
                            "query": [
                                { "key": "type", "value": "all" },
                                { "key": "limit", "value": "10" }
                            ]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "var jsonData = pm.response.json();",
                                    "pm.test(\"Recommendations are array\", function () {",
                                    "    pm.expect(jsonData.data.recommendations).to.be.an('array');",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                },
                {
                    "name": "Create Journal Entry",
                    "request": {
                        "method": "POST",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" },
                            { "key": "Content-Type", "value": "application/json" }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": JSON.stringify({
                                "content": "I am testing the API to ensure everything works correctly before launch.",
                                "entry_date": new Date().toISOString(),
                                "tags": ["testing", "api"]
                            })
                        },
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/enhanced-ai-career-coach/journal`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "enhanced-ai-career-coach", "journal"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 201\", function () {",
                                    "    pm.response.to.have.status(201);",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "name": "3. Subscription & Usage",
            "item": [
                {
                    "name": "Get Subscription Usage",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" }
                        ],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/subscription/usage`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "subscription", "usage"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                }
            ]
        },
        {
            "name": "4. Notifications",
            "item": [
                {
                    "name": "Get Notifications",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Authorization", "value": "Bearer {{access_token}}" }
                        ],
                        "url": {
                            "raw": `${BASE_URL_VAR}/api/v1/notifications`,
                            "host": [BASE_URL_VAR],
                            "path": ["api", "v1", "notifications"]
                        }
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

const environment = {
    "name": "Linkivo Environment",
    "values": [
        {
            "key": "base_url",
            "value": "http://localhost:3000",
            "enabled": true
        },
        {
            "key": "access_token",
            "value": "PASTE_YOUR_CLERK_JWT_TOKEN_HERE",
            "enabled": true
        }
    ]
};

// Write files
fs.writeFileSync(path.join(__dirname, 'backend/tests/Linkivo_API_Tests.collection.json'), JSON.stringify(collection, null, 4));
fs.writeFileSync(path.join(__dirname, 'backend/tests/Linkivo_Environment.json'), JSON.stringify(environment, null, 4));

console.log("Postman collection and environment generated in backend/tests/");
