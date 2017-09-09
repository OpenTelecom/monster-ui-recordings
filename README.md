## Monster UI Recordings

#### Build installer
Install gulp with dependencies and run it
```bash
user@ubuntu:~/monster-ui-recordings$ npm install gulp && npm install gulp-zip && npm install gulp-clean && npm install gulp-replace && npm install gulp-modify && gulp
```
You can find the "recordings-installer.zip" in "dist" folder

#### Installation:

1. Upload file "recordings-installer.zip" to root directory of your project
2. Extract content of the "recordings-installer.zip" to root directory of your project
```bash
user@ubuntu:/var/www/html/monster-ui$ unzip recordings-installer.zip
```
3. With command line go to the extracted folder and install dependencies
```bash
user@ubuntu:/var/www/html/monster-ui$ cd recordings-installer
user@ubuntu:/var/www/html/monster-ui/recordins-installer$ npm install
```
5. Run installer script
```bash
user@ubuntu:/var/www/html/monster-ui/recordins-installer$ gulp
```
6. Remove installer folder
```bash
user@ubuntu:/var/www/html/monster-ui/recordins-installer$ cd ..
user@ubuntu:/var/www/html/monster-ui$ rm -rf recordings-installer && rm -rf recordings-installer.zip
```
7. Register Recordings app