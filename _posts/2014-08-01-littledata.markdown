---
layout: post
title:  "LittleData: Exploring Aesthetic Modes of Data Visualization"
year: 2014
date: 2014-08-01 12:00:00
categories: electronics hardware software
thumbnail: "lab30/littledata_cover.jpg"
---

*This is a port of a project I wrote for [Tomorrow Lab](http://www.old.tomorrow-lab.com/lab30) in August 2014, where I worked as an electrical engineering intern.*

<img src="/assets/lab30/littledata_cover.jpg" alt="Three LittleData LED bars spelling out the word LittleData in a dark room">

The LittleData is a smart LED display consisting of three vertical bars that pull data from the web and project it. The conceptual core of the project began with exploring how to display minimal but meaningful bits of data (or "little" bits of data) in an intuitive and simple way. The LEDs would receive information and display various messages controllable from a website.

The general architectural concept is simple: a user logs into a web portal, configures specific options, sends a request to a Raspberry Pi web server, which in turn configures its hardware communication code to display the data as the user just configured it.

<div class="img-row">
  <a href="/assets/lab30/littledata_workshop.jpg"><img src="/assets/lab30/littledata_workshop.jpg" alt="Working on the LittleData displays at a desk in the Tomorrow Lab workshop"></a>
  <a href="/assets/lab30/littledata_webui.jpg"><img src="/assets/lab30/littledata_webui.jpg" alt="The LittleData web interface, showing display modes for colors, weather, Asana and the subway"></a>
</div>

To achieve the initial vision, we had to research the appropriate hardware to use and develop the controller software to complement it. There are a total of six [RGB LED matrices](http://www.adafruit.com/products/420), each vertical bar containing two, allowing for three 16x64 pixel bars. Driving 1024 RGB LEDs without hardware PWM support requires a reasonable amount of processing power, so we chose Teensy 3.1 Cortex M4 processor-based microcontrollers, which run at 72MHz. The Teensy 3.1 boards are similar in character to Arduino (and were programmed using the Arduino IDE), though they provide a considerably higher amount of processing horsepower. For more information on the library available for driving LED matrices with the Teensy boards, check out [PixelMatix](https://github.com/pixelmatix/SmartMatrix).

The frame that supports the three bars is a single piece of 3/16" aluminum, water jet cut to specifications (and CNC engraved with the logo).

<div class="img-row">
  <a href="/assets/lab30/littledata_frame.jpg"><img src="/assets/lab30/littledata_frame.jpg" alt="Close-up of the water jet cut aluminum frame holding two LED matrix panels"></a>
  <a href="/assets/lab30/littledata_frame_engraved.jpg"><img src="/assets/lab30/littledata_frame_engraved.jpg" alt="The aluminum frame with the LittleData logo CNC engraved into it"></a>
</div>

<div class="img-row">
  <a href="/assets/lab30/littledata_frames_psu.jpg"><img src="/assets/lab30/littledata_frames_psu.jpg" alt="Three aluminum frames with power supplies mounted, laid out on a workbench"></a>
  <a href="/assets/lab30/littledata_assembly.jpg"><img src="/assets/lab30/littledata_assembly.jpg" alt="Three assembled LED bars wired up with Meanwell power supplies on a workbench"></a>
</div>

The three displays are controlled from a single, web-connected Raspberry Pi. The Teensy 3.1 boards handle the hardware control at a low level, receiving display instructions via a customized USB serial communication protocol. For example, we could send a rectangle command to the Teensy over serial and it would draw a rectangle of the specified color and dimensions. With this system in place, the central control can handle other tasks while the Teensy processor is handling the drawing operations. The displays and processors are powered by three Meanwell 5 Volt / 5 Amp power supplies ([Meanwell RS-25-5](http://eu.mouser.com/ProductDetail/Mean-Well/RS-25-5/?qs=pqZ7J9Gt/mqXHOzlkOY2rg==)), mounted on the back of each LED bar. The LED matrices draw a maximum of about 4 Amps each, while the Raspberry Pi draws a maximum of about 1A, both at 5 Volts.

<div class="img-row">
  <a href="/assets/lab30/littledata_raspberrypi.jpg"><img src="/assets/lab30/littledata_raspberrypi.jpg" alt="A Raspberry Pi mounted on nylon standoffs to the aluminum frame"></a>
  <a href="/assets/lab30/littledata_teensy.jpg"><img src="/assets/lab30/littledata_teensy.jpg" alt="A Teensy 3.1 microcontroller board"></a>
</div>

## Final Results

Finally, we planned to implement a user-facing software interface, which would allow a user to both configure the information and the display with the LEDs. Using Raspberry Pi and the Flask framework, we created a lightweight web server. Because Flask, Teensy, the data APIs and other components of the electrical engineering are Python-based, it was fairly simple to route a web request to any Python function within the software. The existing display features the current weather in any location, as well as a color spectrum display that allows Tomorrow Lab to choose the mood by color and light association.

<div class="img-row">
  <a href="/assets/lab30/littledata_weather.jpg"><img src="/assets/lab30/littledata_weather.jpg" alt="The three LED bars displaying the weather, showing the day of the week and temperature"></a>
  <a href="/assets/lab30/littledata_display.jpg"><img src="/assets/lab30/littledata_display.jpg" alt="The three LED bars glowing in different colors in a dark room"></a>
</div>

<div class="img-row">
  <a href="/assets/lab30/littledata_display2.jpg"><img src="/assets/lab30/littledata_display2.jpg" alt="The three LED bars spelling LittleData, with one bar highlighted in yellow"></a>
</div>
