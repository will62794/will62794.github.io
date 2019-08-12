<!-- ---
layout: project
title:  "Sportzcast Encoder Control System"
subtitle: "Inegrating Sportzcast's Live Score service into Linux Video Encoding Boards"
year:   2015
tools: C, Python, Crossbar.io
categories: electronics design hardware C programming
thumbnail: "z3remote/sportzcast_cover.png"
---


Sportzcast is a company that provides real time score data feeds from high school and college sports games. They wanted to create a new product that used an existing embedded video encoder, and integrate their own score data streaming service into it. The customized device would allow users to stream video of their sports game with just a small Linux computer and the live graphics for their game would be generated using the data from Sportzcast's network. I worked on integrating Sportzcast's data service into the boards, developing a way to generate scoreboard graphics in real time, and allow the boards to be remotely controlled and operated via a web interface. The system uses a C library to generate real time graphics, Python on the board client, and a very cool framework called <a href="http://crossbar.io">Crossbar.io</a> for the backend control server.

<img src="/assets/z3remote/z3encoder1.jpg" width="58%">


Web Interface:
![alt text](/assets/z3remote/control.jpg)









 -->