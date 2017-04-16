## Monster UI Recordings

#### Installation:

1. Copy "recordings" folder to /apps/
2. Copy "aws-sdk.min.js" to /js/lib/
3. Add string to /js/main.js

```javascript
require.config({
    paths: {
        'aws-sdk': 'js/lib/aws-sdk',
    },
});
```