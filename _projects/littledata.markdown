---
layout: project
title:  "LittleData"
subtitle: "Web Connected LED Display"
year:   2014
categories: electronics software web
thumbnail: "littledatacover3.jpg"
---


This was a project that I worked on as an electrical engineering intern at Tomorrow Lab during the summer of 2014. It was an idea inspired by some of the design work and research Tomorrow Lab had done previously. LittleData consists of three vertical LED bars that pull data from the web and display it in some way. 

![alt text](/assets/asana1.jpg)

The conceptual core of the project was about exploring how to display minimal bits of data ("little" bits of data) in an intuitive way. I was inspired by the simplicity and appeal (as I saw) of presenting very simple but meaningful elements of data in very simple ways. For example, Tomorrow Lab had previously prototyped a small balloon that expands or contracts in relation to your remaining hard disk space. It takes one piece of data (hard disk space) and presents it in a physical way; and in a way that is extremely intuitive to understand. 





Implementing the necessary hardware to achieve the initial vision was the most time consuming portion of the project, and I spent about 3 and a half weeks developing the controller software and hardware for the LED displays that I was using. There are six, 16x32 RGB LED matrices (www.adafruit.com/products/420) used in the project, and each vertical "bar" is made up of two of these, so there are three 16x64 pixel bars. 

![alt text](/assets/IMGP9743.jpg)

![alt text](/assets/littledatamatrix.jpeg)

![alt text](/assets/littledataframe1.jpg)



Driving 1024(16x64=1024 per bar) RGB LEDs requires a reasonable amount of processing power, especially since the matrices being used did not provide any hardware support for PWM. I used 3 Teensy 3.1 microcontrollers (www.adafruit.com/products/1625), which are based on the Cortex M4 processor, which runs at 72MHz. The Teensy boards are similar in character to Arduino boards (I programmed them using the Arduino IDE), but provide a considerably higher amount of processing horsepower. There is an excellent library that was written specifically for the purpose of driving LED matrices with the Teensy boards, provided by pixelmatix (https://github.com/pixelmatix/SmartMatrix), which I used and customized a bit.


#Photos

![alt text](/assets/weather1.jpg)

![alt text](/assets/gradients1.jpg)

![alt text](/assets/gradients2.jpg)
