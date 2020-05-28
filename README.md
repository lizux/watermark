# watermark-html

A simple library to draw watermark on HTML element with multiple line.

## Installation

```
$ npm install watermark-html
```

## Usage

### Import

ES6 module

```javascript
import Watermark from 'watermark-html';
```

CommonJS

```javascript
let Watermark = require('watermark-html');
```

### Setup

```javascript
Watermark.set({
	title: 'some text',
	subtitle: 'another text'
}）
```

| Param    | Type     | Description       | Extra                                           |
| -------- | -------- | ----------------- | ----------------------------------------------- |
| title    | {string} | main text         |
| subtitle | {string} | second text       |
| width    | {number} | stage width       | optional，default 240                           |
| height   | {number} | stage height      | optional，default 180                           |
| angle    | {number} | text rotate angle | optional，default -20，value range: [-180, 180] |
| fontSize | {string} | text font size    | optional，default '22px'                        |
| alpha    | {number} | text opcity       | optional，default 0.2，value range: [0.01, 1]  |

### Remove

```javascript
Watermark.remove();
```
