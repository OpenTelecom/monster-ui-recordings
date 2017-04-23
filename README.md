## Monster UI Recordings

#### Installation:

1. Copy content of "src" directory to /your-project/src/
4. Add strings to /js/main.js
```javascript
require.config({
    paths: {
        'aws-sdk': 'js/vendor/aws-sdk.min',
        'remote-storage-adapter': 'js/lib/storage-adapter'
    },
});
```
3. Register app