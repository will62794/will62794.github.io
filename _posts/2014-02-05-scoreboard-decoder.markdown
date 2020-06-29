---
layout: post
title:  "Reverse Engineering the MP-69D Scoreboard Controller"
year: 2013
categories: electronics hardware reverse-engineering
thumbnail: "scoreboardcover4.jpg"
---

During my first year at Cornell, I worked as a cameraman for the athletics department on the weekends, filming sports games so they could be streamed online. Basketball was one of the sports we covered, and we didn't really have a good way of overlaying statistics from the game (score, clock, fouls, etc.) onto our video stream in real time. I figured we could try to decode the signals coming out of the scoreboard controller box, the one that drove the main arena scoreboard, and convert them into a data format that we could then use to develop a graphic overlay on our live video stream. The  basketball stadium uses a Fairplay MP-69D scoreboard controller, which I reverse engineered by analyzing the raw signal on digital oscilloscope.

<img height="300px" src="/assets/fairplayweb.jpg" style="float:left;margin:4px;">

<img height="300px" src="/assets/scoreboard/signal1.jpg" style="float:left;margin:4px;">

<!-- ![alt text](/assets/scoreboard/purple1.jpg) -->


Once I worked out the nature of the protocol I was able to retrieve all types of scoreboard data. I used an Arduino Uno to process the raw signal. In conjunction I also originally developed a simple Python Tkinter application to run on a Raspberry Pi, that takes in serial data from the Arduino over USB and displays and creates a scoreboard graphic with live data overlaid on top of it. The Raspberry Pi has an HDMI and component video output, which could theoretically be fed into any video streaming application. I have been working on writing an additional Python script to integrate my hardware with NewTek's LiveText graphics system. LiveText is an application that is used with NewTek's high-end TriCaster video system, and can receive data dynamically from text files and/or database files to display in graphic templates. My goal is to use the Arduino to decode the signal coming from the MP-69D controller, send the serial data to a laptop, and have a Python script running that reads the incoming serial data, updates a static .txt file, and, in turn, updates LiveText (it can pull data from a .txt. file).

<img height="300px" src="/assets/scoreboard/shield1.jpg">

I eventually had a printed circuit board made up that plugs onto an Arduino and has 1/4" jack inputs right on the board for the Scoreboard and Timer outputs of the MP-69D. You can see the image of the board on an Arduino Uno below. [Here is the code](https://github.com/will62794/MP-69D-Scoreboard-Decoder) used to process the input and here is a [live demo](https://www.youtube.com/watch?v=JgkRyoUVtak) of the decoder in action.

<!-- ![alt text](/assets/scoreboard/shield1.jpg) -->



