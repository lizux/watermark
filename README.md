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
	subtitle: 'another text',
	width: 240,
	height: 180,
	angle: -20,
	fontSize: '22px',
	alpha: 0.08
 }）
 @param   {string}    title     main text
 @param   {string}    subtitle  second text（optional）
 @param   {number}    width     stage width（optional，default 240）
 @param   {number}    height    stage height（optional，default 180）
 @param   {number}    angle     text rotate angle（optional，default -20，value range: [-180, 180]）
 @param   {string}    fontSize  text font size（optional，default '22px'）
 @param   {number}    alpha     text opcity（optional，default 0.08）
```

### Remove

```javascript
Watermark.remove();
```
