# watermark

A simple library to draw watermark on HTML element with multiple line.



## Installation

```
$ npm install watermark-html
```

## Usage

```
import Watermark from 'watermark-html';

// init
Watermark.set({
	title: 'some str',
	subtitle: 'another str',
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

// remove
Watermark.remove();

```
